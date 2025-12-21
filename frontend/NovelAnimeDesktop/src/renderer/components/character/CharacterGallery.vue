<template>
  <div class="character-gallery">
    <div class="gallery-header">
      <h3>角色画廊</h3>
      <div class="gallery-controls">
        <div class="filter-controls">
          <select v-model="filters.role" @change="loadCharacters">
            <option value="">所有角色</option>
            <option value="protagonist">主角</option>
            <option value="supporting">配角</option>
            <option value="minor">次要角色</option>
            <option value="antagonist">反派</option>
          </select>
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="filters.showLocked" 
              @change="loadCharacters"
            />
            显示已锁定
          </label>
        </div>
        <button class="extract-btn" @click="extractCharacters" :disabled="isExtracting">
          <span v-if="isExtracting">⏳</span>
          {{ isExtracting ? '提取中...' : '提取角色' }}
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner">⏳</div>
      <p>加载角色中...</p>
    </div>

    <div v-else-if="characters.length === 0" class="empty-state">
      <div class="empty-icon">👥</div>
      <p>暂无角色数据</p>
      <button class="extract-btn" @click="extractCharacters">
        开始提取角色
      </button>
    </div>

    <div v-else class="characters-grid">
      <div 
        v-for="character in characters" 
        :key="character.characterId"
        class="character-card"
        :class="{ 'locked': character.isLocked }"
        @click="selectCharacter(character)"
      >
        <div class="character-avatar">
          <div class="avatar-placeholder">
            {{ character.name.charAt(0) }}
          </div>
          <div v-if="character.isLocked" class="lock-indicator">🔒</div>
        </div>

        <div class="character-info">
          <h4 class="character-name">{{ character.name }}</h4>
          <div class="character-role">
            <span class="role-badge" :class="`role-${character.role}`">
              {{ getRoleText(character.role) }}
            </span>
          </div>
          <div class="character-stats">
            <span class="mention-count">提及: {{ character.mentionCount }}次</span>
            <span class="confidence">置信度: {{ Math.round(character.extractionConfidence * 100) }}%</span>
          </div>
          <p v-if="character.description" class="character-description">
            {{ truncateText(character.description, 60) }}
          </p>
        </div>

        <div class="character-actions">
          <button 
            class="action-btn edit-btn"
            @click.stop="editCharacter(character)"
            title="编辑角色"
          >
            ✏️
          </button>
          <button 
            class="action-btn lock-btn"
            @click.stop="toggleLock(character)"
            :title="character.isLocked ? '解锁角色' : '锁定角色'"
          >
            {{ character.isLocked ? '🔓' : '🔒' }}
          </button>
          <button 
            class="action-btn delete-btn"
            @click.stop="deleteCharacter(character)"
            title="删除角色"
            :disabled="character.isLocked"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- Character Detail Modal -->
    <div v-if="selectedCharacter" class="modal-overlay" @click="closeModal">
      <div class="character-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedCharacter.name }}</h3>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>

        <div class="modal-content">
          <div class="character-details">
            <div class="detail-section">
              <h4>基本信息</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">角色类型:</span>
                  <span class="detail-value">{{ getRoleText(selectedCharacter.role) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">提及次数:</span>
                  <span class="detail-value">{{ selectedCharacter.mentionCount }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">提取置信度:</span>
                  <span class="detail-value">{{ Math.round(selectedCharacter.extractionConfidence * 100) }}%</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">状态:</span>
                  <span class="detail-value">{{ selectedCharacter.isLocked ? '已锁定' : '可编辑' }}</span>
                </div>
              </div>
            </div>

            <div v-if="selectedCharacter.description" class="detail-section">
              <h4>角色描述</h4>
              <p class="description-text">{{ selectedCharacter.description }}</p>
            </div>

            <div v-if="selectedCharacter.appearance" class="detail-section">
              <h4>外貌特征</h4>
              <p class="appearance-text">{{ selectedCharacter.appearance }}</p>
            </div>

            <div v-if="selectedCharacter.personality" class="detail-section">
              <h4>性格特点</h4>
              <p class="personality-text">{{ selectedCharacter.personality }}</p>
            </div>

            <div v-if="selectedCharacter.relationships && selectedCharacter.relationships.length > 0" class="detail-section">
              <h4>角色关系</h4>
              <div class="relationships-list">
                <div 
                  v-for="rel in selectedCharacter.relationships" 
                  :key="rel.relatedCharacterId"
                  class="relationship-item"
                >
                  <span class="related-character">{{ rel.relatedCharacterName }}</span>
                  <span class="relationship-type">{{ rel.relationshipType }}</span>
                  <p v-if="rel.description" class="relationship-desc">{{ rel.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="edit-btn" @click="editCharacter(selectedCharacter)">
            编辑角色
          </button>
          <button 
            class="lock-btn"
            @click="toggleLock(selectedCharacter)"
          >
            {{ selectedCharacter.isLocked ? '解锁角色' : '锁定角色' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Character Edit Modal -->
    <div v-if="editingCharacter" class="modal-overlay" @click="closeEditModal">
      <div class="edit-modal" @click.stop>
        <div class="modal-header">
          <h3>编辑角色</h3>
          <button class="close-btn" @click="closeEditModal">✕</button>
        </div>

        <div class="modal-content">
          <form @submit.prevent="saveCharacter">
            <div class="form-group">
              <label for="edit-name">角色名称 *</label>
              <input
                id="edit-name"
                v-model="editForm.name"
                type="text"
                required
                :disabled="editingCharacter.isLocked"
              />
            </div>

            <div class="form-group">
              <label for="edit-role">角色类型</label>
              <select 
                id="edit-role" 
                v-model="editForm.role"
                :disabled="editingCharacter.isLocked"
              >
                <option value="protagonist">主角</option>
                <option value="supporting">配角</option>
                <option value="minor">次要角色</option>
                <option value="antagonist">反派</option>
              </select>
            </div>

            <div class="form-group">
              <label for="edit-description">角色描述</label>
              <textarea
                id="edit-description"
                v-model="editForm.description"
                rows="3"
                :disabled="editingCharacter.isLocked"
              ></textarea>
            </div>

            <div class="form-group">
              <label for="edit-appearance">外貌特征</label>
              <textarea
                id="edit-appearance"
                v-model="editForm.appearance"
                rows="3"
                :disabled="editingCharacter.isLocked"
              ></textarea>
            </div>

            <div class="form-group">
              <label for="edit-personality">性格特点</label>
              <textarea
                id="edit-personality"
                v-model="editForm.personality"
                rows="3"
                :disabled="editingCharacter.isLocked"
              ></textarea>
            </div>

            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="closeEditModal">
                取消
              </button>
              <button 
                type="submit" 
                class="save-btn"
                :disabled="editingCharacter.isLocked || isSaving"
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
import { characterApi } from '../../services'

// Props
interface Props {
  novelId: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  characterSelected: [character: any]
  characterUpdated: [character: any]
  characterDeleted: [characterId: string]
}>()

// Reactive data
const characters = ref<any[]>([])
const isLoading = ref(false)
const isExtracting = ref(false)
const isSaving = ref(false)
const selectedCharacter = ref<any>(null)
const editingCharacter = ref<any>(null)

const filters = reactive({
  role: '',
  showLocked: false
})

const editForm = reactive({
  name: '',
  role: 'minor',
  description: '',
  appearance: '',
  personality: ''
})

// Methods
const loadCharacters = async () => {
  isLoading.value = true
  
  try {
    const filterParams: any = {}
    if (filters.role) filterParams.role = filters.role
    if (!filters.showLocked) filterParams.isLocked = false
    
    const result = await characterApi.getCharacters(props.novelId, filterParams)
    
    if (result.success) {
      characters.value = result.characters || []
    } else {
      console.error('Failed to load characters:', result.message)
    }
  } catch (error) {
    console.error('Failed to load characters:', error)
  } finally {
    isLoading.value = false
  }
}

const extractCharacters = async () => {
  isExtracting.value = true
  
  try {
    const result = await characterApi.extractCharacters(props.novelId)
    
    if (result.success) {
      await loadCharacters()
    } else {
      console.error('Failed to extract characters:', result.message)
    }
  } catch (error) {
    console.error('Failed to extract characters:', error)
  } finally {
    isExtracting.value = false
  }
}

const selectCharacter = (character: any) => {
  selectedCharacter.value = character
  emit('characterSelected', character)
}

const closeModal = () => {
  selectedCharacter.value = null
}

const editCharacter = (character: any) => {
  editingCharacter.value = character
  editForm.name = character.name
  editForm.role = character.role
  editForm.description = character.description || ''
  editForm.appearance = character.appearance || ''
  editForm.personality = character.personality || ''
  
  // Close detail modal if open
  selectedCharacter.value = null
}

const closeEditModal = () => {
  editingCharacter.value = null
  Object.assign(editForm, {
    name: '',
    role: 'minor',
    description: '',
    appearance: '',
    personality: ''
  })
}

const saveCharacter = async () => {
  if (!editingCharacter.value) return
  
  isSaving.value = true
  
  try {
    const result = await characterApi.updateCharacter(
      editingCharacter.value.characterId,
      {
        name: editForm.name,
        role: editForm.role,
        description: editForm.description,
        appearance: editForm.appearance,
        personality: editForm.personality
      }
    )
    
    if (result.success) {
      // Update local character data
      const index = characters.value.findIndex(
        c => c.characterId === editingCharacter.value.characterId
      )
      if (index !== -1) {
        Object.assign(characters.value[index], {
          name: editForm.name,
          role: editForm.role,
          description: editForm.description,
          appearance: editForm.appearance,
          personality: editForm.personality
        })
      }
      
      emit('characterUpdated', characters.value[index])
      closeEditModal()
    } else {
      console.error('Failed to save character:', result.message)
    }
  } catch (error) {
    console.error('Failed to save character:', error)
  } finally {
    isSaving.value = false
  }
}

const toggleLock = async (character: any) => {
  try {
    const result = await characterApi.lockCharacter(
      character.characterId,
      !character.isLocked
    )
    
    if (result.success) {
      character.isLocked = !character.isLocked
      
      // Update selected character if it's the same
      if (selectedCharacter.value?.characterId === character.characterId) {
        selectedCharacter.value.isLocked = character.isLocked
      }
    } else {
      console.error('Failed to toggle lock:', result.message)
    }
  } catch (error) {
    console.error('Failed to toggle lock:', error)
  }
}

const deleteCharacter = async (character: any) => {
  if (character.isLocked) {
    alert('无法删除已锁定的角色')
    return
  }
  
  if (!confirm(`确定要删除角色"${character.name}"吗？此操作不可撤销。`)) {
    return
  }
  
  try {
    const result = await characterApi.deleteCharacter(character.characterId)
    
    if (result.success) {
      characters.value = characters.value.filter(
        c => c.characterId !== character.characterId
      )
      
      // Close modals if the deleted character was selected
      if (selectedCharacter.value?.characterId === character.characterId) {
        selectedCharacter.value = null
      }
      if (editingCharacter.value?.characterId === character.characterId) {
        closeEditModal()
      }
      
      emit('characterDeleted', character.characterId)
    } else {
      console.error('Failed to delete character:', result.message)
    }
  } catch (error) {
    console.error('Failed to delete character:', error)
  }
}

const getRoleText = (role: string) => {
  const roleMap: Record<string, string> = {
    protagonist: '主角',
    supporting: '配角',
    minor: '次要角色',
    antagonist: '反派'
  }
  return roleMap[role] || role
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Lifecycle
onMounted(() => {
  loadCharacters()
})
</script>

<style scoped>
.character-gallery {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ecf0f1;
}

.gallery-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
}

.gallery-controls {
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

.extract-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: #3498db;
  color: white;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.extract-btn:hover:not(:disabled) {
  background: #2980b9;
}

.extract-btn:disabled {
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

.characters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.character-card {
  border: 1px solid #ecf0f1;
  border-radius: 8px;
  padding: 16px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.character-card:hover {
  border-color: #3498db;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.character-card.locked {
  border-color: #f39c12;
  background: #fffbf0;
}

.character-avatar {
  position: relative;
  margin-bottom: 12px;
}

.avatar-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3498db, #2ecc71);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  margin: 0 auto;
}

.lock-indicator {
  position: absolute;
  top: -4px;
  right: -4px;
  font-size: 16px;
}

.character-info {
  margin-bottom: 12px;
}

.character-name {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
}

.character-role {
  text-align: center;
  margin-bottom: 8px;
}

.role-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
}

.role-protagonist {
  background: #e8f5e8;
  color: #27ae60;
}

.role-supporting {
  background: #e3f2fd;
  color: #3498db;
}

.role-minor {
  background: #f5f5f5;
  color: #7f8c8d;
}

.role-antagonist {
  background: #fdf2f2;
  color: #e74c3c;
}

.character-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 11px;
  color: #7f8c8d;
}

.character-description {
  margin: 0;
  font-size: 12px;
  color: #7f8c8d;
  line-height: 1.4;
}

.character-actions {
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

.action-btn:hover:not(:disabled) {
  background: #d5dbdb;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.edit-btn:hover {
  background: #3498db;
}

.lock-btn:hover {
  background: #f39c12;
}

.delete-btn:hover:not(:disabled) {
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

.character-modal,
.edit-modal {
  background: white;
  border-radius: 12px;
  max-width: 600px;
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

.description-text,
.appearance-text,
.personality-text {
  margin: 0;
  color: #2c3e50;
  font-size: 14px;
  line-height: 1.5;
}

.relationships-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.relationship-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.related-character {
  font-weight: 500;
  color: #2c3e50;
  margin-right: 8px;
}

.relationship-type {
  font-size: 12px;
  color: #7f8c8d;
  background: #ecf0f1;
  padding: 2px 6px;
  border-radius: 4px;
}

.relationship-desc {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: #7f8c8d;
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
  background: #3498db;
  color: white;
}

.modal-actions .edit-btn:hover {
  background: #2980b9;
}

.modal-actions .lock-btn {
  background: #f39c12;
  color: white;
}

.modal-actions .lock-btn:hover {
  background: #e67e22;
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
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3498db;
}

.form-group input:disabled,
.form-group select:disabled,
.form-group textarea:disabled {
  background: #f8f9fa;
  color: #6c757d;
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