# 前端开发场景

> **用途**: 前端应用开发的完整工作流程和前提条件  
> **适用**: 所有Vue3 + Quasar2前端开发任务

## 🎯 场景概述

开发前端应用时，需要遵循Vue3 Composition API和Quasar2框架的最佳实践，确保代码质量、性能优化和用户体验。

## ✅ 前提条件检查

### 1. 环境准备
- [ ] Node.js和npm已安装
- [ ] Vue3和Quasar2项目已初始化
- [ ] 开发服务器可正常启动
- [ ] 了解项目目录结构

### 2. 技术栈
- [ ] 了解Vue3 Composition API
- [ ] 了解Quasar2组件库
- [ ] 了解TypeScript基础
- [ ] 了解Pinia状态管理

### 3. 开发规范
- [ ] 了解组件命名规范
- [ ] 了解代码风格规范
- [ ] 了解响应式设计原则
- [ ] 了解性能优化原则

## 📋 标准开发流程

### 阶段1: 项目结构规划

```
src/
├── renderer/
│   ├── components/        # 组件
│   │   ├── ui/           # UI组件
│   │   ├── dialogs/      # 对话框组件
│   │   └── tutorial/     # 教程组件
│   ├── views/            # 页面视图
│   ├── composables/      # 组合式函数
│   ├── services/         # API服务
│   ├── stores/           # Pinia状态管理
│   ├── router/           # 路由配置
│   ├── styles/           # 样式文件
│   └── utils/            # 工具函数
├── main/                 # Electron主进程
└── preload/              # Electron预加载
```

### 阶段2: 组件开发

#### 步骤1: 创建组件文件

```vue
<!-- src/renderer/components/ui/MyComponent.vue -->
<template>
  <div class="my-component">
    <q-card>
      <q-card-section>
        <div class="text-h6">{{ title }}</div>
      </q-card-section>
      
      <q-card-section>
        <slot />
      </q-card-section>
      
      <q-card-actions align="right">
        <q-btn flat label="取消" @click="onCancel" />
        <q-btn color="primary" label="确认" @click="onConfirm" />
      </q-card-actions>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Props
interface Props {
  title: string
  modelValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': []
  'cancel': []
}>()

// State
const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Methods
const onConfirm = () => {
  emit('confirm')
  isVisible.value = false
}

const onCancel = () => {
  emit('cancel')
  isVisible.value = false
}
</script>

<style scoped lang="scss">
.my-component {
  // 组件样式
}
</style>
```

**参考**: `.kiro/rules/standards/frontend/vue.md`

#### 步骤2: 使用Quasar组件

```vue
<template>
  <q-page class="q-pa-md">
    <!-- 布局 -->
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6">标题</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
    
    <!-- 表单 -->
    <q-form @submit="onSubmit" class="q-gutter-md">
      <q-input
        v-model="form.name"
        label="名称"
        :rules="[val => !!val || '请输入名称']"
      />
      
      <q-select
        v-model="form.type"
        :options="typeOptions"
        label="类型"
      />
      
      <q-btn type="submit" color="primary" label="提交" />
    </q-form>
    
    <!-- 表格 -->
    <q-table
      :rows="rows"
      :columns="columns"
      row-key="id"
      :pagination="pagination"
    />
  </q-page>
</template>
```

**参考**: `.kiro/rules/standards/frontend/quasar.md`

### 阶段3: 状态管理

#### 步骤1: 创建Store

```typescript
// src/renderer/stores/myStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useMyStore = defineStore('my-store', () => {
  // State
  const items = ref<Item[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Getters
  const itemCount = computed(() => items.value.length)
  const hasItems = computed(() => items.value.length > 0)
  
  // Actions
  const fetchItems = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.getItems()
      items.value = response.data
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }
  
  const addItem = async (item: Item) => {
    try {
      const response = await api.createItem(item)
      items.value.push(response.data)
    } catch (e) {
      error.value = e.message
      throw e
    }
  }
  
  return {
    // State
    items,
    loading,
    error,
    // Getters
    itemCount,
    hasItems,
    // Actions
    fetchItems,
    addItem
  }
})
```

#### 步骤2: 在组件中使用Store

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useMyStore } from '@/stores/myStore'

const store = useMyStore()

onMounted(() => {
  store.fetchItems()
})

const handleAdd = async (item: Item) => {
  try {
    await store.addItem(item)
    // 成功提示
  } catch (e) {
    // 错误处理
  }
}
</script>
```

### 阶段4: API服务

#### 步骤1: 创建API服务

```typescript
// src/renderer/services/api.ts
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 处理未授权
    }
    return Promise.reject(error)
  }
)

export default api
```

#### 步骤2: 创建资源服务

```typescript
// src/renderer/services/itemService.ts
import api from './api'

export interface Item {
  id: string
  name: string
  type: string
}

export const itemService = {
  async getItems(): Promise<Item[]> {
    const response = await api.get('/items')
    return response.data
  },
  
  async getItem(id: string): Promise<Item> {
    const response = await api.get(`/items/${id}`)
    return response.data
  },
  
  async createItem(item: Partial<Item>): Promise<Item> {
    const response = await api.post('/items', item)
    return response.data
  },
  
  async updateItem(id: string, item: Partial<Item>): Promise<Item> {
    const response = await api.put(`/items/${id}`, item)
    return response.data
  },
  
  async deleteItem(id: string): Promise<void> {
    await api.delete(`/items/${id}`)
  }
}
```

### 阶段5: 响应式设计

#### 步骤1: 使用Quasar响应式类

```vue
<template>
  <!-- 响应式网格 -->
  <div class="row q-col-gutter-md">
    <div class="col-12 col-sm-6 col-md-4 col-lg-3">
      <q-card>内容</q-card>
    </div>
  </div>
  
  <!-- 响应式显示/隐藏 -->
  <div class="gt-sm">桌面端显示</div>
  <div class="lt-md">移动端显示</div>
  
  <!-- 响应式间距 -->
  <div class="q-pa-sm q-pa-md-md q-pa-lg-lg">
    内容
  </div>
</template>
```

#### 步骤2: 使用Composable

```typescript
// src/renderer/composables/useResponsive.ts
import { computed } from 'vue'
import { useQuasar } from 'quasar'

export function useResponsive() {
  const $q = useQuasar()
  
  const isMobile = computed(() => $q.screen.lt.sm)
  const isTablet = computed(() => $q.screen.sm || $q.screen.md)
  const isDesktop = computed(() => $q.screen.gt.md)
  
  const breakpoint = computed(() => {
    if ($q.screen.xs) return 'xs'
    if ($q.screen.sm) return 'sm'
    if ($q.screen.md) return 'md'
    if ($q.screen.lg) return 'lg'
    return 'xl'
  })
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    breakpoint
  }
}
```

### 阶段6: 性能优化

#### 步骤1: 虚拟滚动

```vue
<template>
  <q-virtual-scroll
    :items="items"
    virtual-scroll-item-size="48"
    style="max-height: 400px"
  >
    <template v-slot="{ item }">
      <q-item :key="item.id">
        <q-item-section>{{ item.name }}</q-item-section>
      </q-item>
    </template>
  </q-virtual-scroll>
</template>
```

#### 步骤2: 懒加载

```typescript
// src/renderer/composables/useLazyLoad.ts
import { ref, onMounted, onUnmounted } from 'vue'

export function useLazyLoad(callback: () => void) {
  const target = ref<HTMLElement | null>(null)
  let observer: IntersectionObserver | null = null
  
  onMounted(() => {
    if (!target.value) return
    
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback()
        }
      },
      { threshold: 0.1 }
    )
    
    observer.observe(target.value)
  })
  
  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
  })
  
  return { target }
}
```

#### 步骤3: 防抖和节流

```typescript
// src/renderer/composables/useDebounce.ts
import { ref, customRef } from 'vue'

export function useDebounce<T>(value: T, delay = 300) {
  return customRef((track, trigger) => {
    let timeout: NodeJS.Timeout
    
    return {
      get() {
        track()
        return value
      },
      set(newValue: T) {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          value = newValue
          trigger()
        }, delay)
      }
    }
  })
}
```

## ⚠️ 常见错误和解决方案

### 错误1: 响应式丢失
**原因**: 直接解构响应式对象  
**解决**: 使用`toRefs`或保持对象引用

```typescript
// ❌ 错误
const { name } = reactive({ name: 'test' })

// ✅ 正确
const state = reactive({ name: 'test' })
const { name } = toRefs(state)
```

### 错误2: 内存泄漏
**原因**: 未清理事件监听器或定时器  
**解决**: 在`onUnmounted`中清理

```typescript
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
```

### 错误3: 性能问题
**原因**: 大列表未使用虚拟滚动  
**解决**: 使用`q-virtual-scroll`或虚拟列表

### 错误4: 类型错误
**原因**: TypeScript类型定义不完整  
**解决**: 完善接口定义和类型注解

## 🔍 验证检查清单

### 开发前
- [ ] 项目结构清晰
- [ ] 依赖已安装
- [ ] 开发服务器可启动
- [ ] 了解技术栈

### 开发中
- [ ] 组件命名规范
- [ ] 使用Composition API
- [ ] 类型定义完整
- [ ] 响应式设计正确

### 开发后
- [ ] 代码无TypeScript错误
- [ ] 组件可正常渲染
- [ ] 响应式布局正常
- [ ] 性能优化到位

## 📚 相关技术规范

- **Vue规范**: `.kiro/rules/standards/frontend/vue.md`
- **Quasar规范**: `.kiro/rules/standards/frontend/quasar.md`
- **TypeScript规范**: `.kiro/rules/standards/frontend/typescript.md`
- **代码质量**: `.kiro/rules/standards/general/code-quality.md`

## 💡 最佳实践

### 1. 组件设计
- 单一职责原则
- Props向下，Events向上
- 合理使用插槽
- 提供默认值

### 2. 状态管理
- 全局状态用Pinia
- 局部状态用ref/reactive
- 避免过度使用全局状态
- 保持状态扁平化

### 3. 性能优化
- 使用虚拟滚动
- 懒加载图片和组件
- 防抖和节流
- 避免不必要的计算

### 4. 代码质量
- 完善的类型定义
- 清晰的命名
- 适当的注释
- 统一的代码风格

---

**版本**: v1.0  
**创建日期**: 2025-01-16  
**适用范围**: 所有Vue3 + Quasar2前端开发
