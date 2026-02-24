import type { Router } from 'vue-router';
import type { I18n } from 'vue-i18n';
import type { TangraModule } from '@tangra/module-sdk';

import { registerModule } from '@tangra/module-sdk';
import { init, loadRemote, registerRemotes } from '@module-federation/runtime';
import { useModuleRegistrationStore } from '#/stores/module-registration.state';

let _mfInitialized = false;
let _modulesLoaded = false;

/**
 * Initialize Module Federation runtime. Called once during bootstrap.
 * Does NOT make any API calls or require authentication.
 */
export function initModuleFederation() {
  if (_mfInitialized) return;
  init({ name: 'shell', remotes: [] });
  _mfInitialized = true;
}

/**
 * Discover and load federated modules from admin-service.
 * Called from the router guard AFTER authentication is confirmed.
 */
export async function loadFederatedModules(router: Router, i18n: I18n) {
  if (_modulesLoaded) return;

  if (!_mfInitialized) {
    initModuleFederation();
  }

  try {
    const store = useModuleRegistrationStore();
    const modules = await store.listModules();
    const frontendModules = modules.filter((m) => m.frontendEntryUrl);

    if (frontendModules.length > 0) {
      registerRemotes(
        frontendModules.map((m) => ({
          name: m.moduleId!,
          entry: m.frontendEntryUrl!,
          type: 'module',
        })),
      );

      for (const mod of frontendModules) {
        try {
          const remote = await loadRemote<{ default: TangraModule }>(
            `${mod.moduleId}/module`,
          );
          if (remote?.default) {
            registerModule({ router, i18n, pinia: null as any }, remote.default);
            console.log(
              `[ModuleLoader] Loaded: ${remote.default.id} v${remote.default.version}`,
            );
          }
        } catch (err) {
          console.error(
            `[ModuleLoader] Failed to load ${mod.moduleId}:`,
            err,
          );
        }
      }
      _modulesLoaded = true;
      return;
    }
  } catch (err) {
    console.error('[ModuleLoader] Failed to discover modules:', err);
  }

  // Dev mode fallback: load bookmark from local dev server when no modules registered
  if (import.meta.env.DEV) {
    registerRemotes([
      { name: 'bookmark', entry: 'http://localhost:3001/remoteEntry.js', type: 'module' },
    ]);
    try {
      const remote = await loadRemote<{ default: TangraModule }>(
        'bookmark/module',
      );
      if (remote?.default) {
        registerModule({ router, i18n, pinia: null as any }, remote.default);
        console.log('[ModuleLoader] Dev: loaded bookmark from localhost:3001');
      }
    } catch (err) {
      console.warn(
        '[ModuleLoader] Dev: bookmark not available on localhost:3001',
      );
    }
  }
  _modulesLoaded = true;
}
