import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';
import { $t } from '#/locales';

const sharing: RouteRecordRaw[] = [
  {
    path: '/sharing',
    name: 'Sharing',
    component: BasicLayout,
    redirect: '/sharing/links',
    meta: {
      order: 2040,
      icon: 'lucide:share-2',
      title: $t('sharing.menu.sharing'),
      keepAlive: true,
      authority: ['platform:admin', 'tenant:manager'],
    },
    children: [
      {
        path: 'links',
        name: 'SharingLinks',
        meta: {
          icon: 'lucide:link',
          title: $t('sharing.menu.links'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () => import('#/views/app/sharing/links/index.vue'),
      },
      {
        path: 'templates',
        name: 'SharingTemplates',
        meta: {
          icon: 'lucide:mail',
          title: $t('sharing.menu.templates'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () => import('#/views/app/sharing/templates/index.vue'),
      },
    ],
  },
];

export default sharing;
