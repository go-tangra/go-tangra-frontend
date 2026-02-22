import type { RouteRecordRaw } from 'vue-router';

import { DEFAULT_HOME_PATH, LOGIN_PATH } from '@vben/constants';

import { AuthPageLayout } from '#/layouts';
import { $t } from '#/locales';
import Login from '#/views/_core/authentication/login.vue';

/** 全局404页面 */
const fallbackNotFoundRoute: RouteRecordRaw = {
  component: () => import('#/views/_core/fallback/not-found.vue'),
  meta: {
    hideInBreadcrumb: true,
    hideInMenu: true,
    hideInTab: true,
    title: '404',
  },
  name: 'FallbackNotFound',
  path: '/:path(.*)*',
};

/** 基本路由，这些路由是必须存在的 */
const coreRoutes: RouteRecordRaw[] = [
  {
    meta: {
      title: 'Root',
    },
    name: 'Root',
    path: '/',
    redirect: DEFAULT_HOME_PATH,
  },
  {
    meta: {
      hideInMenu: true,
      hideInTab: true,
      hideInBreadcrumb: true,
      title: 'Shared Content',
    },
    name: 'SharedContent',
    path: '/shared/:token',
    component: () => import('#/views/app/sharing/shared/view-shared.vue'),
  },
  {
    meta: {
      hideInMenu: true,
      hideInTab: true,
      hideInBreadcrumb: true,
      title: 'Document Signing',
    },
    name: 'SigningSession',
    path: '/signing/:token',
    component: () =>
      import('#/views/app/paperless/signing/session/index.vue'),
  },
  {
    component: AuthPageLayout,
    meta: {
      hideInTab: true,
      title: 'Authentication',
    },
    name: 'Authentication',
    path: '/auth',
    redirect: LOGIN_PATH,
    children: [
      {
        name: 'Login',
        path: 'login',
        component: Login,
        meta: {
          title: $t('page.auth.login'),
        },
      },
      {
        name: 'CodeLogin',
        path: 'code-login',
        component: () => import('#/views/_core/authentication/code-login.vue'),
        meta: {
          title: $t('page.auth.codeLogin'),
        },
      },
      {
        name: 'QrCodeLogin',
        path: 'qrcode-login',
        component: () =>
          import('#/views/_core/authentication/qrcode-login.vue'),
        meta: {
          title: $t('page.auth.qrcodeLogin'),
        },
      },
      {
        name: 'ForgetPassword',
        path: 'forget-password',
        component: () =>
          import('#/views/_core/authentication/forget-password.vue'),
        meta: {
          title: $t('page.auth.forgetPassword'),
        },
      },
      {
        name: 'Register',
        path: 'register',
        component: () => import('#/views/_core/authentication/register.vue'),
        meta: {
          title: $t('page.auth.register'),
        },
      },
      {
        name: 'MFAVerify',
        path: 'mfa-verify',
        component: () =>
          import('#/views/_core/authentication/mfa-verify.vue'),
        meta: {
          title: $t('page.auth.mfa.title'),
        },
      },
    ],
  },
];

export { coreRoutes, fallbackNotFoundRoute };
