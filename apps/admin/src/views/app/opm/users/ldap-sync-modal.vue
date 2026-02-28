<script lang="ts" setup>
import { ref, computed } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Alert, Button, notification, Table, Tag, Spin } from 'ant-design-vue';

import { $t } from '#/locales';
import { useUserListStore } from '#/stores';

const emit = defineEmits<{ success: [] }>();

const userListStore = useUserListStore();

const loading = ref(false);
const step = ref<'preview' | 'result'>('preview');
const preview = ref<any>(null);
const result = ref<any>(null);
const error = ref<string | null>(null);

const hasChanges = computed(() => {
  return (
    preview.value &&
    (preview.value.newCount > 0 || preview.value.updateCount > 0)
  );
});

const columns = [
  {
    title: $t('page.user.ldap.action'),
    dataIndex: 'action',
    key: 'action',
    width: 100,
  },
  {
    title: $t('page.user.ldap.username'),
    key: 'username',
    width: 150,
  },
  {
    title: $t('page.user.ldap.realname'),
    key: 'realname',
    width: 150,
  },
  {
    title: $t('page.user.ldap.email'),
    key: 'email',
    width: 200,
  },
  {
    title: $t('page.user.ldap.changedFields'),
    key: 'changedFields',
  },
];

function actionColor(action: string) {
  return action === 'ACTION_CREATE' ? 'green' : 'blue';
}

function actionLabel(action: string) {
  return action === 'ACTION_CREATE'
    ? $t('page.user.ldap.newUsers')
    : $t('page.user.ldap.updatedUsers');
}

function fieldLabel(field: string) {
  const map: Record<string, string> = {
    username: $t('page.user.form.username'),
    realname: $t('page.user.form.realname'),
    email: $t('page.user.form.email'),
    mobile: $t('page.user.form.mobile'),
  };
  return map[field] || field;
}

async function loadPreview() {
  loading.value = true;
  error.value = null;
  preview.value = null;

  try {
    preview.value = await userListStore.ldapSyncPreview();
  } catch (e: any) {
    error.value = e.message || 'LDAP sync failed';
  } finally {
    loading.value = false;
  }
}

async function handleApply() {
  loading.value = true;
  error.value = null;

  try {
    result.value = await userListStore.ldapSyncExecute();
    step.value = 'result';

    if (result.value.errorCount > 0) {
      notification.warning({
        message: $t('page.user.ldap.syncComplete'),
      });
    } else {
      notification.success({
        message: $t('page.user.ldap.syncSuccess'),
      });
    }

    emit('success');
  } catch (e: any) {
    error.value = e.message || 'LDAP sync failed';
  } finally {
    loading.value = false;
  }
}

function resetState() {
  step.value = 'preview';
  preview.value = null;
  result.value = null;
  error.value = null;
  loading.value = false;
}

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    modalApi.close();
  },

  onOpenChange(isOpen) {
    if (isOpen) {
      resetState();
      loadPreview();
    }
  },
});
</script>

<template>
  <Modal
    :title="$t('page.user.ldap.title')"
    :footer="false"
    class="w-[900px]"
  >
    <div class="space-y-4">
      <!-- Loading -->
      <div v-if="loading && step === 'preview'" class="py-12 text-center">
        <Spin size="large" />
        <p class="mt-4 text-gray-500">
          {{ $t('page.user.ldap.fetching') }}
        </p>
      </div>

      <!-- Error -->
      <Alert
        v-if="error"
        type="error"
        :message="error"
        show-icon
        class="mb-4"
      />

      <!-- Preview Step -->
      <template v-if="step === 'preview' && !loading && preview">
        <!-- Summary -->
        <div class="mb-4 flex items-center gap-4">
          <span class="text-sm text-gray-500">
            {{ $t('page.user.ldap.totalLdap') }}:
            <strong>{{ preview.totalLdapEntries }}</strong>
          </span>
          <Tag color="green">
            {{ $t('page.user.ldap.newUsers') }}: {{ preview.newCount }}
          </Tag>
          <Tag color="blue">
            {{ $t('page.user.ldap.updatedUsers') }}: {{ preview.updateCount }}
          </Tag>
          <Tag>
            {{ $t('page.user.ldap.unchanged') }}: {{ preview.unchangedCount }}
          </Tag>
        </div>

        <!-- Warnings -->
        <Alert
          v-if="preview.warnings && preview.warnings.length > 0"
          type="warning"
          :message="$t('page.user.ldap.warnings')"
          show-icon
          class="mb-4"
        >
          <template #description>
            <ul class="mt-1 list-inside list-disc">
              <li v-for="w in preview.warnings" :key="w">{{ w }}</li>
            </ul>
          </template>
        </Alert>

        <!-- No Changes -->
        <Alert
          v-if="!hasChanges"
          type="info"
          :message="$t('page.user.ldap.noChanges')"
          show-icon
        />

        <!-- Changes Table -->
        <Table
          v-if="hasChanges"
          :data-source="preview.changes"
          :columns="columns"
          :pagination="false"
          :scroll="{ y: 400 }"
          size="small"
          row-key="ldapDn"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action'">
              <Tag :color="actionColor(record.action)">
                {{ actionLabel(record.action) }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'username'">
              {{ record.user?.username || '-' }}
            </template>
            <template v-else-if="column.key === 'realname'">
              {{ record.user?.realname || '-' }}
            </template>
            <template v-else-if="column.key === 'email'">
              {{ record.user?.email || '-' }}
            </template>
            <template v-else-if="column.key === 'changedFields'">
              <template v-if="record.changedFields?.length">
                <Tag
                  v-for="f in record.changedFields"
                  :key="f"
                  size="small"
                  class="mr-1"
                >
                  {{ fieldLabel(f) }}
                </Tag>
              </template>
              <span v-else class="text-gray-400">-</span>
            </template>
          </template>
        </Table>

        <!-- Apply Button -->
        <div v-if="hasChanges" class="mt-4 flex justify-end">
          <Button type="primary" :loading="loading" @click="handleApply">
            {{ $t('page.user.ldap.sync') }}
          </Button>
        </div>
      </template>

      <!-- Result Step -->
      <template v-if="step === 'result' && result">
        <Alert
          :type="result.errorCount > 0 ? 'warning' : 'success'"
          :message="$t('page.user.ldap.syncComplete')"
          show-icon
          class="mb-4"
        />

        <div class="mb-4 flex items-center gap-4">
          <Tag color="green">
            {{ $t('page.user.ldap.created') }}: {{ result.createdCount }}
          </Tag>
          <Tag color="blue">
            {{ $t('page.user.ldap.updated') }}: {{ result.updatedCount }}
          </Tag>
          <Tag v-if="result.skippedCount > 0">
            {{ $t('page.user.ldap.skipped') }}: {{ result.skippedCount }}
          </Tag>
          <Tag v-if="result.errorCount > 0" color="red">
            {{ $t('page.user.ldap.errors') }}: {{ result.errorCount }}
          </Tag>
        </div>

        <Alert
          v-if="result.errors && result.errors.length > 0"
          type="error"
          :message="$t('page.user.ldap.errors')"
          show-icon
        >
          <template #description>
            <ul class="mt-1 list-inside list-disc">
              <li v-for="e in result.errors" :key="e">{{ e }}</li>
            </ul>
          </template>
        </Alert>

        <div class="mt-4 flex justify-end">
          <Button @click="modalApi.close()">
            {{ $t('ui.button.close') }}
          </Button>
        </div>
      </template>
    </div>
  </Modal>
</template>
