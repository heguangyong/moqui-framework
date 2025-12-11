#!/bin/bash
# Moqui AI Mobile - 开发优化脚本
# 🚀 自动化开发环境优化与监控

echo "🎯 Moqui AI Mobile 开发环境优化器"
echo "=================================="

# 1. 检查开发服务器状态
check_dev_server() {
    echo "📡 检查开发服务器状态..."

    # 检查5173端口状态
    if curl -s "http://localhost:5173" > /dev/null 2>&1; then
        echo "✅ 开发服务器运行正常 (localhost:5173)"

        # 获取本机IP地址
        LOCAL_IP=$(ifconfig | grep "inet " | grep -v "127.0.0.1" | head -n 1 | awk '{print $2}')
        if [ ! -z "$LOCAL_IP" ]; then
            echo "📱 移动端访问地址: http://$LOCAL_IP:5173"

            # 生成二维码便于移动端访问
            if command -v qrencode > /dev/null 2>&1; then
                echo "📲 移动端访问二维码:"
                qrencode -t UTF8 "http://$LOCAL_IP:5173"
            fi
        fi
    else
        echo "❌ 开发服务器未运行，正在启动..."
        npm run dev -- --host --port 5173 &
        sleep 5
    fi
}

# 2. 代码质量检查
code_quality_check() {
    echo ""
    echo "🔍 代码质量检查..."

    if [ -f "package.json" ]; then
        # TypeScript 类型检查
        if npm run type-check > /dev/null 2>&1; then
            echo "✅ TypeScript 类型检查通过"
        else
            echo "⚠️ TypeScript 类型检查发现问题"
        fi

        # ESLint 检查
        if npm run lint > /dev/null 2>&1; then
            echo "✅ ESLint 检查通过"
        else
            echo "⚠️ ESLint 检查发现问题"
        fi
    fi
}

# 3. 样式系统验证
style_system_check() {
    echo ""
    echo "🎨 样式系统验证..."

    # 检查关键样式文件
    local style_files=(
        "src/styles/variables.scss"
        "src/styles/mixins.scss"
        "src/styles/global.scss"
    )

    for file in "${style_files[@]}"; do
        if [ -f "$file" ]; then
            echo "✅ $file 存在"
        else
            echo "❌ $file 缺失"
        fi
    done
}

# 4. 组件生成器测试
component_generator_test() {
    echo ""
    echo "🧩 组件生成器测试..."

    if [ -x "tools/create-component.sh" ]; then
        echo "✅ 组件生成器可执行"
        echo "📋 使用示例:"
        echo "   ./tools/create-component.sh TestButton"
        echo "   ./tools/create-component.sh UserCard business"
        echo "   ./tools/create-component.sh VoiceInput ai"
    else
        echo "❌ 组件生成器不可执行"
        chmod +x tools/create-component.sh 2>/dev/null && echo "✅ 已修复权限"
    fi
}

# 5. 依赖检查
dependency_check() {
    echo ""
    echo "📦 依赖检查..."

    # 检查关键开发依赖
    local critical_deps=("vue" "quasar" "typescript" "vite")

    if [ -f "package.json" ]; then
        for dep in "${critical_deps[@]}"; do
            if grep -q "\"$dep\"" package.json; then
                echo "✅ $dep 已安装"
            else
                echo "❌ $dep 缺失"
            fi
        done
    fi
}

# 6. 移动端调试辅助
mobile_debug_helper() {
    echo ""
    echo "📱 移动端调试辅助..."

    # 创建调试信息文件
    cat > src/utils/debug-info.ts << 'EOF'
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
EOF

    echo "✅ 移动端调试工具已生成: src/utils/debug-info.ts"
}

# 7. 性能监控工具
performance_monitor() {
    echo ""
    echo "⚡ 性能监控工具..."

    # 创建性能监控脚本
    cat > src/utils/performance-monitor.ts << 'EOF'
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
EOF

    echo "✅ 性能监控工具已生成: src/utils/performance-monitor.ts"
}

# 主执行流程
main() {
    cd "$(dirname "$0")/.." || exit 1

    check_dev_server
    code_quality_check
    style_system_check
    component_generator_test
    dependency_check
    mobile_debug_helper
    performance_monitor

    echo ""
    echo "🎉 开发环境优化完成！"
    echo ""
    echo "🚀 快速命令:"
    echo "   npm run dev              # 启动开发服务器"
    echo "   ./tools/create-component.sh ComponentName  # 生成组件"
    echo "   npm run build            # 构建项目"
    echo "   npm run preview          # 预览构建结果"
    echo ""
    echo "📱 移动端测试："
    echo "   在移动设备上访问开发服务器地址"
    echo "   使用浏览器开发者工具的移动模拟器"
    echo ""
    echo "💡 提示：运行 ./tools/dev-optimize.sh 重新检查环境状态"
}

main "$@"