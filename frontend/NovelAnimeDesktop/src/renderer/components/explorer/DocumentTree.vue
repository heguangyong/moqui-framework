<template>
  <div class="document-tree-container">
    <!-- 搜索框 -->
    <div class="search-box">
      <component :is="icons.search" :size="16" class="search-icon" />
      <input 
        type="text" 
        placeholder="搜索" 
        class="search-input"
        v-model="searchQuery"
        @input="handleSearch"
      />
      <button 
        v-if="searchQuery" 
        class="search-clear"
        @click="clearSearch"
      >
        <component :is="icons.x" :size="14" />
      </button>
    </div>
    
    <!-- 文档树 -->
    <div class="document-tree" @contextmenu.prevent="handleTreeContextMenu">
      <template v-if="filteredTree.length > 0">
        <DocumentTreeNode
          v-for="node in filteredTree"
          :key="node.id"
          :node="node"
          :depth="0"
          :expanded-folders="expandedFolders"
          :selected-node="selectedNode"
          @toggle="handleToggle"
          @select="handleSelect"
          @contextmenu="handleNodeContextMenu"
        />
      </template>
      <div v-else class="tree-empty">
        <component :is="icons.folder" :size="24" />
        <span>{{ searchQuery ? '无匹配结果' : '暂无文件' }}</span>
      </div>
    </div>
    
    <!-- 右键菜单 -->
    <div 
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      @click.stop
    >
      <div 
        v-if="contextMenu.node?.type === 'file'"
        class="context-menu-item"
        @click="handleOpenFile"
      >
        <component :is="icons.fileText" :size="14" />
        <span>打开文件</span>
      </div>
      <div 
        v-if="contextMenu.node?.type === 'folder'"
        class="context-menu-item"
        @click="handleNewFile"
      >
        <component :is="icons.filePlus" :size="14" />
        <span>新建文件</span>
      </div>
      <div 
        v-if="contextMenu.node?.type === 'folder'"
        class="context-menu-item"
        @click="handleNewFolder"
      >
        <component :is="icons.folderPlus" :size="14" />
        <span>新建文件夹</span>
      </div>
      <div class="context-menu-divider" v-if="contextMenu.node"></div>
      <div 
        v-if="contextMenu.node"
        class="context-menu-item"
        @click="handleRename"
      >
        <component :is="icons.edit" :size="14" />
        <span>重命名</span>
      </div>
      <div 
        v-if="contextMenu.node"
        class="context-menu-item context-menu-item--danger"
        @click="handleDelete"
      >
        <component :is="icons.trash" :size="14" />
        <span>删除</span>
      </div>
      <div class="context-menu-divider"></div>
      <div 
        class="context-menu-item"
        @click="handleRefresh"
      >
        <component :is="icons.refresh" :size="14" />
        <span>刷新</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useFileStore } from '../../stores/file.js';
import { icons } from '../../utils/icons.js';
import DocumentTreeNode from './DocumentTreeNode.vue';

const emit = defineEmits(['select', 'open', 'create', 'delete']);

const fileStore = useFileStore();

// 本地状态
const searchQuery = ref('');
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  node: null
});

// 计算属性
const filteredTree = computed(() => fileStore.filteredFileTree);
const expandedFolders = computed(() => fileStore.expandedFolders);
const selectedNode = computed(() => fileStore.selectedNode);

// 搜索处理
function handleSearch() {
  fileStore.setSearchQuery(searchQuery.value);
}

function clearSearch() {
  searchQuery.value = '';
  fileStore.setSearchQuery('');
}

// 文件夹展开/折叠
function handleToggle(nodeId) {
  fileStore.toggleFolder(nodeId);
}

// 节点选择
function handleSelect(node) {
  fileStore.selectNode(node);
  emit('select', node);
}

// 右键菜单处理
function handleTreeContextMenu(event) {
  showContextMenu(event, null);
}

function handleNodeContextMenu({ node, event }) {
  showContextMenu(event, node);
}

function showContextMenu(event, node) {
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    node: node
  };
}

function hideContextMenu() {
  contextMenu.value.visible = false;
}

// 右键菜单操作
function handleOpenFile() {
  if (contextMenu.value.node) {
    emit('open', contextMenu.value.node);
  }
  hideContextMenu();
}

function handleNewFile() {
  const folderId = contextMenu.value.node?.id;
  emit('create', { type: 'file', parentId: folderId });
  hideContextMenu();
}

function handleNewFolder() {
  const folderId = contextMenu.value.node?.id;
  emit('create', { type: 'folder', parentId: folderId });
  hideContextMenu();
}

function handleRename() {
  if (contextMenu.value.node) {
    const newName = prompt('请输入新名称:', contextMenu.value.node.name);
    if (newName && newName.trim()) {
      fileStore.renameNode(contextMenu.value.node.id, newName.trim());
    }
  }
  hideContextMenu();
}

function handleDelete() {
  if (contextMenu.value.node) {
    const confirmed = confirm(`确定要删除 "${contextMenu.value.node.name}" 吗？`);
    if (confirmed) {
      fileStore.deleteNode(contextMenu.value.node.id);
      emit('delete', contextMenu.value.node);
    }
  }
  hideContextMenu();
}

function handleRefresh() {
  fileStore.loadFromStorage();
  hideContextMenu();
}

// 点击外部关闭菜单
function handleClickOutside(event) {
  if (contextMenu.value.visible) {
    hideContextMenu();
  }
}

// 生命周期
onMounted(() => {
  fileStore.loadFromStorage();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.document-tree-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
}

/* 搜索框样式 */
.search-box {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #7a7a7c;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 8px 30px 8px 32px;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  background-color: rgba(160, 160, 160, 0.3);
  color: #2c2c2e;
  transition: all 0.2s;
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.1),
    inset 0 1px 2px rgba(0, 0, 0, 0.08);
}

.search-input:focus {
  outline: none;
  background-color: rgba(220, 220, 220, 0.6);
}

.search-input::placeholder {
  color: #7a7a7c;
}

.search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #7a7a7c;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-clear:hover {
  color: #4a4a4c;
}

/* 文档树样式 */
.document-tree {
  display: flex;
  flex-direction: column;
  gap: 1px;
  border: none;
  border-radius: 10px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.04);
  flex: 1;
  min-height: 120px;
  overflow-y: auto;
  box-shadow: 
    inset 0 1px 3px rgba(0, 0, 0, 0.12),
    inset 0 0 0 1px rgba(0, 0, 0, 0.06);
}

.tree-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: #8a8a8c;
  gap: 8px;
  font-size: 12px;
}

/* 右键菜单样式 */
.context-menu {
  position: fixed;
  z-index: 1000;
  background: rgba(220, 220, 220, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(180, 180, 180, 0.5);
  border-radius: 8px;
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.15),
    0 1px 4px rgba(0, 0, 0, 0.1);
  min-width: 160px;
  padding: 4px 0;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: #2c2c2e;
  cursor: pointer;
  transition: background-color 0.15s;
}

.context-menu-item:hover {
  background-color: rgba(180, 198, 192, 0.4);
}

.context-menu-item--danger {
  color: #c53030;
}

.context-menu-item--danger:hover {
  background-color: rgba(197, 48, 48, 0.15);
}

.context-menu-divider {
  height: 1px;
  background-color: rgba(0, 0, 0, 0.1);
  margin: 4px 0;
}
</style>
