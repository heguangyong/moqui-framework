<template>
  <div class="context-panel">
    <!-- 用户信息区域（始终显示） -->
    <div class="user-section">
      <div class="user-avatar">
        <div class="avatar-circle">
          <component :is="icons.user" :size="18" />
        </div>
      </div>
      <div class="user-info">
        <div class="user-name">{{ userName }} <span class="dropdown-arrow">▾</span></div>
        <div class="user-email">{{ userEmail }}</div>
      </div>
    </div>
    
    <!-- 动态面板内容 -->
    <component 
      :is="currentPanelComponent" 
      v-bind="panelProps"
    />
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent } from 'vue';
import { useNavigationStore } from '../../stores/navigation.js';
import { icons } from '../../utils/icons.js';

// 异步加载面板组件
const DashboardPanel = defineAsyncComponent(() => import('./DashboardPanel.vue'));
const WorkflowContextPanel = defineAsyncComponent(() => import('./WorkflowContextPanel.vue'));
const AssetsPanel = defineAsyncComponent(() => import('./AssetsPanel.vue'));
const CharactersPanel = defineAsyncComponent(() => import('./CharactersPanel.vue'));
const SettingsPanel = defineAsyncComponent(() => import('./SettingsPanel.vue'));

// Props
const props = defineProps({
  userName: {
    type: String,
    default: 'John Doe'
  },
  userEmail: {
    type: String,
    default: 'user@example.com'
  }
});

// Navigation store
const navigationStore = useNavigationStore();

// 面板组件映射
const panelComponentMap = {
  dashboard: DashboardPanel,
  workflow: WorkflowContextPanel,
  assets: AssetsPanel,
  characters: CharactersPanel,
  settings: SettingsPanel
};

// 当前面板组件 - 需求 2.1-2.5
const currentPanelComponent = computed(() => {
  return panelComponentMap[navigationStore.activeNavId] || DashboardPanel;
});

// 面板属性
const panelProps = computed(() => {
  return navigationStore.currentPanelContext;
});
</script>

<style scoped>
.context-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* 用户信息区域 */
.user-section {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 10px;
  flex-shrink: 0;
}

.user-avatar {
  flex-shrink: 0;
}

.avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8a8a8a, #a0b0aa);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: #2c2c2e;
  margin-bottom: 1px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.dropdown-arrow {
  font-size: 10px;
  color: #6c6c6e;
}

.user-email {
  font-size: 11px;
  color: #6c6c6e;
}
</style>
