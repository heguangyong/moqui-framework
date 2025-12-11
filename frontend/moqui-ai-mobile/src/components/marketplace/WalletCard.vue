<template>
  <q-card class="wallet-card">
    <!-- 钱包头部 -->
    <q-card-section class="wallet-card__header">
      <div class="balance-label">可用余额 (元)</div>
      <div class="balance-amount">¥ {{ formatAmount(balance) }}</div>
      
      <div class="wallet-card__actions">
        <q-btn
          label="快速提现"
          color="secondary"
          unelevated
          no-caps
          class="action-btn"
          @click="handleWithdraw"
        />
        <q-btn
          label="充值"
          color="white"
          text-color="secondary"
          outline
          no-caps
          class="action-btn"
          @click="handleRecharge"
        />
      </div>
    </q-card-section>

    <q-separator />

    <!-- 折叠面板 -->
    <q-expansion-item
      v-model="expanded"
      icon="account_balance_wallet"
      label="收入详情"
      header-class="wallet-card__expansion-header"
    >
      <q-card-section class="wallet-card__details">
        <div class="detail-item" @click="handleInTransitClick">
          <div class="detail-label">
            在途运费
            <q-icon name="info" size="16px" color="grey-6" class="q-ml-xs" />
          </div>
          <div class="detail-value">
            ¥ {{ formatAmount(inTransit) }}
            <span class="detail-count">({{ inTransitCount }}笔)</span>
          </div>
        </div>

        <q-separator class="q-my-sm" />

        <div class="detail-item">
          <div class="detail-label">今日收入</div>
          <div class="detail-value detail-value--positive">
            ¥ {{ formatAmount(todayIncome) }}
          </div>
        </div>

        <q-separator class="q-my-sm" />

        <div class="detail-item">
          <div class="detail-label">本周收入</div>
          <div class="detail-value detail-value--positive">
            ¥ {{ formatAmount(weekIncome) }}
          </div>
        </div>
      </q-card-section>
    </q-expansion-item>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Props
interface Props {
  balance: number
  inTransit: number
  inTransitCount: number
  todayIncome: number
  weekIncome: number
}

defineProps<Props>()

// Emits
const emit = defineEmits<{
  withdraw: []
  recharge: []
  inTransitClick: []
}>()

// State
const expanded = ref(false)

// Methods
const formatAmount = (amount: number): string => {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const handleWithdraw = () => {
  emit('withdraw')
}

const handleRecharge = () => {
  emit('recharge')
}

const handleInTransitClick = () => {
  emit('inTransitClick')
}
</script>

<style scoped lang="scss">
@import '@/styles/shanghai-port-theme.scss';

.wallet-card {
  border-radius: $border-radius-large;
  box-shadow: $shadow-card;
  overflow: hidden;

  &__header {
    background: linear-gradient(135deg, $primary-color 0%, #0d2a8f 100%);
    color: white;
    padding: $spacing-lg $card-padding;
  }

  .balance-label {
    font-size: $font-size-small;
    opacity: 0.9;
    margin-bottom: $spacing-xs;
  }

  .balance-amount {
    font-size: 48px;
    font-weight: $font-weight-bold;
    line-height: 1.2;
    margin-bottom: $spacing-md;
    color: white;
  }

  &__actions {
    display: flex;
    gap: $spacing-sm;

    .action-btn {
      flex: 1;
      padding: $spacing-sm $spacing-md;
      font-size: $font-size-base;
      font-weight: $font-weight-medium;
    }
  }

  // 折叠面板深色样式
  :deep(.q-expansion-item) {
    background-color: #3A3A3C;
    
    .q-expansion-item__container {
      background-color: #3A3A3C;
    }
    
    .q-item {
      background-color: #3A3A3C;
      color: white;
      
      .q-item__label {
        color: white;
      }
      
      .q-item__section--avatar {
        color: rgba(255, 255, 255, 0.7);
      }
    }
    
    .q-expansion-item__content {
      background-color: #2C2C2E;
    }
  }

  &__details {
    padding: $spacing-md $card-padding;
    background-color: #2C2C2E;
  }

  .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: $transition-fast;

    &:active {
      opacity: 0.7;
    }
  }

  .detail-label {
    font-size: $font-size-base;
    color: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
  }

  .detail-value {
    font-size: $font-size-large;
    font-weight: $font-weight-semibold;
    color: white;

    &--positive {
      color: $success-color;
    }
  }

  .detail-count {
    font-size: $font-size-small;
    color: rgba(255, 255, 255, 0.5);
    font-weight: $font-weight-regular;
    margin-left: 4px;
  }
}
</style>
