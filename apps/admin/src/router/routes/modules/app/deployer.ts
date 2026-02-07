import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';
import { $t } from '#/locales';

const deployer: RouteRecordRaw[] = [
  {
    path: '/deployer',
    name: 'Deployer',
    component: BasicLayout,
    redirect: '/deployer/targets',
    meta: {
      order: 2007,
      icon: 'lucide:rocket',
      title: $t('deployer.menu.moduleName'),
      keepAlive: true,
      authority: ['platform:admin', 'tenant:manager'],
    },
    children: [
      {
        path: 'targets',
        name: 'DeploymentTargetManagement',
        meta: {
          icon: 'lucide:target',
          title: $t('deployer.menu.target'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () => import('#/views/app/deployer/target/index.vue'),
      },

      {
        path: 'configurations',
        name: 'TargetConfigurationManagement',
        meta: {
          icon: 'lucide:settings',
          title: $t('deployer.menu.configuration'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () => import('#/views/app/deployer/configuration/index.vue'),
      },

      {
        path: 'jobs',
        name: 'DeploymentJobManagement',
        meta: {
          icon: 'lucide:briefcase',
          title: $t('deployer.menu.job'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () => import('#/views/app/deployer/job/index.vue'),
      },
    ],
  },
];

export default deployer;
