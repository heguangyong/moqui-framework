<template>
  <div class="recently-edited-view">
    <!-- 视图头部 -->
    <ViewHeader 
      title="最近编辑" 
      subtitle="查看最近编辑的文件和项目"
      :showRefreshButton="true"
      @refresh="handleRefresh"
    />
    
    <!-- 内容区域 -->
    <div class="content">
      <!-- 有记录时显示列表 -->
      <div v-if="recentItems.length > 0" class="recent-list">
        <div 
          v-for="item in recentItems" 
          :key="item.id"
          class="recent-item"
          @click="handleOpenItem(item)"
        >
          <div class="item-icon" :class="`item-icon--${item.type}`">
            <component :is="getItemIcon(item.type)" :size="18" />
          </div>
          <div class="item-content">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-path">{{ item.path || item.projectName || '根目录' }}</div>
          </div>
          <div class="item-time">{{ formatTime(item.editedAt) }}</div>
        </div>
      </div>
      
      <!-- 无记录时显示空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">
          <component :is="icons.clock" :size="48" />
        </div>
        <h3 class="empty-title">暂无最近编辑</h3>
        <p class="empty-description">当您编辑文件或项目后，它们将显示在这里</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFileStore } from '../stores/file.js';
import { useUIStore } from '../stores/ui.js';
import { icons } from '../utils/icons.js';
import ViewHeader from '../components/ui/ViewHeader.vue';

const router = useRouter();
const fileStore = useFileStore();
const uiStore = useUIStore();

const recentItems = ref([]);

onMounted(() => {
  loadRecentItems();
});

function loadRecentItems() {
  // 从 fileStore 获取最近编辑的文件
  const files = fileStore.recentFiles || [];
  recentItems.value = files.slice(0, 20);
}

function getItemIcon(type) {
  const iconMap = {
    novel: icons.fileText,
    script: icons.file,
    storyboard: icons.image,
    video: icons.video,
    folder: icons.folder,
    file: icons.file
  };
  return iconMap[type] || icons.file;
}

function formatTime(time) {
  if (!time) return '';
  const date = new Date(time);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
  return date.toLocaleDateString('zh-CN');
}

function handleOpenItem(item) {
  uiStore.addNotification({
    type: 'info',
    title: '打开文件',
    message: `正在打开: ${item.name}`,
    timeout: 2000
  });
  
  if (item.type === 'folder') {
    router.push('/files');
  } else {
    router.push(`/edit/${item.type}/${item.id}`);
  }
}

function handleRefresh() {
  loadRecentItems();
  uiStore.addNotification({
    type: 'success',
    title: '刷新完成',
    message: '最近编辑列表已刷新',
    timeout: 2000
  });
}
</script>

<style scoped>
.recently-edited-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  padding: 0 24px 24px;
  overflow-y: auto;
}

/* 最近编辑列表 */
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.recent-item:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateX(4px);
}

.item-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.item-icon--novel { background: #7a7a7a; }
.item-icon--script { background: #27ae60; }
.item-icon--storyboard { background: #e67e22; }
.item-icon--video { background: #e74c3c; }
.item-icon--folder { background: #8a8a8a; }
.item-icon--file { background: #9b9b9b; }

.item-content {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  color: #2c2c2e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-path {
  font-size: 12px;
  color: #8a8a8c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-time {
  font-size: 12px;
  color: #a0a0a2;
  flex-shrink: 0;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  color: #b0b0b0;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #4a4a4c;
  margin: 0 0 8px 0;
}

.empty-description {
  font-size: 14px;
  color: #8a8a8c;
  margin: 0;
}
</style>
