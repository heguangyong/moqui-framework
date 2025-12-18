<template>
  <div class="file-preview-view">
    <!-- 工具栏 -->
    <div class="preview-toolbar">
      <div class="toolbar-left">
        <button class="back-btn" @click="goBack">
          <component :is="icons.arrowLeft" :size="16" />
          <span>返回</span>
        </button>
        <div class="file-info">
          <component :is="getFileIcon(fileType)" :size="20" :class="`file-icon--${fileType}`" />
          <span class="file-name">{{ fileName }}</span>
        </div>
      </div>
      
      <div class="toolbar-right">
        <button 
          v-if="isEditable" 
          class="toolbar-btn"
          :class="{ 'toolbar-btn--active': isEditing }"
          @click="toggleEdit"
        >
          <component :is="icons.edit" :size="16" />
          <span>{{ isEditing ? '预览' : '编辑' }}</span>
        </button>
        <button class="toolbar-btn" @click="handleSave" v-if="isEditing">
          <component :is="icons.save" :size="16" />
          <span>保存</span>
        </button>
        <button class="toolbar-btn" @click="handleDownload">
          <component :is="icons.download" :size="16" />
          <span>下载</span>
        </button>
      </div>
    </div>
    
    <!-- 预览内容区域 -->
    <div class="preview-content">
      <!-- 小说文本预览 -->
      <div v-if="fileType === 'novel'" class="novel-preview">
        <div v-if="isEditing" class="editor-container">
          <textarea 
            v-model="editContent"
            class="text-editor"
            placeholder="输入小说内容..."
          ></textarea>
        </div>
        <div v-else class="novel-content">
          <div class="chapter-nav" v-if="chapters.length > 0">
            <h3>章节目录</h3>
            <ul class="chapter-list">
              <li 
                v-for="(chapter, index) in chapters" 
                :key="index"
                :class="{ 'chapter--active': currentChapter === index }"
                @click="goToChapter(index)"
              >
                {{ chapter.title }}
              </li>
            </ul>
          </div>
          <div class="novel-text">
            <h2 v-if="chapters[currentChapter]">{{ chapters[currentChapter].title }}</h2>
            <div class="text-content" v-html="formattedContent"></div>
          </div>
        </div>
      </div>
      
      <!-- 剧本预览 -->
      <div v-else-if="fileType === 'script'" class="script-preview">
        <div v-if="isEditing" class="editor-container">
          <textarea 
            v-model="editContent"
            class="text-editor script-editor"
            placeholder="输入剧本内容..."
          ></textarea>
        </div>
        <div v-else class="script-content">
          <div 
            v-for="(scene, index) in scriptScenes" 
            :key="index"
            class="script-scene"
          >
            <div class="scene-header">
              <span class="scene-number">场景 {{ index + 1 }}</span>
              <span class="scene-location">{{ scene.location }}</span>
            </div>
            <div class="scene-description">{{ scene.description }}</div>
            <div class="scene-dialogues">
              <div 
                v-for="(dialogue, dIndex) in scene.dialogues" 
                :key="dIndex"
                class="dialogue"
              >
                <span class="character-name">{{ dialogue.character }}</span>
                <span class="dialogue-text">{{ dialogue.text }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 分镜预览 -->
      <div v-else-if="fileType === 'storyboard'" class="storyboard-preview">
        <div class="storyboard-grid">
          <div 
            v-for="(frame, index) in storyboardFrames" 
            :key="index"
            class="storyboard-frame"
          >
            <div class="frame-image">
              <component :is="icons.image" :size="48" />
              <span>画面 {{ index + 1 }}</span>
            </div>
            <div class="frame-info">
              <div class="frame-duration">{{ frame.duration }}s</div>
              <div class="frame-description">{{ frame.description }}</div>
              <div class="frame-dialogue" v-if="frame.dialogue">
                "{{ frame.dialogue }}"
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 视频预览 -->
      <div v-else-if="fileType === 'video'" class="video-preview">
        <div class="video-player">
          <div class="video-placeholder">
            <component :is="icons.video" :size="64" />
            <span>视频预览</span>
          </div>
          <div class="video-controls">
            <button class="control-btn" @click="togglePlay">
              <component :is="isPlaying ? icons.pause : icons.play" :size="20" />
            </button>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progress + '%' }"></div>
            </div>
            <span class="time-display">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
            <button class="control-btn" @click="toggleFullscreen">
              <component :is="icons.maximize" :size="16" />
            </button>
          </div>
        </div>
        <div class="video-info">
          <div class="info-row">
            <span class="info-label">分辨率</span>
            <span class="info-value">1920 x 1080</span>
          </div>
          <div class="info-row">
            <span class="info-label">时长</span>
            <span class="info-value">{{ formatTime(duration) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">格式</span>
            <span class="info-value">MP4</span>
          </div>
        </div>
      </div>
      
      <!-- 默认预览 -->
      <div v-else class="default-preview">
        <component :is="icons.file" :size="64" />
        <h3>{{ fileName }}</h3>
        <p>无法预览此文件类型</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUIStore } from '../stores/ui.js';
import { icons } from '../utils/icons.js';

const router = useRouter();
const route = useRoute();
const uiStore = useUIStore();

// 状态
const isEditing = ref(false);
const editContent = ref('');
const currentChapter = ref(0);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(180);
const progress = ref(0);

// 从路由获取文件信息
const fileType = computed(() => route.params.type || 'novel');
const fileId = computed(() => route.params.id || '');
const fileName = computed(() => {
  const names = {
    novel: '示例小说.txt',
    script: '剧本文件.json',
    storyboard: '分镜脚本.json',
    video: '生成视频.mp4'
  };
  return names[fileType.value] || '未知文件';
});

const isEditable = computed(() => ['novel', 'script'].includes(fileType.value));

// 模拟章节数据
const chapters = ref([
  { title: '第一章 初遇', content: '这是第一章的内容...' },
  { title: '第二章 冒险开始', content: '这是第二章的内容...' },
  { title: '第三章 危机四伏', content: '这是第三章的内容...' }
]);

// 模拟剧本场景
const scriptScenes = ref([
  {
    location: '城市街道 - 白天',
    description: '繁忙的城市街道，人来人往。',
    dialogues: [
      { character: '李明', text: '今天的天气真好啊。' },
      { character: '王芳', text: '是啊，很适合出门。' }
    ]
  },
  {
    location: '咖啡厅 - 下午',
    description: '安静的咖啡厅，阳光透过窗户洒进来。',
    dialogues: [
      { character: '李明', text: '你最近在忙什么？' },
      { character: '王芳', text: '在准备一个重要的项目。' }
    ]
  }
]);

// 模拟分镜数据
const storyboardFrames = ref([
  { duration: 3, description: '远景：城市全景', dialogue: '' },
  { duration: 2, description: '中景：主角走在街上', dialogue: '' },
  { duration: 4, description: '近景：主角表情特写', dialogue: '今天的天气真好啊' },
  { duration: 3, description: '双人镜头：两人对话', dialogue: '是啊，很适合出门' }
]);

// 格式化内容
const formattedContent = computed(() => {
  if (chapters.value[currentChapter.value]) {
    return chapters.value[currentChapter.value].content.replace(/\n/g, '<br>');
  }
  return '';
});

// 方法
function goBack() {
  router.back();
}

function toggleEdit() {
  if (!isEditing.value) {
    editContent.value = chapters.value[currentChapter.value]?.content || '';
  }
  isEditing.value = !isEditing.value;
}

function handleSave() {
  if (chapters.value[currentChapter.value]) {
    chapters.value[currentChapter.value].content = editContent.value;
  }
  isEditing.value = false;
  uiStore.addNotification({
    type: 'success',
    title: '保存成功',
    message: '文件已保存',
    timeout: 2000
  });
}

function handleDownload() {
  uiStore.addNotification({
    type: 'info',
    title: '下载文件',
    message: '正在准备下载...',
    timeout: 2000
  });
}

function goToChapter(index) {
  currentChapter.value = index;
}

function togglePlay() {
  isPlaying.value = !isPlaying.value;
}

function toggleFullscreen() {
  uiStore.addNotification({
    type: 'info',
    title: '全屏模式',
    message: '进入全屏播放',
    timeout: 2000
  });
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getFileIcon(type) {
  const iconMap = {
    novel: icons.fileText,
    script: icons.file,
    storyboard: icons.image,
    video: icons.video
  };
  return iconMap[type] || icons.file;
}

onMounted(() => {
  // 初始化编辑内容
  if (chapters.value[0]) {
    editContent.value = chapters.value[0].content;
  }
});
</script>

<style scoped>
.file-preview-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 工具栏 */
.preview-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 6px;
  color: #4a4a4c;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon--novel { color: #6a6a6a; }
.file-icon--script { color: #27ae60; }
.file-icon--storyboard { color: #e67e22; }
.file-icon--video { color: #e74c3c; }

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #2c2c2e;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 6px;
  color: #4a4a4c;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.toolbar-btn--active {
  background: linear-gradient(90deg, rgba(150, 150, 150, 0.9), rgba(180, 198, 192, 0.8));
  color: #fff;
}

/* 预览内容 */
.preview-content {
  flex: 1;
  overflow: hidden;
}

/* 小说预览 */
.novel-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.novel-content {
  display: flex;
  height: 100%;
  gap: 20px;
}

.chapter-nav {
  width: 200px;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  padding: 16px;
  overflow-y: auto;
}

.chapter-nav h3 {
  font-size: 14px;
  margin: 0 0 12px 0;
  color: #2c2c2e;
}

.chapter-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.chapter-list li {
  padding: 8px 12px;
  font-size: 13px;
  color: #4a4a4c;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.chapter-list li:hover {
  background: rgba(0, 0, 0, 0.05);
}

.chapter--active {
  background: linear-gradient(90deg, rgba(150, 150, 150, 0.9), rgba(180, 198, 192, 0.8)) !important;
  color: #fff !important;
}

.novel-text {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
}

.novel-text h2 {
  font-size: 20px;
  margin: 0 0 16px 0;
  color: #2c2c2e;
}

.text-content {
  font-size: 15px;
  line-height: 1.8;
  color: #3c3c3e;
}

.editor-container {
  height: 100%;
}

.text-editor {
  width: 100%;
  height: 100%;
  padding: 20px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: 15px;
  line-height: 1.8;
  resize: none;
  background: #fff;
}

.text-editor:focus {
  outline: none;
  border-color: #8a8a8a;
}

/* 剧本预览 */
.script-preview {
  height: 100%;
  overflow-y: auto;
}

.script-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 20px;
}

.script-scene {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  padding: 20px;
}

.scene-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.scene-number {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  background: linear-gradient(90deg, rgba(150, 150, 150, 0.9), rgba(180, 198, 192, 0.8));
  color: #fff;
  border-radius: 12px;
}

.scene-location {
  font-size: 14px;
  font-weight: 500;
  color: #2c2c2e;
}

.scene-description {
  font-size: 13px;
  color: #6c6c6e;
  font-style: italic;
  margin-bottom: 16px;
  padding-left: 12px;
  border-left: 3px solid #e0e0e0;
}

.scene-dialogues {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dialogue {
  display: flex;
  gap: 12px;
}

.character-name {
  font-size: 13px;
  font-weight: 600;
  color: #6a6a6a;
  min-width: 80px;
}

.dialogue-text {
  font-size: 14px;
  color: #2c2c2e;
}

/* 分镜预览 */
.storyboard-preview {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
}

.storyboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.storyboard-frame {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  overflow: hidden;
}

.frame-image {
  height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.05);
  color: #8a8a8c;
  gap: 8px;
}

.frame-info {
  padding: 12px;
}

.frame-duration {
  font-size: 12px;
  font-weight: 600;
  color: #6a6a6a;
  margin-bottom: 6px;
}

.frame-description {
  font-size: 13px;
  color: #2c2c2e;
  margin-bottom: 8px;
}

.frame-dialogue {
  font-size: 12px;
  color: #6c6c6e;
  font-style: italic;
}

/* 视频预览 */
.video-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.video-player {
  flex: 1;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.video-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
  gap: 12px;
}

.video-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
}

.control-btn {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 4px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  cursor: pointer;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8a8a8a, #a0b0aa);
  border-radius: 2px;
}

.time-display {
  font-size: 12px;
  color: #fff;
  min-width: 80px;
}

.video-info {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  padding: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 13px;
  color: #6c6c6e;
}

.info-value {
  font-size: 13px;
  font-weight: 500;
  color: #2c2c2e;
}

/* 默认预览 */
.default-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8a8a8c;
  gap: 12px;
}

.default-preview h3 {
  margin: 0;
  color: #4a4a4c;
}

.default-preview p {
  margin: 0;
  font-size: 13px;
}
</style>
