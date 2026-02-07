/**
 * warden module API
 *
 * Usage:
 *   import { wardenApi } from '@/generated/api/modules/warden';
 *
 *   const data = await wardenApi.get('/resources');
 *
 *   // Or use typed services:
 *   import { FolderService, SecretService } from '@/generated/api/modules/warden';
 *
 *   const folders = await FolderService.list();
 *   const secret = await SecretService.get('secret-id');
 */

export * from './types';
export * from './client';
export * from './services';
export { default as wardenApi } from './client';
