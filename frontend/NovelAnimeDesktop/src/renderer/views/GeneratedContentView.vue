<template>
  <div class="generated-content-view">
    <div class="content-header">
      <div class="header-info">
        <h1>生成结果预览</h1>
        <p>{{ projectName }} - 动漫转换完成</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="goBack">
          返回工作流
        </button>
        <button class="btn btn-primary" @click="exportAll">
          导出全部
        </button>
      </div>
    </div>

    <!-- 生成统计 -->
    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-icon">📖</div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.chapters }}</span>
          <span class="stat-label">章节</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎬</div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.scenes }}</span>
          <span class="stat-label">场景</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👤</div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.characters }}</span>
          <span class="stat-label">角色</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎥</div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.videos }}</span>
          <span class="stat-label">视频片段</span>
        </div>
      </div>
    </div>

    <!-- 内容预览 -->
    <div class="preview-section">
      <h2>生成内容</h2>
      
      <!-- 章节列表 -->
      <div class="chapter-list">
        <div 
          v-for="chapter in generatedChapters" 
          :key="chapter.id"
          class="chapter-card"
          :class="{ 'chapter-card--expanded': expandedChapter === chapter.id }"
        >
          <div class="chapter-header" @click="toggleChapter(chapter.id)">
            <div class="chapter-info">
              <span class="chapter-number">第{{ chapter.number }}章</span>
              <span class="chapter-title">{{ chapter.title }}</span>
            </div>
            <div class="chapter-meta">
              <span class="scene-count">{{ chapter.scenes.length }} 个场景</span>
              <span class="expand-icon">{{ expandedChapter === chapter.id ? '▼' : '▶' }}</span>
            </div>
          </div>
          
          <!-- 场景列表 -->
          <div v-if="expandedChapter === chapter.id" class="scene-list">
            <div 
              v-for="scene in chapter.scenes" 
              :key="scene.id"
              class="scene-card"
            >
              <div class="scene-preview">
                <div class="scene-thumbnail">
                  <span class="thumbnail-placeholder">🎬</span>
                </div>
                <div class="scene-info">
                  <h4>{{ scene.title }}</h4>
                  <p>{{ scene.description }}</p>
                  <div class="scene-characters">
                    <span v-for="char in scene.characters" :key="char" class="character-tag">
                      {{ char }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="scene-actions">
                <button class="btn btn-small" @click="previewScene(scene)">预览</button>
                <button class="btn btn-small" @click="exportScene(scene)">导出</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作区域 -->
    <div class="action-section">
      <button class="btn btn-large btn-primary" @click="finishProject">
        完成项目
      </button>
      <p class="action-hint">点击完成项目后，将返回项目概览页面</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '../stores/project.js';
import { useNavigationStore } from '../stores/navigation.js';
import { useUIStore } from '../stores/ui.js';

const router = useRouter();
const projectStore = useProjectStore();
const navigationStore = useNavigationStore();
const uiStore = useUIStore();

const expandedChapter = ref(null);

// 项目名称
const projectName = computed(() => {
  return projectStore.currentProject?.name || '未命名项目';
});

// 统计数据
const stats = ref({
  chapters: 3,
  scenes: 12,
  characters: 5,
  videos: 12
});

// 生成的章节数据（模拟）
const generatedChapters = ref([
  {
    id: 'ch1',
    number: 1,
    title: '初遇',
    scenes: [
      { id: 's1', title: '场景1: 清晨的街道', description: '主角走在清晨的街道上，阳光洒落', characters: ['主角', '路人A'] },
      { id: 's2', title: '场景2: 咖啡店相遇', description: '在咖啡店与女主角第一次相遇', characters: ['主角', '女主角'] },
      { id: 's3', title: '场景3: 意外的邂逅', description: '两人因为一杯咖啡而开始交谈', characters: ['主角', '女主角'] },
      { id: 's4', title: '场景4: 告别', description: '短暂的相遇后各自离开', characters: ['主角', '女主角'] }
    ]
  },
  {
    id: 'ch2',
    number: 2,
    title: '重逢',
    scenes: [
      { id: 's5', title: '场景1: 公司大厅', description: '主角来到新公司报到', characters: ['主角', '前台'] },
      { id: 's6', title: '场景2: 意外重逢', description: '发现女主角竟然是同事', characters: ['主角', '女主角'] },
      { id: 's7', title: '场景3: 尴尬的午餐', description: '被安排在同一个项目组', characters: ['主角', '女主角', '组长'] },
      { id: 's8', title: '场景4: 加班时光', description: '两人一起加班完成项目', characters: ['主角', '女主角'] }
    ]
  },
  {
    id: 'ch3',
    number: 3,
    title: '心动',
    scenes: [
      { id: 's9', title: '场景1: 雨中送伞', description: '主角在雨中为女主角撑伞', characters: ['主角', '女主角'] },
      { id: 's10', title: '场景2: 深夜谈心', description: '两人在天台聊起各自的梦想', characters: ['主角', '女主角'] },
      { id: 's11', title: '场景3: 心意渐明', description: '主角意识到自己的心意', characters: ['主角'] },
      { id: 's12', title: '场景4: 表白', description: '鼓起勇气向女主角表白', characters: ['主角', '女主角'] }
    ]
  }
]);

onMounted(() => {
  // 从执行结果中获取实际数据
  const result = navigationStore.workflowState.executionResult;
  if (result) {
    console.log('Execution result:', result);
  }
});

function toggleChapter(chapterId) {
  if (expandedChapter.value === chapterId) {
    expandedChapter.value = null;
  } else {
    expandedChapter.value = chapterId;
  }
}

function previewScene(scene) {
  uiStore.addNotification({
    type: 'info',
    title: '场景预览',
    message: `正在预览: ${scene.title}`,
    timeout: 2000
  });
}

function exportScene(scene) {
  uiStore.addNotification({
    type: 'success',
    title: '导出成功',
    message: `${scene.title} 已导出`,
    timeout: 2000
  });
}

function exportAll() {
  uiStore.addNotification({
    type: 'success',
    title: '导出全部',
    message: '所有内容已打包导出',
    timeout: 3000
  });
}

function goBack() {
  router.push('/workflow');
}

async function finishProject() {
  // 更新项目状态到后端
  if (projectStore.currentProject) {
    const projectId = projectStore.currentProject.id || projectStore.currentProject.projectId;
    try {
      // 尝试调用后端 API 更新项目状态
      const { apiService } = await import('../services/index.ts');
      await apiService.axiosInstance.put(`/projects/${projectId}/status`, {
        status: 'completed'
      });
    } catch (error) {
      console.warn('Failed to update project status on backend:', error);
    }
    
    // 更新前端状态
    projectStore.currentProject.status = 'completed';
  }
  
  // 重置工作流状态
  navigationStore.resetWorkflowState();
  
  // 清除当前项目，准备开始新项目
  projectStore.clearCurrentProject();
  
  // 清除 localStorage 中的相关数据
  localStorage.removeItem('novel_anime_current_novel_id');
  localStorage.removeItem('novel_anime_current_novel_title');
  
  // 跳转到仪表盘
  router.push('/dashboard');
  
  uiStore.addNotification({
    type: 'success',
    title: '🎉 项目完成',
    message: '恭喜！您的小说已成功转换为动漫',
    timeout: 5000
  });
}
</script>

<style scoped>
.generated-content-view {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: 100%;
  overflow-y: auto;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-info h1 {
  font-size: 24px;
  font-weight: 700;
  color: #2c2c2e;
  margin: 0 0 4px 0;
}

.header-info p {
  font-size: 14px;
  color: #6c6c6e;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 统计卡片 */
.stats-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
}

.stat-icon {
  font-size: 28px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #2c2c2e;
}

.stat-label {
  font-size: 12px;
  color: #6c6c6e;
}

/* 预览区域 */
.preview-section {
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 20px;
}

.preview-section h2 {
  font-size: 16px;
  font-weight: 600;
  color: #2c2c2e;
  margin: 0 0 16px 0;
}

/* 章节列表 */
.chapter-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chapter-card {
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  overflow: hidden;
}

.chapter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.15s;
}

.chapter-header:hover {
  background: rgba(0, 0, 0, 0.02);
}

.chapter-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chapter-number {
  font-size: 12px;
  font-weight: 600;
  color: #6c6c6e;
  background: rgba(0, 0, 0, 0.06);
  padding: 4px 8px;
  border-radius: 4px;
}

.chapter-title {
  font-size: 15px;
  font-weight: 600;
  color: #2c2c2e;
}

.chapter-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.scene-count {
  font-size: 12px;
  color: #8a8a8c;
}

.expand-icon {
  font-size: 10px;
  color: #8a8a8c;
}

/* 场景列表 */
.scene-list {
  padding: 0 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.scene-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
}

.scene-preview {
  display: flex;
  gap: 12px;
  flex: 1;
}

.scene-thumbnail {
  width: 60px;
  height: 45px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumbnail-placeholder {
  font-size: 20px;
  opacity: 0.5;
}

.scene-info {
  flex: 1;
}

.scene-info h4 {
  font-size: 13px;
  font-weight: 600;
  color: #2c2c2e;
  margin: 0 0 4px 0;
}

.scene-info p {
  font-size: 12px;
  color: #6c6c6e;
  margin: 0 0 6px 0;
}

.scene-characters {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.character-tag {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(100, 140, 120, 0.15);
  color: #4a6a52;
  border-radius: 4px;
}

.scene-actions {
  display: flex;
  gap: 8px;
}

/* 操作区域 */
.action-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  background: rgba(100, 160, 130, 0.1);
  border-radius: 12px;
}

.btn-large {
  height: 48px;
  padding: 0 32px;
  font-size: 16px;
}

.action-hint {
  margin-top: 12px;
  font-size: 13px;
  color: #6c6c6e;
}

/* 按钮样式 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 14px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s ease;
  background: rgba(255, 255, 255, 0.6);
  color: #5a5a5c;
}

.btn:hover {
  background: rgba(255, 255, 255, 0.8);
}

.btn-primary {
  background: rgba(100, 140, 120, 0.25);
  border-color: rgba(100, 140, 120, 0.35);
  color: #3a5a42;
}

.btn-primary:hover {
  background: rgba(100, 140, 120, 0.35);
}

.btn-secondary {
  background: rgba(160, 160, 160, 0.15);
  color: #6a6a6a;
}

.btn-secondary:hover {
  background: rgba(160, 160, 160, 0.25);
}

.btn-small {
  height: 26px;
  padding: 0 10px;
  font-size: 11px;
}
</style>
