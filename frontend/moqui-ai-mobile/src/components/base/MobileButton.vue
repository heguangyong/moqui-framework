<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <q-icon
      v-if="loading"
      name="refresh"
      class="mobile-button__spinner"
    />
    <q-icon
      v-else-if="icon"
      :name="icon"
      class="mobile-button__icon"
    />
    <span v-if="!iconOnly" class="mobile-button__text">
      <slot>{{ label }}</slot>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  label?: string
  type?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  variant?: 'filled' | 'outlined' | 'text'
  icon?: string
  iconOnly?: boolean
  loading?: boolean
  disabled?: boolean
  block?: boolean
  rounded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'primary',
  size: 'md',
  variant: 'filled',
  loading: false,
  disabled: false,
  block: false,
  rounded: false,
  iconOnly: false
})

interface Emits {
  click: [event: MouseEvent]
}

const emit = defineEmits<Emits>()

const buttonClasses = computed(() => ({
  'mobile-button': true,
  [`mobile-button--${props.type}`]: true,
  [`mobile-button--${props.size}`]: true,
  [`mobile-button--${props.variant}`]: true,
  'mobile-button--block': props.block,
  'mobile-button--rounded': props.rounded,
  'mobile-button--icon-only': props.iconOnly,
  'mobile-button--loading': props.loading,
  'mobile-button--disabled': props.disabled
}))

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.mobile-button {
  @include button-base;
  @include mobile-touch;

  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-xs;
  border: 1px solid transparent;
  font-family: $font-family-sans;
  line-height: 1;
  cursor: pointer;

  // 尺寸变体
  &--sm {
    padding: $spacing-xs $spacing-sm;
    font-size: $font-size-sm;
    height: 32px;
    min-width: 64px;
  }

  &--md {
    padding: $spacing-sm $spacing-md;
    font-size: $font-size-base;
    height: 40px;
    min-width: 80px;
  }

  &--lg {
    padding: $spacing-md $spacing-lg;
    font-size: $font-size-lg;
    height: 48px;
    min-width: 96px;
  }

  // 颜色变体
  &--primary {
    &.mobile-button--filled {
      @include gradient-primary;
      color: $white;

      &:hover:not(.mobile-button--disabled) {
        transform: translateY(-2px);
        box-shadow: $shadow-button;
      }
    }

    &.mobile-button--outlined {
      background: transparent;
      border-color: $primary-color;
      color: $primary-color;

      &:hover:not(.mobile-button--disabled) {
        background: rgba($primary-color, 0.1);
      }
    }

    &.mobile-button--text {
      background: transparent;
      color: $primary-color;

      &:hover:not(.mobile-button--disabled) {
        background: rgba($primary-color, 0.1);
      }
    }
  }

  &--secondary {
    &.mobile-button--filled {
      background: $gray-500;
      color: $white;
    }

    &.mobile-button--outlined {
      border-color: $gray-500;
      color: $gray-500;
    }

    &.mobile-button--text {
      color: $gray-500;
    }
  }

  &--success {
    &.mobile-button--filled {
      background: $success-color;
      color: $white;
    }

    &.mobile-button--outlined {
      border-color: $success-color;
      color: $success-color;
    }

    &.mobile-button--text {
      color: $success-color;
    }
  }

  &--warning {
    &.mobile-button--filled {
      background: $warning-color;
      color: $white;
    }

    &.mobile-button--outlined {
      border-color: $warning-color;
      color: $warning-color;
    }

    &.mobile-button--text {
      color: $warning-color;
    }
  }

  &--danger {
    &.mobile-button--filled {
      background: $danger-color;
      color: $white;
    }

    &.mobile-button--outlined {
      border-color: $danger-color;
      color: $danger-color;
    }

    &.mobile-button--text {
      color: $danger-color;
    }
  }

  // 特殊状态
  &--block {
    width: 100%;

    @include mobile-only {
      margin-bottom: $spacing-sm;
    }
  }

  &--rounded {
    border-radius: $border-radius-2xl;
  }

  &--icon-only {
    min-width: auto;
    aspect-ratio: 1;

    &.mobile-button--sm {
      width: 32px;
    }

    &.mobile-button--md {
      width: 40px;
    }

    &.mobile-button--lg {
      width: 48px;
    }
  }

  &--loading {
    pointer-events: none;

    .mobile-button__spinner {
      animation: spin 1s linear infinite;
    }
  }

  &--disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  // 图标和文本
  &__icon {
    font-size: 1.2em;
  }

  &__text {
    font-weight: $font-weight-medium;
  }

  // 移动端优化
  @include mobile-only {
    &:not(.mobile-button--sm) {
      min-height: 44px; // iOS 触摸目标最小尺寸
    }

    &.mobile-button--block {
      margin: $spacing-xs 0;
    }
  }
}

// 动画定义
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 暗色模式支持
@media (prefers-color-scheme: dark) {
  .mobile-button {
    &--secondary {
      &.mobile-button--filled {
        background: $gray-600;
      }
    }

    &.mobile-button--outlined {
      &:hover:not(.mobile-button--disabled) {
        background: rgba(255, 255, 255, 0.1);
      }
    }

    &.mobile-button--text {
      &:hover:not(.mobile-button--disabled) {
        background: rgba(255, 255, 255, 0.1);
      }
    }
  }
}
</style>