<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { h, ref, computed, onMounted } from 'vue';

import { Page, useVbenDrawer, type VbenFormProps } from '@vben/common-ui';
import {
  LucideEye,
  LucideTrash,
  LucidePencil,
  LucideDownload,
  LucideFile,
  LucideFolder,
  LucideFolderOpen,
  LucideKey,
  LucideUpload,
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
  Tag,
} from 'ant-design-vue';
import type { Key } from 'ant-design-vue/es/_util/type';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  type paperlessservicev1_Document,
} from '#/generated/api/admin/service/v1';
import { $t } from '#/locales';
import { usePaperlessCategoryStore, usePaperlessDocumentStore } from '#/stores';

import DocumentDrawer from './document-drawer.vue';
import DocumentPreviewModal from './document-preview-modal.vue';
import PermissionDrawer from '../permission/permission-drawer.vue';
import CategoryDrawer from '../category/category-drawer.vue';

const categoryStore = usePaperlessCategoryStore();
const documentStore = usePaperlessDocumentStore();

// Category tree node interface (matches store return type)
interface CategoryTreeNode {
  category?: {
    id?: string;
    name?: string;
    documentCount?: number;
    subcategoryCount?: number;
  };
  children?: CategoryTreeNode[];
}

// Category tree state
const categoryTree = ref<CategoryTreeNode[]>([]);
const selectedCategoryId = ref<string | undefined>(undefined);
const expandedKeys = ref<string[]>([]);
const loadingTree = ref(false);

// Convert category tree to ant-design tree data format
interface TreeNode {
  key: string;
  title: string;
  children?: TreeNode[];
  isLeaf?: boolean;
  raw: CategoryTreeNode;
}

function convertToTreeData(nodes: CategoryTreeNode[]): TreeNode[] {
  return nodes.map((node) => ({
    key: node.category?.id ?? '',
    title: node.category?.name ?? '',
    children: node.children ? convertToTreeData(node.children) : undefined,
    isLeaf: !node.children || node.children.length === 0,
    raw: node,
  }));
}

const treeData = computed(() => convertToTreeData(categoryTree.value));

// Load category tree
async function loadCategoryTree() {
  loadingTree.value = true;
  try {
    const resp = await categoryStore.getCategoryTree(undefined, undefined, true);
    categoryTree.value = resp.roots ?? resp.nodes ?? [];
  } catch (e) {
    console.error('Failed to load category tree:', e);
    notification.error({ message: $t('ui.notification.load_failed') });
  } finally {
    loadingTree.value = false;
  }
}

onMounted(() => {
  loadCategoryTree();
});

// Handle category selection
function handleCategorySelect(keys: Key[]) {
  if (keys.length > 0) {
    selectedCategoryId.value = String(keys[0]);
    gridApi.reload();
  } else {
    selectedCategoryId.value = undefined;
    gridApi.reload();
  }
}

// Document list
const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  submitOnEnter: true,
  schema: [
    {
      component: 'Input',
      fieldName: 'query',
      label: $t('paperless.page.search.title'),
      componentProps: {
        placeholder: $t('paperless.page.search.placeholder'),
        allowClear: true,
      },
    },
  ],
};

const gridOptions: VxeGridProps<paperlessservicev1_Document> = {
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
        const paging = { page: page.currentPage, pageSize: page.pageSize };
        const searchQuery = formValues?.query?.trim();

        if (searchQuery) {
          const resp = await documentStore.searchDocuments(
            searchQuery,
            paging,
            {
              categoryId: selectedCategoryId.value,
              includeSubcategories: true,
            },
          );
          return {
            items: resp.documents ?? resp.items ?? [],
            total: resp.total ?? 0,
          };
        }

        const resp = await documentStore.listDocuments(paging, {
          categoryId: selectedCategoryId.value,
        });
        return {
          items: resp.documents ?? resp.items ?? [],
          total: resp.total ?? 0,
        };
      },
    },
  },

  columns: [
    { title: $t('ui.table.seq'), type: 'seq', width: 50 },
    {
      title: $t('paperless.page.document.name'),
      field: 'name',
      minWidth: 200,
      slots: { default: 'name' },
    },
    { title: $t('paperless.page.document.fileName'), field: 'fileName', width: 150 },
    {
      title: $t('paperless.page.document.fileSize'),
      field: 'fileSize',
      width: 100,
      formatter: ({ cellValue }) => formatFileSize(cellValue),
    },
    {
      title: $t('paperless.page.document.source'),
      field: 'source',
      width: 100,
      slots: { default: 'source' },
    },
    {
      title: $t('paperless.page.document.status'),
      field: 'status',
      width: 100,
      slots: { default: 'status' },
    },
    {
      title: $t('ui.table.createdAt'),
      field: 'createTime',
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

function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return '-';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions, formOptions });

// Preview modal state
const previewVisible = ref(false);
const previewDocumentId = ref<string>();

// Drawer states
const drawerMode = ref<'create' | 'edit' | 'view'>('view');
const categoryDrawerMode = ref<'create' | 'edit'>('create');

const [DocumentDrawerComponent, documentDrawerApi] = useVbenDrawer({
  connectedComponent: DocumentDrawer,
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      gridApi.reload();
    }
  },
});

const [CategoryDrawerComponent, categoryDrawerApi] = useVbenDrawer({
  connectedComponent: CategoryDrawer,
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      loadCategoryTree();
    }
  },
});

const [PermissionDrawerComponent, permissionDrawerApi] = useVbenDrawer({
  connectedComponent: PermissionDrawer,
});

// Document operations
function openDocumentDrawer(
  row: paperlessservicev1_Document,
  mode: 'create' | 'edit' | 'view',
) {
  drawerMode.value = mode;
  documentDrawerApi.setData({ row, mode, categoryId: selectedCategoryId.value });
  documentDrawerApi.open();
}

function handleViewDocument(row: paperlessservicev1_Document) {
  previewDocumentId.value = row.id;
  previewVisible.value = true;
}

function handleEditDocument(row: paperlessservicev1_Document) {
  openDocumentDrawer(row, 'edit');
}

function handleCreateDocument() {
  openDocumentDrawer({} as paperlessservicev1_Document, 'create');
}

async function handleDeleteDocument(row: paperlessservicev1_Document) {
  if (!row.id) return;
  try {
    // If document is already soft-deleted, permanently delete it
    const permanent = row.status === 'DOCUMENT_STATUS_DELETED';
    await documentStore.deleteDocument(row.id, permanent);
    notification.success({ message: $t('paperless.page.document.deleteSuccess') });
    await gridApi.reload();
  } catch {
    notification.error({ message: $t('ui.notification.delete_failed') });
  }
}

async function handleDownloadDocument(row: paperlessservicev1_Document) {
  if (!row.id) return;
  try {
    const resp = await documentStore.downloadDocument(row.id);
    if (resp.content) {
      const byteCharacters = atob(resp.content);
      const byteNumbers = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteNumbers], {
        type: resp.mimeType || 'application/octet-stream',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = resp.fileName || row.fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      notification.success({ message: $t('paperless.page.document.downloadStarted') });
    }
  } catch {
    notification.error({ message: $t('ui.notification.operation_failed') });
  }
}

function handleViewPermissions(row: paperlessservicev1_Document) {
  permissionDrawerApi.setData({
    resourceType: 'RESOURCE_TYPE_DOCUMENT',
    resourceId: row.id,
    resourceName: row.name,
  });
  permissionDrawerApi.open();
}

// Category operations
function handleCreateCategory(parentId?: string) {
  categoryDrawerMode.value = 'create';
  categoryDrawerApi.setData({ mode: 'create', parentId });
  categoryDrawerApi.open();
}

function handleEditCategory(node: TreeNode) {
  categoryDrawerMode.value = 'edit';
  categoryDrawerApi.setData({ mode: 'edit', category: node.raw.category });
  categoryDrawerApi.open();
}

async function handleDeleteCategory(node: TreeNode) {
  const category = node.raw.category;
  if (!category?.id) return;

  const hasChildren =
    (category.documentCount ?? 0) > 0 || (category.subcategoryCount ?? 0) > 0;

  Modal.confirm({
    title: $t('paperless.page.category.delete'),
    content: hasChildren
      ? $t('paperless.page.category.confirmDeleteForce')
      : $t('paperless.page.category.confirmDelete'),
    okText: $t('ui.button.ok'),
    cancelText: $t('ui.button.cancel'),
    onOk: async () => {
      try {
        await categoryStore.deleteCategory(category.id!, hasChildren);
        notification.success({
          message: $t('paperless.page.category.deleteSuccess'),
        });
        if (selectedCategoryId.value === category.id) {
          selectedCategoryId.value = undefined;
        }
        await loadCategoryTree();
        await gridApi.reload();
      } catch {
        notification.error({ message: $t('ui.notification.delete_failed') });
      }
    },
  });
}

function handleViewCategoryPermissions(node: TreeNode) {
  permissionDrawerApi.setData({
    resourceType: 'RESOURCE_TYPE_CATEGORY',
    resourceId: node.raw.category?.id,
    resourceName: node.raw.category?.name,
  });
  permissionDrawerApi.open();
}

// Get selected category name
const selectedCategoryName = computed(() => {
  if (!selectedCategoryId.value) return $t('paperless.page.category.rootCategory');
  const findCategory = (
    nodes: CategoryTreeNode[],
  ): string | undefined => {
    for (const node of nodes) {
      if (node.category?.id === selectedCategoryId.value) {
        return node.category?.name;
      }
      if (node.children) {
        const found = findCategory(node.children);
        if (found) return found;
      }
    }
    return undefined;
  };
  return findCategory(categoryTree.value) ?? $t('paperless.page.category.rootCategory');
});

// Source display
function getSourceColor(source: string | undefined): string {
  switch (source) {
    case 'DOCUMENT_SOURCE_UPLOAD':
      return 'blue';
    case 'DOCUMENT_SOURCE_EMAIL':
      return 'green';
    default:
      return 'default';
  }
}

function getSourceLabel(source: string | undefined): string {
  switch (source) {
    case 'DOCUMENT_SOURCE_UPLOAD':
      return $t('paperless.page.document.sourceUpload');
    case 'DOCUMENT_SOURCE_EMAIL':
      return $t('paperless.page.document.sourceEmail');
    default:
      return '-';
  }
}

// Status display
function getStatusColor(status: string | undefined): string {
  switch (status) {
    case 'DOCUMENT_STATUS_ACTIVE':
      return 'green';
    case 'DOCUMENT_STATUS_ARCHIVED':
      return 'orange';
    case 'DOCUMENT_STATUS_DELETED':
      return 'red';
    default:
      return 'default';
  }
}

function getStatusLabel(status: string | undefined): string {
  switch (status) {
    case 'DOCUMENT_STATUS_ACTIVE':
      return $t('paperless.page.document.statusActive');
    case 'DOCUMENT_STATUS_ARCHIVED':
      return $t('paperless.page.document.statusArchived');
    case 'DOCUMENT_STATUS_DELETED':
      return $t('paperless.page.document.statusDeleted');
    default:
      return '-';
  }
}
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full gap-4">
      <!-- Category Tree Panel -->
      <div class="w-64 shrink-0 overflow-auto rounded border bg-card p-4">
        <div class="mb-4 flex items-center justify-between">
          <span class="font-semibold">{{ $t('paperless.page.category.title') }}</span>
          <Button
            type="primary"
            size="small"
            @click="handleCreateCategory(selectedCategoryId)"
          >
            {{ $t('ui.button.create', { moduleName: '' }) }}
          </Button>
        </div>

        <!-- Root category item -->
        <div
          class="mb-2 flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-accent"
          :class="{ 'bg-accent': !selectedCategoryId }"
          @click="
            selectedCategoryId = undefined;
            gridApi.reload();
          "
        >
          <component :is="LucideFolderOpen" class="size-4" />
          <span>{{ $t('paperless.page.category.rootCategory') }}</span>
        </div>

        <Tree
          v-if="treeData.length > 0"
          v-model:expanded-keys="expandedKeys"
          :tree-data="treeData"
          :selectable="true"
          :selected-keys="selectedCategoryId ? [selectedCategoryId] : []"
          block-node
          @select="handleCategorySelect"
        >
          <template #title="{ title, key, raw }">
            <Dropdown :trigger="['contextmenu']">
              <div class="flex items-center gap-2">
                <component
                  :is="expandedKeys.includes(key) ? LucideFolderOpen : LucideFolder"
                  class="size-4"
                />
                <span>{{ title }}</span>
                <span v-if="raw?.category?.documentCount" class="text-muted-foreground text-xs">
                  ({{ raw.category.documentCount }})
                </span>
              </div>
              <template #overlay>
                <Menu>
                  <MenuItem key="create" @click="handleCreateCategory(key)">
                    {{ $t('paperless.page.category.create') }}
                  </MenuItem>
                  <MenuItem key="edit" @click="handleEditCategory({ key, title, raw })">
                    {{ $t('paperless.page.category.edit') }}
                  </MenuItem>
                  <MenuItem
                    key="permissions"
                    @click="handleViewCategoryPermissions({ key, title, raw })"
                  >
                    {{ $t('paperless.page.permission.title') }}
                  </MenuItem>
                  <MenuItem
                    key="delete"
                    danger
                    @click="handleDeleteCategory({ key, title, raw })"
                  >
                    {{ $t('paperless.page.category.delete') }}
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

      <!-- Document List Panel -->
      <div class="flex-1 overflow-hidden">
        <Grid :table-title="`${$t('paperless.page.document.title')} - ${selectedCategoryName}`">
          <template #toolbar-tools>
            <Space>
              <Button type="primary" @click="handleCreateDocument">
                {{ $t('paperless.page.document.upload') }}
              </Button>
            </Space>
          </template>
          <template #name="{ row }">
            <div class="flex items-center gap-2">
              <component :is="LucideFile" class="size-4" />
              <span>{{ row.name }}</span>
            </div>
          </template>
          <template #source="{ row }">
            <Tag :color="getSourceColor(row.source)">
              {{ getSourceLabel(row.source) }}
            </Tag>
          </template>
          <template #status="{ row }">
            <Tag :color="getStatusColor(row.status)">
              {{ getStatusLabel(row.status) }}
            </Tag>
          </template>
          <template #action="{ row }">
            <Space>
              <Button
                type="link"
                size="small"
                :icon="h(LucideEye)"
                :title="$t('ui.button.view')"
                @click.stop="handleViewDocument(row)"
              />
              <Button
                type="link"
                size="small"
                :icon="h(LucideDownload)"
                :title="$t('paperless.page.document.download')"
                @click.stop="handleDownloadDocument(row)"
              />
              <Button
                type="link"
                size="small"
                :icon="h(LucidePencil)"
                :title="$t('ui.button.edit')"
                @click.stop="handleEditDocument(row)"
              />
              <Button
                type="link"
                size="small"
                :icon="h(LucideKey)"
                :title="$t('paperless.page.permission.title')"
                @click.stop="handleViewPermissions(row)"
              />
              <a-popconfirm
                :cancel-text="$t('ui.button.cancel')"
                :ok-text="$t('ui.button.ok')"
                :title="$t('paperless.page.document.confirmDelete')"
                @confirm="handleDeleteDocument(row)"
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

    <DocumentDrawerComponent />
    <CategoryDrawerComponent />
    <PermissionDrawerComponent />
    <DocumentPreviewModal
      v-model:open="previewVisible"
      :document-id="previewDocumentId"
    />
  </Page>
</template>
