import { defineStore } from 'pinia';

// ============================================================================
// Type Definitions
// ============================================================================

export interface NavItem {
  id: string;
  route: string;
  label: string;
  description: string;
}

export interface DashboardContext {
  selectedProject: string | null;
  statusFilter: string | null;
  viewType: string | null;
  historyType: string | null;
}

export interface WorkflowContext {
  selectedWorkflow: string | null;
  executionFilter: string | null;
  viewType: string | null;
  statusFilter: string | null;
  templateId: string | null;
  executionId: string | null;
}

export interface AssetsContext {
  category: string | null;
  searchQuery: string;
  viewType: string | null;
  selectedAsset: string | null;
  filters: string[];
}

export interface CharactersContext {
  searchQuery: string;
  filterLocked: boolean | null;
  selectedCharacter: string | null;
  viewType: string | null;
  novelId: string | null;
}

export interface SettingsContext {
  activeCategory: string;
}

export type PanelContext = {
  dashboard: DashboardContext;
  workflow: WorkflowContext;
  assets: AssetsContext;
  characters: CharactersContext;
  settings: SettingsContext;
};

export type NavId = keyof PanelContext;

interface NavigationState {
  activeNavId: NavId;
  panelContext: PanelContext;
  navigationHistory: NavId[];
}

// ============================================================================
// Navigation Configuration
// ============================================================================

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    route: '/dashboard',
    label: '项目概览',
    description: '查看项目统计和快速操作',
  },
  {
    id: 'workflow',
    route: '/workflow',
    label: '工作流',
    description: '编辑和执行转换流程',
  },
  {
    id: 'assets',
    route: '/assets',
    label: '资源库',
    description: '管理项目资源文件',
  },
  {
    id: 'characters',
    route: '/characters',
    label: '角色管理',
    description: '管理角色档案和一致性',
  },
];

export const SETTINGS_NAV: NavItem = {
  id: 'settings',
  route: '/settings',
  label: '设置',
  description: 'AI配置和应用设置',
};

// ============================================================================
// Default Panel Contexts
// ============================================================================

const DEFAULT_CONTEXTS: PanelContext = {
  dashboard: {
    selectedProject: null,
    statusFilter: null,
    viewType: null,
    historyType: null,
  },
  workflow: {
    selectedWorkflow: null,
    executionFilter: null,
    viewType: null,
    statusFilter: null,
    templateId: null,
    executionId: null,
  },
  assets: {
    category: null,
    searchQuery: '',
    viewType: null,
    selectedAsset: null,
    filters: [],
  },
  characters: {
    searchQuery: '',
    filterLocked: null,
    selectedCharacter: null,
    viewType: null,
    novelId: null,
  },
  settings: {
    activeCategory: 'profile',
  },
};

// ============================================================================
// Store Definition
// ============================================================================

export const useNavigationStore = defineStore('navigation', {
  state: (): NavigationState => ({
    activeNavId: 'dashboard',
    panelContext: JSON.parse(JSON.stringify(DEFAULT_CONTEXTS)), // Deep copy
    navigationHistory: [],
  }),

  getters: {
    /**
     * Get current panel component name
     */
    currentPanelComponent: (state): string => {
      const componentMap: Record<NavId, string> = {
        dashboard: 'DashboardPanel',
        workflow: 'WorkflowPanel',
        assets: 'AssetsPanel',
        characters: 'CharactersPanel',
        settings: 'SettingsPanel',
      };
      return componentMap[state.activeNavId] || 'DashboardPanel';
    },

    /**
     * Get current navigation item configuration
     */
    currentNavItem: (state): NavItem => {
      if (state.activeNavId === 'settings') {
        return SETTINGS_NAV;
      }
      return NAV_ITEMS.find((item) => item.id === state.activeNavId) || NAV_ITEMS[0];
    },

    /**
     * Get current panel context
     */
    currentPanelContext: (state) => {
      return state.panelContext[state.activeNavId] || {};
    },

    /**
     * Get all navigation items
     */
    allNavItems: (): NavItem[] => NAV_ITEMS,

    /**
     * Get settings navigation item
     */
    settingsNavItem: (): NavItem => SETTINGS_NAV,
  },

  actions: {
    /**
     * Set active navigation item
     * @param navId - Navigation ID to activate
     */
    setActiveNav(navId: NavId): void {
      // Record navigation history
      if (this.activeNavId && this.activeNavId !== navId) {
        this.navigationHistory.unshift(this.activeNavId);
        // Keep history under 20 entries
        if (this.navigationHistory.length > 20) {
          this.navigationHistory.pop();
        }
      }

      this.activeNavId = navId;
      this.persistNavigationState();
    },

    /**
     * Update panel context
     * Note: Uses complete replacement instead of merge to avoid stale values
     * @param navId - Navigation ID
     * @param context - New context (partial)
     */
    updatePanelContext<T extends NavId>(navId: T, context: Partial<PanelContext[T]>): void {
      if (this.panelContext[navId]) {
        // Reset to default first, then apply new context
        this.panelContext[navId] = {
          ...DEFAULT_CONTEXTS[navId],
          ...context,
        } as PanelContext[T];
        this.persistNavigationState();
      }
    },

    /**
     * Reset panel context to default
     * @param navId - Navigation ID
     */
    resetPanelContext(navId: NavId): void {
      if (DEFAULT_CONTEXTS[navId]) {
        this.panelContext[navId] = JSON.parse(JSON.stringify(DEFAULT_CONTEXTS[navId]));
        this.persistNavigationState();
      }
    },

    /**
     * Navigate to previous page
     * @returns Previous navigation ID or null
     */
    goBack(): NavId | null {
      if (this.navigationHistory.length > 0) {
        const previousNavId = this.navigationHistory.shift();
        if (previousNavId) {
          this.activeNavId = previousNavId;
          this.persistNavigationState();
          return previousNavId;
        }
      }
      return null;
    },

    /**
     * Persist navigation state to localStorage
     */
    persistNavigationState(): void {
      const state = {
        activeNavId: this.activeNavId,
        panelContext: this.panelContext,
      };
      try {
        localStorage.setItem('navigation-state', JSON.stringify(state));
      } catch (error) {
        console.error('Failed to persist navigation state:', error);
      }
    },

    /**
     * Initialize from localStorage
     */
    initializeFromStorage(): void {
      const savedState = localStorage.getItem('navigation-state');
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          if (state.activeNavId) {
            this.activeNavId = state.activeNavId;
          }
          if (state.panelContext) {
            // Merge saved context, preserving default values
            Object.keys(state.panelContext).forEach((key) => {
              const navId = key as NavId;
              if (this.panelContext[navId]) {
                this.panelContext[navId] = {
                  ...this.panelContext[navId],
                  ...state.panelContext[navId],
                };
              }
            });
          }
        } catch (error) {
          console.warn('Failed to restore navigation state:', error);
        }
      }
    },

    /**
     * Clear all navigation state
     */
    clearNavigationState(): void {
      this.activeNavId = 'dashboard';
      this.panelContext = JSON.parse(JSON.stringify(DEFAULT_CONTEXTS));
      this.navigationHistory = [];
      localStorage.removeItem('navigation-state');
    },
  },
});
