import { defineStore } from 'pinia';

export const useTabStore = defineStore('tab', {
  state: () => ({
    // 所有打开的标签页
    tabs: [],
    // 当前激活的标签页ID
    activeTabId: null,
    // 最大标签页数量
    maxTabs: 20,
    // 标签页历史记录（用于关闭后切换）
    tabHistory: []
  }),

  getters: {
    // 当前激活的标签页
    activeTab: (state) => {
      return state.tabs.find(t => t.id === state.activeTabId) || null;
    },
    
    // 标签页数量
    tabCount: (state) => state.tabs.length,
    
    // 是否有未保存的标签页
    hasUnsavedTabs: (state) => state.tabs.some(t => t.modified),
    
    // 未保存的标签页列表
    unsavedTabs: (state) => state.tabs.filter(t => t.modified),
    
    // 根据ID获取标签页
    getTabById: (state) => (id) => state.tabs.find(t => t.id === id),
    
    // 根据路由获取标签页
    getTabByRoute: (state) => (route) => state.tabs.find(t => t.route === route)
  },

  actions: {
    // 打开新标签页
    openTab(tabData) {
      // 检查是否已存在相同路由的标签页
      const existingTab = this.tabs.find(t => t.route === tabData.route);
      if (existingTab) {
        this.setActiveTab(existingTab.id);
        return existingTab;
      }
      
      // 检查是否超过最大数量
      if (this.tabs.length >= this.maxTabs) {
        // 关闭最早的未修改标签页
        const oldestUnmodified = this.tabs.find(t => !t.modified && t.id !== this.activeTabId);
        if (oldestUnmodified) {
          this.closeTab(oldestUnmodified.id, true);
        } else {
          console.warn('无法打开新标签页：已达到最大数量且所有标签页都有未保存的更改');
          return null;
        }
      }
      
      const tab = {
        id: `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: tabData.title || '新标签页',
        route: tabData.route || '',
        icon: tabData.icon || null,
        type: tabData.type || 'default',
        data: tabData.data || null,
        modified: false,
        createdAt: new Date(),
        ...tabData
      };
      
      this.tabs.push(tab);
      this.setActiveTab(tab.id);
      this.saveTabs();
      
      return tab;
    },
    
    // 设置激活的标签页
    setActiveTab(tabId) {
      if (this.activeTabId !== tabId) {
        // 添加到历史记录
        if (this.activeTabId) {
          this.tabHistory = this.tabHistory.filter(id => id !== this.activeTabId);
          this.tabHistory.push(this.activeTabId);
          // 限制历史记录长度
          if (this.tabHistory.length > 10) {
            this.tabHistory.shift();
          }
        }
        
        this.activeTabId = tabId;
        this.saveTabs();
      }
    },
    
    // 关闭标签页
    closeTab(tabId, force = false) {
      const tab = this.tabs.find(t => t.id === tabId);
      if (!tab) return false;
      
      // 检查是否有未保存的更改
      if (tab.modified && !force) {
        // 返回 false 表示需要确认
        return false;
      }
      
      const index = this.tabs.findIndex(t => t.id === tabId);
      this.tabs.splice(index, 1);
      
      // 从历史记录中移除
      this.tabHistory = this.tabHistory.filter(id => id !== tabId);
      
      // 如果关闭的是当前激活的标签页，切换到其他标签页
      if (this.activeTabId === tabId) {
        // 优先切换到历史记录中的上一个标签页
        if (this.tabHistory.length > 0) {
          const lastTabId = this.tabHistory.pop();
          if (this.tabs.find(t => t.id === lastTabId)) {
            this.activeTabId = lastTabId;
          } else {
            this.activeTabId = this.tabs[Math.max(0, index - 1)]?.id || null;
          }
        } else {
          // 切换到相邻的标签页
          this.activeTabId = this.tabs[Math.max(0, index - 1)]?.id || null;
        }
      }
      
      this.saveTabs();
      return true;
    },
    
    // 关闭所有标签页
    closeAllTabs(force = false) {
      if (!force && this.hasUnsavedTabs) {
        return false;
      }
      
      this.tabs = [];
      this.activeTabId = null;
      this.tabHistory = [];
      this.saveTabs();
      return true;
    },
    
    // 关闭其他标签页
    closeOtherTabs(tabId, force = false) {
      const otherTabs = this.tabs.filter(t => t.id !== tabId);
      
      if (!force && otherTabs.some(t => t.modified)) {
        return false;
      }
      
      this.tabs = this.tabs.filter(t => t.id === tabId);
      this.activeTabId = tabId;
      this.tabHistory = [];
      this.saveTabs();
      return true;
    },
    
    // 关闭右侧标签页
    closeTabsToRight(tabId, force = false) {
      const index = this.tabs.findIndex(t => t.id === tabId);
      if (index === -1) return false;
      
      const rightTabs = this.tabs.slice(index + 1);
      
      if (!force && rightTabs.some(t => t.modified)) {
        return false;
      }
      
      this.tabs = this.tabs.slice(0, index + 1);
      
      // 如果当前激活的标签页被关闭，切换到指定标签页
      if (!this.tabs.find(t => t.id === this.activeTabId)) {
        this.activeTabId = tabId;
      }
      
      this.tabHistory = this.tabHistory.filter(id => this.tabs.find(t => t.id === id));
      this.saveTabs();
      return true;
    },
    
    // 更新标签页
    updateTab(tabId, updates) {
      const tab = this.tabs.find(t => t.id === tabId);
      if (tab) {
        Object.assign(tab, updates);
        this.saveTabs();
        return true;
      }
      return false;
    },
    
    // 标记标签页为已修改
    setTabModified(tabId, modified = true) {
      return this.updateTab(tabId, { modified });
    },
    
    // 移动标签页
    moveTab(fromIndex, toIndex) {
      if (fromIndex < 0 || fromIndex >= this.tabs.length) return false;
      if (toIndex < 0 || toIndex >= this.tabs.length) return false;
      
      const [tab] = this.tabs.splice(fromIndex, 1);
      this.tabs.splice(toIndex, 0, tab);
      this.saveTabs();
      return true;
    },
    
    // 复制标签页
    duplicateTab(tabId) {
      const tab = this.tabs.find(t => t.id === tabId);
      if (!tab) return null;
      
      return this.openTab({
        ...tab,
        id: undefined,
        title: `${tab.title} (副本)`,
        modified: false
      });
    },
    
    // 保存标签页到本地存储
    saveTabs() {
      try {
        const data = {
          tabs: this.tabs.map(t => ({
            id: t.id,
            title: t.title,
            route: t.route,
            type: t.type,
            modified: t.modified
          })),
          activeTabId: this.activeTabId,
          tabHistory: this.tabHistory
        };
        localStorage.setItem('novel-anime-tabs', JSON.stringify(data));
      } catch (e) {
        console.error('Failed to save tabs:', e);
      }
    },
    
    // 从本地存储加载标签页
    loadTabs() {
      try {
        const saved = localStorage.getItem('novel-anime-tabs');
        if (saved) {
          const data = JSON.parse(saved);
          this.tabs = data.tabs || [];
          this.activeTabId = data.activeTabId || null;
          this.tabHistory = data.tabHistory || [];
        }
      } catch (e) {
        console.error('Failed to load tabs:', e);
        this.tabs = [];
        this.activeTabId = null;
        this.tabHistory = [];
      }
    },
    
    // 清除所有标签页数据
    clearTabs() {
      this.tabs = [];
      this.activeTabId = null;
      this.tabHistory = [];
      localStorage.removeItem('novel-anime-tabs');
    }
  }
});
