import { defineStore } from 'pinia';

import {
  ModuleBackupService,
  type BackupInfo,
  type CreateModuleBackupRequest,
  type CreateModuleBackupResponse,
  type GetBackupResponse,
  type ListBackupsResponse,
  type RestoreModuleBackupRequest,
  type RestoreModuleBackupResponse,
} from '#/generated/api/modules/backup/services';

export const useBackupModuleStore = defineStore('backup-module', () => {
  async function listBackups(
    paging?: { page?: number; pageSize?: number },
    filters?: { module_id?: string } | null,
  ): Promise<ListBackupsResponse> {
    return await ModuleBackupService.list({
      page: paging?.page,
      page_size: paging?.pageSize,
      module_id: filters?.module_id,
    });
  }

  async function getBackup(id: string): Promise<BackupInfo> {
    const resp: GetBackupResponse = await ModuleBackupService.get(id);
    return resp.backup;
  }

  async function createBackup(
    data: CreateModuleBackupRequest,
  ): Promise<CreateModuleBackupResponse> {
    return await ModuleBackupService.create(data);
  }

  async function restoreBackup(
    backupId: string,
    data: RestoreModuleBackupRequest,
  ): Promise<RestoreModuleBackupResponse> {
    return await ModuleBackupService.restore(backupId, data);
  }

  async function deleteBackup(id: string): Promise<void> {
    return await ModuleBackupService.delete(id);
  }

  function $reset() {}

  return {
    $reset,
    listBackups,
    getBackup,
    createBackup,
    restoreBackup,
    deleteBackup,
  };
});
