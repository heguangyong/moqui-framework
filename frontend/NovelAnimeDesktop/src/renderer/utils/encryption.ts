/**
 * Data Encryption Utilities
 * 数据加密工具 - 用于加密敏感数据
 * 
 * Requirements: 12.1, 12.2
 * 
 * Note: This is a basic implementation for optional data encryption.
 * For production use, consider using established libraries like crypto-js or node-forge.
 */

/**
 * 简单的AES加密实现（使用Web Crypto API）
 */
export class DataEncryption {
  private static readonly ALGORITHM = 'AES-GCM'
  private static readonly KEY_LENGTH = 256
  private static readonly IV_LENGTH = 12

  /**
   * 生成加密密钥
   */
  static async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      true,
      ['encrypt', 'decrypt']
    )
  }

  /**
   * 导出密钥为字符串
   */
  static async exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('raw', key)
    return this.arrayBufferToBase64(exported)
  }

  /**
   * 从字符串导入密钥
   */
  static async importKey(keyString: string): Promise<CryptoKey> {
    const keyData = this.base64ToArrayBuffer(keyString)
    return await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      true,
      ['encrypt', 'decrypt']
    )
  }

  /**
   * 加密数据
   */
  static async encrypt(data: string, key: CryptoKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH))
    const encodedData = new TextEncoder().encode(data)

    const encrypted = await crypto.subtle.encrypt(
      { name: this.ALGORITHM, iv },
      key,
      encodedData
    )

    // 组合 IV 和加密数据
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(encrypted), iv.length)

    return this.arrayBufferToBase64(combined.buffer)
  }

  /**
   * 解密数据
   */
  static async decrypt(encryptedData: string, key: CryptoKey): Promise<string> {
    const combined = this.base64ToArrayBuffer(encryptedData)
    
    // 分离 IV 和加密数据
    const iv = combined.slice(0, this.IV_LENGTH)
    const data = combined.slice(this.IV_LENGTH)

    const decrypted = await crypto.subtle.decrypt(
      { name: this.ALGORITHM, iv },
      key,
      data
    )

    return new TextDecoder().decode(decrypted)
  }

  /**
   * ArrayBuffer 转 Base64
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  /**
   * Base64 转 ArrayBuffer
   */
  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }
}

/**
 * 密钥派生函数（PBKDF2）
 */
export class KeyDerivation {
  private static readonly ITERATIONS = 100000
  private static readonly HASH = 'SHA-256'
  private static readonly KEY_LENGTH = 256

  /**
   * 从密码派生密钥
   */
  static async deriveKey(password: string, salt?: string): Promise<{
    key: CryptoKey
    salt: string
  }> {
    // 生成或使用提供的盐值
    const saltBuffer = salt
      ? this.base64ToArrayBuffer(salt)
      : crypto.getRandomValues(new Uint8Array(16))

    // 导入密码作为密钥材料
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )

    // 派生密钥
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: this.ITERATIONS,
        hash: this.HASH
      },
      passwordKey,
      { name: 'AES-GCM', length: this.KEY_LENGTH },
      true,
      ['encrypt', 'decrypt']
    )

    return {
      key,
      salt: this.arrayBufferToBase64(saltBuffer)
    }
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  private static base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }
}

/**
 * 加密配置管理
 */
export class EncryptionConfig {
  private static readonly CONFIG_KEY = 'novel_anime_encryption_config'

  /**
   * 保存加密配置
   */
  static saveConfig(config: { salt: string }): void {
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config))
  }

  /**
   * 加载加密配置
   */
  static loadConfig(): { salt: string } | null {
    const config = localStorage.getItem(this.CONFIG_KEY)
    return config ? JSON.parse(config) : null
  }

  /**
   * 清除加密配置
   */
  static clearConfig(): void {
    localStorage.removeItem(this.CONFIG_KEY)
  }
}
