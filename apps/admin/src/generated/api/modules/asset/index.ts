/**
 * Asset module API
 *
 * Usage:
 *   import { assetApi } from '@/generated/api/modules/asset';
 *
 *   const data = await assetApi.get('/resources');
 */

export * from './client';
export * from './services';
export { default as assetApi } from './client';
