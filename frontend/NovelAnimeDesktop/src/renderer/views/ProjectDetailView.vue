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
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: 100%;
  overflow-y: auto;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
}

.project-info h1 {
  margin: 0 0 8px 0;
  color: #2c2c2e;
  font-size: 24px;
  font-weight: 600;
}

.project-description {
  margin: 0 0 12px 0;
  color: #6c6c6e;
  font-size: 14px;
  line-height: 1.5;
}

.project-meta {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #7a7a7c;
}

.meta-item strong {
  color: #4a4a4c;
}

.project-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 0 16px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.import-btn {
  background: rgba(100, 140, 120, 0.2);
  border-color: rgba(100, 140, 120, 0.3);
  color: #3a5a42;
}

.import-btn:hover {
  background: rgba(100, 140, 120, 0.3);
}

.settings-btn {
  background: rgba(255, 255, 255, 0.5);
  color: #5a5a5c;
}

.settings-btn:hover {
  background: rgba(255, 255, 255, 0.7);
  border-color: rgba(0, 0, 0, 0.18);
}

.project-content {
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  overflow: hidden;
  flex: 1;
}

.content-tabs {
  display: flex;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.2);
}

.tab-button {
  flex: 1;
  padding: 14px 16px;
  border: none;
  background: none;
  color: #7a7a7c;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  border-bottom: 2px solid transparent;
}

.tab-button:hover:not(:disabled) {
  color: #5a6a5e;
  background: rgba(100, 140, 120, 0.05);
}

.tab-button.active {
  color: #4a6a52;
  border-bottom-color: #6a9a7a;
  background: rgba(100, 140, 120, 0.08);
}

.tab-button:disabled {
  color: #b0b0b2;
  cursor: not-allowed;
}

.tab-content {
  padding: 20px;
  min-height: 400px;
}

.novels-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.novels-header h3 {
  margin: 0;
  color: #2c2c2e;
  font-size: 16px;
  font-weight: 600;
}

.add-novel-btn {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 14px;
  border: none;
  border-radius: 6px;
  background: rgba(100, 140, 120, 0.2);
  color: #3a5a42;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease;
}

.add-novel-btn:hover {
  background: rgba(100, 140, 120, 0.3);
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: #8a8a8c;
}

.loading-spinner,
.empty-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.loading-state p,
.empty-state p {
  margin: 0 0 20px 0;
  color: #7a7a7c;
  font-size: 14px;
}

.novels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.novel-card {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.15s ease;
}

.novel-card:hover {
  border-color: rgba(100, 140, 120, 0.3);
  background: rgba(255, 255, 255, 0.6);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.novel-card.selected {
  border-color: rgba(100, 140, 120, 0.4);
  background: rgba(100, 160, 130, 0.1);
}

.novel-info {
  margin-bottom: 12px;
}

.novel-title {
  margin: 0 0 6px 0;
  color: #2c2c2e;
  font-size: 15px;
  font-weight: 600;
}

.novel-author {
  margin: 0 0 8px 0;
  color: #7a7a7c;
  font-size: 12px;
}

.novel-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.word-count {
  font-size: 12px;
  color: #8a8a8c;
}

.status-badge {
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}

.status-importing {
  background: rgba(200, 160, 80, 0.15);
  color: #8a6a30;
}

.status-analyzing {
  background: rgba(100, 140, 180, 0.15);
  color: #4a6a8a;
}

.status-analyzed {
  background: rgba(100, 160, 130, 0.15);
  color: #4a7a5a;
}

.status-processing {
  background: rgba(200, 160, 80, 0.15);
  color: #8a6a30;
}

.status-completed {
  background: rgba(100, 160, 130, 0.2);
  color: #3a6a4a;
}

.status-failed {
  background: rgba(200, 100, 100, 0.15);
  color: #8a4a4a;
}

.novel-date {
  margin: 0;
  font-size: 11px;
  color: #a0a0a2;
}

.novel-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.novel-actions .action-btn {
  padding: 6px 10px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 6px;
}

.novel-actions .action-btn:hover {
  background: rgba(255, 255, 255, 0.8);
}

.view-btn:hover {
  border-color: rgba(100, 140, 180, 0.3);
}

.edit-btn:hover {
  border-color: rgba(200, 160, 80, 0.3);
}

.delete-btn:hover {
  border-color: rgba(200, 100, 100, 0.3);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.import-modal {
  background: #f5f5f0;
  border-radius: 12px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
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
  background: rgba(100, 160, 130, 0.15);
  border: 1px solid rgba(100, 160, 130, 0.3);
  color: #3a6a4a;
}

.error-message {
  background: rgba(200, 100, 100, 0.15);
  border: 1px solid rgba(200, 100, 100, 0.3);
  color: #8a4a4a;
}

.success-message p,
.error-message p {
  margin: 0;
  font-size: 13px;
}

.close-message {
  padding: 4px 8px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: inherit;
  opacity: 0.7;
}

.close-message:hover {
  opacity: 1;
}
</style>