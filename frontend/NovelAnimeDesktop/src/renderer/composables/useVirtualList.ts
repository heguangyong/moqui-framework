/**
 * Virtual List Composable
 * 虚拟滚动列表 - 用于优化大列表性能
 * 
 * Requirements: 9.2, 9.3
 */

import { ref, computed, watch, onMounted, onUnmounted, type Ref } from 'vue'

export interface VirtualListOptions {
  itemHeight: number
  overscan?: number
  containerHeight?: number
}

export interface VirtualListItem<T> {
  index: number
  data: T
  offsetTop: number
}

export function useVirtualList<T = any>(
  list: Ref<T[]>,
  options: VirtualListOptions
) {
  const { itemHeight, overscan = 5, containerHeight = 600 } = options

  // 滚动容器引用
  const containerRef = ref<HTMLElement | null>(null)
  const scrollTop = ref(0)

  // 计算可见范围
  const visibleRange = computed(() => {
    const start = Math.floor(scrollTop.value / itemHeight)
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const end = start + visibleCount

    return {
      start: Math.max(0, start - overscan),
      end: Math.min(list.value.length, end + overscan)
    }
  })

  // 可见项目
  const visibleItems = computed<VirtualListItem<T>[]>(() => {
    const { start, end } = visibleRange.value
    const items: VirtualListItem<T>[] = []

    for (let i = start; i < end; i++) {
      items.push({
        index: i,
        data: list.value[i],
        offsetTop: i * itemHeight
      })
    }

    return items
  })

  // 总高度
  const totalHeight = computed(() => list.value.length * itemHeight)

  // 滚动偏移
  const offsetY = computed(() => visibleRange.value.start * itemHeight)

  // 处理滚动事件
  function handleScroll(event: Event) {
    const target = event.target as HTMLElement
    scrollTop.value = target.scrollTop
  }

  // 滚动到指定索引
  function scrollToIndex(index: number, behavior: ScrollBehavior = 'smooth') {
    if (!containerRef.value) return

    const targetScrollTop = index * itemHeight
    containerRef.value.scrollTo({
      top: targetScrollTop,
      behavior
    })
  }

  // 滚动到顶部
  function scrollToTop(behavior: ScrollBehavior = 'smooth') {
    scrollToIndex(0, behavior)
  }

  // 滚动到底部
  function scrollToBottom(behavior: ScrollBehavior = 'smooth') {
    scrollToIndex(list.value.length - 1, behavior)
  }

  return {
    containerRef,
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    visibleRange
  }
}
