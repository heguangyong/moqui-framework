<template>
  <q-page class="publish-order-page">
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
      <div class="header-title">发布订单</div>
      <q-btn
        flat
        dense
        round
        icon="help_outline"
        color="white"
        @click="showHelp"
      />
    </div>

    <!-- 表单内容 -->
    <div class="form-container">
      <q-form @submit="handleSubmit" class="publish-form">

        <!-- 路线信息 -->
        <div class="form-section">
          <div class="section-title">
            <q-icon name="route" size="20px" color="secondary" />
            <span>运输路线</span>
          </div>

          <div class="route-inputs">
            <div class="route-field">
              <div class="field-label">起运地 *</div>
              <q-select
                v-model="orderForm.originPort"
                :options="portOptions"
                option-label="label"
                option-value="value"
                outlined
                dense
                dark
                placeholder="请选择起运港区"
                emit-value
                map-options
                :rules="[val => !!val || '请选择起运地']"
                class="route-select"
              >
                <template v-slot:prepend>
                  <q-icon name="departure_board" color="primary" />
                </template>
              </q-select>
            </div>

            <div class="route-arrow">
              <q-icon name="arrow_forward" size="24px" color="secondary" />
            </div>

            <div class="route-field">
              <div class="field-label">目的地 *</div>
              <q-select
                v-model="orderForm.destinationPort"
                :options="destinationOptions"
                option-label="label"
                option-value="value"
                outlined
                dense
                dark
                placeholder="请选择目的地"
                emit-value
                map-options
                :rules="[val => !!val || '请选择目的地']"
                class="route-select"
              >
                <template v-slot:prepend>
                  <q-icon name="location_on" color="secondary" />
                </template>
              </q-select>
            </div>
          </div>

          <div v-if="routeInfo" class="route-summary">
            <div class="summary-item">
              <q-icon name="straighten" size="16px" />
              <span>预估距离: {{ routeInfo.distance }}km</span>
            </div>
            <div class="summary-item">
              <q-icon name="schedule" size="16px" />
              <span>预计用时: {{ routeInfo.duration }}</span>
            </div>
            <div class="summary-item">
              <q-icon name="attach_money" size="16px" />
              <span>参考运费: ¥{{ routeInfo.referencePrice }}/TEU</span>
            </div>
          </div>
        </div>

        <!-- 货物信息 -->
        <div class="form-section">
          <div class="section-title">
            <q-icon name="inventory_2" size="20px" color="secondary" />
            <span>货物信息</span>
          </div>

          <div class="cargo-grid">
            <div class="cargo-field">
              <div class="field-label">箱型 *</div>
              <ContainerTypeSelector
                v-model="orderForm.containerType"
                @update:model-value="handleContainerTypeChange"
              />
            </div>

            <div class="cargo-field">
              <div class="field-label">数量 *</div>
              <q-input
                v-model.number="orderForm.quantity"
                type="number"
                outlined
                dense
                dark
                placeholder="1"
                min="1"
                max="10"
                suffix="个"
                :rules="[
                  val => !!val || '请输入数量',
                  val => val > 0 || '数量必须大于0',
                  val => val <= 10 || '单次最多10个'
                ]"
                class="quantity-input"
              />
            </div>

            <div class="cargo-field">
              <div class="field-label">货物重量</div>
              <q-input
                v-model.number="orderForm.weight"
                type="number"
                outlined
                dense
                dark
                placeholder="选填"
                suffix="吨"
                step="0.1"
                min="0"
                :max="containerWeightLimit"
                class="weight-input"
              />
            </div>

            <div class="cargo-field">
              <div class="field-label">货物类型</div>
              <q-select
                v-model="orderForm.cargoType"
                :options="cargoTypeOptions"
                outlined
                dense
                dark
                placeholder="请选择"
                emit-value
                map-options
                class="cargo-type-select"
              />
            </div>
          </div>
        </div>

        <!-- 时间要求 -->
        <div class="form-section">
          <div class="section-title">
            <q-icon name="schedule" size="20px" color="secondary" />
            <span>时间要求</span>
          </div>

          <div class="time-grid">
            <div class="time-field">
              <div class="field-label">最晚提箱时间 *</div>
              <q-input
                v-model="orderForm.latestPickup"
                type="datetime-local"
                outlined
                dense
                dark
                :rules="[
                  val => !!val || '请选择时间',
                  val => new Date(val) > new Date() || '时间不能早于现在'
                ]"
                class="time-input"
              />
            </div>

            <div class="time-field">
              <div class="field-label">要求送达时间</div>
              <q-input
                v-model="orderForm.requiredDelivery"
                type="datetime-local"
                outlined
                dense
                dark
                :min="orderForm.latestPickup"
                class="time-input"
              />
            </div>
          </div>

          <div class="urgency-section">
            <q-checkbox
              v-model="orderForm.isUrgent"
              label="加急订单"
              color="warning"
              dark
              class="urgency-checkbox"
            />
            <div class="urgency-note">
              加急订单会优先展示给司机，但运费可能上浮10-20%
            </div>
          </div>
        </div>

        <!-- 特殊要求 -->
        <div class="form-section">
          <div class="section-title">
            <q-icon name="rule" size="20px" color="secondary" />
            <span>特殊要求</span>
          </div>

          <div class="requirements-grid">
            <q-checkbox
              v-model="orderForm.requiresShPlate"
              label="需要沪牌车辆"
              color="warning"
              dark
              class="requirement-checkbox"
            />
            <q-checkbox
              v-model="orderForm.requiresHydraulicTailgate"
              label="需要液压尾板"
              color="primary"
              dark
              class="requirement-checkbox"
            />
            <q-checkbox
              v-model="orderForm.requiresPortExperience"
              label="熟悉港区优先"
              color="positive"
              dark
              class="requirement-checkbox"
            />
            <q-checkbox
              v-model="orderForm.requiresInsurance"
              label="需要货运保险"
              color="info"
              dark
              class="requirement-checkbox"
            />
          </div>

          <div class="special-notes">
            <div class="field-label">特殊说明</div>
            <q-input
              v-model="orderForm.specialNotes"
              type="textarea"
              outlined
              dense
              dark
              placeholder="请输入特殊要求或注意事项..."
              rows="3"
              maxlength="200"
              class="notes-input"
            />
            <div class="char-counter">{{ orderForm.specialNotes.length }}/200</div>
          </div>
        </div>

        <!-- 运费设置 -->
        <div class="form-section">
          <div class="section-title">
            <q-icon name="payments" size="20px" color="secondary" />
            <span>运费设置</span>
          </div>

          <div class="price-setting">
            <div class="price-mode-tabs">
              <q-btn-toggle
                v-model="priceMode"
                no-caps
                unelevated
                toggle-color="secondary"
                :options="[
                  { label: '固定价格', value: 'fixed' },
                  { label: '竞价模式', value: 'bidding' }
                ]"
                class="price-toggle"
              />
            </div>

            <div v-if="priceMode === 'fixed'" class="fixed-price-section">
              <div class="price-input-group">
                <div class="field-label">运费金额 *</div>
                <q-input
                  v-model.number="orderForm.freight"
                  type="number"
                  outlined
                  dense
                  dark
                  placeholder="请输入运费"
                  prefix="¥"
                  suffix="元"
                  step="50"
                  min="100"
                  :rules="[
                    val => !!val || '请输入运费',
                    val => val >= 100 || '运费不能低于100元'
                  ]"
                  class="freight-input"
                />
              </div>

              <div v-if="routeInfo" class="price-reference">
                <div class="ref-item">
                  <span>市场参考价:</span>
                  <span>¥{{ routeInfo.referencePrice }}</span>
                </div>
                <div class="ref-item">
                  <span>您的报价:</span>
                  <span :class="getPriceComparisonClass()">
                    ¥{{ orderForm.freight }}
                    <small>({{ getPriceComparison() }})</small>
                  </span>
                </div>
              </div>
            </div>

            <div v-if="priceMode === 'bidding'" class="bidding-section">
              <div class="bidding-info">
                <q-icon name="gavel" size="20px" color="warning" />
                <div class="bidding-text">
                  <div class="bidding-title">竞价模式说明</div>
                  <div class="bidding-desc">司机可对此订单进行报价，您可选择最优报价</div>
                </div>
              </div>

              <div class="budget-input-group">
                <div class="field-label">预算上限</div>
                <q-input
                  v-model.number="orderForm.budgetMax"
                  type="number"
                  outlined
                  dense
                  dark
                  placeholder="设置预算上限"
                  prefix="¥"
                  suffix="元"
                  step="50"
                  min="100"
                  class="budget-input"
                />
                <div class="budget-note">司机报价不会超过此金额</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 联系方式 -->
        <div class="form-section">
          <div class="section-title">
            <q-icon name="contact_phone" size="20px" color="secondary" />
            <span>联系方式</span>
          </div>

          <div class="contact-grid">
            <div class="contact-field">
              <div class="field-label">联系人 *</div>
              <q-input
                v-model="orderForm.contactName"
                outlined
                dense
                dark
                placeholder="请输入联系人姓名"
                :rules="[val => !!val || '请输入联系人']"
                class="contact-input"
              />
            </div>

            <div class="contact-field">
              <div class="field-label">联系电话 *</div>
              <q-input
                v-model="orderForm.contactPhone"
                type="tel"
                outlined
                dense
                dark
                placeholder="请输入手机号码"
                :rules="[
                  val => !!val || '请输入联系电话',
                  val => /^1[3-9]\d{9}$/.test(val) || '请输入正确的手机号码'
                ]"
                class="contact-input"
              />
            </div>
          </div>
        </div>

        <!-- 订单摘要 -->
        <div class="order-summary-section">
          <div class="summary-header">
            <q-icon name="receipt_long" size="20px" />
            <span>订单摘要</span>
          </div>
          <div class="summary-content">
            <div class="summary-row">
              <span>路线</span>
              <span>{{ getRouteLabel(orderForm.originPort) }} → {{ getRouteLabel(orderForm.destinationPort) }}</span>
            </div>
            <div class="summary-row">
              <span>箱型</span>
              <span>{{ orderForm.containerType }} × {{ orderForm.quantity }}</span>
            </div>
            <div class="summary-row">
              <span>提箱时间</span>
              <span>{{ formatDateTime(orderForm.latestPickup) }}</span>
            </div>
            <div class="summary-row price-row">
              <span>运费</span>
              <span class="price-value">
                {{ priceMode === 'fixed' ? `¥${orderForm.freight}` : '竞价模式' }}
              </span>
            </div>
          </div>
        </div>
      </q-form>
    </div>

    <!-- 底部操作栏 -->
    <div class="bottom-actions">
      <div class="cost-info">
        <div class="deposit-label">保证金</div>
        <div class="deposit-amount">¥{{ calculateDeposit() }}</div>
      </div>
      <q-btn
        unelevated
        no-caps
        class="publish-btn"
        :class="{ 'publish-btn--complete': isFormComplete() }"
        :disable="!isFormComplete()"
        :loading="publishing"
        @click="confirmPublish"
      >
        <q-icon name="publish" size="20px" class="q-mr-sm" />
        {{ isFormComplete() ? '发布订单' : '信息不全' }}
      </q-btn>
    </div>

    <!-- 确认发布对话框 -->
    <q-dialog v-model="showConfirmDialog" persistent>
      <q-card class="confirm-card">
        <q-card-section class="confirm-header">
          <div class="confirm-title">确认发布订单</div>
        </q-card-section>

        <q-card-section class="confirm-content">
          <div class="confirm-summary">
            <div class="confirm-row">
              <span>路线:</span>
              <span>{{ getRouteLabel(orderForm.originPort) }} → {{ getRouteLabel(orderForm.destinationPort) }}</span>
            </div>
            <div class="confirm-row">
              <span>运费:</span>
              <span class="highlight">{{ priceMode === 'fixed' ? `¥${orderForm.freight}` : '竞价模式' }}</span>
            </div>
            <div class="confirm-row">
              <span>保证金:</span>
              <span class="highlight">¥{{ calculateDeposit() }}</span>
            </div>
          </div>
          <div class="confirm-note">
            订单发布后，保证金将从您的账户余额中冻结，订单完成后自动解冻
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="取消" @click="showConfirmDialog = false" />
          <q-btn
            unelevated
            color="secondary"
            label="确认发布"
            :loading="publishing"
            @click="handlePublish"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import ContainerTypeSelector from '@/components/marketplace/ContainerTypeSelector.vue'

const router = useRouter()
const $q = useQuasar()

// 状态
const publishing = ref(false)
const showConfirmDialog = ref(false)
const priceMode = ref('fixed')

// 表单数据
const orderForm = ref({
  originPort: '',
  destinationPort: '',
  containerType: '',
  quantity: 1,
  weight: 0,
  cargoType: '',
  latestPickup: '',
  requiredDelivery: '',
  isUrgent: false,
  requiresShPlate: false,
  requiresHydraulicTailgate: false,
  requiresPortExperience: false,
  requiresInsurance: false,
  specialNotes: '',
  freight: 0,
  budgetMax: 0,
  contactName: '',
  contactPhone: ''
})

// 选项数据
const portOptions = ref([
  { label: '洋山港四期码头', value: 'YANGSHAN_4' },
  { label: '洋山港三期码头', value: 'YANGSHAN_3' },
  { label: '外高桥五期码头', value: 'WAIGAOQIAO_5' },
  { label: '外高桥四期码头', value: 'WAIGAOQIAO_4' },
  { label: '外高桥三期码头', value: 'WAIGAOQIAO_3' }
])

const destinationOptions = ref([
  { label: '苏州工业园区综合保税区', value: 'SUZHOU_INDUSTRIAL' },
  { label: '昆山综合保税区', value: 'KUNSHAN_BONDED' },
  { label: '张江高科技园区', value: 'ZHANGJIANG_TECH' },
  { label: '嘉定出口加工区', value: 'JIADING_EXPORT' },
  { label: '青浦物流园区', value: 'QINGPU_LOGISTICS' },
  { label: '松江出口加工区', value: 'SONGJIANG_EXPORT' }
])

const cargoTypeOptions = ref([
  { label: '一般货物', value: 'GENERAL' },
  { label: '电子产品', value: 'ELECTRONICS' },
  { label: '机械设备', value: 'MACHINERY' },
  { label: '化工原料', value: 'CHEMICALS' },
  { label: '食品饮料', value: 'FOOD' },
  { label: '纺织服装', value: 'TEXTILE' },
  { label: '其他', value: 'OTHER' }
])

// 计算属性
const routeInfo = computed(() => {
  if (!orderForm.value.originPort || !orderForm.value.destinationPort) {
    return null
  }

  // 模拟路线信息计算
  const routeMap = {
    'YANGSHAN_4-SUZHOU_INDUSTRIAL': {
      distance: 120,
      duration: '2h30min',
      referencePrice: 1800
    },
    'YANGSHAN_4-KUNSHAN_BONDED': {
      distance: 95,
      duration: '2h',
      referencePrice: 1650
    },
    'WAIGAOQIAO_5-ZHANGJIANG_TECH': {
      distance: 45,
      duration: '1h15min',
      referencePrice: 1200
    }
  }

  const key = `${orderForm.value.originPort}-${orderForm.value.destinationPort}`
  return routeMap[key as keyof typeof routeMap] || {
    distance: 80,
    duration: '2h',
    referencePrice: 1500
  }
})

const containerWeightLimit = computed(() => {
  const limits = {
    '20GP': 28,
    '40GP': 28,
    '40HQ': 28,
    '45HQ': 29
  }
  return limits[orderForm.value.containerType as keyof typeof limits] || 28
})

// 监听器
watch([() => orderForm.value.originPort, () => orderForm.value.destinationPort], () => {
  if (routeInfo.value && !orderForm.value.freight) {
    orderForm.value.freight = routeInfo.value.referencePrice
  }
})

// 生命周期
onMounted(() => {
  loadDefaultData()
})

// 方法
const loadDefaultData = () => {
  // 设置默认时间为2小时后
  const defaultTime = new Date(Date.now() + 2 * 60 * 60 * 1000)
  orderForm.value.latestPickup = defaultTime.toISOString().slice(0, 16)
}

const handleContainerTypeChange = (containerType: string) => {
  orderForm.value.containerType = containerType
  // 重置重量如果超出限制
  if (orderForm.value.weight > containerWeightLimit.value) {
    orderForm.value.weight = 0
  }
}

const isFormComplete = (): boolean => {
  const required = [
    orderForm.value.originPort,
    orderForm.value.destinationPort,
    orderForm.value.containerType,
    orderForm.value.quantity > 0,
    orderForm.value.latestPickup,
    orderForm.value.contactName,
    orderForm.value.contactPhone
  ]

  if (priceMode.value === 'fixed') {
    required.push(orderForm.value.freight > 0)
  }

  return required.every(Boolean)
}

const calculateDeposit = (): number => {
  if (priceMode.value === 'fixed' && orderForm.value.freight) {
    return Math.round(orderForm.value.freight * 0.1) // 10%保证金
  }
  if (priceMode.value === 'bidding' && orderForm.value.budgetMax) {
    return Math.round(orderForm.value.budgetMax * 0.1)
  }
  return 0
}

const getPriceComparison = (): string => {
  if (!routeInfo.value || !orderForm.value.freight) return ''

  const diff = orderForm.value.freight - routeInfo.value.referencePrice
  const percentage = Math.round((diff / routeInfo.value.referencePrice) * 100)

  if (percentage > 10) return `高出${percentage}%`
  if (percentage < -10) return `低于${Math.abs(percentage)}%`
  return '接近市场价'
}

const getPriceComparisonClass = (): string => {
  if (!routeInfo.value || !orderForm.value.freight) return ''

  const diff = orderForm.value.freight - routeInfo.value.referencePrice
  const percentage = (diff / routeInfo.value.referencePrice) * 100

  if (percentage > 10) return 'price-high'
  if (percentage < -10) return 'price-low'
  return 'price-normal'
}

const getRouteLabel = (value: string): string => {
  const allOptions = [...portOptions.value, ...destinationOptions.value]
  const option = allOptions.find(opt => opt.value === value)
  return option?.label || value
}

const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

const confirmPublish = () => {
  if (!isFormComplete()) return
  showConfirmDialog.value = true
}

const handlePublish = async () => {
  publishing.value = true

  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000))

    $q.notify({
      type: 'positive',
      message: '订单发布成功！',
      position: 'center'
    })

    // 跳转到订单管理页面
    router.push('/marketplace/profile?tab=orders')

  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '发布失败，请重试'
    })
  } finally {
    publishing.value = false
    showConfirmDialog.value = false
  }
}

const goBack = () => {
  router.back()
}

const showHelp = () => {
  $q.notify({
    type: 'info',
    message: '发布订单帮助功能开发中'
  })
}
</script>

<style scoped lang="scss">
@import '@/styles/shanghai-port-theme.scss';

.publish-order-page {
  background: linear-gradient(180deg, #2C2C2E 0%, #1C1C1E 100%);
  min-height: 100vh;
  padding-bottom: 100px;
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

.form-container {
  padding: 20px;
}

.form-section {
  background: #2C2C2E;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  color: white;

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
    color: white;
  }
}

// 路线输入
.route-inputs {
  display: flex;
  align-items: flex-end;
  gap: 12px;

  .route-field {
    flex: 1;

    .field-label {
      font-size: 14px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 8px;
    }

    .route-select {
      :deep(.q-field__control) {
        background: rgba(255, 255, 255, 0.1);
      }
    }
  }

  .route-arrow {
    padding-bottom: 8px;
  }
}

.route-summary {
  margin-top: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;

  .summary-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
  }
}

// 货物信息
.cargo-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  .cargo-field {
    .field-label {
      font-size: 14px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 8px;
    }

    :deep(.q-field__control) {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}

// 时间要求
.time-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;

  .time-field {
    .field-label {
      font-size: 14px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 8px;
    }

    :deep(.q-field__control) {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}

.urgency-section {
  padding: 12px;
  background: rgba(255, 183, 0, 0.1);
  border-radius: 8px;
  border-left: 4px solid $warning-color;

  .urgency-checkbox {
    margin-bottom: 8px;
  }

  .urgency-note {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.4;
  }
}

// 特殊要求
.requirements-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;

  .requirement-checkbox {
    font-size: 14px;
  }
}

.special-notes {
  .field-label {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 8px;
  }

  .notes-input {
    :deep(.q-field__control) {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  .char-counter {
    text-align: right;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    margin-top: 4px;
  }
}

// 运费设置
.price-setting {
  .price-mode-tabs {
    margin-bottom: 16px;

    .price-toggle {
      :deep(.q-btn) {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.8);
      }

      :deep(.q-btn--active) {
        background: $secondary-color;
        color: white;
      }
    }
  }

  .fixed-price-section {
    .price-input-group {
      margin-bottom: 16px;

      .field-label {
        font-size: 14px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 8px;
      }

      .freight-input {
        :deep(.q-field__control) {
          background: rgba(255, 255, 255, 0.1);
        }
      }
    }

    .price-reference {
      padding: 12px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 8px;

      .ref-item {
        display: flex;
        justify-content: space-between;
        font-size: 14px;

        .price-high {
          color: $error-color;
        }

        .price-low {
          color: $warning-color;
        }

        .price-normal {
          color: $success-color;
        }
      }
    }
  }

  .bidding-section {
    .bidding-info {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: rgba(255, 183, 0, 0.1);
      border-radius: 8px;
      margin-bottom: 16px;

      .bidding-text {
        .bidding-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .bidding-desc {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.4;
        }
      }
    }

    .budget-input-group {
      .field-label {
        font-size: 14px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 8px;
      }

      .budget-input {
        margin-bottom: 8px;

        :deep(.q-field__control) {
          background: rgba(255, 255, 255, 0.1);
        }
      }

      .budget-note {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
      }
    }
  }
}

// 联系方式
.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  .contact-field {
    .field-label {
      font-size: 14px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 8px;
    }

    .contact-input {
      :deep(.q-field__control) {
        background: rgba(255, 255, 255, 0.1);
      }
    }
  }
}

// 订单摘要
.order-summary-section {
  background: #3A3A3C;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;

  .summary-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: white;
    margin-bottom: 16px;
  }

  .summary-content {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;

      &.price-row {
        padding-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        font-size: 16px;
        font-weight: 600;

        .price-value {
          color: $secondary-color;
        }
      }
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

  .cost-info {
    display: flex;
    flex-direction: column;
    align-items: center;

    .deposit-label {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
    }

    .deposit-amount {
      font-size: 16px;
      font-weight: 700;
      color: $warning-color;
    }
  }

  .publish-btn {
    flex: 1;
    height: 48px;
    background: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.5);
    font-size: 16px;
    font-weight: 600;
    border-radius: 24px;
    transition: all 0.3s ease;

    &--complete {
      background: $secondary-color;
      color: white;

      &:hover {
        background: #e8421a;
      }
    }

    &:disabled {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.3);
    }
  }
}

// 确认对话框
.confirm-card {
  background: #2C2C2E;
  color: white;
  min-width: 320px;

  .confirm-header {
    padding-bottom: 0;

    .confirm-title {
      font-size: 18px;
      font-weight: 600;
    }
  }

  .confirm-content {
    .confirm-summary {
      margin-bottom: 16px;

      .confirm-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 14px;

        .highlight {
          color: $secondary-color;
          font-weight: 600;
        }
      }
    }

    .confirm-note {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.4;
      padding: 12px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
    }
  }
}

// 移动端优化
@media (max-width: 768px) {
  .cargo-grid,
  .time-grid,
  .requirements-grid,
  .contact-grid {
    grid-template-columns: 1fr;
  }

  .route-inputs {
    flex-direction: column;
    align-items: stretch;

    .route-arrow {
      padding: 8px 0;
      text-align: center;
    }
  }

  .route-summary {
    flex-direction: column;
    gap: 8px;
  }
}
</style>