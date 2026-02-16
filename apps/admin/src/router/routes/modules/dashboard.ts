import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'lucide:layout-dashboard',
      order: -1,
      title: $t('page.dashboard.title'),
      authority: ['platform:admin', 'tenant:manager'],
    },
    name: 'Dashboard',
    path: '/dashboard',
    redirect: '/dashboard/overview',
    children: [
      {
        name: 'DynamicDashboard',
        path: 'overview',
        component: () => import('#/views/dashboard/dynamic/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:layout-dashboard',
          title: $t('page.dashboard.overview'),
          authority: ['platform:admin', 'tenant:manager'],
        },
      },
      {
        name: 'Analytics',
        path: 'analytics',
        component: () => import('#/views/dashboard/analytics/index.vue'),
        meta: {
          icon: 'lucide:area-chart',
          title: $t('page.dashboard.analytics'),
          authority: ['platform:admin', 'tenant:manager'],
        },
      },
    ],
  },
];

export default routes;
