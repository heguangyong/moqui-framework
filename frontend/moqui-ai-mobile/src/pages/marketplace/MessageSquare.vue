<template>
  <q-page class="message-square-page">
    <!-- 优化的页面标题 -->
    <div class="page-header q-mb-lg">
      <div class="row items-center justify-between">
        <div class="col">
          <div class="text-h4 text-weight-bold text-primary">供需广场</div>
          <div class="text-subtitle1 text-grey-7">
            <q-icon name="trending_up" color="positive" class="q-mr-xs"/>
            发现商机 · 智能匹配 · 高效对接
          </div>
        </div>
        <div class="col-auto">
          <q-btn
            @click="$router.push('/marketplace/publish')"
            color="primary"
            icon="add_circle"
            label="发布"
            size="md"
            unelevated
            class="publish-btn">
            <q-tooltip>发布供需信息</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- 实时统计数据 -->
      <div class="stats-row q-mt-md">
        <div class="stat-item">
          <q-icon name="inventory" color="primary" size="20px"/>
          <div class="stat-content">
            <div class="stat-number">{{ totalMessages }}</div>
            <div class="stat-label">总消息</div>
          </div>
        </div>
        <div class="stat-item">
          <q-icon name="trending_up" color="positive" size="20px"/>
          <div class="stat-content">
            <div class="stat-number">{{ supplyCount }}</div>
            <div class="stat-label">供应</div>
          </div>
        </div>
        <div class="stat-item">
          <q-icon name="trending_down" color="info" size="20px"/>
          <div class="stat-content">
            <div class="stat-number">{{ demandCount }}</div>
            <div class="stat-label">需求</div>
          </div>
        </div>
        <div class="stat-item">
          <q-icon name="psychology" color="accent" size="20px"/>
          <div class="stat-content">
            <div class="stat-number">{{ todayMatches }}</div>
            <div class="stat-label">今日匹配</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 优化的筛选和搜索栏 -->
    <div class="filter-section q-mb-lg">
      <!-- 智能标签栏 -->
      <div class="smart-filters q-mb-md">
        <q-scroll-area
          style="height: 48px"
          :thumb-style="{ display: 'none' }"
          class="full-width">
          <div class="row no-wrap items-center q-gutter-sm" style="min-width: max-content;">
            <q-chip
              v-for="filter in smartFilters"
              :key="filter.id"
              :color="activeSmartFilter === filter.id ? 'primary' : 'grey-3'"
              :text-color="activeSmartFilter === filter.id ? 'white' : 'grey-7'"
              :icon="filter.icon"
              clickable
              @click="applySmartFilter(filter.id)"
              class="smart-filter-chip">
              {{ filter.label }}
            </q-chip>
          </div>
        </q-scroll-area>
      </div>

      <!-- 主要筛选区域 -->
      <q-card class="filter-card">
        <q-card-section class="q-pa-md">
          <!-- 类型和排序 -->
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-sm-8">
              <q-tabs
                v-model="activeTab"
                dense
                class="type-tabs"
                active-color="primary"
                indicator-color="primary"
                narrow-indicator>
                <q-tab name="all" icon="view_list">
                  <span class="tab-label">全部</span>
                  <q-badge v-if="totalMessages" color="grey-5" text-color="white" class="q-ml-xs">
                    {{ totalMessages }}
                  </q-badge>
                </q-tab>
                <q-tab name="supply" icon="trending_up" color="positive">
                  <span class="tab-label">供应</span>
                  <q-badge v-if="supplyCount" color="positive" text-color="white" class="q-ml-xs">
                    {{ supplyCount }}
                  </q-badge>
                </q-tab>
                <q-tab name="demand" icon="trending_down" color="info">
                  <span class="tab-label">需求</span>
                  <q-badge v-if="demandCount" color="info" text-color="white" class="q-ml-xs">
                    {{ demandCount }}
                  </q-badge>
                </q-tab>
              </q-tabs>
            </div>
            <div class="col-12 col-sm-4">
              <q-select
                v-model="sortBy"
                :options="sortOptions"
                emit-value
                map-options
                dense
                outlined
                label="排序方式"
                class="sort-select">
                <template v-slot:prepend>
                  <q-icon name="sort"/>
                </template>
              </q-select>
            </div>
          </div>

          <!-- 搜索和分类筛选 -->
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-8">
              <q-input
                v-model="searchKeyword"
                placeholder="搜索产品、服务或关键词..."
                outlined
                dense
                clearable
                class="search-input">
                <template v-slot:prepend>
                  <q-icon name="search"/>
                </template>
                <template v-slot:append v-if="searchKeyword">
                  <q-btn
                    @click="clearSearch"
                    icon="clear"
                    flat
                    round
                    dense
                    size="sm"/>
                </template>
              </q-input>
            </div>
            <div class="col-12 col-sm-4">
              <q-select
                v-model="categoryFilter"
                :options="categoryOptions"
                emit-value
                map-options
                dense
                outlined
                clearable
                label="分类筛选"
                class="category-select">
                <template v-slot:prepend>
                  <q-icon name="category"/>
                </template>
              </q-select>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- 优化的消息列表 -->
    <div class="messages-container">
      <q-transition-group
        appear
        enter="animated fadeInUp"
        leave="animated fadeOutDown">

        <!-- 加载状态 -->
        <div v-if="loading" key="loading" class="loading-container">
          <div class="loading-content">
            <q-spinner-dots size="40px" color="primary"/>
            <div class="q-mt-md text-grey-6">加载消息中...</div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else-if="filteredMessages.length === 0" key="empty" class="empty-container">
          <div class="empty-content">
            <q-icon :name="getEmptyIcon()" size="80px" color="grey-4"/>
            <div class="text-h5 text-grey-6 q-mt-md">{{ getEmptyTitle() }}</div>
            <div class="text-body1 text-grey-5 q-mt-sm">{{ getEmptySubtitle() }}</div>

            <div class="empty-actions q-mt-lg">
              <q-btn
                v-if="!searchKeyword && !categoryFilter"
                @click="$router.push('/marketplace/publish')"
                color="primary"
                label="发布第一条消息"
                icon="add_circle"
                size="md"
                unelevated
                class="q-mr-md"/>

              <q-btn
                v-if="searchKeyword || categoryFilter"
                @click="clearAllFilters"
                color="grey-6"
                label="清除筛选"
                icon="clear_all"
                outline/>
            </div>
          </div>
        </div>

        <!-- 消息网格 -->
        <div v-else key="messages" class="messages-grid">
          <div
            v-for="(message, index) in paginatedMessages"
            :key="message.id"
            class="message-item"
            :style="{ animationDelay: `${index * 50}ms` }">
            <enhanced-message-card
              :message="message"
              @view-detail="viewMessageDetail"
              @contact="contactUser"/>
          </div>
        </div>
      </q-transition-group>

      <!-- 分页加载 -->
      <div v-if="filteredMessages.length > messagesPerPage" class="pagination-container q-mt-lg">
        <q-intersection
          @trigger="loadMore"
          :disable="loadingMore || hasLoadedAll"
          class="intersection-target">
          <div v-if="loadingMore" class="text-center q-pa-md">
            <q-spinner color="primary" size="24px"/>
            <div class="q-mt-sm text-grey-6">加载更多...</div>
          </div>
          <div v-else-if="hasLoadedAll" class="text-center q-pa-md">
            <q-icon name="check_circle" color="positive" size="24px"/>
            <div class="q-mt-sm text-grey-6">已加载全部消息</div>
          </div>
        </q-intersection>
      </div>
    </div>

    <!-- 增强的悬浮操作按钮 -->
    <div class="fab-container">
      <q-fab
        color="accent"
        icon="psychology"
        direction="up"
        class="smart-fab">

        <q-fab-action
          @click="openSmartMatching"
          color="purple"
          icon="auto_awesome"
          label="智能匹配"
          external-label/>

        <q-fab-action
          @click="$router.push('/marketplace/publish')"
          color="primary"
          icon="add"
          label="发布消息"
          external-label/>

        <q-fab-action
          @click="refreshMessages"
          color="info"
          icon="refresh"
          label="刷新"
          external-label/>
      </q-fab>
    </div>

    <!-- 对话框组件保持不变 -->
    <message-detail-dialog
      v-model="showDetailDialog"
      :message="selectedMessage"
      @contact="contactUser"/>

    <contact-dialog
      v-model="showContactDialog"
      :message="selectedMessage"/>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import MessageCard from '@/components/marketplace/MessageCard.vue'
import MessageDetailDialog from '@/components/marketplace/MessageDetailDialog.vue'
import ContactDialog from '@/components/marketplace/ContactDialog.vue'
import { moquiApi } from '@/services/api/base'

// 使用增强版消息卡片
const EnhancedMessageCard = MessageCard

const router = useRouter()
const $q = useQuasar()

// 状态管理
const loading = ref(true)
const loadingMore = ref(false)
const activeTab = ref('all')
const searchKeyword = ref('')
const categoryFilter = ref('')
const sortBy = ref('time_desc')
const activeSmartFilter = ref('all')
const messages = ref<any[]>([])

// 分页状态
const currentPage = ref(1)
const messagesPerPage = 20
const hasLoadedAll = ref(false)

// 对话框状态
const showDetailDialog = ref(false)
const showContactDialog = ref(false)
const selectedMessage = ref<any>(null)

// 智能筛选选项
const smartFilters = ref([
  { id: 'all', label: '全部', icon: 'view_list' },
  { id: 'hot', label: '热门', icon: 'local_fire_department' },
  { id: 'recent', label: '最新', icon: 'schedule' },
  { id: 'nearby', label: '附近', icon: 'location_on' },
  { id: 'matched', label: '推荐', icon: 'psychology' },
  { id: 'urgent', label: '紧急', icon: 'priority_high' }
])

// 排序选项
const sortOptions = [
  { label: '最新发布', value: 'time_desc' },
  { label: '最早发布', value: 'time_asc' },
  { label: '标题A-Z', value: 'title_asc' },
  { label: '标题Z-A', value: 'title_desc' },
  { label: '匹配度', value: 'match_desc' }
]

// 分类选项
const categoryOptions = [
  { label: '建筑材料', value: '建筑材料' },
  { label: '机械设备', value: '机械设备' },
  { label: '电子产品', value: '电子产品' },
  { label: '原材料', value: '原材料' },
  { label: '技术服务', value: '技术服务' },
  { label: '物流运输', value: '物流运输' },
  { label: '其他', value: '其他' }
]

// 计算属性
const filteredMessages = computed(() => {
  let filtered = messages.value

  // 按类型筛选
  if (activeTab.value !== 'all') {
    filtered = filtered.filter(msg => msg.type === activeTab.value)
  }

  // 按分类筛选
  if (categoryFilter.value) {
    filtered = filtered.filter(msg => msg.category === categoryFilter.value)
  }

  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(msg =>
      msg.title.toLowerCase().includes(keyword) ||
      msg.description.toLowerCase().includes(keyword) ||
      (msg.tags && msg.tags.some((tag: string) => tag.toLowerCase().includes(keyword)))
    )
  }

  // 智能筛选
  if (activeSmartFilter.value !== 'all') {
    switch (activeSmartFilter.value) {
      case 'hot':
        filtered = filtered.filter(msg => msg.isHot)
        break
      case 'recent':
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        filtered = filtered.filter(msg => new Date(msg.publishTime) > oneDayAgo)
        break
      case 'nearby':
        filtered = filtered.filter(msg => msg.isNearby)
        break
      case 'matched':
        filtered = filtered.filter(msg => msg.matchScore && msg.matchScore > 70)
        break
      case 'urgent':
        filtered = filtered.filter(msg => msg.isUrgent)
        break
    }
  }

  // 排序
  return filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'time_desc':
        return new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime()
      case 'time_asc':
        return new Date(a.publishTime).getTime() - new Date(b.publishTime).getTime()
      case 'title_asc':
        return a.title.localeCompare(b.title)
      case 'title_desc':
        return b.title.localeCompare(a.title)
      case 'match_desc':
        return (b.matchScore || 0) - (a.matchScore || 0)
      default:
        return 0
    }
  })
})

const paginatedMessages = computed(() => {
  return filteredMessages.value.slice(0, currentPage.value * messagesPerPage)
})

const totalMessages = computed(() => messages.value.length)
const supplyCount = computed(() => messages.value.filter(msg => msg.type === 'supply').length)
const demandCount = computed(() => messages.value.filter(msg => msg.type === 'demand').length)
const todayMatches = computed(() => 15) // 模拟今日匹配数

onMounted(async () => {
  await loadMessages()
})

// 监听筛选变化，重置分页
watch([activeTab, searchKeyword, categoryFilter, activeSmartFilter], () => {
  currentPage.value = 1
  hasLoadedAll.value = false
})

// 加载消息列表
const loadMessages = async () => {
  try {
    loading.value = true
    const response = await moquiApi.get('/rest/s1/marketplace/listing')

    if (response.success) {
      // 增强的模拟数据
      messages.value = [
        {
          id: '1',
          type: 'supply',
          title: '优质建筑钢材供应',
          description: '本公司大量供应优质建筑用钢材，规格齐全，质量保证，价格优惠。适用于各类建筑工程项目，提供上门配送服务。',
          category: '建筑材料',
          location: '上海市',
          tags: ['钢材', '建筑', '工程', '配送'],
          contactInfo: { phone: '13800138000' },
          publishTime: new Date('2024-01-15'),
          status: 'active',
          publisherInfo: { userId: '1', nickname: '钢材王' },
          isHot: true,
          isNearby: true,
          matchScore: 85
        },
        {
          id: '2',
          type: 'demand',
          title: '寻找优质水泥供应商',
          description: '大型建筑项目需要优质水泥，要求符合国家标准，有稳定供货能力，长期合作优先考虑。',
          category: '建筑材料',
          location: '北京市',
          tags: ['水泥', '建筑', '长期', '合作'],
          contactInfo: { phone: '13900139000' },
          publishTime: new Date('2024-01-16'),
          status: 'active',
          publisherInfo: { userId: '2', nickname: '工程师小李' },
          isUrgent: true,
          matchScore: 78
        },
        {
          id: '3',
          type: 'supply',
          title: 'AI系统开发服务',
          description: '专业AI系统开发团队，提供机器学习、深度学习、自然语言处理等技术服务，经验丰富。',
          category: '技术服务',
          location: '深圳市',
          tags: ['AI', '开发', '技术', '机器学习'],
          contactInfo: { wechat: 'ai_dev_team' },
          publishTime: new Date('2024-01-17'),
          status: 'active',
          publisherInfo: { userId: '3', nickname: 'AI开发团队' },
          isHot: true,
          matchScore: 92
        },
        {
          id: '4',
          type: 'demand',
          title: '寻求物流配送合作',
          description: '电商平台需要可靠的物流配送服务，覆盖华东地区，日配送量500+，要求快速响应。',
          category: '物流运输',
          location: '杭州市',
          tags: ['物流', '配送', '华东', '电商'],
          contactInfo: { phone: '13700137000', email: 'logistics@demo.com' },
          publishTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
          status: 'active',
          publisherInfo: { userId: '4', nickname: '电商小王' },
          isNearby: true,
          isUrgent: true,
          matchScore: 75
        },
        {
          id: '5',
          type: 'supply',
          title: '精密机械设备租赁',
          description: '提供各类精密机械设备租赁服务，包含数控机床、激光切割机等，设备状态良好。',
          category: '机械设备',
          location: '苏州市',
          tags: ['机械', '租赁', '精密', '数控'],
          contactInfo: { phone: '13600136000', wechat: 'machinery_rental' },
          publishTime: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4小时前
          status: 'active',
          publisherInfo: { userId: '5', nickname: '机械租赁公司' },
          isNearby: false,
          matchScore: 68
        }
      ]
    } else {
      $q.notify({ type: 'negative', message: '加载消息失败' })
    }
  } catch (error) {
    console.error('加载消息失败:', error)
    $q.notify({ type: 'negative', message: '网络错误，请稍后重试' })
  } finally {
    loading.value = false
  }
}

// 加载更多消息
const loadMore = () => {
  if (loadingMore.value || hasLoadedAll.value) return

  loadingMore.value = true
  setTimeout(() => {
    currentPage.value++
    loadingMore.value = false

    // 检查是否已加载完全部
    if (paginatedMessages.value.length >= filteredMessages.value.length) {
      hasLoadedAll.value = true
    }
  }, 800)
}

// 应用智能筛选
const applySmartFilter = (filterId: string) => {
  activeSmartFilter.value = filterId
}

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = ''
}

// 清除所有筛选
const clearAllFilters = () => {
  searchKeyword.value = ''
  categoryFilter.value = ''
  activeSmartFilter.value = 'all'
  activeTab.value = 'all'
}

// 刷新消息
const refreshMessages = async () => {
  currentPage.value = 1
  hasLoadedAll.value = false
  await loadMessages()
  $q.notify({ type: 'positive', message: '刷新成功', position: 'center' })
}

// 获取空状态信息
const getEmptyIcon = () => {
  if (searchKeyword.value) return 'search_off'
  if (categoryFilter.value) return 'category'
  if (activeSmartFilter.value !== 'all') return 'filter_list_off'
  return 'inbox'
}

const getEmptyTitle = () => {
  if (searchKeyword.value) return '未找到相关消息'
  if (categoryFilter.value) return '该分类暂无消息'
  if (activeSmartFilter.value !== 'all') return '暂无符合条件的消息'
  return '暂无消息'
}

const getEmptySubtitle = () => {
  if (searchKeyword.value) return '尝试使用其他关键词搜索'
  if (categoryFilter.value || activeSmartFilter.value !== 'all') return '尝试调整筛选条件'
  return '成为第一个发布消息的人'
}

// 查看消息详情
const viewMessageDetail = (message: any) => {
  selectedMessage.value = message
  showDetailDialog.value = true
}

// 联系用户
const contactUser = (message: any) => {
  selectedMessage.value = message
  showDetailDialog.value = false
  showContactDialog.value = true
}

// 打开智能匹配
const openSmartMatching = () => {
  router.push('/marketplace/smart-matching')
}
</script>

<style scoped lang="scss">
.message-square-page {
  max-width: 1200px;
  margin: 0 auto;
  background: #f5f5f5;
  min-height: 100vh;
  padding: 20px;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 32px 28px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
  margin-bottom: 24px;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="2" fill="%23ffffff" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>') repeat;
    animation: float 20s ease-in-out infinite;
  }

  .text-h4 {
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 8px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .text-subtitle1 {
    font-size: 1.1rem;
    opacity: 0.95;
    font-weight: 500;
  }
}

@keyframes float {
  0%, 100% { transform: translateX(0) translateY(0) rotate(0deg); }
  33% { transform: translateX(30px) translateY(-30px) rotate(120deg); }
  66% { transform: translateX(-20px) translateY(20px) rotate(240deg); }
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 20px;
  position: relative;
  z-index: 1;
  margin-top: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(15px);
  padding: 18px 22px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  gap: 14px;

  &:hover {
    background: rgba(255, 255, 255, 0.35);
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  .q-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  min-width: 0;
}

.stat-number {
  font-size: 2.2rem;
  font-weight: 800;
  line-height: 1;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 0.85rem;
  opacity: 0.95;
  color: white;
  font-weight: 600;
  margin-top: 2px;
}

.publish-btn {
  background: linear-gradient(45deg, #ff6b6b, #feca57);
  border: none;
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
  }
}

.filter-section {
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.9);
  margin-bottom: 24px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 35px rgba(0, 0, 0, 0.12);
  }
}

.smart-filters {
  margin-bottom: 24px;
}

.smart-filter-chip {
  transition: all 0.3s ease;
  font-weight: 600;
  padding: 8px 16px;
  font-size: 0.9rem;
  border-radius: 12px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }
}

.filter-card {
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }

  .q-card-section {
    background: white;
  }
}

.type-tabs {
  .q-tab {
    border-radius: 8px;
    margin-right: 8px;
    transition: all 0.3s ease;
    padding: 8px 16px;

    &.q-tab--active {
      background: rgba(25, 118, 210, 0.1);
    }

    .tab-label {
      margin-right: 6px;
    }

    .q-badge {
      background: transparent !important;
      color: inherit !important;
      border: none !important;
      box-shadow: none !important;
      font-weight: 500;
      font-size: 0.85rem;
      padding: 0 4px;
      margin-left: 2px;
      border-radius: 0;
    }
  }
}

.search-input, .sort-select, .category-select {
  .q-field__control {
    border-radius: 12px;
    transition: all 0.3s ease;
    background: #f5f5f5;
    border: 1px solid #e2e8f0;

    &:hover {
      background: #f9fafb;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border-color: #cbd5e0;
    }

    &:focus-within {
      background: white;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  }
}

.messages-container {
  margin-bottom: 120px;
}

.messages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 24px;
  margin-top: 28px;
}

.message-item {
  opacity: 0;
  transform: translateY(30px);
  animation: slideInUp 0.8s ease forwards;
}

@keyframes slideInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.loading-container, .empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  text-align: center;
  background: white;
  border-radius: 16px;
  margin: 24px 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.08);
  }
}

.loading-content, .empty-content {
  max-width: 500px;
  padding: 40px;
}

.empty-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 24px;
}

.fab-container {
  position: fixed;
  bottom: 32px;
  right: 32px;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;

  .smart-fab {
    background: linear-gradient(45deg, #667eea, #764ba2);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 12px 35px rgba(102, 126, 234, 0.6);
    }

    .q-fab__icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .q-fab-action {
    .q-fab__icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}

// 响应式设计增强
@media (max-width: 768px) {
  .message-square-page {
    padding: 16px;
  }

  .page-header {
    padding: 24px 20px;
    border-radius: 12px;

    .text-h4 {
      font-size: 2rem;
    }

    .text-subtitle1 {
      font-size: 1rem;
    }
  }

  .filter-section {
    padding: 20px 16px;
    border-radius: 12px;
  }

  .loading-container, .empty-container {
    border-radius: 12px;
  }

  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .stat-item {
    padding: 16px 18px;
    gap: 12px;

    .q-icon {
      font-size: 18px;
    }
  }

  .stat-number {
    font-size: 1.8rem;
  }

  .messages-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .fab-container {
    bottom: 24px;
    right: 24px;
  }
}

@media (max-width: 480px) {
  .message-square-page {
    padding: 12px;
  }

  .page-header {
    padding: 20px 16px;
    border-radius: 12px;

    .text-h4 {
      font-size: 1.75rem;
    }

    .text-subtitle1 {
      font-size: 0.9rem;
    }
  }

  .filter-section {
    padding: 16px 12px;
    border-radius: 12px;
  }

  .stats-row {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .stat-item {
    padding: 14px 16px;
    gap: 10px;

    .q-icon {
      font-size: 16px;
    }
  }

  .stat-number {
    font-size: 1.5rem;
  }

  .stat-label {
    font-size: 0.75rem;
  }

  .smart-filter-chip {
    padding: 6px 12px;
    font-size: 0.8rem;
    border-radius: 10px;
  }

  .type-tabs .q-tab {
    min-height: 40px;
    padding: 0 12px;
    font-size: 0.85rem;
  }

  .empty-actions {
    flex-direction: column;
    align-items: center;
  }

  .loading-content, .empty-content {
    padding: 24px;
  }

  .fab-container {
    bottom: 20px;
    right: 20px;

    .smart-fab {
      width: 48px;
      height: 48px;

      .q-fab__icon {
        font-size: 20px;
      }
    }
  }
}

// 暗色模式支持
@media (prefers-color-scheme: dark) {
  .message-square-page {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  }

  .filter-section {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
}
</style>