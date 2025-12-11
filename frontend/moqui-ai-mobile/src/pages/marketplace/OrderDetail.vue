<template>
  <q-page class="order-detail-page">
    <!-- 顶部导航栏 -->
    <div class="header-bar">
      <q-btn
        flat
        dense
        round
        icon="arrow_back"
        color="white"
        @click="goBack"
      />
      <div class="header-title">订单详情</div>
      <q-btn
        flat
        dense
        round
        icon="more_vert"
        color="white"
      >
        <q-menu>
          <q-list dense style="min-width: 120px">
            <q-item clickable v-close-popup @click="handleShare">
              <q-item-section avatar>
                <q-icon name="share" />
              </q-item-section>
              <q-item-section>分享</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="handleReport">
              <q-item-section avatar>
                <q-icon name="flag" />
              </q-item-section>
              <q-item-section>举报</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </div>

    <!-- 倒计时横幅 -->
    <div v-if="order?.countdown && order.countdown > 0" class="countdown-banner">
      <q-icon name="schedule" size="20px" class="q-mr-sm" />
      <span>抢单倒计时</span>
      <span class="countdown-time">{{ formatCountdown(order.countdown) }}</span>
    </div>

    <!-- 内容区域 -->
    <div class="content-area">
      <!-- 路线信息卡片 -->
      <div class="route-card">
        <div class="route-header">
          <div class="route-tags">
            <span v-if="order?.requiresShPlate" class="tag tag-sh">沪牌通行</span>
            <span class="tag tag-port">{{ order?.originPort.split('码头')[0] }}</span>
          </div>
        </div>

        <div class="route-main">
          <div class="route-point">
            <div class="point-icon origin">
              <q-icon name="trip_origin" size="24px" />
            </div>
            <div class="point-info">
              <div class="point-label">起运地</div>
              <div class="point-name">{{ order?.originPort }}</div>
            </div>
          </div>

          <div class="route-line">
            <div class="line-dashed"></div>
            <div class="line-meta">
              <q-icon name="straighten" size="14px" />
              <span>{{ order?.distance }}km</span>
              <span class="separator">·</span>
              <q-icon name="schedule" size="14px" />
              <span>约{{ order?.duration }}</span>
            </div>
          </div>

          <div class="route-point">
            <div class="point-icon destination">
              <q-icon name="location_on" size="24px" />
            </div>
            <div class="point-info">
              <div class="point-label">目的地</div>
              <div class="point-name">{{ order?.destinationPort }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 订单信息卡片 -->
      <div class="info-card">
        <div class="card-title">订单信息</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">箱型</div>
            <div class="info-value">{{ order?.containerType }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">数量</div>
            <div class="info-value">{{ order?.quantity }}个</div>
          </div>
          <div class="info-item">
            <div class="info-label">最晚提箱</div>
            <div class="info-value highlight">{{ formatTime(order?.latestPickup) }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">运费</div>
            <div class="info-value price">¥{{ formatPrice(order?.freight) }}</div>
          </div>
        </div>

        <div v-if="order?.requiresShPlate || order?.requiresHydraulicTailgate || order?.requiresPortExperience" class="requirements">
          <div class="requirements-title">特殊要求</div>
          <div class="requirements-list">
            <div v-if="order?.requiresShPlate" class="requirement-item">
              <q-icon name="check_circle" color="positive" size="18px" />
              <span>需要沪牌车辆</span>
            </div>
            <div v-if="order?.requiresHydraulicTailgate" class="requirement-item">
              <q-icon name="check_circle" color="positive" size="18px" />
              <span>需要液压尾板</span>
            </div>
            <div v-if="order?.requiresPortExperience" class="requirement-item">
              <q-icon name="check_circle" color="positive" size="18px" />
              <span>熟悉港区优先</span>
            </div>
          </div>
        </div>

        <div class="guarantee-section">
          <q-icon name="verified_user" color="positive" size="20px" />
          <span>平台担保交易，运费安全有保障</span>
        </div>
      </div>

      <!-- 货主信息卡片 -->
      <div class="shipper-card">
        <div class="card-title">货主信息</div>
        <div class="shipper-profile">
          <q-avatar size="56px" color="primary" text-color="white">
            {{ order?.shipper.name.charAt(0) }}
          </q-avatar>
          <div class="shipper-info">
            <div class="shipper-name">{{ order?.shipper.name }}</div>
            <div class="shipper-rating">
              <span class="stars">{{ getStars(order?.shipper.rating || 0) }}</span>
              <span class="rating-num">{{ order?.shipper.rating.toFixed(1) }}</span>
            </div>
            <div class="shipper-stats">
              <span>已交易{{ order?.shipper.transactions }}次</span>
            </div>
          </div>
          <q-btn
            flat
            dense
            round
            icon="phone"
            color="primary"
            size="md"
            @click="handleCall"
          />
        </div>
      </div>

      <!-- 地图预览卡片 -->
      <div class="map-card">
        <div class="card-title">路线预览</div>
        <div class="map-placeholder">
          <q-icon name="map" size="48px" color="grey-5" />
          <div class="map-text">地图加载中...</div>
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="bottom-actions">
      <div class="price-info">
        <div class="price-label">运费</div>
        <div class="price-amount">¥{{ formatPrice(order?.freight) }}</div>
      </div>
      <q-btn
        unelevated
        no-caps
        class="grab-btn"
        :loading="grabbing"
        @click="handleGrabOrder"
      >
        <q-icon name="local_shipping" size="20px" class="q-mr-sm" />
        立即抢单
      </q-btn>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { marketplaceApi, type Order } from '@/services/api/marketplace'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()

// 状态
const order = ref<Order | null>(null)
const loading = ref(false)
const grabbing = ref(false)

// 生命周期
onMounted(() => {
  loadOrderDetail()
})

// 方法
const loadOrderDetail = async () => {
  loading.value = true
  try {
    const orderId = route.params.orderId as string
    // TODO: 调用实际API
    // const response = await marketplaceApi.getOrderDetail(orderId)
    
    // 模拟数据
    order.value = {
      listingId: orderId,
      listingType: 'SUPPLY',
      title: '洋山港四期提箱',
      description: '需要从洋山港四期提箱到苏州工业园区',
      originPort: '洋山港四期码头',
      destinationPort: '苏州工业园区综合保税区',
      distance: 12.5,
      duration: '3h',
      containerType: '40GP',
      quantity: 1,
      latestPickup: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      validFrom: new Date().toISOString(),
      validThru: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      freight: 1850,
      currencyUomId: 'CNY',
      requiresShPlate: true,
      requiresHydraulicTailgate: false,
      requiresPortExperience: true,
      shipper: {
        partyId: 'SHIPPER001',
        name: '上海xx国际物流',
        rating: 4.2,
        transactions: 8
      },
      status: 'ACTIVE',
      countdown: 120
    }
  } catch (error) {
    console.error('加载订单详情失败:', error)
    $q.notify({
      type: 'negative',
      message: '加载订单详情失败'
    })
  } finally {
    loading.value = false
  }
}

const handleGrabOrder = () => {
  $q.dialog({
    title: '确认抢单',
    message: `确定要抢这个订单吗？运费 ¥${formatPrice(order.value?.freight)}`,
    cancel: {
      label: '取消',
      flat: true,
      color: 'grey-7'
    },
    ok: {
      label: '确认抢单',
      unelevated: true,
      color: 'secondary'
    },
    persistent: true
  }).onOk(async () => {
    grabbing.value = true
    try {
      // TODO: 调用抢单API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      $q.notify({
        type: 'positive',
        message: '抢单成功！',
        position: 'center'
      })
      
      // 跳转到订单执行页
      router.push(`/marketplace/order/${order.value?.listingId}/execution`)
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: '抢单失败，请重试'
      })
    } finally {
      grabbing.value = false
    }
  })
}

const goBack = () => {
  router.back()
}

const handleCall = () => {
  $q.notify({
    type: 'info',
    message: '拨打电话功能开发中'
  })
}

const handleShare = () => {
  $q.notify({
    type: 'info',
    message: '分享功能开发中'
  })
}

const handleReport = () => {
  $q.notify({
    type: 'info',
    message: '举报功能开发中'
  })
}

const formatCountdown = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatTime = (timeStr?: string): string => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  
  return isToday ? `今日 ${hours}:${minutes}` : `${date.getMonth() + 1}-${date.getDate()} ${hours}:${minutes}`
}

const formatPrice = (price?: number): string => {
  if (!price) return '0.00'
  return price.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const getStars = (rating: number): string => {
  const fullStars = Math.floor(rating)
  const halfStar = rating % 1 >= 0.5 ? 1 : 0
  const emptyStars = 5 - fullStars - halfStar
  
  return '⭐'.repeat(fullStars) + (halfStar ? '☆' : '') + '☆'.repeat(emptyStars)
}
</script>

<style scoped lang="scss">
@import '@/styles/shanghai-port-theme.scss';

.order-detail-page {
  background: linear-gradient(180deg, #2C2C2E 0%, #1C1C1E 100%);
  min-height: 100vh;
  padding-bottom: 80px;
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  padding-top: calc(12px + env(safe-area-inset-top));
  background: transparent;
  
  .header-title {
    flex: 1;
    text-align: center;
    font-size: 17px;
    font-weight: 600;
    color: white;
  }
}

.countdown-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  background: $secondary-color;
  color: white;
  font-size: 14px;
  font-weight: 600;
  gap: 8px;
  
  .countdown-time {
    font-size: 18px;
    font-weight: 700;
    margin-left: 8px;
  }
}

.content-area {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.route-card,
.info-card,
.shipper-card,
.map-card {
  background: #2C2C2E;
  border-radius: 16px;
  padding: 20px;
  color: white;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin-bottom: 16px;
}

// 路线卡片
.route-card {
  .route-header {
    margin-bottom: 20px;
  }
  
  .route-tags {
    display: flex;
    gap: 8px;
  }
  
  .tag {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    
    &-sh {
      background: rgba(250, 140, 22, 0.15);
      color: #FA8C16;
    }
    
    &-port {
      background: rgba(24, 144, 255, 0.15);
      color: #1890FF;
    }
  }
  
  .route-main {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  
  .route-point {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    
    .point-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      
      &.origin {
        background: rgba(24, 144, 255, 0.15);
        color: #1890FF;
      }
      
      &.destination {
        background: rgba(255, 79, 30, 0.15);
        color: $secondary-color;
      }
    }
    
    .point-info {
      flex: 1;
      padding-top: 4px;
      
      .point-label {
        font-size: 12px;
        color: #999;
        margin-bottom: 4px;
      }
      
      .point-name {
        font-size: 15px;
        font-weight: 600;
        color: white;
        line-height: 1.4;
      }
    }
  }
  
  .route-line {
    display: flex;
    align-items: center;
    padding-left: 20px;
    margin: 8px 0;
    position: relative;
    
    .line-dashed {
      position: absolute;
      left: 19px;
      top: 0;
      bottom: 0;
      width: 2px;
      background-image: linear-gradient(to bottom, #666 50%, transparent 50%);
      background-size: 2px 8px;
    }
    
    .line-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      font-size: 12px;
      color: #999;
      margin-left: 32px;
      
      .q-icon {
        font-size: 14px;
      }
      
      .separator {
        margin: 0 4px;
      }
    }
  }
}

// 订单信息卡片
.info-card {
  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-bottom: 20px;
  }
  
  .info-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    
    .info-label {
      font-size: 12px;
      color: #999;
    }
    
    .info-value {
      font-size: 16px;
      font-weight: 600;
      color: white;
      
      &.highlight {
        color: $warning-color;
      }
      
      &.price {
        color: $secondary-color;
        font-size: 20px;
        font-weight: 700;
      }
    }
  }
  
  .requirements {
    padding: 16px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    
    .requirements-title {
      font-size: 14px;
      font-weight: 600;
      color: white;
      margin-bottom: 12px;
    }
    
    .requirements-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .requirement-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #ccc;
    }
  }
  
  .guarantee-section {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: rgba(0, 179, 101, 0.1);
    border-radius: 8px;
    font-size: 13px;
    color: $success-color;
    margin-top: 16px;
  }
}

// 货主信息卡片
.shipper-card {
  .shipper-profile {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .shipper-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
      
      .shipper-name {
        font-size: 16px;
        font-weight: 600;
        color: white;
      }
      
      .shipper-rating {
        display: flex;
        align-items: center;
        gap: 6px;
        
        .stars {
          font-size: 12px;
          letter-spacing: 1px;
        }
        
        .rating-num {
          font-size: 13px;
          color: #999;
        }
      }
      
      .shipper-stats {
        font-size: 12px;
        color: #999;
      }
    }
  }
}

// 地图卡片
.map-card {
  .map-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    
    .map-text {
      margin-top: 12px;
      font-size: 14px;
      color: #999;
    }
  }
}

// 底部操作栏
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  background: #1C1C1E;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 100;
  
  .price-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    
    .price-label {
      font-size: 12px;
      color: #999;
    }
    
    .price-amount {
      font-size: 24px;
      font-weight: 700;
      color: $secondary-color;
    }
  }
  
  .grab-btn {
    flex: 1;
    height: 48px;
    background: $secondary-color;
    color: white;
    font-size: 16px;
    font-weight: 600;
    border-radius: 24px;
    
    &:active {
      opacity: 0.8;
    }
  }
}

// 移动端优化
@media (max-width: 768px) {
  .content-area {
    padding: 12px;
    gap: 12px;
  }
  
  .route-card,
  .info-card,
  .shipper-card,
  .map-card {
    padding: 16px;
  }
  
  .card-title {
    font-size: 15px;
    margin-bottom: 14px;
  }
}
</style>
