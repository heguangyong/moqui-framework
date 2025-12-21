<template>
  <div class="scene-editor">
    <div class="editor-header">
      <h3>场景管理</h3>
      <div class="editor-controls">
        <div class="filter-controls">
          <select v-model="filters.status" @change="loadScenes">
            <option value="">所有状态</option>
            <option value="pending">待审批</option>
            <option value="approved">已审批</option>
            <option value="rejected">已拒绝</option>
          </select>
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="filters.showEnhanced" 
              @change="loadScenes"
            />
            显示已增强
          </label>
        </div>
        <button class="enhance-btn" @click="enhanceScenes" :disabled="isEnhancing">
          <span v-if="isEnhancing">⏳</span>
          {{ isEnhancing ? '增强中...' : 'AI场景增强' }}
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner">⏳</div>
      <p>加载场景中...</p>
    </div>

    <div v-else-if="scenes.length === 0" class="empty-state">
      <div class="empty-icon">🎬</div>
      <p>暂无场景数据</p>
      <button class="enhance-btn" @click="enhanceScenes">
        开始场景增强
      </button>
    </div>

    <div v-else class="scenes-grid">
      <div 
        v-for="scene in scenes" 
        :key="scene.sceneId"
        class="scene-card"
        :class="{ 'approved': scene.approvalStatus === 'approved' }"
        @click="selectScene(scene)"
      >
        <div class="scene-thumbnail">
          <div class="thumbnail-placeholder">
            🎭
          </div>
          <div v-if="scene.approvalStatus" class="approval-indicator">
            <span v-if="scene.approvalStatus === 'approved'">✅</span>
            <span v-else-if="scene.approvalStatus === 'rejected'">❌</span>
            <span v-else>⏳</span>
          </div>
        </div>

        <div class="scene-info">
          <h4 class="scene-title">{{ scene.title || `场景 ${scene.sceneNumber}` }}</h4>
          <div class="scene-meta">
            <span class="chapter-info">第{{ scene.chapterNumber }}章</span>
            <span class="scene-number">场景{{ scene.sceneNumber }}</span>
          </div>
          <div class="scene-stats">
            <span class="word-count">{{ scene.wordCount }} 字</span>
            <span class="confidence">置信度: {{ Math.round((scene.analysisConfidence || 0) * 100) }}%</span>
          </div>
          <p v-if="scene.setting" class="scene-setting">
            {{ truncateText(scene.setting, 50) }}
          </p>
        </div>

        <div class="scene-actions">
          <button 
            class="action-btn edit-btn"
            @click.stop="editScene(scene)"
            title="编辑场景"
          >
            ✏️
          </button>
          <button 
            class="action-btn approve-btn"
            @click.stop="approveScene(scene)"
            :title="scene.approvalStatus === 'approved' ? '取消审批' : '审批场景'"
          >
            {{ scene.approvalStatus === 'approved' ? '🔄' : '✅' }}
          </button>
          <button 
            class="action-btn reanalyze-btn"
            @click.stop="reanalyzeScene(scene)"
            title="重新分析"
          >
            🔍
          </button>
        </div>
      </div>
    </div>

    <!-- Scene Detail Modal -->
    <div v-if="selectedScene" class="modal-overlay" @click="closeModal">
      <div class="scene-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedScene.title || `场景 ${selectedScene.sceneNumber}` }}</h3>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>

        <div class="modal-content">
          <div class="scene-details">
            <div class="detail-section">
              <h4>基本信息</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">章节:</span>
                  <span class="detail-value">第{{ selectedScene.chapterNumber }}章</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">场景序号:</span>
                  <span class="detail-value">{{ selectedScene.sceneNumber }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">字数:</span>
                  <span class="detail-value">{{ selectedScene.wordCount }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">审批状态:</span>
                  <span class="detail-value">{{ getApprovalText(selectedScene.approvalStatus) }}</span>
                </div>
              </div>
            </div>

            <div v-if="selectedScene.setting" class="detail-section">
              <h4>场景设定</h4>
              <p class="setting-text">{{ selectedScene.setting }}</p>
            </div>

            <div v-if="selectedScene.mood" class="detail-section">
              <h4>情绪氛围</h4>
              <p class="mood-text">{{ selectedScene.mood }}</p>
            </div>

            <div v-if="selectedScene.visualElements" class="detail-section">
              <h4>视觉元素</h4>
              <p class="visual-text">{{ selectedScene.visualElements }}</p>
            </div>

            <div v-if="selectedScene.content" class="detail-section">
              <h4>场景内容</h4>
              <div class="content-text">{{ selectedScene.content }}</div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="edit-btn" @click="editScene(selectedScene)">
            编辑场景
          </button>
          <button 
            class="approve-btn"
            @click="approveScene(selectedScene)"
          >
            {{ selectedScene.approvalStatus === 'approved' ? '取消审批' : '审批场景' }}
          </button>
          <button class="reanalyze-btn" @click="reanalyzeScene(selectedScene)">
            重新分析
          </button>
        </div>
      </div>
    </div>

    <!-- Scene Edit Modal -->
    <div v-if="editingScene" class="modal-overlay" @click="closeEditModal">
      <div class="edit-modal" @click.stop>
        <div class="modal-header">
          <h3>编辑场景</h3>
          <button class="close-btn" @click="closeEditModal">✕</button>
        </div>

        <div class="modal-content">
          <form @submit.prevent="saveScene">
            <div class="form-group">
              <label for="edit-title">场景标题</label>
              <input
                id="edit-title"
                v-model="editForm.title"
                type="text"
                placeholder="留空将自动生成"
              />
            </div>

            <div class="form-group">
              <label for="edit-setting">场景设定 *</label>
              <textarea
                id="edit-setting"
                v-model="editForm.setting"
                rows="3"
                required
                placeholder="描述场景的时间、地点、环境等"
              ></textarea>
            </div>

            <div class="form-group">
              <label for="edit-mood">情绪氛围</label>
              <textarea
                id="edit-mood"
                v-model="editForm.mood"
                rows="2"
                placeholder="描述场景的情绪氛围和基调"
              ></textarea>
            </div>

            <div class="form-group">
              <label for="edit-visual">视觉元素</label>
              <textarea
                id="edit-visual"
                v-model="editForm.visualElements"
                rows="3"
                placeholder="描述重要的视觉元素、构图建议等"
              ></textarea>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { sceneApi } from '../../services'

// Props
interface Props {
  novelId: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  sceneSelected: [scene: any]
  sceneUpdated: [scene: any]
  sceneApproved: [scene: any]
}>()

// Reactive data
const scenes = ref<any[]>([])
const isLoading = ref(false)
const isEnhancing = ref(false)
const isSaving = ref(false)
const selectedScene = ref<any>(null)
const editingScene = ref<any>(null)

const filters = reactive({
  status: '',
  showEnhanced: false
})

const editForm = reactive({
  title: '',
  setting: '',
  mood: '',
  visualElements: ''
})

// Methods
const loadScenes = async () => {
  isLoading.value = true
  
  try {
    const filterParams: any = {}
    if (filters.status) filterParams.approvalStatus = filters.status
    if (!filters.showEnhanced) filterParams.hasVisualElements = false
    
    const result = await sceneApi.getScenes(props.novelId, filterParams)
    
    if (result.success) {
      scenes.value = result.scenes || []
    } else {
      console.error('Failed to load scenes:', result.message)
    }
  } catch (error) {
    console.error('Failed to load scenes:', error)
  } finally {
    isLoading.value = false
  }
}

const enhanceScenes = async () => {
  isEnhancing.value = true
  
  try {
    const result = await sceneApi.enhanceScenes(props.novelId)
    
    if (result.success) {
      await loadScenes()
    } else {
      console.error('Failed to enhance scenes:', result.message)
    }
  } catch (error) {
    console.error('Failed to enhance scenes:', error)
  } finally {
    isEnhancing.value = false
  }
}

const selectScene = (scene: any) => {
  selectedScene.value = scene
  emit('sceneSelected', scene)
}

const closeModal = () => {
  selectedScene.value = null
}

const editScene = (scene: any) => {
  editingScene.value = scene
  editForm.title = scene.title || ''
  editForm.setting = scene.setting || ''
  editForm.mood = scene.mood || ''
  editForm.visualElements = scene.visualElements || ''
  
  // Close detail modal if open
  selectedScene.value = null
}

const closeEditModal = () => {
  editingScene.value = null
  Object.assign(editForm, {
    title: '',
    setting: '',
    mood: '',
    visualElements: ''
  })
}

const saveScene = async () => {
  if (!editingScene.value) return
  
  isSaving.value = true
  
  try {
    const result = await sceneApi.updateScene(
      editingScene.value.sceneId,
      {
        title: editForm.title || undefined,
        setting: editForm.setting,
        mood: editForm.mood || undefined,
        visualElements: editForm.visualElements || undefined
      }
    )
    
    if (result.success) {
      // Update local scene data
      const index = scenes.value.findIndex(
        s => s.sceneId === editingScene.value.sceneId
      )
      if (index !== -1) {
        Object.assign(scenes.value[index], {
          title: editForm.title,
          setting: editForm.setting,
          mood: editForm.mood,
          visualElements: editForm.visualElements
        })
      }
      
      emit('sceneUpdated', scenes.value[index])
      closeEditModal()
    } else {
      console.error('Failed to save scene:', result.message)
    }
  } catch (error) {
    console.error('Failed to save scene:', error)
  } finally {
    isSaving.value = false
  }
}

const approveScene = async (scene: any) => {
  try {
    const newStatus = scene.approvalStatus === 'approved' ? 'pending' : 'approved'
    const result = await sceneApi.approveScene(scene.sceneId, newStatus)
    
    if (result.success) {
      scene.approvalStatus = newStatus
      
      // Update selected scene if it's the same
      if (selectedScene.value?.sceneId === scene.sceneId) {
        selectedScene.value.approvalStatus = newStatus
      }
      
      emit('sceneApproved', scene)
    } else {
      console.error('Failed to approve scene:', result.message)
    }
  } catch (error) {
    console.error('Failed to approve scene:', error)
  }
}

const reanalyzeScene = async (scene: any) => {
  try {
    const result = await sceneApi.reanalyzeScene(scene.sceneId)
    
    if (result.success) {
      await loadScenes()
    } else {
      console.error('Failed to reanalyze scene:', result.message)
    }
  } catch (error) {
    console.error('Failed to reanalyze scene:', error)
  }
}

const getApprovalText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待审批',
    approved: '已审批',
    rejected: '已拒绝'
  }
  return statusMap[status] || status
}

const truncateText = (text: string, maxLength: number) => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Lifecycle
onMounted(() => {
  loadScenes()
})
</script>

<style scoped>
.scene-editor {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ecf0f1;
}

.editor-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
}

.editor-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-controls select {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #7f8c8d;
  cursor: pointer;
}

.enhance-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: #9b59b6;
  color: white;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.enhance-btn:hover:not(:disabled) {
  background: #8e44ad;
}

.enhance-btn:disabled {
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

.scenes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.scene-card {
  border: 1px solid #ecf0f1;
  border-radius: 8px;
  padding: 16px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.scene-card:hover {
  border-color: #9b59b6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.scene-card.approved {
  border-color: #27ae60;
  background: #f0fff4;
}

.scene-thumbnail {
  position: relative;
  margin-bottom: 12px;
  text-align: center;
}

.thumbnail-placeholder {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin: 0 auto;
}

.approval-indicator {
  position: absolute;
  top: -4px;
  right: -4px;
  font-size: 16px;
}

.scene-info {
  margin-bottom: 12px;
}

.scene-title {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.scene-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 11px;
  color: #7f8c8d;
}

.scene-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 11px;
  color: #7f8c8d;
}

.scene-setting {
  margin: 0;
  font-size: 12px;
  color: #7f8c8d;
  line-height: 1.4;
}

.scene-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.action-btn {
  padding: 4px 8px;
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

.approve-btn:hover {
  background: #27ae60;
}

.reanalyze-btn:hover {
  background: #9b59b6;
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

.scene-modal,
.edit-modal {
  background: white;
  border-radius: 12px;
  max-width: 700px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
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

.setting-text,
.mood-text,
.visual-text {
  margin: 0;
  color: #2c3e50;
  font-size: 14px;
  line-height: 1.5;
}

.content-text {
  max-height: 200px;
  overflow-y: auto;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.5;
  color: #2c3e50;
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

.modal-actions .approve-btn {
  background: #27ae60;
  color: white;
}

.modal-actions .approve-btn:hover {
  background: #229954;
}

.modal-actions .reanalyze-btn {
  background: #9b59b6;
  color: white;
}

.modal-actions .reanalyze-btn:hover {
  background: #8e44ad;
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
  border-color: #9b59b6;
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