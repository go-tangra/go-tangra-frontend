import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';
import { $t } from '#/locales';

const warden: RouteRecordRaw[] = [
  {
    path: '/warden',
    name: 'Warden',
    component: BasicLayout,
    redirect: '/warden/secrets',
    meta: {
      order: 2010,
      icon: 'lucide:key-round',
      title: $t('warden.menu.warden'),
      keepAlive: true,
      authority: ['platform:admin', 'tenant:manager'],
    },
    children: [
      {
        path: 'secrets',
        name: 'WardenSecrets',
        meta: {
          icon: 'lucide:lock',
          title: $t('warden.menu.secrets'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () => import('#/views/app/warden/folder/index.vue'),
      },
    ],
  },
];

export default warden;
