<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="modelValue" class="dialog-overlay" @click.self="close">
        <div class="insufficient-credits-dialog">
          <!-- Warning Icon -->
          <div class="warning-icon">⚠️</div>

          <!-- Title -->
          <h2 class="dialog-title">积分不足</h2>

          <!-- Message -->
          <p class="dialog-message">
            当前操作需要 <strong>{{ requiredCredits }}</strong> 积分，
            您的余额仅有 <strong>{{ currentBalance }}</strong> 积分。
          </p>

          <!-- Balance Display -->
          <div class="balance-display">
            <div class="balance-item">
              <span class="balance-label">需要</span>
              <span class="balance-value required">💎 {{ requiredCredits }}</span>
            </div>
            <div class="balance-divider">-</div>
            <div class="balance-item">
              <span class="balance-label">当前</span>
              <span class="balance-value current">💎 {{ currentBalance }}</span>
            </div>
            <div class="balance-divider">=</div>
            <div class="balance-item">
              <span class="balance-label">差额</span>
              <span class="balance-value shortage">💎 {{ shortage }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="dialog-actions">
            <button class="action-btn action-btn--secondary" @click="close">
              继续浏览
            </button>
            <button class="action-btn action-btn--primary" @click="handleRecharge">
              充值积分
            </button>
          </div>

          <!-- Hint -->
          <p class="dialog-hint">
            💡 提示：完成任务或邀请好友可获得免费积分
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCreditsStore } from '../../stores/credits'

const props = defineProps<{
  modelValue: boolean
  requiredCredits: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
  recharge: []
}>()

const creditsStore = useCreditsStore()

const currentBalance = computed(() => creditsStore.balance)
const shortage = computed(() => props.requiredCredits - currentBalance.value)

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function handleRecharge() {
  emit('recharge')
  close()
}
</script>

<style scoped lang="scss">
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.insufficient-credits-dialog {
  width: 400px;
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.warning-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.dialog-title {
  margin: 0 0 12px;
  font-size: 22px;
  font-weight: 600;
  color: #333;
}

.dialog-message {
  margin: 0 0 24px;
  font-size: 14px;
  color: #666;
  line-height: 1.6;

  strong {
    color: #333;
  }
}

.balance-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 12px;
  margin-bottom: 24px;
}

.balance-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.balance-label {
  font-size: 12px;
  color: #999;
}

.balance-value {
  font-size: 18px;
  font-weight: 600;

  &.required {
    color: #7a9188;
  }

  &.current {
    color: #e53e3e;
  }

  &.shortage {
    color: #d69e2e;
  }
}

.balance-divider {
  font-size: 18px;
  color: #ccc;
  font-weight: 300;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.action-btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &--secondary {
    background-color: #c8c8c8;
    color: #2c2c2e;

    &:hover {
      background-color: #d8d8d8;
    }
  }

  &--primary {
    background-color: #7a9188;
    color: #ffffff;

    &:hover {
      background-color: #6a8178;
    }
  }
}

.dialog-hint {
  margin: 0;
  font-size: 12px;
  color: #999;
}

// Dialog animation
.dialog-enter-active,
.dialog-leave-active {
  transition: all 0.3s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;

  .insufficient-credits-dialog {
    transform: scale(0.95) translateY(20px);
  }
}

// Dark mode
@media (prefers-color-scheme: dark) {
  .insufficient-credits-dialog {
    background: #1e1e2e;
  }

  .dialog-title {
    color: #fff;
  }

  .dialog-message {
    color: #aaa;

    strong {
      color: #fff;
    }
  }

  .balance-display {
    background: #2a2a3e;
  }

  .action-btn--secondary {
    background: #2a2a3e;
    color: #aaa;

    &:hover {
      background: #3a3a4e;
    }
  }
}
</style>
