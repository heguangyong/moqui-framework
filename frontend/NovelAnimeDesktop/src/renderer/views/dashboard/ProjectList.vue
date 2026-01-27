<!-- ProjectList.vue - Project Grid Component -->
<template>
  <div class="project-list-container">
    <!-- 加载中状态 -->
    <div v-if="isLoading" class="project-loading-state">
      <div class="project-loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <!-- 有项目时显示列表 -->
    <div v-else-if="projects.length > 0" class="project-list-wrapper">
      <div class="project-grid">
        <div
          v-for="(project, index) in projects"
          :key="project.id || project.projectId || `project-${index}`"
          class="project-card-item"
          @click="handleProjectClick(project)"
        >
          <div class="project-card-header">
            <div class="project-card-icon">
              <component :is="icons.folder" :size="20" />
            </div>
            <div class="project-card-actions">
              <button
                class="project-delete-btn"
                @click.stop="handleDeleteClick($event, project)"
                title="删除项目"
              >
                <component :is="icons.trash" :size="16" />
              </button>
            </div>
            <div
              :class="['project-status-badge', `project-status-badge--${project.status || 'draft'}`]"
            >
              {{ getStatusLabel(project.status) }}
            </div>
          </div>
          <div class="project-card-name">{{ project.name || '未命名项目' }}</div>
          <div class="project-card-desc">{{ project.description || '暂无描述' }}</div>
          <div class="project-card-footer">
            <span class="project-card-date">{{ formatProjectDate(project.updatedAt || project.createdAt) }}</span>
          </div>
        </div>
      </div>

      <!-- 删除确认对话框 -->
      <div v-if="showDeleteConfirm" class="modal-overlay" @click="cancelDelete">
        <div class="confirm-dialog" @click.stop>
          <div class="dialog-header">
            <h3>确认删除</h3>
          </div>
          <div class="dialog-body">
            <p>确定要删除项目 "{{ projectToDelete?.name }}" 吗？此操作无法撤销。</p>
          </div>
          <div class="dialog-footer">
            <button class="btn btn-secondary" @click="cancelDelete">取消</button>
            <button class="btn btn-danger" @click="confirmDelete">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="project-empty-state">
      <div class="project-empty-icon">
        <component :is="icons.folder" :size="48" />
      </div>
      <div class="project-empty-title">暂无项目</div>
      <div class="project-empty-desc">返回仪表盘创建您的第一个项目</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useProjectStore } from '../../stores/project';
import { useUIStore } from '../../stores/ui.js';
import { icons } from '../../utils/icons.js';

// Emits
const emit = defineEmits<{
  (e: 'open-project', project: any): void;
  (e: 'project-deleted', projectId: string): void;
}>();

// Stores
const projectStore = useProjectStore();
const uiStore = useUIStore();

// State
const projects = computed(() => projectStore.projects);
const isLoading = computed(() => projectStore.isLoading);
const showDeleteConfirm = ref(false);
const projectToDelete = ref<any>(null);

// 组件挂载时从 API 加载项目
onMounted(async () => {
  console.log('📋 ProjectList mounted, fetching projects...');
  await projectStore.fetchProjects();
  console.log('📋 Projects loaded:', projectStore.projects.length);
  console.log('📋 Projects data:', JSON.stringify(projectStore.projects, null, 2));

  // 检查是否有重复的 ID
  const ids = projectStore.projects.map((p) => p.id || p.projectId);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    console.warn('⚠️ 发现重复的项目ID！', ids);
  }
});

// 获取状态标签
function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: '草稿',
    processing: '处理中',
    completed: '已完成',
    active: '进行中',
    imported: '已导入',
    parsed: '已解析',
    analyzing: '分析中',
    characters_confirmed: '角色已确认',
    characters_continue: '角色确认中',
    generating: '生成中',
  };
  return labels[status] || status || '草稿';
}

// 格式化项目日期
function formatProjectDate(date: string | Date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN');
}

// 点击项目
function handleProjectClick(project: any) {
  console.log('📋 ProjectList: handleProjectClick', project);
  emit('open-project', project);
}

// 删除项目
function handleDeleteClick(event: Event, project: any) {
  event.stopPropagation(); // 阻止触发项目点击
  projectToDelete.value = project;
  showDeleteConfirm.value = true;
}

// 确认删除
async function confirmDelete() {
  if (projectToDelete.value) {
    // Check authentication before attempting delete
    const token = localStorage.getItem('novel_anime_access_token');
    if (!token) {
      console.warn('⚠️ User not authenticated, cannot delete project');
      uiStore.addNotification({
        type: 'error',
        title: '未登录',
        message: '请先登录后再删除项目。删除操作需要用户认证。',
        timeout: 5000,
      });
      showDeleteConfirm.value = false;
      projectToDelete.value = null;
      return;
    }

    console.log('🗑️ Confirming delete for project:', projectToDelete.value);
    const projectId = projectToDelete.value.id || projectToDelete.value.projectId;
    console.log('🗑️ Project ID to delete:', projectId);

    const success = await projectStore.deleteProject(projectId);

    if (success) {
      console.log('✅ Delete successful');
      uiStore.addNotification({
        type: 'success',
        title: '删除成功',
        message: `项目 "${projectToDelete.value.name}" 已删除`,
        timeout: 2000,
      });

      // 刷新项目列表
      await projectStore.fetchProjects();

      // 通知父组件项目已删除
      emit('project-deleted', projectId);
    } else {
      console.error('❌ Delete failed, error:', projectStore.error);

      // Check if error is auth-related
      const errorMsg = projectStore.error || '';
      const isAuthError = errorMsg.includes('not authorized') || errorMsg.includes('No User');

      uiStore.addNotification({
        type: 'error',
        title: '删除失败',
        message: isAuthError
          ? '权限不足：请确保已登录并有删除权限'
          : projectStore.error || '无法删除项目，请重试',
        timeout: 5000,
      });
    }
  }
  showDeleteConfirm.value = false;
  projectToDelete.value = null;
}

// 取消删除
function cancelDelete() {
  showDeleteConfirm.value = false;
  projectToDelete.value = null;
}
</script>

<style scoped>
.project-list-container {
  padding: 0;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.project-card-item {
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.project-card-item:hover {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.project-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  position: relative;
}

.project-card-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(100, 140, 120, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5a7a62;
}

.project-card-actions {
  position: absolute;
  top: 0;
  right: 0;
  opacity: 0;
  transition: opacity 0.2s;
}

.project-card-item:hover .project-card-actions {
  opacity: 1;
}

.project-delete-btn {
  background: rgba(239, 68, 68, 0.1);
  border: none;
  border-radius: 6px;
  padding: 6px;
  cursor: pointer;
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.project-delete-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: scale(1.1);
}

.project-status-badge {
  font-size: 10px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.06);
  color: #6c6c6e;
}

.project-status-badge--draft {
  background: rgba(100, 116, 139, 0.15);
  color: #64748b;
}
.project-status-badge--processing {
  background: rgba(217, 119, 6, 0.15);
  color: #d97706;
}
.project-status-badge--completed {
  background: rgba(5, 150, 105, 0.15);
  color: #059669;
}
.project-status-badge--active {
  background: rgba(37, 99, 235, 0.15);
  color: #2563eb;
}
.project-status-badge--imported {
  background: rgba(79, 70, 229, 0.15);
  color: #4f46e5;
}
.project-status-badge--parsed {
  background: rgba(219, 39, 119, 0.15);
  color: #db2777;
}
.project-status-badge--analyzing {
  background: rgba(217, 119, 6, 0.15);
  color: #d97706;
}
.project-status-badge--characters_confirmed {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}
.project-status-badge--characters_continue {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}
.project-status-badge--generating {
  background: rgba(234, 88, 12, 0.15);
  color: #ea580c;
}

.project-card-name {
  font-size: 15px;
  font-weight: 600;
  color: #2c2c2e;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-card-desc {
  font-size: 12px;
  color: #7a7a7c;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.project-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-card-date {
  font-size: 11px;
  color: #9a9a9c;
}

/* 空状态 */
.project-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.project-empty-icon {
  color: #b0b0b2;
  margin-bottom: 16px;
  opacity: 0.5;
}

.project-empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #5a5a5c;
  margin-bottom: 8px;
}

.project-empty-desc {
  font-size: 13px;
  color: #8a8a8c;
}

/* 加载状态 */
.project-loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 12px;
  color: #6c6c6e;
}

.project-loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(100, 140, 120, 0.2);
  border-top-color: rgba(100, 140, 120, 0.8);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Modal Overlay */
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
  backdrop-filter: blur(4px);
}

/* Confirm Dialog */
.confirm-dialog {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  min-width: 400px;
  max-width: 500px;
  overflow: hidden;
  animation: dialogFadeIn 0.2s ease-out;
}

@keyframes dialogFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Dialog Header */
.dialog-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c2c2e;
}

/* Dialog Body */
.dialog-body {
  padding: 24px;
}

.dialog-body p {
  margin: 0;
  font-size: 14px;
  color: #5a5a5c;
  line-height: 1.6;
}

/* Dialog Footer */
.dialog-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Button Base Styles */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  min-width: 80px;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn:active {
  transform: translateY(0);
}

/* Secondary Button (Cancel) */
.btn-secondary {
  background: #e5e5e7;
  color: #2c2c2e;
}

.btn-secondary:hover {
  background: #d1d1d6;
}

/* Danger Button (Delete) */
.btn-danger {
  background: #ef4444;
  color: #ffffff;
}

.btn-danger:hover {
  background: #dc2626;
}
</style>
