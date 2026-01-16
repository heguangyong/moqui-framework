<template>
  <div class="tutorial-menu">
    <div class="tutorial-menu__header">
      <h3 class="tutorial-menu__title">教程中心</h3>
      <p class="tutorial-menu__subtitle">学习如何使用小说动漫生成器的各项功能</p>
    </div>
    
    <div class="tutorial-menu__settings">
      <label class="tutorial-menu__toggle">
        <input
          type="checkbox"
          :checked="showTutorials"
          @change="handleToggleTutorials"
        />
        <span class="tutorial-menu__toggle-label">启用新手引导</span>
      </label>
      
      <button
        class="tutorial-menu__reset"
        @click="handleResetAll"
        title="重置所有教程进度"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
          <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
        </svg>
        重置所有教程
      </button>
    </div>
    
    <div class="tutorial-menu__list">
      <div
        v-for="tutorial in tutorials"
        :key="tutorial.id"
        class="tutorial-item"
        :class="{
          'tutorial-item--completed': isTutorialCompleted(tutorial.id),
          'tutorial-item--skipped': isTutorialSkipped(tutorial.id)
        }"
      >
        <div class="tutorial-item__icon">
          <svg
            v-if="isTutorialCompleted(tutorial.id)"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <svg
            v-else
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4"/>
            <path d="M12 8h.01"/>
          </svg>
        </div>
        
        <div class="tutorial-item__content">
          <h4 class="tutorial-item__name">{{ tutorial.name }}</h4>
          <p class="tutorial-item__description">{{ tutorial.description }}</p>
          <div class="tutorial-item__meta">
            <span class="tutorial-item__steps">
              {{ tutorial.steps.length }} 个步骤
            </span>
            <span
              v-if="isTutorialCompleted(tutorial.id)"
              class="tutorial-item__badge tutorial-item__badge--completed"
            >
              已完成
            </span>
            <span
              v-else-if="isTutorialSkipped(tutorial.id)"
              class="tutorial-item__badge tutorial-item__badge--skipped"
            >
              已跳过
            </span>
          </div>
        </div>
        
        <div class="tutorial-item__actions">
          <button
            class="tutorial-item__btn tutorial-item__btn--primary"
            @click="handleStartTutorial(tutorial.id)"
          >
            {{ isTutorialCompleted(tutorial.id) ? '重新学习' : '开始' }}
          </button>
          <button
            v-if="isTutorialCompleted(tutorial.id) || isTutorialSkipped(tutorial.id)"
            class="tutorial-item__btn tutorial-item__btn--secondary"
            @click="handleResetTutorial(tutorial.id)"
            title="重置此教程"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
              <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTutorial } from '@/composables/useTutorial'

const {
  getAllTutorials,
  isTutorialCompleted,
  isTutorialSkipped,
  shouldShowTutorials,
  setShowTutorials,
  startTutorial,
  resetTutorial,
  resetAllTutorials
} = useTutorial()

const tutorials = computed(() => getAllTutorials())
const showTutorials = computed(() => shouldShowTutorials())

function handleStartTutorial(tutorialId: string) {
  startTutorial(tutorialId)
}

function handleResetTutorial(tutorialId: string) {
  if (confirm('确定要重置此教程的进度吗？')) {
    resetTutorial(tutorialId)
  }
}

function handleResetAll() {
  if (confirm('确定要重置所有教程的进度吗？这将清除所有已完成和已跳过的记录。')) {
    resetAllTutorials()
  }
}

function handleToggleTutorials(event: Event) {
  const target = event.target as HTMLInputElement
  setShowTutorials(target.checked)
}
</script>

<style scoped lang="scss">
.tutorial-menu {
  max-width: 800px;
  margin: 0 auto;
  
  &__header {
    margin-bottom: 24px;
  }
  
  &__title {
    margin: 0 0 8px;
    font-size: 24px;
    font-weight: 600;
    color: #111827;
  }
  
  &__subtitle {
    margin: 0;
    font-size: 14px;
    color: #6b7280;
  }
  
  &__settings {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background: #f9fafb;
    border-radius: 8px;
    margin-bottom: 24px;
  }
  
  &__toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    
    input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }
  }
  
  &__toggle-label {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
  }
  
  &__reset {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 500;
    color: #6b7280;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      color: #374151;
      border-color: #9ca3af;
      background: #f9fafb;
    }
  }
  
  &__list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

.tutorial-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.2s;
  
  &:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
  
  &--completed {
    background: #e8f9ed;
    border-color: #86efac;
  }
  
  &--skipped {
    opacity: 0.7;
  }
  
  &__icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
    border-radius: 8px;
    color: #6b7280;
    
    .tutorial-item--completed & {
      background: #22c55e;
      color: white;
    }
  }
  
  &__content {
    flex: 1;
    min-width: 0;
  }
  
  &__name {
    margin: 0 0 4px;
    font-size: 16px;
    font-weight: 600;
    color: #111827;
  }
  
  &__description {
    margin: 0 0 8px;
    font-size: 14px;
    line-height: 1.5;
    color: #6b7280;
  }
  
  &__meta {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  
  &__steps {
    font-size: 13px;
    color: #9ca3af;
  }
  
  &__badge {
    padding: 2px 8px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 4px;
    
    &--completed {
      background: #22c55e;
      color: white;
    }
    
    &--skipped {
      background: #f3f4f6;
      color: #6b7280;
    }
  }
  
  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  
  &__btn {
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
    }
    
    &--secondary {
      padding: 8px;
      background: #f3f4f6;
      color: #6b7280;
      
      &:hover {
        background: #e5e7eb;
        color: #374151;
      }
    }
  }
}

// Dark mode
@media (prefers-color-scheme: dark) {
  .tutorial-menu {
    &__title {
      color: #f9fafb;
    }
    
    &__subtitle {
      color: #9ca3af;
    }
    
    &__settings {
      background: #1f2937;
    }
    
    &__toggle-label {
      color: #d1d5db;
    }
    
    &__reset {
      color: #9ca3af;
      background: #374151;
      border-color: #4b5563;
      
      &:hover {
        color: #d1d5db;
        border-color: #6b7280;
        background: #4b5563;
      }
    }
  }
  
  .tutorial-item {
    background: #1f2937;
    border-color: #374151;
    
    &:hover {
      border-color: #4b5563;
    }
    
    &--completed {
      background: #065a4a;
      border-color: #10b981;
    }
    
    &__icon {
      background: #374151;
      color: #9ca3af;
    }
    
    &__name {
      color: #f9fafb;
    }
    
    &__description {
      color: #9ca3af;
    }
    
    &__steps {
      color: #6b7280;
    }
    
    &__badge {
      &--skipped {
        background: #374151;
        color: #9ca3af;
      }
    }
    
    &__btn {
      &--secondary {
        background: #374151;
        color: #9ca3af;
        
        &:hover {
          background: #4b5563;
          color: #d1d5db;
        }
      }
    }
  }
}
</style>
