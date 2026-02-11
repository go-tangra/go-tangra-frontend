import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';
import { $t } from '#/locales';

const executor: RouteRecordRaw[] = [
  {
    path: '/executor',
    name: 'Executor',
    component: BasicLayout,
    redirect: '/executor/scripts',
    meta: {
      order: 2050,
      icon: 'lucide:terminal',
      title: $t('executor.menu.executor'),
      keepAlive: true,
      authority: ['platform:admin', 'tenant:manager'],
    },
    children: [
      {
        path: 'scripts',
        name: 'ExecutorScripts',
        meta: {
          icon: 'lucide:file-code',
          title: $t('executor.menu.scripts'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () => import('#/views/app/executor/scripts/index.vue'),
      },
      {
        path: 'executions',
        name: 'ExecutorExecutions',
        meta: {
          icon: 'lucide:play',
          title: $t('executor.menu.executions'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () => import('#/views/app/executor/executions/index.vue'),
      },
    ],
  },
];

export default executor;
