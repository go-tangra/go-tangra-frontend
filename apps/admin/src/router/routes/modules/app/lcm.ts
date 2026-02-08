import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';
import { $t } from '#/locales';

const lcm: RouteRecordRaw[] = [
  {
    path: '/lcm',
    name: 'CertificateManagement',
    component: BasicLayout,
    redirect: '/lcm/issuers',
    meta: {
      order: 2006,
      icon: 'lucide:shield-check',
      title: $t('lcm.menu.moduleName'),
      keepAlive: true,
      authority: ['platform:admin'],
    },
    children: [
      {
        path: 'issuers',
        name: 'IssuerManagement',
        meta: {
          icon: 'lucide:building-2',
          title: $t('lcm.menu.issuer'),
          authority: ['platform:admin'],
        },
        component: () => import('#/views/app/lcm/issuer/index.vue'),
      },
      {
        path: 'certificates',
        name: 'CertificateList',
        meta: {
          icon: 'lucide:file-key',
          title: $t('lcm.menu.mtlsCertificate'),
          authority: ['platform:admin'],
        },
        component: () => import('#/views/app/lcm/certificate/index.vue'),
      },
      {
        path: 'certificate-requests',
        name: 'CertificateRequestManagement',
        meta: {
          icon: 'lucide:file-plus',
          title: $t('lcm.menu.mtlsCertificateRequest'),
          authority: ['platform:admin'],
        },
        component: () =>
          import('#/views/app/lcm/mtls-certificate-request/index.vue'),
      },
      {
        path: 'issued-certificates',
        name: 'IssuedCertificateManagement',
        meta: {
          icon: 'lucide:award',
          title: $t('lcm.menu.issuedCertificate'),
          authority: ['platform:admin'],
        },
        component: () =>
          import('#/views/app/lcm/issued-certificate/index.vue'),
      },
      {
        path: 'certificate-jobs',
        name: 'CertificateJobManagement',
        meta: {
          icon: 'lucide:list-todo',
          title: $t('lcm.menu.certificateJob'),
          authority: ['platform:admin'],
        },
        component: () => import('#/views/app/lcm/certificate-job/index.vue'),
      },
      {
        path: 'certificate-permissions',
        name: 'CertificatePermissionManagement',
        meta: {
          icon: 'lucide:key',
          title: $t('lcm.menu.certificatePermission'),
          authority: ['platform:admin'],
        },
        component: () =>
          import('#/views/app/lcm/certificate-permission/index.vue'),
      },
      {
        path: 'tenant-secrets',
        name: 'TenantSecretManagement',
        meta: {
          icon: 'lucide:lock-keyhole',
          title: $t('lcm.menu.tenantSecret'),
          authority: ['platform:admin'],
        },
        component: () => import('#/views/app/lcm/tenant-secret/index.vue'),
      },
      {
        path: 'audit-logs',
        name: 'LcmAuditLogManagement',
        meta: {
          icon: 'lucide:scroll-text',
          title: $t('lcm.menu.auditLog'),
          authority: ['platform:admin'],
        },
        component: () => import('#/views/app/lcm/audit-log/index.vue'),
      },
    ],
  },
];

export default lcm;
