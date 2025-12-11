<template>
  <div class="mobile-card" :class="componentClasses" @click="handleClick">
    <!-- MobileCard content -->
    <slot name="header">
      <div class="">
        <h3 class="text-h6">{{ title || 'MobileCard' }}</h3>
      </div>
    </slot>

    <div class="">
      <slot>
        <!-- Default content -->
        <p class="text-body1">{{ content || 'MobileCard component content' }}</p>
      </slot>
    </div>

    <slot name="footer">
      <div class="" v-if="showFooter">
        <!-- Footer content -->
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

// 🎯 组件属性定义
interface Props {
  title?: string
  content?: string
  showFooter?: boolean
  loading?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showFooter: false,
  loading: false,
  disabled: false
})

// 🔔 事件定义
interface Emits {
  click: [event: MouseEvent]
  change: [value: any]
}

const emit = defineEmits<Emits>()

// 📊 响应式状态
const isActive = ref(false)
const internalValue = ref('')

// 💻 计算属性
const componentClasses = computed(() => ({
  'mobile-card--active': isActive.value,
  'mobile-card--loading': props.loading,
  'mobile-card--disabled': props.disabled
}))

// 🎬 方法定义
const handleClick = (event: MouseEvent) => {
  if (props.disabled) return

  isActive.value = !isActive.value
  emit('click', event)
}

const handleChange = (value: any) => {
  internalValue.value = value
  emit('change', value)
}

// 🔄 暴露给父组件的方法和属性
defineExpose({
  isActive,
  handleClick,
  handleChange
})
</script>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.mobile-card {
  @include card-base;
  padding: $spacing-md;

  // 🎨 组件状态
  &--active {
    border-color: $primary-color;
    box-shadow: 0 0 0 2px rgba($primary-color, 0.1);
  }

  &--loading {
    opacity: 0.7;
    pointer-events: none;

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 20px;
      height: 20px;
      margin: -10px 0 0 -10px;
      border: 2px solid $primary-color;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  }

  &--disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  // 📱 移动端优化
  @include mobile-only {
    padding: $spacing-sm;

    &__header {
      margin-bottom: $spacing-sm;
    }
  }

  // 🎯 子元素样式
  &__header {
    margin-bottom: $spacing-md;
    padding-bottom: $spacing-sm;
    border-bottom: 1px solid $gray-200;

    h3 {
      margin: 0;
      color: $gray-800;
      font-weight: $font-weight-semibold;
    }
  }

  &__content {
    min-height: 60px;

    @include center-flex;
    flex-direction: column;
  }

  &__footer {
    margin-top: $spacing-md;
    padding-top: $spacing-sm;
    border-top: 1px solid $gray-200;
    text-align: center;
  }
}

// 🎵 动画定义
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 🌓 暗色模式支持
@media (prefers-color-scheme: dark) {
  .mobile-card {
    background: $gray-800;
    border-color: $gray-600;
    color: $gray-100;

    &__header {
      border-bottom-color: $gray-600;

      h3 {
        color: $gray-100;
      }
    }

    &__footer {
      border-top-color: $gray-600;
    }
  }
}
</style>
