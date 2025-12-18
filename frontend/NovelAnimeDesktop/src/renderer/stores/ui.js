// UI状态管理
// 管理界面布局、主题、导航等状态

import { defineStore } from 'pinia';

export const useUIStore = defineStore('ui', {
  state: () => ({
    // 布局状态
    layout: {
      sidebarCollapsed: false,
      sidebarExpanded: false,
      contentPanelWidth: 300,
      mainAreaMode: 'dashboard', // 'dashboard' | 'editor' | 'preview'
      fullscreenMode: false
    },
    
    // 主题状态
    theme: {
      current: 'light', // 'light' | 'dark' | 'auto'
      customColors: null
    },
    
    // 导航状态
    navigation: {
      activeRoute: 'home',
      breadcrumbs: [],
      recentRoutes: []
    },
    
    // 项目状态
    project: {
      selectedNode: null,
      expandedNodes: [],
      searchQuery: '',
      searchFilters: []
    },
    
    // 通知状态
    notifications: [],
    
    // 加载状态
    loading: {
      global: false,
      components: {}
    }
  }),
  
  getters: {
    // 获取当前主题配置
    currentTheme: (state) => {
      return state.theme.current;
    },
    
    // 获取侧边栏状态
    sidebarState: (state) => {
      return {
        collapsed: state.layout.sidebarCollapsed,
        expanded: state.layout.sidebarExpanded,
        width: state.layout.sidebarCollapsed ? 64 : 240
      };
    },
    
    // 获取当前面包屑
    currentBreadcrumbs: (state) => {
      return state.navigation.breadcrumbs;
    },
    
    // 获取搜索状态
    searchState: (state) => {
      return {
        query: state.project.searchQuery,
        filters: state.project.searchFilters,
        hasQuery: state.project.searchQuery.length > 0
      };
    },
    
    // 获取未读通知数量
    unreadNotificationsCount: (state) => {
      return state.notifications.filter(n => !n.read).length;
    }
  },
  
  actions: {
    // 布局操作
    toggleSidebar() {
      this.layout.sidebarCollapsed = !this.layout.sidebarCollapsed;
      this.persistLayoutState();
    },
    
    setSidebarExpanded(expanded) {
      this.layout.sidebarExpanded = expanded;
    },
    
    setContentPanelWidth(width) {
      this.layout.contentPanelWidth = Math.max(240, Math.min(400, width));
      this.persistLayoutState();
    },
    
    setMainAreaMode(mode) {
      this.layout.mainAreaMode = mode;
    },
    
    toggleFullscreen() {
      this.layout.fullscreenMode = !this.layout.fullscreenMode;
    },
    
    // 主题操作
    setTheme(theme) {
      this.theme.current = theme;
      this.applyTheme(theme);
      this.persistThemeState();
    },
    
    applyTheme(theme) {
      // 应用主题到DOM
      document.documentElement.setAttribute('data-theme', theme);
      
      // 如果是自动主题，根据系统偏好设置
      if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      }
    },
    
    // 导航操作
    setActiveRoute(route) {
      // 添加到最近路由
      if (this.navigation.activeRoute && this.navigation.activeRoute !== route) {
        this.navigation.recentRoutes.unshift(this.navigation.activeRoute);
        // 保持最近路由列表不超过10个
        if (this.navigation.recentRoutes.length > 10) {
          this.navigation.recentRoutes.pop();
        }
      }
      
      this.navigation.activeRoute = route;
    },
    
    setBreadcrumbs(breadcrumbs) {
      this.navigation.breadcrumbs = breadcrumbs;
    },
    
    // 项目操作
    setSelectedNode(nodeId) {
      this.project.selectedNode = nodeId;
    },
    
    toggleNodeExpanded(nodeId) {
      const index = this.project.expandedNodes.indexOf(nodeId);
      if (index > -1) {
        this.project.expandedNodes.splice(index, 1);
      } else {
        this.project.expandedNodes.push(nodeId);
      }
    },
    
    setSearchQuery(query) {
      this.project.searchQuery = query;
    },
    
    addSearchFilter(filter) {
      const existingIndex = this.project.searchFilters.findIndex(f => f.type === filter.type);
      if (existingIndex > -1) {
        this.project.searchFilters[existingIndex] = filter;
      } else {
        this.project.searchFilters.push(filter);
      }
    },
    
    removeSearchFilter(filterType) {
      this.project.searchFilters = this.project.searchFilters.filter(f => f.type !== filterType);
    },
    
    clearSearch() {
      this.project.searchQuery = '';
      this.project.searchFilters = [];
    },
    
    // 通知操作 - 需求 6.2, 6.3
    addNotification(notification) {
      const id = Date.now().toString();
      this.notifications.unshift({
        id,
        read: false,
        timestamp: new Date(),
        // 支持操作按钮 - 需求 6.2, 6.3
        action: notification.action || null,
        actionLabel: notification.actionLabel || null,
        ...notification
      });
      
      // 自动移除通知（如果设置了自动移除时间）
      if (notification.autoRemove !== false) {
        const timeout = notification.timeout || 5000;
        setTimeout(() => {
          this.removeNotification(id);
        }, timeout);
      }
      
      return id;
    },
    
    // 执行通知操作 - 需求 6.2, 6.3
    executeNotificationAction(id) {
      const notification = this.notifications.find(n => n.id === id);
      if (notification && notification.action) {
        notification.action();
        this.removeNotification(id);
      }
    },
    
    markNotificationRead(id) {
      const notification = this.notifications.find(n => n.id === id);
      if (notification) {
        notification.read = true;
      }
    },
    
    removeNotification(id) {
      this.notifications = this.notifications.filter(n => n.id !== id);
    },
    
    clearAllNotifications() {
      this.notifications = [];
    },
    
    // 加载状态操作
    setGlobalLoading(loading) {
      this.loading.global = loading;
    },
    
    setComponentLoading(component, loading) {
      if (loading) {
        this.loading.components[component] = true;
      } else {
        delete this.loading.components[component];
      }
    },
    
    // 持久化操作
    persistLayoutState() {
      const layoutState = {
        sidebarCollapsed: this.layout.sidebarCollapsed,
        contentPanelWidth: this.layout.contentPanelWidth
      };
      localStorage.setItem('ui-layout', JSON.stringify(layoutState));
    },
    
    persistThemeState() {
      localStorage.setItem('ui-theme', this.theme.current);
    },
    
    // 初始化操作
    initializeFromStorage() {
      // 恢复布局状态
      const savedLayout = localStorage.getItem('ui-layout');
      if (savedLayout) {
        try {
          const layoutState = JSON.parse(savedLayout);
          this.layout.sidebarCollapsed = layoutState.sidebarCollapsed ?? false;
          this.layout.contentPanelWidth = layoutState.contentPanelWidth ?? 300;
        } catch (error) {
          console.warn('Failed to restore layout state:', error);
        }
      }
      
      // 恢复主题状态
      const savedTheme = localStorage.getItem('ui-theme');
      if (savedTheme) {
        this.theme.current = savedTheme;
        this.applyTheme(savedTheme);
      } else {
        // 默认使用系统主题偏好
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.setTheme(prefersDark ? 'dark' : 'light');
      }
      
      // 监听系统主题变化
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (this.theme.current === 'auto') {
          this.applyTheme('auto');
        }
      });
    }
  }
});