<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { h, computed, ref } from 'vue';

import { Page, useVbenDrawer, type VbenFormProps } from '@vben/common-ui';
import { LucideEye, LucideDownload, LucideRefreshCw, LucideXCircle } from '@vben/icons';

import { notification } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { type lcmservicev1_CertificateJobInfo } from '#/generated/api/admin/service/v1';
import { $t } from '#/locales';
import { useLcmCertificateJobStore, useLcmIssuerStore } from '#/stores';

import CertificateJobDrawer from './certificate-job-drawer.vue';

const certificateJobStore = useLcmCertificateJobStore();
const issuerStore = useLcmIssuerStore();

const statusList = computed(() => [
  { value: 'CERTIFICATE_JOB_STATUS_PENDING', label: $t('lcm.enum.jobStatus.pending') },
  { value: 'CERTIFICATE_JOB_STATUS_PROCESSING', label: $t('lcm.enum.jobStatus.processing') },
  { value: 'CERTIFICATE_JOB_STATUS_COMPLETED', label: $t('lcm.enum.jobStatus.completed') },
  { value: 'CERTIFICATE_JOB_STATUS_FAILED', label: $t('lcm.enum.jobStatus.failed') },
  { value: 'CERTIFICATE_JOB_STATUS_CANCELLED', label: $t('lcm.enum.jobStatus.cancelled') },
]);

const issuerOptions = ref<Array<{ value: string; label: string }>>([]);

// Load issuers for filter dropdown
async function loadIssuers() {
  try {
    const resp = await issuerStore.listIssuers();
    issuerOptions.value = (resp.issuers ?? []).map((issuer) => ({
      value: issuer.name ?? '',
      label: issuer.name ?? '',
    }));
  } catch {
    // Ignore errors loading issuers
  }
}
loadIssuers();

function statusToColor(status: string | undefined) {
  switch (status) {
    case 'CERTIFICATE_JOB_STATUS_PENDING':
      return '#FAAD14'; // orange
    case 'CERTIFICATE_JOB_STATUS_PROCESSING':
      return '#1890FF'; // blue
    case 'CERTIFICATE_JOB_STATUS_COMPLETED':
      return '#52C41A'; // green
    case 'CERTIFICATE_JOB_STATUS_FAILED':
      return '#FF4D4F'; // red
    case 'CERTIFICATE_JOB_STATUS_CANCELLED':
      return '#8C8C8C'; // gray
    default:
      return '#C9CDD4';
  }
}

function statusToName(status: string | undefined) {
  const item = statusList.value.find((s) => s.value === status);
  return item?.label ?? status ?? '';
}

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  submitOnEnter: true,
  schema: [
    {
      component: 'Select',
      fieldName: 'issuerName',
      label: $t('lcm.page.certificateJob.issuerName'),
      componentProps: {
        options: issuerOptions,
        placeholder: $t('ui.placeholder.select'),
        allowClear: true,
        showSearch: true,
        filterOption: (input: string, option: { label: string }) =>
          option.label.toLowerCase().includes(input.toLowerCase()),
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: $t('ui.table.status'),
      componentProps: {
        options: statusList,
        placeholder: $t('ui.placeholder.select'),
        allowClear: true,
      },
    },
  ],
};

const gridOptions: VxeGridProps<lcmservicev1_CertificateJobInfo> = {
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
  pagerConfig: {},
  rowConfig: {
    isHover: true,
  },

  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await certificateJobStore.listJobs(
          {
            page: page.currentPage,
            pageSize: page.pageSize,
          },
          formValues,
        );
      },
    },
  },

  columns: [
    { title: $t('ui.table.seq'), type: 'seq', width: 50 },
    { title: $t('lcm.page.certificateJob.jobId'), field: 'jobId', width: 280 },
    { title: $t('lcm.page.certificateJob.commonName'), field: 'commonName', minWidth: 180 },
    { title: $t('lcm.page.certificateJob.issuerName'), field: 'issuerName', width: 120 },
    { title: $t('lcm.page.certificateJob.issuerType'), field: 'issuerType', width: 100 },
    {
      title: $t('ui.table.status'),
      field: 'status',
      slots: { default: 'status' },
      width: 110,
    },
    {
      title: $t('ui.table.createdAt'),
      field: 'createdAt',
      formatter: 'formatDateTime',
      width: 160,
    },
    {
      title: $t('lcm.page.certificateJob.completedAt'),
      field: 'completedAt',
      formatter: 'formatDateTime',
      width: 160,
    },
    {
      title: $t('ui.table.action'),
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      width: 160,
    },
  ],
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions, formOptions });

const drawerMode = ref<'create' | 'view'>('view');

const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: CertificateJobDrawer,

  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      gridApi.reload();
    }
  },
});

function openDrawer(row: lcmservicev1_CertificateJobInfo, mode: 'create' | 'view') {
  drawerMode.value = mode;
  drawerApi.setData({ row, mode, issuerOptions: issuerOptions.value });
  drawerApi.open();
}

/* View details */
function handleView(row: lcmservicev1_CertificateJobInfo) {
  openDrawer(row, 'view');
}

/* Create new certificate request */
function handleCreate() {
  openDrawer({} as lcmservicev1_CertificateJobInfo, 'create');
}

/* Download certificate */
async function handleDownload(row: lcmservicev1_CertificateJobInfo) {
  if (!row.jobId) {
    notification.error({ message: $t('lcm.page.certificateJob.error.noJobId') });
    return;
  }

  if (row.status !== 'CERTIFICATE_JOB_STATUS_COMPLETED') {
    notification.warning({ message: $t('lcm.page.certificateJob.error.notCompleted') });
    return;
  }

  try {
    const resp = await certificateJobStore.getJobResult(row.jobId, false);

    if (!resp.certificatePem) {
      notification.error({ message: $t('lcm.page.certificateJob.error.noCertificate') });
      return;
    }

    // Create download
    const blob = new Blob([resp.certificatePem], { type: 'application/x-pem-file' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${row.commonName ?? 'certificate'}.pem`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    notification.success({ message: $t('lcm.page.certificateJob.downloadSuccess') });
  } catch {
    notification.error({ message: $t('lcm.page.certificateJob.downloadFailed') });
  }
}

/* Cancel job */
async function handleCancel(row: lcmservicev1_CertificateJobInfo) {
  if (!row.jobId) {
    notification.error({ message: $t('lcm.page.certificateJob.error.noJobId') });
    return;
  }

  try {
    await certificateJobStore.cancelJob(row.jobId);
    notification.success({ message: $t('lcm.page.certificateJob.cancelSuccess') });
    await gridApi.reload();
  } catch {
    notification.error({ message: $t('lcm.page.certificateJob.cancelFailed') });
  }
}

function canCancel(row: lcmservicev1_CertificateJobInfo) {
  return row.status === 'CERTIFICATE_JOB_STATUS_PENDING' ||
         row.status === 'CERTIFICATE_JOB_STATUS_PROCESSING';
}

function canDownload(row: lcmservicev1_CertificateJobInfo) {
  return row.status === 'CERTIFICATE_JOB_STATUS_COMPLETED';
}

function canRetry(row: lcmservicev1_CertificateJobInfo) {
  return row.status === 'CERTIFICATE_JOB_STATUS_FAILED';
}

/* Retry failed job */
async function handleRetry(row: lcmservicev1_CertificateJobInfo) {
  if (!row.jobId) {
    notification.error({ message: $t('lcm.page.certificateJob.error.noJobId') });
    return;
  }

  try {
    await certificateJobStore.retryJob(row.jobId);
    notification.success({ message: $t('lcm.page.certificateJob.retrySuccess') });
    await gridApi.reload();
  } catch {
    notification.error({ message: $t('lcm.page.certificateJob.retryFailed') });
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid :table-title="$t('lcm.menu.certificateJob')">
      <template #toolbar-tools>
        <a-button
          type="primary"
          @click="handleCreate"
        >
          {{ $t('lcm.page.certificateJob.requestCertificate') }}
        </a-button>
      </template>
      <template #status="{ row }">
        <a-tag :color="statusToColor(row.status)">
          {{ statusToName(row.status) }}
        </a-tag>
      </template>
      <template #action="{ row }">
        <a-button
          type="link"
          :icon="h(LucideEye)"
          :title="$t('ui.button.view')"
          @click.stop="handleView(row)"
        />
        <a-button
          v-if="canDownload(row)"
          type="link"
          :icon="h(LucideDownload)"
          :title="$t('ui.button.download')"
          @click.stop="handleDownload(row)"
        />
        <a-popconfirm
          v-if="canRetry(row)"
          :cancel-text="$t('ui.button.cancel')"
          :ok-text="$t('ui.button.ok')"
          :title="$t('lcm.page.certificateJob.confirmRetry')"
          @confirm="handleRetry(row)"
        >
          <a-button
            type="link"
            :icon="h(LucideRefreshCw)"
            :title="$t('lcm.page.certificateJob.retry')"
          />
        </a-popconfirm>
        <a-popconfirm
          v-if="canCancel(row)"
          :cancel-text="$t('ui.button.cancel')"
          :ok-text="$t('ui.button.ok')"
          :title="$t('lcm.page.certificateJob.confirmCancel')"
          @confirm="handleCancel(row)"
        >
          <a-button
            danger
            type="link"
            :icon="h(LucideXCircle)"
            :title="$t('lcm.page.certificateJob.cancel')"
          />
        </a-popconfirm>
      </template>
    </Grid>
    <Drawer />
  </Page>
</template>
