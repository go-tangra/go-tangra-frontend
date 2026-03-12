<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { h } from 'vue';

import { Page, useVbenDrawer, type VbenFormProps } from '@vben/common-ui';
import { LucideFilePenLine, LucideTrash2 } from '@vben/icons';

import { notification } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { type NotificationChannel } from '#/generated/api/modules/notification/services';
import { $t } from '#/locales';
import {
  channelTypeColor,
  channelTypeLabel,
  channelTypeList,
  enableBoolToColor,
  enableBoolToName,
  useNotificationChannelStore,
} from '#/stores';

import NotificationChannelDrawer from './notification-channel-drawer.vue';

const channelStore = useNotificationChannelStore();

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  submitOnEnter: true,
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('page.notification.channel.name'),
      componentProps: {
        placeholder: $t('ui.placeholder.input'),
        allowClear: true,
      },
    },
    {
      component: 'Select',
      fieldName: 'channelType',
      label: $t('page.notification.channel.channelType'),
      componentProps: {
        placeholder: $t('ui.placeholder.select'),
        options: channelTypeList,
        filterOption: (input: string, option: any) =>
          option.label.toLowerCase().includes(input.toLowerCase()),
        showSearch: true,
      },
    },
  ],
};

const gridOptions: VxeGridProps<NotificationChannel> = {
  toolbarConfig: {
    custom: true,
    export: true,
    refresh: true,
    zoom: true,
  },
  height: 'auto',
  exportConfig: {},
  pagerConfig: {
    enabled: false,
  },
  rowConfig: {
    isHover: true,
  },
  stripe: true,

  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        return await channelStore.listChannels({
          page: page.currentPage,
          pageSize: page.pageSize,
        });
      },
    },
  },

  columns: [
    {
      title: $t('page.notification.channel.name'),
      field: 'name',
    },
    {
      title: $t('page.notification.channel.channelType'),
      field: 'channelType',
      slots: { default: 'channelType' },
      width: 120,
    },
    {
      title: $t('ui.table.status'),
      field: 'enabled',
      slots: { default: 'enabled' },
      width: 95,
    },
    {
      title: $t('page.notification.channel.isDefault'),
      field: 'isDefault',
      slots: { default: 'isDefault' },
      width: 95,
    },
    {
      title: $t('ui.table.createdAt'),
      field: 'createTime',
      formatter: 'formatDateTime',
      width: 140,
    },
    {
      title: $t('ui.table.action'),
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      width: 90,
    },
  ],
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions, formOptions });

const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: NotificationChannelDrawer,

  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      gridApi.query();
    }
  },
});

function openDrawer(create: boolean, row?: any) {
  drawerApi.setData({ create, row });
  drawerApi.open();
}

function handleCreate() {
  openDrawer(true);
}

function handleEdit(row: any) {
  openDrawer(false, row);
}

async function handleDelete(row: any) {
  try {
    await channelStore.deleteChannel(row.id);
    notification.success({
      message: $t('ui.notification.delete_success'),
    });
    await gridApi.query();
  } catch {
    notification.error({
      message: $t('ui.notification.delete_failed'),
    });
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid :table-title="$t('menu.notification.channel')">
      <template #toolbar-tools>
        <a-button class="mr-2" type="primary" @click="handleCreate">
          {{ $t('page.notification.channel.button.create') }}
        </a-button>
      </template>
      <template #channelType="{ row }">
        <a-tag :color="channelTypeColor(row.channelType)">
          {{ channelTypeLabel(row.channelType) }}
        </a-tag>
      </template>
      <template #enabled="{ row }">
        <a-tag :color="enableBoolToColor(row.enabled)">
          {{ enableBoolToName(row.enabled) }}
        </a-tag>
      </template>
      <template #isDefault="{ row }">
        <a-tag :color="enableBoolToColor(row.isDefault)">
          {{ enableBoolToName(row.isDefault) }}
        </a-tag>
      </template>
      <template #action="{ row }">
        <a-button
          type="link"
          :icon="h(LucideFilePenLine)"
          @click.stop="handleEdit(row)"
        />
        <a-popconfirm
          :cancel-text="$t('ui.button.cancel')"
          :ok-text="$t('ui.button.ok')"
          :title="
            $t('ui.text.do_you_want_delete', {
              moduleName: $t('page.notification.channel.moduleName'),
            })
          "
          @confirm="handleDelete(row)"
        >
          <a-button danger type="link" :icon="h(LucideTrash2)" />
        </a-popconfirm>
      </template>
    </Grid>
    <Drawer />
  </Page>
</template>
