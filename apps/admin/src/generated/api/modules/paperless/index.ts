/**
 * paperless module API
 *
 * Usage:
 *   import { paperlessApi } from '@/generated/api/modules/paperless';
 *
 *   const data = await paperlessApi.get('/resources');
 */

export * from './types';
export * from './client';
export * from './services';
export { default as paperlessApi } from './client';
