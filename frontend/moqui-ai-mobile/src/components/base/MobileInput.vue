<template>
  <div :class="inputClasses">
    <label v-if="label" :for="inputId" class="mobile-input__label">
      {{ label }}
      <span v-if="required" class="mobile-input__required">*</span>
    </label>

    <div class="mobile-input__wrapper">
      <q-icon
        v-if="prefixIcon"
        :name="prefixIcon"
        class="mobile-input__prefix-icon"
      />

      <input
        :id="inputId"
        :value="modelValue"
        :type="inputType"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :class="fieldClasses"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keyup.enter="handleEnter"
      />

      <q-icon
        v-if="suffixIcon || (type === 'password' && showPasswordToggle)"
        :name="suffixIconName"
        class="mobile-input__suffix-icon"
        :class="{ 'mobile-input__suffix-icon--clickable': isPasswordToggle }"
        @click="handleSuffixClick"
      />

      <div v-if="loading" class="mobile-input__loading">
        <q-icon name="refresh" class="mobile-input__spinner" />
      </div>
    </div>

    <div v-if="hint || error" class="mobile-input__message">
      <span v-if="error" class="mobile-input__error">{{ error }}</span>
      <span v-else-if="hint" class="mobile-input__hint">{{ hint }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'

interface Props {
  modelValue: string | number
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'search'
  label?: string
  placeholder?: string
  hint?: string
  error?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'filled' | 'outlined' | 'borderless'
  prefixIcon?: string
  suffixIcon?: string
  showPasswordToggle?: boolean
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  loading?: boolean
  clearable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'md',
  variant: 'filled',
  showPasswordToggle: false,
  required: false,
  disabled: false,
  readonly: false,
  loading: false,
  clearable: false
})

interface Emits {
  'update:modelValue': [value: string | number]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  enter: [event: KeyboardEvent]
  clear: []
}

const emit = defineEmits<Emits>()

const isFocused = ref(false)
const showPassword = ref(false)

const inputId = computed(() => `mobile-input-${Math.random().toString(36).substr(2, 9)}`)

const inputType = computed(() => {
  if (props.type === 'password' && !showPassword.value) {
    return 'password'
  }
  return props.type
})

const isPasswordToggle = computed(() => {
  return props.type === 'password' && props.showPasswordToggle
})

const suffixIconName = computed(() => {
  if (isPasswordToggle.value) {
    return showPassword.value ? 'visibility_off' : 'visibility'
  }
  return props.suffixIcon
})

const inputClasses = computed(() => ({
  'mobile-input': true,
  [`mobile-input--${props.size}`]: true,
  [`mobile-input--${props.variant}`]: true,
  'mobile-input--focused': isFocused.value,
  'mobile-input--disabled': props.disabled,
  'mobile-input--readonly': props.readonly,
  'mobile-input--error': !!props.error,
  'mobile-input--loading': props.loading
}))

const fieldClasses = computed(() => ({
  'mobile-input__field': true,
  'mobile-input__field--with-prefix': !!props.prefixIcon,
  'mobile-input__field--with-suffix': !!props.suffixIcon || isPasswordToggle.value || props.loading
}))

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = props.type === 'number' ? Number(target.value) : target.value
  emit('update:modelValue', value)
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
}

const handleEnter = (event: KeyboardEvent) => {
  emit('enter', event)
}

const handleSuffixClick = () => {
  if (isPasswordToggle.value) {
    showPassword.value = !showPassword.value
  }
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.mobile-input {
  @include mobile-touch;

  position: relative;
  width: 100%;

  // 尺寸变体
  &--sm {
    .mobile-input__field {
      height: 36px;
      padding: $spacing-xs $spacing-sm;
      font-size: $font-size-sm;
    }

    .mobile-input__label {
      font-size: $font-size-sm;
      margin-bottom: $spacing-xs;
    }

    .mobile-input__prefix-icon,
    .mobile-input__suffix-icon {
      font-size: 16px;
    }
  }

  &--md {
    .mobile-input__field {
      height: 44px;
      padding: $spacing-sm $spacing-md;
      font-size: $font-size-base;
    }

    .mobile-input__label {
      font-size: $font-size-base;
      margin-bottom: $spacing-sm;
    }

    .mobile-input__prefix-icon,
    .mobile-input__suffix-icon {
      font-size: 18px;
    }
  }

  &--lg {
    .mobile-input__field {
      height: 52px;
      padding: $spacing-md $spacing-lg;
      font-size: $font-size-lg;
    }

    .mobile-input__label {
      font-size: $font-size-lg;
      margin-bottom: $spacing-md;
    }

    .mobile-input__prefix-icon,
    .mobile-input__suffix-icon {
      font-size: 20px;
    }
  }

  // 样式变体
  &--filled {
    .mobile-input__field {
      @include input-base;
      background: $gray-50;
    }
  }

  &--outlined {
    .mobile-input__field {
      background: transparent;
      border: 1px solid $gray-300;
      border-radius: $border-radius-md;
      transition: all $transition-base;

      &:hover:not(:disabled) {
        border-color: $gray-400;
      }

      &:focus {
        border-color: $primary-color;
        box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
        outline: none;
      }
    }
  }

  &--borderless {
    .mobile-input__field {
      background: transparent;
      border: none;
      border-bottom: 1px solid $gray-300;
      border-radius: 0;
      padding-left: 0;
      padding-right: 0;

      &:hover:not(:disabled) {
        border-bottom-color: $gray-400;
      }

      &:focus {
        border-bottom-color: $primary-color;
        outline: none;
      }
    }
  }

  // 特殊状态
  &--focused {
    .mobile-input__label {
      color: $primary-color;
    }
  }

  &--disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  &--readonly {
    .mobile-input__field {
      background: $gray-100;
      cursor: default;
    }
  }

  &--error {
    .mobile-input__field {
      border-color: $danger-color !important;

      &:focus {
        box-shadow: 0 0 0 3px rgba($danger-color, 0.1);
      }
    }

    .mobile-input__label {
      color: $danger-color;
    }
  }

  &--loading {
    .mobile-input__field {
      padding-right: 44px;
    }
  }

  // 输入框结构
  &__label {
    display: block;
    font-weight: $font-weight-medium;
    color: $gray-700;
    margin-bottom: $spacing-sm;
    line-height: $line-height-tight;
  }

  &__required {
    color: $danger-color;
    margin-left: 2px;
  }

  &__wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  &__field {
    width: 100%;
    border: none;
    outline: none;
    font-family: $font-family-sans;
    line-height: 1;
    color: $gray-800;
    background: transparent;

    &::placeholder {
      color: $gray-400;
    }

    &::-webkit-input-placeholder {
      color: $gray-400;
    }

    &::-moz-placeholder {
      color: $gray-400;
    }

    &:-ms-input-placeholder {
      color: $gray-400;
    }

    // 处理图标间距
    &--with-prefix {
      padding-left: 44px;
    }

    &--with-suffix {
      padding-right: 44px;
    }
  }

  &__prefix-icon,
  &__suffix-icon {
    position: absolute;
    color: $gray-500;
    pointer-events: none;

    &--clickable {
      pointer-events: auto;
      cursor: pointer;
      color: $gray-600;

      &:hover {
        color: $primary-color;
      }
    }
  }

  &__prefix-icon {
    left: $spacing-sm;
  }

  &__suffix-icon {
    right: $spacing-sm;
  }

  &__loading {
    position: absolute;
    right: $spacing-sm;
    pointer-events: none;
  }

  &__spinner {
    animation: spin 1s linear infinite;
    color: $primary-color;
  }

  &__message {
    margin-top: $spacing-xs;
    font-size: $font-size-sm;
    line-height: $line-height-normal;
  }

  &__error {
    color: $danger-color;
  }

  &__hint {
    color: $gray-500;
  }

  // 移动端优化
  @include mobile-only {
    &__field {
      min-height: 44px; // iOS 触摸目标最小尺寸

      // 禁用 iOS 默认样式
      -webkit-appearance: none;
      -webkit-border-radius: 0;

      // 禁用 iOS 缩放
      font-size: 16px !important;
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
  .mobile-input {
    &__label {
      color: $gray-300;
    }

    &__field {
      color: $gray-100;
      background: $gray-800;

      &::placeholder {
        color: $gray-500;
      }
    }

    &--filled {
      .mobile-input__field {
        background: $gray-700;
      }
    }

    &--outlined {
      .mobile-input__field {
        border-color: $gray-600;

        &:hover:not(:disabled) {
          border-color: $gray-500;
        }

        &:focus {
          border-color: $primary-light;
        }
      }
    }

    &--borderless {
      .mobile-input__field {
        border-bottom-color: $gray-600;

        &:hover:not(:disabled) {
          border-bottom-color: $gray-500;
        }

        &:focus {
          border-bottom-color: $primary-light;
        }
      }
    }

    &--readonly {
      .mobile-input__field {
        background: $gray-700;
      }
    }

    &__prefix-icon,
    &__suffix-icon {
      color: $gray-400;

      &--clickable {
        color: $gray-300;

        &:hover {
          color: $primary-light;
        }
      }
    }

    &__hint {
      color: $gray-400;
    }
  }
}
</style>