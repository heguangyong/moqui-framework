<template>
  <div v-if="projects.length > 0" class="recent-projects-section">
    <h3 class="section-title">最近项目</h3>
    <div class="project-list">
      <div 
        v-for="project in projects" 
        :key="project.id"
        class="project-item"
        @click="handleOpenProject(project)"
      >
        <div class="project-icon-small">
          <component :is="icons.fileText" :size="16" />
        </div>
        <div class="project-item-info">
          <span class="project-name">{{ project.name }}</span>
          <span class="project-date">{{ formatDate(project.updatedAt) }}</span>
        </div>
        <component :is="icons.chevronRight" :size="16" class="project-arrow" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { FileText, ChevronRight } from 'lucide-vue-next';

// Icons
const icons = {
  fileText: FileText,
  chevronRight: ChevronRight
};

// Props
const props = defineProps({
  projects: {
    type: Array,
    required: true,
    default: () => []
  }
});

// Emits
const emit = defineEmits(['open-project']);

// 格式化日期
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  
  if (diff < 86400000) {
    return '今天';
  } else if (diff < 172800000) {
    return '昨天';
  }
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

// Event handler
function handleOpenProject(project) {
  emit('open-project', project);
}
</script>

<style scoped>
/* 最近项目列表 */
.recent-projects-section {
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 16px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #7a7a7c;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.project-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.project-item:hover {
  background: rgba(255, 255, 255, 0.5);
  border-color: rgba(0, 0, 0, 0.08);
}

.project-icon-small {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7a7a7c;
}

.project-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.project-name {
  font-size: 13px;
  font-weight: 500;
  color: #2c2c2e;
}

.project-date {
  font-size: 11px;
  color: #8a8a8c;
}

.project-arrow {
  color: #b0b0b2;
}
</style>
