<template>
  <div class="workflow-templates-view">
    <!-- 单个模板详情视图 -->
    <template v-if="templateId && currentTemplate">
      <ViewHeader 
        :title="currentTemplate.name" 
        :subtitle="currentTemplate.description || '模板详情'"
      >
        <template #actions>
          <button class="btn btn-primary" @click="useCurrentTemplate">
            使用此模板
          </button>
        </template>
      </ViewHeader>
      
      <div class="view-content">
        <div class="template-detail">
          <!-- 模板信息卡片 -->
          <div class="info-card">
            <div class="card-header">
              <component :is="icons.layers" :size="24" />
              <h3>{{ currentTemplate.name }}</h3>
            </div>
            <div class="card-body">
              <div class="info-row">
                <span class="label">描述</span>
                <span class="value">{{ currentTemplate.description || '暂无描述' }}</span>
              </div>
              <div class="info-row">
                <span class="label">节点数量</span>
                <span class="value">{{ currentTemplate.nodeCount || 5 }} 个</span>
              </div>
              <div class="info-row">
                <span class="label">预计耗时</span>
                <span class="value">{{ currentTemplate.estimatedTime || '约 3-5 分钟' }}</span>
              </div>
              <div class="info-row">
                <span class="label">适用场景</span>
                <span class="value">{{ currentTemplate.useCase || '通用场景' }}</span>
              </div>
            </div>
          </div>
          
          <!-- 模板包含的节点 -->
          <div class="section">
            <h4>包含节点</h4>
            <div class="node-list">
              <div v-for="node in currentTemplate.nodes" :key="node.id" class="node-item">
                <span class="node-icon">{{ node.icon }}</span>
                <span class="node-name">{{ node.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    
    <!-- 模板列表视图 -->
    <template v-else>
      <ViewHeader 
        title="工作流模板" 
        subtitle="选择模板快速创建工作流"
      >
        <template #actions>
          <button class="btn btn-primary" @click="createTemplate">
            创建模板
          </button>
        </template>
      </ViewHeader>
      
      <div class="view-content">
        <EmptyState 
          v-if="templates.length === 0"
          icon="layers"
          title="暂无模板"
          description="还没有创建任何工作流模板"
          actionText="创建第一个模板"
          @action="createTemplate"
        />
        
        <div v-else class="templates-grid">
          <div 
            v-for="template in templates" 
            :key="template.id"
            class="template-card"
            :class="{ 'template-card--active': isFirstTemplate(template.id) }"
            @click="viewTemplate(template)"
          >
            <div class="template-icon">
              <component :is="icons.layers" :size="32" />
            </div>
            <div class="template-info">
              <h4>{{ template.name }}</h4>
              <p>{{ template.description || '暂无描述' }}</p>
            </div>
            <div class="template-actions">
              <button class="btn btn-small" @click.stop="useTemplate(template)">使用</button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUIStore } from '../stores/ui.js';
import { icons } from '../utils/icons.js';
import ViewHeader from '../components/ui/ViewHeader.vue';
import EmptyState from '../components/ui/EmptyState.vue';

const route = useRoute();
const router = useRouter();
const uiStore = useUIStore();

const templateId = computed(() => route.params.id);

// 模拟数据
const templates = ref([
  { 
    id: 't1', 
    name: '标准转换流程', 
    description: '小说到视频的标准转换流程',
    nodeCount: 5,
    estimatedTime: '约 5-10 分钟',
    useCase: '完整的小说转视频流程',
    nodes: [
      { id: 'n1', name: '小说解析器', icon: '📖' },
      { id: 'n2', name: '角色分析器', icon: '👤' },
      { id: 'n3', name: '场景生成器', icon: '🎬' },
      { id: 'n4', name: '脚本转换器', icon: '📝' },
      { id: 'n5', name: '视频生成器', icon: '🎥' }
    ]
  },
  { 
    id: 't2', 
    name: '快速预览流程', 
    description: '快速生成预览视频',
    nodeCount: 3,
    estimatedTime: '约 1-2 分钟',
    useCase: '快速预览效果',
    nodes: [
      { id: 'n1', name: '小说解析器', icon: '📖' },
      { id: 'n2', name: '场景生成器', icon: '🎬' },
      { id: 'n3', name: '视频生成器', icon: '🎥' }
    ]
  },
  { 
    id: 't3', 
    name: '高质量输出', 
    description: '高质量视频输出流程',
    nodeCount: 6,
    estimatedTime: '约 15-20 分钟',
    useCase: '最终成品输出',
    nodes: [
      { id: 'n1', name: '小说解析器', icon: '📖' },
      { id: 'n2', name: '角色分析器', icon: '👤' },
      { id: 'n3', name: '场景生成器', icon: '🎬' },
      { id: 'n4', name: '脚本转换器', icon: '📝' },
      { id: 'n5', name: '画质增强器', icon: '✨' },
      { id: 'n6', name: '视频生成器', icon: '🎥' }
    ]
  }
]);

const currentTemplate = computed(() => {
  if (!templateId.value) return null;
  return templates.value.find(t => t.id === templateId.value) || null;
});

function isFirstTemplate(id) {
  return templates.value.length > 0 && templates.value[0].id === id;
}

function createTemplate() {
  uiStore.addNotification({
    type: 'info',
    title: '创建模板',
    message: '正在打开模板创建向导',
    timeout: 2000
  });
}

function viewTemplate(template) {
  router.push(`/workflow/templates/${template.id}`);
}

function useTemplate(template) {
  uiStore.addNotification({
    type: 'info',
    title: template.name,
    message: '正在使用模板创建工作流',
    timeout: 2000
  });
  router.push('/workflow/new');
}

function useCurrentTemplate() {
  if (currentTemplate.value) {
    useTemplate(currentTemplate.value);
  }
}
</script>

<style scoped>
.workflow-templates-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.view-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}



.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.template-card {
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  background: linear-gradient(90deg, rgba(210, 210, 210, 0.3), rgba(200, 218, 212, 0.25));
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-card:hover {
  background: linear-gradient(90deg, rgba(210, 210, 210, 0.4), rgba(200, 218, 212, 0.35));
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.template-icon {
  color: #6a6a6a;
  margin-bottom: 0.75rem;
}

.template-info {
  flex: 1;
  margin-bottom: 1rem;
}

.template-info h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #2c2c2e;
}

.template-info p {
  margin: 0;
  font-size: 0.85rem;
  color: #6a6a6a;
  line-height: 1.4;
}

.template-actions {
  display: flex;
  justify-content: flex-end;
}

.btn {
  height: 28px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
  background: linear-gradient(90deg, rgba(180, 180, 180, 0.5), rgba(200, 218, 212, 0.4));
  color: #2c2c2e;
}

.btn:hover {
  background: linear-gradient(90deg, rgba(180, 180, 180, 0.6), rgba(200, 218, 212, 0.5));
}

.btn-primary {
  background: linear-gradient(90deg, rgba(150, 150, 150, 0.7), rgba(180, 198, 192, 0.6));
}

.btn-small {
  height: 24px;
  padding: 0 10px;
  font-size: 11px;
}

/* 模板详情样式 */
.template-detail {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-card {
  background: linear-gradient(90deg, rgba(210, 210, 210, 0.3), rgba(200, 218, 212, 0.25));
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 10px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  color: #6a6a6a;
}

.card-header h3 {
  flex: 1;
  margin: 0;
  font-size: 1.1rem;
  color: #2c2c2e;
}

.card-body {
  padding: 1rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.info-row:last-child {
  border-bottom: none;
}

.info-row .label {
  color: #7a7a7a;
  font-size: 0.9rem;
}

.info-row .value {
  color: #2c2c2e;
  font-size: 0.9rem;
}

.section {
  background: linear-gradient(90deg, rgba(210, 210, 210, 0.2), rgba(200, 218, 212, 0.15));
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  padding: 1rem;
}

.section h4 {
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
  color: #5a5a5c;
}

.node-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  font-size: 0.85rem;
  color: #2c2c2e;
}

.node-icon {
  font-size: 1rem;
}

/* 第一个模板高亮 */
.template-card--active {
  background: linear-gradient(90deg, rgba(210, 210, 210, 0.5), rgba(200, 218, 212, 0.4));
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
