<template>
  <div class="panel-tabs" :class="`tabs-${position}`">
    <!-- Tab Headers -->
    <div class="tab-headers">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-header"
        :class="{ active: modelValue === tab.id }"
        @click="selectTab(tab.id)"
      >
        <q-icon :name="tab.icon" size="16px" />
        <span class="tab-label">{{ tab.label }}</span>
        <q-badge
          v-if="tab.badge"
          :color="tab.badgeColor || 'primary'"
          :label="tab.badge"
          class="tab-badge"
        />
      </div>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        v-show="modelValue === tab.id"
        class="tab-pane"
      >
        <slot :name="tab.id" :tab="tab">
          <div class="default-content">
            <p>No content available for {{ tab.label }}</p>
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Tab {
  id: string;
  label: string;
  icon: string;
  badge?: string | number;
  badgeColor?: string;
  disabled?: boolean;
}

interface Props {
  modelValue: string;
  tabs: Tab[];
  position?: 'left' | 'right' | 'top' | 'bottom';
}

const props = withDefaults(defineProps<Props>(), {
  position: 'left'
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'tab-changed': [tabId: string];
}>();

const selectTab = (tabId: string) => {
  const tab = props.tabs.find(t => t.id === tabId);
  if (tab && !tab.disabled) {
    emit('update:modelValue', tabId);
    emit('tab-changed', tabId);
  }
};
</script>

<style scoped lang="scss">
.panel-tabs {
  display: flex;
  height: 100%;
  background: var(--q-background);
}

.tabs-left,
.tabs-right {
  flex-direction: column;
}

.tabs-top,
.tabs-bottom {
  flex-direction: row;
}

.tab-headers {
  display: flex;
  background: var(--q-background-secondary);
  border-bottom: 1px solid var(--q-separator);
}

.tabs-left .tab-headers,
.tabs-right .tab-headers {
  flex-direction: column;
  border-bottom: none;
  border-right: 1px solid var(--q-separator);
  min-width: 200px;
}

.tabs-top .tab-headers,
.tabs-bottom .tab-headers {
  flex-direction: row;
  min-height: 40px;
}

.tab-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background: transparent;
  color: var(--q-text-secondary);
  font-size: 13px;
  white-space: nowrap;
  
  &:hover {
    background: var(--q-background-hover);
    color: var(--q-text-primary);
  }
  
  &.active {
    background: var(--q-background);
    color: var(--q-primary);
    font-weight: 500;
    
    .tabs-left &,
    .tabs-right & {
      border-right: 2px solid var(--q-primary);
    }
    
    .tabs-top &,
    .tabs-bottom & {
      border-bottom: 2px solid var(--q-primary);
    }
  }
  
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    
    &:hover {
      background: transparent;
      color: var(--q-text-secondary);
    }
  }
}

.tab-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-badge {
  font-size: 10px;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
}

.tab-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tab-pane {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.default-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--q-text-secondary);
  font-style: italic;
}

// Responsive adjustments
@media (max-width: 768px) {
  .tabs-left .tab-headers,
  .tabs-right .tab-headers {
    min-width: 150px;
  }
  
  .tab-header {
    padding: 10px 12px;
    font-size: 12px;
  }
  
  .tab-label {
    display: none;
  }
}

// Compact mode for narrow panels
.panel-tabs.compact {
  .tab-header {
    padding: 8px;
    justify-content: center;
  }
  
  .tab-label {
    display: none;
  }
  
  .tab-badge {
    position: absolute;
    top: 4px;
    right: 4px;
  }
}
</style>