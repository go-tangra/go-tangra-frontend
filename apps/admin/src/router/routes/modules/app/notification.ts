import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';
import { $t } from '#/locales';

const notification: RouteRecordRaw[] = [
  {
    path: '/notification',
    name: 'NotificationManagement',
    redirect: '/notification/channels',
    component: BasicLayout,
    meta: {
      order: 2010,
      icon: 'lucide:bell',
      title: $t('menu.notification.moduleName'),
      keepAlive: true,
      authority: ['platform:admin', 'tenant:manager'],
    },
    children: [
      {
        path: 'channels',
        name: 'NotificationChannelList',
        meta: {
          icon: 'lucide:radio',
          title: $t('menu.notification.channel'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () =>
          import('#/views/app/notification/channel/index.vue'),
      },
      {
        path: 'templates',
        name: 'NotificationTemplateList',
        meta: {
          icon: 'lucide:file-text',
          title: $t('menu.notification.template'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () =>
          import('#/views/app/notification/template/index.vue'),
      },
      {
        path: 'logs',
        name: 'NotificationLogList',
        meta: {
          icon: 'lucide:scroll-text',
          title: $t('menu.notification.log'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () =>
          import('#/views/app/notification/log/index.vue'),
      },
    ],
  },
];

export default notification;
