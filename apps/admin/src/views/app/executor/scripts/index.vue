<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { h, computed } from 'vue';

import { Page, useVbenDrawer, type VbenFormProps } from '@vben/common-ui';
import {
  LucideEye,
  LucidePencil,
  LucideTrash2,
  LucidePlus,
  LucideUsers,
  LucideCirclePlay,
} from '@vben/icons';

import { notification, Space, Button, Tag, Modal, Input } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { $t } from '#/locales';
import {
  useExecutorScriptStore,
  useExecutorExecutionStore,
  enableBoolToColor,
  enableBoolToName,
} from '#/stores';
import type { Script } from '#/generated/api/modules/executor/services';

import ScriptDrawer from './script-drawer.vue';
import AssignmentDrawer from './assignment-drawer.vue';

const scriptStore = useExecutorScriptStore();
const executionStore = useExecutorExecutionStore();

const scriptTypeOptions = computed(() => [
  { value: 'SCRIPT_TYPE_BASH', label: $t('executor.page.script.typeBash') },
  {
    value: 'SCRIPT_TYPE_JAVASCRIPT',
    label: $t('executor.page.script.typeJavascript'),
  },
  { value: 'SCRIPT_TYPE_LUA', label: $t('executor.page.script.typeLua') },
]);

function scriptTypeToName(type: string | undefined) {
  const option = scriptTypeOptions.value.find((o) => o.value === type);
  return option?.label ?? type ?? '';
}

function scriptTypeToColor(type: string | undefined) {
  switch (type) {
    case 'SCRIPT_TYPE_BASH':
      return '#389E0D';
    case 'SCRIPT_TYPE_JAVASCRIPT':
      return '#D4B106';
    case 'SCRIPT_TYPE_LUA':
      return '#1890FF';
    default:
      return '#8C8C8C';
  }
}

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  submitOnEnter: true,
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('executor.page.script.name'),
      componentProps: {
        placeholder: $t('ui.placeholder.input'),
        allowClear: true,
      },
    },
    {
      component: 'Select',
      fieldName: 'scriptType',
      label: $t('executor.page.script.scriptType'),
      componentProps: {
        options: scriptTypeOptions,
        placeholder: $t('ui.placeholder.select'),
        allowClear: true,
      },
    },
  ],
};

const gridOptions: VxeGridProps<Script> = {
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
        const resp = await scriptStore.listScripts(
          { page: page.currentPage, pageSize: page.pageSize },
          {
            name: formValues?.name,
            scriptType: formValues?.scriptType,
          },
        );
        return {
          items: resp.scripts ?? [],
          total: resp.total ?? 0,
        };
      },
    },
  },

  columns: [
    { title: $t('ui.table.seq'), type: 'seq', width: 50 },
    {
      title: $t('executor.page.script.name'),
      field: 'name',
      minWidth: 180,
    },
    {
      title: $t('executor.page.script.scriptType'),
      field: 'scriptType',
      width: 130,
      slots: { default: 'scriptType' },
    },
    {
      title: $t('executor.page.script.version'),
      field: 'version',
      width: 90,
    },
    {
      title: $t('executor.page.script.enabled'),
      field: 'enabled',
      width: 100,
      slots: { default: 'enabled' },
    },
    {
      title: $t('executor.page.script.createdAt'),
      field: 'createTime',
      width: 160,
      sortable: true,
    },
    {
      title: $t('ui.table.action'),
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      width: 200,
    },
  ],
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions, formOptions });

const [ScriptDrawerComponent, scriptDrawerApi] = useVbenDrawer({
  connectedComponent: ScriptDrawer,
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      gridApi.reload();
    }
  },
});

const [AssignmentDrawerComponent, assignmentDrawerApi] = useVbenDrawer({
  connectedComponent: AssignmentDrawer,
});

function handleCreate() {
  scriptDrawerApi.setData({ mode: 'create' });
  scriptDrawerApi.open();
}

function handleView(row: Script) {
  scriptDrawerApi.setData({ row, mode: 'view' });
  scriptDrawerApi.open();
}

function handleEdit(row: Script) {
  scriptDrawerApi.setData({ row, mode: 'edit' });
  scriptDrawerApi.open();
}

function handleAssignments(row: Script) {
  assignmentDrawerApi.setData({ script: row });
  assignmentDrawerApi.open();
}

const triggerClientId = { value: '' };

function handleExecute(row: Script) {
  triggerClientId.value = '';
  Modal.confirm({
    title: $t('executor.page.execution.triggerTitle'),
    content: h('div', { style: 'margin-top: 12px' }, [
      h('div', { style: 'margin-bottom: 8px' }, $t('executor.page.execution.triggerClientId')),
      h(Input, {
        placeholder: $t('executor.page.execution.triggerClientIdPlaceholder'),
        onChange: (e: Event) => {
          triggerClientId.value = (e.target as HTMLInputElement).value;
        },
      }),
    ]),
    async onOk() {
      if (!triggerClientId.value) return;
      try {
        await executionStore.triggerExecution(row.id, triggerClientId.value);
        notification.success({
          message: $t('executor.page.execution.triggerSuccess'),
        });
      } catch {
        notification.error({ message: $t('ui.notification.create_failed') });
      }
    },
  });
}

async function handleDelete(row: Script) {
  if (!row.id) return;
  try {
    await scriptStore.deleteScript(row.id);
    notification.success({
      message: $t('executor.page.script.deleteSuccess'),
    });
    await gridApi.reload();
  } catch {
    notification.error({ message: $t('ui.notification.delete_failed') });
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid :table-title="$t('executor.page.script.title')">
      <template #toolbar-tools>
        <Button class="mr-2" type="primary" :icon="h(LucidePlus)" @click="handleCreate">
          {{ $t('executor.page.script.create') }}
        </Button>
      </template>
      <template #scriptType="{ row }">
        <Tag :color="scriptTypeToColor(row.scriptType)">
          {{ scriptTypeToName(row.scriptType) }}
        </Tag>
      </template>
      <template #enabled="{ row }">
        <Tag :color="enableBoolToColor(row.enabled)">
          {{ enableBoolToName(row.enabled) }}
        </Tag>
      </template>
      <template #action="{ row }">
        <Space>
          <Button
            type="link"
            size="small"
            :icon="h(LucideEye)"
            :title="$t('ui.button.view')"
            @click.stop="handleView(row)"
          />
          <Button
            type="link"
            size="small"
            :icon="h(LucidePencil)"
            :title="$t('executor.page.script.edit')"
            @click.stop="handleEdit(row)"
          />
          <Button
            type="link"
            size="small"
            :icon="h(LucideUsers)"
            :title="$t('executor.page.assignment.title')"
            @click.stop="handleAssignments(row)"
          />
          <Button
            type="link"
            size="small"
            :icon="h(LucideCirclePlay)"
            :title="$t('executor.page.script.execute')"
            @click.stop="handleExecute(row)"
          />
          <a-popconfirm
            :cancel-text="$t('ui.button.cancel')"
            :ok-text="$t('ui.button.ok')"
            :title="$t('executor.page.script.confirmDelete')"
            @confirm="handleDelete(row)"
          >
            <Button
              danger
              type="link"
              size="small"
              :icon="h(LucideTrash2)"
              :title="$t('executor.page.script.delete')"
            />
          </a-popconfirm>
        </Space>
      </template>
    </Grid>

    <ScriptDrawerComponent />
    <AssignmentDrawerComponent />
  </Page>
</template>
