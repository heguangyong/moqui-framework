<template>
  <Teleport to="body">
    <Transition name="tutorial-fade">
      <div v-if="isActive" class="tutorial-overlay">
        <!-- Backdrop -->
        <div class="tutorial-backdrop" @click="handleBackdropClick"></div>
        
        <!-- Highlight spotlight -->
        <div
          v-if="currentStep?.target"
          class="tutorial-spotlight"
          :style="spotlightStyle"
        ></div>
        
        <!-- Tutorial card -->
        <div
          class="tutorial-card"
          :class="`tutorial-card--${currentStep?.position || 'center'}`"
          :style="cardStyle"
        >
          <!-- Header -->
          <div class="tutorial-card__header">
            <h3 class="tutorial-card__title">{{ currentStep?.title }}</h3>
            <button
              v-if="currentStep?.canSkip !== false"
              class="tutorial-card__close"
              @click="handleSkip"
              title="跳过教程"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 8.586L2.929 1.515 1.515 2.929 8.586 10l-7.071 7.071 1.414 1.414L10 11.414l7.071 7.071 1.414-1.414L11.414 10l7.071-7.071-1.414-1.414L10 8.586z"/>
              </svg>
            </button>
          </div>
          
          <!-- Content -->
          <div class="tutorial-card__content">
            <p class="tutorial-card__description">{{ currentStep?.description }}</p>
          </div>
          
          <!-- Progress -->
          <div class="tutorial-card__progress">
            <div class="tutorial-card__progress-bar">
              <div
                class="tutorial-card__progress-fill"
                :style="{ width: `${progress}%` }"
              ></div>
            </div>
            <span class="tutorial-card__progress-text">
              {{ currentStepIndex + 1 }} / {{ activeTutorial?.steps.length }}
            </span>
          </div>
          
          <!-- Actions -->
          <div class="tutorial-card__actions">
            <button
              v-if="canGoPrev"
              class="tutorial-btn tutorial-btn--secondary"
              @click="handlePrev"
            >
              {{ currentStep?.prevLabel || '上一步' }}
            </button>
            
            <div class="tutorial-card__spacer"></div>
            
            <button
              v-if="currentStep?.canSkip !== false && !isLastStep"
              class="tutorial-btn tutorial-btn--text"
              @click="handleSkip"
            >
              跳过教程
            </button>
            
            <button
              v-if="canGoNext"
              class="tutorial-btn tutorial-btn--primary"
              @click="handleNext"
            >
              {{ currentStep?.nextLabel || '下一步' }}
            </button>
            
            <button
              v-else
              class="tutorial-btn tutorial-btn--primary"
              @click="handleComplete"
            >
              {{ currentStep?.nextLabel || '完成' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useTutorial } from '@/composables/useTutorial'

const {
  isActive,
  activeTutorial,
  currentStep,
  currentStepIndex,
  progress,
  canGoNext,
  canGoPrev,
  isLastStep,
  nextStep,
  prevStep,
  skipTutorial,
  completeTutorial
} = useTutorial()

// Spotlight and card positioning
const spotlightStyle = ref({})
const cardStyle = ref({})

/**
 * Calculate spotlight position based on target element
 */
function updateSpotlight() {
  if (!currentStep.value?.target) {
    spotlightStyle.value = {}
    cardStyle.value = {}
    return
  }
  
  const targetElement = document.querySelector(currentStep.value.target)
  if (!targetElement) {
    console.warn(`Tutorial target not found: ${currentStep.value.target}`)
    spotlightStyle.value = {}
    cardStyle.value = {}
    return
  }
  
  const rect = targetElement.getBoundingClientRect()
  const padding = 8
  
  // Spotlight style
  spotlightStyle.value = {
    top: `${rect.top - padding}px`,
    left: `${rect.left - padding}px`,
    width: `${rect.width + padding * 2}px`,
    height: `${rect.height + padding * 2}px`
  }
  
  // Card position based on step position
  const position = currentStep.value.position || 'center'
  const cardWidth = 400
  const cardHeight = 300
  const gap = 20
  
  let cardTop = 0
  let cardLeft = 0
  
  switch (position) {
    case 'top':
      cardTop = rect.top - cardHeight - gap
      cardLeft = rect.left + rect.width / 2 - cardWidth / 2
      break
    case 'bottom':
      cardTop = rect.bottom + gap
      cardLeft = rect.left + rect.width / 2 - cardWidth / 2
      break
    case 'left':
      cardTop = rect.top + rect.height / 2 - cardHeight / 2
      cardLeft = rect.left - cardWidth - gap
      break
    case 'right':
      cardTop = rect.top + rect.height / 2 - cardHeight / 2
      cardLeft = rect.right + gap
      break
    case 'center':
    default:
      cardTop = window.innerHeight / 2 - cardHeight / 2
      cardLeft = window.innerWidth / 2 - cardWidth / 2
      break
  }
  
  // Ensure card stays within viewport
  cardTop = Math.max(20, Math.min(cardTop, window.innerHeight - cardHeight - 20))
  cardLeft = Math.max(20, Math.min(cardLeft, window.innerWidth - cardWidth - 20))
  
  cardStyle.value = {
    top: `${cardTop}px`,
    left: `${cardLeft}px`
  }
}

// Watch for step changes
watch([currentStep, isActive], () => {
  if (isActive.value) {
    // Delay to ensure DOM is updated
    setTimeout(updateSpotlight, 100)
  }
}, { immediate: true })

// Handle window resize
let resizeTimeout: number | null = null
function handleResize() {
  if (resizeTimeout) clearTimeout(resizeTimeout)
  resizeTimeout = window.setTimeout(updateSpotlight, 100)
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (resizeTimeout) clearTimeout(resizeTimeout)
})

// Event handlers
function handleNext() {
  nextStep()
}

function handlePrev() {
  prevStep()
}

function handleSkip() {
  skipTutorial()
}

function handleComplete() {
  completeTutorial()
}

function handleBackdropClick() {
  // Only allow closing if step can be skipped
  if (currentStep.value?.canSkip !== false) {
    handleSkip()
  }
}
</script>

<style scoped lang="scss">
.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
  pointer-events: none;
}

.tutorial-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  pointer-events: all;
}

.tutorial-spotlight {
  position: absolute;
  border-radius: 8px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
  pointer-events: none;
  transition: all 0.3s ease;
  z-index: 1;
}

.tutorial-card {
  position: absolute;
  width: 400px;
  max-width: calc(100vw - 40px);
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  pointer-events: all;
  z-index: 2;
  transition: all 0.3s ease;
  
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 20px 16px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #111827;
  }
  
  &__close {
    padding: 4px;
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
    
    &:hover {
      background: #f3f4f6;
      color: #111827;
    }
  }
  
  &__content {
    padding: 20px;
  }
  
  &__description {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    color: #4b5563;
  }
  
  &__progress {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 20px 16px;
  }
  
  &__progress-bar {
    flex: 1;
    height: 4px;
    background: #e5e7eb;
    border-radius: 2px;
    overflow: hidden;
  }
  
  &__progress-fill {
    height: 100%;
    background: #2f72f0;
    transition: width 0.3s ease;
  }
  
  &__progress-text {
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
    white-space: nowrap;
  }
  
  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px 20px 20px;
    border-top: 1px solid #e5e7eb;
  }
  
  &__spacer {
    flex: 1;
  }
}

.tutorial-btn {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  
  &--primary {
    background: #2f72f0;
    color: white;
    
    &:hover {
      background: #2159d2;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
  
  &--secondary {
    background: #f3f4f6;
    color: #374151;
    
    &:hover {
      background: #e5e7eb;
    }
  }
  
  &--text {
    background: none;
    color: #6b7280;
    
    &:hover {
      color: #374151;
      background: #f3f4f6;
    }
  }
}

// Transitions
.tutorial-fade-enter-active,
.tutorial-fade-leave-active {
  transition: opacity 0.3s ease;
}

.tutorial-fade-enter-from,
.tutorial-fade-leave-to {
  opacity: 0;
}

// Dark mode support
@media (prefers-color-scheme: dark) {
  .tutorial-card {
    background: #1f2937;
    
    &__header {
      border-bottom-color: #374151;
    }
    
    &__title {
      color: #f9fafb;
    }
    
    &__close {
      color: #9ca3af;
      
      &:hover {
        background: #374151;
        color: #f9fafb;
      }
    }
    
    &__description {
      color: #d1d5db;
    }
    
    &__progress-bar {
      background: #374151;
    }
    
    &__progress-text {
      color: #9ca3af;
    }
    
    &__actions {
      border-top-color: #374151;
    }
  }
  
  .tutorial-btn {
    &--secondary {
      background: #374151;
      color: #d1d5db;
      
      &:hover {
        background: #4b5563;
      }
    }
    
    &--text {
      color: #9ca3af;
      
      &:hover {
        color: #d1d5db;
        background: #374151;
      }
    }
  }
}
</style>
