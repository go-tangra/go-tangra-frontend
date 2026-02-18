<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { h } from 'vue';

import { Page, useVbenDrawer, type VbenFormProps } from '@vben/common-ui';
import { LucideEye, LucideTrash, LucideRotateCcw } from '@vben/icons';

import { notification, Space, Button, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { $t } from '#/locales';
import { useBackupModuleStore } from '#/stores';
import type { BackupInfo } from '#/generated/api/modules/backup/services';

import BackupDrawer from './backup-drawer.vue';
import CreateDrawer from './create-drawer.vue';
import RestoreDrawer from './restore-drawer.vue';

const backupStore = useBackupModuleStore();

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  submitOnEnter: true,
  schema: [
    {
      component: 'Input',
      fieldName: 'module_id',
      label: $t('backup.page.module.filterByModule'),
      componentProps: {
        placeholder: $t('backup.page.module.moduleIdPlaceholder'),
        allowClear: true,
      },
    },
  ],
};

function statusColor(status: string) {
  switch (status) {
    case 'completed': {
      return 'green';
    }
    case 'failed': {
      return 'red';
    }
    case 'partial': {
      return 'orange';
    }
    default: {
      return 'default';
    }
  }
}

function formatBytes(bytes: number | string): string {
  const n = Number(bytes);
  if (!n || n === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / 1024 ** i).toFixed(1)} ${sizes[i]}`;
}

const gridOptions: VxeGridProps<BackupInfo> = {
  height: 'auto',
  stripe: false,
  toolbarConfig: {
    custom: true,
    export: false,
    import: false,
    refresh: true,
    zoom: true,
  },
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
        const resp = await backupStore.listBackups(
          {
            page: page.currentPage,
            pageSize: page.pageSize,
          },
          {
            module_id: formValues?.module_id,
          },
        );
        return {
          items: resp.backups ?? [],
          total: resp.total ?? 0,
        };
      },
    },
  },

  columns: [
    { title: $t('ui.table.seq'), type: 'seq', width: 50 },
    {
      title: $t('backup.page.module.moduleId'),
      field: 'moduleId',
      width: 120,
      slots: { default: 'moduleId' },
    },
    {
      title: $t('backup.page.module.description'),
      field: 'description',
      minWidth: 200,
    },
    {
      title: $t('backup.page.module.status'),
      field: 'status',
      width: 110,
      slots: { default: 'status' },
    },
    {
      title: $t('backup.page.module.sizeBytes'),
      field: 'sizeBytes',
      width: 100,
      slots: { default: 'sizeBytes' },
    },
    {
      title: $t('backup.page.module.version'),
      field: 'version',
      width: 80,
    },
    {
      title: $t('backup.page.module.createdBy'),
      field: 'createdBy',
      width: 120,
    },
    {
      title: $t('backup.page.module.createdAt'),
      field: 'createdAt',
      width: 160,
      sortable: true,
    },
    {
      title: $t('ui.table.action'),
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      width: 150,
    },
  ],
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions, formOptions });

const [BackupDrawerComponent, backupDrawerApi] = useVbenDrawer({
  connectedComponent: BackupDrawer,
});

const [CreateDrawerComponent, createDrawerApi] = useVbenDrawer({
  connectedComponent: CreateDrawer,
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      gridApi.reload();
    }
  },
});

const [RestoreDrawerComponent, restoreDrawerApi] = useVbenDrawer({
  connectedComponent: RestoreDrawer,
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      gridApi.reload();
    }
  },
});

function handleView(row: BackupInfo) {
  backupDrawerApi.setData({ row });
  backupDrawerApi.open();
}

function handleCreate() {
  createDrawerApi.setData({});
  createDrawerApi.open();
}

function handleRestore(row: BackupInfo) {
  restoreDrawerApi.setData({ row });
  restoreDrawerApi.open();
}

async function handleDelete(row: BackupInfo) {
  if (!row.id) return;
  try {
    await backupStore.deleteBackup(row.id);
    notification.success({
      message: $t('backup.page.module.deleteSuccess'),
    });
    await gridApi.reload();
  } catch {
    notification.error({ message: $t('ui.notification.delete_failed') });
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid :table-title="$t('backup.page.module.title')">
      <template #toolbar-tools>
        <Button class="mr-2" type="primary" @click="handleCreate">
          {{ $t('backup.page.module.create') }}
        </Button>
      </template>
      <template #moduleId="{ row }">
        <Tag color="blue">{{ row.moduleId }}</Tag>
      </template>
      <template #status="{ row }">
        <Tag :color="statusColor(row.status)">{{ row.status }}</Tag>
      </template>
      <template #sizeBytes="{ row }">
        {{ formatBytes(row.sizeBytes) }}
      </template>
      <template #action="{ row }">
        <Space>
          <Button
            type="link"
            size="small"
            :icon="h(LucideEye)"
            :title="$t('backup.page.module.view')"
            @click.stop="handleView(row)"
          />
          <Button
            type="link"
            size="small"
            :icon="h(LucideRotateCcw)"
            :title="$t('backup.page.module.restore')"
            :disabled="row.status !== 'completed'"
            @click.stop="handleRestore(row)"
          />
          <a-popconfirm
            :cancel-text="$t('ui.button.cancel')"
            :ok-text="$t('ui.button.ok')"
            :title="$t('backup.page.module.confirmDelete')"
            @confirm="handleDelete(row)"
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

    <BackupDrawerComponent />
    <CreateDrawerComponent />
    <RestoreDrawerComponent />
  </Page>
</template>
