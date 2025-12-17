import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface Project {
  id: string;
  name: string;
  path: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  hasGeneratedVideo?: boolean;
}

export const useProjectStore = defineStore('project', () => {
  // State
  const currentProject = ref<Project | null>(null);
  const projects = ref<Project[]>([]);
  const isLoading = ref(false);

  // Getters
  const hasCurrentProject = computed(() => !!currentProject.value);
  const projectCount = computed(() => projects.value.length);

  // Actions
  const createNewProject = async (name?: string) => {
    const projectName = name || '新项目';
    const newProject: Project = {
      id: Date.now().toString(),
      name: projectName,
      path: `/projects/${projectName}`,
      description: '新创建的小说转动漫项目',
      createdAt: new Date(),
      updatedAt: new Date(),
      hasGeneratedVideo: false
    };

    projects.value.push(newProject);
    currentProject.value = newProject;
    
    console.log('创建新项目:', projectName);
    return newProject;
  };

  const openProject = async () => {
    // 模拟打开项目对话框
    console.log('打开项目对话框');
    
    // 模拟选择一个项目
    const mockProject: Project = {
      id: 'mock-project',
      name: '示例项目',
      path: '/projects/示例项目',
      description: '这是一个示例项目',
      createdAt: new Date(Date.now() - 86400000), // 1天前
      updatedAt: new Date(),
      hasGeneratedVideo: true
    };
    
    currentProject.value = mockProject;
    if (!projects.value.find(p => p.id === mockProject.id)) {
      projects.value.push(mockProject);
    }
    
    return mockProject;
  };

  const saveCurrentProject = async () => {
    if (!currentProject.value) {
      throw new Error('没有当前项目可保存');
    }

    currentProject.value.updatedAt = new Date();
    console.log('保存项目:', currentProject.value.name);
    
    // 模拟保存操作
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(currentProject.value);
      }, 500);
    });
  };

  const setCurrentProject = (project: Project) => {
    currentProject.value = project;
  };

  const importNovel = async () => {
    console.log('导入小说文件');
    // 模拟导入操作
    return new Promise(resolve => {
      setTimeout(() => {
        resolve('小说导入成功');
      }, 1000);
    });
  };

  const exportVideo = async () => {
    if (!currentProject.value?.hasGeneratedVideo) {
      throw new Error('没有可导出的视频');
    }

    console.log('导出视频');
    // 模拟导出操作
    return new Promise(resolve => {
      setTimeout(() => {
        resolve('视频导出成功');
      }, 2000);
    });
  };

  const closeProject = () => {
    currentProject.value = null;
  };

  const deleteProject = async (projectId: string) => {
    const index = projects.value.findIndex(p => p.id === projectId);
    if (index !== -1) {
      projects.value.splice(index, 1);
      if (currentProject.value?.id === projectId) {
        currentProject.value = null;
      }
    }
  };

  const loadRecentProjects = async () => {
    isLoading.value = true;
    
    try {
      // 模拟加载最近项目
      const recentProjects: Project[] = [
        {
          id: '1',
          name: '三体动画项目',
          path: '/projects/三体动画',
          description: '基于刘慈欣《三体》的动画制作项目',
          createdAt: new Date(Date.now() - 86400000 * 3), // 3天前
          updatedAt: new Date(Date.now() - 86400000), // 1天前
          hasGeneratedVideo: true
        },
        {
          id: '2',
          name: '流浪地球短片',
          path: '/projects/流浪地球',
          description: '流浪地球短篇小说动画化',
          createdAt: new Date(Date.now() - 86400000 * 7), // 7天前
          updatedAt: new Date(Date.now() - 86400000 * 2), // 2天前
          hasGeneratedVideo: false
        }
      ];

      projects.value = recentProjects;
    } finally {
      isLoading.value = false;
    }
  };

  // Initialize
  loadRecentProjects();

  return {
    // State
    currentProject,
    projects,
    isLoading,
    
    // Getters
    hasCurrentProject,
    projectCount,
    
    // Actions
    createNewProject,
    openProject,
    saveCurrentProject,
    setCurrentProject,
    importNovel,
    exportVideo,
    closeProject,
    deleteProject,
    loadRecentProjects
  };
});