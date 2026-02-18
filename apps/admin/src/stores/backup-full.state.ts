import { defineStore } from 'pinia';

import {
  FullBackupService,
  type CreateFullBackupRequest,
  type CreateFullBackupResponse,
  type FullBackupInfo,
  type GetFullBackupResponse,
  type ListFullBackupsResponse,
  type RestoreFullBackupRequest,
  type RestoreFullBackupResponse,
} from '#/generated/api/modules/backup/services';

export const useBackupFullStore = defineStore('backup-full', () => {
  async function listFullBackups(
    paging?: { page?: number; pageSize?: number },
  ): Promise<ListFullBackupsResponse> {
    return await FullBackupService.list({
      page: paging?.page,
      page_size: paging?.pageSize,
    });
  }

  async function getFullBackup(id: string): Promise<FullBackupInfo> {
    const resp: GetFullBackupResponse = await FullBackupService.get(id);
    return resp.backup;
  }

  async function createFullBackup(
    data: CreateFullBackupRequest,
  ): Promise<CreateFullBackupResponse> {
    return await FullBackupService.create(data);
  }

  async function restoreFullBackup(
    backupId: string,
    data: RestoreFullBackupRequest,
  ): Promise<RestoreFullBackupResponse> {
    return await FullBackupService.restore(backupId, data);
  }

  async function deleteFullBackup(id: string): Promise<void> {
    return await FullBackupService.delete(id);
  }

  function $reset() {}

  return {
    $reset,
    listFullBackups,
    getFullBackup,
    createFullBackup,
    restoreFullBackup,
    deleteFullBackup,
  };
});
