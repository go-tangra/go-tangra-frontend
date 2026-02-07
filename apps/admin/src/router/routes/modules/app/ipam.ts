import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';
import { $t } from '#/locales';

const ipam: RouteRecordRaw[] = [
  {
    path: '/ipam',
    name: 'IPAM',
    component: BasicLayout,
    redirect: '/ipam/subnets',
    meta: {
      order: 2020,
      icon: 'lucide:network',
      title: $t('ipam.menu.moduleName'),
      keepAlive: true,
      authority: ['platform:admin', 'tenant:manager'],
    },
    children: [
      {
        path: 'subnets',
        name: 'IpamSubnets',
        meta: {
          icon: 'lucide:git-branch',
          title: $t('ipam.menu.subnets'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () => import('#/views/app/ipam/subnet/index.vue'),
      },
      {
        path: 'addresses',
        name: 'IpamAddresses',
        meta: {
          icon: 'lucide:hash',
          title: $t('ipam.menu.addresses'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () => import('#/views/app/ipam/ip-address/index.vue'),
      },
      {
        path: 'vlans',
        name: 'IpamVlans',
        meta: {
          icon: 'lucide:layers',
          title: $t('ipam.menu.vlans'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () => import('#/views/app/ipam/vlan/index.vue'),
      },
      {
        path: 'devices',
        name: 'IpamDevices',
        meta: {
          icon: 'lucide:server',
          title: $t('ipam.menu.devices'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () => import('#/views/app/ipam/device/index.vue'),
      },
      {
        path: 'locations',
        name: 'IpamLocations',
        meta: {
          icon: 'lucide:map-pin',
          title: $t('ipam.menu.locations'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () => import('#/views/app/ipam/location/index.vue'),
      },
      {
        path: 'groups',
        name: 'IpamGroups',
        meta: {
          icon: 'lucide:folder',
          title: $t('ipam.menu.groups'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () => import('#/views/app/ipam/group/index.vue'),
      },
      {
        path: 'host-groups',
        name: 'IpamHostGroups',
        meta: {
          icon: 'lucide:users',
          title: $t('ipam.menu.hostGroups'),
          authority: ['platform:admin', 'tenant:manager'],
        },
        component: () => import('#/views/app/ipam/host-group/index.vue'),
      },
    ],
  },
];

export default ipam;
