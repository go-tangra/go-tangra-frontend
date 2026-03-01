<script lang="ts" setup>

import type { userservicev1_User as User } from '#/generated/api/admin/service/v1';

import { computed, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';

import {
  Avatar,
  Col,
  notification,
  Row,
  Upload,
} from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { genderList, useUserProfileStore } from '#/stores';

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

const userProfileStore = useUserProfileStore();
const avatarLoading = ref(false);

const data = ref<null | User>();

const currentAvatar = computed(() => data.value?.avatar || '');
const userInitials = computed(() => {
  const name = data.value?.nickname || data.value?.realname || data.value?.username || '';
  return name.slice(0, 1).toUpperCase();
});

function beforeAvatarUpload(file: File): boolean {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    notification.error({ message: $t('page.profile.avatarInvalidType') });
    return false;
  }
  if (file.size > MAX_AVATAR_SIZE) {
    notification.error({ message: $t('page.profile.avatarFileTooLarge') });
    return false;
  }
  return true;
}

async function handleAvatarUpload(options: any) {
  const { file } = options;
  avatarLoading.value = true;
  try {
    const base64 = await fileToBase64(file);
    await userProfileStore.uploadAvatarBase64(base64);
    await reload();
  } catch {
    notification.error({ message: $t('page.profile.avatarUploadFailed') });
  } finally {
    avatarLoading.value = false;
  }
}

async function handleDeleteAvatar() {
  avatarLoading.value = true;
  try {
    await userProfileStore.deleteAvatar();
    await reload();
  } catch {
    notification.error({ message: $t('page.profile.avatarDeleteFailed') });
  } finally {
    avatarLoading.value = false;
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const [BaseForm, baseFormApi] = useVbenForm({
  showDefaultActions: false,
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  schema: [
    {
      fieldName: 'nickname',
      component: 'Input',
      label: $t('page.user.table.nickname'),
    },
    {
      fieldName: 'realname',
      component: 'Input',
      label: $t('page.user.table.realname'),
    },
    {
      fieldName: 'email',
      component: 'Input',
      label: $t('page.user.table.email'),
    },
    {
      fieldName: 'mobile',
      component: 'Input',
      label: $t('page.user.table.mobile'),
    },
    {
      fieldName: 'telephone',
      component: 'Input',
      label: $t('page.user.table.telephone'),
    },
    {
      fieldName: 'gender',
      component: 'Select',
      label: $t('page.user.table.gender'),
      componentProps: {
        filterOption: (input: string, option: any) =>
          option.label.toLowerCase().includes(input.toLowerCase()),
        allowClear: true,
        showSearch: true,
        options: genderList,
        placeholder: $t('ui.placeholder.select'),
      },
    },
    {
      fieldName: 'region',
      component: 'Input',
      label: $t('page.user.table.region'),
    },
    {
      fieldName: 'address',
      component: 'Input',
      label: $t('page.user.table.address'),
    },
    {
      fieldName: 'description',
      component: 'Textarea',
      label: $t('page.user.table.description'),
    },
  ],
});

async function handleSubmit() {
  console.log('submit');

  // Verify entered data
  const validate = await baseFormApi.validate();
  if (!validate.valid) {
    return;
  }

  setLoading(true);

  // Get form data
  const values = await baseFormApi.getValues();

  try {
    await userProfileStore.updateUser(values);

    notification.success({
      message: $t('ui.notification.update_success'),
    });
  } catch {
    notification.error({
      message: $t('ui.notification.update_failed'),
    });
  } finally {
    setLoading(false);
  }
}

function setLoading(_loading: boolean) {}

/**
 * Reload user information
 */
async function reload() {
  data.value = await userProfileStore.getMe();
  await baseFormApi.setValues(data.value || {});
}

reload();
</script>

<template>
  <Page
    :title="$t('page.user.profile.tab.basicSettings')"
    :body-style="{ padding: 0 }"
    class="edge-card"
    style="margin: 0"
  >
    <Row :gutter="24">
      <Col :span="14">
        <BaseForm />
      </Col>
      <Col :span="10">
        <div class="change-avatar">
          <div class="mb-2">{{ $t('page.user.table.avatar') }}</div>
          <div class="avatar-wrapper">
            <Avatar
              :size="120"
              :src="currentAvatar || undefined"
              style="font-size: 48px; background-color: #1890ff"
            >
              {{ currentAvatar ? '' : userInitials }}
            </Avatar>
          </div>
          <div class="avatar-actions">
            <Upload
              accept="image/*"
              :before-upload="beforeAvatarUpload"
              :custom-request="handleAvatarUpload"
              :show-upload-list="false"
            >
              <a-button :loading="avatarLoading" type="primary" size="small">
                {{ $t('page.user.table.avatar') }}
              </a-button>
            </Upload>
            <a-button
              v-if="currentAvatar"
              :loading="avatarLoading"
              danger
              size="small"
              @click="handleDeleteAvatar"
            >
              {{ $t('ui.button.remove') }}
            </a-button>
          </div>
        </div>
      </Col>
    </Row>
    <a-button type="primary" @click="handleSubmit">
      {{ $t('page.user.button.updateUserInfo') }}
    </a-button>
  </Page>
</template>

<style lang="less" scoped>
.change-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;

  .avatar-wrapper {
    margin-bottom: 16px;
  }

  .avatar-actions {
    display: flex;
    gap: 8px;
  }
}

.edge-card {
  .ant-card-body {
    padding: 0 !important;
  }
}
</style>
