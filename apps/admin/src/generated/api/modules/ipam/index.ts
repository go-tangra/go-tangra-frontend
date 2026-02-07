/**
 * ipam module API
 *
 * Usage:
 *   import { ipamApi } from '@/generated/api/modules/ipam';
 *
 *   const data = await ipamApi.get('/resources');
 */

export * from './types';
export * from './client';
export * from './services';
export { default as ipamApi } from './client';
