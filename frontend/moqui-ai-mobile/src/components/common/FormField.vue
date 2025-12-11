<template>
  <div class="form-field" :class="{ 'form-field--error': hasError }">
    <label v-if="label" class="form-field__label" :for="fieldId">
      {{ label }}
      <span v-if="required" class="form-field__required">*</span>
    </label>
    
    <div class="form-field__input-wrapper">
      <slot :error="hasError" :error-message="errorMessage" />
    </div>
    
    <Transition name="fade">
      <div v-if="hasError" class="form-field__error">
        <q-icon name="error" size="14px" />
        <span>{{ errorMessage }}</span>
      </div>
    </Transition>
    
    <div v-if="hint && !hasError" class="form-field__hint">
      {{ hint }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  label?: string
  error?: string | boolean
  hint?: string
  required?: boolean
  fieldId?: string
}

const props = withDefaults(defineProps<Props>(), {
  required: false
})

const hasError = computed(() => {
  if (typeof props.error === 'boolean') return props.error
  return !!props.error
})

const errorMessage = computed(() => {
  if (typeof props.error === 'string') return props.error
  return ''
})
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.form-field {
  margin-bottom: 16px;
  
  &__label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: $gray-700;
    margin-bottom: 6px;
  }
  
  &__required {
    color: #f44336;
    margin-left: 2px;
  }
  
  &__input-wrapper {
    position: relative;
  }
  
  &__error {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
    font-size: 12px;
    color: #f44336;
  }
  
  &__hint {
    margin-top: 4px;
    font-size: 12px;
    color: $gray-500;
  }
  
  &--error {
    :deep(.q-field__control) {
      border-color: #f44336 !important;
    }
    
    :deep(.q-input),
    :deep(.q-select) {
      .q-field__control {
        border-color: #f44336;
        background-color: rgba(244, 67, 54, 0.05);
      }
    }
  }
}

// Transition
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
