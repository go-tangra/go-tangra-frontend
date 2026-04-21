<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { baseRequestClient } from '#/utils/request';

defineOptions({ name: 'Activate' });

const route = useRoute();
const router = useRouter();

const token = computed(() => String(route.query.token ?? ''));

const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);

// Mirror the backend policy so the user sees clear, specific feedback before
// we even make the request. Any divergence with validators/password.go will
// simply be caught again server-side — keeping this list short is fine.
type Rule = { id: string; label: string; test: (pw: string) => boolean };
const rules: Rule[] = [
  { id: 'len', label: 'At least 12 characters', test: (pw) => pw.length >= 12 },
  {
    id: 'upper',
    label: 'At least one uppercase letter',
    test: (pw) => /\p{Lu}/u.test(pw),
  },
  {
    id: 'lower',
    label: 'At least one lowercase letter',
    test: (pw) => /\p{Ll}/u.test(pw),
  },
  { id: 'digit', label: 'At least one digit', test: (pw) => /\d/.test(pw) },
  {
    id: 'symbol',
    label: 'At least one symbol',
    test: (pw) => /[^\p{L}\p{N}\s]/u.test(pw),
  },
  {
    id: 'nospace',
    label: 'No whitespace',
    test: (pw) => pw.length > 0 && !/\s/.test(pw),
  },
];

const ruleStatuses = computed(() =>
  rules.map((r) => ({ ...r, ok: r.test(newPassword.value) })),
);

const allRulesPass = computed(() => ruleStatuses.value.every((r) => r.ok));
const passwordsMatch = computed(
  () =>
    confirmPassword.value.length > 0 &&
    newPassword.value === confirmPassword.value,
);

const canSubmit = computed(
  () => !!token.value && allRulesPass.value && passwordsMatch.value && !loading.value,
);

async function onSubmit() {
  if (!canSubmit.value) return;
  loading.value = true;
  try {
    await baseRequestClient.post('/admin/v1/auth/activate', {
      token: token.value,
      newPassword: newPassword.value,
    });
    await message.success($t('page.activate.success'));
    await router.replace('/auth/login');
  } catch (err: any) {
    // message already shown globally by the base request interceptor.
    // eslint-disable-next-line no-console
    console.error('activation failed', err);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="activate-wrapper">
    <div class="activate-card">
      <h1 class="activate-title">{{ $t('page.activate.title') }}</h1>
      <p class="activate-intro">{{ $t('page.activate.intro') }}</p>

      <template v-if="!token">
        <div class="activate-error">
          {{ $t('page.activate.missingToken') }}
        </div>
      </template>

      <template v-else>
        <form class="activate-form" @submit.prevent="onSubmit">
          <label class="activate-label">
            <span>{{ $t('page.activate.newPassword') }}</span>
            <input
              v-model="newPassword"
              autocomplete="new-password"
              class="activate-input"
              type="password"
            />
          </label>

          <label class="activate-label">
            <span>{{ $t('page.activate.confirmPassword') }}</span>
            <input
              v-model="confirmPassword"
              autocomplete="new-password"
              class="activate-input"
              type="password"
            />
          </label>

          <ul class="activate-rules">
            <li
              v-for="rule in ruleStatuses"
              :key="rule.id"
              :class="{ ok: rule.ok }"
            >
              <span class="activate-rule-marker">{{ rule.ok ? '✔' : '•' }}</span>
              {{ rule.label }}
            </li>
            <li :class="{ ok: passwordsMatch }">
              <span class="activate-rule-marker">
                {{ passwordsMatch ? '✔' : '•' }}
              </span>
              {{ $t('page.activate.mustMatch') }}
            </li>
          </ul>

          <button
            :disabled="!canSubmit"
            class="activate-submit"
            type="submit"
          >
            {{
              loading
                ? $t('page.activate.submitting')
                : $t('page.activate.submit')
            }}
          </button>
        </form>
      </template>
    </div>
  </div>
</template>

<style scoped>
.activate-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: var(--background, #f5f5f5);
}
.activate-card {
  width: 100%;
  max-width: 420px;
  padding: 32px;
  background: var(--background-panel, #fff);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
.activate-title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 8px;
}
.activate-intro {
  font-size: 13px;
  color: var(--foreground-muted, #666);
  margin-bottom: 20px;
}
.activate-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.activate-label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}
.activate-input {
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  background: #fff;
}
.activate-input:focus {
  border-color: #1677ff;
  outline: none;
}
.activate-rules {
  list-style: none;
  padding: 0;
  margin: 4px 0 12px 0;
  font-size: 12px;
  color: #888;
}
.activate-rules li {
  padding: 2px 0;
}
.activate-rules li.ok {
  color: #52c41a;
}
.activate-rule-marker {
  display: inline-block;
  width: 18px;
}
.activate-submit {
  padding: 10px 16px;
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}
.activate-submit:disabled {
  background: #bfbfbf;
  cursor: not-allowed;
}
.activate-error {
  padding: 12px;
  background: #fff1f0;
  border: 1px solid #ffa39e;
  color: #cf1322;
  border-radius: 4px;
  font-size: 13px;
}
</style>
