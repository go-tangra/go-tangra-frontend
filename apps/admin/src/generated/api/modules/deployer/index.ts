/**
 * deployer module API
 *
 * Usage:
 *   import { deployerApi } from '@/generated/api/modules/deployer';
 *
 *   const data = await deployerApi.get('/resources');
 */

export * from './types';
export * from './client';
export * from './services';
export { default as deployerApi } from './client';
