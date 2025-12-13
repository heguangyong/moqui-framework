<template>
  <q-page class="profile-page">
    <!-- 个人信息头部 -->
    <div class="profile-header">
      <div class="header-content">
        <div class="driver-info">
          <q-avatar size="64px" color="secondary" text-color="white" class="driver-avatar">
            {{ userInfo.name.charAt(0) }}
          </q-avatar>
          <div class="driver-details">
            <div class="driver-name">{{ userInfo.name }}</div>
            <div class="driver-plate">{{ userInfo.plateNumber }}</div>
            <div class="driver-level">
              <q-icon name="star" color="amber" size="16px" />
              <span>{{ userInfo.level }}</span>
              <q-icon name="verified" color="positive" size="16px" class="q-ml-sm" />
            </div>
          </div>
        </div>
        <q-btn-dropdown
          flat
          dense
          round
          icon="settings"
          color="white"
          dropdown-icon="none"
        >
          <q-list>
            <q-item clickable v-close-popup @click="openPushSettings">
              <q-item-section avatar>
                <q-icon name="notifications" />
              </q-item-section>
              <q-item-section>推送设置</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="openPushHistory">
              <q-item-section avatar>
                <q-icon name="history" />
              </q-item-section>
              <q-item-section>推送历史</q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable v-close-popup @click="openSettings">
              <q-item-section avatar>
                <q-icon name="settings" />
              </q-item-section>
              <q-item-section>系统设置</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>
    </div>

    <!-- Tab导航 -->
    <div class="tab-navigation">
      <q-tabs
        v-model="activeTab"
        class="tabs-container"
        active-color="secondary"
        indicator-color="secondary"
        align="justify"
        dense
      >
        <q-tab name="orders" label="我的订单" />
        <q-tab name="wallet" label="我的钱包" />
        <q-tab name="documents" label="证件管理" />
      </q-tabs>
    </div>

    <!-- 内容区域 -->
    <div class="content-area">
      <!-- Tab Panel: 我的订单 -->
      <q-tab-panel v-if="activeTab === 'orders'" class="orders-panel">
        <div class="orders-stats">
          <div class="stat-item">
            <div class="stat-number">{{ orderStats.total }}</div>
            <div class="stat-label">总订单</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ orderStats.completed }}</div>
            <div class="stat-label">已完成</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ orderStats.inProgress }}</div>
            <div class="stat-label">进行中</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ orderStats.rating.toFixed(1) }}</div>
            <div class="stat-label">服务评分</div>
          </div>
        </div>

        <!-- 订单筛选 -->
        <div class="order-filters">
          <q-btn-toggle
            v-model="orderFilter"
            no-caps
            unelevated
            toggle-color="secondary"
            :options="[
              { label: '全部', value: 'all' },
              { label: '进行中', value: 'active' },
              { label: '已完成', value: 'completed' },
              { label: '已取消', value: 'cancelled' }
            ]"
            class="filter-buttons"
          />
        </div>

        <!-- 订单列表 -->
        <div class="order-list">
          <div
            v-for="order in filteredOrders"
            :key="order.id"
            class="order-item"
            @click="viewOrderDetail(order.id)"
          >
            <div class="order-header">
              <div class="order-id">{{ order.id }}</div>
              <div class="order-status" :class="`status-${order.status}`">
                {{ getStatusLabel(order.status) }}
              </div>
            </div>
            <div class="order-route">
              {{ order.origin }} → {{ order.destination }}
            </div>
            <div class="order-meta">
              <span class="order-date">{{ formatDate(order.createdAt) }}</span>
              <span class="order-amount">¥{{ formatPrice(order.amount) }}</span>
            </div>
          </div>

          <div v-if="filteredOrders.length === 0" class="empty-state">
            <q-icon name="receipt_long" size="48px" color="grey-5" />
            <div class="empty-text">暂无订单</div>
          </div>
        </div>
      </q-tab-panel>

      <!-- Tab Panel: 我的钱包 -->
      <q-tab-panel v-if="activeTab === 'wallet'" class="wallet-panel">
        <!-- 钱包卡片 -->
        <WalletCard
          :balance="walletInfo.balance"
          :in-transit="walletInfo.inTransit"
          :in-transit-count="walletInfo.inTransitCount"
          :today-income="walletInfo.todayIncome"
          :week-income="walletInfo.weekIncome"
          @withdraw="handleWithdraw"
          @recharge="handleRecharge"
        />

        <!-- 账单列表 -->
        <div class="billing-section">
          <div class="section-header">
            <div class="section-title">账单记录</div>
            <q-btn
              flat
              dense
              no-caps
              icon="filter_list"
              label="筛选"
              color="primary"
              @click="openBillingFilter"
            />
          </div>

          <div class="billing-list">
            <div
              v-for="bill in billingHistory"
              :key="bill.id"
              class="billing-item"
            >
              <div class="bill-left">
                <div class="bill-type">
                  <q-icon
                    :name="getBillIcon(bill.type)"
                    :color="getBillIconColor(bill.type)"
                    size="20px"
                  />
                  <span class="bill-desc">{{ bill.description }}</span>
                </div>
                <div class="bill-time">{{ formatDateTime(bill.createdAt) }}</div>
              </div>
              <div class="bill-right">
                <div class="bill-amount" :class="bill.type === 'income' ? 'positive' : 'negative'">
                  {{ bill.type === 'income' ? '+' : '-' }}¥{{ formatPrice(bill.amount) }}
                </div>
                <div class="bill-status">{{ getBillStatusLabel(bill.status) }}</div>
              </div>
            </div>

            <div v-if="billingHistory.length === 0" class="empty-state">
              <q-icon name="receipt" size="48px" color="grey-5" />
              <div class="empty-text">暂无账单记录</div>
            </div>
          </div>
        </div>
      </q-tab-panel>

      <!-- Tab Panel: 证件管理 -->
      <q-tab-panel v-if="activeTab === 'documents'" class="documents-panel">
        <div class="documents-grid">
          <div
            v-for="doc in documents"
            :key="doc.type"
            class="document-card"
            :class="{ 'verified': doc.verified, 'expired': isExpired(doc.expiryDate) }"
            @click="viewDocument(doc.type)"
          >
            <div class="doc-header">
              <q-icon :name="getDocumentIcon(doc.type)" size="24px" />
              <div class="doc-status">
                <q-icon
                  v-if="doc.verified"
                  name="verified"
                  color="positive"
                  size="16px"
                />
                <q-icon
                  v-else-if="isExpired(doc.expiryDate)"
                  name="error"
                  color="negative"
                  size="16px"
                />
                <q-icon
                  v-else
                  name="pending"
                  color="warning"
                  size="16px"
                />
              </div>
            </div>
            <div class="doc-title">{{ getDocumentTitle(doc.type) }}</div>
            <div class="doc-info">
              <div class="doc-number">{{ doc.number }}</div>
              <div class="doc-expiry">
                有效期至: {{ formatDate(doc.expiryDate) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 添加证件按钮 -->
        <div class="add-document">
          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="add"
            label="添加证件"
            class="add-btn"
            @click="addDocument"
          />
        </div>
      </q-tab-panel>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import WalletCard from '@/components/marketplace/WalletCard.vue'

const router = useRouter()
const $q = useQuasar()

// 状态
const activeTab = ref('orders')
const orderFilter = ref('all')

// 用户信息
const userInfo = ref({
  name: '张师傅',
  plateNumber: '沪D·12345',
  level: '洋山港熟手Lv.3',
  avatar: '',
  verified: true
})

// 订单统计
const orderStats = ref({
  total: 156,
  completed: 142,
  inProgress: 3,
  rating: 4.7
})

// 钱包信息
const walletInfo = ref({
  balance: 8650.00,
  inTransit: 3200.00,
  inTransitCount: 2,
  todayIncome: 1850.00,
  weekIncome: 12400.00
})

// 订单历史
const orderHistory = ref([
  {
    id: 'ORD001',
    origin: '洋山港四期',
    destination: '苏州工业园区',
    status: 'completed',
    amount: 1850.00,
    createdAt: '2024-12-10T10:30:00Z'
  },
  {
    id: 'ORD002',
    origin: '外高桥五期',
    destination: '昆山综保区',
    status: 'active',
    amount: 2100.00,
    createdAt: '2024-12-10T14:15:00Z'
  },
  {
    id: 'ORD003',
    origin: '洋山港三期',
    destination: '张江高科',
    status: 'completed',
    amount: 1650.00,
    createdAt: '2024-12-09T16:45:00Z'
  }
])

// 账单历史
const billingHistory = ref([
  {
    id: 'BILL001',
    type: 'income',
    description: '洋山港→昆山 运费收入',
    amount: 1850.00,
    status: 'completed',
    createdAt: '2024-12-10T18:30:00Z'
  },
  {
    id: 'BILL002',
    type: 'expense',
    description: '提现到银行卡',
    amount: 5000.00,
    status: 'completed',
    createdAt: '2024-12-10T15:20:00Z'
  },
  {
    id: 'BILL003',
    type: 'income',
    description: '外高桥→张江 运费收入',
    amount: 1650.00,
    status: 'pending',
    createdAt: '2024-12-09T20:15:00Z'
  }
])

// 证件信息
const documents = ref([
  {
    type: 'driverLicense',
    number: 'D310*****567',
    expiryDate: '2026-08-15',
    verified: true
  },
  {
    type: 'vehicleLicense',
    number: '沪D12345',
    expiryDate: '2025-06-30',
    verified: true
  },
  {
    type: 'businessLicense',
    number: '310115***789',
    expiryDate: '2025-12-31',
    verified: false
  },
  {
    type: 'roadTransport',
    number: 'RT310***456',
    expiryDate: '2024-03-20',
    verified: true
  }
])

// 计算属性
const filteredOrders = computed(() => {
  if (orderFilter.value === 'all') {
    return orderHistory.value
  }
  return orderHistory.value.filter(order => order.status === orderFilter.value)
})

// 生命周期
onMounted(() => {
  loadUserProfile()
})

// 方法
const loadUserProfile = () => {
  // 模拟加载用户数据
  console.log('Loading user profile...')
}

const getStatusLabel = (status: string): string => {
  const statusMap = {
    'active': '进行中',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return statusMap[status as keyof typeof statusMap] || status
}

const viewOrderDetail = (orderId: string) => {
  router.push(`/marketplace/order/${orderId}`)
}

const handleWithdraw = () => {
  $q.dialog({
    title: '提现',
    message: '请输入提现金额',
    prompt: {
      model: '',
      type: 'number'
    },
    cancel: {
      label: '取消',
      flat: true
    },
    ok: {
      label: '确认提现',
      color: 'secondary'
    },
    persistent: true
  }).onOk(data => {
    $q.notify({
      type: 'positive',
      message: `提现申请已提交：¥${data}`
    })
  })
}

const handleRecharge = () => {
  $q.notify({
    type: 'info',
    message: '充值功能开发中'
  })
}

const openBillingFilter = () => {
  $q.notify({
    type: 'info',
    message: '筛选功能开发中'
  })
}

const getBillIcon = (type: string): string => {
  const iconMap = {
    'income': 'trending_up',
    'expense': 'trending_down'
  }
  return iconMap[type as keyof typeof iconMap] || 'receipt'
}

const getBillIconColor = (type: string): string => {
  return type === 'income' ? 'positive' : 'negative'
}

const getBillStatusLabel = (status: string): string => {
  const statusMap = {
    'completed': '已完成',
    'pending': '处理中',
    'failed': '失败'
  }
  return statusMap[status as keyof typeof statusMap] || status
}

const getDocumentIcon = (type: string): string => {
  const iconMap = {
    'driverLicense': 'person',
    'vehicleLicense': 'directions_car',
    'businessLicense': 'business',
    'roadTransport': 'local_shipping'
  }
  return iconMap[type as keyof typeof iconMap] || 'description'
}

const getDocumentTitle = (type: string): string => {
  const titleMap = {
    'driverLicense': '驾驶证',
    'vehicleLicense': '行驶证',
    'businessLicense': '营业执照',
    'roadTransport': '道路运输证'
  }
  return titleMap[type as keyof typeof titleMap] || '证件'
}

const isExpired = (expiryDate: string): boolean => {
  return new Date(expiryDate) < new Date()
}

const viewDocument = (type: string) => {
  $q.notify({
    type: 'info',
    message: `查看${getDocumentTitle(type)}`
  })
}

const addDocument = () => {
  $q.notify({
    type: 'info',
    message: '添加证件功能开发中'
  })
}

const openSettings = () => {
  $q.notify({
    type: 'info',
    message: '设置功能开发中'
  })
}

// 推送设置导航 - Requirements 4.1
const openPushSettings = () => {
  router.push('/marketplace/push-settings')
}

// 推送历史导航 - Requirements 4.4
const openPushHistory = () => {
  router.push('/marketplace/push-history')
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}-${day}`
}

const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

const formatPrice = (price: number): string => {
  return price.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<style scoped lang="scss">
@import '@/styles/shanghai-port-theme.scss';

.profile-page {
  background: linear-gradient(180deg, #2C2C2E 0%, #1C1C1E 100%);
  min-height: 100vh;
}

// 个人信息头部
.profile-header {
  background: $primary-color;
  padding: calc(16px + env(safe-area-inset-top)) 20px 24px;
  color: white;

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .driver-info {
    display: flex;
    align-items: center;
    gap: 16px;

    .driver-details {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .driver-name {
        font-size: 20px;
        font-weight: 600;
      }

      .driver-plate {
        font-size: 14px;
        opacity: 0.9;
        font-weight: 500;
        letter-spacing: 1px;
      }

      .driver-level {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        font-weight: 500;
        opacity: 0.9;
      }
    }
  }
}

// Tab导航
.tab-navigation {
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  .tabs-container {
    :deep(.q-tab) {
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;
    }

    :deep(.q-tab--active) {
      color: white;
      font-weight: 600;
    }

    :deep(.q-tabs__indicator) {
      background-color: $secondary-color;
    }
  }
}

// 内容区域
.content-area {
  padding: 20px;

  :deep(.q-tab-panel) {
    padding: 0;
  }
}

// 订单面板
.orders-panel {
  .orders-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 24px;

    .stat-item {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 16px 12px;
      text-align: center;

      .stat-number {
        font-size: 20px;
        font-weight: 700;
        color: white;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
      }
    }
  }

  .order-filters {
    margin-bottom: 20px;

    .filter-buttons {
      :deep(.q-btn-group) {
        gap: 8px;
      }
      
      :deep(.q-btn) {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.7);
        border-radius: 8px;
        font-size: 13px;
        margin: 0 4px;
      }

      :deep(.q-btn--active) {
        background: $secondary-color;
        color: white;
      }
    }
  }

  .order-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .order-item {
      background: #2C2C2E;
      border-radius: 12px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: #333336;
      }

      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .order-id {
          font-size: 16px;
          font-weight: 600;
          color: white;
        }

        .order-status {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;

          &.status-active {
            background: rgba(24, 144, 255, 0.15);
            color: #1890FF;
          }

          &.status-completed {
            background: rgba(0, 179, 101, 0.15);
            color: $success-color;
          }

          &.status-cancelled {
            background: rgba(255, 255, 255, 0.1);
            color: #999;
          }
        }
      }

      .order-route {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 8px;
      }

      .order-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .order-date {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }

        .order-amount {
          font-size: 16px;
          font-weight: 600;
          color: $secondary-color;
        }
      }
    }
  }
}

// 钱包面板
.wallet-panel {
  .billing-section {
    margin-top: 24px;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .section-title {
        font-size: 18px;
        font-weight: 600;
        color: white;
      }
    }

    .billing-list {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .billing-item {
        background: #2C2C2E;
        border-radius: 12px;
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .bill-left {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .bill-type {
            display: flex;
            align-items: center;
            gap: 8px;

            .bill-desc {
              font-size: 15px;
              font-weight: 500;
              color: white;
            }
          }

          .bill-time {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
          }
        }

        .bill-right {
          text-align: right;

          .bill-amount {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 4px;

            &.positive {
              color: $success-color;
            }

            &.negative {
              color: rgba(255, 255, 255, 0.8);
            }
          }

          .bill-status {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
          }
        }
      }
    }
  }
}

// 证件面板
.documents-panel {
  .documents-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 24px;

    .document-card {
      background: #2C2C2E;
      border-radius: 12px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid transparent;

      &:hover {
        background: #333336;
      }

      &.verified {
        border-color: $success-color;
      }

      &.expired {
        border-color: $error-color;
      }

      .doc-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        color: white;
      }

      .doc-title {
        font-size: 14px;
        font-weight: 600;
        color: white;
        margin-bottom: 8px;
      }

      .doc-info {
        .doc-number {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 4px;
        }

        .doc-expiry {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
        }
      }
    }
  }

  .add-document {
    text-align: center;

    .add-btn {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      font-weight: 500;
    }
  }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;

  .empty-text {
    margin-top: 12px;
    font-size: 14px;
    color: #999;
  }
}

// 移动端优化
@media (max-width: 768px) {
  .content-area {
    padding: 16px;
  }

  .orders-stats {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 8px !important;

    .stat-item {
      padding: 12px 8px !important;

      .stat-number {
        font-size: 18px !important;
      }

      .stat-label {
        font-size: 11px !important;
      }
    }
  }

  .documents-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>