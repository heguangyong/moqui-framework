<template>
  <div class="archive-view">
    <!-- 视图头部 -->
    <ViewHeader 
      title="归档" 
      subtitle="已归档的项目和文件"
      :showRefreshButton="true"
      @refresh="handleRefresh"
    />
    
    <!-- 内容区域 -->
    <div class="content">
      <!-- 有归档时显示列表 -->
      <div v-if="archivedItems.length > 0" class="archive-list">
        <div 
          v-for="item in archivedItems" 
          :key="item.id"
          class="archive-item"
        >
          <div class="item-icon" :class="`item-icon--${item.type}`">
            <component :is="getItemIcon(item.type)" :size="18" />
          </div>
          <div class="item-content">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-meta">
              <span>归档于 {{ formatDate(item.archivedAt) }}</span>
            </div>
          </div>
          <div class="item-actions">
            <button class="action-btn" @click="handleRestore(item)" title="恢复">
              <component :is="icons.refresh" :size="14" />
            </button>
            <button class="action-btn action-btn--danger" @click="handleDelete(item)" title="删除">
              <component :is="icons.trash" :size="14" />
            </button>
          </div>
        </div>
      </div>
      
      <!-- 无归档时显示空状态 -->
      <EmptyState 
        v-else
        icon="archive"
        title="暂无归档内容"
        description="当您归档项目或文件后，它们将显示在这里"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useFileStore } from '../stores/file.js';
import { useProjectStore } from '../stores/project.js';
import { useUIStore } from '../stores/ui.js';
import { icons } from '../utils/icons.js';
import ViewHeader from '../components/ui/ViewHeader.vue';
import EmptyState from '../components/ui/EmptyState.vue';

const fileStore = useFileStore();
const projectStore = useProjectStore();
const uiStore = useUIStore();

const archivedItems = ref([]);

onMounted(() => {
  loadArchivedItems();
});

function loadArchivedItems() {
  // 从 store 获取归档的项目和文件
  const archivedProjects = (projectStore.archivedProjects || []).map(p => ({
    ...p,
    type: 'project'
  }));
  const archivedFiles = (fileStore.archivedFiles || []).map(f => ({
    ...f,
    type: f.fileType || 'file'
  }));
  
  archivedItems.value = [...archivedProjects, ...archivedFiles].sort((a, b) => 
    new Date(b.archivedAt) - new Date(a.archivedAt)
  );
}

function getItemIcon(type) {
  const iconMap = {
    project: icons.folder,
    novel: icons.fileText,
    script: icons.file,
    storyboard: icons.image,
    video: icons.video,
    file: icons.file
  };
  return iconMap[type] || icons.file;
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN');
}

function handleRestore(item) {
  uiStore.addNotification({
    type: 'success',
    title: '恢复成功',
    message: `"${item.name}" 已恢复`,
    timeout: 2000
  });
  // 从列表中移除
  archivedItems.value = archivedItems.value.filter(i => i.id !== item.id);
}

function handleDelete(item) {
  if (confirm(`确定要永久删除 "${item.name}" 吗？此操作不可恢复。`)) {
    uiStore.addNotification({
      type: 'success',
      title: '删除成功',
      message: `"${item.name}" 已永久删除`,
      timeout: 2000
    });
    // 从列表中移除
    archivedItems.value = archivedItems.value.filter(i => i.id !== item.id);
  }
}

function handleRefresh() {
  loadArchivedItems();
  uiStore.addNotification({
    type: 'success',
    title: '刷新完成',
    message: '归档列表已刷新',
    timeout: 2000
  });
}
</script>

<style scoped>
.archive-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  padding: 0 24px 24px;
  overflow-y: auto;
}

/* 归档列表 */
.archive-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.archive-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  transition: all 0.2s;
}

.archive-item:hover {
  background: rgba(255, 255, 255, 0.2);
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
  opacity: 0.7;
}

.item-icon--project { background: #8a8a8a; }
.item-icon--novel { background: #7a7a7a; }
.item-icon--script { background: #27ae60; }
.item-icon--storyboard { background: #e67e22; }
.item-icon--video { background: #e74c3c; }
.item-icon--file { background: #9b9b9b; }

.item-content {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  color: #4a4a4c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-meta {
  font-size: 12px;
  color: #8a8a8c;
}

.item-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.3);
  color: #6a6a6a;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.5);
  color: #4a4a4a;
}

.action-btn--danger:hover {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
  border-color: rgba(220, 38, 38, 0.3);
}


</style>
