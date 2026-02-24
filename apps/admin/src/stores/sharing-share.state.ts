import { defineStore } from 'pinia';

import {
  ShareService,
  type CreateShareRequest,
  type CreateShareResponse,
} from '#/generated/api/modules/sharing/services';

/**
 * Lightweight sharing store kept in the admin SPA for cross-module usage.
 * Other modules (warden, paperless) use createShare() to initiate shares.
 * Full sharing admin UI lives in the sharing MF remote.
 */
export const useSharingShareStore = defineStore('sharing-share', () => {
  async function createShare(
    data: CreateShareRequest,
  ): Promise<CreateShareResponse> {
    return await ShareService.create(data);
  }

  function $reset() {}

  return {
    $reset,
    createShare,
  };
});
