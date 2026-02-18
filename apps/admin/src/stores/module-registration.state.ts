import { defineStore } from 'pinia';

import {
  createModuleRegistrationServiceClient,
  type Module,
  type ListModulesResponse,
} from '#/generated/api/admin/service/v1';
import { requestClientRequestHandler } from '#/utils/request';

export const useModuleRegistrationStore = defineStore(
  'module-registration',
  () => {
    const service = createModuleRegistrationServiceClient(
      requestClientRequestHandler,
    );

    async function listModules(): Promise<Module[]> {
      const resp: ListModulesResponse = await service.ListModules({
        status: 'MODULE_STATUS_ACTIVE',
        health: undefined,
      });
      return resp.modules ?? [];
    }

    function $reset() {}

    return {
      $reset,
      listModules,
    };
  },
);
