<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import { List, Switch } from 'ant-design-vue';

const ListItem = List.Item;
const ListItemMeta = List.Item.Meta;

const msgNotifyList = [
  {
    key: '1',
    title: 'Account Password',
    description: 'Messages from other users will be sent via in-site notifications',
  },
  {
    key: '2',
    title: 'System Message',
    description: 'System messages will be sent via in-site notifications',
  },
  {
    key: '3',
    title: 'To-do Tasks',
    description: 'Tasks to be completed will be notified via in-site message',
  },
];
</script>

<template>
  <Page :title="$t('page.user.profile.tab.notification')">
    <List>
      <template v-for="item in msgNotifyList" :key="item.key">
        <ListItem>
          <ListItemMeta>
            <template #title>
              {{ item.title }}
              <Switch
                class="extra"
                checked-children="开"
                un-checked-children="关"
                default-checked
              />
            </template>
            <template #description>
              <div>{{ item.description }}</div>
            </template>
          </ListItemMeta>
        </ListItem>
      </template>
    </List>
  </Page>
</template>

<style lang="less" scoped>
.extra {
  float: right;
  margin-top: 10px;
  margin-right: 30px;
}
</style>
