<template>
  <q-page class="order-execution-page">
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
      <div class="header-title">订单执行</div>
      <div class="header-order-id">{{ order?.listingId }}</div>
    </div>

    <!-- 进度条组件 -->
    <div class="progress-section">
      <OrderProgress
        :steps="progressSteps"
        :current-step="currentStep"
        @step-click="handleStepClick"
      />
    </div>

    <!-- 当前步骤任务面板 -->
    <div class="content-area">
      <div class="task-panel">
        <div class="task-header">
          <q-icon
            :name="currentStepInfo.icon"
            :color="currentStepInfo.color"
            size="24px"
          />
          <div class="task-title">{{ currentStepInfo.title }}</div>
          <div class="task-status">{{ currentStepInfo.status }}</div>
        </div>

        <div class="task-description">
          {{ currentStepInfo.description }}
        </div>

        <!-- 步骤特异性内容 -->
        <div class="step-content">
          <!-- 步骤1: 已接单 -->
          <div v-if="currentStep === 1" class="step-accepted">
            <div class="order-summary">
              <div class="summary-item">
                <div class="label">路线</div>
                <div class="value">{{ order?.originPort }} → {{ order?.destinationPort }}</div>
              </div>
              <div class="summary-item">
                <div class="label">运费</div>
                <div class="value price">¥{{ formatPrice(order?.freight) }}</div>
              </div>
              <div class="summary-item">
                <div class="label">接单时间</div>
                <div class="value">{{ formatDateTime(order?.acceptedAt) }}</div>
              </div>
            </div>
          </div>

          <!-- 步骤2: 前往堆场 -->
          <div v-if="currentStep === 2" class="step-traveling">
            <div class="location-info">
              <div class="current-location">
                <q-icon name="my_location" color="primary" size="20px" />
                <span>当前位置</span>
                <span class="location-text">{{ currentLocation }}</span>
              </div>
              <div class="destination">
                <q-icon name="location_on" color="secondary" size="20px" />
                <span>目的地</span>
                <span class="location-text">{{ order?.originPort }}</span>
              </div>
              <div class="eta">
                <q-icon name="schedule" color="warning" size="20px" />
                <span>预计到达</span>
                <span class="time-text">{{ estimatedArrival }}</span>
              </div>
            </div>

            <div class="navigation-actions">
              <q-btn
                unelevated
                no-caps
                class="nav-btn"
                icon="navigation"
                @click="openNavigation"
              >
                开始导航
              </q-btn>
              <q-btn
                flat
                no-caps
                class="arrived-btn"
                icon="check_circle"
                @click="markArrived"
              >
                已到达堆场
              </q-btn>
            </div>
          </div>

          <!-- 步骤3: 确认提箱 -->
          <div v-if="currentStep === 3" class="step-pickup">
            <div class="form-section">
              <div class="form-item">
                <div class="form-label">集装箱号 *</div>
                <div class="input-group">
                  <q-input
                    v-model="containerNumber"
                    placeholder="点击扫描或手动输入"
                    outlined
                    dense
                    dark
                    class="container-input"
                    :error="containerNumberError"
                    :error-message="containerNumberError ? '集装箱号格式错误' : ''"
                    @input="validateContainerNumber"
                  >
                    <template v-slot:append>
                      <q-btn
                        flat
                        dense
                        round
                        icon="qr_code_scanner"
                        @click="scanContainerNumber"
                      />
                    </template>
                  </q-input>
                </div>
              </div>

              <div class="form-item">
                <div class="form-label">铅封号 *</div>
                <q-input
                  v-model="sealNumber"
                  placeholder="请输入铅封号"
                  outlined
                  dense
                  dark
                  class="seal-input"
                />
              </div>

              <div class="form-item">
                <div class="form-label">集装箱照片 *</div>
                <div class="photo-section">
                  <div class="photo-requirement">
                    需同时拍摄 <strong>箱号</strong> 和 <strong>箱体外观</strong>
                  </div>
                  <div class="photo-grid">
                    <div
                      class="photo-slot"
                      :class="{ 'has-photo': containerPhoto }"
                      @click="takeContainerPhoto"
                    >
                      <div v-if="!containerPhoto" class="photo-placeholder">
                        <q-icon name="camera_alt" size="32px" />
                        <div>拍摄集装箱照片</div>
                      </div>
                      <img v-else :src="containerPhoto" class="photo-preview" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 步骤4: 运输中 -->
          <div v-if="currentStep === 4" class="step-transport">
            <div class="transport-info">
              <div class="info-card">
                <div class="card-header">
                  <q-icon name="local_shipping" color="secondary" size="24px" />
                  <span>运输状态</span>
                </div>
                <div class="transport-details">
                  <div class="detail-item">
                    <span class="label">起运时间</span>
                    <span class="value">{{ formatDateTime(order?.departureTime) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">预计到达</span>
                    <span class="value">{{ formatDateTime(order?.estimatedArrival) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">剩余距离</span>
                    <span class="value">{{ remainingDistance }}km</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="tracking-actions">
              <q-btn
                unelevated
                no-caps
                class="location-btn"
                icon="share_location"
                @click="shareLocation"
              >
                分享位置给货主
              </q-btn>
              <q-btn
                flat
                no-caps
                class="arrived-dest-btn"
                icon="location_on"
                @click="markDestinationArrived"
              >
                已到达目的地
              </q-btn>
            </div>
          </div>

          <!-- 步骤5: 完成 -->
          <div v-if="currentStep === 5" class="step-completed">
            <div class="completion-summary">
              <q-icon name="check_circle" color="positive" size="48px" class="success-icon" />
              <div class="success-message">订单已成功完成！</div>

              <div class="completion-details">
                <div class="detail-row">
                  <span>完成时间</span>
                  <span>{{ formatDateTime(order?.completedAt) }}</span>
                </div>
                <div class="detail-row">
                  <span>运费</span>
                  <span class="price">¥{{ formatPrice(order?.freight) }}</span>
                </div>
                <div class="detail-row">
                  <span>实际用时</span>
                  <span>{{ actualDuration }}</span>
                </div>
              </div>

              <div class="rating-section">
                <div class="rating-title">为此次货主服务打分</div>
                <div class="rating-stars">
                  <q-btn
                    v-for="star in 5"
                    :key="star"
                    flat
                    dense
                    round
                    :icon="star <= rating ? 'star' : 'star_border'"
                    :color="star <= rating ? 'amber' : 'grey'"
                    @click="setRating(star)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 地图区域 -->
      <div class="map-section" v-if="currentStep >= 2 && currentStep <= 4">
        <div class="map-header">
          <q-icon name="map" size="20px" />
          <span>实时位置</span>
          <q-btn flat dense round icon="fullscreen" size="sm" @click="toggleMapFullscreen" />
        </div>
        <div class="map-container-wrapper">
          <AMapContainer
            :center="currentPosition"
            :zoom="12"
            :markers="mapMarkers"
            :route="routeInfo || undefined"
            :show-location-btn="true"
            :show-zoom-controls="false"
            @map-ready="handleMapReady"
            @map-error="handleMapError"
            @marker-click="handleMarkerClick"
          />
        </div>
        <div v-if="routeInfo" class="route-info-bar">
          <div class="route-stat">
            <q-icon name="straighten" size="16px" />
            <span>{{ remainingDistance }}公里</span>
          </div>
          <div class="route-stat">
            <q-icon name="schedule" size="16px" />
            <span>预计{{ estimatedArrival }}到达</span>
          </div>
        </div>
      </div>
    </div>

    <!-- POI详情弹窗 -->
    <POIPopup
      v-model:visible="showPOIPopup"
      :poi="selectedPOI"
      @close="closePOIPopup"
    />

    <!-- 确认弹窗 - Requirements 6.1, 6.2, 6.3, 6.4, 6.5 -->
    <ConfirmDialog
      :visible="showConfirmDialog"
      :title="confirmDialogConfig.title"
      :message="confirmDialogConfig.message"
      :type="confirmDialogConfig.type"
      :details="confirmDialogConfig.details"
      :consequences="confirmDialogConfig.consequences"
      @confirm="handleConfirmDialogConfirm"
      @cancel="handleConfirmDialogCancel"
      @update:visible="showConfirmDialog = $event"
    />

    <!-- 底部操作栏 -->
    <div class="bottom-actions">
      <q-btn
        flat
        no-caps
        class="back-btn"
        icon="arrow_back"
        @click="goBack"
      >
        返回
      </q-btn>

      <q-btn
        unelevated
        no-caps
        class="next-btn"
        :icon="getNextActionIcon()"
        :loading="processing"
        :disable="!canProceedToNext()"
        @click="proceedToNext"
      >
        {{ getNextActionLabel() }}
      </q-btn>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import OrderProgress from '@/components/marketplace/OrderProgress.vue'
import AMapContainer from '@/components/map/AMapContainer.vue'
import POIPopup from '@/components/map/POIPopup.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import type { MapMarker, RouteInfo } from '@/components/map/AMapContainer.vue'
import type { PortPOI } from '@/services/map/PortLayerService'
import { planRoute, formatDistance, formatDuration, formatArrivalTime, getEstimatedArrival } from '@/services/map/RouteService'
import { openExternalNavigation } from '@/services/map/AMapService'
import type { Order } from '@/services/api/marketplace'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()

// 状态
const order = ref<Order | null>(null)
const currentStep = ref(1)
const processing = ref(false)

// 表单数据
const containerNumber = ref('')
const sealNumber = ref('')
const containerPhoto = ref('')
const containerNumberError = ref(false)
const rating = ref(0)

// 位置数据
const currentLocation = ref('上海市浦东新区临港新城')
const estimatedArrival = ref('14:30')
const remainingDistance = ref(8.2)

// 确认弹窗状态 - Requirements 6.1, 6.2, 6.3
const showConfirmDialog = ref(false)
const confirmDialogConfig = ref({
  title: '',
  message: '',
  type: 'info' as 'info' | 'warning' | 'danger',
  details: [] as Array<{ label: string; value: string }>,
  consequences: [] as string[],
  onConfirm: () => {}
})

// 地图相关数据
const mapMarkers = ref<MapMarker[]>([])
const routeInfo = ref<RouteInfo | null>(null)
const mapLoading = ref(false)
const mapError = ref('')
const selectedPOI = ref<PortPOI | null>(null)
const showPOIPopup = ref(false)

// 默认位置（上海港区域）
const currentPosition = ref<[number, number]>([121.5, 31.2]) // 模拟当前位置
const destinationPosition = ref<[number, number]>([122.0673, 30.6297]) // 洋山港

// 进度步骤配置
const progressSteps = [
  { id: 1, label: '已接单', status: 'completed' },
  { id: 2, label: '前往堆场', status: 'completed' },
  { id: 3, label: '确认提箱', status: 'active' },
  { id: 4, label: '运输中', status: 'pending' },
  { id: 5, label: '完成', status: 'pending' }
]

// 当前步骤信息
const currentStepInfo = computed(() => {
  const stepInfoMap = {
    1: {
      icon: 'check_circle',
      color: 'positive',
      title: '订单已接单',
      status: '已完成',
      description: '您已成功接取此订单，请按照时间要求前往指定堆场提箱。'
    },
    2: {
      icon: 'directions_car',
      color: 'primary',
      title: '前往提箱堆场',
      status: '进行中',
      description: '请前往指定堆场，建议使用导航功能获取最佳路线。'
    },
    3: {
      icon: 'inventory',
      color: 'secondary',
      title: '确认提箱信息',
      status: '待完成',
      description: '请在堆场柜台完成提箱后，核对并上传以下信息。'
    },
    4: {
      icon: 'local_shipping',
      color: 'warning',
      title: '运输到目的地',
      status: '待开始',
      description: '请将集装箱安全运输至目的地，可实时分享位置给货主。'
    },
    5: {
      icon: 'emoji_events',
      color: 'positive',
      title: '订单完成',
      status: '已完成',
      description: '恭喜您成功完成此订单！运费将在确认后到账。'
    }
  }
  return stepInfoMap[currentStep.value as keyof typeof stepInfoMap] || stepInfoMap[1]
})

const actualDuration = computed(() => {
  if (!order.value?.acceptedAt || !order.value?.completedAt) return '未知'
  const start = new Date(order.value.acceptedAt)
  const end = new Date(order.value.completedAt)
  const diffMs = end.getTime() - start.getTime()
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}小时${minutes}分钟`
})

// 生命周期
onMounted(() => {
  loadOrderExecution()
})

// 地图相关方法
const handleMapReady = async () => {
  console.log('Map ready')
  await loadRouteData()
}

const handleMapError = (error: { code: string; message: string }) => {
  mapError.value = error.message
  $q.notify({
    type: 'negative',
    message: error.message,
    caption: '点击重试按钮重新加载地图'
  })
}

const handleMarkerClick = (marker: MapMarker) => {
  console.log('Marker clicked:', marker)
  // 可以显示标记点详情
}

const loadRouteData = async () => {
  if (!order.value) return

  mapLoading.value = true
  mapError.value = ''

  try {
    // 设置起点和终点标记
    mapMarkers.value = [
      {
        id: 'origin',
        position: currentPosition.value,
        type: 'origin',
        title: '当前位置'
      },
      {
        id: 'destination',
        position: destinationPosition.value,
        type: 'destination',
        title: order.value.originPort || '目的地'
      }
    ]

    // 规划路线
    const result = await planRoute({
      origin: currentPosition.value,
      destination: destinationPosition.value,
      truckRestrictions: {
        height: 4.5,
        weight: 49
      }
    })

    // 设置路线信息
    routeInfo.value = {
      origin: currentPosition.value,
      destination: destinationPosition.value,
      polyline: result.polyline,
      strokeColor: '#3366FF'
    }

    // 更新预计到达时间和距离
    remainingDistance.value = Math.round(result.distance / 100) / 10 // 转换为公里
    const arrivalTime = getEstimatedArrival(result.duration)
    estimatedArrival.value = formatArrivalTime(arrivalTime)

  } catch (error) {
    console.error('Failed to load route:', error)
    // 路线规划失败时仍显示标记点
  } finally {
    mapLoading.value = false
  }
}

const handlePOIClick = (poi: PortPOI) => {
  selectedPOI.value = poi
  showPOIPopup.value = true
}

const closePOIPopup = () => {
  showPOIPopup.value = false
  selectedPOI.value = null
}

// 方法
const loadOrderExecution = async () => {
  const orderId = route.params.orderId as string

  // 模拟加载订单执行数据
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
    status: 'EXECUTING',
    acceptedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    departureTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    estimatedArrival: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    completedAt: undefined
  }

  // 根据订单状态设置当前步骤
  currentStep.value = 3
}

const validateContainerNumber = () => {
  // 集装箱号格式验证（简化版）
  const pattern = /^[A-Z]{4}[0-9]{7}$/
  containerNumberError.value = containerNumber.value ? !pattern.test(containerNumber.value.toUpperCase()) : false
}

const scanContainerNumber = () => {
  $q.notify({
    type: 'info',
    message: '扫描功能开发中，请手动输入'
  })
}

const takeContainerPhoto = () => {
  $q.notify({
    type: 'info',
    message: '拍照功能开发中'
  })
}

const canProceedToNext = (): boolean => {
  switch (currentStep.value) {
    case 1:
      return true
    case 2:
      return true
    case 3:
      return containerNumber.value && sealNumber.value && containerPhoto.value && !containerNumberError.value
    case 4:
      return true
    case 5:
      return true
    default:
      return false
  }
}

const getNextActionLabel = (): string => {
  switch (currentStep.value) {
    case 1:
      return '前往堆场'
    case 2:
      return '到达堆场'
    case 3:
      return '确认提箱'
    case 4:
      return '确认送达'
    case 5:
      return '完成订单'
    default:
      return '下一步'
  }
}

const getNextActionIcon = (): string => {
  switch (currentStep.value) {
    case 1:
      return 'directions_car'
    case 2:
      return 'location_on'
    case 3:
      return 'check_circle'
    case 4:
      return 'flag'
    case 5:
      return 'done'
    default:
      return 'arrow_forward'
  }
}

// 显示确认弹窗 - Requirements 6.1, 6.2, 6.3
const showConfirm = (config: {
  title: string
  message: string
  type?: 'info' | 'warning' | 'danger'
  details?: Array<{ label: string; value: string }>
  consequences?: string[]
  onConfirm: () => void
}) => {
  confirmDialogConfig.value = {
    title: config.title,
    message: config.message,
    type: config.type || 'info',
    details: config.details || [],
    consequences: config.consequences || [],
    onConfirm: config.onConfirm
  }
  showConfirmDialog.value = true
}

const handleConfirmDialogConfirm = () => {
  showConfirmDialog.value = false
  confirmDialogConfig.value.onConfirm()
}

const handleConfirmDialogCancel = () => {
  showConfirmDialog.value = false
}

const proceedToNext = async () => {
  // 步骤3: 确认提箱 - 需要二次确认 (Requirements 6.1)
  if (currentStep.value === 3) {
    showConfirm({
      title: '确认提箱信息',
      message: '请确认以下提箱信息无误后提交',
      type: 'warning',
      details: [
        { label: '集装箱号', value: containerNumber.value },
        { label: '铅封号', value: sealNumber.value },
        { label: '路线', value: `${order.value?.originPort} → ${order.value?.destinationPort}` }
      ],
      consequences: [
        '提交后信息将无法修改',
        '请确保集装箱号和铅封号准确无误'
      ],
      onConfirm: executeNextStep
    })
    return
  }

  // 步骤4: 确认送达 - 需要二次确认 (Requirements 6.2)
  if (currentStep.value === 4) {
    showConfirm({
      title: '确认送达',
      message: '确认集装箱已安全送达目的地？',
      type: 'info',
      details: [
        { label: '目的地', value: order.value?.destinationPort || '' },
        { label: '运费', value: `¥${formatPrice(order.value?.freight)}` }
      ],
      consequences: [
        '确认后订单将标记为完成',
        '运费将在货主确认后到账'
      ],
      onConfirm: executeNextStep
    })
    return
  }

  // 其他步骤直接执行
  await executeNextStep()
}

const executeNextStep = async () => {
  processing.value = true

  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (currentStep.value < 5) {
      currentStep.value++
      $q.notify({
        type: 'positive',
        message: `步骤${currentStep.value - 1}已完成`,
        position: 'center'
      })
    } else {
      // 订单完成
      order.value!.completedAt = new Date().toISOString()
      $q.notify({
        type: 'positive',
        message: '订单执行完成！',
        position: 'center'
      })
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '操作失败，请重试'
    })
  } finally {
    processing.value = false
  }
}

const handleStepClick = (step: number) => {
  if (step <= currentStep.value) {
    // 只允许点击已完成的步骤
    currentStep.value = step
  }
}

const openNavigation = () => {
  if (order.value) {
    openExternalNavigation(destinationPosition.value, order.value.originPort || '目的地')
  }
}

const markArrived = () => {
  currentStep.value = 3
  $q.notify({
    type: 'positive',
    message: '已到达堆场'
  })
}

const shareLocation = () => {
  $q.notify({
    type: 'info',
    message: '位置分享功能开发中'
  })
}

const markDestinationArrived = () => {
  currentStep.value = 5
  $q.notify({
    type: 'positive',
    message: '已到达目的地'
  })
}

const isMapFullscreen = ref(false)

const toggleMapFullscreen = () => {
  isMapFullscreen.value = !isMapFullscreen.value
}

const setRating = (star: number) => {
  rating.value = star
}

const goBack = () => {
  router.back()
}

const formatDateTime = (dateStr?: string): string => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

const formatPrice = (price?: number): string => {
  if (!price) return '0.00'
  return price.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<style scoped lang="scss">
@import '@/styles/shanghai-port-theme.scss';

.order-execution-page {
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

  .header-order-id {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
  }
}

.progress-section {
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  margin-bottom: 16px;
}

.content-area {
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// 任务面板
.task-panel {
  background: #2C2C2E;
  border-radius: 16px;
  padding: 20px;
  color: white;

  .task-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;

    .task-title {
      flex: 1;
      font-size: 18px;
      font-weight: 600;
    }

    .task-status {
      padding: 4px 12px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
    }
  }

  .task-description {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.5;
    margin-bottom: 20px;
  }
}

// 步骤内容样式
.step-content {
  .order-summary {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      .label {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.7);
      }

      .value {
        font-size: 15px;
        font-weight: 600;
        color: white;

        &.price {
          color: $secondary-color;
          font-size: 18px;
        }
      }
    }
  }

  .location-info {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 20px;

    > div {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;

      .location-text,
      .time-text {
        margin-left: auto;
        font-weight: 600;
      }
    }
  }

  .navigation-actions {
    display: flex;
    gap: 12px;

    .nav-btn {
      flex: 1;
      background: $primary-color;
      color: white;
      font-weight: 600;
    }

    .arrived-btn {
      flex: 1;
      color: $success-color;
      font-weight: 600;
    }
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: 20px;

    .form-item {
      .form-label {
        font-size: 14px;
        font-weight: 600;
        color: white;
        margin-bottom: 8px;
      }

      .input-group {
        .container-input,
        .seal-input {
          :deep(.q-field__control) {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
          }
        }
      }

      .photo-section {
        .photo-requirement {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 12px;
        }

        .photo-grid {
          .photo-slot {
            width: 120px;
            height: 120px;
            border: 2px dashed rgba(255, 255, 255, 0.3);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;

            &:hover {
              border-color: $secondary-color;
            }

            &.has-photo {
              border-style: solid;
              border-color: $success-color;
            }

            .photo-placeholder {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 8px;
              color: rgba(255, 255, 255, 0.5);
              font-size: 12px;
              text-align: center;
            }

            .photo-preview {
              width: 100%;
              height: 100%;
              border-radius: 10px;
              object-fit: cover;
            }
          }
        }
      }
    }
  }

  .transport-info {
    .info-card {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 16px;

      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        margin-bottom: 16px;
      }

      .transport-details {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .label {
            color: rgba(255, 255, 255, 0.7);
            font-size: 14px;
          }

          .value {
            font-weight: 600;
            color: white;
          }
        }
      }
    }
  }

  .tracking-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 20px;

    .location-btn {
      background: $secondary-color;
      color: white;
      font-weight: 600;
    }

    .arrived-dest-btn {
      color: $success-color;
      font-weight: 600;
    }
  }

  .completion-summary {
    text-align: center;

    .success-icon {
      margin-bottom: 16px;
    }

    .success-message {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 24px;
    }

    .completion-details {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;

      .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);

        &:last-child {
          border-bottom: none;
        }

        .price {
          color: $secondary-color;
          font-weight: 700;
        }
      }
    }

    .rating-section {
      .rating-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 12px;
      }

      .rating-stars {
        display: flex;
        justify-content: center;
        gap: 4px;
      }
    }
  }
}

// 地图区域
.map-section {
  background: #2C2C2E;
  border-radius: 16px;
  overflow: hidden;

  .map-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: rgba(255, 255, 255, 0.05);
    color: white;
    font-weight: 600;

    span {
      margin-left: 8px;
    }
  }

  .map-container-wrapper {
    height: 200px;
    position: relative;
  }

  .route-info-bar {
    display: flex;
    justify-content: space-around;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.05);
    border-top: 1px solid rgba(255, 255, 255, 0.1);

    .route-stat {
      display: flex;
      align-items: center;
      gap: 6px;
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
      font-weight: 500;
    }
  }

  .map-placeholder {
    height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

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
  gap: 16px;
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  background: #1C1C1E;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 100;

  .back-btn {
    color: rgba(255, 255, 255, 0.7);
    font-weight: 600;
  }

  .next-btn {
    flex: 1;
    height: 48px;
    background: $secondary-color;
    color: white;
    font-size: 16px;
    font-weight: 600;
    border-radius: 24px;

    &:disabled {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.3);
    }
  }
}

// 移动端优化
@media (max-width: 768px) {
  .content-area {
    padding: 0 12px;
    gap: 12px;
  }

  .task-panel {
    padding: 16px;
  }

  .map-section .map-placeholder {
    height: 160px;
  }
}
</style>