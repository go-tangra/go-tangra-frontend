<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { h, ref, computed, onMounted } from 'vue';

import { Page, useVbenDrawer, type VbenFormProps } from '@vben/common-ui';
import {
  LucideEye,
  LucideTrash,
  LucidePencil,
  LucideCopy,
  LucideLock,
  LucideFolder,
  LucideFolderOpen,
  LucideHistory,
  LucideKey,
  LucideUpload,
  LucideDownload,
} from '@vben/icons';

import {
  notification,
  Tree,
  Dropdown,
  Menu,
  MenuItem,
  Space,
  Button,
  Modal,
} from 'ant-design-vue';
import type { Key } from 'ant-design-vue/es/_util/type';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  type Secret,
  type FolderTreeNode,
  type ExportToBitwardenResponse,
} from '#/generated/api/modules/warden';
import { $t } from '#/locales';
import { useWardenFolderStore, useWardenSecretStore } from '#/stores';

import FolderDrawer from './folder-drawer.vue';
import SecretDrawer from '../secret/secret-drawer.vue';
import VersionDrawer from '../secret/version-drawer.vue';
import PermissionDrawer from '../permission/permission-drawer.vue';
import BitwardenImportModal from '../secret/bitwarden-import-modal.vue';

const folderStore = useWardenFolderStore();
const secretStore = useWardenSecretStore();

// Folder tree state
const folderTree = ref<FolderTreeNode[]>([]);
const selectedFolderId = ref<string | undefined>(undefined);
const expandedKeys = ref<string[]>([]);
const loadingTree = ref(false);


// Convert folder tree to ant-design tree data format
interface TreeNode {
  key: string;
  title: string;
  children?: TreeNode[];
  isLeaf?: boolean;
  raw: FolderTreeNode;
}

function convertToTreeData(nodes: FolderTreeNode[]): TreeNode[] {
  return nodes.map((node) => ({
    key: node.folder?.id ?? '',
    title: node.folder?.name ?? '',
    children: node.children ? convertToTreeData(node.children) : undefined,
    isLeaf: !node.children || node.children.length === 0,
    raw: node,
  }));
}

const treeData = computed(() => convertToTreeData(folderTree.value));

// Load folder tree
async function loadFolderTree() {
  loadingTree.value = true;
  try {
    const resp = await folderStore.getFolderTree(undefined, undefined, true);
    folderTree.value = (resp.roots ?? []) as FolderTreeNode[];
  } catch (e) {
    console.error('Failed to load folder tree:', e);
    notification.error({ message: $t('ui.notification.load_failed') });
  } finally {
    loadingTree.value = false;
  }
}

onMounted(() => {
  loadFolderTree();
});

// Handle folder selection
function handleFolderSelect(keys: Key[]) {
  if (keys.length > 0) {
    selectedFolderId.value = String(keys[0]);
    gridApi.reload();
  } else {
    selectedFolderId.value = undefined;
    gridApi.reload();
  }
}

// Secret list
const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  submitOnEnter: true,
  schema: [
    {
      component: 'Input',
      fieldName: 'nameFilter',
      label: $t('warden.page.secret.name'),
      componentProps: {
        placeholder: $t('ui.placeholder.input'),
        allowClear: true,
      },
    },
  ],
};

const gridOptions: VxeGridProps<Secret> = {
  height: 'auto',
  stripe: false,
  toolbarConfig: {
    custom: true,
    export: true,
    import: false,
    refresh: true,
    zoom: true,
  },
  exportConfig: {},
  rowConfig: {
    isHover: true,
  },
  pagerConfig: {
    enabled: true,
    pageSize: 20,
    pageSizes: [10, 20, 50, 100],
  },

  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const resp = await secretStore.listSecrets(
          { page: page.currentPage, pageSize: page.pageSize },
          {
            folderId: selectedFolderId.value,
            nameFilter: formValues?.nameFilter,
          },
        );
        return {
          items: resp.secrets ?? [],
          total: resp.total ?? 0,
        };
      },
    },
  },

  columns: [
    { title: $t('ui.table.seq'), type: 'seq', width: 50 },
    {
      title: $t('warden.page.secret.name'),
      field: 'name',
      minWidth: 150,
      slots: { default: 'name' },
    },
    { title: $t('warden.page.secret.username'), field: 'username', width: 150 },
    { title: $t('warden.page.secret.hostUrl'), field: 'host_url', minWidth: 200 },
    {
      title: $t('warden.page.secret.currentVersion'),
      field: 'current_version',
      width: 100,
    },
    {
      title: $t('ui.table.createdAt'),
      field: 'create_time',
      formatter: 'formatDateTime',
      width: 160,
    },
    {
      title: $t('ui.table.action'),
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      width: 180,
    },
  ],
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions, formOptions });

// Drawer states
const drawerMode = ref<'create' | 'edit' | 'view'>('view');
const folderDrawerMode = ref<'create' | 'edit'>('create');

const [SecretDrawerComponent, secretDrawerApi] = useVbenDrawer({
  connectedComponent: SecretDrawer,
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      gridApi.reload();
    }
  },
});

const [FolderDrawerComponent, folderDrawerApi] = useVbenDrawer({
  connectedComponent: FolderDrawer,
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      loadFolderTree();
    }
  },
});

const [VersionDrawerComponent, versionDrawerApi] = useVbenDrawer({
  connectedComponent: VersionDrawer,
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      gridApi.reload();
    }
  },
});

const [PermissionDrawerComponent, permissionDrawerApi] = useVbenDrawer({
  connectedComponent: PermissionDrawer,
});

// Bitwarden Import Modal ref
const bitwardenImportModalRef = ref<InstanceType<typeof BitwardenImportModal> | null>(null);

// Secret operations
function openSecretDrawer(
  row: Secret,
  mode: 'create' | 'edit' | 'view',
) {
  drawerMode.value = mode;
  secretDrawerApi.setData({ row, mode, folderId: selectedFolderId.value });
  secretDrawerApi.open();
}

function handleViewSecret(row: Secret) {
  openSecretDrawer(row, 'view');
}

function handleEditSecret(row: Secret) {
  openSecretDrawer(row, 'edit');
}

function handleCreateSecret() {
  openSecretDrawer({} as Secret, 'create');
}

async function handleDeleteSecret(row: Secret) {
  if (!row.id) return;
  try {
    await secretStore.deleteSecret(row.id);
    notification.success({ message: $t('warden.page.secret.deleteSuccess') });
    await gridApi.reload();
  } catch {
    notification.error({ message: $t('ui.notification.delete_failed') });
  }
}

async function handleCopyPassword(row: Secret) {
  if (!row.id) return;
  try {
    const resp = await secretStore.getSecretPassword(row.id);
    await navigator.clipboard.writeText(resp.password ?? '');
    notification.success({ message: $t('warden.page.secret.passwordCopied') });
  } catch {
    notification.error({ message: $t('ui.notification.operation_failed') });
  }
}

function handleViewVersions(row: Secret) {
  versionDrawerApi.setData({ secret: row });
  versionDrawerApi.open();
}

function handleViewPermissions(row: Secret) {
  permissionDrawerApi.setData({
    resourceType: 'RESOURCE_TYPE_SECRET',
    resourceId: row.id,
    resourceName: row.name,
  });
  permissionDrawerApi.open();
}

// Folder operations
function handleCreateFolder(parentId?: string) {
  folderDrawerMode.value = 'create';
  folderDrawerApi.setData({ mode: 'create', parentId });
  folderDrawerApi.open();
}

function handleEditFolder(node: TreeNode) {
  folderDrawerMode.value = 'edit';
  folderDrawerApi.setData({ mode: 'edit', folder: node.raw.folder });
  folderDrawerApi.open();
}

async function handleDeleteFolder(node: TreeNode) {
  const folder = node.raw.folder;
  if (!folder?.id) return;

  const hasChildren =
    (folder.secretCount ?? 0) > 0 || (folder.subfolderCount ?? 0) > 0;

  Modal.confirm({
    title: $t('warden.page.folder.delete'),
    content: hasChildren
      ? $t('warden.page.folder.confirmDeleteForce')
      : $t('warden.page.folder.confirmDelete'),
    okText: $t('ui.button.ok'),
    cancelText: $t('ui.button.cancel'),
    onOk: async () => {
      try {
        await folderStore.deleteFolder(folder.id!, hasChildren);
        notification.success({
          message: $t('warden.page.folder.deleteSuccess'),
        });
        if (selectedFolderId.value === folder.id) {
          selectedFolderId.value = undefined;
        }
        await loadFolderTree();
        await gridApi.reload();
      } catch {
        notification.error({ message: $t('ui.notification.delete_failed') });
      }
    },
  });
}

function handleViewFolderPermissions(node: TreeNode) {
  permissionDrawerApi.setData({
    resourceType: 'RESOURCE_TYPE_FOLDER',
    resourceId: node.raw.folder?.id,
    resourceName: node.raw.folder?.name,
  });
  permissionDrawerApi.open();
}

// Bitwarden Import/Export
function handleOpenImportModal() {
  bitwardenImportModalRef.value?.open();
}

async function handleExport() {
  try {
    const result = await secretStore.exportToBitwarden({
      folderId: selectedFolderId.value,
      includeSubfolders: true,
    }) as ExportToBitwardenResponse;

    // Create and download the file
    const blob = new Blob([result.jsonData ?? ''], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.suggestedFilename ?? 'warden-export.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    notification.success({
      message: $t('warden.page.bitwarden.exportSuccess'),
      description: `${result.itemsExported} ${$t('warden.page.bitwarden.itemsExported')}`,
    });
  } catch (error: any) {
    notification.error({
      message: $t('warden.page.bitwarden.exportFailed'),
      description: error.message,
    });
  }
}

function handleImportSuccess() {
  loadFolderTree();
  gridApi.reload();
}

// Get selected folder name
const selectedFolderName = computed(() => {
  if (!selectedFolderId.value) return $t('warden.page.folder.rootFolder');
  const findFolder = (
    nodes: FolderTreeNode[],
  ): string | undefined => {
    for (const node of nodes) {
      if (node.folder?.id === selectedFolderId.value) {
        return node.folder?.name;
      }
      if (node.children) {
        const found = findFolder(node.children);
        if (found) return found;
      }
    }
    return undefined;
  };
  return findFolder(folderTree.value) ?? $t('warden.page.folder.rootFolder');
});
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full gap-4">
      <!-- Folder Tree Panel -->
      <div class="w-64 shrink-0 overflow-auto rounded border bg-card p-4">
        <div class="mb-4 flex items-center justify-between">
          <span class="font-semibold">{{ $t('warden.page.folder.title') }}</span>
          <Button
            type="primary"
            size="small"
            @click="handleCreateFolder(selectedFolderId)"
          >
            {{ $t('ui.button.create', { moduleName: '' }) }}
          </Button>
        </div>

        <!-- Root folder item -->
        <div
          class="mb-2 flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-accent"
          :class="{ 'bg-accent': !selectedFolderId }"
          @click="
            selectedFolderId = undefined;
            gridApi.reload();
          "
        >
          <component :is="LucideFolderOpen" class="size-4" />
          <span>{{ $t('warden.page.folder.rootFolder') }}</span>
        </div>

        <Tree
          v-if="treeData.length > 0"
          v-model:expanded-keys="expandedKeys"
          :tree-data="treeData"
          :selectable="true"
          :selected-keys="selectedFolderId ? [selectedFolderId] : []"
          block-node
          @select="handleFolderSelect"
        >
          <template #title="{ title, key, raw }">
            <Dropdown :trigger="['contextmenu']">
              <div class="flex items-center gap-2">
                <component
                  :is="expandedKeys.includes(key) ? LucideFolderOpen : LucideFolder"
                  class="size-4"
                />
                <span>{{ title }}</span>
                <span v-if="raw?.folder?.secretCount" class="text-muted-foreground text-xs">
                  ({{ raw.folder.secretCount }})
                </span>
              </div>
              <template #overlay>
                <Menu>
                  <MenuItem key="create" @click="handleCreateFolder(key)">
                    {{ $t('warden.page.folder.create') }}
                  </MenuItem>
                  <MenuItem key="edit" @click="handleEditFolder({ key, title, raw })">
                    {{ $t('warden.page.folder.edit') }}
                  </MenuItem>
                  <MenuItem
                    key="permissions"
                    @click="handleViewFolderPermissions({ key, title, raw })"
                  >
                    {{ $t('warden.page.permission.title') }}
                  </MenuItem>
                  <MenuItem
                    key="delete"
                    danger
                    @click="handleDeleteFolder({ key, title, raw })"
                  >
                    {{ $t('warden.page.folder.delete') }}
                  </MenuItem>
                </Menu>
              </template>
            </Dropdown>
          </template>
        </Tree>

        <div v-else-if="!loadingTree" class="text-muted-foreground text-center text-sm">
          {{ $t('ui.text.no_data') }}
        </div>
      </div>

      <!-- Secret List Panel -->
      <div class="flex-1 overflow-hidden">
        <Grid :table-title="`${$t('warden.page.secret.title')} - ${selectedFolderName}`">
          <template #toolbar-tools>
            <Space>
              <Button @click="handleOpenImportModal">
                <template #icon>
                  <LucideUpload class="size-4" />
                </template>
                {{ $t('warden.page.bitwarden.import') }}
              </Button>
              <Button @click="handleExport">
                <template #icon>
                  <LucideDownload class="size-4" />
                </template>
                {{ $t('warden.page.bitwarden.export') }}
              </Button>
              <Button type="primary" @click="handleCreateSecret">
                {{ $t('warden.page.secret.create') }}
              </Button>
            </Space>
          </template>
          <template #name="{ row }">
            <div class="flex items-center gap-2">
              <component :is="LucideLock" class="size-4" />
              <span>{{ row.name }}</span>
            </div>
          </template>
          <template #action="{ row }">
            <Space>
              <Button
                type="link"
                size="small"
                :icon="h(LucideEye)"
                :title="$t('ui.button.view')"
                @click.stop="handleViewSecret(row)"
              />
              <Button
                type="link"
                size="small"
                :icon="h(LucideCopy)"
                :title="$t('warden.page.secret.copyPassword')"
                @click.stop="handleCopyPassword(row)"
              />
              <Button
                type="link"
                size="small"
                :icon="h(LucideHistory)"
                :title="$t('warden.page.secret.versionHistory')"
                @click.stop="handleViewVersions(row)"
              />
              <Button
                type="link"
                size="small"
                :icon="h(LucidePencil)"
                :title="$t('ui.button.edit')"
                @click.stop="handleEditSecret(row)"
              />
              <Button
                type="link"
                size="small"
                :icon="h(LucideKey)"
                :title="$t('warden.page.permission.title')"
                @click.stop="handleViewPermissions(row)"
              />
              <a-popconfirm
                :cancel-text="$t('ui.button.cancel')"
                :ok-text="$t('ui.button.ok')"
                :title="$t('warden.page.secret.confirmDelete')"
                @confirm="handleDeleteSecret(row)"
              >
                <Button
                  danger
                  type="link"
                  size="small"
                  :icon="h(LucideTrash)"
                  :title="$t('ui.button.delete', { moduleName: '' })"
                />
              </a-popconfirm>
            </Space>
          </template>
        </Grid>
      </div>
    </div>

    <SecretDrawerComponent />
    <FolderDrawerComponent />
    <VersionDrawerComponent />
    <PermissionDrawerComponent />
    <BitwardenImportModal
      ref="bitwardenImportModalRef"
      :folder-id="selectedFolderId"
      @success="handleImportSuccess"
    />
  </Page>
</template>
