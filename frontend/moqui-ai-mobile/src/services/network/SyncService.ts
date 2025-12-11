/**
 * Sync Service
 * Handles synchronization of cached offline requests when network is restored
 * 
 * Requirements: 5.3, 5.4, 5.5
 */

import { networkMonitor, type NetworkChangeEvent } from './NetworkMonitor'
import { offlineCacheService, type SyncResult } from './OfflineCacheService'
import type { OfflineRequestRecord } from '@/services/db'

export type SyncStatus = 'idle' | 'syncing' | 'completed' | 'failed'

export interface SyncProgress {
  status: SyncStatus
  total: number
  completed: number
  failed: number
  currentRequest?: string
}

export type SyncProgressCallback = (progress: SyncProgress) => void
export type SyncCompleteCallback = (result: SyncResult) => void

class SyncServiceClass {
  private isSyncing = false
  private autoSyncEnabled = true
  private progressCallbacks: Set<SyncProgressCallback> = new Set()
  private completeCallbacks: Set<SyncCompleteCallback> = new Set()
  private unsubscribeNetwork?: () => void

  constructor() {
    this.setupAutoSync()
  }

  /**
   * Setup auto-sync on network recovery
   */
  private setupAutoSync(): void {
    this.unsubscribeNetwork = networkMonitor.onNetworkChange(
      this.handleNetworkChange.bind(this)
    )
  }

  /**
   * Handle network status change
   */
  private async handleNetworkChange(event: NetworkChangeEvent): Promise<void> {
    // Auto-sync when coming back online
    if (event.status === 'online' && event.previousStatus === 'offline' && this.autoSyncEnabled) {
      const hasPending = await offlineCacheService.hasPendingRequests()
      if (hasPending) {
        await this.syncAll()
      }
    }
  }


  /**
   * Sync all pending requests
   * @returns Sync result with success/failure counts
   */
  async syncAll(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { total: 0, success: 0, failed: 0, failedIds: [] }
    }

    if (!networkMonitor.isOnline()) {
      return { total: 0, success: 0, failed: 0, failedIds: [] }
    }

    this.isSyncing = true
    const pendingRequests = await offlineCacheService.getPendingRequests()
    
    const result: SyncResult = {
      total: pendingRequests.length,
      success: 0,
      failed: 0,
      failedIds: []
    }

    this.notifyProgress({
      status: 'syncing',
      total: result.total,
      completed: 0,
      failed: 0
    })

    for (const request of pendingRequests) {
      this.notifyProgress({
        status: 'syncing',
        total: result.total,
        completed: result.success,
        failed: result.failed,
        currentRequest: request.requestId
      })

      const success = await this.syncOne(request)
      
      if (success) {
        result.success++
      } else {
        result.failed++
        result.failedIds.push(request.requestId)
      }
    }

    this.isSyncing = false

    this.notifyProgress({
      status: result.failed > 0 ? 'failed' : 'completed',
      total: result.total,
      completed: result.success,
      failed: result.failed
    })

    this.notifyComplete(result)

    return result
  }

  /**
   * Sync a single request
   * @param request The request to sync
   * @returns true if successful, false otherwise
   */
  async syncOne(request: OfflineRequestRecord): Promise<boolean> {
    try {
      // Mark as syncing
      await offlineCacheService.updateRequestStatus(request.requestId, 'syncing')

      // Parse body if it's a string
      let body = request.body
      try {
        body = JSON.parse(request.body)
      } catch {
        // Keep as string if not valid JSON
      }

      // Make the actual request
      const response = await fetch(request.url, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          ...request.headers
        },
        body: typeof body === 'string' ? body : JSON.stringify(body)
      })

      if (response.ok) {
        // Success - remove from cache (Requirements 5.4)
        await offlineCacheService.removeCachedRequest(request.requestId)
        return true
      } else {
        // Server error - keep in cache (Requirements 5.5)
        const errorText = await response.text()
        await offlineCacheService.updateRequestStatus(
          request.requestId,
          'failed',
          `HTTP ${response.status}: ${errorText}`
        )
        return false
      }
    } catch (error) {
      // Network error - keep in cache (Requirements 5.5)
      await offlineCacheService.updateRequestStatus(
        request.requestId,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      )
      return false
    }
  }


  /**
   * Enable or disable auto-sync on network recovery
   */
  setAutoSync(enabled: boolean): void {
    this.autoSyncEnabled = enabled
  }

  /**
   * Check if auto-sync is enabled
   */
  isAutoSyncEnabled(): boolean {
    return this.autoSyncEnabled
  }

  /**
   * Check if currently syncing
   */
  isSyncInProgress(): boolean {
    return this.isSyncing
  }

  /**
   * Register a callback for sync progress updates
   */
  onProgress(callback: SyncProgressCallback): () => void {
    this.progressCallbacks.add(callback)
    return () => this.progressCallbacks.delete(callback)
  }

  /**
   * Register a callback for sync completion
   */
  onComplete(callback: SyncCompleteCallback): () => void {
    this.completeCallbacks.add(callback)
    return () => this.completeCallbacks.delete(callback)
  }

  /**
   * Notify progress callbacks
   */
  private notifyProgress(progress: SyncProgress): void {
    this.progressCallbacks.forEach(callback => {
      try {
        callback(progress)
      } catch (error) {
        console.error('Error in sync progress callback:', error)
      }
    })
  }

  /**
   * Notify complete callbacks
   */
  private notifyComplete(result: SyncResult): void {
    this.completeCallbacks.forEach(callback => {
      try {
        callback(result)
      } catch (error) {
        console.error('Error in sync complete callback:', error)
      }
    })
  }

  /**
   * Cleanup and destroy the service
   */
  destroy(): void {
    if (this.unsubscribeNetwork) {
      this.unsubscribeNetwork()
    }
    this.progressCallbacks.clear()
    this.completeCallbacks.clear()
  }
}

// Singleton instance
export const syncService = new SyncServiceClass()

// Export class for testing
export { SyncServiceClass }
