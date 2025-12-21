<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="modelValue" class="dialog-overlay" @click.self="close">
        <div class="credits-history-dialog">
          <!-- Header -->
          <div class="dialog-header">
            <h2 class="dialog-title">积分记录</h2>
            <button class="close-btn" @click="close">✕</button>
          </div>

          <!-- Filter Tabs -->
          <div class="filter-tabs">
            <button 
              v-for="tab in filterTabs" 
              :key="tab.value"
              :class="['filter-tab', { active: currentFilter === tab.value }]"
              @click="setFilter(tab.value)"
            >
              {{ tab.label }}
            </button>
          </div>

          <!-- Content -->
          <div class="dialog-content" ref="contentRef" @scroll="handleScroll">
            <!-- Loading State -->
            <div v-if="creditsStore.isLoading && creditsStore.history.length === 0" class="loading-state">
              <div class="spinner"></div>
              <p>加载中...</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="creditsStore.history.length === 0" class="empty-state">
              <span class="empty-icon">📋</span>
              <p>暂无积分记录</p>
            </div>

            <!-- Transaction List -->
            <div v-else class="transaction-list">
              <div 
                v-for="transaction in creditsStore.history" 
                :key="transaction.transactionId"
                class="transaction-item"
              >
                <div class="transaction-icon" :class="getTransactionClass(transaction.type)">
                  {{ getTransactionIcon(transaction.type) }}
                </div>
                <div class="transaction-info">
                  <div class="transaction-desc">{{ transaction.description }}</div>
                  <div class="transaction-meta">
                    <span class="transaction-type">{{ getTransactionLabel(transaction.type) }}</span>
                    <span class="transaction-time">{{ formatTime(transaction.timestamp) }}</span>
                  </div>
                </div>
                <div class="transaction-amount" :class="getAmountClass(transaction.amount)">
                  {{ formatAmount(transaction.amount) }}
                </div>
              </div>

              <!-- Load More -->
              <div v-if="creditsStore.hasMoreHistory" class="load-more">
                <button 
                  class="load-more-btn" 
                  @click="loadMore"
                  :disabled="creditsStore.isLoading"
                >
                  {{ creditsStore.isLoading ? '加载中...' : '加载更多' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="dialog-footer">
            <div class="balance-summary">
              <span class="balance-label">当前余额</span>
              <span class="balance-value">💎 {{ creditsStore.formattedBalance }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useCreditsStore } from '../../stores/credits'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const creditsStore = useCreditsStore()
const contentRef = ref<HTMLElement | null>(null)
const currentFilter = ref<string | undefined>(undefined)

const filterTabs = [
  { label: '全部', value: undefined },
  { label: '消费', value: 'consume' },
  { label: '充值', value: 'add' },
  { label: '初始', value: 'initial' },
  { label: '退款', value: 'refund' }
]

// Watch for dialog open
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    await creditsStore.refreshHistory(currentFilter.value as any)
  }
})

// Methods
function close() {
  emit('update:modelValue', false)
  emit('close')
}

async function setFilter(filter: string | undefined) {
  currentFilter.value = filter
  await creditsStore.refreshHistory(filter as any)
}

async function loadMore() {
  await creditsStore.loadMoreHistory(currentFilter.value as any)
}

function handleScroll(event: Event) {
  const target = event.target as HTMLElement
  const { scrollTop, scrollHeight, clientHeight } = target
  
  // Auto load more when near bottom
  if (scrollHeight - scrollTop - clientHeight < 100 && creditsStore.hasMoreHistory && !creditsStore.isLoading) {
    loadMore()
  }
}

function getTransactionIcon(type: string): string {
  switch (type) {
    case 'consume': return '📤'
    case 'add': return '📥'
    case 'initial': return '🎁'
    case 'refund': return '↩️'
    default: return '💎'
  }
}

function getTransactionLabel(type: string): string {
  switch (type) {
    case 'consume': return '消费'
    case 'add': return '充值'
    case 'initial': return '初始'
    case 'refund': return '退款'
    default: return type
  }
}

function getTransactionClass(type: string): string {
  switch (type) {
    case 'consume': return 'type-consume'
    case 'add': return 'type-add'
    case 'initial': return 'type-initial'
    case 'refund': return 'type-refund'
    default: return ''
  }
}

function getAmountClass(amount: number): string {
  return amount >= 0 ? 'amount-positive' : 'amount-negative'
}

function formatAmount(amount: number): string {
  const prefix = amount >= 0 ? '+' : ''
  return `${prefix}${amount}`
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // Less than 1 minute
  if (diff < 60000) return '刚刚'
  // Less than 1 hour
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  // Less than 1 day
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  // Less than 7 days
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  // Format as date
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped lang="scss">
/* 积分历史对话框 - 灰色调风格 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.credits-history-dialog {
  width: 480px;
  max-height: 80vh;
  background: linear-gradient(145deg, #b8b8b8, #a8a8a8);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);

  .dialog-title {
    margin: 0;
    font-size: 17px;
    font-weight: 600;
    color: #2c2c2e;
  }

  .close-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.06);
    border: none;
    border-radius: 6px;
    font-size: 16px;
    color: #5a5a5c;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba(0, 0, 0, 0.1);
      color: #2c2c2e;
    }
  }
}

.filter-tabs {
  display: flex;
  gap: 6px;
  padding: 12px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  overflow-x: auto;

  .filter-tab {
    padding: 6px 14px;
    background: rgba(0, 0, 0, 0.06);
    border: none;
    border-radius: 14px;
    font-size: 12px;
    font-weight: 500;
    color: #5a5a5c;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;

    &:hover {
      background: rgba(0, 0, 0, 0.1);
    }

    &.active {
      background: linear-gradient(180deg, #4a4a4a, #3a3a3a);
      color: #e8e8e8;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
  }
}

.dialog-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  min-height: 280px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  color: #6a6a6c;

  .spinner {
    width: 28px;
    height: 28px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-top-color: #4a4a4a;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .empty-icon {
    font-size: 42px;
    margin-bottom: 12px;
    filter: grayscale(30%);
  }

  p {
    margin: 12px 0 0;
    font-size: 13px;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.transaction-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 10px;
  transition: all 0.2s;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);

  &:hover {
    background: rgba(255, 255, 255, 0.5);
  }
}

.transaction-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 16px;
  background: rgba(0, 0, 0, 0.06);

  &.type-consume { background: rgba(192, 57, 43, 0.15); }
  &.type-add { background: rgba(39, 174, 96, 0.15); }
  &.type-initial { background: rgba(214, 137, 16, 0.15); }
  &.type-refund { background: rgba(52, 152, 219, 0.15); }
}

.transaction-info {
  flex: 1;
  min-width: 0;

  .transaction-desc {
    font-size: 13px;
    font-weight: 500;
    color: #2c2c2e;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .transaction-meta {
    display: flex;
    gap: 8px;
    margin-top: 3px;
    font-size: 11px;
    color: #6a6a6c;
  }
}

.transaction-amount {
  font-size: 15px;
  font-weight: 600;

  &.amount-positive { color: #27ae60; }
  &.amount-negative { color: #c0392b; }
}

.load-more {
  padding: 14px 0;
  text-align: center;

  .load-more-btn {
    padding: 8px 20px;
    background: rgba(0, 0, 0, 0.08);
    border: none;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    color: #5a5a5c;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      background: rgba(0, 0, 0, 0.12);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.dialog-footer {
  padding: 14px 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(0, 0, 0, 0.03);

  .balance-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .balance-label {
    font-size: 13px;
    color: #5a5a5c;
  }

  .balance-value {
    font-size: 17px;
    font-weight: 700;
    color: #2c2c2e;
  }
}

/* Dialog animation */
.dialog-enter-active,
.dialog-leave-active {
  transition: all 0.25s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;

  .credits-history-dialog {
    transform: scale(0.95) translateY(16px);
  }
}
</style>
