/**
 * Push Notification Service
 * Manages push notification settings, subscriptions, and history
 * 
 * Requirements: 3.4, 4.1, 4.2
 */

import { db, type PushHistoryRecord } from '../db'

// Push Settings Interface
export interface PushSettings {
  enabled: boolean
  distanceRange: number          // Push distance range in km (default: 50)
  vehicleTypes: string[]         // Vehicle types to receive notifications for
  soundEnabled: boolean
  vibrationEnabled: boolean
}

// Push Notification Interface
export interface PushNotification {
  id: string
  orderId: string
  title: string
  body: string
  timestamp: string
  read: boolean
  data: {
    route?: string
    freight?: number
    distance?: number
    [key: string]: unknown
  }
}

// Default push settings
const DEFAULT_PUSH_SETTINGS: PushSettings = {
  enabled: true,
  distanceRange: 50,
  vehicleTypes: ['20GP', '40GP', '40HQ'],
  soundEnabled: true,
  vibrationEnabled: true
}

// Storage key for push settings
const PUSH_SETTINGS_KEY = 'push_settings'

/**
 * Push Service Class
 * Handles all push notification related operations
 */
export class PushService {
  private static instance: PushService
  private settings: PushSettings | null = null

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): PushService {
    if (!PushService.instance) {
      PushService.instance = new PushService()
    }
    return PushService.instance
  }


  // ============================================
  // Settings Management
  // ============================================

  /**
   * Get current push settings
   * Returns settings from localStorage or defaults
   */
  async getSettings(): Promise<PushSettings> {
    if (this.settings) {
      return { ...this.settings }
    }

    try {
      const stored = localStorage.getItem(PUSH_SETTINGS_KEY)
      if (stored) {
        this.settings = JSON.parse(stored) as PushSettings
        return { ...this.settings }
      }
    } catch (error) {
      console.error('Failed to load push settings:', error)
    }

    // Return default settings if none stored
    this.settings = { ...DEFAULT_PUSH_SETTINGS }
    return { ...this.settings }
  }

  /**
   * Update push settings
   * Persists to localStorage immediately
   */
  async updateSettings(updates: Partial<PushSettings>): Promise<void> {
    const current = await this.getSettings()
    this.settings = { ...current, ...updates }
    
    try {
      localStorage.setItem(PUSH_SETTINGS_KEY, JSON.stringify(this.settings))
    } catch (error) {
      console.error('Failed to save push settings:', error)
      throw new Error('Failed to save push settings')
    }

    // If push is disabled, unsubscribe
    if (updates.enabled === false) {
      await this.unsubscribe()
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings(): Promise<void> {
    this.settings = { ...DEFAULT_PUSH_SETTINGS }
    localStorage.setItem(PUSH_SETTINGS_KEY, JSON.stringify(this.settings))
  }

  // ============================================
  // Push Subscription Management
  // ============================================

  /**
   * Subscribe to push notifications
   * Requests notification permission and registers service worker
   */
  async subscribe(): Promise<void> {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications')
    }

    // Request permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      throw new Error('Notification permission denied')
    }

    // Update settings to enabled
    await this.updateSettings({ enabled: true })

    console.log('Push notifications subscribed successfully')
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<void> {
    // Update settings to disabled
    if (this.settings) {
      this.settings.enabled = false
      localStorage.setItem(PUSH_SETTINGS_KEY, JSON.stringify(this.settings))
    }

    console.log('Push notifications unsubscribed')
  }

  /**
   * Check if push notifications are enabled
   */
  async isEnabled(): Promise<boolean> {
    const settings = await this.getSettings()
    return settings.enabled
  }

  // ============================================
  // Push History Management
  // ============================================

  /**
   * Get push notification history
   * @param days Number of days to look back (default: 30)
   */
  async getHistory(days: number = 30): Promise<PushNotification[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    const records = await db.pushHistory
      .where('timestamp')
      .aboveOrEqual(startDate)
      .reverse()
      .sortBy('timestamp')

    return records.map(this.recordToNotification)
  }

  /**
   * Add a notification to history
   */
  async addToHistory(notification: Omit<PushNotification, 'read'>): Promise<number> {
    const record: Omit<PushHistoryRecord, 'id'> = {
      notificationId: notification.id,
      orderId: notification.orderId,
      title: notification.title,
      body: notification.body,
      timestamp: new Date(notification.timestamp),
      read: false,
      data: notification.data
    }

    const id = await db.pushHistory.add(record)
    return id as number
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await db.pushHistory
      .where('notificationId')
      .equals(notificationId)
      .modify({ read: true })
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    await db.pushHistory
      .where('read')
      .equals(0)
      .modify({ read: true })
  }

  /**
   * Clear all push history
   */
  async clearHistory(): Promise<void> {
    await db.pushHistory.clear()
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    return await db.pushHistory.where('read').equals(0).count()
  }

  // ============================================
  // Notification Display
  // ============================================

  /**
   * Show a push notification
   * Uses the Web Notification API
   */
  async showNotification(notification: PushNotification): Promise<void> {
    const settings = await this.getSettings()
    
    if (!settings.enabled) {
      return
    }

    // Add to history
    await this.addToHistory(notification)

    // Check permission
    if (Notification.permission !== 'granted') {
      return
    }

    // Create notification options
    const options: NotificationOptions = {
      body: notification.body,
      icon: '/icons/notification-icon.png',
      badge: '/icons/badge-icon.png',
      tag: notification.id,
      data: {
        orderId: notification.orderId,
        ...notification.data
      },
      requireInteraction: true
    }

    // Add vibration if enabled (vibrate is part of NotificationOptions but may not be in all TS definitions)
    if (settings.vibrationEnabled) {
      (options as any).vibrate = [200, 100, 200]
    }

    // Add sound if enabled (handled by browser)
    if (!settings.soundEnabled) {
      options.silent = true
    }

    // Show the notification
    const notif = new Notification(notification.title, options)

    // Handle click
    notif.onclick = () => {
      window.focus()
      // Navigate to order detail
      window.location.href = `/marketplace/order/${notification.orderId}`
      notif.close()
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Convert database record to notification object
   */
  private recordToNotification(record: PushHistoryRecord): PushNotification {
    return {
      id: record.notificationId,
      orderId: record.orderId,
      title: record.title,
      body: record.body,
      timestamp: record.timestamp.toISOString(),
      read: record.read,
      data: record.data
    }
  }
}

// Export singleton instance
export const pushService = PushService.getInstance()

// Export default settings for testing
export { DEFAULT_PUSH_SETTINGS }
