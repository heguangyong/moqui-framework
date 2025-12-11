<template>
  <div :class="cardClasses">
    <div v-if="$slots.header || title" class="mobile-card__header">
      <slot name="header">
        <h3 class="mobile-card__title">{{ title }}</h3>
        <p v-if="subtitle" class="mobile-card__subtitle">{{ subtitle }}</p>
      </slot>
    </div>

    <div class="mobile-card__content">
      <slot>
        <p v-if="content">{{ content }}</p>
      </slot>
    </div>

    <div v-if="$slots.actions || showActions" class="mobile-card__actions">
      <slot name="actions">
        <div class="mobile-card__actions-default">
          <q-btn
            v-if="primaryAction"
            :label="primaryAction.label"
            :color="primaryAction.color || 'primary'"
            @click="primaryAction.handler"
          />
          <q-btn
            v-if="secondaryAction"
            :label="secondaryAction.label"
            flat
            :color="secondaryAction.color || 'grey'"
            @click="secondaryAction.handler"
          />
        </div>
      </slot>
    </div>

    <div v-if="$slots.footer" class="mobile-card__footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface CardAction {
  label: string
  handler: () => void
  color?: string
}

interface Props {
  title?: string
  subtitle?: string
  content?: string
  variant?: 'elevated' | 'outlined' | 'filled'
  size?: 'sm' | 'md' | 'lg'
  rounded?: boolean
  clickable?: boolean
  loading?: boolean
  showActions?: boolean
  primaryAction?: CardAction
  secondaryAction?: CardAction
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'elevated',
  size: 'md',
  rounded: true,
  clickable: false,
  loading: false,
  showActions: false
})

interface Emits {
  click: [event: MouseEvent]
}

const emit = defineEmits<Emits>()

const cardClasses = computed(() => ({
  'mobile-card': true,
  [`mobile-card--${props.variant}`]: true,
  [`mobile-card--${props.size}`]: true,
  'mobile-card--rounded': props.rounded,
  'mobile-card--clickable': props.clickable,
  'mobile-card--loading': props.loading
}))

const handleClick = (event: MouseEvent) => {
  if (props.clickable && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.mobile-card {
  @include card-base;
  @include mobile-touch;

  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  // 尺寸变体
  &--sm {
    padding: $spacing-sm;

    .mobile-card__title {
      font-size: $font-size-base;
      margin-bottom: $spacing-xs;
    }

    .mobile-card__subtitle {
      font-size: $font-size-sm;
    }

    .mobile-card__content {
      font-size: $font-size-sm;
    }
  }

  &--md {
    padding: $spacing-md;

    .mobile-card__title {
      font-size: $font-size-lg;
      margin-bottom: $spacing-sm;
    }

    .mobile-card__subtitle {
      font-size: $font-size-base;
    }

    .mobile-card__content {
      font-size: $font-size-base;
    }
  }

  &--lg {
    padding: $spacing-lg;

    .mobile-card__title {
      font-size: $font-size-xl;
      margin-bottom: $spacing-md;
    }

    .mobile-card__subtitle {
      font-size: $font-size-lg;
    }

    .mobile-card__content {
      font-size: $font-size-lg;
    }
  }

  // 样式变体
  &--elevated {
    background: $bg-secondary;
    box-shadow: $shadow-card;
    border: none;

    @include card-hover;
  }

  &--outlined {
    background: $bg-primary;
    border: 1px solid $gray-200;
    box-shadow: none;

    &:hover {
      border-color: $primary-color;
      background: $bg-secondary;
    }
  }

  &--filled {
    @include gradient-primary;
    color: $white;
    border: none;

    .mobile-card__title,
    .mobile-card__subtitle,
    .mobile-card__content {
      color: inherit;
    }
  }

  // 特殊状态
  &--rounded {
    border-radius: $border-radius-xl;
  }

  &--clickable {
    cursor: pointer;
    transition: all $transition-base;

    &:hover {
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0);
    }
  }

  &--loading {
    pointer-events: none;
    opacity: 0.7;

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 24px;
      height: 24px;
      margin: -12px 0 0 -12px;
      border: 2px solid $primary-color;
      border-top-color: transparent;
      border-radius: $border-radius-full;
      animation: spin 1s linear infinite;
      z-index: 10;
    }
  }

  // 卡片结构
  &__header {
    margin-bottom: $spacing-sm;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__title {
    margin: 0;
    font-weight: $font-weight-semibold;
    color: $gray-800;
    line-height: $line-height-tight;
  }

  &__subtitle {
    margin: $spacing-xs 0 0;
    color: $gray-600;
    line-height: $line-height-normal;
  }

  &__content {
    flex: 1;
    color: $gray-700;
    line-height: $line-height-relaxed;

    p {
      margin: 0;

      &:not(:last-child) {
        margin-bottom: $spacing-sm;
      }
    }
  }

  &__actions {
    margin-top: $spacing-md;
    padding-top: $spacing-sm;
    border-top: 1px solid $gray-200;

    &-default {
      display: flex;
      gap: $spacing-sm;
      justify-content: flex-end;

      @include mobile-only {
        flex-direction: column;

        .q-btn {
          width: 100%;
        }
      }
    }
  }

  &__footer {
    margin-top: $spacing-md;
    padding-top: $spacing-sm;
    border-top: 1px solid $gray-200;
    font-size: $font-size-sm;
    color: $gray-500;
    text-align: center;
  }

  // 移动端优化
  @include mobile-only {
    padding: $spacing-sm;
    margin-bottom: $spacing-sm;

    &--clickable {
      // 移动端触摸反馈
      -webkit-tap-highlight-color: rgba($primary-color, 0.1);
    }

    &__actions-default {
      gap: $spacing-xs;
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
  .mobile-card {
    &--elevated {
      background: $gray-800;
      border-color: $gray-600;
    }

    &--outlined {
      background: $gray-900;
      border-color: $gray-600;

      &:hover {
        background: $gray-800;
        border-color: $primary-light;
      }
    }

    &__title {
      color: $gray-100;
    }

    &__subtitle {
      color: $gray-300;
    }

    &__content {
      color: $gray-200;
    }

    &__actions,
    &__footer {
      border-top-color: $gray-600;
    }

    &__footer {
      color: $gray-400;
    }
  }
}
</style>