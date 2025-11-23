<template>
  <q-page class="smart-matching-page q-pa-md">
    <!-- 页面标题 -->
    <div class="page-header q-mb-lg">
      <div class="row items-center">
        <q-btn
          @click="$router.back()"
          icon="arrow_back"
          flat
          round
          class="q-mr-md"/>
        <div class="col">
          <div class="text-h5 text-weight-bold">智能匹配</div>
          <div class="text-subtitle2 text-grey-6">AI为您推荐相关的供需信息</div>
        </div>
        <div class="col-auto">
          <q-btn
            @click="runMatching"
            color="accent"
            icon="refresh"
            :loading="matching"
            round>
            <q-tooltip>重新匹配</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>

    <!-- 匹配统计 -->
    <q-card class="stats-card q-mb-md">
      <q-card-section>
        <div class="row items-center">
          <div class="col">
            <div class="text-h6">匹配统计</div>
          </div>
          <div class="col-auto">
            <q-icon name="psychology" size="32px" color="accent"/>
          </div>
        </div>
        <div class="row q-mt-md">
          <div class="col-4 text-center">
            <div class="text-h4 text-accent">{{ matchResults.length }}</div>
            <div class="text-caption text-grey-6">推荐匹配</div>
          </div>
          <div class="col-4 text-center">
            <div class="text-h4 text-positive">{{ highQualityMatches }}</div>
            <div class="text-caption text-grey-6">高质量匹配</div>
          </div>
          <div class="col-4 text-center">
            <div class="text-h4 text-info">{{ averageScore.toFixed(0) }}%</div>
            <div class="text-caption text-grey-6">平均匹配度</div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- 匹配结果 -->
    <div v-if="matching" class="text-center q-pa-lg">
      <q-spinner-dots size="40px" color="accent"/>
      <div class="q-mt-sm text-grey-6">AI正在分析匹配...</div>
    </div>

    <div v-else-if="matchResults.length === 0" class="text-center q-pa-xl">
      <q-icon name="search_off" size="64px" color="grey-4"/>
      <div class="text-h6 text-grey-6 q-mt-md">暂无匹配结果</div>
      <div class="text-body2 text-grey-5 q-mt-sm">
        请先发布您的供需信息，以获得更精准的匹配推荐
      </div>
      <q-btn
        @click="$router.push('/marketplace/publish')"
        color="primary"
        label="发布消息"
        class="q-mt-md"
        outline/>
    </div>

    <div v-else class="matches-container">
      <div
        v-for="match in sortedMatches"
        :key="match.messageId"
        class="col-12 q-mb-md">
        <match-result-card
          :match="match"
          @view-detail="viewMessageDetail"
          @contact="contactUser"/>
      </div>
    </div>

    <!-- 消息详情对话框 -->
    <message-detail-dialog
      v-model="showDetailDialog"
      :message="selectedMessage"
      @contact="contactUser"/>

    <!-- 联系用户对话框 -->
    <contact-dialog
      v-model="showContactDialog"
      :message="selectedMessage"/>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import MatchResultCard from '@/components/marketplace/MatchResultCard.vue'
import MessageDetailDialog from '@/components/marketplace/MessageDetailDialog.vue'
import ContactDialog from '@/components/marketplace/ContactDialog.vue'
import { moquiApi } from '@/services/api/base'

const router = useRouter()
const $q = useQuasar()

// 状态管理
const matching = ref(false)
const matchResults = ref<any[]>([])

// 对话框状态
const showDetailDialog = ref(false)
const showContactDialog = ref(false)
const selectedMessage = ref<any>(null)

// 计算属性
const sortedMatches = computed(() => {
  return [...matchResults.value].sort((a, b) => b.matchScore - a.matchScore)
})

const highQualityMatches = computed(() => {
  return matchResults.value.filter(match => match.matchScore >= 80).length
})

const averageScore = computed(() => {
  if (matchResults.value.length === 0) return 0
  const total = matchResults.value.reduce((sum, match) => sum + match.matchScore, 0)
  return total / matchResults.value.length
})

onMounted(() => {
  runMatching()
})

// 运行智能匹配
const runMatching = async () => {
  matching.value = true
  try {
    const response = await moquiApi.get('/rest/s1/marketplace/match/find')

    if (response.success) {
      // 模拟匹配结果，实际应该从API获取
      matchResults.value = [
        {
          messageId: '1',
          message: {
            id: '1',
            type: 'demand',
            title: '寻找优质钢材供应商',
            description: '项目需要大量建筑用钢材，要求质量优良，价格合理。',
            category: '建筑材料',
            location: '上海市',
            tags: ['钢材', '建筑', '优质'],
            contactInfo: { phone: '13800138001' },
            publishTime: new Date('2024-01-16'),
            publisherInfo: { nickname: '工程师老王' }
          },
          matchScore: 95,
          matchReason: ['产品类型完全匹配', '地理位置邻近', '质量要求一致']
        },
        {
          messageId: '2',
          message: {
            id: '2',
            type: 'supply',
            title: 'AI开发外包服务',
            description: '专业团队提供人工智能系统开发服务，经验丰富。',
            category: '技术服务',
            location: '北京市',
            tags: ['AI', '开发', '技术'],
            contactInfo: { wechat: 'ai_team_2024' },
            publishTime: new Date('2024-01-18'),
            publisherInfo: { nickname: 'Tech团队' }
          },
          matchScore: 78,
          matchReason: ['技术领域相关', '服务类型匹配']
        },
        {
          messageId: '3',
          message: {
            id: '3',
            type: 'demand',
            title: '寻求物流配送合作',
            description: '需要可靠的物流配送服务，覆盖华东地区。',
            category: '物流运输',
            location: '杭州市',
            tags: ['物流', '配送', '华东'],
            contactInfo: { phone: '13900139002' },
            publishTime: new Date('2024-01-19'),
            publisherInfo: { nickname: '电商小李' }
          },
          matchScore: 65,
          matchReason: ['地区覆盖相关', '业务需求互补']
        }
      ]
    } else {
      throw new Error('匹配请求失败')
    }
  } catch (error) {
    console.error('智能匹配失败:', error)
    $q.notify({
      type: 'negative',
      message: '匹配失败，请稍后重试',
      position: 'center'
    })
    matchResults.value = []
  } finally {
    matching.value = false
  }
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
</script>

<style scoped lang="scss">
.smart-matching-page {
  max-width: 800px;
  margin: 0 auto;
  background: #fafafa;
  min-height: 100vh;
}

.page-header {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.stats-card {
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;

  .text-h4, .text-h6 {
    color: white;
  }

  .text-caption {
    color: rgba(255, 255, 255, 0.8);
  }

  .text-accent {
    color: #ffeb3b !important;
  }

  .text-positive {
    color: #4caf50 !important;
  }

  .text-info {
    color: #03a9f4 !important;
  }
}

.matches-container {
  margin-bottom: 40px;
}

@media (max-width: 600px) {
  .smart-matching-page {
    padding: 12px;
  }

  .page-header {
    padding: 16px;
  }
}
</style>