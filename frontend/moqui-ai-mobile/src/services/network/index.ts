/**
 * Network Services Module
 * Exports all network-related services for offline support
 */

export {
  networkMonitor,
  NetworkMonitorService,
  type NetworkStatus,
  type NetworkChangeEvent,
  type NetworkChangeCallback
} from './NetworkMonitor'

export {
  offlineCacheService,
  OfflineCacheServiceClass,
  type CacheRequestOptions,
  type SyncResult
} from './OfflineCacheService'

export {
  syncService,
  SyncServiceClass,
  type SyncStatus,
  type SyncProgress,
  type SyncProgressCallback,
  type SyncCompleteCallback
} from './SyncService'
