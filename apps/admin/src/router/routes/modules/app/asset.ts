import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';
import { $t } from '#/locales';

const asset: RouteRecordRaw[] = [
  {
    path: '/asset',
    name: 'Asset',
    component: BasicLayout,
    redirect: '/asset/assets',
    meta: {
      order: 2030,
      icon: 'lucide:package',
      title: $t('asset.menu.moduleName'),
      keepAlive: true,
      authority: ['platform:admin', 'tenant:manager'],
    },
    children: [
      {
        path: 'assets',
        name: 'AssetAssets',
        meta: {
          icon: 'lucide:monitor',
          title: $t('asset.menu.assets'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () => import('#/views/app/asset/asset/index.vue'),
      },
      {
        path: 'consumables',
        name: 'AssetConsumables',
        meta: {
          icon: 'lucide:boxes',
          title: $t('asset.menu.consumables'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () => import('#/views/app/asset/consumable/index.vue'),
      },
      {
        path: 'licenses',
        name: 'AssetLicenses',
        meta: {
          icon: 'lucide:scroll-text',
          title: $t('asset.menu.licenses'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () => import('#/views/app/asset/license/index.vue'),
      },
      {
        path: 'insurance',
        name: 'AssetInsurance',
        meta: {
          icon: 'lucide:shield-check',
          title: $t('asset.menu.insurance'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () => import('#/views/app/asset/insurance/index.vue'),
      },
      {
        path: 'categories',
        name: 'AssetCategories',
        meta: {
          icon: 'lucide:folder-tree',
          title: $t('asset.menu.categories'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () => import('#/views/app/asset/category/index.vue'),
      },
      {
        path: 'suppliers',
        name: 'AssetSuppliers',
        meta: {
          icon: 'lucide:truck',
          title: $t('asset.menu.suppliers'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () => import('#/views/app/asset/supplier/index.vue'),
      },
      {
        path: 'employees',
        name: 'AssetEmployees',
        meta: {
          icon: 'lucide:users',
          title: $t('asset.menu.employees'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () => import('#/views/app/asset/employee/index.vue'),
      },
      {
        path: 'locations',
        name: 'AssetLocations',
        meta: {
          icon: 'lucide:map-pin',
          title: $t('asset.menu.locations'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () => import('#/views/app/asset/location/index.vue'),
      },
    ],
  },
];

export default asset;
