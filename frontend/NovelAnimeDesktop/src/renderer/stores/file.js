import { defineStore } from 'pinia';

export const useFileStore = defineStore('file', {
  state: () => ({
    // 文件树数据
    fileTree: [],
    // 展开的文件夹ID列表
    expandedFolders: [],
    // 当前选中的文件/文件夹
    selectedNode: null,
    // 搜索关键词
    searchQuery: '',
    // 加载状态
    isLoading: false,
    // 错误信息
    error: null
  }),

  getters: {
    // 过滤后的文件树（根据搜索关键词）
    filteredFileTree: (state) => {
      if (!state.searchQuery.trim()) {
        return state.fileTree;
      }
      return filterTree(state.fileTree, state.searchQuery.toLowerCase());
    },
    
    // 获取文件总数
    totalFiles: (state) => countFiles(state.fileTree),
    
    // 获取文件夹总数
    totalFolders: (state) => countFolders(state.fileTree),
    
    // 按类型分组的文件
    filesByType: (state) => {
      const grouped = {
        novel: [],
        script: [],
        storyboard: [],
        video: [],
        other: []
      };
      collectFilesByType(state.fileTree, grouped);
      return grouped;
    }
  },

  actions: {
    // 初始化文件树（基于当前项目）
    initializeFileTree(projectId) {
      this.isLoading = true;
      this.error = null;
      
      try {
        // 创建默认的项目文件结构
        this.fileTree = [
          {
            id: 'novels',
            name: '小说文件',
            type: 'folder',
            path: '/novels',
            icon: 'folder',
            children: [],
            count: 0
          },
          {
            id: 'scripts',
            name: '剧本文件',
            type: 'folder',
            path: '/scripts',
            icon: 'folder',
            children: [],
            count: 0
          },
          {
            id: 'characters',
            name: '角色设定',
            type: 'folder',
            path: '/characters',
            icon: 'folder',
            children: [],
            count: 0
          },
          {
            id: 'storyboards',
            name: '分镜文件',
            type: 'folder',
            path: '/storyboards',
            icon: 'folder',
            children: [],
            count: 0
          },
          {
            id: 'audio',
            name: '音频文件',
            type: 'folder',
            path: '/audio',
            icon: 'folder',
            children: [],
            count: 0
          },
          {
            id: 'videos',
            name: '视频文件',
            type: 'folder',
            path: '/videos',
            icon: 'folder',
            children: [],
            count: 0
          }
        ];
        
        // 默认展开小说文件夹
        this.expandedFolders = ['novels'];
        this.saveToStorage();
      } catch (e) {
        this.error = e.message;
        console.error('Failed to initialize file tree:', e);
      } finally {
        this.isLoading = false;
      }
    },
    
    // 添加文件到指定文件夹
    addFile(folderId, fileData) {
      const folder = this.findNodeById(folderId);
      if (folder && folder.type === 'folder') {
        const file = {
          id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: fileData.name,
          type: 'file',
          fileType: fileData.fileType || 'other', // novel, script, storyboard, video
          path: `${folder.path}/${fileData.name}`,
          size: fileData.size || 0,
          modifiedAt: new Date(),
          ...fileData
        };
        
        if (!folder.children) {
          folder.children = [];
        }
        folder.children.push(file);
        folder.count = folder.children.length;
        this.saveToStorage();
        return file;
      }
      return null;
    },
    
    // 添加文件夹
    addFolder(parentId, folderData) {
      const parent = parentId ? this.findNodeById(parentId) : null;
      const folder = {
        id: `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: folderData.name,
        type: 'folder',
        path: parent ? `${parent.path}/${folderData.name}` : `/${folderData.name}`,
        icon: 'folder',
        children: [],
        count: 0,
        ...folderData
      };
      
      if (parent && parent.type === 'folder') {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(folder);
        parent.count = parent.children.length;
      } else {
        this.fileTree.push(folder);
      }
      
      this.saveToStorage();
      return folder;
    },
    
    // 删除节点
    deleteNode(nodeId) {
      const result = removeNodeById(this.fileTree, nodeId);
      if (result) {
        // 从展开列表中移除
        const index = this.expandedFolders.indexOf(nodeId);
        if (index > -1) {
          this.expandedFolders.splice(index, 1);
        }
        // 清除选中状态
        if (this.selectedNode?.id === nodeId) {
          this.selectedNode = null;
        }
        this.saveToStorage();
      }
      return result;
    },
    
    // 重命名节点
    renameNode(nodeId, newName) {
      const node = this.findNodeById(nodeId);
      if (node) {
        node.name = newName;
        // 更新路径
        const pathParts = node.path.split('/');
        pathParts[pathParts.length - 1] = newName;
        node.path = pathParts.join('/');
        this.saveToStorage();
        return true;
      }
      return false;
    },
    
    // 切换文件夹展开状态
    toggleFolder(folderId) {
      const index = this.expandedFolders.indexOf(folderId);
      if (index > -1) {
        this.expandedFolders.splice(index, 1);
      } else {
        this.expandedFolders.push(folderId);
      }
      this.saveToStorage();
    },
    
    // 选中节点
    selectNode(node) {
      this.selectedNode = node;
    },
    
    // 设置搜索关键词
    setSearchQuery(query) {
      this.searchQuery = query;
    },
    
    // 根据ID查找节点
    findNodeById(nodeId, nodes = this.fileTree) {
      for (const node of nodes) {
        if (node.id === nodeId) return node;
        if (node.children) {
          const found = this.findNodeById(nodeId, node.children);
          if (found) return found;
        }
      }
      return null;
    },
    
    // 保存到本地存储
    saveToStorage() {
      try {
        localStorage.setItem('novel-anime-file-tree', JSON.stringify({
          fileTree: this.fileTree,
          expandedFolders: this.expandedFolders
        }));
      } catch (e) {
        console.error('Failed to save file tree:', e);
      }
    },
    
    // 从本地存储加载
    loadFromStorage() {
      try {
        const saved = localStorage.getItem('novel-anime-file-tree');
        const schemaVersion = localStorage.getItem('novel-anime-file-tree-version');
        const currentVersion = '2'; // 版本2: 6个目录分类
        
        if (saved && schemaVersion === currentVersion) {
          const data = JSON.parse(saved);
          this.fileTree = data.fileTree || [];
          this.expandedFolders = data.expandedFolders || [];
          // 恢复日期对象
          restoreDates(this.fileTree);
        } else {
          // 版本不匹配或无数据，重新初始化
          this.initializeFileTree();
          localStorage.setItem('novel-anime-file-tree-version', currentVersion);
        }
      } catch (e) {
        console.error('Failed to load file tree:', e);
        this.initializeFileTree();
      }
    },
    
    // 清空文件树
    clearFileTree() {
      this.fileTree = [];
      this.expandedFolders = [];
      this.selectedNode = null;
      this.searchQuery = '';
      this.saveToStorage();
    }
  }
});

// 辅助函数：过滤文件树
function filterTree(nodes, query) {
  const result = [];
  for (const node of nodes) {
    if (node.name.toLowerCase().includes(query)) {
      result.push({ ...node });
    } else if (node.children) {
      const filteredChildren = filterTree(node.children, query);
      if (filteredChildren.length > 0) {
        result.push({ ...node, children: filteredChildren });
      }
    }
  }
  return result;
}

// 辅助函数：统计文件数量
function countFiles(nodes) {
  let count = 0;
  for (const node of nodes) {
    if (node.type === 'file') {
      count++;
    } else if (node.children) {
      count += countFiles(node.children);
    }
  }
  return count;
}

// 辅助函数：统计文件夹数量
function countFolders(nodes) {
  let count = 0;
  for (const node of nodes) {
    if (node.type === 'folder') {
      count++;
      if (node.children) {
        count += countFolders(node.children);
      }
    }
  }
  return count;
}

// 辅助函数：按类型收集文件
function collectFilesByType(nodes, grouped) {
  for (const node of nodes) {
    if (node.type === 'file') {
      const type = node.fileType || 'other';
      if (grouped[type]) {
        grouped[type].push(node);
      } else {
        grouped.other.push(node);
      }
    } else if (node.children) {
      collectFilesByType(node.children, grouped);
    }
  }
}

// 辅助函数：根据ID删除节点
function removeNodeById(nodes, nodeId) {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === nodeId) {
      nodes.splice(i, 1);
      return true;
    }
    if (nodes[i].children) {
      if (removeNodeById(nodes[i].children, nodeId)) {
        nodes[i].count = nodes[i].children.length;
        return true;
      }
    }
  }
  return false;
}

// 辅助函数：恢复日期对象
function restoreDates(nodes) {
  for (const node of nodes) {
    if (node.modifiedAt) {
      node.modifiedAt = new Date(node.modifiedAt);
    }
    if (node.children) {
      restoreDates(node.children);
    }
  }
}
