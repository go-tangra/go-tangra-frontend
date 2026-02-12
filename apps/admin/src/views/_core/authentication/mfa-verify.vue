<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { $t } from '@vben/locales';

import { Button, Card, Input, notification, Radio, Typography } from 'ant-design-vue';

import { useAuthStore } from '#/stores';
import { isWebAuthnSupported } from '#/utils/webauthn';

defineOptions({ name: 'MFAVerify' });

const authStore = useAuthStore();
const router = useRouter();

const code = ref('');
const loading = ref(false);

const webauthnSupported = isWebAuthnSupported();

// Pick the first available method as default (prefer TOTP > WEBAUTHN > BACKUP_CODE)
const defaultMethod = computed(() => {
  const m = authStore.mfaMethods;
  if (m.includes('TOTP')) return 'TOTP';
  if (webauthnSupported && m.includes('WEBAUTHN')) return 'WEBAUTHN';
  if (m.includes('BACKUP_CODE')) return 'BACKUP_CODE';
  return 'TOTP';
});

const method = ref<'BACKUP_CODE' | 'TOTP' | 'WEBAUTHN'>(defaultMethod.value);

async function handleVerify() {
  if (method.value === 'WEBAUTHN') {
    loading.value = true;
    try {
      await authStore.verifyMFAWebAuthn();
    } finally {
      loading.value = false;
    }
    return;
  }

  if (!code.value.trim()) {
    notification.warning({
      message: $t('page.auth.mfa.enterCode'),
    });
    return;
  }

  loading.value = true;
  try {
    await authStore.verifyMFA(code.value.trim(), method.value);
  } finally {
    loading.value = false;
  }
}

function handleBack() {
  authStore.$reset();
  router.push(LOGIN_PATH);
}

// Redirect if no MFA pending
if (!authStore.mfaPending) {
  router.replace(LOGIN_PATH);
}
</script>

<template>
  <div class="mx-auto mt-16 max-w-md px-4">
    <Card>
      <template #title>
        <Typography.Title :level="4" class="mb-0">
          {{ $t('page.auth.mfa.title') }}
        </Typography.Title>
      </template>

      <Typography.Paragraph type="secondary" class="mb-4">
        {{ $t('page.auth.mfa.description') }}
      </Typography.Paragraph>

      <div class="mb-4">
        <Radio.Group v-model:value="method" button-style="solid" class="w-full">
          <Radio.Button
            v-if="authStore.mfaMethods.includes('TOTP')"
            value="TOTP"
            class="text-center"
          >
            {{ $t('page.auth.mfa.authenticatorApp') }}
          </Radio.Button>
          <Radio.Button
            v-if="webauthnSupported && authStore.mfaMethods.includes('WEBAUTHN')"
            value="WEBAUTHN"
            class="text-center"
          >
            {{ $t('page.auth.mfa.securityKey') }}
          </Radio.Button>
          <Radio.Button
            v-if="authStore.mfaMethods.includes('BACKUP_CODE')"
            value="BACKUP_CODE"
            class="text-center"
          >
            {{ $t('page.auth.mfa.backupCode') }}
          </Radio.Button>
        </Radio.Group>
      </div>

      <!-- Code input for TOTP / Backup Code -->
      <div v-if="method !== 'WEBAUTHN'" class="mb-4">
        <Input
          v-model:value="code"
          :placeholder="
            method === 'TOTP'
              ? $t('page.auth.mfa.enterTotpCode')
              : $t('page.auth.mfa.enterBackupCode')
          "
          size="large"
          :maxlength="method === 'TOTP' ? 6 : 8"
          @press-enter="handleVerify"
        />
      </div>

      <!-- WebAuthn prompt -->
      <div v-if="method === 'WEBAUTHN'" class="mb-4">
        <Typography.Paragraph class="text-center">
          {{ $t('page.auth.mfa.webauthnPrompt') }}
        </Typography.Paragraph>
      </div>

      <div class="flex gap-2">
        <Button block @click="handleBack">
          {{ $t('common.back') }}
        </Button>
        <Button type="primary" block :loading="loading" @click="handleVerify">
          {{ $t('page.auth.mfa.verify') }}
        </Button>
      </div>
    </Card>
  </div>
</template>
