<template>
  <q-page class="order-hall-page">
    <!-- 顶部状态栏 -->
    <div class="status-bar">
      <div class="status-bar__left">
        <q-chip
          :color="isListening ? 'positive' : 'grey-5'"
          text-color="white"
          icon="radio_button_checked"
          dense
        >
          {{ isListening ? '听单中' : '已暂停' }}
        </q-chip>
      </div>
      <div class="status-bar__right">
        <q-btn
          flat
          dense
          no-caps
          class="location-btn"
        >
          <q-icon name="location_on" size="18px" class="q-mr-xs" />
          <span>{{ currentLocation }}</span>
          <q-icon name="expand_more" size="18px" class="q-ml-xs" />
          
          <q-menu>
            <q-list style="min-width: 150px">
              <q-item
                v-for="location in locations"
                :key="location.code"
                clickable
                v-close-popup
                @click="changeLocation(location)"
              >
                <q-item-section>{{ location.name }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        
        <q-btn
          flat
          dense
          round
          icon="tune"
          @click="showFilterDialog = true"
        >
          <q-badge v-if="activeFiltersCount > 0" color="secondary" floating>
            {{ activeFiltersCount }}
          </q-badge>
        </q-btn>
      </div>
    </div>

    <!-- 筛选标签栏 -->
    <div class="filter-tabs">
      <q-scroll-area
        style="height: 56px"
        :thumb-style="{ display: 'none' }"
      >
        <div class="filter-tabs__container">
          <q-chip
            v-for="filter in quickFilters"
            :key="filter.id"
            :color="activeFilter === filter.id ? 'primary' : 'grey-3'"
            :text-color="activeFilter === filter.id ? 'white' : 'grey-7'"
            :icon="filter.icon"
            clickable
            @click="applyQuickFilter(filter.id)"
            class="filter-chip"
          >
            {{ filter.label }}
          </q-chip>
        </div>
      </q-scroll-area>
    </div>

    <!-- 订单列表 -->
    <div class="order-list">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <q-spinner-dots size="40px" color="primary" />
        <div class="q-mt-md text-grey-6">加载订单中...</div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="filteredOrders.length === 0" class="empty-container">
        <q-icon name="inbox" size="120px" color="grey-4" />
        <div class="text-h6 text-grey-6 q-mt-md">当前港区暂无订单</div>
        <div class="text-body2 text-grey-5 q-mt-sm">
          {{ getEmptyMessage() }}
        </div>
        <q-btn
          v-if="activeFilter !== 'all'"
          @click="clearFilters"
          color="primary"
          label="查看全部订单"
          outline
          class="q-mt-md"
        />
      </div>

      <!-- 订单卡片列表 -->
      <div v-else class="order-list__content">
        <q-pull-to-refresh @refresh="refreshOrders">
          <OrderCard
            v-for="order in paginatedOrders"
            :key="order.listingId"
            :order="order"
            @click="viewOrderDetail(order)"
            @long-press="handleOrderLongPress"
          />
        </q-pull-to-refresh>

        <!-- 无限滚动加载 -->
        <q-infinite-scroll
          @load="loadMore"
          :offset="250"
          v-if="hasMore"
        >
          <template v-slot:loading>
            <div class="row justify-center q-my-md">
              <q-spinner-dots color="primary" size="40px" />
            </div>
          </template>
        </q-infinite-scroll>

        <!-- 已加载全部 -->
        <div v-if="!hasMore && paginatedOrders.length > 0" class="load-end">
          <q-icon name="check_circle" color="positive" size="20px" />
          <span class="q-ml-xs">已加载全部订单</span>
        </div>
      </div>
    </div>

    <!-- 筛选对话框 -->
    <q-dialog v-model="showFilterDialog" position="bottom">
      <q-card class="filter-dialog">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">筛选条件</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <!-- 港区筛选 -->
          <div class="filter-group">
            <div class="filter-group__label">港区</div>
            <q-option-group
              v-model="filters.port"
              :options="portOptions"
              color="primary"
              type="radio"
            />
          </div>

          <q-separator class="q-my-md" />

          <!-- 沪牌要求 -->
          <div class="filter-group">
            <div class="filter-group__label">车辆要求</div>
            <q-checkbox
              v-model="filters.requiresShPlate"
              label="仅显示沪牌订单"
              color="primary"
            />
          </div>

          <q-separator class="q-my-md" />

          <!-- 箱型筛选 -->
          <div class="filter-group">
            <div class="filter-group__label">箱型</div>
            <q-option-group
              v-model="filters.containerType"
              :options="containerTypeOptions"
              color="primary"
              type="checkbox"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            label="重置"
            color="grey-7"
            flat
            @click="resetFilters"
          />
          <q-btn
            label="应用"
            color="primary"
            unelevated
            @click="applyFilters"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 悬浮操作按钮 -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn
        fab
        :icon="isListening ? 'pause' : 'play_arrow'"
        :color="isListening ? 'positive' : 'grey-7'"
        @click="toggleListening"
      >
        <q-tooltip>{{ isListening ? '暂停听单' : '开始听单' }}</q-tooltip>
      </q-btn>
    </q-page-sticky>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import OrderCard from '@/components/marketplace/OrderCard.vue'
import { marketplaceApi, type Order } from '@/services/api/marketplace'

const router = useRouter()
const $q = useQuasar()

// 状态管理
const loading = ref(false)
const isListening = ref(true)
const currentLocation = ref('上海·洋山港')
const activeFilter = ref('all')
const showFilterDialog = ref(false)

// 订单数据
const orders = ref<Order[]>([])
const currentPage = ref(1)
const pageSize = 10
const hasMore = ref(true)

// 筛选条件
const filters = ref({
  port: 'all',
  requiresShPlate: false,
  containerType: [] as string[]
})

// 位置选项
const locations = [
  { code: 'yangshan', name: '洋山港' },
  { code: 'waigaoqiao', name: '外高桥' },
  { code: 'all', name: '全部港区' }
]

// 快速筛选
const quickFilters = [
  { id: 'all', label: '推荐', icon: 'recommend' },
  { id: 'yangshan', label: '洋山港', icon: 'anchor' },
  { id: 'waigaoqiao', label: '外高桥', icon: 'anchor' },
  { id: 'sh_plate', label: '沪牌优先', icon: 'verified' }
]

// 港区选项
const portOptions = [
  { label: '全部港区', value: 'all' },
  { label: '洋山港', value: 'yangshan' },
  { label: '外高桥', value: 'waigaoqiao' }
]

// 箱型选项
const containerTypeOptions = [
  { label: '20GP', value: '20GP' },
  { label: '40GP', value: '40GP' },
  { label: '40HQ', value: '40HQ' },
  { label: '45HQ', value: '45HQ' }
]

// 计算属性
const filteredOrders = computed(() => {
  let result = orders.value

  // 快速筛选
  if (activeFilter.value !== 'all') {
    if (activeFilter.value === 'sh_plate') {
      result = result.filter(order => order.requiresShPlate)
    } else {
      result = result.filter(order => order.originPort.includes(activeFilter.value))
    }
  }

  // 高级筛选
  if (filters.value.port !== 'all') {
    result = result.filter(order => order.originPort.includes(filters.value.port))
  }

  if (filters.value.requiresShPlate) {
    result = result.filter(order => order.requiresShPlate)
  }

  if (filters.value.containerType.length > 0) {
    result = result.filter(order => 
      filters.value.containerType.includes(order.containerType)
    )
  }

  return result
})

const paginatedOrders = computed(() => {
  return filteredOrders.value.slice(0, currentPage.value * pageSize)
})

const activeFiltersCount = computed(() => {
  let count = 0
  if (filters.value.port !== 'all') count++
  if (filters.value.requiresShPlate) count++
  if (filters.value.containerType.length > 0) count++
  return count
})

// 生命周期
onMounted(() => {
  loadOrders()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})

// 自动刷新
let refreshTimer: number | null = null

const startAutoRefresh = () => {
  if (isListening.value) {
    refreshTimer = window.setInterval(() => {
      loadOrders(true)
    }, 30000) // 每30秒刷新一次
  }
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// 方法
const loadOrders = async (silent = false) => {
  if (!silent) loading.value = true

  try {
    const response = await marketplaceApi.getOrderList({
      listingType: 'SUPPLY',
      status: 'ACTIVE',
      pageIndex: 0,
      pageSize: 50
    })

    if (response.success && response.data) {
      // 模拟订单数据
      orders.value = generateMockOrders()
    }
  } catch (error) {
    console.error('加载订单失败:', error)
    $q.notify({
      type: 'negative',
      message: '加载订单失败，请稍后重试'
    })
  } finally {
    loading.value = false
  }
}

const generateMockOrders = (): Order[] => {
  return [
    {
      listingId: 'ORD001',
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
    },
    {
      listingId: 'ORD002',
      listingType: 'SUPPLY',
      title: '外高桥五期送货',
      description: '从外高桥五期到昆山开发区',
      originPort: '外高桥五期码头',
      destinationPort: '昆山经济开发区',
      distance: 18.3,
      duration: '2.5h',
      containerType: '20GP',
      quantity: 1,
      latestPickup: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      validFrom: new Date().toISOString(),
      validThru: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      freight: 1200,
      currencyUomId: 'CNY',
      requiresShPlate: false,
      requiresHydraulicTailgate: false,
      requiresPortExperience: false,
      shipper: {
        partyId: 'SHIPPER002',
        name: '昆山物流公司',
        rating: 4.5,
        transactions: 15
      },
      status: 'ACTIVE',
      countdown: 25
    }
  ]
}

const refreshOrders = async (done: () => void) => {
  await loadOrders(true)
  done()
}

const loadMore = async (index: number, done: (stop?: boolean) => void) => {
  if (paginatedOrders.value.length >= filteredOrders.value.length) {
    hasMore.value = false
    done(true)
    return
  }

  setTimeout(() => {
    currentPage.value++
    done()
  }, 500)
}

const changeLocation = (location: typeof locations[0]) => {
  currentLocation.value = `上海·${location.name}`
  activeFilter.value = location.code
}

const applyQuickFilter = (filterId: string) => {
  activeFilter.value = filterId
  currentPage.value = 1
}

const clearFilters = () => {
  activeFilter.value = 'all'
  filters.value = {
    port: 'all',
    requiresShPlate: false,
    containerType: []
  }
}

const resetFilters = () => {
  filters.value = {
    port: 'all',
    requiresShPlate: false,
    containerType: []
  }
}

const applyFilters = () => {
  currentPage.value = 1
}

const toggleListening = () => {
  isListening.value = !isListening.value
  
  if (isListening.value) {
    startAutoRefresh()
    $q.notify({
      type: 'positive',
      message: '已开始听单',
      position: 'center'
    })
  } else {
    stopAutoRefresh()
    $q.notify({
      type: 'info',
      message: '已暂停听单',
      position: 'center'
    })
  }
}

const viewOrderDetail = (order: Order) => {
  router.push(`/marketplace/order/${order.listingId}`)
}

const handleOrderLongPress = (order: Order, action: 'block' | 'favorite') => {
  if (action === 'block') {
    $q.dialog({
      title: '屏蔽货主',
      message: `确定要屏蔽 ${order.shipper.name} 吗？`,
      cancel: true,
      persistent: true
    }).onOk(() => {
      $q.notify({
        type: 'positive',
        message: '已屏蔽该货主'
      })
    })
  } else if (action === 'favorite') {
    $q.notify({
      type: 'positive',
      message: '已收藏该路线'
    })
  }
}

const getEmptyMessage = () => {
  if (activeFilter.value === 'sh_plate') {
    return '当前没有沪牌订单，试试其他筛选条件'
  }
  if (activeFilter.value !== 'all') {
    return '该港区暂无订单，试试其他港区'
  }
  return '暂时没有新订单，请稍后再试'
}
</script>

<style scoped lang="scss">
@import '@/styles/shanghai-port-theme.scss';

.order-hall-page {
  background: #1C1C1E;
  min-height: 100vh;
  padding-bottom: 80px;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  padding-top: calc(14px + env(safe-area-inset-top));
  background: #2C2C2E;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);

  &__left {
    display: flex;
    align-items: center;
    
    :deep(.q-chip) {
      height: 34px;
      font-size: 13px;
      font-weight: 700;
      padding: 0 16px;
      background: linear-gradient(135deg, $secondary-color 0%, #FF6B3D 100%) !important;
      box-shadow: 0 2px 8px rgba(255, 79, 30, 0.3);
      border-radius: 17px;
      
      .q-icon {
        animation: pulse-dot 2s infinite;
      }
    }
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .location-btn {
    font-size: 14px;
    font-weight: 600;
    color: white;
    padding: 8px 14px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
    
    :deep(.q-icon) {
      font-size: 18px;
    }
  }
  
  :deep(.q-btn) {
    color: white;
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}

@keyframes pulse-dot {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.filter-tabs {
  background: #2C2C2E;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 14px 0;

  &__container {
    display: flex;
    gap: 10px;
    padding: 0 16px;
    white-space: nowrap;
  }

  .filter-chip {
    font-size: 13px;
    font-weight: 600;
    height: 38px;
    padding: 0 18px;
    border-radius: 19px;
    background: rgba(255, 255, 255, 0.08) !important;
    color: rgba(255, 255, 255, 0.7) !important;
    transition: all 0.3s ease;
    border: 1px solid transparent;
    
    &:hover {
      background: rgba(255, 255, 255, 0.12) !important;
    }
    
    &.q-chip--colored {
      background: linear-gradient(135deg, $secondary-color 0%, #FF6B3D 100%) !important;
      color: white !important;
      box-shadow: 0 2px 8px rgba(255, 79, 30, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    :deep(.q-icon) {
      font-size: 16px;
    }
  }
}

.order-list {
  padding: 16px;

  &__content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

.loading-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  padding: 40px 20px;
  background: #2C2C2E;
  border-radius: 16px;
  margin: 20px 0;
  
  :deep(.q-icon) {
    opacity: 0.3;
    color: rgba(255, 255, 255, 0.3);
  }
  
  .text-h6 {
    font-size: 18px;
    font-weight: 600;
    margin-top: 16px;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .text-body2 {
    font-size: 14px;
    margin-top: 8px;
    color: rgba(255, 255, 255, 0.5);
  }
  
  :deep(.q-btn) {
    margin-top: 20px;
    background: $secondary-color;
    color: white;
  }
}

.load-end {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  
  :deep(.q-icon) {
    margin-right: 6px;
  }
}

.filter-dialog {
  width: 100%;
  max-width: 500px;
  border-radius: 16px 16px 0 0;
  background: #2C2C2E;

  .filter-group {
    margin-bottom: 20px;
    
    &:last-child {
      margin-bottom: 0;
    }

    &__label {
      font-size: 15px;
      font-weight: 600;
      color: white;
      margin-bottom: 12px;
    }
    
    :deep(.q-option-group) {
      .q-radio,
      .q-checkbox {
        margin-bottom: 8px;
        color: rgba(255, 255, 255, 0.8);
        
        .q-radio__label,
        .q-checkbox__label {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
        }
      }
    }
  }
  
  :deep(.q-card__section) {
    padding: 20px;
    background: #2C2C2E;
  }
  
  :deep(.q-card__actions) {
    padding: 16px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    background: #2C2C2E;
    
    .q-btn {
      color: white;
      
      &[color="primary"] {
        background: $secondary-color;
      }
    }
  }
  
  :deep(.q-separator) {
    background: rgba(255, 255, 255, 0.1);
  }
}

:deep(.q-page-sticky) {
  .q-btn {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}

// 移动端优化
@media (max-width: 768px) {
  .order-hall-page {
    padding-bottom: 70px;
  }

  .status-bar {
    padding: 10px 12px;
    padding-top: calc(10px + env(safe-area-inset-top));

    &__left :deep(.q-chip) {
      height: 28px;
      font-size: 12px;
      padding: 0 12px;
    }

    .location-btn {
      font-size: 13px;
      padding: 4px 10px;
    }
  }

  .filter-tabs {
    padding: 10px 0;

    &__container {
      gap: 8px;
      padding: 0 12px;
    }

    .filter-chip {
      font-size: 12px;
      height: 32px;
      padding: 0 14px;
    }
  }

  .order-list {
    padding: 12px;
    
    &__content {
      gap: 12px;
    }
  }

  .loading-container,
  .empty-container {
    min-height: 300px;
    padding: 30px 16px;
    margin: 16px 0;
    
    .text-h6 {
      font-size: 16px;
    }
    
    .text-body2 {
      font-size: 13px;
    }
  }
}
</style>
