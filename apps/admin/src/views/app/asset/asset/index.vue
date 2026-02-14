<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { h, ref, computed, onMounted } from 'vue';

import { Page, useVbenModal, type VbenFormProps } from '@vben/common-ui';
import {
  LucideEye,
  LucideTrash,
  LucidePencil,
  LucideLink,
  LucideBan,
} from '@vben/icons';

import { notification, Space, Button, Tag, Modal, Select, Input } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import type { Asset } from '#/generated/api/modules/asset';
import {
  CategoryService,
  EmployeeService,
  LocationService,
} from '#/generated/api/modules/asset';
import { $t } from '#/locales';
import { useAssetAssetStore } from '#/stores';

import AssetModal from './asset-modal.vue';

const assetStore = useAssetAssetStore();

const categoryMap = ref<Map<string, string>>(new Map());
const employeeMap = ref<Map<string, string>>(new Map());

interface SelectOption {
  value: string;
  label: string;
}

const categoryOptions = ref<SelectOption[]>([]);
const employeeOptions = ref<SelectOption[]>([]);
const locationOptions = ref<SelectOption[]>([]);

async function loadRelatedData() {
  try {
    const [catResp, empResp, locResp] = await Promise.all([
      CategoryService.list({ noPaging: true }),
      EmployeeService.list({ noPaging: true }),
      LocationService.list({ noPaging: true }),
    ]);
    const catMap = new Map<string, string>();
    categoryOptions.value = (catResp.items ?? []).map((c) => {
      catMap.set(c.id, c.name);
      return { value: c.id, label: c.name };
    });
    categoryMap.value = catMap;

    const empMap = new Map<string, string>();
    employeeOptions.value = (empResp.items ?? []).map((e) => {
      const name = `${e.firstName} ${e.lastName}`;
      empMap.set(e.id, name);
      return { value: e.id, label: name };
    });
    employeeMap.value = empMap;

    locationOptions.value = (locResp.items ?? []).map((l) => ({
      value: l.id,
      label: l.name,
    }));
  } catch (e) {
    console.error('Failed to load related data:', e);
  }
}

const statusOptions = computed(() => [
  {
    value: 'ASSET_STATUS_DEPLOYABLE',
    label: $t('asset.enum.assetStatus.deployable'),
  },
  {
    value: 'ASSET_STATUS_ASSIGNED',
    label: $t('asset.enum.assetStatus.assigned'),
  },
  {
    value: 'ASSET_STATUS_BROKEN',
    label: $t('asset.enum.assetStatus.broken'),
  },
  {
    value: 'ASSET_STATUS_ARCHIVED',
    label: $t('asset.enum.assetStatus.archived'),
  },
]);

function statusToColor(status: string | undefined) {
  switch (status) {
    case 'ASSET_STATUS_DEPLOYABLE':
      return '#52C41A';
    case 'ASSET_STATUS_ASSIGNED':
      return '#1890FF';
    case 'ASSET_STATUS_BROKEN':
      return '#FF4D4F';
    case 'ASSET_STATUS_ARCHIVED':
      return '#8C8C8C';
    default:
      return '#C9CDD4';
  }
}

function statusToName(status: string | undefined) {
  const option = statusOptions.value.find((o) => o.value === status);
  return option?.label ?? status ?? '';
}

function getCategoryName(id: string | undefined) {
  if (!id) return '-';
  return categoryMap.value.get(id) ?? id;
}

function getEmployeeName(id: string | undefined) {
  if (!id) return '-';
  return employeeMap.value.get(id) ?? id;
}

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  submitOnEnter: true,
  schema: [
    {
      component: 'Input',
      fieldName: 'query',
      label: $t('ui.table.search'),
      componentProps: {
        placeholder: $t('ui.placeholder.input'),
        allowClear: true,
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: $t('asset.page.asset.status'),
      componentProps: {
        options: statusOptions,
        placeholder: $t('ui.placeholder.select'),
        allowClear: true,
      },
    },
    {
      component: 'Select',
      fieldName: 'categoryId',
      label: $t('asset.page.asset.categoryId'),
      componentProps: {
        options: categoryOptions,
        placeholder: $t('ui.placeholder.select'),
        allowClear: true,
      },
    },
  ],
};

const gridOptions: VxeGridProps<Asset> = {
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
        const resp = await assetStore.listAssets(
          { page: page.currentPage, pageSize: page.pageSize },
          {
            query: formValues?.query,
            status: formValues?.status,
            categoryId: formValues?.categoryId,
          },
        );
        return {
          items: resp.items ?? [],
          total: resp.total ?? 0,
        };
      },
    },
  },

  columns: [
    { title: $t('ui.table.seq'), type: 'seq', width: 50 },
    {
      title: $t('asset.page.asset.assetTag'),
      field: 'assetTag',
      width: 140,
    },
    {
      title: $t('asset.page.asset.status'),
      field: 'status',
      width: 120,
      slots: { default: 'status' },
    },
    {
      title: $t('asset.page.asset.modelName'),
      field: 'modelName',
      width: 140,
    },
    {
      title: $t('asset.page.asset.categoryId'),
      field: 'categoryId',
      width: 140,
      slots: { default: 'categoryName' },
    },
    {
      title: $t('asset.page.asset.employeeId'),
      field: 'employeeId',
      width: 140,
      slots: { default: 'employeeName' },
    },
    {
      title: $t('asset.page.asset.purchaseCost'),
      field: 'purchaseCost',
      width: 120,
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

const [AssetModalComponent, assetModalApi] = useVbenModal({
  connectedComponent: AssetModal,
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      gridApi.reload();
    }
  },
});

function openModal(row: Asset, mode: 'create' | 'edit' | 'view') {
  assetModalApi.setData({ row, mode });
  assetModalApi.open();
}

function handleView(row: Asset) {
  openModal(row, 'view');
}

function handleEdit(row: Asset) {
  openModal(row, 'edit');
}

function handleCreate() {
  openModal({} as Asset, 'create');
}

async function handleDelete(row: Asset) {
  if (!row.id) return;
  try {
    await assetStore.deleteAsset(row.id);
    notification.success({
      message: $t('asset.page.asset.deleteSuccess'),
    });
    await gridApi.reload();
  } catch {
    notification.error({ message: $t('ui.notification.delete_failed') });
  }
}

// Assign modal
const assignModalVisible = ref(false);
const assignTarget = ref<Asset | null>(null);
const assignEmployeeId = ref<string | undefined>(undefined);
const assignNotes = ref('');

function handleAssign(row: Asset) {
  assignTarget.value = row;
  assignEmployeeId.value = undefined;
  assignNotes.value = '';
  assignModalVisible.value = true;
}

async function confirmAssign() {
  if (!assignTarget.value?.id || !assignEmployeeId.value) return;
  try {
    await assetStore.assignAsset(
      assignTarget.value.id,
      assignEmployeeId.value,
      assignNotes.value || undefined,
    );
    notification.success({
      message: $t('asset.page.asset.assignSuccess'),
    });
    assignModalVisible.value = false;
    await gridApi.reload();
  } catch {
    notification.error({ message: $t('ui.notification.update_failed') });
  }
}

// Unassign modal
const unassignModalVisible = ref(false);
const unassignTarget = ref<Asset | null>(null);
const unassignLocationId = ref<string | undefined>(undefined);
const unassignNotes = ref('');

function handleUnassign(row: Asset) {
  unassignTarget.value = row;
  unassignLocationId.value = undefined;
  unassignNotes.value = '';
  unassignModalVisible.value = true;
}

async function confirmUnassign() {
  if (!unassignTarget.value?.id) return;
  try {
    await assetStore.unassignAsset(
      unassignTarget.value.id,
      unassignLocationId.value,
      unassignNotes.value || undefined,
    );
    notification.success({
      message: $t('asset.page.asset.unassignSuccess'),
    });
    unassignModalVisible.value = false;
    await gridApi.reload();
  } catch {
    notification.error({ message: $t('ui.notification.update_failed') });
  }
}

onMounted(() => {
  loadRelatedData();
});
</script>

<template>
  <Page auto-content-height>
    <Grid :table-title="$t('asset.page.asset.title')">
      <template #toolbar-tools>
        <Button class="mr-2" type="primary" @click="handleCreate">
          {{ $t('asset.page.asset.create') }}
        </Button>
      </template>
      <template #status="{ row }">
        <Tag :color="statusToColor(row.status)">
          {{ statusToName(row.status) }}
        </Tag>
      </template>
      <template #categoryName="{ row }">
        {{ getCategoryName(row.categoryId) }}
      </template>
      <template #employeeName="{ row }">
        {{ getEmployeeName(row.employeeId) }}
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
            v-if="row.status === 'ASSET_STATUS_DEPLOYABLE'"
            type="link"
            size="small"
            :icon="h(LucideLink)"
            :title="$t('asset.page.asset.assign')"
            @click.stop="handleAssign(row)"
          />
          <Button
            v-if="row.status === 'ASSET_STATUS_ASSIGNED'"
            type="link"
            size="small"
            :icon="h(LucideBan)"
            :title="$t('asset.page.asset.unassign')"
            @click.stop="handleUnassign(row)"
          />
          <Button
            type="link"
            size="small"
            :icon="h(LucidePencil)"
            :title="$t('ui.button.edit')"
            @click.stop="handleEdit(row)"
          />
          <a-popconfirm
            :cancel-text="$t('ui.button.cancel')"
            :ok-text="$t('ui.button.ok')"
            :title="$t('asset.page.asset.confirmDelete')"
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

    <AssetModalComponent />

    <!-- Assign Modal -->
    <Modal
      v-model:open="assignModalVisible"
      :title="$t('asset.page.asset.assignEmployee')"
      :ok-text="$t('asset.page.asset.assign')"
      :cancel-text="$t('ui.button.cancel')"
      @ok="confirmAssign"
    >
      <div class="mb-4">
        <label class="mb-1 block font-medium">{{
          $t('asset.page.asset.employeeId')
        }}</label>
        <Select
          v-model:value="assignEmployeeId"
          :options="employeeOptions"
          :placeholder="$t('ui.placeholder.select')"
          show-search
          :filter-option="
            (input: string, option: any) =>
              option.label.toLowerCase().includes(input.toLowerCase())
          "
          style="width: 100%"
        />
      </div>
      <div>
        <label class="mb-1 block font-medium">{{
          $t('asset.page.asset.assignNotes')
        }}</label>
        <Input.TextArea
          v-model:value="assignNotes"
          :rows="3"
          :placeholder="$t('ui.placeholder.input')"
        />
      </div>
    </Modal>

    <!-- Unassign Modal -->
    <Modal
      v-model:open="unassignModalVisible"
      :title="$t('asset.page.asset.unassign')"
      :ok-text="$t('asset.page.asset.unassign')"
      :cancel-text="$t('ui.button.cancel')"
      @ok="confirmUnassign"
    >
      <div class="mb-4">
        <label class="mb-1 block font-medium">{{
          $t('asset.page.asset.returnLocation')
        }}</label>
        <Select
          v-model:value="unassignLocationId"
          :options="locationOptions"
          :placeholder="$t('ui.placeholder.select')"
          allow-clear
          show-search
          :filter-option="
            (input: string, option: any) =>
              option.label.toLowerCase().includes(input.toLowerCase())
          "
          style="width: 100%"
        />
      </div>
      <div>
        <label class="mb-1 block font-medium">{{
          $t('asset.page.asset.unassignNotes')
        }}</label>
        <Input.TextArea
          v-model:value="unassignNotes"
          :rows="3"
          :placeholder="$t('ui.placeholder.input')"
        />
      </div>
    </Modal>
  </Page>
</template>
