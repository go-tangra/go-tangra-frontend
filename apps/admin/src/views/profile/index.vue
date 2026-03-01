<script lang="ts" setup>
import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';

import BaseSettingPage from './base-setting-page.vue';
import EditPasswordPage from './edit-password-page.vue';
import MsgNotifyPage from './msg-notify-page.vue';
import MFASettingsPage from './mfa-setting-page.vue';

const settingList = [
  {
    key: '1',
    name: $t('page.user.profile.tab.basicSettings'),
    component: BaseSettingPage,
  },
  {
    key: '2',
    name: $t('page.user.profile.tab.editPassword'),
    component: EditPasswordPage,
  },
  {
    key: '3',
    name: $t('page.user.profile.tab.notification'),
    component: MsgNotifyPage,
  },
  {
    key: '4',
    name: $t('page.user.profile.tab.mfaSettings'),
    component: MFASettingsPage,
  },
];
</script>

<template>
  <Page auto-content-height>
    <a-card>
      <a-tabs
        tab-position="left"
        :tab-bar-style="{ width: '220px' }"
        class="edge-tabs"
      >
        <template v-for="item in settingList" :key="item.key">
          <a-tab-pane :tab="item.name">
            <component :is="item.component" />
          </a-tab-pane>
        </template>
      </a-tabs>
    </a-card>
  </Page>
</template>

<style lang="less">
.edge-tabs {
  margin: 0;
}

/* Use Vue scoped depth selector to override Antd's default padding/margin */
.edge-tabs,
::v-deep(.ant-tabs-content, .ant-tabs-content-holder, .ant-tabs-tabpane) {
  padding: 0 !important;
  margin: 0 !important;
  box-sizing: border-box;
}
</style>
