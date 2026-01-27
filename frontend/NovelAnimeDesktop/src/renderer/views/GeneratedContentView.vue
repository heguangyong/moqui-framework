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
import { useProjectStore } from '../stores/project';
import { useNavigationStore } from '../stores/navigation';
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
  chapters: 0,
  scenes: 0,
  characters: 0,
  videos: 0
});

// 生成的章节数据
const generatedChapters = ref([]);

// 数据去重辅助函数
function deduplicateChapters(chapters) {
  const seen = new Set();
  return chapters.filter(chapter => {
    const id = chapter.id || chapter.chapterId;
    if (seen.has(id)) {
      console.warn('⚠️ 发现重复章节:', id, chapter.title);
      return false;
    }
    seen.add(id);
    return true;
  });
}

onMounted(async () => {
  // 防止重复加载
  if (generatedChapters.value.length > 0) {
    console.log('⚠️ 数据已加载，跳过重复加载');
    return;
  }
  
  // 🔥 REFACTOR: Load data from localStorage or backend instead of workflowState
  // workflowState has been removed as part of architecture cleanup
  
  // 获取项目 ID（从 store 或 localStorage）
  let projectId = projectStore.currentProject?.id || projectStore.currentProject?.projectId;
  if (!projectId) {
    projectId = localStorage.getItem('novel_anime_current_project_id');
    console.log('📦 从 localStorage 获取 projectId:', projectId);
  }
  
  // 获取 novelId
  let novelId = projectStore.currentProject?.novelId || 
                projectStore.currentProject?.novel?.id ||
                localStorage.getItem('novel_anime_current_novel_id');
  console.log('📦 novelId:', novelId);
  
  // 尝试从 localStorage 加载缓存的小说数据
  if (novelId) {
    console.log('📚 尝试从 localStorage 加载小说数据, novelId:', novelId);
    try {
      const cachedData = localStorage.getItem(`novel_${novelId}`);
      if (cachedData) {
        const novelData = JSON.parse(cachedData);
        console.log('📚 从 localStorage 加载到小说数据:', novelData.title, '章节数:', novelData.chapters?.length);
        
        if (novelData.chapters && novelData.chapters.length > 0) {
          const chaptersData = novelData.chapters.map((chapter, index) => ({
            id: chapter.id || chapter.chapterId || `ch${index + 1}`,
            number: chapter.chapterNumber || index + 1,
            title: chapter.title || `第${index + 1}章`,
            scenes: (chapter.scenes || []).map((scene, sIndex) => {
              // 构建场景标题
              let sceneTitle = scene.title;
              if (!sceneTitle || sceneTitle === 'Unknown' || sceneTitle.includes('未知')) {
                const setting = scene.setting && scene.setting !== 'Unknown' && scene.setting !== '未知场景' 
                  ? scene.setting 
                  : null;
                if (setting) {
                  sceneTitle = `场景${scene.sceneNumber || sIndex + 1}: ${setting}`;
                } else {
                  const contentPreview = (scene.content || scene.description || '').substring(0, 20).trim();
                  if (contentPreview) {
                    sceneTitle = `场景${scene.sceneNumber || sIndex + 1}: ${contentPreview}...`;
                  } else {
                    sceneTitle = `场景${scene.sceneNumber || sIndex + 1}`;
                  }
                }
              }
              return {
                id: scene.id || scene.sceneId || `s${sIndex + 1}`,
                title: sceneTitle,
                description: scene.description || scene.visualDescription || scene.content?.substring(0, 100) || '',
                characters: scene.characters || []
              };
            })
          }));
          
          // 应用去重
          generatedChapters.value = deduplicateChapters(chaptersData);
          console.log('✅ 去重后章节数:', generatedChapters.value.length);
          
          const totalScenes = novelData.chapters.reduce((sum, ch) => sum + (ch.scenes?.length || 0), 0);
          stats.value = {
            chapters: novelData.chapters.length,
            scenes: totalScenes,
            characters: 0,
            videos: totalScenes
          };
          
          console.log('✅ 从 localStorage 构建了显示数据:', generatedChapters.value.length, '章');
          
          // 🔥 DELETED: Removed navigationStore.setExecutionResult() call
          // This method was deleted in Phase 1 refactoring
          // Data is already stored in generatedChapters.value for this component
          // PreviewView will load data independently from localStorage/backend
          console.log('📊 数据已加载到 generatedChapters，PreviewView 将独立加载数据');
          
          return;
        }
      }
    } catch (e) {
      console.warn('⚠️ 从 localStorage 加载失败:', e);
    }
  }
  
  // 最后尝试从后端 API 加载数据
  if (projectId) {
    try {
      console.log('📚 尝试从后端加载项目数据, projectId:', projectId);
      
      const { novelApi } = await import('../services/index.ts');
      
      const novelsResult = await novelApi.listNovels(projectId);
      console.log('📚 小说列表:', novelsResult);
      
      if (novelsResult.success && novelsResult.novels && novelsResult.novels.length > 0) {
        const backendNovelId = novelsResult.novels[0].novelId;
        console.log('📚 获取小说详情, novelId:', backendNovelId);
        
        const novelResult = await novelApi.getNovel(backendNovelId);
        console.log('📚 小说详情:', novelResult);
        
        if (novelResult.success && novelResult.novel) {
          const novel = novelResult.novel;
          console.log('📚 从后端获取到小说数据:', novel.title, '章节数:', novel.chapters?.length);
          
          if (novel.chapters && novel.chapters.length > 0) {
            const chaptersData = novel.chapters.map((chapter, index) => ({
              id: chapter.chapterId || chapter.id || `ch${index + 1}`,
              number: chapter.chapterNumber || index + 1,
              title: chapter.title || `第${index + 1}章`,
              scenes: (chapter.scenes || []).map((scene, sIndex) => {
                // 构建场景标题
                let sceneTitle = scene.title;
                if (!sceneTitle || sceneTitle === 'Unknown' || sceneTitle.includes('未知')) {
                  const setting = scene.setting && scene.setting !== 'Unknown' && scene.setting !== '未知场景' 
                    ? scene.setting 
                    : null;
                  if (setting) {
                    sceneTitle = `场景${scene.sceneNumber || sIndex + 1}: ${setting}`;
                  } else {
                    const contentPreview = (scene.visualDescription || scene.content || '').substring(0, 20).trim();
                    if (contentPreview) {
                      sceneTitle = `场景${scene.sceneNumber || sIndex + 1}: ${contentPreview}...`;
                    } else {
                      sceneTitle = `场景${scene.sceneNumber || sIndex + 1}`;
                    }
                  }
                }
                return {
                  id: scene.sceneId || `s${sIndex + 1}`,
                  title: sceneTitle,
                  description: scene.visualDescription || scene.content?.substring(0, 100) || '',
                  characters: []
                };
              })
            }));
            
            // 应用去重
            generatedChapters.value = deduplicateChapters(chaptersData);
            console.log('✅ 去重后章节数:', generatedChapters.value.length);
            
            const totalScenes = novel.scenes?.length || novel.chapters.reduce((sum, ch) => sum + (ch.scenes?.length || 0), 0);
            stats.value = {
              chapters: novel.chapters.length,
              scenes: totalScenes,
              characters: 0,
              videos: totalScenes
            };
            
            console.log('✅ 从后端构建了显示数据:', generatedChapters.value.length, '章,', totalScenes, '个场景');
            
            // 🔥 DELETED: Removed navigationStore.setExecutionResult() call
            // This method was deleted in Phase 1 refactoring
            // Data is already stored in generatedChapters.value for this component
            // PreviewView will load data independently from localStorage/backend
            console.log('📊 数据已加载到 generatedChapters，PreviewView 将独立加载数据');
            
            return;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load generated content from backend:', error);
    }
  }
  
  // 如果没有从任何来源获取到数据，显示空状态
  if (generatedChapters.value.length === 0) {
    console.log('❌ No generated content found, showing empty state');
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
  console.log('🎬 预览场景:', scene);
  
  // 🔥 REFACTOR: Removed workflowState dependency
  // Simply navigate to preview page - PreviewView will load data from localStorage/backend
  console.log('✅ 跳转到预览页面');
  router.push('/preview');
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
      await apiService.axiosInstance.put(`/project/${projectId}`, {
        status: 'completed'
      });
    } catch (error) {
      console.warn('Failed to update project status on backend:', error);
    }
    
    // 更新前端状态
    projectStore.currentProject.status = 'completed';
  }
  
  // 🔥 REFACTOR: Removed navigationStore.resetWorkflowState() call
  // workflowState has been deleted as part of architecture cleanup
  
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

/* 按钮样式 - 统一无渐变风格 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s ease;
  background-color: #c8c8c8;
  color: #2c2c2e;
  white-space: nowrap;
}

.btn:hover:not(:disabled) {
  background-color: #d8d8d8;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #7a9188;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background-color: #6a8178;
}

.btn-secondary {
  background-color: #c8c8c8;
  color: #2c2c2e;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #d8d8d8;
}

.btn-small {
  height: 26px;
  padding: 0 10px;
  font-size: 11px;
}

.btn-large {
  height: 48px;
  padding: 0 32px;
  font-size: 16px;
}
</style>
