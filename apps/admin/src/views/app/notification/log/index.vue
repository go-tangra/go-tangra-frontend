<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { Page, type VbenFormProps } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { type NotificationLog } from '#/generated/api/modules/notification/services';
import { $t } from '#/locales';
import {
  channelTypeColor,
  channelTypeLabel,
  channelTypeList,
  deliveryStatusColor,
  deliveryStatusLabel,
  deliveryStatusList,
  useNotificationLogStore,
} from '#/stores';

const logStore = useNotificationLogStore();

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  submitOnEnter: true,
  schema: [
    {
      component: 'Select',
      fieldName: 'channelType',
      label: $t('page.notification.log.channelType'),
      componentProps: {
        placeholder: $t('ui.placeholder.select'),
        options: channelTypeList,
        filterOption: (input: string, option: any) =>
          option.label.toLowerCase().includes(input.toLowerCase()),
        showSearch: true,
        allowClear: true,
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: $t('page.notification.log.status'),
      componentProps: {
        placeholder: $t('ui.placeholder.select'),
        options: deliveryStatusList,
        filterOption: (input: string, option: any) =>
          option.label.toLowerCase().includes(input.toLowerCase()),
        showSearch: true,
        allowClear: true,
      },
    },
  ],
};

const gridOptions: VxeGridProps<NotificationLog> = {
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
      query: async ({ page }, formValues) => {
        return await logStore.listNotifications({
          page: page.currentPage,
          pageSize: page.pageSize,
          ...formValues,
        });
      },
    },
  },

  columns: [
    {
      title: $t('page.notification.log.recipient'),
      field: 'recipient',
    },
    {
      title: $t('page.notification.log.channelType'),
      field: 'channelType',
      slots: { default: 'channelType' },
      width: 120,
    },
    {
      title: $t('page.notification.log.renderedSubject'),
      field: 'renderedSubject',
    },
    {
      title: $t('page.notification.log.status'),
      field: 'status',
      slots: { default: 'status' },
      width: 110,
    },
    {
      title: $t('page.notification.log.errorMessage'),
      field: 'errorMessage',
      width: 200,
    },
    {
      title: $t('page.notification.log.sentAt'),
      field: 'sentAt',
      formatter: 'formatDateTime',
      width: 140,
    },
    {
      title: $t('ui.table.createdAt'),
      field: 'createTime',
      formatter: 'formatDateTime',
      width: 140,
    },
  ],
};

const [Grid] = useVbenVxeGrid({ gridOptions, formOptions });
</script>

<template>
  <Page auto-content-height>
    <Grid :table-title="$t('menu.notification.log')">
      <template #channelType="{ row }">
        <a-tag :color="channelTypeColor(row.channelType)">
          {{ channelTypeLabel(row.channelType) }}
        </a-tag>
      </template>
      <template #status="{ row }">
        <a-tag :color="deliveryStatusColor(row.status)">
          {{ deliveryStatusLabel(row.status) }}
        </a-tag>
      </template>
    </Grid>
  </Page>
</template>
