<template>
  <div class="preview-view">
    <!-- 加载状态 -->
    <div v-if="!isReady" class="loading-overlay">
      <div class="loading-spinner">正在加载预览...</div>
    </div>

    <!-- 视图头部 -->
    <ViewHeader 
      :title="viewTitle" 
      :subtitle="viewSubtitle"
    >
      <template #actions>
        <div class="preview-controls">
          <button 
            @click="togglePreviewMode" 
            class="btn btn-secondary"
            :class="{ active: previewMode === 'scene' }"
          >
            {{ previewMode === 'scene' ? '场景预览' : '分镜预览' }}
          </button>
          <button 
            @click="refreshPreview" 
            class="btn btn-secondary"
            :disabled="isLoading"
          >
            <component :is="icons.refresh" :size="14" />
            刷新
          </button>
          <button 
            @click="exportContent" 
            class="btn btn-primary"
            :disabled="!hasContent"
          >
            <component :is="icons.download" :size="14" />
            导出
          </button>
        </div>
      </template>
    </ViewHeader>

    <div class="preview-content">
      <!-- 预览播放器 -->
      <div class="preview-player">
        <div class="player-container">
          <!-- 场景预览模式 -->
          <div v-if="previewMode === 'scene'" class="scene-preview">
            <div v-if="currentScene" class="scene-content">
              <div class="scene-header">
                <h3>{{ currentScene.title }}</h3>
                <span class="scene-index">{{ currentSceneIndex + 1 }} / {{ scenes.length }}</span>
              </div>
              
              <!-- 场景描述 -->
              <div class="scene-description">
                <p>{{ currentScene.description }}</p>
              </div>
              
              <!-- 角色信息 -->
              <div v-if="currentScene.characters?.length" class="scene-characters">
                <h4>出场角色</h4>
                <div class="character-list">
                  <div 
                    v-for="character in currentScene.characters" 
                    :key="character.id"
                    class="character-item"
                  >
                    <span class="character-name">{{ character.name }}</span>
                    <span class="character-role">{{ character.role }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-else class="empty-scene">
              <component :is="icons.film" :size="64" />
              <p>暂无场景内容</p>
            </div>
          </div>
          <!-- 分镜头预览模式 -->
          <div v-else class="storyboard-preview">
            <div v-if="currentStoryboard" class="storyboard-content">
              <div class="storyboard-header">
                <h3>分镜头 {{ currentStoryboardIndex + 1 }}</h3>
                <span class="storyboard-index">{{ currentStoryboardIndex + 1 }} / {{ storyboards.length }}</span>
              </div>
              
              <!-- 分镜头图片 -->
              <div class="storyboard-image">
                <img 
                  v-if="currentStoryboard.imageUrl && !currentStoryboard.imageLoadError" 
                  :src="currentStoryboard.imageUrl" 
                  :alt="currentStoryboard.description"
                  @error="handleImageError(currentStoryboard)"
                />
                <div v-else class="placeholder-image">
                  <component :is="icons.image" :size="64" />
                  <p v-if="currentStoryboard.imageLoadError" class="error-text">图片加载失败</p>
                  <p v-else>暂无图片</p>
                  <p class="hint-text">工作流未生成图片数据</p>
                </div>
              </div>
              
              <!-- 分镜头描述 -->
              <div class="storyboard-description">
                <p>{{ currentStoryboard.description }}</p>
              </div>
              
              <!-- 对话内容 -->
              <div v-if="currentStoryboard.dialogue" class="storyboard-dialogue">
                <h4>对话</h4>
                <div class="dialogue-content">
                  <p>"{{ currentStoryboard.dialogue }}"</p>
                  <span v-if="currentStoryboard.speaker" class="dialogue-speaker">
                    —— {{ currentStoryboard.speaker }}
                  </span>
                </div>
              </div>
            </div>
            
            <div v-else class="empty-storyboard">
              <component :is="icons.image" :size="64" />
              <p>暂无分镜头内容</p>
            </div>
          </div>
        </div>
        
        <!-- 播放控制栏 -->
        <div class="player-controls">
          <div class="control-buttons">
            <button 
              @click="previousItem" 
              class="control-btn"
              :disabled="isFirstItem"
            >
              <component :is="icons.chevronLeft" :size="16" />
            </button>
            
            <button 
              @click="togglePlayback" 
              class="control-btn play-btn"
              :disabled="!hasContent"
            >
              <component 
                :is="isPlaying ? icons.pause : icons.play" 
                :size="20" 
              />
            </button>
            
            <button 
              @click="nextItem" 
              class="control-btn"
              :disabled="isLastItem"
            >
              <component :is="icons.chevronRight" :size="16" />
            </button>
          </div>
          
          <!-- 进度条 -->
          <div class="progress-section">
            <div class="progress-bar" @click="seekTo">
              <div 
                class="progress-fill" 
                :style="{ width: progressPercentage + '%' }"
              ></div>
              <div 
                class="progress-handle" 
                :style="{ left: progressPercentage + '%' }"
              ></div>
            </div>
            <div class="progress-text">
              {{ currentIndex + 1 }} / {{ totalItems }}
            </div>
          </div>
          
          <!-- 播放设置 -->
          <div class="playback-settings">
            <label class="speed-control">
              速度:
              <select v-model="playbackSpeed" @change="updatePlaybackSpeed">
                <option value="0.5">0.5x</option>
                <option value="1">1x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </label>
            
            <label class="auto-play-control">
              <input 
                type="checkbox" 
                v-model="autoPlay"
              />
              自动播放
            </label>
          </div>
        </div>
      </div>
      
      <!-- 内容列表 -->
      <div class="content-sidebar">
        <div class="sidebar-header">
          <h3>{{ previewMode === 'scene' ? '场景列表' : '分镜列表' }}</h3>
          <span class="content-count">{{ totalItems }} 项</span>
        </div>
        
        <div class="content-list">
          <!-- 场景列表 -->
          <div v-if="previewMode === 'scene'" class="scene-list">
            <div 
              v-for="(scene, index) in scenes" 
              :key="scene.id"
              class="scene-item"
              :class="{ active: index === currentSceneIndex }"
              @click="selectScene(index)"
            >
              <div class="scene-thumbnail">
                <component :is="icons.film" :size="20" />
              </div>
              <div class="scene-info">
                <div class="scene-title">{{ scene.title }}</div>
                <div class="scene-meta">
                  <span>{{ scene.characters?.length || 0 }} 个角色</span>
                  <span>{{ formatDuration(scene.duration) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 分镜头列表 -->
          <div v-else class="storyboard-list">
            <div 
              v-for="(storyboard, index) in storyboards" 
              :key="storyboard.id"
              class="storyboard-item"
              :class="{ active: index === currentStoryboardIndex }"
              @click="selectStoryboard(index)"
            >
              <div class="storyboard-thumbnail">
                <img 
                  v-if="storyboard.thumbnailUrl" 
                  :src="storyboard.thumbnailUrl" 
                  :alt="storyboard.description"
                />
                <component v-else :is="icons.image" :size="20" />
              </div>
              <div class="storyboard-info">
                <div class="storyboard-title">分镜 {{ index + 1 }}</div>
                <div class="storyboard-meta">
                  <span>{{ formatDuration(storyboard.duration) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="totalItems === 0" class="empty-list">
            <component :is="icons.inbox" :size="32" />
            <p>暂无内容</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 导出对话框 -->
    <ExportDialog
      v-model:visible="showExportDialog"
      :content-type="previewMode"
      :total-items="totalItems"
      @export="handleExport"
    />
    
    <!-- 导出进度对话框 -->
    <ExportProgressDialog
      v-model:visible="showExportProgress"
      :progress="exportProgress"
      :export-path="exportPath"
      :can-cancel="exportProgress.status === 'exporting'"
      @cancel="cancelExport"
      @openFolder="openExportFolder"
    />
  </div>
</template>
<script setup lang="ts">
/**
 * PreviewView.vue - 内容预览界面
 * 实现场景预览和分镜头预览功能
 * 
 * Requirements: 8.1, 8.2
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '../stores/project';
import { useUIStore } from '../stores/ui.js';
import { useNavigationStore } from '../stores/navigation';
import { icons } from '../utils/icons.js';
import ViewHeader from '../components/ui/ViewHeader.vue';
import ExportDialog from '../components/dialogs/ExportDialog.vue';
import ExportProgressDialog from '../components/dialogs/ExportProgressDialog.vue';

import { exportService, type ExportOptions, type ExportProgress } from '../services/ExportService';

// 接口定义
interface Scene {
  id: string;
  title: string;
  description: string;
  characters?: Array<{ id: string; name: string; role: string }>;
  duration: number;
  chapterIndex?: number;
}

interface Storyboard {
  id: string;
  description: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  dialogue?: string;
  speaker?: string;
  duration: number;
  sceneId?: string;
  imageLoadError?: boolean;
}

const router = useRouter();
const projectStore = useProjectStore();
const uiStore = useUIStore();
const navigationStore = useNavigationStore();

// 响应式数据
const isReady = ref(false);
const isLoading = ref(false);
const previewMode = ref<'scene' | 'storyboard'>('scene');
const currentSceneIndex = ref(0);
const currentStoryboardIndex = ref(0);
const isPlaying = ref(false);
const playbackSpeed = ref(1);
const autoPlay = ref(false);
const showExportDialog = ref(false);
const showExportProgress = ref(false);
const exportProgress = ref<ExportProgress>({
  current: 0,
  total: 0,
  percentage: 0,
  currentItem: '',
  status: 'preparing',
  message: '准备导出...'
});
const exportPath = ref<string>('');

// 内容数据
const scenes = ref<Scene[]>([]);
const storyboards = ref<Storyboard[]>([]);

// 播放控制
let playbackTimer: NodeJS.Timeout | null = null;

// 计算属性
const viewTitle = computed(() => {
  return previewMode.value === 'scene' ? '场景预览' : '分镜头预览';
});

const viewSubtitle = computed(() => {
  const project = projectStore.currentProject;
  return project ? `项目: ${project.name}` : '预览生成的内容';
});

const currentScene = computed((): Scene | null => {
  return scenes.value[currentSceneIndex.value] || null;
});

const currentStoryboard = computed((): Storyboard | null => {
  return storyboards.value[currentStoryboardIndex.value] || null;
});

const totalItems = computed((): number => {
  return previewMode.value === 'scene' ? scenes.value.length : storyboards.value.length;
});

const currentIndex = computed((): number => {
  return previewMode.value === 'scene' ? currentSceneIndex.value : currentStoryboardIndex.value;
});

const hasContent = computed((): boolean => {
  return totalItems.value > 0;
});

const isFirstItem = computed((): boolean => {
  return currentIndex.value === 0;
});

const isLastItem = computed((): boolean => {
  return currentIndex.value >= totalItems.value - 1;
});

const progressPercentage = computed((): number => {
  if (totalItems.value === 0) return 0;
  return (currentIndex.value / (totalItems.value - 1)) * 100;
});

// 初始化
async function initialize(): Promise<void> {
  console.log('🎬 [PreviewView] Initializing...');
  console.log('📊 [PreviewView] Current project:', projectStore.currentProject);
  // 🔥 REFACTOR: Removed workflowState logging
  
  try {
    isLoading.value = true;
    
    // 加载预览数据
    await loadPreviewData();
    
    isReady.value = true;
    console.log('✅ [PreviewView] Initialization completed');
  } catch (error) {
    console.error('❌ [PreviewView] 预览初始化失败:', error);
    uiStore.addNotification({
      type: 'error',
      title: '加载失败',
      message: '无法加载预览内容',
      timeout: 3000
    });
  } finally {
    isLoading.value = false;
  }
}

// 加载预览数据
async function loadPreviewData(): Promise<void> {
  const project = projectStore.currentProject;
  if (!project) {
    console.warn('没有当前项目');
    return;
  }

  // 🔥 REFACTOR: Load data from localStorage or backend instead of workflowState
  // workflowState has been removed as part of architecture cleanup
  
  let loadedScenes: Scene[] = [];
  let loadedStoryboards: Storyboard[] = [];
  
  // Load from localStorage (simplified approach)
  // In a real implementation, this would load from backend API
  console.log('📦 [PreviewView] Loading from localStorage/backend');
  
  // For now, show empty state with helpful message
  scenes.value = loadedScenes;
  storyboards.value = loadedStoryboards;
  
  // 如果没有数据，显示提示信息
  if (scenes.value.length === 0 && storyboards.value.length === 0) {
    console.warn('⚠️ [PreviewView] 没有找到预览数据');
    uiStore.addNotification({
      type: 'info',
      title: '暂无预览内容',
      message: '请先执行工作流生成内容',
      timeout: 3000
    });
  }
}

// 切换预览模式
function togglePreviewMode(): void {
  previewMode.value = previewMode.value === 'scene' ? 'storyboard' : 'scene';
  stopPlayback();
}

// 刷新预览
async function refreshPreview(): Promise<void> {
  await loadPreviewData();
  uiStore.addNotification({
    type: 'success',
    title: '刷新成功',
    message: '预览内容已更新',
    timeout: 2000
  });
}

// 导出内容
function exportContent(): void {
  showExportDialog.value = true;
}

// 播放控制
function togglePlayback(): void {
  if (isPlaying.value) {
    stopPlayback();
  } else {
    startPlayback();
  }
}

function startPlayback(): void {
  if (!hasContent.value) return;
  
  isPlaying.value = true;
  scheduleNextItem();
}

function stopPlayback(): void {
  isPlaying.value = false;
  if (playbackTimer) {
    clearTimeout(playbackTimer);
    playbackTimer = null;
  }
}

function scheduleNextItem(): void {
  if (!isPlaying.value) return;
  
  const currentItem = previewMode.value === 'scene' ? currentScene.value : currentStoryboard.value;
  const duration = currentItem?.duration || 3000;
  const adjustedDuration = duration / playbackSpeed.value;
  
  playbackTimer = setTimeout(() => {
    if (isLastItem.value) {
      if (autoPlay.value) {
        // 自动播放模式下循环播放
        if (previewMode.value === 'scene') {
          currentSceneIndex.value = 0;
        } else {
          currentStoryboardIndex.value = 0;
        }
        scheduleNextItem();
      } else {
        stopPlayback();
      }
    } else {
      nextItem();
      scheduleNextItem();
    }
  }, adjustedDuration);
}

// 导航控制
function previousItem(): void {
  if (previewMode.value === 'scene') {
    if (currentSceneIndex.value > 0) {
      currentSceneIndex.value--;
    }
  } else {
    if (currentStoryboardIndex.value > 0) {
      currentStoryboardIndex.value--;
    }
  }
}

function nextItem(): void {
  if (previewMode.value === 'scene') {
    if (currentSceneIndex.value < scenes.value.length - 1) {
      currentSceneIndex.value++;
    }
  } else {
    if (currentStoryboardIndex.value < storyboards.value.length - 1) {
      currentStoryboardIndex.value++;
    }
  }
}

function selectScene(index: number): void {
  currentSceneIndex.value = index;
  stopPlayback();
}

function selectStoryboard(index: number): void {
  currentStoryboardIndex.value = index;
  stopPlayback();
}

// 进度条控制
function seekTo(event: MouseEvent): void {
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const percentage = (event.clientX - rect.left) / rect.width;
  const targetIndex = Math.floor(percentage * totalItems.value);
  
  if (previewMode.value === 'scene') {
    currentSceneIndex.value = Math.max(0, Math.min(targetIndex, scenes.value.length - 1));
  } else {
    currentStoryboardIndex.value = Math.max(0, Math.min(targetIndex, storyboards.value.length - 1));
  }
  
  stopPlayback();
}

// 播放速度控制
function updatePlaybackSpeed(): void {
  // 如果正在播放，重新调度下一项
  if (isPlaying.value) {
    if (playbackTimer) {
      clearTimeout(playbackTimer);
    }
    scheduleNextItem();
  }
}

// 工具函数
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return `${seconds}s`;
}

function handleImageError(storyboard: Storyboard): void {
  console.warn('图片加载失败:', storyboard.imageUrl);
  // 标记图片加载失败，触发显示占位符
  storyboard.imageLoadError = true;
}

function handleExport(options: ExportOptions): void {
  console.log('导出选项:', options);
  
  showExportDialog.value = false;
  
  // 开始导出进度监控
  startExportWithProgress(options);
}

async function startExportWithProgress(options: ExportOptions): Promise<void> {
  try {
    // 显示进度对话框
    showExportProgress.value = true;
    exportPath.value = '';
    
    // 设置进度回调
    exportService.setProgressCallback((progress) => {
      exportProgress.value = { ...progress };
    });
    
    let result: string;
    
    if (previewMode.value === 'scene') {
      result = await exportService.exportScenes(scenes.value, options);
    } else {
      result = await exportService.exportStoryboards(storyboards.value, options);
    }
    
    exportPath.value = result;
    
    uiStore.addNotification({
      type: 'success',
      title: '导出成功',
      message: `内容已导出到: ${result}`,
      timeout: 5000
    });
    
  } catch (error) {
    console.error('导出失败:', error);
    
    // 更新进度状态为错误
    exportProgress.value = {
      ...exportProgress.value,
      status: 'error',
      message: error.message || '导出过程中发生错误'
    };
    
    uiStore.addNotification({
      type: 'error',
      title: '导出失败',
      message: error.message || '导出过程中发生错误',
      timeout: 5000
    });
  }
}

// 取消导出
function cancelExport(): void {
  exportService.cancel();
  showExportProgress.value = false;
  
  uiStore.addNotification({
    type: 'info',
    title: '导出已取消',
    message: '导出操作已被用户取消',
    timeout: 3000
  });
}

// 打开导出文件夹
function openExportFolder(path: string): void {
  console.log('打开导出文件夹:', path);
  
  // 在实际实现中，这里会调用 Electron 的 shell.openPath
  uiStore.addNotification({
    type: 'info',
    title: '打开文件夹',
    message: `正在打开: ${path}`,
    timeout: 2000
  });
}

// 生命周期
onMounted(() => {
  initialize();
});

onUnmounted(() => {
  stopPlayback();
});

// 监听预览模式变化
watch(previewMode, () => {
  stopPlayback();
});
</script>
<style scoped>
.preview-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #dce3eb;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  font-size: 16px;
  color: #666;
}

.preview-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.preview-controls .btn {
  display: flex;
  align-items: center;
  gap: 6px;
}

.preview-controls .btn.active {
  background: rgba(120, 140, 130, 0.3);
  color: #3a4a42;
}

.preview-content {
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 16px;
  overflow: hidden;
}

/* 预览播放器 */
.preview-player {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.player-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  min-height: 400px;
}

/* 场景预览 */
.scene-preview {
  width: 100%;
  max-width: 800px;
}

.scene-content {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.scene-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(0, 0, 0, 0.1);
}

.scene-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #2c2c2e;
}

.scene-index {
  font-size: 14px;
  color: #666;
  background: rgba(0, 0, 0, 0.05);
  padding: 4px 12px;
  border-radius: 20px;
}

.scene-description {
  margin-bottom: 20px;
}

.scene-description p {
  font-size: 16px;
  line-height: 1.6;
  color: #4a4a4c;
  margin: 0;
}

.scene-characters h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.character-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.character-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(120, 140, 130, 0.15);
  border-radius: 20px;
  font-size: 13px;
}

.character-name {
  font-weight: 500;
  color: #2c2c2e;
}

.character-role {
  color: #666;
  font-size: 12px;
}

/* 分镜头预览 */
.storyboard-preview {
  width: 100%;
  max-width: 600px;
}

.storyboard-content {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.storyboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.storyboard-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c2c2e;
}

.storyboard-index {
  font-size: 13px;
  color: #666;
  background: rgba(0, 0, 0, 0.05);
  padding: 4px 10px;
  border-radius: 16px;
}

.storyboard-image {
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.05);
  aspect-ratio: 16/9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.storyboard-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #999;
  padding: 40px 20px;
}

.placeholder-image p {
  margin: 0;
  font-size: 14px;
  text-align: center;
}

.placeholder-image .error-text {
  color: #e74c3c;
  font-weight: 500;
}

.placeholder-image .hint-text {
  font-size: 12px;
  color: #bbb;
  font-style: italic;
}

.storyboard-description p {
  font-size: 15px;
  line-height: 1.5;
  color: #4a4a4c;
  margin: 0 0 16px 0;
}

.storyboard-dialogue h4 {
  margin: 0 0 8px 0;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dialogue-content {
  background: rgba(120, 140, 130, 0.1);
  border-left: 3px solid rgba(120, 140, 130, 0.5);
  padding: 12px 16px;
  border-radius: 0 8px 8px 0;
}

.dialogue-content p {
  margin: 0 0 8px 0;
  font-size: 15px;
  font-style: italic;
  color: #2c2c2e;
}

.dialogue-speaker {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

/* 空状态 */
.empty-scene,
.empty-storyboard {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #999;
  padding: 40px;
}

.empty-scene p,
.empty-storyboard p {
  margin: 0;
  font-size: 16px;
}

/* 播放控制栏 */
.player-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.9);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.control-buttons {
  display: flex;
  gap: 8px;
}

.control-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(120, 140, 130, 0.2);
  color: #4a5a52;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.control-btn:hover:not(:disabled) {
  background: rgba(120, 140, 130, 0.3);
  transform: scale(1.05);
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.play-btn {
  width: 48px;
  height: 48px;
  background: rgba(120, 140, 130, 0.3);
}

.progress-section {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  position: relative;
  cursor: pointer;
}

.progress-fill {
  height: 100%;
  background: #31b3a8;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-handle {
  position: absolute;
  top: -4px;
  width: 14px;
  height: 14px;
  background: #fff;
  border: 2px solid #3498db;
  border-radius: 50%;
  transform: translateX(-50%);
  cursor: pointer;
  transition: left 0.3s ease;
}

.progress-text {
  font-size: 13px;
  color: #666;
  min-width: 50px;
  text-align: center;
}

.playback-settings {
  display: flex;
  gap: 16px;
  align-items: center;
}

.speed-control,
.auto-play-control {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
}

.speed-control select {
  padding: 2px 6px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  background: white;
  font-size: 12px;
}

/* 内容侧边栏 */
.content-sidebar {
  width: 300px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.5);
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c2c2e;
}

.content-count {
  font-size: 12px;
  color: #666;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 8px;
  border-radius: 12px;
}

.content-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

/* 场景列表 */
.scene-list,
.storyboard-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.scene-item,
.storyboard-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.scene-item:hover,
.storyboard-item:hover {
  background: rgba(255, 255, 255, 0.5);
}

.scene-item.active,
.storyboard-item.active {
  background: rgba(120, 140, 130, 0.2);
  border: 1px solid rgba(120, 140, 130, 0.3);
}

.scene-thumbnail,
.storyboard-thumbnail {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  overflow: hidden;
  flex-shrink: 0;
}

.storyboard-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scene-info,
.storyboard-info {
  flex: 1;
  min-width: 0;
}

.scene-title,
.storyboard-title {
  font-size: 14px;
  font-weight: 500;
  color: #2c2c2e;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scene-meta,
.storyboard-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.scene-meta span,
.storyboard-meta span {
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 10px;
}

.empty-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 20px;
  color: #999;
}

.empty-list p {
  margin: 0;
  font-size: 14px;
}

/* 按钮样式 - 统一无渐变风格 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  padding: 0 16px;
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

.btn-secondary {
  background-color: #c8c8c8;
  color: #2c2c2e;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #d8d8d8;
}

.btn-primary {
  background-color: #7a9188;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background-color: #6a8178;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .preview-content {
    flex-direction: column;
  }
  
  .content-sidebar {
    width: 100%;
    height: 200px;
  }
  
  .player-controls {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .playback-settings {
    order: 3;
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .scene-content,
  .storyboard-content {
    padding: 16px;
  }
  
  .scene-header,
  .storyboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .character-list {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>