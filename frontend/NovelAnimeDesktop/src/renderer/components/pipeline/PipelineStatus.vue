<template>
  <div class="pipeline-status">
    <div class="pipeline-header">
      <h3>处理流水线</h3>
      <div class="pipeline-info">
        <span class="status-badge" :class="statusClass">{{ statusText }}</span>
        <span v-if="pipeline" class="credits-info">
          已用积分: {{ pipeline.creditsUsed }} / {{ pipeline.creditsReserved }}
        </span>
      </div>
    </div>

    <div v-if="pipeline" class="pipeline-content">
      <!-- Progress Overview -->
      <div class="progress-overview">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
        <div class="progress-text">
          {{ pipeline.completedStages }} / {{ pipeline.totalStages }} 阶段完成
          <span v-if="pipeline.status === 'running'" class="progress-percentage">
            ({{ Math.round(progressPercentage) }}%)
          </span>
        </div>
      </div>

      <!-- Stage List -->
      <div class="stages-list">
        <div 
          v-for="(stage, index) in stages" 
          :key="stage.name"
          class="stage-item"
          :class="getStageClass(stage, index)"
          @click="toggleStageDetails(stage.name)"
        >
          <div class="stage-header">
            <div class="stage-icon">
              <span v-if="getStageStatus(stage, index) === 'completed'">✅</span>
              <span v-else-if="getStageStatus(stage, index) === 'running'">⏳</span>
              <span v-else-if="getStageStatus(stage, index) === 'failed'">❌</span>
              <span v-else>⭕</span>
            </div>
            <div class="stage-info">
              <h4 class="stage-name">{{ stage.displayName }}</h4>
              <p class="stage-description">{{ stage.description }}</p>
            </div>
            <div class="stage-status">
              <span class="status-text">{{ getStageStatusText(stage, index) }}</span>
              <span v-if="expandedStages.has(stage.name)" class="expand-icon">▼</span>
              <span v-else class="expand-icon">▶</span>
            </div>
          </div>

          <!-- Stage Details -->
          <div v-if="expandedStages.has(stage.name)" class="stage-details">
            <div v-if="getStageStatus(stage, index) === 'completed'" class="stage-results">
              <h5>处理结果</h5>
              <div class="results-grid">
                <div v-if="stage.name === 'structure_analysis'" class="result-item">
                  <span class="result-label">章节数:</span>
                  <span class="result-value">{{ stageResults.chaptersCreated || 0 }}</span>
                </div>
                <div v-if="stage.name === 'structure_analysis'" class="result-item">
                  <span class="result-label">场景数:</span>
                  <span class="result-value">{{ stageResults.scenesCreated || 0 }}</span>
                </div>
                <div v-if="stage.name === 'character_extraction'" class="result-item">
                  <span class="result-label">角色数:</span>
                  <span class="result-value">{{ stageResults.charactersExtracted || 0 }}</span>
                </div>
                <div v-if="stage.name === 'scene_analysis'" class="result-item">
                  <span class="result-label">增强场景:</span>
                  <span class="result-value">{{ stageResults.scenesEnhanced || 0 }}</span>
                </div>
                <div v-if="stage.name === 'episode_generation'" class="result-item">
                  <span class="result-label">集数:</span>
                  <span class="result-value">{{ stageResults.episodesGenerated || 0 }}</span>
                </div>
              </div>
            </div>

            <div v-if="getStageStatus(stage, index) === 'running'" class="stage-progress">
              <div class="progress-spinner">⏳</div>
              <p>正在处理中...</p>
            </div>

            <div v-if="getStageStatus(stage, index) === 'failed'" class="stage-error">
              <h5>错误信息</h5>
              <p class="error-text">{{ pipeline.errorMessage || '处理失败' }}</p>
              <button class="retry-btn" @click="retryStage(stage.name)">
                重试
              </button>
            </div>

            <div class="stage-actions">
              <button 
                v-if="getStageStatus(stage, index) === 'completed'"
                class="view-results-btn"
                @click="viewStageResults(stage.name)"
              >
                查看详情
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pipeline Actions -->
      <div class="pipeline-actions">
        <button 
          v-if="pipeline.status === 'running'"
          class="cancel-btn"
          @click="cancelPipeline"
        >
          取消处理
        </button>
        <button 
          v-if="pipeline.status === 'failed'"
          class="retry-btn"
          @click="retryPipeline"
        >
          重新开始
        </button>
        <button 
          v-if="pipeline.status === 'completed'"
          class="view-results-btn"
          @click="viewResults"
        >
          查看完整结果
        </button>
      </div>

      <!-- Time Information -->
      <div class="time-info">
        <div v-if="pipeline.startTime" class="time-item">
          <span class="time-label">开始时间:</span>
          <span class="time-value">{{ formatTime(pipeline.startTime) }}</span>
        </div>
        <div v-if="pipeline.endTime" class="time-item">
          <span class="time-label">结束时间:</span>
          <span class="time-value">{{ formatTime(pipeline.endTime) }}</span>
        </div>
        <div v-if="pipeline.status === 'running' && pipeline.estimatedDuration" class="time-item">
          <span class="time-label">预计剩余:</span>
          <span class="time-value">{{ formatDuration(remainingTime) }}</span>
        </div>
      </div>
    </div>

    <div v-else class="no-pipeline">
      <div class="no-pipeline-icon">🔄</div>
      <p>暂无处理流水线</p>
      <button class="create-pipeline-btn" @click="createPipeline">
        创建处理流水线
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { pipelineApi } from '../../services'

// Props
interface Props {
  novelId: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  stageComplete: [stageName: string, results: any]
  pipelineComplete: [results: any]
  pipelineError: [error: string]
  viewResults: [stageName?: string]
}>()

// Reactive data
const pipeline = ref<any>(null)
const isLoading = ref(false)
const expandedStages = ref(new Set<string>())
const stageResults = ref<any>({})
const monitoringInterval = ref<number | null>(null)

// Stage definitions
const stages = [
  {
    name: 'structure_analysis',
    displayName: '结构分析',
    description: '分析小说章节和场景结构'
  },
  {
    name: 'character_extraction',
    displayName: '角色提取',
    description: '识别和分类小说中的角色'
  },
  {
    name: 'scene_analysis',
    displayName: '场景分析',
    description: '分析场景的视觉元素和情绪'
  },
  {
    name: 'episode_generation',
    displayName: '集数生成',
    description: '将场景组织成动画集数'
  }
]

// Computed
const statusClass = computed(() => {
  if (!pipeline.value) return 'status-none'
  
  switch (pipeline.value.status) {
    case 'running': return 'status-running'
    case 'completed': return 'status-completed'
    case 'failed': return 'status-failed'
    default: return 'status-unknown'
  }
})

const statusText = computed(() => {
  if (!pipeline.value) return '未开始'
  
  switch (pipeline.value.status) {
    case 'running': return '处理中'
    case 'completed': return '已完成'
    case 'failed': return '处理失败'
    default: return '未知状态'
  }
})

const progressPercentage = computed(() => {
  if (!pipeline.value) return 0
  return (pipeline.value.completedStages / pipeline.value.totalStages) * 100
})

const remainingTime = computed(() => {
  if (!pipeline.value || pipeline.value.status !== 'running') return 0
  
  const elapsed = Date.now() - new Date(pipeline.value.startTime).getTime()
  const estimatedTotal = pipeline.value.estimatedDuration * 1000
  return Math.max(0, estimatedTotal - elapsed)
})

// Methods
const loadPipelineStatus = async () => {
  isLoading.value = true
  
  try {
    const result = await pipelineApi.getPipelineStatus(props.novelId)
    
    if (result.success && result.pipeline) {
      pipeline.value = result.pipeline
    } else {
      pipeline.value = null
    }
  } catch (error) {
    console.error('Failed to load pipeline status:', error)
  } finally {
    isLoading.value = false
  }
}

const createPipeline = async () => {
  isLoading.value = true
  
  try {
    const result = await pipelineApi.createPipeline(props.novelId)
    
    if (result.success) {
      pipeline.value = result.pipeline
      startMonitoring()
    } else {
      emit('pipelineError', result.message || '创建流水线失败')
    }
  } catch (error: any) {
    emit('pipelineError', error.message || '创建流水线失败')
  } finally {
    isLoading.value = false
  }
}

const startMonitoring = () => {
  if (monitoringInterval.value) {
    clearInterval(monitoringInterval.value)
  }
  
  monitoringInterval.value = setInterval(async () => {
    if (pipeline.value && pipeline.value.status === 'running') {
      await loadPipelineStatus()
      
      if (pipeline.value?.status === 'completed') {
        stopMonitoring()
        emit('pipelineComplete', pipeline.value)
      } else if (pipeline.value?.status === 'failed') {
        stopMonitoring()
        emit('pipelineError', pipeline.value.errorMessage || '处理失败')
      }
    }
  }, 2000) // Poll every 2 seconds
}

const stopMonitoring = () => {
  if (monitoringInterval.value) {
    clearInterval(monitoringInterval.value)
    monitoringInterval.value = null
  }
}

const getStageStatus = (stage: any, index: number) => {
  if (!pipeline.value) return 'pending'
  
  if (pipeline.value.status === 'failed') {
    if (index < pipeline.value.completedStages) return 'completed'
    if (index === pipeline.value.completedStages) return 'failed'
    return 'pending'
  }
  
  if (index < pipeline.value.completedStages) return 'completed'
  if (index === pipeline.value.completedStages && pipeline.value.status === 'running') return 'running'
  return 'pending'
}

const getStageClass = (stage: any, index: number) => {
  const status = getStageStatus(stage, index)
  return {
    'stage-completed': status === 'completed',
    'stage-running': status === 'running',
    'stage-failed': status === 'failed',
    'stage-pending': status === 'pending'
  }
}

const getStageStatusText = (stage: any, index: number) => {
  const status = getStageStatus(stage, index)
  
  switch (status) {
    case 'completed': return '已完成'
    case 'running': return '处理中'
    case 'failed': return '失败'
    default: return '等待中'
  }
}

const toggleStageDetails = (stageName: string) => {
  if (expandedStages.value.has(stageName)) {
    expandedStages.value.delete(stageName)
  } else {
    expandedStages.value.add(stageName)
  }
}

const viewStageResults = (stageName: string) => {
  emit('viewResults', stageName)
}

const viewResults = () => {
  emit('viewResults')
}

const retryStage = async (stageName: string) => {
  // Implementation depends on backend support
  console.log('Retry stage:', stageName)
}

const retryPipeline = async () => {
  await createPipeline()
}

const cancelPipeline = async () => {
  if (pipeline.value) {
    try {
      await pipelineApi.failPipeline({
        pipelineId: pipeline.value.pipelineId,
        errorMessage: '用户取消',
        failedStage: pipeline.value.currentStage
      })
      
      stopMonitoring()
      await loadPipelineStatus()
    } catch (error) {
      console.error('Failed to cancel pipeline:', error)
    }
  }
}

const formatTime = (timeString: string) => {
  return new Date(timeString).toLocaleString('zh-CN')
}

const formatDuration = (milliseconds: number) => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`
  } else {
    return `${seconds}秒`
  }
}

// Lifecycle
onMounted(async () => {
  await loadPipelineStatus()
  
  if (pipeline.value && pipeline.value.status === 'running') {
    startMonitoring()
  }
})

onUnmounted(() => {
  stopMonitoring()
})
</script>

<style scoped>
.pipeline-status {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.pipeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ecf0f1;
}

.pipeline-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
}

.pipeline-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.status-running {
  background: #fff3cd;
  color: #856404;
}

.status-completed {
  background: #d4edda;
  color: #155724;
}

.status-failed {
  background: #f8d7da;
  color: #721c24;
}

.status-none {
  background: #e2e3e5;
  color: #6c757d;
}

.credits-info {
  font-size: 12px;
  color: #7f8c8d;
}

.progress-overview {
  margin-bottom: 24px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: #2db77a;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  color: #7f8c8d;
  font-size: 14px;
}

.progress-percentage {
  font-weight: 500;
  color: #3498db;
}

.stages-list {
  margin-bottom: 24px;
}

.stage-item {
  border: 1px solid #ecf0f1;
  border-radius: 8px;
  margin-bottom: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.stage-item:hover {
  border-color: #3498db;
}

.stage-completed {
  border-color: #27ae60;
  background: #f8fff9;
}

.stage-running {
  border-color: #f39c12;
  background: #fffbf0;
}

.stage-failed {
  border-color: #e74c3c;
  background: #fdf2f2;
}

.stage-pending {
  border-color: #bdc3c7;
  background: #f8f9fa;
}

.stage-header {
  display: flex;
  align-items: center;
  padding: 16px;
  cursor: pointer;
}

.stage-icon {
  margin-right: 12px;
  font-size: 20px;
}

.stage-info {
  flex: 1;
}

.stage-name {
  margin: 0 0 4px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 500;
}

.stage-description {
  margin: 0;
  color: #7f8c8d;
  font-size: 12px;
}

.stage-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-text {
  font-size: 12px;
  color: #7f8c8d;
  font-weight: 500;
}

.expand-icon {
  color: #bdc3c7;
  font-size: 12px;
}

.stage-details {
  padding: 0 16px 16px 16px;
  border-top: 1px solid #ecf0f1;
  background: rgba(255, 255, 255, 0.5);
}

.stage-results h5,
.stage-error h5 {
  margin: 16px 0 12px 0;
  color: #2c3e50;
  font-size: 14px;
  font-weight: 600;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.result-item {
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  background: rgba(52, 152, 219, 0.1);
  border-radius: 6px;
}

.result-label {
  font-size: 11px;
  color: #7f8c8d;
  margin-bottom: 2px;
}

.result-value {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.stage-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
}

.progress-spinner {
  font-size: 20px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.stage-error {
  padding: 16px 0;
}

.error-text {
  color: #e74c3c;
  font-size: 14px;
  margin: 0 0 12px 0;
}

.stage-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.pipeline-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 16px;
}

.view-results-btn,
.retry-btn,
.cancel-btn,
.create-pipeline-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-results-btn {
  background: #3498db;
  color: white;
}

.view-results-btn:hover {
  background: #2980b9;
}

.retry-btn {
  background: #f39c12;
  color: white;
}

.retry-btn:hover {
  background: #e67e22;
}

.cancel-btn {
  background: #e74c3c;
  color: white;
}

.cancel-btn:hover {
  background: #c0392b;
}

.create-pipeline-btn {
  background: #27ae60;
  color: white;
  padding: 12px 24px;
  font-size: 14px;
}

.create-pipeline-btn:hover {
  background: #229954;
}

.time-info {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid #ecf0f1;
  font-size: 12px;
}

.time-item {
  display: flex;
  gap: 4px;
}

.time-label {
  color: #7f8c8d;
}

.time-value {
  color: #2c3e50;
  font-weight: 500;
}

.no-pipeline {
  text-align: center;
  padding: 48px 24px;
}

.no-pipeline-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.no-pipeline p {
  margin: 0 0 24px 0;
  color: #7f8c8d;
  font-size: 16px;
}
</style>