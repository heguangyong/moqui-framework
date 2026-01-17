/**
 * Performance Monitoring Utilities
 * 性能监控工具 - 用于监控和优化应用性能
 * 
 * Requirements: 9.1, 9.2, 9.3
 */

export interface PerformanceMetrics {
  fps: number
  memory: {
    used: number
    total: number
    limit: number
  }
  timing: {
    loadTime: number
    domReady: number
    firstPaint: number
  }
}

/**
 * FPS监控器
 */
export class FPSMonitor {
  private frames: number[] = []
  private lastTime = performance.now()
  private rafId: number | null = null

  start(callback: (fps: number) => void) {
    const measure = () => {
      const now = performance.now()
      const delta = now - this.lastTime

      this.frames.push(delta)

      // 保留最近60帧的数据
      if (this.frames.length > 60) {
        this.frames.shift()
      }

      // 计算平均FPS
      if (this.frames.length > 0) {
        const avgDelta = this.frames.reduce((a, b) => a + b, 0) / this.frames.length
        const fps = Math.round(1000 / avgDelta)
        callback(fps)
      }

      this.lastTime = now
      this.rafId = requestAnimationFrame(measure)
    }

    this.rafId = requestAnimationFrame(measure)
  }

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }
}

/**
 * 内存监控器
 */
export class MemoryMonitor {
  private readonly MEMORY_THRESHOLD = 800 * 1024 * 1024 // 800MB

  getMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      }
    }
    return null
  }

  isMemoryHigh(): boolean {
    const memory = this.getMemoryUsage()
    if (!memory) return false
    return memory.used > this.MEMORY_THRESHOLD
  }

  getMemoryPercentage(): number {
    const memory = this.getMemoryUsage()
    if (!memory) return 0
    return (memory.used / memory.limit) * 100
  }
}

/**
 * 性能计时器
 */
export class PerformanceTimer {
  private marks = new Map<string, number>()

  mark(name: string) {
    this.marks.set(name, performance.now())
  }

  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark)
    if (!start) {
      console.warn(`Start mark "${startMark}" not found`)
      return 0
    }

    const end = endMark ? this.marks.get(endMark) : performance.now()
    if (endMark && !end) {
      console.warn(`End mark "${endMark}" not found`)
      return 0
    }

    const duration = (end as number) - start
    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`)
    return duration
  }

  clear() {
    this.marks.clear()
  }
}

/**
 * 获取页面加载性能指标
 */
export function getLoadPerformance(): PerformanceMetrics['timing'] | null {
  if (!window.performance || !window.performance.timing) {
    return null
  }

  const timing = window.performance.timing
  const navigationStart = timing.navigationStart

  return {
    loadTime: timing.loadEventEnd - navigationStart,
    domReady: timing.domContentLoadedEventEnd - navigationStart,
    firstPaint: timing.responseEnd - navigationStart
  }
}

/**
 * 性能监控管理器
 */
export class PerformanceMonitor {
  private fpsMonitor = new FPSMonitor()
  private memoryMonitor = new MemoryMonitor()
  private timer = new PerformanceTimer()
  private metrics: Partial<PerformanceMetrics> = {}
  private callbacks: ((metrics: Partial<PerformanceMetrics>) => void)[] = []

  start() {
    // 监控FPS
    this.fpsMonitor.start((fps) => {
      this.metrics.fps = fps
      this.notifyCallbacks()
    })

    // 定期检查内存
    setInterval(() => {
      const memory = this.memoryMonitor.getMemoryUsage()
      if (memory) {
        this.metrics.memory = memory
        this.notifyCallbacks()

        // 内存过高时警告
        if (this.memoryMonitor.isMemoryHigh()) {
          console.warn('⚠️ Memory usage is high:', {
            used: `${(memory.used / 1024 / 1024).toFixed(2)}MB`,
            percentage: `${this.memoryMonitor.getMemoryPercentage().toFixed(1)}%`
          })
        }
      }
    }, 5000)

    // 获取加载性能
    const timing = getLoadPerformance()
    if (timing) {
      this.metrics.timing = timing
    }
  }

  stop() {
    this.fpsMonitor.stop()
  }

  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics }
  }

  onMetricsUpdate(callback: (metrics: Partial<PerformanceMetrics>) => void) {
    this.callbacks.push(callback)
  }

  private notifyCallbacks() {
    this.callbacks.forEach((callback) => callback(this.metrics))
  }

  // 计时器方法
  mark(name: string) {
    this.timer.mark(name)
  }

  measure(name: string, startMark: string, endMark?: string): number {
    return this.timer.measure(name, startMark, endMark)
  }
}

// 全局性能监控实例
export const performanceMonitor = new PerformanceMonitor()

/**
 * 性能优化建议
 */
export function getPerformanceRecommendations(
  metrics: Partial<PerformanceMetrics>
): string[] {
  const recommendations: string[] = []

  // FPS检查
  if (metrics.fps && metrics.fps < 30) {
    recommendations.push('FPS过低，建议减少DOM操作或使用虚拟滚动')
  }

  // 内存检查
  if (metrics.memory) {
    const percentage = (metrics.memory.used / metrics.memory.limit) * 100
    if (percentage > 80) {
      recommendations.push('内存使用过高，建议清理缓存或减少数据量')
    }
  }

  // 加载时间检查
  if (metrics.timing && metrics.timing.loadTime > 3000) {
    recommendations.push('页面加载时间过长，建议使用代码分割和懒加载')
  }

  return recommendations
}
