// 移动端调试信息
export const getDeviceInfo = () => {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    screenSize: {
      width: window.screen.width,
      height: window.screen.height
    },
    viewportSize: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    touchSupport: 'ontouchstart' in window,
    pixelRatio: window.devicePixelRatio || 1
  }
}

export const logDeviceInfo = () => {
  console.log('📱 设备信息:', getDeviceInfo())
}

// 移动端错误收集
export const setupMobileErrorTracking = () => {
  window.addEventListener('error', (e) => {
    console.error('📱 移动端错误:', e.error)
  })

  window.addEventListener('unhandledrejection', (e) => {
    console.error('📱 未处理的Promise拒绝:', e.reason)
  })
}