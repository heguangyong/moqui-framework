<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div v-if="visible" class="error-dialog-overlay" @click="handleOverlayClick">
        <div class="error-dialog" :class="`error-dialog--${severity}`" @click.stop>
          <!-- Icon -->
          <div class="error-dialog__icon" :style="{ color: iconColor }">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle v-if="severity === 'info'" cx="12" cy="12" r="10"/>
              <path v-if="severity === 'info'" d="M12 16v-4"/>
              <path v-if="severity === 'info'" d="M12 8h.01"/>
              
              <path v-if="severity === 'warning'" d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line v-if="severity === 'warning'" x1="12" y1="9" x2="12" y2="13"/>
              <line v-if="severity === 'warning'" x1="12" y1="17" x2="12.01" y2="17"/>
              
              <circle v-if="severity === 'error' || severity === 'critical'" cx="12" cy="12" r="10"/>
              <line v-if="severity === 'error' || severity === 'critical'" x1="15" y1="9" x2="9" y2="15"/>
              <line v-if="severity === 'error' || severity === 'critical'" x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          
          <!-- Content -->
          <div class="error-dialog__content">
            <h3 class="error-dialog__title">{{ title }}</h3>
            <p class="error-dialog__message">{{ message }}</p>
            
            <!-- Solution -->
            <div v-if="solution" class="error-dialog__solution">
              <div class="solution-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span>解决方案</span>
              </div>
              <p class="solution-text">{{ solution }}</p>
            </div>
            
            <!-- Details (collapsible) -->
            <div v-if="details" class="error-dialog__details">
              <button 
                class="details-toggle"
                @click="showDetails = !showDetails"
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  stroke-width="2"
                  :class="{ 'rotated': showDetails }"
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
                <span>{{ showDetails ? '隐藏' : '查看' }}技术详情</span>
              </button>
              <Transition name="details-expand">
                <pre v-if="showDetails" class="details-content">{{ details }}</pre>
              </Transition>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="error-dialog__actions">
            <button
              v-for="(action, index) in actions"
              :key="index"
              class="error-dialog__btn"
              :class="{ 'error-dialog__btn--primary': action.primary }"
              @click="handleAction(action)"
            >
              {{ action.label }}
            </button>
            <button
              v-if="!actions || actions.length === 0"
              class="error-dialog__btn error-dialog__btn--primary"
              @click="handleClose"
            >
              确定
            </button>
          </div>
          
          <!-- Close button -->
          <button class="error-dialog__close" @click="handleClose" title="关闭">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ErrorInfo, ErrorAction } from '@/utils/errorMessages'
import { getSeverityColor } from '@/utils/errorMessages'

interface Props {
  visible: boolean
  title: string
  message: string
  solution?: string
  details?: string
  severity?: ErrorInfo['severity']
  actions?: ErrorAction[]
}

const props = withDefaults(defineProps<Props>(), {
  severity: 'error',
  actions: () => []
})

const emit = defineEmits<{
  close: []
  action: [action: ErrorAction]
}>()

const showDetails = ref(false)

const iconColor = computed(() => getSeverityColor(props.severity))

function handleClose() {
  emit('close')
}

function handleOverlayClick() {
  // Allow closing by clicking overlay for non-critical errors
  if (props.severity !== 'critical') {
    handleClose()
  }
}

function handleAction(action: ErrorAction) {
  emit('action', action)
  if (action.action) {
    action.action()
  }
  handleClose()
}
</script>

<style scoped lang="scss">
.error-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.error-dialog {
  position: relative;
  width: 100%;
  max-width: 500px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  
  &__icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: currentColor;
    opacity: 0.1;
    
    svg {
      position: absolute;
      opacity: 1;
    }
  }
  
  &__content {
    flex: 1;
    width: 100%;
    text-align: center;
  }
  
  &__title {
    margin: 0 0 12px;
    font-size: 24px;
    font-weight: 600;
    color: #111827;
  }
  
  &__message {
    margin: 0 0 16px;
    font-size: 15px;
    line-height: 1.6;
    color: #4b5563;
  }
  
  &__solution {
    margin-top: 20px;
    padding: 16px;
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 8px;
    text-align: left;
    
    .solution-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #0369a1;
      
      svg {
        flex-shrink: 0;
      }
    }
    
    .solution-text {
      margin: 0;
      font-size: 14px;
      line-height: 1.6;
      color: #075985;
      white-space: pre-line;
    }
  }
  
  &__details {
    margin-top: 16px;
    text-align: left;
    
    .details-toggle {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: #f3f4f6;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        background: #e5e7eb;
        color: #374151;
      }
      
      svg {
        transition: transform 0.2s;
        
        &.rotated {
          transform: rotate(180deg);
        }
      }
    }
    
    .details-content {
      margin: 12px 0 0;
      padding: 12px;
      background: #1f2937;
      border-radius: 6px;
      font-size: 12px;
      font-family: 'Monaco', 'Menlo', monospace;
      color: #e5e7eb;
      overflow-x: auto;
      max-height: 200px;
      overflow-y: auto;
    }
  }
  
  &__actions {
    display: flex;
    gap: 12px;
    width: 100%;
    justify-content: center;
  }
  
  &__btn {
    padding: 10px 24px;
    font-size: 14px;
    font-weight: 500;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: white;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      background: #f9fafb;
      border-color: #9ca3af;
    }
    
    &--primary {
      background: #2f72f0;
      border-color: transparent;
      color: white;
      
      &:hover {
        background: #2159d2;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
      }
    }
  }
  
  &__close {
    position: absolute;
    top: 16px;
    right: 16px;
    padding: 8px;
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s;
    
    &:hover {
      background: #f3f4f6;
      color: #374151;
    }
  }
}

// Severity variants
.error-dialog--info {
  .error-dialog__icon {
    color: #3b82f6;
  }
}

.error-dialog--warning {
  .error-dialog__icon {
    color: #f59e0b;
  }
}

.error-dialog--error {
  .error-dialog__icon {
    color: #ef4444;
  }
}

.error-dialog--critical {
  .error-dialog__icon {
    color: #dc2626;
  }
  
  .error-dialog__close {
    display: none; // Can't close critical errors easily
  }
}

// Transitions
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.3s ease;
  
  .error-dialog {
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
  
  .error-dialog {
    transform: scale(0.9);
    opacity: 0;
  }
}

.details-expand-enter-active,
.details-expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.details-expand-enter-from,
.details-expand-leave-to {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
}

// Dark mode
@media (prefers-color-scheme: dark) {
  .error-dialog {
    background: #1f2937;
    
    &__title {
      color: #f9fafb;
    }
    
    &__message {
      color: #d1d5db;
    }
    
    &__solution {
      background: #1e3a5f;
      border-color: #1e40af;
      
      .solution-header {
        color: #60a5fa;
      }
      
      .solution-text {
        color: #93c5fd;
      }
    }
    
    &__btn {
      background: #374151;
      border-color: #4b5563;
      color: #d1d5db;
      
      &:hover {
        background: #4b5563;
        border-color: #6b7280;
      }
    }
    
    &__close {
      color: #6b7280;
      
      &:hover {
        background: #374151;
        color: #d1d5db;
      }
    }
  }
}
</style>
