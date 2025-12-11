/**
 * Network Monitor Service
 * Provides online/offline detection and network change event handling
 * 
 * Requirements: 5.1
 */

export type NetworkStatus = 'online' | 'offline' | 'unknown'

export interface NetworkChangeEvent {
  status: NetworkStatus
  timestamp: Date
  previousStatus?: NetworkStatus
}

export type NetworkChangeCallback = (event: NetworkChangeEvent) => void

class NetworkMonitorService {
  private status: NetworkStatus = 'unknown'
  private callbacks: Set<NetworkChangeCallback> = new Set()
  private initialized = false

  constructor() {
    // Initialize on first use
    this.initialize()
  }

  /**
   * Initialize the network monitor
   */
  private initialize(): void {
    if (this.initialized || typeof window === 'undefined') return

    // Set initial status
    this.status = navigator.onLine ? 'online' : 'offline'

    // Add event listeners for network changes
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))

    this.initialized = true
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    const previousStatus = this.status
    this.status = 'online'
    this.notifyCallbacks(previousStatus)
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    const previousStatus = this.status
    this.status = 'offline'
    this.notifyCallbacks(previousStatus)
  }


  /**
   * Notify all registered callbacks of network change
   */
  private notifyCallbacks(previousStatus: NetworkStatus): void {
    const event: NetworkChangeEvent = {
      status: this.status,
      timestamp: new Date(),
      previousStatus
    }

    this.callbacks.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('Error in network change callback:', error)
      }
    })
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    if (typeof navigator === 'undefined') return true
    return navigator.onLine
  }

  /**
   * Check if currently offline
   */
  isOffline(): boolean {
    return !this.isOnline()
  }

  /**
   * Get current network status
   */
  getStatus(): NetworkStatus {
    if (typeof navigator === 'undefined') return 'unknown'
    return navigator.onLine ? 'online' : 'offline'
  }

  /**
   * Register a callback for network changes
   * @param callback Function to call when network status changes
   * @returns Unsubscribe function
   */
  onNetworkChange(callback: NetworkChangeCallback): () => void {
    this.callbacks.add(callback)
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback)
    }
  }

  /**
   * Remove a specific callback
   */
  removeCallback(callback: NetworkChangeCallback): void {
    this.callbacks.delete(callback)
  }

  /**
   * Remove all callbacks
   */
  clearCallbacks(): void {
    this.callbacks.clear()
  }

  /**
   * Cleanup and destroy the monitor
   */
  destroy(): void {
    if (typeof window === 'undefined') return

    window.removeEventListener('online', this.handleOnline.bind(this))
    window.removeEventListener('offline', this.handleOffline.bind(this))
    this.clearCallbacks()
    this.initialized = false
  }
}

// Singleton instance
export const networkMonitor = new NetworkMonitorService()

// Export class for testing
export { NetworkMonitorService }
