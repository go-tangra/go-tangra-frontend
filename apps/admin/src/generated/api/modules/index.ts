/**
 * Module API Clients Index
 *
 * Only API clients are re-exported from here to avoid type conflicts.
 * For services and types, import directly from the specific module:
 *
 * @example
 * // Import API clients
 * import { ipamApi, lcmApi, wardenApi } from '@/generated/api/modules';
 *
 * // Import services from specific modules
 * import { SubnetService } from '@/generated/api/modules/ipam';
 * import { FolderService, SecretService } from '@/generated/api/modules/warden';
 * import { TargetConfigurationService } from '@/generated/api/modules/deployer';
 *
 * // Import types from specific modules
 * import type { components } from '@/generated/api/modules/ipam/types';
 */

// Re-export API clients only (services have duplicate type names across modules)
export { ipamApi } from './ipam/client';
export { lcmApi } from './lcm/client';
export { wardenApi } from './warden/client';
export { deployerApi } from './deployer/client';
export { paperlessApi } from './paperless/client';
export { bookmarkApi } from './bookmark/client';
export { executorApi } from './executor/client';
export { assetApi } from './asset/client';
export { backupApi } from './backup/client';
