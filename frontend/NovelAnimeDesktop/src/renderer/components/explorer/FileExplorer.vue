<template>
  <div class="file-explorer">
    <div class="explorer-header">
      <q-toolbar class="bg-grey-1">
        <q-toolbar-title class="text-subtitle2">项目资源管理器</q-toolbar-title>
        <q-btn flat round dense icon="refresh" @click="refreshFiles" />
        <q-btn flat round dense icon="create_new_folder" @click="createFolder" />
      </q-toolbar>
    </div>

    <div class="explorer-content">
      <q-tree
        :nodes="fileTree"
        node-key="id"
        selected-color="primary"
        v-model:selected="selectedNode"
        v-model:expanded="expandedNodes"
        @update:selected="onNodeSelected"
      >
        <template v-slot:default-header="prop">
          <div class="row items-center full-width">
            <q-icon
              :name="getNodeIcon(prop.node)"
              :color="getNodeColor(prop.node)"
              size="18px"
              class="q-mr-sm"
            />
            <div class="text-weight-400 ellipsis">{{ prop.node.label }}</div>
            <q-space />
            <div class="row no-wrap" v-if="prop.node.type === 'file'">
              <q-chip
                v-if="prop.node.size"
                dense
                size="sm"
                color="grey-4"
                text-color="grey-8"
                class="q-ml-xs"
              >
                {{ formatFileSize(prop.node.size) }}
              </q-chip>
            </div>
          </div>
        </template>

        <template v-slot:default-body="prop">
          <div
            v-if="prop.node.type === 'file' && prop.node.description"
            class="text-grey-6 q-ml-lg text-caption"
          >
            {{ prop.node.description }}
          </div>
        </template>
      </q-tree>
    </div>

    <!-- Context Menu -->
    <q-menu
      v-model="showContextMenu"
      context-menu
      auto-close
    >
      <q-list dense style="min-width: 150px">
        <q-item clickable v-close-popup @click="openFile" v-if="contextNode?.type === 'file'">
          <q-item-section avatar>
            <q-icon name="open_in_new" />
          </q-item-section>
          <q-item-section>打开文件</q-item-section>
        </q-item>
        
        <q-item clickable v-close-popup @click="renameNode">
          <q-item-section avatar>
            <q-icon name="edit" />
          </q-item-section>
          <q-item-section>重命名</q-item-section>
        </q-item>
        
        <q-item clickable v-close-popup @click="deleteNode">
          <q-item-section avatar>
            <q-icon name="delete" />
          </q-item-section>
          <q-item-section>删除</q-item-section>
        </q-item>
        
        <q-separator />
        
        <q-item clickable v-close-popup @click="showProperties">
          <q-item-section avatar>
            <q-icon name="info" />
          </q-item-section>
          <q-item-section>属性</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';

interface FileNode {
  id: string;
  label: string;
  type: 'file' | 'folder';
  path: string;
  size?: number;
  description?: string;
  children?: FileNode[];
  icon?: string;
  expandable?: boolean;
}

const $q = useQuasar();

// State
const fileTree = ref<FileNode[]>([]);
const selectedNode = ref<string>('');
const expandedNodes = ref<string[]>([]);
const showContextMenu = ref(false);
const contextNode = ref<FileNode | null>(null);

// Computed
const currentProject = computed(() => {
  // In a real app, this would come from a project store
  return 'novel-anime-project';
});

// Methods
const refreshFiles = async () => {
  // Simulate loading project files
  fileTree.value = [
    {
      id: 'novels',
      label: '小说文件',
      type: 'folder',
      path: '/novels',
      expandable: true,
      children: [
        {
          id: 'novel1',
          label: '三体.txt',
          type: 'file',
          path: '/novels/三体.txt',
          size: 1024000,
          description: '刘慈欣科幻小说'
        },
        {
          id: 'novel2',
          label: '流浪地球.txt',
          type: 'file',
          path: '/novels/流浪地球.txt',
          size: 512000,
          description: '短篇科幻小说'
        }
      ]
    },
    {
      id: 'characters',
      label: '角色资源',
      type: 'folder',
      path: '/characters',
      expandable: true,
      children: [
        {
          id: 'char1',
          label: '叶文洁.json',
          type: 'file',
          path: '/characters/叶文洁.json',
          size: 2048,
          description: '角色配置文件'
        }
      ]
    },
    {
      id: 'episodes',
      label: '分集内容',
      type: 'folder',
      path: '/episodes',
      expandable: true,
      children: []
    },
    {
      id: 'assets',
      label: '素材库',
      type: 'folder',
      path: '/assets',
      expandable: true,
      children: [
        {
          id: 'backgrounds',
          label: '背景图片',
          type: 'folder',
          path: '/assets/backgrounds',
          expandable: true,
          children: []
        },
        {
          id: 'effects',
          label: '特效素材',
          type: 'folder',
          path: '/assets/effects',
          expandable: true,
          children: []
        }
      ]
    },
    {
      id: 'output',
      label: '输出文件',
      type: 'folder',
      path: '/output',
      expandable: true,
      children: []
    }
  ];
  
  // Expand root folders by default
  expandedNodes.value = ['novels', 'characters', 'assets'];
};

const createFolder = () => {
  $q.dialog({
    title: '创建文件夹',
    message: '请输入文件夹名称:',
    prompt: {
      model: '',
      type: 'text'
    },
    cancel: true,
    persistent: true
  }).onOk((name: string) => {
    if (name.trim()) {
      const newFolder: FileNode = {
        id: `folder_${Date.now()}`,
        label: name.trim(),
        type: 'folder',
        path: `/${name.trim()}`,
        expandable: true,
        children: []
      };
      fileTree.value.push(newFolder);
    }
  });
};

const onNodeSelected = (nodeId: string) => {
  const node = findNodeById(nodeId);
  if (node?.type === 'file') {
    // Emit file selection event
    console.log('Selected file:', node.path);
  }
};

const getNodeIcon = (node: FileNode): string => {
  if (node.type === 'folder') {
    return 'folder';
  }
  
  const ext = node.label.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'txt':
    case 'md':
      return 'description';
    case 'json':
      return 'code';
    case 'jpg':
    case 'png':
    case 'gif':
      return 'image';
    case 'mp4':
    case 'avi':
      return 'movie';
    case 'mp3':
    case 'wav':
      return 'audiotrack';
    default:
      return 'insert_drive_file';
  }
};

const getNodeColor = (node: FileNode): string => {
  if (node.type === 'folder') {
    return 'amber-7';
  }
  
  const ext = node.label.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'txt':
    case 'md':
      return 'blue-6';
    case 'json':
      return 'green-6';
    case 'jpg':
    case 'png':
    case 'gif':
      return 'purple-6';
    case 'mp4':
    case 'avi':
      return 'red-6';
    case 'mp3':
    case 'wav':
      return 'orange-6';
    default:
      return 'grey-6';
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const findNodeById = (id: string, nodes: FileNode[] = fileTree.value): FileNode | null => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(id, node.children);
      if (found) return found;
    }
  }
  return null;
};

const openFile = () => {
  if (contextNode.value) {
    console.log('Opening file:', contextNode.value.path);
    // Implement file opening logic
  }
};

const renameNode = () => {
  if (!contextNode.value) return;
  
  $q.dialog({
    title: '重命名',
    message: '请输入新名称:',
    prompt: {
      model: contextNode.value.label,
      type: 'text'
    },
    cancel: true,
    persistent: true
  }).onOk((newName: string) => {
    if (newName.trim() && contextNode.value) {
      contextNode.value.label = newName.trim();
    }
  });
};

const deleteNode = () => {
  if (!contextNode.value) return;
  
  $q.dialog({
    title: '确认删除',
    message: `确定要删除 "${contextNode.value.label}" 吗？`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    // Implement delete logic
    console.log('Deleting:', contextNode.value?.path);
  });
};

const showProperties = () => {
  if (!contextNode.value) return;
  
  $q.dialog({
    title: '文件属性',
    message: `
      名称: ${contextNode.value.label}
      路径: ${contextNode.value.path}
      类型: ${contextNode.value.type === 'file' ? '文件' : '文件夹'}
      ${contextNode.value.size ? `大小: ${formatFileSize(contextNode.value.size)}` : ''}
      ${contextNode.value.description ? `描述: ${contextNode.value.description}` : ''}
    `,
    html: true
  });
};

// Lifecycle
onMounted(() => {
  refreshFiles();
});
</script>

<style scoped>
.file-explorer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.explorer-header {
  flex-shrink: 0;
}

.explorer-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.q-tree {
  font-size: 13px;
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>