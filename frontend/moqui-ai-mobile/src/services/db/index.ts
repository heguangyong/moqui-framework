/**
 * IndexedDB Database Service using Dexie.js
 * Provides local storage for push notifications history and offline request caching
 * 
 * Requirements: 5.2, 4.4
 */

import Dexie, { type EntityTable } from 'dexie'

// Push History Record - stores notification history for the last 30 days
export interface PushHistoryRecord {
  id?: number
  notificationId: string
  orderId: string
  title: string
  body: string
  timestamp: Date
  read: boolean
  data: {
    route?: string
    freight?: number
    distance?: number
    [key: string]: unknown
  }
}

// Offline Request Record - stores requests made while offline for later sync
export interface OfflineRequestRecord {
  id?: number
  requestId: string
  url: string
  method: 'POST' | 'PUT' | 'DELETE'
  body: string // JSON stringified
  headers: Record<string, string>
  timestamp: Date
  retryCount: number
  lastError?: string
  status: 'pending' | 'syncing' | 'failed'
}

// Database class extending Dexie
class AppDatabase extends Dexie {
  pushHistory!: EntityTable<PushHistoryRecord, 'id'>
  offlineRequests!: EntityTable<OfflineRequestRecord, 'id'>

  constructor() {
    super('MoquiMarketplaceDB')
    
    this.version(1).stores({
      // Push history: indexed by notificationId, orderId, timestamp, and read status
      pushHistory: '++id, notificationId, orderId, timestamp, read',
      // Offline requests: indexed by requestId, status, and timestamp
      offlineRequests: '++id, requestId, status, timestamp'
    })
  }
}

// Singleton database instance
export const db = new AppDatabase()


// ============================================
// Push History CRUD Operations
// ============================================

/**
 * Add a new push notification to history
 */
export async function addPushHistory(record: Omit<PushHistoryRecord, 'id'>): Promise<number> {
  const id = await db.pushHistory.add(record)
  return id as number
}

/**
 * Get push history within a date range
 * @param days Number of days to look back (default: 30)
 */
export async function getPushHistory(days: number = 30): Promise<PushHistoryRecord[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  return await db.pushHistory
    .where('timestamp')
    .aboveOrEqual(startDate)
    .reverse()
    .sortBy('timestamp')
}

/**
 * Mark a notification as read
 */
export async function markPushAsRead(notificationId: string): Promise<number> {
  return await db.pushHistory
    .where('notificationId')
    .equals(notificationId)
    .modify({ read: true })
}

/**
 * Clear all push history
 */
export async function clearPushHistory(): Promise<void> {
  await db.pushHistory.clear()
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<number> {
  return await db.pushHistory.where('read').equals(0).count()
}

// ============================================
// Offline Requests CRUD Operations
// ============================================

/**
 * Cache a request for offline sync
 */
export async function cacheOfflineRequest(
  request: Omit<OfflineRequestRecord, 'id' | 'timestamp' | 'retryCount' | 'status'>
): Promise<string> {
  const record: Omit<OfflineRequestRecord, 'id'> = {
    ...request,
    timestamp: new Date(),
    retryCount: 0,
    status: 'pending'
  }
  await db.offlineRequests.add(record)
  return request.requestId
}

/**
 * Get all cached offline requests
 */
export async function getCachedRequests(): Promise<OfflineRequestRecord[]> {
  return await db.offlineRequests.toArray()
}

/**
 * Get pending requests (not yet synced)
 */
export async function getPendingRequests(): Promise<OfflineRequestRecord[]> {
  return await db.offlineRequests
    .where('status')
    .equals('pending')
    .toArray()
}

/**
 * Update request status
 */
export async function updateRequestStatus(
  requestId: string,
  status: OfflineRequestRecord['status'],
  lastError?: string
): Promise<number> {
  const updates: Partial<OfflineRequestRecord> = { status }
  if (lastError !== undefined) {
    updates.lastError = lastError
  }
  if (status === 'failed') {
    // Increment retry count on failure
    return await db.offlineRequests
      .where('requestId')
      .equals(requestId)
      .modify((record) => {
        record.status = status
        record.retryCount = (record.retryCount || 0) + 1
        if (lastError) record.lastError = lastError
      })
  }
  return await db.offlineRequests
    .where('requestId')
    .equals(requestId)
    .modify(updates)
}

/**
 * Remove a cached request (after successful sync)
 */
export async function removeCachedRequest(requestId: string): Promise<number> {
  return await db.offlineRequests
    .where('requestId')
    .equals(requestId)
    .delete()
}

/**
 * Clear all cached requests
 */
export async function clearCachedRequests(): Promise<void> {
  await db.offlineRequests.clear()
}

/**
 * Get request by ID
 */
export async function getRequestById(requestId: string): Promise<OfflineRequestRecord | undefined> {
  return await db.offlineRequests
    .where('requestId')
    .equals(requestId)
    .first()
}
