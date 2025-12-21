<template>
  <div class="novels-view">
    <!-- 视图头部 -->
    <ViewHeader 
      title="小说管理" 
      subtitle="管理您导入的所有小说"
      :showNewButton="false"
      :showRefreshButton="true"
      @refresh="handleRefresh"
    />
    
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-group">
        <label>状态筛选:</label>
        <select v-model="statusFilter" class="filter-select">
          <option value="">全部状态</option>
          <option value="imported">已导入</option>
          <option value="analyzing">分析中</option>
          <option value="characters_extracted">角色已提取</option>
          <option value="scenes_analyzed">场景已分析</option>
          <option value="episodes_generated">集数已生成</option>
          <option value="completed">已完成</option>
          <option value="failed">失败</option>
        </select>
      </div>
      <div class="filter-group">
        <label>排序:</label>
        <select v-model="sortBy" class="filter-select">
          <option value="createdDate">创建时间</option>
          <option value="title">标题</option>
          <option value="wordCount">字数</option>
          <option value="status">状态</option>
        </select>
      </div>
      <div class="search-group">
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="搜索小说..."
          class="search-input"
        />
      </div>
    </div>
    
    <!-- 小说列表 -->
    <div class="novels-content">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner">⏳</div>
        <span>加载中...</span>
      </div>
      
      <!-- 有小说时显示列表 -->
      <div v-else-if="filteredNovels.length > 0" class="novels-grid">
        <div 
          v-for="novel in filteredNovels" 
          :key="novel.novelId"
          class="novel-card"
          @click="handleOpenNovel(novel)"
        >
          <div class="novel-header">
            <div class="novel-icon">📖</div>
            <div class="novel-status" :class="`novel-status--${novel.status}`">
              {{ getStatusLabel(novel.status) }}
            </div>
          </div>
          <div class="novel-title">{{ novel.title }}</div>
          <div class="novel-author" v-if="novel.author">作者: {{ novel.author }}</div>
          <div class="novel-meta">
            <span class="novel-word-count">
              {{ formatWordCount(novel.wordCount) }} 字
            </span>
            <span class="novel-date">
              {{ formatDate(novel.createdDate) }}
            </span>
          </div>
          <div class="novel-actions">
            <button 
              class="action-btn edit-btn"
              @click.stop="handleEditNovel(novel)"
              title="编辑"
            >
              ✏️
            </button>
            <button 
              class="action-btn delete-btn"
              @click.stop="handleDeleteNovel(novel)"
              title="删除"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
      
      <!-- 无小说时显示空状态 -->
      <EmptyState 
        v-else
        icon="book"
        title="暂无小说"
        description="请先在项目中导入小说"
      />
    </div>
    
    <!-- 小说详情弹窗 -->
    <NovelDetailModal
      v-if="showDetailModal"
      :novel="selectedNovel"
      @close="showDetailModal = false"
      @edit="handleEditFromDetail"
      @delete="handleDeleteFromDetail"
    />
    
    <!-- 编辑弹窗 -->
    <NovelEditModal
      v-if="showEditModal"
      :novel="editingNovel"
      @close="showEditModal = false"
      @save="handleSaveNovel"
    />
    
    <!-- 删除确认弹窗 -->
    <ConfirmDialog
      v-if="showDeleteConfirm"
      title="确认删除"
      :message="`确定要删除小说「${deletingNovel?.title}」吗？此操作将删除所有相关数据，无法恢复。`"
      confirmText="删除"
      confirmType="danger"
      @confirm="confirmDelete"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { novelApi } from '../services'
import ViewHeader from '../components/ui/ViewHeader.vue'
import EmptyState from '../components/ui/EmptyState.vue'
import NovelDetailModal from '../components/novel/NovelDetailModal.vue'
import NovelEditModal from '../components/novel/NovelEditModal.vue'
import ConfirmDialog from '../components/ui/ConfirmDialog.vue'

const router = useRouter()

// 状态
const isLoading = ref(false)
const novels = ref([])
const statusFilter = ref('')
const sortBy = ref('createdDate')
const searchQuery = ref('')

// 弹窗状态
const showDetailModal = ref(false)
const showEditModal = ref(false)
const showDeleteConfirm = ref(false)
const selectedNovel = ref(null)
const editingNovel = ref(null)
const deletingNovel = ref(null)

// 计算属性 - 筛选和排序后的小说列表
const filteredNovels = computed(() => {
  let result = [...novels.value]
  
  // 状态筛选
  if (statusFilter.value) {
    result = result.filter(n => n.status === statusFilter.value)
  }
  
  // 搜索筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(n => 
      n.title.toLowerCase().includes(query) ||
      (n.author && n.author.toLowerCase().includes(query))
    )
  }
  
  // 排序
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'title':
        return a.title.localeCompare(b.title)
      case 'wordCount':
        return (b.wordCount || 0) - (a.wordCount || 0)
      case 'status':
        return a.status.localeCompare(b.status)
      case 'createdDate':
      default:
        return new Date(b.createdDate) - new Date(a.createdDate)
    }
  })
  
  return result
})

// 生命周期
onMounted(() => {
  loadNovels()
})

// 方法
async function loadNovels() {
  isLoading.value = true
  try {
    // 从所有项目加载小说
    const result = await novelApi.listNovels('')
    if (result.success && result.novels) {
      novels.value = result.novels
    }
  } catch (error) {
    console.error('Failed to load novels:', error)
  } finally {
    isLoading.value = false
  }
}

function getStatusLabel(status) {
  const labels = {
    importing: '导入中',
    imported: '已导入',
    analyzing: '分析中',
    characters_extracted: '角色已提取',
    scenes_analyzed: '场景已分析',
    episodes_generated: '集数已生成',
    completed: '已完成',
    failed: '失败'
  }
  return labels[status] || status
}

function formatWordCount(count) {
  if (!count) return '0'
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + '万'
  }
  return count.toLocaleString()
}

function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN')
}

function handleRefresh() {
  loadNovels()
}

function handleOpenNovel(novel) {
  selectedNovel.value = novel
  showDetailModal.value = true
}

function handleEditNovel(novel) {
  editingNovel.value = { ...novel }
  showEditModal.value = true
}

function handleEditFromDetail() {
  editingNovel.value = { ...selectedNovel.value }
  showDetailModal.value = false
  showEditModal.value = true
}

function handleDeleteNovel(novel) {
  deletingNovel.value = novel
  showDeleteConfirm.value = true
}

function handleDeleteFromDetail() {
  deletingNovel.value = selectedNovel.value
  showDetailModal.value = false
  showDeleteConfirm.value = true
}

async function handleSaveNovel(updates) {
  try {
    const result = await novelApi.updateNovel(editingNovel.value.novelId, updates)
    if (result.success) {
      // 更新本地数据
      const index = novels.value.findIndex(n => n.novelId === editingNovel.value.novelId)
      if (index !== -1) {
        novels.value[index] = { ...novels.value[index], ...updates }
      }
      showEditModal.value = false
    }
  } catch (error) {
    console.error('Failed to save novel:', error)
  }
}

async function confirmDelete() {
  try {
    const result = await novelApi.deleteNovel(deletingNovel.value.novelId)
    if (result.success) {
      novels.value = novels.value.filter(n => n.novelId !== deletingNovel.value.novelId)
      showDeleteConfirm.value = false
      deletingNovel.value = null
    }
  } catch (error) {
    console.error('Failed to delete novel:', error)
  }
}
</script>

<style scoped>
.novels-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  gap: 16px;
  padding: 0 24px 16px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-size: 13px;
  color: var(--text-secondary);
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid var(--border-input);
  border-radius: 6px;
  background: var(--bg-input);
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: var(--border-focus);
}

.search-group {
  flex: 1;
  min-width: 200px;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-input);
  border-radius: 6px;
  background: var(--bg-input);
  font-size: 13px;
}

.search-input:focus {
  outline: none;
  border-color: var(--border-focus);
}

/* 内容区域 */
.novels-content {
  flex: 1;
  padding: 0 24px 24px;
  overflow-y: auto;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: var(--text-muted);
  gap: 12px;
}

.loading-spinner {
  font-size: 32px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 小说网格 */
.novels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

/* 小说卡片 */
.novel-card {
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
}

.novel-card:hover {
  background: rgba(255, 255, 255, 0.7);
  border-color: rgba(0, 0, 0, 0.12);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.novel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.novel-icon {
  font-size: 24px;
}

.novel-status {
  font-size: 10px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 10px;
}

.novel-status--importing { background: #fef3c7; color: #d97706; }
.novel-status--imported { background: #dbeafe; color: #2563eb; }
.novel-status--analyzing { background: #fef3c7; color: #d97706; }
.novel-status--characters_extracted { background: #e0e7ff; color: #4f46e5; }
.novel-status--scenes_analyzed { background: #d1fae5; color: #059669; }
.novel-status--episodes_generated { background: #d1fae5; color: #059669; }
.novel-status--completed { background: #d1fae5; color: #059669; }
.novel-status--failed { background: #fee2e2; color: #dc2626; }

.novel-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.novel-author {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.novel-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.novel-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.novel-card:hover .novel-actions {
  opacity: 1;
}

.action-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.05);
  cursor: pointer;
  font-size: 12px;
  transition: background 0.15s ease;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.delete-btn:hover {
  background: rgba(220, 38, 38, 0.1);
}
</style>
