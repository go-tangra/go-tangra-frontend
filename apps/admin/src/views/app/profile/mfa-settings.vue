<script lang="ts" setup>
import type {
  authenticationservicev1_EnrolledMethod,
  authenticationservicev1_MFAMethod,
} from '#/generated/api/admin/service/v1';

import { onMounted, ref } from 'vue';

import { $t } from '@vben/locales';

import {
  Alert,
  Button,
  Card,
  Descriptions,
  DescriptionsItem,
  Input,
  Modal,
  notification,
  Space,
  Tag,
  Typography,
} from 'ant-design-vue';

import { createMFAServiceClient } from '#/generated/api/admin/service/v1';
import { requestClientRequestHandler } from '#/utils/request';
import { isWebAuthnSupported, performRegistration } from '#/utils/webauthn';

defineOptions({ name: 'MFASettings' });

const mfaService = createMFAServiceClient(requestClientRequestHandler);

const mfaEnabled = ref(false);
const enrolledMethods = ref<authenticationservicev1_EnrolledMethod[]>([]);
const backupCodesRemaining = ref(0);
const loading = ref(false);

// Enrollment state
const enrolling = ref(false);
const enrollQrCode = ref('');
const enrollSecret = ref('');
const enrollOperationId = ref('');
const enrollCode = ref('');

// WebAuthn state
const webauthnSupported = isWebAuthnSupported();
const webauthnEnrolling = ref(false);

// Backup codes display
const backupCodes = ref<string[]>([]);
const showBackupCodes = ref(false);

async function loadStatus() {
  loading.value = true;
  try {
    const status = await mfaService.GetMFAStatus({} as Record<string, never>);
    mfaEnabled.value = status.enabled;
    enrolledMethods.value = status.enrolled ?? [];

    if (status.enabled) {
      const bcResp = await mfaService.ListBackupCodes({} as Record<string, never>);
      backupCodesRemaining.value = bcResp.remaining;
    }
  } catch (error) {
    console.error('Failed to load MFA status:', error);
  } finally {
    loading.value = false;
  }
}

async function startEnroll() {
  try {
    enrolling.value = true;
    const resp = await mfaService.StartEnrollMethod({
      method: 'TOTP' as authenticationservicev1_MFAMethod,
    });
    enrollQrCode.value = resp.totp?.qr_code_data_uri ?? '';
    enrollSecret.value = resp.totp?.secret ?? '';
    enrollOperationId.value = resp.operation_id;
    enrollCode.value = '';
  } catch (error) {
    enrolling.value = false;
    notification.error({
      message: $t('page.auth.mfa.enrollFailed'),
      description: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function confirmEnroll() {
  if (!enrollCode.value.trim()) return;

  try {
    await mfaService.ConfirmEnrollMethod({
      method: 'TOTP' as authenticationservicev1_MFAMethod,
      operation_id: enrollOperationId.value,
      totp_code: enrollCode.value.trim(),
    });
    notification.success({ message: $t('page.auth.mfa.enrollSuccess') });
    enrolling.value = false;
    enrollQrCode.value = '';
    enrollSecret.value = '';
    await loadStatus();
  } catch (error) {
    notification.error({
      message: $t('page.auth.mfa.verifyFailed'),
      description: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function cancelEnroll() {
  enrolling.value = false;
  enrollQrCode.value = '';
  enrollSecret.value = '';
  enrollOperationId.value = '';
  enrollCode.value = '';
}

async function startWebAuthnEnroll() {
  if (!webauthnSupported) {
    notification.error({ message: $t('page.auth.mfa.webauthnNotSupported') });
    return;
  }

  try {
    webauthnEnrolling.value = true;

    // Step 1: Start WebAuthn enrollment
    const resp = await mfaService.StartEnrollMethod({
      method: 'WEBAUTHN' as authenticationservicev1_MFAMethod,
    });

    if (!resp.webauthn?.options_json) {
      throw new Error('No WebAuthn options received');
    }

    // Step 2: Invoke browser WebAuthn API (shows security key prompt)
    const attestation = await performRegistration(resp.webauthn.options_json);

    // Step 3: Confirm enrollment with the server
    await mfaService.ConfirmEnrollMethod({
      method: 'WEBAUTHN' as authenticationservicev1_MFAMethod,
      operation_id: resp.operation_id,
      webauthn: attestation,
      display: 'Security Key',
    });

    notification.success({ message: $t('page.auth.mfa.webauthnEnrollSuccess') });
    await loadStatus();
  } catch (error) {
    notification.error({
      message: $t('page.auth.mfa.webauthnEnrollFailed'),
      description: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    webauthnEnrolling.value = false;
  }
}

async function disableMFA() {
  Modal.confirm({
    title: $t('page.auth.mfa.disableConfirmTitle'),
    content: $t('page.auth.mfa.disableConfirmContent'),
    okType: 'danger',
    async onOk() {
      await mfaService.DisableMFA({});
      notification.success({ message: $t('page.auth.mfa.disableSuccess') });
      await loadStatus();
    },
  });
}

async function regenerateBackupCodes() {
  try {
    const resp = await mfaService.GenerateBackupCodes({ count: 10 });
    backupCodes.value = resp.codes;
    showBackupCodes.value = true;
  } catch (error) {
    notification.error({
      message: 'Failed to generate backup codes',
      description: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function revokeDevice(credentialId: string) {
  Modal.confirm({
    title: $t('page.auth.mfa.revokeConfirmTitle'),
    async onOk() {
      await mfaService.RevokeMFADevice({ credential_id: credentialId });
      notification.success({ message: $t('page.auth.mfa.revokeSuccess') });
      await loadStatus();
    },
  });
}

onMounted(loadStatus);
</script>

<template>
  <div class="mx-auto max-w-2xl p-4">
    <Card :loading="loading">
      <template #title>
        <Typography.Title :level="4" class="mb-0">
          {{ $t('page.auth.mfa.settingsTitle') }}
        </Typography.Title>
      </template>

      <!-- MFA Status -->
      <Descriptions :column="1" bordered class="mb-4">
        <DescriptionsItem :label="$t('page.auth.mfa.status')">
          <Tag :color="mfaEnabled ? 'green' : 'default'">
            {{ mfaEnabled ? $t('page.auth.mfa.enabled') : $t('page.auth.mfa.disabled') }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem
          v-if="mfaEnabled"
          :label="$t('page.auth.mfa.backupCodesRemaining')"
        >
          {{ backupCodesRemaining }}
        </DescriptionsItem>
      </Descriptions>

      <!-- Enrolled Methods -->
      <template v-if="enrolledMethods.length > 0">
        <Typography.Title :level="5">
          {{ $t('page.auth.mfa.enrolledMethods') }}
        </Typography.Title>
        <div v-for="m in enrolledMethods" :key="m.id" class="mb-2 flex items-center justify-between rounded border p-3">
          <div>
            <Tag color="blue">{{ m.method }}</Tag>
            <span class="ml-2">{{ m.display }}</span>
          </div>
          <Button danger size="small" @click="revokeDevice(m.id)">
            {{ $t('page.auth.mfa.revoke') }}
          </Button>
        </div>
      </template>

      <!-- Enroll MFA buttons (when no MFA enabled) -->
      <template v-if="!enrolling && !mfaEnabled">
        <div class="mt-4">
          <Space>
            <Button type="primary" @click="startEnroll">
              {{ $t('page.auth.mfa.enableTOTP') }}
            </Button>
            <Button
              v-if="webauthnSupported"
              type="primary"
              :loading="webauthnEnrolling"
              @click="startWebAuthnEnroll"
            >
              {{ $t('page.auth.mfa.enableSecurityKey') }}
            </Button>
          </Space>
        </div>
      </template>

      <!-- Add additional security key (when MFA already enabled) -->
      <template v-if="mfaEnabled && webauthnSupported && !enrolling">
        <div class="mt-4">
          <Button :loading="webauthnEnrolling" @click="startWebAuthnEnroll">
            {{ $t('page.auth.mfa.addSecurityKey') }}
          </Button>
        </div>
      </template>

      <!-- Enrollment QR Code -->
      <template v-if="enrolling">
        <Card class="mt-4">
          <Typography.Title :level="5">
            {{ $t('page.auth.mfa.scanQrCode') }}
          </Typography.Title>
          <div class="mb-4 text-center">
            <img
              v-if="enrollQrCode"
              :src="enrollQrCode"
              :alt="$t('page.auth.mfa.qrCodeAlt')"
              class="inline-block"
              style="width: 256px; height: 256px"
            />
          </div>
          <Alert
            v-if="enrollSecret"
            type="info"
            :message="$t('page.auth.mfa.manualEntry')"
            :description="enrollSecret"
            class="mb-4"
            show-icon
          />
          <div class="mb-2">
            <Input
              v-model:value="enrollCode"
              :placeholder="$t('page.auth.mfa.enterTotpCode')"
              :maxlength="6"
              @press-enter="confirmEnroll"
            />
          </div>
          <Space>
            <Button @click="cancelEnroll">{{ $t('common.cancel') }}</Button>
            <Button type="primary" @click="confirmEnroll">
              {{ $t('page.auth.mfa.confirmEnroll') }}
            </Button>
          </Space>
        </Card>
      </template>

      <!-- Backup Codes Section -->
      <template v-if="mfaEnabled">
        <div class="mt-4">
          <Space>
            <Button @click="regenerateBackupCodes">
              {{ $t('page.auth.mfa.regenerateBackupCodes') }}
            </Button>
            <Button danger @click="disableMFA">
              {{ $t('page.auth.mfa.disableMFA') }}
            </Button>
          </Space>
        </div>
      </template>

      <!-- Backup Codes Modal -->
      <Modal
        v-model:open="showBackupCodes"
        :title="$t('page.auth.mfa.backupCodesTitle')"
        :footer="null"
        :width="480"
      >
        <Alert
          type="warning"
          :message="$t('page.auth.mfa.backupCodesWarning')"
          class="mb-4"
          show-icon
        />
        <div class="grid grid-cols-2 gap-2">
          <div
            v-for="(bcode, idx) in backupCodes"
            :key="idx"
            class="rounded bg-gray-100 p-2 text-center font-mono"
          >
            {{ bcode }}
          </div>
        </div>
      </Modal>
    </Card>
  </div>
</template>
