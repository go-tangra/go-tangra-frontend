import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';
import { $t } from '#/locales';

const paperless: RouteRecordRaw[] = [
  {
    path: '/paperless',
    name: 'Paperless',
    component: BasicLayout,
    redirect: '/paperless/documents',
    meta: {
      order: 2020,
      icon: 'lucide:file-text',
      title: $t('paperless.menu.paperless'),
      keepAlive: true,
      authority: ['platform:admin', 'tenant:manager'],
    },
    children: [
      {
        path: 'documents',
        name: 'PaperlessDocuments',
        meta: {
          icon: 'lucide:files',
          title: $t('paperless.menu.documents'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () => import('#/views/app/paperless/document/index.vue'),
      },
      {
        path: 'categories',
        name: 'PaperlessCategories',
        meta: {
          icon: 'lucide:folder-tree',
          title: $t('paperless.menu.categories'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () => import('#/views/app/paperless/category/index.vue'),
      },
      {
        path: 'signing/templates',
        name: 'PaperlessSigningTemplates',
        meta: {
          icon: 'lucide:file-signature',
          title: $t('paperless.menu.signingTemplates'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () =>
          import('#/views/app/paperless/signing/templates/index.vue'),
      },
      {
        path: 'signing/requests',
        name: 'PaperlessSigningRequests',
        meta: {
          icon: 'lucide:pen-tool',
          title: $t('paperless.menu.signingRequests'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () =>
          import('#/views/app/paperless/signing/requests/index.vue'),
      },
    ],
  },
];

export default paperless;
