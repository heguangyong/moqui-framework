<template>
  <div class="project-detail-view">
    <div class="project-header">
      <div class="project-info">
        <h1>{{ project?.name || '项目详情' }}</h1>
        <p v-if="project?.description" class="project-description">
          {{ project.description }}
        </p>
        <div class="project-meta">
          <span class="meta-item">
            <strong>创建时间:</strong> {{ formatDate(project?.createdDate) }}
          </span>
          <span class="meta-item">
            <strong>小说数量:</strong> {{ novels.length }}
          </span>
        </div>
      </div>
      <div class="project-actions">
        <button class="action-btn import-btn" @click="showImportModal = true">
          导入小说
        </button>
        <button class="action-btn settings-btn" @click="showSettings = true">
          项目设置
        </button>
      </div>
    </div>

    <div class="project-content">
      <!-- Tabs -->
      <div class="content-tabs">
        <button 
          :class="['tab-button', { active: activeTab === 'novels' }]"
          @click="activeTab = 'novels'"
        >
          小说管理
        </button>
        <button 
          :class="['tab-button', { active: activeTab === 'pipeline' }]"
          @click="activeTab = 'pipeline'"
          :disabled="!selectedNovel"
        >
          处理流水线
        </button>
        <button 
          :class="['tab-button', { active: activeTab === 'characters' }]"
          @click="activeTab = 'characters'"
          :disabled="!selectedNovel"
        >
          角色管理
        </button>
        <button 
          :class="['tab-button', { active: activeTab === 'scenes' }]"
          @click="activeTab = 'scenes'"
          :disabled="!selectedNovel"
        >
          场景管理
        </button>
        <button 
          :class="['tab-button', { active: activeTab === 'episodes' }]"
          @click="activeTab = 'episodes'"
          :disabled="!selectedNovel"
        >
          集数管理
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Novels Tab -->
        <div v-if="activeTab === 'novels'" class="novels-tab">
          <div class="novels-header">
            <h3>小说列表</h3>
            <button class="add-novel-btn" @click="showImportModal = true">
              + 添加小说
            </button>
          </div>

          <div v-if="isLoadingNovels" class="loading-state">
            <div class="loading-spinner">⏳</div>
            <p>加载小说列表中...</p>
          </div>

          <div v-else-if="novels.length === 0" class="empty-state">
            <div class="empty-icon">📚</div>
            <p>暂无小说</p>
            <button class="import-btn" @click="showImportModal = true">
              导入第一本小说
            </button>
          </div>

          <div v-else class="novels-grid">
            <div 
              v-for="novel in novels" 
              :key="novel.novelId"
              class="novel-card"
              :class="{ selected: selectedNovel?.novelId === novel.novelId }"
              @click="selectNovel(novel)"
            >
              <div class="novel-info">
                <h4 class="novel-title">{{ novel.title }}</h4>
                <p v-if="novel.author" class="novel-author">作者: {{ novel.author }}</p>
                <div class="novel-stats">
                  <span class="word-count">{{ novel.wordCount }} 字</span>
                  <span class="status-badge" :class="`status-${novel.status}`">
                    {{ getStatusText(novel.status) }}
                  </span>
                </div>
                <p class="novel-date">{{ formatDate(novel.createdDate) }}</p>
              </div>
              <div class="novel-actions">
                <button 
                  class="action-btn view-btn"
                  @click.stop="viewNovel(novel)"
                  title="查看详情"
                >
                  👁️
                </button>
                <button 
                  class="action-btn edit-btn"
                  @click.stop="editNovel(novel)"
                  title="编辑"
                >
                  ✏️
                </button>
                <button 
                  class="action-btn delete-btn"
                  @click.stop="deleteNovel(novel)"
                  title="删除"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Pipeline Tab -->
        <div v-if="activeTab === 'pipeline'" class="pipeline-tab">
          <PipelineStatus 
            v-if="selectedNovel"
            :novelId="selectedNovel.novelId"
            @stageComplete="handleStageComplete"
            @pipelineComplete="handlePipelineComplete"
            @pipelineError="handlePipelineError"
            @viewResults="handleViewResults"
          />
        </div>

        <!-- Characters Tab -->
        <div v-if="activeTab === 'characters'" class="characters-tab">
          <CharacterGallery 
            v-if="selectedNovel"
            :novelId="selectedNovel.novelId"
            @characterSelected="handleCharacterSelected"
            @characterUpdated="handleCharacterUpdated"
            @characterDeleted="handleCharacterDeleted"
          />
        </div>

        <!-- Scenes Tab -->
        <div v-if="activeTab === 'scenes'" class="scenes-tab">
          <SceneEditor 
            v-if="selectedNovel"
            :novelId="selectedNovel.novelId"
            @sceneSelected="handleSceneSelected"
            @sceneUpdated="handleSceneUpdated"
            @sceneApproved="handleSceneApproved"
          />
        </div>

        <!-- Episodes Tab -->
        <div v-if="activeTab === 'episodes'" class="episodes-tab">
          <EpisodeManager 
            v-if="selectedNovel"
            :novelId="selectedNovel.novelId"
            @episodeSelected="handleEpisodeSelected"
            @episodeUpdated="handleEpisodeUpdated"
            @episodeDeleted="handleEpisodeDeleted"
          />
        </div>
      </div>
    </div>

    <!-- Import Modal -->
    <div v-if="showImportModal" class="modal-overlay" @click="closeImportModal">
      <div class="import-modal" @click.stop>
        <NovelImporter 
          :projectId="projectId"
          @cancel="closeImportModal"
          @success="handleImportSuccess"
          @error="handleImportError"
        />
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" class="success-message">
      <p>{{ successMessage }}</p>
      <button @click="successMessage = ''" class="close-message">✕</button>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="error-message">
      <p>{{ errorMessage }}</p>
      <button @click="errorMessage = ''" class="close-message">✕</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import NovelImporter from '../components/novel/NovelImporter.vue'
import PipelineStatus from '../components/pipeline/PipelineStatus.vue'
import CharacterGallery from '../components/character/CharacterGallery.vue'
import SceneEditor from '../components/scene/SceneEditor.vue'
import EpisodeManager from '../components/episode/EpisodeManager.vue'
import { apiService, novelApi } from '../services'

// Route
const route = useRoute()
const projectId = computed(() => route.params.id as string)

// Reactive data
const project = ref<any>(null)
const novels = ref<any[]>([])
const selectedNovel = ref<any>(null)
const activeTab = ref('novels')
const isLoadingProject = ref(false)
const isLoadingNovels = ref(false)
const showImportModal = ref(false)
const showSettings = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Methods
const loadProject = async () => {
  isLoadingProject.value = true
  
  try {
    // This would need to be implemented in the API
    // For now, we'll create a mock project
    project.value = {
      projectId: projectId.value,
      name: '小说项目',
      description: '这是一个小说处理项目',
      createdDate: new Date().toISOString()
    }
  } catch (error) {
    console.error('Failed to load project:', error)
    errorMessage.value = '加载项目失败'
  } finally {
    isLoadingProject.value = false
  }
}

const loadNovels = async () => {
  isLoadingNovels.value = true
  
  try {
    const result = await novelApi.listNovels(projectId.value)
    
    if (result.success) {
      novels.value = result.novels || []
      
      // Auto-select first novel if none selected
      if (novels.value.length > 0 && !selectedNovel.value) {
        selectedNovel.value = novels.value[0]
      }
    } else {
      console.error('Failed to load novels:', result.message)
    }
  } catch (error) {
    console.error('Failed to load novels:', error)
  } finally {
    isLoadingNovels.value = false
  }
}

const selectNovel = (novel: any) => {
  selectedNovel.value = novel
  
  // Switch to pipeline tab if not on novels tab
  if (activeTab.value === 'novels') {
    activeTab.value = 'pipeline'
  }
}

const viewNovel = (novel: any) => {
  // Implementation for viewing novel details
  console.log('View novel:', novel)
}

const editNovel = (novel: any) => {
  // Implementation for editing novel
  console.log('Edit novel:', novel)
}

const deleteNovel = async (novel: any) => {
  if (!confirm(`确定要删除小说"${novel.title}"吗？此操作不可撤销。`)) {
    return
  }
  
  try {
    const result = await novelApi.deleteNovel(novel.novelId)
    
    if (result.success) {
      novels.value = novels.value.filter(n => n.novelId !== novel.novelId)
      
      // Clear selection if deleted novel was selected
      if (selectedNovel.value?.novelId === novel.novelId) {
        selectedNovel.value = novels.value.length > 0 ? novels.value[0] : null
      }
      
      successMessage.value = '小说删除成功'
    } else {
      errorMessage.value = result.message || '删除小说失败'
    }
  } catch (error: any) {
    errorMessage.value = error.message || '删除小说失败'
  }
}

const closeImportModal = () => {
  showImportModal.value = false
}

const handleImportSuccess = async (result: any) => {
  closeImportModal()
  successMessage.value = '小说导入成功！'
  
  // Reload novels list
  await loadNovels()
  
  // Select the newly imported novel
  if (result.novel) {
    selectedNovel.value = result.novel
    activeTab.value = 'pipeline'
  }
}

const handleImportError = (error: string) => {
  errorMessage.value = error
}

const handleStageComplete = (stageName: string, results: any) => {
  console.log('Stage complete:', stageName, results)
  successMessage.value = `阶段"${stageName}"处理完成`
}

const handlePipelineComplete = (results: any) => {
  console.log('Pipeline complete:', results)
  successMessage.value = '处理流水线完成！'
}

const handlePipelineError = (error: string) => {
  errorMessage.value = `流水线处理失败: ${error}`
}

const handleViewResults = (stageName?: string) => {
  if (stageName) {
    // Switch to appropriate tab based on stage
    switch (stageName) {
      case 'character_extraction':
        activeTab.value = 'characters'
        break
      case 'scene_analysis':
        activeTab.value = 'scenes'
        break
      case 'episode_generation':
        activeTab.value = 'episodes'
        break
    }
  }
}

const handleCharacterSelected = (character: any) => {
  console.log('Character selected:', character)
}

const handleCharacterUpdated = (character: any) => {
  console.log('Character updated:', character)
  successMessage.value = '角色信息更新成功'
}

const handleCharacterDeleted = (characterId: string) => {
  console.log('Character deleted:', characterId)
  successMessage.value = '角色删除成功'
}

const handleSceneSelected = (scene: any) => {
  console.log('Scene selected:', scene)
}

const handleSceneUpdated = (scene: any) => {
  console.log('Scene updated:', scene)
  successMessage.value = '场景信息更新成功'
}

const handleSceneApproved = (scene: any) => {
  console.log('Scene approved:', scene)
  successMessage.value = '场景审批状态已更新'
}

const handleEpisodeSelected = (episode: any) => {
  console.log('Episode selected:', episode)
}

const handleEpisodeUpdated = (episode: any) => {
  console.log('Episode updated:', episode)
  successMessage.value = '集数信息更新成功'
}

const handleEpisodeDeleted = (episodeId: string) => {
  console.log('Episode deleted:', episodeId)
  successMessage.value = '集数删除成功'
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    importing: '导入中',
    analyzing: '分析中',
    analyzed: '已分析',
    processing: '处理中',
    completed: '已完成',
    failed: '失败'
  }
  return statusMap[status] || status
}

const formatDate = (dateString?: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// Lifecycle
onMounted(async () => {
  await loadProject()
  await loadNovels()
})
</script>

<style scoped>
.project-detail-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.project-info h1 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 28px;
  font-weight: 600;
}

.project-description {
  margin: 0 0 16px 0;
  color: #7f8c8d;
  font-size: 16px;
  line-height: 1.5;
}

.project-meta {
  display: flex;
  gap: 24px;
  font-size: 14px;
  color: #7f8c8d;
}

.meta-item strong {
  color: #2c3e50;
}

.project-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.import-btn {
  background: #3498db;
  color: white;
}

.import-btn:hover {
  background: #2980b9;
}

.settings-btn {
  background: #ecf0f1;
  color: #7f8c8d;
}

.settings-btn:hover {
  background: #d5dbdb;
}

.project-content {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  overflow: hidden;
}

.content-tabs {
  display: flex;
  border-bottom: 1px solid #ecf0f1;
}

.tab-button {
  flex: 1;
  padding: 16px 20px;
  border: none;
  background: none;
  color: #7f8c8d;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
}

.tab-button:hover:not(:disabled) {
  color: #3498db;
  background: rgba(52, 152, 219, 0.05);
}

.tab-button.active {
  color: #3498db;
  border-bottom-color: #3498db;
  background: rgba(52, 152, 219, 0.05);
}

.tab-button:disabled {
  color: #bdc3c7;
  cursor: not-allowed;
}

.tab-content {
  padding: 24px;
  min-height: 500px;
}

.novels-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.novels-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
}

.add-novel-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: #27ae60;
  color: white;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.add-novel-btn:hover {
  background: #229954;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 48px 24px;
}

.loading-spinner,
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.loading-state p,
.empty-state p {
  margin: 0 0 24px 0;
  color: #7f8c8d;
  font-size: 16px;
}

.novels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.novel-card {
  border: 1px solid #ecf0f1;
  border-radius: 8px;
  padding: 16px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.novel-card:hover {
  border-color: #3498db;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.novel-card.selected {
  border-color: #3498db;
  background: #f0f8ff;
}

.novel-info {
  margin-bottom: 12px;
}

.novel-title {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.novel-author {
  margin: 0 0 8px 0;
  color: #7f8c8d;
  font-size: 12px;
}

.novel-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.word-count {
  font-size: 12px;
  color: #7f8c8d;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
}

.status-importing {
  background: #fff3cd;
  color: #856404;
}

.status-analyzing {
  background: #cce5ff;
  color: #0066cc;
}

.status-analyzed {
  background: #d4edda;
  color: #155724;
}

.status-processing {
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

.novel-date {
  margin: 0;
  font-size: 11px;
  color: #bdc3c7;
}

.novel-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.novel-actions .action-btn {
  padding: 4px 8px;
  font-size: 12px;
  background: #ecf0f1;
}

.view-btn:hover {
  background: #3498db;
}

.edit-btn:hover {
  background: #f39c12;
}

.delete-btn:hover {
  background: #e74c3c;
}

.tab-placeholder {
  text-align: center;
  padding: 48px 24px;
}

.tab-placeholder h3 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
}

.tab-placeholder p {
  margin: 0;
  color: #7f8c8d;
  font-size: 16px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.import-modal {
  background: white;
  border-radius: 12px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

/* Message Styles */
.success-message,
.error-message {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  z-index: 1001;
  max-width: 400px;
}

.success-message {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.error-message {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.success-message p,
.error-message p {
  margin: 0;
  font-size: 14px;
}

.close-message {
  padding: 4px 8px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
  color: inherit;
}
</style>