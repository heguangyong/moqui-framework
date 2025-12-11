// 移动端性能监控
export class MobilePerformanceMonitor {
  private metrics: any[] = []

  // 页面加载时间
  measurePageLoad() {
    if (typeof window.performance !== 'undefined') {
      const navigationTiming = window.performance.getEntriesByType('navigation')[0] as any

      if (navigationTiming) {
        this.metrics.push({
          type: 'page-load',
          domContentLoaded: navigationTiming.domContentLoadedEventEnd - navigationTiming.fetchStart,
          loadComplete: navigationTiming.loadEventEnd - navigationTiming.fetchStart,
          timestamp: Date.now()
        })
      }
    }
  }

  // 组件渲染时间
  measureComponentRender(componentName: string, renderTime: number) {
    this.metrics.push({
      type: 'component-render',
      component: componentName,
      renderTime,
      timestamp: Date.now()
    })
  }

  // 网络请求时间
  measureNetworkRequest(url: string, duration: number) {
    this.metrics.push({
      type: 'network-request',
      url,
      duration,
      timestamp: Date.now()
    })
  }

  // 获取性能报告
  getPerformanceReport() {
    const avgPageLoad = this.metrics
      .filter(m => m.type === 'page-load')
      .reduce((avg, m) => (avg + m.loadComplete) / 2, 0)

    const avgComponentRender = this.metrics
      .filter(m => m.type === 'component-render')
      .reduce((avg, m) => (avg + m.renderTime) / 2, 0)

    const avgNetworkRequest = this.metrics
      .filter(m => m.type === 'network-request')
      .reduce((avg, m) => (avg + m.duration) / 2, 0)

    return {
      pageLoad: avgPageLoad,
      componentRender: avgComponentRender,
      networkRequest: avgNetworkRequest,
      totalMetrics: this.metrics.length
    }
  }
}

export const performanceMonitor = new MobilePerformanceMonitor()