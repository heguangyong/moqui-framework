/**
 * Memory Management Utilities
 * 内存管理工具 - 用于优化内存使用和防止内存泄漏
 * 
 * Requirements: 9.3, 9.5
 */

export interface MemoryStats {
  used: number
  total: number
  limit: number
  percentage: number
}

export interface CacheConfig {
  maxSize: number
  maxAge: number
  onEvict?: (key: string, value: any) => void
}

/**
 * LRU缓存实现
 * 最近最少使用缓存，自动清理旧数据
 */
export class LRUCache<K = string, V = any> {
  private cache = new Map<K, { value: V; timestamp: number }>()
  private maxSize: number
  private maxAge: number
  private onEvict?: (key: K, value: V) => void

  constructor(config: CacheConfig) {
    this.maxSize = config.maxSize
    this.maxAge = config.maxAge
    this.onEvict = config.onEvict
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key)
    if (!item) return undefined

    // 检查是否过期
    if (Date.now() - item.timestamp > this.maxAge) {
      this.delete(key)
      return undefined
    }

    // 更新访问时间（LRU）
    this.cache.delete(key)
    this.cache.set(key, { ...item, timestamp: Date.now() })

    return item.value
  }

  set(key: K, value: V): void {
    // 如果已存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }

    // 如果超过最大大小，删除最旧的项
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.delete(firstKey)
    }

    this.cache.set(key, { value, timestamp: Date.now() })
  }

  delete(key: K): boolean {
    const item = this.cache.get(key)
    if (item && this.onEvict) {
      this.onEvict(key, item.value)
    }
    return this.cache.delete(key)
  }

  clear(): void {
    if (this.onEvict) {
      this.cache.forEach((item, key) => {
        this.onEvict!(key, item.value)
      })
    }
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  // 清理过期项
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.maxAge) {
        this.delete(key)
        cleaned++
      }
    }

    return cleaned
  }
}

/**
 * 内存管理器
 */
export class MemoryManager {
  private readonly MEMORY_WARNING_THRESHOLD = 0.8 // 80%
  private readonly MEMORY_CRITICAL_THRESHOLD = 0.9 // 90%
  private readonly CHECK_INTERVAL = 10000 // 10秒
  private checkTimer: ReturnType<typeof setInterval> | null = null
  private caches = new Map<string, LRUCache>()
  private callbacks: ((stats: MemoryStats) => void)[] = []

  /**
   * 获取内存使用情况
   */
  getMemoryStats(): MemoryStats | null {
    if (!('memory' in performance)) {
      return null
    }

    const memory = (performance as any).memory
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    }
  }

  /**
   * 启动内存监控
   */
  startMonitoring() {
    if (this.checkTimer) return

    this.checkTimer = setInterval(() => {
      const stats = this.getMemoryStats()
      if (!stats) return

      // 通知回调
      this.callbacks.forEach((callback) => callback(stats))

      // 检查内存使用
      if (stats.percentage >= this.MEMORY_CRITICAL_THRESHOLD * 100) {
        console.error('🚨 Critical memory usage:', {
          used: `${(stats.used / 1024 / 1024).toFixed(2)}MB`,
          percentage: `${stats.percentage.toFixed(1)}%`
        })
        this.emergencyCleanup()
      } else if (stats.percentage >= this.MEMORY_WARNING_THRESHOLD * 100) {
        console.warn('⚠️ High memory usage:', {
          used: `${(stats.used / 1024 / 1024).toFixed(2)}MB`,
          percentage: `${stats.percentage.toFixed(1)}%`
        })
        this.cleanup()
      }
    }, this.CHECK_INTERVAL)
  }

  /**
   * 停止内存监控
   */
  stopMonitoring() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer)
      this.checkTimer = null
    }
  }

  /**
   * 注册内存状态回调
   */
  onMemoryUpdate(callback: (stats: MemoryStats) => void) {
    this.callbacks.push(callback)
  }

  /**
   * 注册缓存
   */
  registerCache(name: string, cache: LRUCache) {
    this.caches.set(name, cache)
  }

  /**
   * 常规清理
   */
  cleanup() {
    console.log('🧹 Running memory cleanup...')

    let totalCleaned = 0

    // 清理所有缓存中的过期项
    this.caches.forEach((cache, name) => {
      const cleaned = cache.cleanup()
      if (cleaned > 0) {
        console.log(`  Cleaned ${cleaned} items from cache: ${name}`)
        totalCleaned += cleaned
      }
    })

    // 触发垃圾回收（如果可用）
    if (global.gc) {
      global.gc()
      console.log('  Triggered garbage collection')
    }

    console.log(`✅ Cleanup complete. Cleaned ${totalCleaned} items.`)
  }

  /**
   * 紧急清理（内存严重不足时）
   */
  emergencyCleanup() {
    console.error('🚨 Running emergency cleanup...')

    // 清空所有缓存
    this.caches.forEach((cache, name) => {
      const size = cache.size()
      cache.clear()
      console.error(`  Cleared cache: ${name} (${size} items)`)
    })

    // 强制垃圾回收
    if (global.gc) {
      global.gc()
      console.error('  Forced garbage collection')
    }

    console.error('✅ Emergency cleanup complete.')
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    const stats: Record<string, number> = {}
    this.caches.forEach((cache, name) => {
      stats[name] = cache.size()
    })
    return stats
  }
}

/**
 * 大文件流式处理工具
 */
export class StreamProcessor {
  private readonly CHUNK_SIZE = 64 * 1024 // 64KB

  /**
   * 流式读取文件
   */
  async processFile(
    file: File,
    onChunk: (chunk: string, progress: number) => void | Promise<void>
  ): Promise<void> {
    const totalSize = file.size
    let processedSize = 0

    const reader = file.stream().getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        processedSize += value.length

        const progress = (processedSize / totalSize) * 100
        await onChunk(chunk, progress)

        // 让出控制权，避免阻塞UI
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * 分块处理大数组
   */
  async processArray<T>(
    array: T[],
    processor: (item: T, index: number) => void | Promise<void>,
    chunkSize: number = 100
  ): Promise<void> {
    for (let i = 0; i < array.length; i += chunkSize) {
      const chunk = array.slice(i, i + chunkSize)

      for (let j = 0; j < chunk.length; j++) {
        await processor(chunk[j], i + j)
      }

      // 让出控制权
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  }
}

/**
 * 图片优化工具
 */
export class ImageOptimizer {
  /**
   * 压缩图片
   */
  async compressImage(
    file: File,
    maxWidth: number = 1920,
    maxHeight: number = 1080,
    quality: number = 0.8
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      img.onload = () => {
        // 计算缩放比例
        let width = img.width
        let height = img.height

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = width * ratio
          height = height * ratio
        }

        // 设置canvas大小
        canvas.width = width
        canvas.height = height

        // 绘制图片
        ctx?.drawImage(img, 0, 0, width, height)

        // 转换为Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          'image/jpeg',
          quality
        )
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }

      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * 生成缩略图
   */
  async generateThumbnail(
    file: File,
    size: number = 200
  ): Promise<Blob> {
    return this.compressImage(file, size, size, 0.7)
  }
}

// 全局内存管理器实例
export const memoryManager = new MemoryManager()

// 全局流式处理器实例
export const streamProcessor = new StreamProcessor()

// 全局图片优化器实例
export const imageOptimizer = new ImageOptimizer()
