import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';
import { $t } from '#/locales';

const backup: RouteRecordRaw[] = [
  {
    path: '/backup',
    name: 'Backup',
    component: BasicLayout,
    redirect: '/backup/modules',
    meta: {
      order: 2090,
      icon: 'lucide:archive',
      title: $t('backup.menu.backup'),
      keepAlive: true,
      authority: ['platform:admin'],
    },
    children: [
      {
        path: 'modules',
        name: 'BackupModules',
        meta: {
          icon: 'lucide:database',
          title: $t('backup.menu.modules'),
          authority: ['platform:admin'],
        },
        component: () => import('#/views/app/backup/modules/index.vue'),
      },
      {
        path: 'full',
        name: 'BackupFull',
        meta: {
          icon: 'lucide:hard-drive',
          title: $t('backup.menu.full'),
          authority: ['platform:admin'],
        },
        component: () => import('#/views/app/backup/full/index.vue'),
      },
    ],
  },
];

export default backup;
