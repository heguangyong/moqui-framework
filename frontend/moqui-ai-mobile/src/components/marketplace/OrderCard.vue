<template>
  <q-card
    class="order-card"
    :class="{ 'order-card--highlighted': isUrgent }"
  >
    <div class="card-content">
      <!-- 顶部：订单号、运费、状态 -->
      <div class="card-header">
        <div class="order-info">
          <q-icon name="local_shipping" size="24px" class="truck-icon" />
          <div class="order-meta">
            <div class="order-id">{{ order.listingId }}</div>
            <div class="order-fare">运费 - ¥{{ formatPrice(order.freight) }}</div>
          </div>
        </div>
        <div class="status-badge">
          {{ order.countdown ? '抢单中' : 'Tracking' }}
        </div>
      </div>

      <!-- 路线信息 -->
      <div class="route-section">
        <div class="route-point">{{ getShortLocation(order.originPort) }}</div>
        <div class="route-distance">
          <div class="distance-badge">{{ order.distance }}km</div>
        </div>
        <div class="route-point">{{ getShortLocation(order.destinationPort) }}</div>
      </div>

      <!-- 标签行 -->
      <div class="tags-row" v-if="order.requiresShPlate || order.containerType">
        <span v-if="order.requiresShPlate" class="tag tag-sh">沪牌</span>
        <span class="tag tag-container">{{ order.containerType }}</span>
        <span v-if="order.countdown" class="tag tag-time">
          ⏱ {{ formatCountdown(order.countdown) }}
        </span>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <q-btn
          unelevated
          no-caps
          class="reject-btn"
          @click.stop="handleReject"
        >
          拒绝
        </q-btn>
        <q-btn
          unelevated
          no-caps
          class="accept-btn"
          @click.stop="handleAccept"
        >
          接受订单
        </q-btn>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Order } from '@/services/api/marketplace'

// Props
interface Props {
  order: Order
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  accept: [order: Order]
  reject: [order: Order]
}>()

// Computed
const isUrgent = computed(() => {
  return props.order.countdown !== undefined && props.order.countdown <= 30
})

// Methods
const formatCountdown = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatPrice = (price: number): string => {
  return price.toFixed(0)
}

const getShortLocation = (location: string): string => {
  // 简化地点名称，如 "洋山港四期码头" -> "洋山港"
  return location.replace(/码头|港区|保税区|开发区/g, '').trim()
}

const handleAccept = () => {
  emit('accept', props.order)
}

const handleReject = () => {
  emit('reject', props.order)
}
</script>

<style scoped lang="scss">
.order-card {
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border: none;
  background: #3A3A3C;
  overflow: hidden;
  transition: all 0.3s ease;
  margin-bottom: 0;

  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
    transform: translateY(-2px);
  }

  &--highlighted {
    background: linear-gradient(135deg, #F5A623 0%, #F7B955 100%);
    
    .card-header {
      .order-info {
        .truck-icon {
          color: #1C1C1E;
        }
        
        .order-meta {
          .order-id,
          .order-fare {
            color: #1C1C1E;
          }
        }
      }
      
      .status-badge {
        background: rgba(0, 0, 0, 0.2);
        color: #1C1C1E;
      }
    }
    
    .route-section {
      .route-point {
        color: #1C1C1E;
      }
      
      .distance-badge {
        background: rgba(0, 0, 0, 0.2);
        color: #1C1C1E;
      }
    }
    
    .tags-row {
      .tag {
        background: rgba(0, 0, 0, 0.15);
        color: #1C1C1E;
      }
    }
    
    .action-buttons {
      .reject-btn {
        background: rgba(0, 0, 0, 0.15);
        color: #1C1C1E;
      }
      
      .accept-btn {
        background: #1C1C1E;
        color: #F5A623;
      }
    }
  }
}

.card-content {
  padding: 20px;
}

// 卡片头部
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
  
  .order-info {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .truck-icon {
      color: rgba(255, 255, 255, 0.8);
      background: rgba(255, 255, 255, 0.1);
      padding: 8px;
      border-radius: 12px;
    }
    
    .order-meta {
      display: flex;
      flex-direction: column;
      gap: 4px;
      
      .order-id {
        font-size: 16px;
        font-weight: 700;
        color: white;
        letter-spacing: 0.5px;
      }
      
      .order-fare {
        font-size: 13px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.7);
      }
    }
  }
  
  .status-badge {
    padding: 6px 14px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    color: white;
  }
}

// 路线区域
.route-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 14px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 14px;
  
  .route-point {
    flex: 1;
    font-size: 14px;
    font-weight: 600;
    color: white;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .route-distance {
    flex-shrink: 0;
    padding: 0 16px;
    
    .distance-badge {
      padding: 6px 16px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      font-size: 13px;
      font-weight: 700;
      color: white;
      white-space: nowrap;
    }
  }
}

// 标签行
.tags-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  
  .tag {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    font-size: 11px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1;
    
    &-sh {
      background: rgba(250, 140, 22, 0.2);
      color: #FA8C16;
    }
    
    &-container {
      background: rgba(24, 144, 255, 0.2);
      color: #1890FF;
    }
    
    &-time {
      background: rgba(255, 79, 30, 0.2);
      color: #FF4F1E;
    }
  }
}

// 操作按钮
.action-buttons {
  display: flex;
  gap: 12px;
  
  .reject-btn,
  .accept-btn {
    flex: 1;
    height: 48px;
    border-radius: 24px;
    font-size: 15px;
    font-weight: 700;
    transition: all 0.3s ease;
  }
  
  .reject-btn {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    
    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
    
    &:active {
      background: rgba(255, 255, 255, 0.08);
    }
  }
  
  .accept-btn {
    background: linear-gradient(135deg, #F5A623 0%, #F7B955 100%);
    color: #1C1C1E;
    box-shadow: 0 4px 12px rgba(245, 166, 35, 0.3);
    
    &:hover {
      box-shadow: 0 6px 16px rgba(245, 166, 35, 0.4);
      transform: translateY(-1px);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
}

// 移动端优化
@media (max-width: 768px) {
  .card-content {
    padding: 18px;
  }
  
  .card-header {
    margin-bottom: 16px;
    
    .order-info {
      gap: 10px;
      
      .truck-icon {
        font-size: 20px;
        padding: 6px;
      }
      
      .order-meta {
        .order-id {
          font-size: 15px;
        }
        
        .order-fare {
          font-size: 12px;
        }
      }
    }
    
    .status-badge {
      padding: 5px 12px;
      font-size: 11px;
    }
  }
  
  .route-section {
    padding: 12px 14px;
    margin-bottom: 14px;
    
    .route-point {
      font-size: 13px;
    }
    
    .route-distance {
      padding: 0 12px;
      
      .distance-badge {
        padding: 5px 14px;
        font-size: 12px;
      }
    }
  }
  
  .tags-row {
    margin-bottom: 14px;
    
    .tag {
      padding: 5px 10px;
      font-size: 10px;
    }
  }
  
  .action-buttons {
    gap: 10px;
    
    .reject-btn,
    .accept-btn {
      height: 44px;
      font-size: 14px;
    }
  }
}
</style>
