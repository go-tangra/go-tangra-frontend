import { federation } from '@module-federation/vite';
import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      plugins: [
        federation({
          name: 'shell',
          filename: 'remoteEntry.js',
          remotes: {},
          exposes: {
            './stores': './src/stores/index.ts',
            './locales': './src/locales/index.ts',
            './adapter/vxe-table': './src/adapter/vxe-table.ts',
            './vben/stores': '@vben/stores',
            './vben/common-ui': '@vben/common-ui',
            './vben/icons': '@vben/icons',
            './vben/layouts': '@vben/layouts',
            './app-layout': './src/layouts/basic.vue',
          },
          shared: {
            vue: { singleton: true },
            'vue-router': { singleton: true },
            pinia: { singleton: true },
            // vue-i18n: handled explicitly via registerModule() + mergeLocaleMessage(),
            // not via federation shared (conflicts with @intlify/unplugin-vue-i18n alias)
            'ant-design-vue': { singleton: true },
          },
          dts: false,
        }),
      ],
      build: {
        target: 'esnext',
      },
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // mock代理目标地址
            target: 'http://localhost:5320/api',
            ws: true,
          },
          // Local module development: proxy specific modules to their Vite dev server.
          // Set LOCAL_MODULE=signing (single module) to enable.
          ...(process.env.LOCAL_MODULE
            ? {
                [`/modules/${process.env.LOCAL_MODULE}`]: {
                  changeOrigin: true,
                  target: `http://localhost:${process.env.LOCAL_MODULE_PORT || '3012'}`,
                  rewrite: (path: string) =>
                    path.replace(
                      new RegExp(`^/modules/${process.env.LOCAL_MODULE}`),
                      '',
                    ),
                },
              }
            : {}),
          // Module federation assets — proxied via admin-service ModuleAssetProxy
          '/modules': {
            changeOrigin: true,
            target: 'http://localhost:7788',
          },
          // Object storage proxy — served via admin-service storage proxy
          '/images': {
            changeOrigin: true,
            target: 'http://localhost:7788',
          },
        },
      },
    },
  };
});
