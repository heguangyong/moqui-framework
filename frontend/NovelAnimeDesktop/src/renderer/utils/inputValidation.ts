/**
 * Input Validation Utilities
 * 输入验证工具 - 验证用户输入，防止安全问题
 * 
 * Requirements: 12.4
 */

/**
 * 文件验证配置
 */
export interface FileValidationConfig {
  maxSize?: number
  allowedTypes?: string[]
  allowedExtensions?: string[]
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * 文件大小限制 (字节)
 */
export const FILE_SIZE_LIMITS = {
  TEXT: 10 * 1024 * 1024,      // 10MB
  IMAGE: 50 * 1024 * 1024,     // 50MB
  AUDIO: 100 * 1024 * 1024,    // 100MB
  VIDEO: 500 * 1024 * 1024,    // 500MB
  DOCUMENT: 20 * 1024 * 1024   // 20MB
}

/**
 * 允许的文件类型
 */
export const ALLOWED_FILE_TYPES = {
  TEXT: ['text/plain', 'text/markdown', 'application/json'],
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  VIDEO: ['video/mp4', 'video/webm', 'video/ogg'],
  DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
}

/**
 * 允许的文件扩展名
 */
export const ALLOWED_EXTENSIONS = {
  TEXT: ['.txt', '.md', '.json'],
  IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  AUDIO: ['.mp3', '.wav', '.ogg'],
  VIDEO: ['.mp4', '.webm', '.ogv'],
  DOCUMENT: ['.pdf', '.doc', '.docx']
}

/**
 * 文件验证器
 */
export class FileValidator {
  /**
   * 验证文件
   * 
   * @param file - 要验证的文件
   * @param config - 验证配置
   * @returns 验证结果
   */
  static validate(file: File, config: FileValidationConfig = {}): ValidationResult {
    const errors: string[] = []

    // 验证文件大小
    if (config.maxSize && file.size > config.maxSize) {
      errors.push(`文件大小超过限制 (${this.formatFileSize(config.maxSize)})`)
    }

    // 验证文件类型
    if (config.allowedTypes && !config.allowedTypes.includes(file.type)) {
      errors.push(`不支持的文件类型: ${file.type}`)
    }

    // 验证文件扩展名
    if (config.allowedExtensions) {
      const ext = this.getFileExtension(file.name)
      if (!config.allowedExtensions.includes(ext)) {
        errors.push(`不支持的文件扩展名: ${ext}`)
      }
    }

    // 验证文件名
    if (!this.validateFileName(file.name)) {
      errors.push('文件名包含非法字符')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 验证文本文件
   */
  static validateTextFile(file: File): ValidationResult {
    return this.validate(file, {
      maxSize: FILE_SIZE_LIMITS.TEXT,
      allowedTypes: ALLOWED_FILE_TYPES.TEXT,
      allowedExtensions: ALLOWED_EXTENSIONS.TEXT
    })
  }

  /**
   * 验证图片文件
   */
  static validateImageFile(file: File): ValidationResult {
    return this.validate(file, {
      maxSize: FILE_SIZE_LIMITS.IMAGE,
      allowedTypes: ALLOWED_FILE_TYPES.IMAGE,
      allowedExtensions: ALLOWED_EXTENSIONS.IMAGE
    })
  }

  /**
   * 验证音频文件
   */
  static validateAudioFile(file: File): ValidationResult {
    return this.validate(file, {
      maxSize: FILE_SIZE_LIMITS.AUDIO,
      allowedTypes: ALLOWED_FILE_TYPES.AUDIO,
      allowedExtensions: ALLOWED_EXTENSIONS.AUDIO
    })
  }

  /**
   * 验证视频文件
   */
  static validateVideoFile(file: File): ValidationResult {
    return this.validate(file, {
      maxSize: FILE_SIZE_LIMITS.VIDEO,
      allowedTypes: ALLOWED_FILE_TYPES.VIDEO,
      allowedExtensions: ALLOWED_EXTENSIONS.VIDEO
    })
  }

  /**
   * 验证文档文件
   */
  static validateDocumentFile(file: File): ValidationResult {
    return this.validate(file, {
      maxSize: FILE_SIZE_LIMITS.DOCUMENT,
      allowedTypes: ALLOWED_FILE_TYPES.DOCUMENT,
      allowedExtensions: ALLOWED_EXTENSIONS.DOCUMENT
    })
  }

  /**
   * 验证文件名
   */
  static validateFileName(fileName: string): boolean {
    // 禁止的字符: / \ : * ? " < > |
    const forbiddenChars = /[\/\\:*?"<>|]/
    return !forbiddenChars.test(fileName)
  }

  /**
   * 获取文件扩展名
   */
  static getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.')
    return lastDot > 0 ? fileName.substring(lastDot).toLowerCase() : ''
  }

  /**
   * 格式化文件大小
   */
  static formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }
}

/**
 * 文本输入验证器
 */
export class TextValidator {
  /**
   * 验证文本长度
   */
  static validateLength(
    text: string,
    minLength: number = 0,
    maxLength: number = Infinity
  ): ValidationResult {
    const errors: string[] = []

    if (text.length < minLength) {
      errors.push(`文本长度不能少于 ${minLength} 个字符`)
    }

    if (text.length > maxLength) {
      errors.push(`文本长度不能超过 ${maxLength} 个字符`)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 验证是否为空
   */
  static validateNotEmpty(text: string): ValidationResult {
    const trimmed = text.trim()
    return {
      valid: trimmed.length > 0,
      errors: trimmed.length === 0 ? ['不能为空'] : []
    }
  }

  /**
   * 验证邮箱格式
   */
  static validateEmail(email: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return {
      valid: emailRegex.test(email),
      errors: emailRegex.test(email) ? [] : ['邮箱格式不正确']
    }
  }

  /**
   * 验证URL格式
   */
  static validateURL(url: string): ValidationResult {
    try {
      new URL(url)
      return { valid: true, errors: [] }
    } catch {
      return { valid: false, errors: ['URL格式不正确'] }
    }
  }

  /**
   * 检测XSS攻击
   */
  static detectXSS(text: string): ValidationResult {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<embed[^>]*>/gi,
      /<object[^>]*>/gi
    ]

    for (const pattern of xssPatterns) {
      if (pattern.test(text)) {
        return {
          valid: false,
          errors: ['检测到潜在的XSS攻击']
        }
      }
    }

    return { valid: true, errors: [] }
  }

  /**
   * 清理HTML标签
   */
  static sanitizeHTML(text: string): string {
    return text
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/<embed[^>]*>/gi, '')
      .replace(/<object[^>]*>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
  }

  /**
   * 转义HTML特殊字符
   */
  static escapeHTML(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }
    return text.replace(/[&<>"']/g, (char) => map[char])
  }
}

/**
 * 数字验证器
 */
export class NumberValidator {
  /**
   * 验证数字范围
   */
  static validateRange(
    value: number,
    min: number = -Infinity,
    max: number = Infinity
  ): ValidationResult {
    const errors: string[] = []

    if (value < min) {
      errors.push(`值不能小于 ${min}`)
    }

    if (value > max) {
      errors.push(`值不能大于 ${max}`)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 验证是否为整数
   */
  static validateInteger(value: number): ValidationResult {
    return {
      valid: Number.isInteger(value),
      errors: Number.isInteger(value) ? [] : ['必须是整数']
    }
  }

  /**
   * 验证是否为正数
   */
  static validatePositive(value: number): ValidationResult {
    return {
      valid: value > 0,
      errors: value > 0 ? [] : ['必须是正数']
    }
  }
}

/**
 * 组合验证器
 */
export class Validator {
  /**
   * 组合多个验证结果
   */
  static combine(...results: ValidationResult[]): ValidationResult {
    const allErrors = results.flatMap(r => r.errors)
    return {
      valid: allErrors.length === 0,
      errors: allErrors
    }
  }

  /**
   * 验证对象
   */
  static validateObject<T extends Record<string, any>>(
    obj: T,
    rules: Record<keyof T, (value: any) => ValidationResult>
  ): ValidationResult {
    const errors: string[] = []

    for (const key in rules) {
      const result = rules[key](obj[key])
      if (!result.valid) {
        errors.push(...result.errors.map(err => `${String(key)}: ${err}`))
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

/**
 * 内容安全检查
 */
export class ContentSecurityChecker {
  /**
   * 检查内容是否安全
   */
  static checkContent(content: string): ValidationResult {
    const errors: string[] = []

    // 检查XSS
    const xssResult = TextValidator.detectXSS(content)
    if (!xssResult.valid) {
      errors.push(...xssResult.errors)
    }

    // 检查SQL注入
    if (this.detectSQLInjection(content)) {
      errors.push('检测到潜在的SQL注入')
    }

    // 检查命令注入
    if (this.detectCommandInjection(content)) {
      errors.push('检测到潜在的命令注入')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 检测SQL注入
   */
  private static detectSQLInjection(text: string): boolean {
    const sqlPatterns = [
      /(\bUNION\b.*\bSELECT\b)/gi,
      /(\bDROP\b.*\bTABLE\b)/gi,
      /(\bINSERT\b.*\bINTO\b)/gi,
      /(\bDELETE\b.*\bFROM\b)/gi,
      /(\bUPDATE\b.*\bSET\b)/gi,
      /--/g,
      /;.*(\bDROP\b|\bDELETE\b|\bINSERT\b)/gi
    ]

    return sqlPatterns.some(pattern => pattern.test(text))
  }

  /**
   * 检测命令注入
   */
  private static detectCommandInjection(text: string): boolean {
    const commandPatterns = [
      /[;&|`$()]/g,
      /\.\.\//g,
      /~\//g
    ]

    return commandPatterns.some(pattern => pattern.test(text))
  }
}
