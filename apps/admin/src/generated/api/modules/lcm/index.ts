/**
 * lcm module API
 *
 * Usage:
 *   import { lcmApi } from '@/generated/api/modules/lcm';
 *
 *   const data = await lcmApi.get('/resources');
 */

export * from './types';
export * from './client';
export * from './services';
export { default as lcmApi } from './client';
