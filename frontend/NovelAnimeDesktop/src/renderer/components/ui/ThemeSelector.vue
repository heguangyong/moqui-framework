<template>
  <div class="theme-selector">
    <div class="theme-selector__options">
      <button
        v-for="option in themeOptions"
        :key="option.value"
        class="theme-option"
        :class="{ 'theme-option--active': currentTheme === option.value }"
        @click="handleSelect(option.value)"
      >
        <div class="theme-option__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <!-- Sun icon -->
            <template v-if="option.value === 'light'">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </template>
            
            <!-- Moon icon -->
            <template v-else-if="option.value === 'dark'">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </template>
            
            <!-- Monitor icon -->
            <template v-else>
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </template>
          </svg>
        </div>
        
        <div class="theme-option__content">
          <div class="theme-option__label">{{ option.label }}</div>
          <div class="theme-option__description">{{ option.description }}</div>
        </div>
        
        <div v-if="currentTheme === option.value" class="theme-option__check">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      </button>
    </div>
    
    <!-- Preview -->
    <div class="theme-selector__preview">
      <div class="preview-card" :class="`preview-card--${actualTheme}`">
        <div class="preview-card__header">
          <div class="preview-dot"></div>
          <div class="preview-dot"></div>
          <div class="preview-dot"></div>
        </div>
        <div class="preview-card__content">
          <div class="preview-line preview-line--title"></div>
          <div class="preview-line preview-line--text"></div>
          <div class="preview-line preview-line--text"></div>
          <div class="preview-button"></div>
        </div>
      </div>
      <div class="preview-label">
        当前预览: {{ getThemeLabel(actualTheme) }}
        <span v-if="currentTheme === 'auto'" class="preview-hint">
          (系统: {{ getThemeLabel(systemPreference) }})
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme, type Theme } from '@/composables/useTheme'

const {
  currentTheme,
  actualTheme,
  systemPreference,
  setTheme,
  getThemeLabel
} = useTheme()

interface ThemeOption {
  value: Theme
  label: string
  description: string
}

const themeOptions: ThemeOption[] = [
  {
    value: 'light',
    label: '浅色',
    description: '始终使用浅色主题'
  },
  {
    value: 'dark',
    label: '深色',
    description: '始终使用深色主题'
  },
  {
    value: 'auto',
    label: '跟随系统',
    description: '根据系统设置自动切换'
  }
]

function handleSelect(theme: Theme) {
  setTheme(theme)
}
</script>

<style scoped lang="scss">
.theme-selector {
  display: flex;
  flex-direction: column;
  gap: 24px;
  
  &__options {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  &__preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 24px;
    background: #f9fafb;
    border-radius: 12px;
  }
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #d1d5db;
    background: #f9fafb;
  }
  
  &--active {
    border-color: #3b82f6;
    background: #eff6ff;
    
    .theme-option__icon {
      color: #3b82f6;
    }
  }
  
  &__icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: #f3f4f6;
    border-radius: 10px;
    color: #6b7280;
    transition: all 0.2s ease;
  }
  
  &--active &__icon {
    background: #dbeafe;
    color: #3b82f6;
  }
  
  &__content {
    flex: 1;
    min-width: 0;
  }
  
  &__label {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 4px;
  }
  
  &__description {
    font-size: 14px;
    color: #6b7280;
  }
  
  &__check {
    flex-shrink: 0;
    color: #3b82f6;
  }
}

.preview-card {
  width: 280px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &--dark {
    background: #1f2937;
    border-color: #374151;
    
    .preview-card__header {
      background: #111827;
      border-bottom-color: #374151;
    }
    
    .preview-line {
      background: #4b5563;
    }
    
    .preview-button {
      background: #3b82f6;
    }
  }
  
  &__header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }
  
  &__content {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.preview-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #d1d5db;
}

.preview-line {
  height: 8px;
  border-radius: 4px;
  background: #e5e7eb;
  
  &--title {
    width: 60%;
    height: 12px;
  }
  
  &--text {
    width: 100%;
    
    &:last-of-type {
      width: 80%;
    }
  }
}

.preview-button {
  width: 80px;
  height: 32px;
  border-radius: 6px;
  background: #3b82f6;
  margin-top: 8px;
}

.preview-label {
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  text-align: center;
  
  .preview-hint {
    font-size: 13px;
    color: #9ca3af;
  }
}

// Dark mode
@media (prefers-color-scheme: dark) {
  .theme-selector__preview {
    background: #1f2937;
  }
  
  .theme-option {
    background: #1f2937;
    border-color: #374151;
    
    &:hover {
      border-color: #4b5563;
      background: #111827;
    }
    
    &--active {
      background: #1e3a5f;
    }
    
    &__icon {
      background: #374151;
      color: #9ca3af;
    }
    
    &--active &__icon {
      background: #1e40af;
      color: #60a5fa;
    }
    
    &__label {
      color: #f9fafb;
    }
    
    &__description {
      color: #9ca3af;
    }
  }
  
  .preview-label {
    color: #9ca3af;
  }
}
</style>
