<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ novel.title }}</h2>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      
      <div class="modal-body">
        <!-- 基本信息 -->
        <div class="info-section">
          <h3>基本信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>作者</label>
              <span>{{ novel.author || '未知' }}</span>
            </div>
            <div class="info-item">
              <label>字数</label>
              <span>{{ formatWordCount(novel.wordCount) }}</span>
            </div>
            <div class="info-item">
              <label>状态</label>
              <span class="status-badge" :class="`status--${novel.status}`">
                {{ getStatusLabel(novel.status) }}
              </span>
            </div>
            <div class="info-item">
              <label>创建时间</label>
              <span>{{ formatDateTime(novel.createdDate) }}</span>
            </div>
          </div>
        </div>
        
        <!-- 章节列表 -->
        <div class="chapters-section" v-if="chapters.length > 0">
          <h3>章节列表 ({{ chapters.length }})</h3>
          <div class="chapters-list">
            <div 
              v-for="chapter in chapters" 
              :key="chapter.chapterId"
              class="chapter-item"
            >
              <span class="chapter-number">第{{ chapter.chapterNumber }}章</span>
              <span class="chapter-title">{{ chapter.title }}</span>
              <span class="chapter-words">{{ chapter.wordCount }}字</span>
            </div>
          </div>
        </div>
        
        <!-- 场景列表 -->
        <div class="scenes-section" v-if="scenes.length > 0">
          <h3>场景列表 ({{ scenes.length }})</h3>
          <div class="scenes-list">
            <div 
              v-for="scene in scenes.slice(0, 10)" 
              :key="scene.sceneId"
              class="scene-item"
            >
              <span class="scene-number">场景 {{ scene.sceneNumber }}</span>
              <span class="scene-setting" v-if="scene.setting">{{ scene.setting }}</span>
              <span class="scene-mood" v-if="scene.mood">{{ scene.mood }}</span>
            </div>
            <div v-if="scenes.length > 10" class="more-hint">
              还有 {{ scenes.length - 10 }} 个场景...
            </div>
          </div>
        </div>
        
        <!-- 处理历史 -->
        <div class="history-section" v-if="processingHistory.length > 0">
          <h3>处理历史</h3>
          <div class="history-list">
            <div 
              v-for="(item, index) in processingHistory" 
              :key="index"
              class="history-item"
            >
              <span class="history-stage">{{ item.stage }}</span>
              <span class="history-status" :class="`status--${item.status}`">
                {{ item.status }}
              </span>
              <span class="history-time">{{ formatDateTime(item.time) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">关闭</button>
        <button class="btn btn-primary" @click="$emit('edit')">编辑</button>
        <button class="btn btn-danger" @click="$emit('delete')">删除</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { novelApi } from '../../services'

const props = defineProps({
  novel: {
    type: Object,
    required: true
  }
})

defineEmits(['close', 'edit', 'delete'])

const chapters = ref([])
const scenes = ref([])
const processingHistory = ref([])
const isLoading = ref(false)

onMounted(async () => {
  await loadNovelDetails()
})

async function loadNovelDetails() {
  isLoading.value = true
  try {
    const result = await novelApi.getNovel(props.novel.novelId)
    if (result.success && result.novel) {
      chapters.value = result.novel.chapters || []
      scenes.value = result.novel.scenes || []
    }
  } catch (error) {
    console.error('Failed to load novel details:', error)
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

function formatDateTime(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}
</script>

<style scoped>
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
  z-index: 1050;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c2c2e;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  padding: 4px;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.info-section,
.chapters-section,
.scenes-section,
.history-section {
  margin-bottom: 24px;
}

.info-section h3,
.chapters-section h3,
.scenes-section h3,
.history-section h3 {
  font-size: 14px;
  font-weight: 600;
  color: #2c2c2e;
  margin: 0 0 12px 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item label {
  font-size: 12px;
  color: #999;
}

.info-item span {
  font-size: 14px;
  color: #2c2c2e;
}

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.status--importing { background: #fef3c7; color: #d97706; }
.status--imported { background: #dbeafe; color: #2563eb; }
.status--analyzing { background: #fef3c7; color: #d97706; }
.status--characters_extracted { background: #e0e7ff; color: #4f46e5; }
.status--scenes_analyzed { background: #d1fae5; color: #059669; }
.status--episodes_generated { background: #d1fae5; color: #059669; }
.status--completed { background: #d1fae5; color: #059669; }
.status--failed { background: #fee2e2; color: #dc2626; }

.chapters-list,
.scenes-list,
.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.chapter-item,
.scene-item,
.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 13px;
}

.chapter-number,
.scene-number {
  font-weight: 500;
  color: #666;
  min-width: 60px;
}

.chapter-title {
  flex: 1;
  color: #2c2c2e;
}

.chapter-words {
  color: #999;
  font-size: 12px;
}

.scene-setting {
  flex: 1;
  color: #2c2c2e;
}

.scene-mood {
  color: #666;
  font-size: 12px;
}

.history-stage {
  flex: 1;
  color: #2c2c2e;
}

.history-status {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
}

.history-time {
  color: #999;
  font-size: 12px;
}

.more-hint {
  text-align: center;
  color: #999;
  font-size: 12px;
  padding: 8px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #eee;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-secondary {
  background: #f0f0f0;
  color: #666;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background: #c0392b;
}
</style>
