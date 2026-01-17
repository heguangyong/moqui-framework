/**
 * Key Storage Service
 * 
 * Provides secure storage for API keys using the operating system's secure storage mechanism
 * Uses keytar library for cross-platform secure credential storage
 * 
 * Requirements: 12.1 - API密钥安全存储
 */

/**
 * Service name for keytar storage
 */
const SERVICE_NAME = 'NovelAnimeGenerator'

/**
 * Key types for different AI providers
 */
export enum KeyType {
  ZHIPU_API_KEY = 'zhipu_api_key',
  OPENAI_API_KEY = 'openai_api_key',
  ANTHROPIC_API_KEY = 'anthropic_api_key',
  STABILITY_API_KEY = 'stability_api_key'
}

/**
 * Key Storage Service
 * 
 * Manages secure storage and retrieval of API keys
 */
export class KeyStorageService {
  private keytar: any = null
  private isElectron: boolean = false
  private fallbackStorage: Map<string, string> = new Map()

  constructor() {
    this.initializeKeytar()
  }

  /**
   * Initialize keytar library
   * Falls back to localStorage if keytar is not available
   */
  private async initializeKeytar(): Promise<void> {
    try {
      // Check if running in Electron environment
      this.isElectron = typeof window !== 'undefined' && 
                       typeof (window as any).electron !== 'undefined'

      if (this.isElectron) {
        // Try to load keytar through Electron's IPC
        const { ipcRenderer } = (window as any).electron
        
        // Test if keytar is available
        const testResult = await ipcRenderer.invoke('keytar-test')
        if (testResult.success) {
          console.log('✅ Keytar initialized successfully')
          this.keytar = {
            getPassword: (service: string, account: string) => 
              ipcRenderer.invoke('keytar-get', service, account),
            setPassword: (service: string, account: string, password: string) => 
              ipcRenderer.invoke('keytar-set', service, account, password),
            deletePassword: (service: string, account: string) => 
              ipcRenderer.invoke('keytar-delete', service, account)
          }
        } else {
          console.warn('⚠️ Keytar not available, using fallback storage')
        }
      } else {
        console.warn('⚠️ Not running in Electron, using fallback storage')
      }
    } catch (error) {
      console.error('Failed to initialize keytar:', error)
      console.warn('⚠️ Using fallback storage for API keys')
    }
  }

  /**
   * Store API key securely
   * 
   * @param keyType - Type of API key
   * @param apiKey - API key value
   * @returns Success status
   */
  async storeKey(keyType: KeyType, apiKey: string): Promise<boolean> {
    try {
      if (this.keytar) {
        // Use keytar for secure storage
        await this.keytar.setPassword(SERVICE_NAME, keyType, apiKey)
        console.log(`✅ API key stored securely: ${keyType}`)
        return true
      } else {
        // Fallback to encrypted localStorage
        this.fallbackStorage.set(keyType, this.encryptKey(apiKey))
        this.saveFallbackStorage()
        console.log(`⚠️ API key stored in fallback storage: ${keyType}`)
        return true
      }
    } catch (error) {
      console.error(`Failed to store API key (${keyType}):`, error)
      return false
    }
  }

  /**
   * Retrieve API key
   * 
   * @param keyType - Type of API key
   * @returns API key or null if not found
   */
  async getKey(keyType: KeyType): Promise<string | null> {
    try {
      if (this.keytar) {
        // Retrieve from keytar
        const key = await this.keytar.getPassword(SERVICE_NAME, keyType)
        return key || null
      } else {
        // Retrieve from fallback storage
        this.loadFallbackStorage()
        const encryptedKey = this.fallbackStorage.get(keyType)
        if (encryptedKey) {
          return this.decryptKey(encryptedKey)
        }
        return null
      }
    } catch (error) {
      console.error(`Failed to retrieve API key (${keyType}):`, error)
      return null
    }
  }

  /**
   * Delete API key
   * 
   * @param keyType - Type of API key
   * @returns Success status
   */
  async deleteKey(keyType: KeyType): Promise<boolean> {
    try {
      if (this.keytar) {
        // Delete from keytar
        await this.keytar.deletePassword(SERVICE_NAME, keyType)
        console.log(`✅ API key deleted: ${keyType}`)
        return true
      } else {
        // Delete from fallback storage
        this.fallbackStorage.delete(keyType)
        this.saveFallbackStorage()
        console.log(`⚠️ API key deleted from fallback storage: ${keyType}`)
        return true
      }
    } catch (error) {
      console.error(`Failed to delete API key (${keyType}):`, error)
      return false
    }
  }

  /**
   * Check if API key exists
   * 
   * @param keyType - Type of API key
   * @returns True if key exists
   */
  async hasKey(keyType: KeyType): Promise<boolean> {
    const key = await this.getKey(keyType)
    return key !== null && key.length > 0
  }

  /**
   * Validate API key format
   * 
   * @param keyType - Type of API key
   * @param apiKey - API key to validate
   * @returns True if valid
   */
  validateKeyFormat(keyType: KeyType, apiKey: string): boolean {
    if (!apiKey || apiKey.trim().length === 0) {
      return false
    }

    // Basic validation rules for different providers
    switch (keyType) {
      case KeyType.ZHIPU_API_KEY:
        // 智谱AI key format: typically starts with specific prefix
        return apiKey.length > 20
      
      case KeyType.OPENAI_API_KEY:
        // OpenAI key format: sk-...
        return apiKey.startsWith('sk-') && apiKey.length > 40
      
      case KeyType.ANTHROPIC_API_KEY:
        // Anthropic key format: sk-ant-...
        return apiKey.startsWith('sk-ant-') && apiKey.length > 40
      
      case KeyType.STABILITY_API_KEY:
        // Stability AI key format
        return apiKey.length > 20
      
      default:
        return apiKey.length > 10
    }
  }

  /**
   * Simple encryption for fallback storage
   * Note: This is NOT cryptographically secure, just obfuscation
   * Real security comes from keytar's OS-level secure storage
   */
  private encryptKey(key: string): string {
    // Simple Base64 encoding with a salt
    const salt = 'NovelAnime2025'
    const combined = salt + key + salt
    return btoa(combined)
  }

  /**
   * Simple decryption for fallback storage
   */
  private decryptKey(encryptedKey: string): string {
    try {
      const salt = 'NovelAnime2025'
      const decoded = atob(encryptedKey)
      // Remove salt from both ends
      return decoded.substring(salt.length, decoded.length - salt.length)
    } catch (error) {
      console.error('Failed to decrypt key:', error)
      return ''
    }
  }

  /**
   * Save fallback storage to localStorage
   */
  private saveFallbackStorage(): void {
    try {
      const data = JSON.stringify(Array.from(this.fallbackStorage.entries()))
      localStorage.setItem('novel_anime_api_keys', data)
    } catch (error) {
      console.error('Failed to save fallback storage:', error)
    }
  }

  /**
   * Load fallback storage from localStorage
   */
  private loadFallbackStorage(): void {
    try {
      const data = localStorage.getItem('novel_anime_api_keys')
      if (data) {
        const entries = JSON.parse(data)
        this.fallbackStorage = new Map(entries)
      }
    } catch (error) {
      console.error('Failed to load fallback storage:', error)
    }
  }

  /**
   * Clear all stored keys (for testing or reset)
   */
  async clearAllKeys(): Promise<boolean> {
    try {
      const keyTypes = Object.values(KeyType)
      for (const keyType of keyTypes) {
        await this.deleteKey(keyType as KeyType)
      }
      console.log('✅ All API keys cleared')
      return true
    } catch (error) {
      console.error('Failed to clear all keys:', error)
      return false
    }
  }

  /**
   * Get storage status
   */
  getStorageStatus(): {
    isSecure: boolean
    storageType: 'keytar' | 'fallback'
    isElectron: boolean
  } {
    return {
      isSecure: this.keytar !== null,
      storageType: this.keytar ? 'keytar' : 'fallback',
      isElectron: this.isElectron
    }
  }
}

// Export singleton instance
export const keyStorageService = new KeyStorageService()
export default keyStorageService
