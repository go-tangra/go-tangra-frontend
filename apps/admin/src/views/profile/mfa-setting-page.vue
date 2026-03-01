<script lang="ts" setup>
import type {
  authenticationservicev1_EnrolledMethod,
  authenticationservicev1_MFAMethod,
  authenticationservicev1_WebAuthnAssertion,
} from '#/generated/api/admin/service/v1';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';

import {
  Alert,
  Button,
  Input,
  List,
  ListItem,
  ListItemMeta,
  Modal,
  notification,
  Space,
  Tag,
} from 'ant-design-vue';

import { createMFAServiceClient } from '#/generated/api/admin/service/v1';
import { requestClientRequestHandler } from '#/utils/request';
import { isWebAuthnSupported, performRegistration } from '#/utils/webauthn';

defineOptions({ name: 'MFASettings' });

const MFA_METHOD_TOTP: authenticationservicev1_MFAMethod = 'TOTP';
const MFA_METHOD_WEBAUTHN: authenticationservicev1_MFAMethod = 'WEBAUTHN';
const BACKUP_CODES_COUNT = 10;

const mfaService = createMFAServiceClient(requestClientRequestHandler);

const mfaEnabled = ref(false);
const enrolledMethods = ref<authenticationservicev1_EnrolledMethod[]>([]);
const backupCodesRemaining = ref(0);
const loading = ref(false);

// TOTP enrollment state
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

const hasEnrolledMethods = computed(() => enrolledMethods.value.length > 0);

function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function resetEnrollState(): void {
  enrolling.value = false;
  enrollQrCode.value = '';
  enrollSecret.value = '';
  enrollOperationId.value = '';
  enrollCode.value = '';
}

async function loadStatus(): Promise<void> {
  loading.value = true;
  try {
    const status = await mfaService.GetMFAStatus({});
    mfaEnabled.value = status.enabled ?? false;
    enrolledMethods.value = status.enrolled ?? [];

    if (status.enabled) {
      const bcResp = await mfaService.ListBackupCodes({});
      backupCodesRemaining.value = bcResp.remaining ?? 0;
    }
  } catch (error) {
    console.error('Failed to load MFA status:', error);
  } finally {
    loading.value = false;
  }
}

async function startEnroll(): Promise<void> {
  try {
    enrolling.value = true;
    const resp = await mfaService.StartEnrollMethod({
      method: MFA_METHOD_TOTP,
    });
    enrollQrCode.value = resp.totp?.qr_code_data_uri ?? '';
    enrollSecret.value = resp.totp?.secret ?? '';
    enrollOperationId.value = resp.operation_id ?? '';
    enrollCode.value = '';
  } catch (error) {
    enrolling.value = false;
    notification.error({
      message: $t('page.auth.mfa.enrollFailed'),
      description: formatErrorMessage(error),
    });
  }
}

async function confirmEnroll(): Promise<void> {
  const code = enrollCode.value.trim();
  if (!code) return;

  try {
    await mfaService.ConfirmEnrollMethod({
      method: MFA_METHOD_TOTP,
      operation_id: enrollOperationId.value,
      totp_code: code,
    });
    notification.success({ message: $t('page.auth.mfa.enrollSuccess') });
    resetEnrollState();
    await loadStatus();
  } catch (error) {
    notification.error({
      message: $t('page.auth.mfa.verifyFailed'),
      description: formatErrorMessage(error),
    });
  }
}

async function startWebAuthnEnroll(): Promise<void> {
  if (!webauthnSupported) {
    notification.error({ message: $t('page.auth.mfa.webauthnNotSupported') });
    return;
  }

  try {
    webauthnEnrolling.value = true;

    const resp = await mfaService.StartEnrollMethod({
      method: MFA_METHOD_WEBAUTHN,
    });

    if (!resp.webauthn?.options_json) {
      throw new Error('No WebAuthn options received');
    }

    const registration = await performRegistration(resp.webauthn.options_json);
    const attestation: authenticationservicev1_WebAuthnAssertion = {
      ...registration,
      signature: undefined,
    };

    await mfaService.ConfirmEnrollMethod({
      method: MFA_METHOD_WEBAUTHN,
      operation_id: resp.operation_id,
      webauthn: attestation,
      display: 'Security Key',
    });

    notification.success({
      message: $t('page.auth.mfa.webauthnEnrollSuccess'),
    });
    await loadStatus();
  } catch (error) {
    notification.error({
      message: $t('page.auth.mfa.webauthnEnrollFailed'),
      description: formatErrorMessage(error),
    });
  } finally {
    webauthnEnrolling.value = false;
  }
}

function disableMFA(): void {
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

async function regenerateBackupCodes(): Promise<void> {
  try {
    const resp = await mfaService.GenerateBackupCodes({
      count: BACKUP_CODES_COUNT,
    });
    backupCodes.value = resp.codes ?? [];
    showBackupCodes.value = true;
  } catch (error) {
    notification.error({
      message: $t('page.auth.mfa.regenerateBackupCodes'),
      description: formatErrorMessage(error),
    });
  }
}

function revokeDevice(credentialId: string): void {
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
  <Page :title="$t('page.auth.mfa.settingsTitle')" :loading="loading">
    <!-- MFA Status -->
    <div class="mb-4">
      <span class="mr-2">{{ $t('page.auth.mfa.status') }}:</span>
      <Tag :color="mfaEnabled ? 'green' : 'default'">
        {{
          mfaEnabled
            ? $t('page.auth.mfa.enabled')
            : $t('page.auth.mfa.disabled')
        }}
      </Tag>
      <span v-if="mfaEnabled" class="ml-4">
        {{ $t('page.auth.mfa.backupCodesRemaining') }}:
        {{ backupCodesRemaining }}
      </span>
    </div>

    <!-- Not Enabled Info -->
    <Alert
      v-if="!mfaEnabled && !enrolling"
      type="info"
      :message="$t('page.auth.mfa.notEnabledTitle')"
      :description="$t('page.auth.mfa.notEnabledDescription')"
      class="mb-4"
      show-icon
    />

    <!-- Enrolled Methods -->
    <template v-if="hasEnrolledMethods">
      <List :data-source="enrolledMethods" item-layout="horizontal" bordered>
        <template #renderItem="{ item }">
          <ListItem>
            <ListItemMeta>
              <template #title>
                <Tag color="blue">{{ item.method }}</Tag>
                <span class="ml-2">{{ item.display }}</span>
              </template>
            </ListItemMeta>
            <template #actions>
              <Button danger size="small" @click="revokeDevice(item.id)">
                {{ $t('page.auth.mfa.revoke') }}
              </Button>
            </template>
          </ListItem>
        </template>
      </List>
    </template>

    <!-- Enroll MFA buttons (when no MFA enabled) -->
    <div v-if="!enrolling && !mfaEnabled" class="mt-4">
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

    <!-- Add additional security key (when MFA already enabled) -->
    <div v-if="mfaEnabled && webauthnSupported && !enrolling" class="mt-4">
      <Button :loading="webauthnEnrolling" @click="startWebAuthnEnroll">
        {{ $t('page.auth.mfa.addSecurityKey') }}
      </Button>
    </div>

    <!-- TOTP Enrollment Flow -->
    <div v-if="enrolling" class="mt-4 rounded border p-4">
      <h4 class="mb-4">{{ $t('page.auth.mfa.scanQrCode') }}</h4>
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
        <Button @click="resetEnrollState">{{ $t('common.cancel') }}</Button>
        <Button type="primary" @click="confirmEnroll">
          {{ $t('page.auth.mfa.confirmEnroll') }}
        </Button>
      </Space>
    </div>

    <!-- Backup Codes & Disable Section -->
    <div v-if="mfaEnabled" class="mt-4">
      <Space>
        <Button @click="regenerateBackupCodes">
          {{ $t('page.auth.mfa.regenerateBackupCodes') }}
        </Button>
        <Button danger @click="disableMFA">
          {{ $t('page.auth.mfa.disableMFA') }}
        </Button>
      </Space>
    </div>

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
          class="rounded bg-gray-100 p-2 text-center font-mono text-gray-900 dark:bg-gray-700 dark:text-gray-100"
        >
          {{ bcode }}
        </div>
      </div>
    </Modal>
  </Page>
</template>
