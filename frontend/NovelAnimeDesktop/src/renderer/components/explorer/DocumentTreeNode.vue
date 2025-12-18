<template>
  <div class="tree-node-wrapper">
    <div 
      class="tree-item"
      :class="{
        'tree-item--folder': node.type === 'folder',
        'tree-item--file': node.type === 'file',
        'tree-item--expanded': isExpanded,
        'tree-item--selected': isSelected
      }"
      :style="{ paddingLeft: (depth * 12 + 8) + 'px' }"
      @click="handleClick"
      @contextmenu.prevent.stop="handleContextMenu"
    >
      <!-- 展开/折叠图标 -->
      <component 
        v-if="node.type === 'folder'"
        :is="isExpanded ? icons.chevronDown : icons.chevronRight" 
        :size="12" 
        class="tree-chevron"
        @click.stop="handleToggle"
      />
      <div v-else class="tree-spacer"></div>
      
      <!-- 文件/文件夹图标 -->
      <component 
        :is="nodeIcon" 
        :size="16" 
        :class="['tree-icon', iconColorClass]"
      />
      
      <!-- 名称 -->
      <span class="tree-name">{{ node.name }}</span>
      
      <!-- 计数徽章 -->
      <span v-if="showCount" class="item-count">{{ nodeCount }}</span>
    </div>
    
    <!-- 子节点 -->
    <div v-if="isExpanded && node.children && node.children.length > 0" class="tree-children">
      <DocumentTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
        :expanded-folders="expandedFolders"
        :selected-node="selectedNode"
        @toggle="$emit('toggle', $event)"
        @select="$emit('select', $event)"
        @contextmenu="$emit('contextmenu', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { icons } from '../../utils/icons.js';

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  depth: {
    type: Number,
    default: 0
  },
  expandedFolders: {
    type: Array,
    default: () => []
  },
  selectedNode: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['toggle', 'select', 'contextmenu']);

// 计算属性
const isExpanded = computed(() => {
  return props.expandedFolders.includes(props.node.id);
});

const isSelected = computed(() => {
  return props.selectedNode?.id === props.node.id;
});

const nodeIcon = computed(() => {
  if (props.node.type === 'folder') {
    return isExpanded.value ? icons.folderOpen : icons.folder;
  }
  
  // 根据文件类型返回不同图标
  const fileType = props.node.fileType || getFileTypeFromName(props.node.name);
  switch (fileType) {
    case 'novel':
      return icons.fileText;
    case 'script':
      return icons.file;
    case 'storyboard':
      return icons.image;
    case 'video':
      return icons.video;
    default:
      return icons.fileText;
  }
});

const iconColorClass = computed(() => {
  if (props.node.type === 'folder') {
    return 'tree-icon--folder';
  }
  
  const fileType = props.node.fileType || getFileTypeFromName(props.node.name);
  switch (fileType) {
    case 'novel':
      return 'tree-icon--novel';
    case 'script':
      return 'tree-icon--script';
    case 'storyboard':
      return 'tree-icon--storyboard';
    case 'video':
      return 'tree-icon--video';
    default:
      return 'tree-icon--default';
  }
});

const showCount = computed(() => {
  return props.node.type === 'folder' && (props.node.count > 0 || (props.node.children && props.node.children.length > 0));
});

const nodeCount = computed(() => {
  if (props.node.count !== undefined) {
    return props.node.count;
  }
  return props.node.children ? props.node.children.length : 0;
});

// 方法
function handleClick() {
  emit('select', props.node);
}

function handleToggle() {
  if (props.node.type === 'folder') {
    emit('toggle', props.node.id);
  }
}

function handleContextMenu(event) {
  emit('contextmenu', { node: props.node, event });
}

function getFileTypeFromName(name) {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'txt':
    case 'md':
      return 'novel';
    case 'json':
    case 'script':
      return 'script';
    case 'png':
    case 'jpg':
    case 'jpeg':
      return 'storyboard';
    case 'mp4':
    case 'avi':
    case 'mov':
      return 'video';
    default:
      return 'other';
  }
}
</script>

<style scoped>
.tree-node-wrapper {
  display: flex;
  flex-direction: column;
}

.tree-item {
  display: flex;
  align-items: center;
  padding: 5px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  gap: 6px;
  font-size: 12px;
  color: #2c2c2e;
  user-select: none;
}

.tree-item:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.tree-item--selected {
  background-color: rgba(80, 80, 80, 0.15);
}

.tree-item--folder {
  font-weight: 500;
}

.tree-item--folder.tree-item--expanded {
  background-color: rgba(80, 80, 80, 0.1);
}

.tree-item--file {
  color: #4c4c50;
}

.tree-chevron {
  color: #8e8e93;
  cursor: pointer;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.tree-item--expanded .tree-chevron {
  transform: rotate(0deg);
}

.tree-spacer {
  width: 12px;
  flex-shrink: 0;
}

.tree-icon {
  flex-shrink: 0;
}

.tree-icon--folder {
  color: #f5a623;
}

.tree-icon--novel {
  color: #4a90d9;
}

.tree-icon--script {
  color: #7ed321;
}

.tree-icon--storyboard {
  color: #bd10e0;
}

.tree-icon--video {
  color: #d0021b;
}

.tree-icon--default {
  color: #8e8e93;
}

.tree-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-count {
  background-color: #b0b0b0;
  color: #5a5a5c;
  font-size: 10px;
  font-weight: 600;
  width: 18px;
  height: 18px;
  min-width: 18px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 1;
}

.tree-children {
  display: flex;
  flex-direction: column;
}
</style>
