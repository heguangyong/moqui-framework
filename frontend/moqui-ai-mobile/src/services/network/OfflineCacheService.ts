/**
 * Offline Cache Service
 * Provides caching for offline submissions and request management
 * 
 * Requirements: 5.2
 */

import {
  cacheOfflineRequest,
  getCachedRequests,
  getRequestById,
  removeCachedRequest,
  getPendingRequests,
  updateRequestStatus,
  clearCachedRequests,
  type OfflineRequestRecord
} from '@/services/db'
import { networkMonitor } from './NetworkMonitor'

export interface CacheRequestOptions {
  url: string
  method: 'POST' | 'PUT' | 'DELETE'
  body: any
  headers?: Record<string, string>
}

export interface SyncResult {
  total: number
  success: number
  failed: number
  failedIds: string[]
}

class OfflineCacheServiceClass {
  /**
   * Check if the device is online
   */
  isOnline(): boolean {
    return networkMonitor.isOnline()
  }

  /**
   * Register a callback for network changes
   */
  onNetworkChange(callback: (online: boolean) => void): () => void {
    return networkMonitor.onNetworkChange((event) => {
      callback(event.status === 'online')
    })
  }

  /**
   * Cache a request for later sync
   * @param options Request options to cache
   * @returns The request ID
   */
  async cacheRequest(options: CacheRequestOptions): Promise<string> {
    const requestId = this.generateRequestId()
    
    await cacheOfflineRequest({
      requestId,
      url: options.url,
      method: options.method,
      body: typeof options.body === 'string' ? options.body : JSON.stringify(options.body),
      headers: options.headers || {}
    })

    return requestId
  }


  /**
   * Get all cached requests
   */
  async getCachedRequests(): Promise<OfflineRequestRecord[]> {
    return getCachedRequests()
  }

  /**
   * Get a specific cached request by ID
   */
  async getRequestById(requestId: string): Promise<OfflineRequestRecord | undefined> {
    return getRequestById(requestId)
  }

  /**
   * Get all pending requests (not yet synced)
   */
  async getPendingRequests(): Promise<OfflineRequestRecord[]> {
    return getPendingRequests()
  }

  /**
   * Remove a cached request
   */
  async removeCachedRequest(requestId: string): Promise<void> {
    await removeCachedRequest(requestId)
  }

  /**
   * Update request status
   */
  async updateRequestStatus(
    requestId: string,
    status: OfflineRequestRecord['status'],
    lastError?: string
  ): Promise<void> {
    await updateRequestStatus(requestId, status, lastError)
  }

  /**
   * Clear all cached requests
   */
  async clearAll(): Promise<void> {
    await clearCachedRequests()
  }

  /**
   * Get count of pending requests
   */
  async getPendingCount(): Promise<number> {
    const pending = await getPendingRequests()
    return pending.length
  }

  /**
   * Check if there are pending requests
   */
  async hasPendingRequests(): Promise<boolean> {
    const count = await this.getPendingCount()
    return count > 0
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }
}

// Singleton instance
export const offlineCacheService = new OfflineCacheServiceClass()

// Export class for testing
export { OfflineCacheServiceClass }
