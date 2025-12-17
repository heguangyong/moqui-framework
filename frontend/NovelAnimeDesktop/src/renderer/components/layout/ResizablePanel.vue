<template>
  <div
    class="resizable-panel"
    :class="[
      `panel-${position}`,
      { collapsed: collapsed }
    ]"
    :style="panelStyle"
  >
    <!-- Panel Header -->
    <div class="panel-header" v-if="showHeader">
      <div class="panel-title">
        <slot name="header">
          <span>{{ title }}</span>
        </slot>
      </div>
      <div class="panel-actions">
        <q-btn
          flat
          dense
          size="sm"
          :icon="collapsed ? 'expand_more' : 'expand_less'"
          @click="toggleCollapse"
        >
          <q-tooltip>{{ collapsed ? 'Expand' : 'Collapse' }}</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Panel Content -->
    <div class="panel-content" v-show="!collapsed">
      <slot></slot>
    </div>

    <!-- Resize Handle -->
    <div
      v-if="!collapsed && resizable"
      class="resize-handle"
      :class="`resize-${position}`"
      @mousedown="startResize"
    >
      <div class="resize-indicator"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

interface Props {
  position: 'left' | 'right' | 'top' | 'bottom';
  width?: number;
  height?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  collapsed?: boolean;
  resizable?: boolean;
  showHeader?: boolean;
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  width: 300,
  height: 200,
  minWidth: 100,
  maxWidth: 800,
  minHeight: 100,
  maxHeight: 600,
  collapsed: false,
  resizable: true,
  showHeader: false,
  title: ''
});

const emit = defineEmits<{
  'update:width': [width: number];
  'update:height': [height: number];
  'toggle-collapse': [];
  'resize-start': [];
  'resize-end': [];
}>();

// State
const isResizing = ref(false);
const startX = ref(0);
const startY = ref(0);
const startWidth = ref(0);
const startHeight = ref(0);

// Computed
const panelStyle = computed(() => {
  const style: Record<string, string> = {};
  
  if (props.collapsed) {
    if (props.position === 'left' || props.position === 'right') {
      style.width = '0px';
    } else {
      style.height = '0px';
    }
  } else {
    if (props.position === 'left' || props.position === 'right') {
      style.width = `${props.width}px`;
    } else {
      style.height = `${props.height}px`;
    }
  }
  
  return style;
});

// Methods
const toggleCollapse = () => {
  emit('toggle-collapse');
};

const startResize = (event: MouseEvent) => {
  if (!props.resizable) return;
  
  event.preventDefault();
  isResizing.value = true;
  startX.value = event.clientX;
  startY.value = event.clientY;
  startWidth.value = props.width;
  startHeight.value = props.height;
  
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
  document.body.style.cursor = getCursor();
  document.body.style.userSelect = 'none';
  
  emit('resize-start');
};

const handleResize = (event: MouseEvent) => {
  if (!isResizing.value) return;
  
  const deltaX = event.clientX - startX.value;
  const deltaY = event.clientY - startY.value;
  
  if (props.position === 'left') {
    const newWidth = Math.max(
      props.minWidth,
      Math.min(props.maxWidth, startWidth.value + deltaX)
    );
    emit('update:width', newWidth);
  } else if (props.position === 'right') {
    const newWidth = Math.max(
      props.minWidth,
      Math.min(props.maxWidth, startWidth.value - deltaX)
    );
    emit('update:width', newWidth);
  } else if (props.position === 'top') {
    const newHeight = Math.max(
      props.minHeight,
      Math.min(props.maxHeight, startHeight.value + deltaY)
    );
    emit('update:height', newHeight);
  } else if (props.position === 'bottom') {
    const newHeight = Math.max(
      props.minHeight,
      Math.min(props.maxHeight, startHeight.value - deltaY)
    );
    emit('update:height', newHeight);
  }
};

const stopResize = () => {
  if (!isResizing.value) return;
  
  isResizing.value = false;
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  
  emit('resize-end');
};

const getCursor = (): string => {
  switch (props.position) {
    case 'left':
    case 'right':
      return 'ew-resize';
    case 'top':
    case 'bottom':
      return 'ns-resize';
    default:
      return 'default';
  }
};

// Lifecycle
onMounted(() => {
  // Prevent text selection during resize
  document.addEventListener('selectstart', preventSelection);
});

onUnmounted(() => {
  document.removeEventListener('selectstart', preventSelection);
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
});

const preventSelection = (event: Event) => {
  if (isResizing.value) {
    event.preventDefault();
  }
};
</script>

<style scoped lang="scss">
.resizable-panel {
  position: relative;
  background: var(--q-background);
  border: 1px solid var(--q-separator);
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease, height 0.2s ease;
  
  &.collapsed {
    min-width: 0 !important;
    min-height: 0 !important;
    overflow: hidden;
  }
}

.panel-left {
  border-right: 1px solid var(--q-separator);
}

.panel-right {
  border-left: 1px solid var(--q-separator);
}

.panel-top {
  border-bottom: 1px solid var(--q-separator);
}

.panel-bottom {
  border-top: 1px solid var(--q-separator);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--q-background-secondary);
  border-bottom: 1px solid var(--q-separator);
  min-height: 36px;
}

.panel-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--q-text-primary);
}

.panel-actions {
  display: flex;
  gap: 4px;
}

.panel-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.resize-handle {
  position: absolute;
  background: transparent;
  z-index: 10;
  
  &:hover .resize-indicator {
    background: var(--q-primary);
    opacity: 0.6;
  }
  
  &:active .resize-indicator {
    background: var(--q-primary);
    opacity: 0.8;
  }
}

.resize-left {
  top: 0;
  right: -2px;
  width: 4px;
  height: 100%;
  cursor: ew-resize;
  
  .resize-indicator {
    width: 1px;
    height: 100%;
    background: var(--q-separator);
    margin: 0 auto;
    transition: all 0.2s;
  }
}

.resize-right {
  top: 0;
  left: -2px;
  width: 4px;
  height: 100%;
  cursor: ew-resize;
  
  .resize-indicator {
    width: 1px;
    height: 100%;
    background: var(--q-separator);
    margin: 0 auto;
    transition: all 0.2s;
  }
}

.resize-top {
  left: 0;
  bottom: -2px;
  width: 100%;
  height: 4px;
  cursor: ns-resize;
  
  .resize-indicator {
    width: 100%;
    height: 1px;
    background: var(--q-separator);
    margin: auto 0;
    transition: all 0.2s;
  }
}

.resize-bottom {
  left: 0;
  top: -2px;
  width: 100%;
  height: 4px;
  cursor: ns-resize;
  
  .resize-indicator {
    width: 100%;
    height: 1px;
    background: var(--q-separator);
    margin: auto 0;
    transition: all 0.2s;
  }
}

// Responsive behavior
@media (max-width: 768px) {
  .resizable-panel {
    &.panel-left,
    &.panel-right {
      position: absolute;
      top: 0;
      bottom: 0;
      z-index: 100;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
    }
    
    &.panel-left {
      left: 0;
    }
    
    &.panel-right {
      right: 0;
    }
  }
}
</style>