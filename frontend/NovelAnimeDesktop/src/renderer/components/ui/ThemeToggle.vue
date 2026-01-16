<template>
  <div class="theme-toggle">
    <button
      class="theme-toggle__btn"
      :class="{ 'theme-toggle__btn--active': isDark }"
      @click="handleToggle"
      :title="toggleTitle"
    >
      <!-- Sun icon (light mode) -->
      <svg
        v-if="!isDark"
        class="theme-toggle__icon"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
      
      <!-- Moon icon (dark mode) -->
      <svg
        v-else
        class="theme-toggle__icon"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
      
      <span v-if="showLabel" class="theme-toggle__label">
        {{ isDark ? '深色' : '浅色' }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'

interface Props {
  showLabel?: boolean
}

withDefaults(defineProps<Props>(), {
  showLabel: false
})

const { isDark, toggleTheme } = useTheme()

const toggleTitle = computed(() => {
  return isDark.value ? '切换到浅色模式' : '切换到深色模式'
})

function handleToggle() {
  toggleTheme()
}
</script>

<style scoped lang="scss">
.theme-toggle {
  &__btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: transparent;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: #f3f4f6;
      border-color: #9ca3af;
      color: #374151;
    }
    
    &--active {
      background: #1f2937;
      border-color: #374151;
      color: #f9fafb;
      
      &:hover {
        background: #111827;
        border-color: #4b5563;
      }
    }
  }
  
  &__icon {
    flex-shrink: 0;
    transition: transform 0.3s ease;
  }
  
  &__btn:hover &__icon {
    transform: rotate(15deg);
  }
  
  &__label {
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
  }
}

// Dark mode styles
@media (prefers-color-scheme: dark) {
  .theme-toggle__btn {
    border-color: #4b5563;
    color: #9ca3af;
    
    &:hover {
      background: #374151;
      border-color: #6b7280;
      color: #d1d5db;
    }
  }
}
</style>
