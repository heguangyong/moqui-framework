import { defineStore } from 'pinia';

export const useTaskStore = defineStore('task', {
  state: () => ({
    tasks: [],
    isLoading: false,
    error: null
  }),

  getters: {
    // 按状态分类的任务
    newTasks: (state) => state.tasks.filter(t => t.status === 'pending'),
    runningTasks: (state) => state.tasks.filter(t => t.status === 'running'),
    reviewTasks: (state) => state.tasks.filter(t => t.status === 'review'),
    completedTasks: (state) => state.tasks.filter(t => t.status === 'completed'),
    failedTasks: (state) => state.tasks.filter(t => t.status === 'failed'),
    
    // 任务计数
    taskCounts: (state) => ({
      new: state.tasks.filter(t => t.status === 'pending').length,
      running: state.tasks.filter(t => t.status === 'running').length,
      review: state.tasks.filter(t => t.status === 'review').length,
      completed: state.tasks.filter(t => t.status === 'completed').length,
      failed: state.tasks.filter(t => t.status === 'failed').length,
      total: state.tasks.length
    }),
    
    // 按项目分组的任务
    tasksByProject: (state) => {
      const grouped = {};
      state.tasks.forEach(task => {
        if (!grouped[task.projectId]) {
          grouped[task.projectId] = [];
        }
        grouped[task.projectId].push(task);
      });
      return grouped;
    }
  },

  actions: {
    // 创建新任务
    createTask(taskData) {
      const task = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        projectId: taskData.projectId,
        type: taskData.type, // 'parse' | 'analyze' | 'script' | 'storyboard' | 'video'
        name: taskData.name || this.getTaskTypeName(taskData.type),
        status: 'pending',
        progress: 0,
        error: null,
        createdAt: new Date(),
        startedAt: null,
        completedAt: null,
        ...taskData
      };
      
      this.tasks.push(task);
      this.saveTasks();
      return task;
    },
    
    // 获取任务类型名称
    getTaskTypeName(type) {
      const names = {
        parse: '小说解析',
        analyze: '角色分析',
        script: '剧本生成',
        storyboard: '分镜生成',
        video: '视频生成'
      };
      return names[type] || type;
    },
    
    // 更新任务状态
    updateTaskStatus(taskId, status, data = {}) {
      const task = this.tasks.find(t => t.id === taskId);
      if (task) {
        task.status = status;
        
        if (status === 'running' && !task.startedAt) {
          task.startedAt = new Date();
        }
        
        if (status === 'completed' || status === 'failed') {
          task.completedAt = new Date();
        }
        
        if (data.progress !== undefined) {
          task.progress = data.progress;
        }
        
        if (data.error) {
          task.error = data.error;
        }
        
        this.saveTasks();
      }
      return task;
    },
    
    // 更新任务进度
    updateTaskProgress(taskId, progress) {
      const task = this.tasks.find(t => t.id === taskId);
      if (task) {
        task.progress = Math.min(100, Math.max(0, progress));
        this.saveTasks();
      }
      return task;
    },
    
    // 删除任务
    deleteTask(taskId) {
      const index = this.tasks.findIndex(t => t.id === taskId);
      if (index > -1) {
        this.tasks.splice(index, 1);
        this.saveTasks();
        return true;
      }
      return false;
    },
    
    // 获取项目的任务
    getProjectTasks(projectId) {
      return this.tasks.filter(t => t.projectId === projectId);
    },
    
    // 取消任务
    cancelTask(taskId) {
      return this.updateTaskStatus(taskId, 'failed', { error: '用户取消' });
    },
    
    // 重试任务
    retryTask(taskId) {
      const task = this.tasks.find(t => t.id === taskId);
      if (task && task.status === 'failed') {
        task.status = 'pending';
        task.progress = 0;
        task.error = null;
        task.startedAt = null;
        task.completedAt = null;
        this.saveTasks();
        return task;
      }
      return null;
    },
    
    // 保存任务到本地存储
    saveTasks() {
      try {
        localStorage.setItem('novel-anime-tasks', JSON.stringify(this.tasks));
      } catch (e) {
        console.error('Failed to save tasks:', e);
      }
    },
    
    // 从本地存储加载任务
    loadTasks() {
      try {
        const saved = localStorage.getItem('novel-anime-tasks');
        if (saved) {
          this.tasks = JSON.parse(saved);
          // 恢复日期对象
          this.tasks.forEach(task => {
            task.createdAt = new Date(task.createdAt);
            if (task.startedAt) task.startedAt = new Date(task.startedAt);
            if (task.completedAt) task.completedAt = new Date(task.completedAt);
          });
        }
      } catch (e) {
        console.error('Failed to load tasks:', e);
        this.tasks = [];
      }
    },
    
    // 清除已完成的任务
    clearCompletedTasks() {
      this.tasks = this.tasks.filter(t => t.status !== 'completed');
      this.saveTasks();
    }
  }
});
