import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';
import { $t } from '#/locales';

const bookmark: RouteRecordRaw[] = [
  {
    path: '/bookmark',
    name: 'Bookmark',
    component: BasicLayout,
    redirect: '/bookmark/list',
    meta: {
      order: 2050,
      icon: 'lucide:bookmark',
      title: $t('bookmark.menu.bookmark'),
      keepAlive: true,
      authority: ['platform:admin', 'tenant:manager'],
    },
    children: [
      {
        path: 'list',
        name: 'BookmarkList',
        meta: {
          icon: 'lucide:list',
          title: $t('bookmark.menu.list'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () => import('#/views/app/bookmark/list/index.vue'),
      },
      {
        path: 'permissions',
        name: 'BookmarkPermissions',
        meta: {
          icon: 'lucide:shield',
          title: $t('bookmark.menu.permissions'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () =>
          import('#/views/app/bookmark/permissions/index.vue'),
      },
    ],
  },
];

export default bookmark;
