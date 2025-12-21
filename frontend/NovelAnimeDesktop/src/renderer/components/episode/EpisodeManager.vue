<template>
  <div class="episode-manager">
    <div class="manager-header">
      <h3>集数管理</h3>
      <div class="manager-controls">
        <div class="stats-info">
          <span class="stat-item">
            <strong>总集数:</strong> {{ episodes.length }}
          </span>
          <span class="stat-item">
            <strong>总时长:</strong> {{ totalDuration }}分钟
          </span>
        </div>
        <button class="generate-btn" @click="generateEpisodes" :disabled="isGenerating">
          <span v-if="isGenerating">⏳</span>
          {{ isGenerating ? '生成中...' : '生成集数' }}
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner">⏳</div>
      <p>加载集数中...</p>
    </div>

    <div v-else-if="episodes.length === 0" class="empty-state">
      <div class="empty-icon">📺</div>
      <p>暂无集数数据</p>
      <button class="generate-btn" @click="generateEpisodes">
        开始生成集数
      </button>
    </div>

    <div v-else class="episodes-list">
      <div 
        v-for="(episode, index) in episodes" 
        :key="episode.episodeId"
        class="episode-card"
        @click="selectEpisode(episode)"
      >
        <div class="episode-header">
          <div class="episode-number">
            第{{ episode.episodeNumber }}集
          </div>
          <div class="episode-duration">
            {{ episode.estimatedDuration }}分钟
          </div>
        </div>

        <div class="episode-content">
          <h4 class="episode-title">{{ episode.title || `第${episode.episodeNumber}集` }}</h4>
          <p v-if="episode.summary" class="episode-summary">
            {{ truncateText(episode.summary, 100) }}
          </p>
          
          <div class="episode-stats">
            <span class="scene-count">{{ episode.sceneCount }} 个场景</span>
            <span class="word-count">{{ episode.wordCount }} 字</span>
          </div>

          <div class="scene-preview">
            <div class="scene-tags">
              <span 
                v-for="scene in episode.scenes?.slice(0, 3)" 
                :key="scene.sceneId"
                class="scene-tag"
              >
                场景{{ scene.sceneNumber }}
              </span>
              <span v-if="episode.scenes?.length > 3" class="more-scenes">
                +{{ episode.scenes.length - 3 }}
              </span>
            </div>
          </div>
        </div>

        <div class="episode-actions">
          <button 
            class="action-btn edit-btn"
            @click.stop="editEpisode(episode)"
            title="编辑集数"
          >
            ✏️
          </button>
          <button 
            class="action-btn script-btn"
            @click.stop="generateScript(episode)"
            title="生成剧本"
          >
            📝
          </button>
          <button 
            class="action-btn boundary-btn"
            @click.stop="adjustBoundaries(episode)"
            title="调整边界"
          >
            ⚡
          </button>
          <button 
            class="action-btn delete-btn"
            @click.stop="deleteEpisode(episode)"
            title="删除集数"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- Episode Detail Modal -->
    <div v-if="selectedEpisode" class="modal-overlay" @click="closeModal">
      <div class="episode-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedEpisode.title || `第${selectedEpisode.episodeNumber}集` }}</h3>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>

        <div class="modal-content">
          <div class="episode-details">
            <div class="detail-section">
              <h4>基本信息</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">集数:</span>
                  <span class="detail-value">第{{ selectedEpisode.episodeNumber }}集</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">预计时长:</span>
                  <span class="detail-value">{{ selectedEpisode.estimatedDuration }}分钟</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">场景数量:</span>
                  <span class="detail-value">{{ selectedEpisode.sceneCount }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">字数:</span>
                  <span class="detail-value">{{ selectedEpisode.wordCount }}</span>
                </div>
              </div>
            </div>

            <div v-if="selectedEpisode.summary" class="detail-section">
              <h4>集数概要</h4>
              <p class="summary-text">{{ selectedEpisode.summary }}</p>
            </div>

            <div v-if="selectedEpisode.scenes?.length" class="detail-section">
              <h4>包含场景</h4>
              <div class="scenes-list">
                <div 
                  v-for="scene in selectedEpisode.scenes" 
                  :key="scene.sceneId"
                  class="scene-item"
                >
                  <div class="scene-info">
                    <span class="scene-number">场景{{ scene.sceneNumber }}</span>
                    <span class="scene-title">{{ scene.title || '未命名场景' }}</span>
                  </div>
                  <div class="scene-meta">
                    <span class="scene-duration">{{ scene.estimatedDuration || 2 }}分钟</span>
                    <span class="scene-words">{{ scene.wordCount }}字</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="selectedEpisode.screenplay" class="detail-section">
              <h4>剧本预览</h4>
              <div class="screenplay-preview">
                {{ truncateText(selectedEpisode.screenplay, 500) }}
              </div>
              <button class="view-full-script-btn" @click="viewFullScript">
                查看完整剧本
              </button>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="edit-btn" @click="editEpisode(selectedEpisode)">
            编辑集数
          </button>
          <button class="script-btn" @click="generateScript(selectedEpisode)">
            生成剧本
          </button>
          <button class="boundary-btn" @click="adjustBoundaries(selectedEpisode)">
            调整边界
          </button>
        </div>
      </div>
    </div>

    <!-- Episode Edit Modal -->
    <div v-if="editingEpisode" class="modal-overlay" @click="closeEditModal">
      <div class="edit-modal" @click.stop>
        <div class="modal-header">
          <h3>编辑集数</h3>
          <button class="close-btn" @click="closeEditModal">✕</button>
        </div>

        <div class="modal-content">
          <form @submit.prevent="saveEpisode">
            <div class="form-group">
              <label for="edit-title">集数标题</label>
              <input
                id="edit-title"
                v-model="editForm.title"
                type="text"
                placeholder="留空将自动生成"
              />
            </div>

            <div class="form-group">
              <label for="edit-summary">集数概要</label>
              <textarea
                id="edit-summary"
                v-model="editForm.summary"
                rows="4"
                placeholder="描述这一集的主要内容和情节发展"
              ></textarea>
            </div>

            <div class="form-group">
              <label for="edit-duration">预计时长（分钟）</label>
              <input
                id="edit-duration"
                v-model.number="editForm.estimatedDuration"
                type="number"
                min="1"
                max="60"
                placeholder="20"
              />
            </div>

            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="closeEditModal">
                取消
              </button>
              <button 
                type="submit" 
                class="save-btn"
                :disabled="isSaving"
              >
                {{ isSaving ? '保存中...' : '保存' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Script Viewer Modal -->
    <div v-if="showScriptViewer" class="modal-overlay" @click="closeScriptViewer">
      <div class="script-modal" @click.stop>
        <div class="modal-header">
          <h3>剧本 - {{ scriptEpisode?.title || `第${scriptEpisode?.episodeNumber}集` }}</h3>
          <button class="close-btn" @click="closeScriptViewer">✕</button>
        </div>

        <div class="modal-content">
          <div class="script-content">
            <pre>{{ scriptEpisode?.screenplay || '暂无剧本内容' }}</pre>
          </div>
        </div>

        <div class="modal-actions">
          <button class="export-btn" @click="exportScript">
            导出剧本
          </button>
          <button class="regenerate-btn" @click="regenerateScript">
            重新生成
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { episodeApi } from '../../services'

// Props
interface Props {
  novelId: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  episodeSelected: [episode: any]
  episodeUpdated: [episode: any]
  episodeDeleted: [episodeId: string]
}>()

// Reactive data
const episodes = ref<any[]>([])
const isLoading = ref(false)
const isGenerating = ref(false)
const isSaving = ref(false)
const selectedEpisode = ref<any>(null)
const editingEpisode = ref<any>(null)
const showScriptViewer = ref(false)
const scriptEpisode = ref<any>(null)

const editForm = reactive({
  title: '',
  summary: '',
  estimatedDuration: 20
})

// Computed
const totalDuration = computed(() => {
  return episodes.value.reduce((total, episode) => total + (episode.estimatedDuration || 0), 0)
})

// Methods
const loadEpisodes = async () => {
  isLoading.value = true
  
  try {
    const result = await episodeApi.getEpisodes(props.novelId)
    
    if (result.success) {
      episodes.value = result.episodes || []
    } else {
      console.error('Failed to load episodes:', result.message)
    }
  } catch (error) {
    console.error('Failed to load episodes:', error)
  } finally {
    isLoading.value = false
  }
}

const generateEpisodes = async () => {
  isGenerating.value = true
  
  try {
    const result = await episodeApi.generateEpisodes(props.novelId)
    
    if (result.success) {
      await loadEpisodes()
    } else {
      console.error('Failed to generate episodes:', result.message)
    }
  } catch (error) {
    console.error('Failed to generate episodes:', error)
  } finally {
    isGenerating.value = false
  }
}

const selectEpisode = (episode: any) => {
  selectedEpisode.value = episode
  emit('episodeSelected', episode)
}

const closeModal = () => {
  selectedEpisode.value = null
}

const editEpisode = (episode: any) => {
  editingEpisode.value = episode
  editForm.title = episode.title || ''
  editForm.summary = episode.summary || ''
  editForm.estimatedDuration = episode.estimatedDuration || 20
  
  // Close detail modal if open
  selectedEpisode.value = null
}

const closeEditModal = () => {
  editingEpisode.value = null
  Object.assign(editForm, {
    title: '',
    summary: '',
    estimatedDuration: 20
  })
}

const saveEpisode = async () => {
  if (!editingEpisode.value) return
  
  isSaving.value = true
  
  try {
    const result = await episodeApi.updateEpisode(
      editingEpisode.value.episodeId,
      {
        title: editForm.title || undefined,
        summary: editForm.summary || undefined,
        estimatedDuration: editForm.estimatedDuration
      }
    )
    
    if (result.success) {
      // Update local episode data
      const index = episodes.value.findIndex(
        e => e.episodeId === editingEpisode.value.episodeId
      )
      if (index !== -1) {
        Object.assign(episodes.value[index], {
          title: editForm.title,
          summary: editForm.summary,
          estimatedDuration: editForm.estimatedDuration
        })
      }
      
      emit('episodeUpdated', episodes.value[index])
      closeEditModal()
    } else {
      console.error('Failed to save episode:', result.message)
    }
  } catch (error) {
    console.error('Failed to save episode:', error)
  } finally {
    isSaving.value = false
  }
}

const generateScript = async (episode: any) => {
  try {
    const result = await episodeApi.generateScreenplay(episode.episodeId)
    
    if (result.success) {
      episode.screenplay = result.screenplay
      
      // Update selected episode if it's the same
      if (selectedEpisode.value?.episodeId === episode.episodeId) {
        selectedEpisode.value.screenplay = result.screenplay
      }
    } else {
      console.error('Failed to generate script:', result.message)
    }
  } catch (error) {
    console.error('Failed to generate script:', error)
  }
}

const adjustBoundaries = async (episode: any) => {
  try {
    // This would open a boundary adjustment interface
    console.log('Adjust boundaries for episode:', episode.episodeId)
    
    // For now, just reload episodes
    await loadEpisodes()
  } catch (error) {
    console.error('Failed to adjust boundaries:', error)
  }
}

const deleteEpisode = async (episode: any) => {
  if (!confirm(`确定要删除第${episode.episodeNumber}集吗？此操作不可撤销。`)) {
    return
  }
  
  try {
    const result = await episodeApi.deleteEpisode(episode.episodeId)
    
    if (result.success) {
      episodes.value = episodes.value.filter(
        e => e.episodeId !== episode.episodeId
      )
      
      // Close modals if the deleted episode was selected
      if (selectedEpisode.value?.episodeId === episode.episodeId) {
        selectedEpisode.value = null
      }
      if (editingEpisode.value?.episodeId === episode.episodeId) {
        closeEditModal()
      }
      
      emit('episodeDeleted', episode.episodeId)
    } else {
      console.error('Failed to delete episode:', result.message)
    }
  } catch (error) {
    console.error('Failed to delete episode:', error)
  }
}

const viewFullScript = () => {
  scriptEpisode.value = selectedEpisode.value
  showScriptViewer.value = true
  selectedEpisode.value = null
}

const closeScriptViewer = () => {
  showScriptViewer.value = false
  scriptEpisode.value = null
}

const exportScript = () => {
  if (!scriptEpisode.value?.screenplay) return
  
  const blob = new Blob([scriptEpisode.value.screenplay], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `第${scriptEpisode.value.episodeNumber}集剧本.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const regenerateScript = async () => {
  if (!scriptEpisode.value) return
  
  await generateScript(scriptEpisode.value)
}

const truncateText = (text: string, maxLength: number) => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Lifecycle
onMounted(() => {
  loadEpisodes()
})
</script>

<style scoped>
.episode-manager {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ecf0f1;
}

.manager-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
}

.manager-controls {
  display: flex;
  align-items: center;
  gap: 24px;
}

.stats-info {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #7f8c8d;
}

.stat-item strong {
  color: #2c3e50;
}

.generate-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: #e67e22;
  color: white;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.generate-btn:hover:not(:disabled) {
  background: #d35400;
}

.generate-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
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

.episodes-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.episode-card {
  border: 1px solid #ecf0f1;
  border-radius: 8px;
  padding: 20px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.episode-card:hover {
  border-color: #e67e22;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.episode-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.episode-number {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.episode-duration {
  font-size: 12px;
  color: #7f8c8d;
  background: #ecf0f1;
  padding: 4px 8px;
  border-radius: 12px;
}

.episode-content {
  margin-bottom: 16px;
}

.episode-title {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 500;
}

.episode-summary {
  margin: 0 0 12px 0;
  color: #7f8c8d;
  font-size: 14px;
  line-height: 1.4;
}

.episode-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #7f8c8d;
}

.scene-preview {
  margin-bottom: 12px;
}

.scene-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.scene-tag {
  padding: 2px 6px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}

.more-scenes {
  padding: 2px 6px;
  background: #f5f5f5;
  color: #7f8c8d;
  border-radius: 4px;
  font-size: 10px;
}

.episode-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.action-btn {
  padding: 6px 10px;
  border: none;
  border-radius: 4px;
  background: #ecf0f1;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s ease;
}

.action-btn:hover {
  background: #d5dbdb;
}

.edit-btn:hover {
  background: #f39c12;
}

.script-btn:hover {
  background: #3498db;
}

.boundary-btn:hover {
  background: #9b59b6;
}

.delete-btn:hover {
  background: #e74c3c;
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

.episode-modal,
.edit-modal,
.script-modal {
  background: white;
  border-radius: 12px;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.script-modal {
  max-width: 90vw;
  max-height: 90vh;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #ecf0f1;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  padding: 4px 8px;
  border: none;
  background: none;
  color: #7f8c8d;
  cursor: pointer;
  font-size: 16px;
}

.close-btn:hover {
  color: #2c3e50;
}

.modal-content {
  padding: 24px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 14px;
  font-weight: 600;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 11px;
  color: #7f8c8d;
  font-weight: 500;
}

.detail-value {
  font-size: 13px;
  color: #2c3e50;
}

.summary-text {
  margin: 0;
  color: #2c3e50;
  font-size: 14px;
  line-height: 1.5;
}

.scenes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scene-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.scene-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.scene-number {
  font-size: 11px;
  color: #7f8c8d;
  background: #ecf0f1;
  padding: 2px 6px;
  border-radius: 4px;
}

.scene-title {
  font-size: 13px;
  color: #2c3e50;
}

.scene-meta {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: #7f8c8d;
}

.screenplay-preview {
  max-height: 200px;
  overflow-y: auto;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #2c3e50;
  white-space: pre-wrap;
  margin-bottom: 12px;
}

.view-full-script-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: #3498db;
  color: white;
  font-size: 11px;
  cursor: pointer;
}

.view-full-script-btn:hover {
  background: #2980b9;
}

.script-content {
  max-height: 60vh;
  overflow-y: auto;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #2c3e50;
}

.script-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid #ecf0f1;
}

.modal-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.modal-actions .edit-btn {
  background: #f39c12;
  color: white;
}

.modal-actions .edit-btn:hover {
  background: #e67e22;
}

.modal-actions .script-btn {
  background: #3498db;
  color: white;
}

.modal-actions .script-btn:hover {
  background: #2980b9;
}

.modal-actions .boundary-btn {
  background: #9b59b6;
  color: white;
}

.modal-actions .boundary-btn:hover {
  background: #8e44ad;
}

.modal-actions .export-btn {
  background: #27ae60;
  color: white;
}

.modal-actions .export-btn:hover {
  background: #229954;
}

.modal-actions .regenerate-btn {
  background: #e67e22;
  color: white;
}

.modal-actions .regenerate-btn:hover {
  background: #d35400;
}

/* Form Styles */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #2c3e50;
  font-size: 12px;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #e67e22;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.cancel-btn,
.save-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.cancel-btn {
  background: #ecf0f1;
  color: #7f8c8d;
}

.cancel-btn:hover {
  background: #d5dbdb;
}

.save-btn {
  background: #27ae60;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #229954;
}

.save-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}
</style>