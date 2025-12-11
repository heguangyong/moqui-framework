<template>
  <div class="order-progress">
    <div class="order-progress__track">
      <div
        v-for="(step, index) in steps"
        :key="step.id"
        class="progress-step"
        :class="{
          'progress-step--completed': isStepCompleted(step.id),
          'progress-step--active': step.id === currentStep,
          'progress-step--pending': step.id > currentStep
        }"
        @click="$emit('step-click', step.id)"
      >
        <!-- 节点 -->
        <div class="progress-step__node">
          <q-icon
            v-if="isStepCompleted(step.id)"
            name="check"
            size="20px"
            color="white"
          />
          <span v-else class="node-number">{{ step.id }}</span>
        </div>

        <!-- 连接线 -->
        <div
          v-if="index < steps.length - 1"
          class="progress-step__line"
          :class="{
            'progress-step__line--completed': isStepCompleted(step.id)
          }"
        />

        <!-- 标签 -->
        <div class="progress-step__label">
          {{ step.label }}
        </div>

        <!-- 时间戳 -->
        <div v-if="step.timestamp" class="progress-step__timestamp">
          {{ formatTimestamp(step.timestamp) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Props
interface ProgressStep {
  id: number
  label: string
  status?: string
  timestamp?: string
}

interface Props {
  steps: ProgressStep[]
  currentStep: number
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'step-click': [stepId: number]
}>()

// Methods
const isStepCompleted = (stepId: number): boolean => {
  return stepId < props.currentStep
}

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}
</script>

<style scoped lang="scss">
@import '@/styles/shanghai-port-theme.scss';

.order-progress {
  padding: $spacing-lg 0;
  background-color: $card-bg;

  &__track {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    position: relative;
    padding: 0 $spacing-md;
  }
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;

  &__node {
    width: $progress-node-size;
    height: $progress-node-size;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: $progress-pending-color;
    border: $progress-line-width solid $progress-pending-color;
    z-index: 2;
    transition: $transition-base;

    .node-number {
      font-size: $font-size-small;
      font-weight: $font-weight-semibold;
      color: white;
    }
  }

  &__line {
    position: absolute;
    top: calc($progress-node-size / 2);
    left: calc(50% + $progress-node-size / 2);
    right: calc(-50% + $progress-node-size / 2);
    height: $progress-line-width;
    background-color: $progress-pending-color;
    z-index: 1;
    transition: $transition-base;

    &--completed {
      background-color: $progress-completed-color;
    }
  }

  &__label {
    margin-top: $spacing-sm;
    font-size: $font-size-small;
    color: $text-color;
    text-align: center;
    white-space: nowrap;
    transition: $transition-base;
  }

  &__timestamp {
    margin-top: 4px;
    font-size: $font-size-xsmall;
    color: $hint-color;
    text-align: center;
  }

  // 已完成状态
  &--completed {
    .progress-step__node {
      background-color: $progress-completed-color;
      border-color: $progress-completed-color;
    }

    .progress-step__label {
      color: $progress-completed-color;
      font-weight: $font-weight-medium;
    }
  }

  // 当前激活状态
  &--active {
    .progress-step__node {
      background-color: $progress-active-color;
      border-color: $progress-active-color;
      box-shadow: 0 0 0 4px rgba($progress-active-color, 0.2);
      animation: pulse 2s infinite;
    }

    .progress-step__label {
      color: $progress-active-color;
      font-weight: $font-weight-semibold;
    }
  }

  // 待处理状态
  &--pending {
    .progress-step__node {
      background-color: white;
      border-color: $progress-pending-color;

      .node-number {
        color: $progress-pending-color;
      }
    }
  }
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 4px rgba($progress-active-color, 0.2);
  }
  50% {
    box-shadow: 0 0 0 8px rgba($progress-active-color, 0.1);
  }
}

// 响应式调整
@media (max-width: $mobile-breakpoint) {
  .progress-step {
    &__label {
      font-size: $font-size-xsmall;
    }

    &__node {
      width: 28px;
      height: 28px;
    }
  }
}
</style>
