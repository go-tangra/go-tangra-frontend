<script lang="ts" setup>
import { ref, computed } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { Descriptions, DescriptionsItem, Tag, Divider, Typography, Spin } from 'ant-design-vue';

import { type IssuedCertificateInfo } from '#/generated/api/modules/lcm';
import { $t } from '#/locales';
import { useLcmIssuedCertificateStore } from '#/stores';

const { Text } = Typography;

const issuedCertStore = useLcmIssuedCertificateStore();

const data = ref<{ row: IssuedCertificateInfo }>();
const certDetails = ref<IssuedCertificateInfo | null>(null);
const loading = ref(false);

function statusToColor(status: string | undefined) {
  switch (status) {
    case 'ISSUED_CERTIFICATE_STATUS_ISSUED':
      return '#52C41A';
    case 'ISSUED_CERTIFICATE_STATUS_PENDING':
      return '#FAAD14';
    case 'ISSUED_CERTIFICATE_STATUS_PROCESSING':
      return '#1890FF';
    case 'ISSUED_CERTIFICATE_STATUS_FAILED':
      return '#FF4D4F';
    case 'ISSUED_CERTIFICATE_STATUS_EXPIRED':
      return '#FF4D4F';
    case 'ISSUED_CERTIFICATE_STATUS_REVOKED':
      return '#8C8C8C';
    case 'ISSUED_CERTIFICATE_STATUS_RENEWED':
      return '#722ED1';
    default:
      return '#C9CDD4';
  }
}

function statusToName(status: string | undefined) {
  switch (status) {
    case 'ISSUED_CERTIFICATE_STATUS_ISSUED':
      return $t('lcm.enum.issuedCertStatus.issued');
    case 'ISSUED_CERTIFICATE_STATUS_PENDING':
      return $t('lcm.enum.issuedCertStatus.pending');
    case 'ISSUED_CERTIFICATE_STATUS_PROCESSING':
      return $t('lcm.enum.issuedCertStatus.processing');
    case 'ISSUED_CERTIFICATE_STATUS_FAILED':
      return $t('lcm.enum.issuedCertStatus.failed');
    case 'ISSUED_CERTIFICATE_STATUS_EXPIRED':
      return $t('lcm.enum.issuedCertStatus.expired');
    case 'ISSUED_CERTIFICATE_STATUS_REVOKED':
      return $t('lcm.enum.issuedCertStatus.revoked');
    case 'ISSUED_CERTIFICATE_STATUS_RENEWED':
      return $t('lcm.enum.issuedCertStatus.renewed');
    default:
      return status ?? '';
  }
}

function formatDateTime(value: string | undefined) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

async function loadCertificateDetails(id: string) {
  loading.value = true;
  try {
    const resp = await issuedCertStore.getCertificate(id);
    certDetails.value = resp.certificate ?? null;
  } catch (error) {
    console.error('Failed to load certificate details:', error);
  } finally {
    loading.value = false;
  }
}

const [Drawer, drawerApi] = useVbenDrawer({
  onCancel() {
    drawerApi.close();
  },

  onConfirm() {
    drawerApi.close();
  },

  onOpenChange(isOpen) {
    if (isOpen) {
      data.value = drawerApi.getData() as typeof data.value;
      certDetails.value = null;

      if (data.value?.row?.id) {
        loadCertificateDetails(data.value.row.id);
      }
    }
  },
});

const cert = computed(() => certDetails.value ?? data.value?.row);
</script>

<template>
  <Drawer :title="$t('lcm.page.issuedCertificate.details')" :footer="false">
    <Spin :spinning="loading">
      <template v-if="cert">
        <Descriptions :column="1" bordered size="small">
          <DescriptionsItem label="ID">
            <Text code copyable>{{ cert.id }}</Text>
          </DescriptionsItem>
          <DescriptionsItem :label="$t('ui.table.status')">
            <Tag :color="statusToColor(cert.status)">
              {{ statusToName(cert.status) }}
            </Tag>
          </DescriptionsItem>
          <DescriptionsItem :label="$t('lcm.page.issuedCertificate.commonName')">
            {{ cert.commonName ?? '-' }}
          </DescriptionsItem>
          <DescriptionsItem :label="$t('lcm.page.issuedCertificate.issuerName')">
            {{ cert.issuerName ?? '-' }}
          </DescriptionsItem>
          <DescriptionsItem :label="$t('lcm.page.issuedCertificate.issuerType')">
            {{ cert.issuerType ?? '-' }}
          </DescriptionsItem>
        </Descriptions>

        <template v-if="cert.domains?.length">
          <Divider>{{ $t('lcm.page.issuedCertificate.domains') }}</Divider>
          <div>
            <Tag v-for="domain in cert.domains" :key="domain" style="margin: 2px;">
              {{ domain }}
            </Tag>
          </div>
        </template>

        <Divider>{{ $t('lcm.page.issuedCertificate.autoRenew') }}</Divider>
        <Descriptions :column="2" bordered size="small">
          <DescriptionsItem :label="$t('lcm.page.issuedCertificate.autoRenew')">
            <Tag :color="cert.autoRenewEnabled ? '#52C41A' : '#8C8C8C'">
              {{ cert.autoRenewEnabled ? $t('enum.enable.true') : $t('enum.enable.false') }}
            </Tag>
          </DescriptionsItem>
          <DescriptionsItem :label="$t('lcm.page.issuedCertificate.autoRenewDays')">
            {{ cert.autoRenewDaysBeforeExpiry ?? '-' }}
          </DescriptionsItem>
        </Descriptions>

        <Divider>{{ $t('lcm.page.issuedCertificate.keyType') }}</Divider>
        <Descriptions :column="2" bordered size="small">
          <DescriptionsItem :label="$t('lcm.page.issuedCertificate.keyType')">
            {{ cert.keyType ?? '-' }}
          </DescriptionsItem>
          <DescriptionsItem :label="$t('lcm.page.issuedCertificate.keySize')">
            {{ cert.keySize ? `${cert.keySize} bits` : '-' }}
          </DescriptionsItem>
        </Descriptions>

        <Divider />
        <Descriptions :column="2" bordered size="small">
          <DescriptionsItem :label="$t('lcm.page.issuedCertificate.expiresAt')">
            {{ formatDateTime(cert.expiresAt) }}
          </DescriptionsItem>
          <DescriptionsItem :label="$t('ui.table.createdAt')">
            {{ formatDateTime(cert.createdAt) }}
          </DescriptionsItem>
        </Descriptions>

        <template v-if="cert.errorMessage">
          <Divider>{{ $t('lcm.page.issuedCertificate.errorMessage') }}</Divider>
          <Descriptions :column="1" bordered size="small">
            <DescriptionsItem :label="$t('lcm.page.issuedCertificate.errorMessage')">
              <Text type="danger">{{ cert.errorMessage }}</Text>
            </DescriptionsItem>
          </Descriptions>
        </template>
      </template>
    </Spin>
  </Drawer>
</template>
