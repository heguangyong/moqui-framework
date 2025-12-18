// 导航状态管理
// 管理侧边栏导航和面板上下文状态
// 需求: 1.4, 2.1-2.5

import { defineStore } from 'pinia';

// 导航项配置
export const NAV_ITEMS = [
  {
    id: 'dashboard',
    route: '/dashboard',
    label: '项目概览',
    description: '查看项目统计和快速操作'
  },
  {
    id: 'workflow',
    route: '/workflow',
    label: '工作流',
    description: '编辑和执行转换流程'
  },
  {
    id: 'assets',
    route: '/assets',
    label: '资源库',
    description: '管理项目资源文件'
  },
  {
    id: 'characters',
    route: '/characters',
    label: '角色管理',
    description: '管理角色档案和一致性'
  }
];

// 设置导航项
export const SETTINGS_NAV = {
  id: 'settings',
  route: '/settings',
  label: '设置',
  description: 'AI配置和应用设置'
};

export const useNavigationStore = defineStore('navigation', {
  state: () => ({
    // 当前激活的导航ID
    activeNavId: 'dashboard',
    
    // 各面板的上下文状态
    panelContext: {
      dashboard: {
        selectedProject: null,
        statusFilter: null
      },
      workflow: {
        selectedWorkflow: null,
        executionFilter: null
      },
      assets: {
        category: null,
        searchQuery: ''
      },
      characters: {
        searchQuery: '',
        filterLocked: null
      },
      settings: {
        activeCategory: 'ai'
      }
    },
    
    // 导航历史记录
    navigationHistory: [],
    
    // 工作流状态 - 需求 5.2, 5.3, 5.4, 5.5
    workflowState: {
      // 当前阶段: idle, importing, parsing, character-review, workflow-ready, executing, completed
      stage: 'idle',
      // 导入的文件路径
      importedFile: null,
      // 解析结果
      parseResult: null,
      // 角色确认状态
      charactersConfirmed: false,
      // 执行结果
      executionResult: null
    }
  }),
  
  getters: {
    // 获取当前面板组件名称
    currentPanelComponent: (state) => {
      const componentMap = {
        dashboard: 'DashboardPanel',
        workflow: 'WorkflowPanel',
        assets: 'AssetsPanel',
        characters: 'CharactersPanel',
        settings: 'SettingsPanel'
      };
      return componentMap[state.activeNavId] || 'DashboardPanel';
    },
    
    // 获取当前导航项配置
    currentNavItem: (state) => {
      if (state.activeNavId === 'settings') {
        return SETTINGS_NAV;
      }
      return NAV_ITEMS.find(item => item.id === state.activeNavId) || NAV_ITEMS[0];
    },
    
    // 获取当前面板上下文
    currentPanelContext: (state) => {
      return state.panelContext[state.activeNavId] || {};
    },
    
    // 获取所有导航项
    allNavItems: () => NAV_ITEMS,
    
    // 获取设置导航项
    settingsNavItem: () => SETTINGS_NAV
  },
  
  actions: {
    // 设置激活的导航项 - 需求 1.3, 1.4
    setActiveNav(navId) {
      // 记录导航历史
      if (this.activeNavId && this.activeNavId !== navId) {
        this.navigationHistory.unshift(this.activeNavId);
        // 保持历史记录不超过20条
        if (this.navigationHistory.length > 20) {
          this.navigationHistory.pop();
        }
      }
      
      this.activeNavId = navId;
      this.persistNavigationState();
    },
    
    // 更新面板上下文 - 需求 2.1-2.5
    updatePanelContext(navId, context) {
      if (this.panelContext[navId]) {
        this.panelContext[navId] = {
          ...this.panelContext[navId],
          ...context
        };
        this.persistNavigationState();
      }
    },
    
    // 重置面板上下文
    resetPanelContext(navId) {
      const defaultContexts = {
        dashboard: { selectedProject: null, statusFilter: null },
        workflow: { selectedWorkflow: null, executionFilter: null },
        assets: { category: null, searchQuery: '' },
        characters: { searchQuery: '', filterLocked: null },
        settings: { activeCategory: 'ai' }
      };
      
      if (defaultContexts[navId]) {
        this.panelContext[navId] = { ...defaultContexts[navId] };
      }
    },
    
    // 导航到上一个页面
    goBack() {
      if (this.navigationHistory.length > 0) {
        const previousNavId = this.navigationHistory.shift();
        this.activeNavId = previousNavId;
        this.persistNavigationState();
        return previousNavId;
      }
      return null;
    },
    
    // 持久化导航状态
    persistNavigationState() {
      const state = {
        activeNavId: this.activeNavId,
        panelContext: this.panelContext
      };
      localStorage.setItem('navigation-state', JSON.stringify(state));
    },
    
    // 从存储恢复状态
    initializeFromStorage() {
      const savedState = localStorage.getItem('navigation-state');
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          if (state.activeNavId) {
            this.activeNavId = state.activeNavId;
          }
          if (state.panelContext) {
            // 合并保存的上下文，保留默认值
            Object.keys(state.panelContext).forEach(key => {
              if (this.panelContext[key]) {
                this.panelContext[key] = {
                  ...this.panelContext[key],
                  ...state.panelContext[key]
                };
              }
            });
          }
        } catch (error) {
          console.warn('Failed to restore navigation state:', error);
        }
      }
    },
    
    // 开始导入小说 - 需求 5.2
    startImport(filePath) {
      this.workflowState.stage = 'importing';
      this.workflowState.importedFile = filePath;
    },
    
    // 解析完成 - 需求 5.2, 5.3
    setParseResult(result) {
      this.workflowState.stage = 'character-review';
      this.workflowState.parseResult = result;
    },
    
    // 确认角色 - 需求 5.4
    confirmCharacters() {
      this.workflowState.charactersConfirmed = true;
      this.workflowState.stage = 'workflow-ready';
    },
    
    // 开始执行工作流 - 需求 5.4
    startExecution() {
      this.workflowState.stage = 'executing';
    },
    
    // 执行完成 - 需求 5.5
    setExecutionResult(result) {
      this.workflowState.stage = 'completed';
      this.workflowState.executionResult = result;
    },
    
    // 重置工作流状态
    resetWorkflowState() {
      this.workflowState = {
        stage: 'idle',
        importedFile: null,
        parseResult: null,
        charactersConfirmed: false,
        executionResult: null
      };
    },
    
    // 检查是否可以执行工作流 - 需求 5.4
    canExecuteWorkflow() {
      return this.workflowState.charactersConfirmed && 
             this.workflowState.stage === 'workflow-ready';
    }
  }
});
