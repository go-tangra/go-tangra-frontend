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
        },
      },
    },
  };
});
