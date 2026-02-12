<script lang="ts" setup>
import type { userservicev1_User } from '#/generated/api/admin/service/v1';

import { onMounted, ref } from 'vue';

import { $t } from '@vben/locales';
import { useUserStore } from '@vben/stores';

import {
  Button,
  Card,
  Descriptions,
  DescriptionsItem,
  Form,
  FormItem,
  Input,
  notification,
  Tabs,
  TabPane,
  Typography,
} from 'ant-design-vue';

import { createUserProfileServiceClient } from '#/generated/api/admin/service/v1';
import { requestClientRequestHandler } from '#/utils/request';

import MFASettings from './mfa-settings.vue';

defineOptions({ name: 'ProfilePage' });

const userProfileService = createUserProfileServiceClient(requestClientRequestHandler);
const userStore = useUserStore();

const user = ref<userservicev1_User | null>(null);
const loading = ref(false);

// Change password state
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});
const changingPassword = ref(false);

async function loadProfile() {
  loading.value = true;
  try {
    user.value = await userProfileService.GetUser({});
  } catch (error) {
    console.error('Failed to load profile:', error);
  } finally {
    loading.value = false;
  }
}

async function handleChangePassword() {
  if (!passwordForm.value.oldPassword || !passwordForm.value.newPassword) {
    notification.warning({ message: $t('page.profile.passwordRequired') });
    return;
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    notification.warning({ message: $t('page.profile.passwordMismatch') });
    return;
  }

  changingPassword.value = true;
  try {
    await userProfileService.ChangePassword({
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword,
    });
    notification.success({ message: $t('page.profile.passwordChanged') });
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
  } catch (error) {
    notification.error({
      message: $t('page.profile.passwordChangeFailed'),
      description: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    changingPassword.value = false;
  }
}

onMounted(loadProfile);
</script>

<template>
  <div class="mx-auto max-w-3xl p-4">
    <Typography.Title :level="3" class="mb-4">
      {{ $t('page.profile.title') }}
    </Typography.Title>

    <Tabs default-active-key="info">
      <TabPane key="info" :tab="$t('page.profile.basicInfo')">
        <Card :loading="loading">
          <Descriptions :column="1" bordered>
            <DescriptionsItem :label="$t('page.user.form.username')">
              {{ user?.username }}
            </DescriptionsItem>
            <DescriptionsItem :label="$t('page.user.form.realname')">
              {{ user?.realname }}
            </DescriptionsItem>
            <DescriptionsItem :label="$t('page.user.form.nickname')">
              {{ user?.nickname }}
            </DescriptionsItem>
            <DescriptionsItem :label="$t('page.user.form.email')">
              {{ user?.email }}
            </DescriptionsItem>
            <DescriptionsItem :label="$t('page.user.form.mobile')">
              {{ user?.mobile }}
            </DescriptionsItem>
            <DescriptionsItem :label="$t('page.user.form.role')">
              {{ user?.roleNames?.join(', ') }}
            </DescriptionsItem>
          </Descriptions>
        </Card>
      </TabPane>

      <TabPane key="password" :tab="$t('page.profile.changePassword')">
        <Card>
          <Form layout="vertical" style="max-width: 400px">
            <FormItem :label="$t('page.user.form.oldPassword')">
              <Input.Password v-model:value="passwordForm.oldPassword" />
            </FormItem>
            <FormItem :label="$t('page.user.form.newPassword')">
              <Input.Password v-model:value="passwordForm.newPassword" />
            </FormItem>
            <FormItem :label="$t('page.user.form.confirmPassword')">
              <Input.Password
                v-model:value="passwordForm.confirmPassword"
                @press-enter="handleChangePassword"
              />
            </FormItem>
            <FormItem>
              <Button
                type="primary"
                :loading="changingPassword"
                @click="handleChangePassword"
              >
                {{ $t('page.profile.changePassword') }}
              </Button>
            </FormItem>
          </Form>
        </Card>
      </TabPane>

      <TabPane key="mfa" :tab="$t('page.auth.mfa.settingsTitle')">
        <MFASettings />
      </TabPane>
    </Tabs>
  </div>
</template>
