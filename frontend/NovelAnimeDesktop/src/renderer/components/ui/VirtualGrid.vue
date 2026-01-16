<!--
  Virtual Grid Component
  虚拟网格组件 - 用于优化大量卡片的渲染性能
  
  Requirements: 9.2, 9.3
-->

<template>
  <div 
    ref="containerRef"
    class="virtual-grid"
    :style="{ height: `${containerHeight}px` }"
    @scroll="handleScroll"
  >
    <div 
      class="virtual-grid__spacer"
      :style="{ height: `${totalHeight}px` }"
    >
      <div 
        class="virtual-grid__content"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <div 
          v-for="item in visibleItems" 
          :key="getItemKey(item.data)"
          class="virtual-grid__item"
          :style="getItemStyle(item)"
        >
          <slot :item="item.data" :index="item.index"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

interface Props {
  items: T[]
  itemHeight: number
  itemWidth: number
  gap?: number
  containerHeight?: number
  overscan?: number
  keyField?: string
}

const props = withDefaults(defineProps<Props>(), {
  gap: 16,
  containerHeight: 600,
  overscan: 2,
  keyField: 'id'
})

const containerRef = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
const containerWidth = ref(0)

// 计算每行可以显示多少列
const columns = computed(() => {
  if (containerWidth.value === 0) return 1
  return Math.floor((containerWidth.value + props.gap) / (props.itemWidth + props.gap))
})

// 计算总行数
const totalRows = computed(() => {
  return Math.ceil(props.items.length / columns.value)
})

// 计算每行的高度（包括gap）
const rowHeight = computed(() => {
  return props.itemHeight + props.gap
})

// 计算总高度
const totalHeight = computed(() => {
  return totalRows.value * rowHeight.value
})

// 计算可见范围
const visibleRange = computed(() => {
  const startRow = Math.floor(scrollTop.value / rowHeight.value)
  const visibleRows = Math.ceil(props.containerHeight / rowHeight.value)
  const endRow = startRow + visibleRows

  return {
    startRow: Math.max(0, startRow - props.overscan),
    endRow: Math.min(totalRows.value, endRow + props.overscan)
  }
})

// 可见项目
const visibleItems = computed(() => {
  const { startRow, endRow } = visibleRange.value
  const items: Array<{ index: number; data: T; row: number; col: number }> = []

  for (let row = startRow; row < endRow; row++) {
    for (let col = 0; col < columns.value; col++) {
      const index = row * columns.value + col
      if (index < props.items.length) {
        items.push({
          index,
          data: props.items[index],
          row,
          col
        })
      }
    }
  }

  return items
})

// 滚动偏移
const offsetY = computed(() => {
  return visibleRange.value.startRow * rowHeight.value
})

// 获取项目key
function getItemKey(item: T): string | number {
  if (typeof item === 'object' && item !== null && props.keyField in item) {
    return (item as any)[props.keyField]
  }
  return JSON.stringify(item)
}

// 获取项目样式
function getItemStyle(item: { row: number; col: number }) {
  const left = item.col * (props.itemWidth + props.gap)
  const top = (item.row - visibleRange.value.startRow) * rowHeight.value

  return {
    position: 'absolute',
    left: `${left}px`,
    top: `${top}px`,
    width: `${props.itemWidth}px`,
    height: `${props.itemHeight}px`
  }
}

// 处理滚动
function handleScroll(event: Event) {
  const target = event.target as HTMLElement
  scrollTop.value = target.scrollTop
}

// 更新容器宽度
function updateContainerWidth() {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.clientWidth
  }
}

// 监听容器大小变化
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  updateContainerWidth()

  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateContainerWidth()
    })
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver && containerRef.value) {
    resizeObserver.unobserve(containerRef.value)
    resizeObserver.disconnect()
  }
})

// 监听items变化，重置滚动位置
watch(() => props.items.length, () => {
  if (containerRef.value) {
    containerRef.value.scrollTop = 0
    scrollTop.value = 0
  }
})
</script>

<style scoped>
.virtual-grid {
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

.virtual-grid__spacer {
  position: relative;
  width: 100%;
}

.virtual-grid__content {
  position: relative;
  width: 100%;
}

.virtual-grid__item {
  position: absolute;
}

/* 滚动条样式 */
.virtual-grid::-webkit-scrollbar {
  width: 8px;
}

.virtual-grid::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.virtual-grid::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.virtual-grid::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>
