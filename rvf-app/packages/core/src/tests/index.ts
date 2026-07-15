export { resolveBaseTestVersion, compareVersions } from './VersionResolver.js';
export { VersionResolutionError } from './VersionResolutionError.js';
export type { VersionResolutionErrorCode } from './VersionResolutionError.js';
export { createRegistryVersionsFetcher } from './fetchPublishedVersions.js';
export type { PublishedVersionsFetcher } from './fetchPublishedVersions.js';
export { resolveImport } from './resolveImport.js';
export type { ResolvedImport, ResolveImportOptions } from './resolveImport.js';
export { checkLockstepPublish } from './checkLockstepPublish.js';
export type { LockstepCheckResult } from './checkLockstepPublish.js';
