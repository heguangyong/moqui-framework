# Vue3 开发规范

> **用途**: Vue3 Composition API开发的统一技术规范  
> **适用**: 所有Vue3组件开发

## 🎯 核心规则

### 规则1: 使用Composition API
**优先使用`<script setup>`语法，避免Options API**

### 规则2: 使用TypeScript
**所有组件使用TypeScript定义类型**

### 规则3: Props和Emits明确定义
**使用TypeScript接口定义Props和Emits**

## 📝 组件基本结构

```vue
<template>
  <div class="my-component">
    <h2>{{ title }}</h2>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// Props定义
interface Props {
  title: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
})

// Emits定义
const emit = defineEmits<{
  'update': [value: string]
  'delete': [id: number]
}>()

// State
const localValue = ref('')

// Computed
const displayValue = computed(() => {
  return `${props.title}: ${localValue.value}`
})

// Methods
const handleUpdate = () => {
  emit('update', localValue.value)
}

// Lifecycle
onMounted(() => {
  console.log('Component mounted')
})
</script>

<style scoped lang="scss">
.my-component {
  padding: 16px;
}
</style>
```

## 📝 响应式数据

```typescript
import { ref, reactive, computed, watch } from 'vue'

// ref - 基本类型
const count = ref(0)
const name = ref('John')

// reactive - 对象
const state = reactive({
  user: {
    name: 'John',
    age: 30
  },
  items: []
})

// computed - 计算属性
const fullName = computed(() => {
  return `${state.user.name} (${state.user.age})`
})

// watch - 监听变化
watch(count, (newVal, oldVal) => {
  console.log(`Count changed from ${oldVal} to ${newVal}`)
})

// watchEffect - 自动追踪依赖
watchEffect(() => {
  console.log(`Count is ${count.value}`)
})
```

## 📝 Composables

```typescript
// composables/useCounter.ts
import { ref, computed } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)
  
  const double = computed(() => count.value * 2)
  
  const increment = () => {
    count.value++
  }
  
  const decrement = () => {
    count.value--
  }
  
  return {
    count,
    double,
    increment,
    decrement
  }
}

// 使用
import { useCounter } from '@/composables/useCounter'

const { count, double, increment } = useCounter(10)
```

## ⚠️ 常见错误

### 错误1: 忘记.value

```typescript
// ❌ 错误
const count = ref(0)
console.log(count)  // Ref对象，不是值

// ✅ 正确
console.log(count.value)  // 0
```

### 错误2: 解构响应式对象

```typescript
// ❌ 错误：丢失响应性
const state = reactive({ count: 0 })
const { count } = state

// ✅ 正确：使用toRefs
import { toRefs } from 'vue'
const { count } = toRefs(state)
```

## 🎓 最佳实践

1. 使用`<script setup>`语法
2. 明确定义Props和Emits类型
3. 使用Composables复用逻辑
4. 合理使用computed和watch
5. 在onUnmounted中清理资源

## 📚 相关规范

- **Quasar规范**: `.kiro/rules/standards/frontend/quasar.md`
- **TypeScript规范**: `.kiro/rules/standards/frontend/typescript.md`

---

**版本**: v1.0  
**创建日期**: 2025-01-16
