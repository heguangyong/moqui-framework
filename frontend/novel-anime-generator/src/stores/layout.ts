import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface LayoutState {
  leftPanelWidth: number;
  rightPanelWidth: number;
  bottomPanelHeight: number;
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;
  bottomPanelCollapsed: boolean;
  activeLeftTab: string;
  activeRightTab: string;
  activeBottomTab: string;
}

export interface PanelConfiguration {
  id: string;
  title: string;
  component: string;
  position: 'left' | 'right' | 'bottom';
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  resizable?: boolean;
  collapsible?: boolean;
  visible?: boolean;
}

export interface ThemeSettings {
  mode: 'light' | 'dark' | 'auto';
  primaryColor: string;
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
}

export interface AppSettings {
  theme: ThemeSettings;
  layout: {
    showWelcomeScreen: boolean;
    autoSaveInterval: number;
    confirmBeforeClose: boolean;
  };
  editor: {
    wordWrap: boolean;
    lineNumbers: boolean;
    minimap: boolean;
    fontSize: number;
    tabSize: number;
  };
  workflow: {
    autoStart: boolean;
    showProgress: boolean;
    parallelExecution: boolean;
  };
}

export const useLayoutStore = defineStore('layout', () => {
  // State
  const layoutState = ref<LayoutState>({
    leftPanelWidth: 300,
    rightPanelWidth: 300,
    bottomPanelHeight: 200,
    leftPanelCollapsed: false,
    rightPanelCollapsed: false,
    bottomPanelCollapsed: true,
    activeLeftTab: 'explorer',
    activeRightTab: 'properties',
    activeBottomTab: 'console'
  });

  const panels = ref<PanelConfiguration[]>([
    {
      id: 'explorer',
      title: 'File Explorer',
      component: 'FileExplorer',
      position: 'left',
      defaultWidth: 300,
      minWidth: 200,
      maxWidth: 600,
      resizable: true,
      collapsible: true,
      visible: true
    },
    {
      id: 'assets',
      title: 'Asset Browser',
      component: 'AssetBrowser',
      position: 'left',
      defaultWidth: 300,
      minWidth: 200,
      maxWidth: 600,
      resizable: true,
      collapsible: true,
      visible: true
    },
    {
      id: 'workflow',
      title: 'Workflow Panel',
      component: 'WorkflowPanel',
      position: 'left',
      defaultWidth: 300,
      minWidth: 200,
      maxWidth: 600,
      resizable: true,
      collapsible: true,
      visible: true
    },
    {
      id: 'properties',
      title: 'Properties Panel',
      component: 'PropertiesPanel',
      position: 'right',
      defaultWidth: 300,
      minWidth: 200,
      maxWidth: 600,
      resizable: true,
      collapsible: true,
      visible: true
    },
    {
      id: 'preview',
      title: 'Preview Panel',
      component: 'PreviewPanel',
      position: 'right',
      defaultWidth: 300,
      minWidth: 200,
      maxWidth: 600,
      resizable: true,
      collapsible: true,
      visible: true
    },
    {
      id: 'timeline',
      title: 'Timeline Panel',
      component: 'TimelinePanel',
      position: 'right',
      defaultWidth: 300,
      minWidth: 200,
      maxWidth: 600,
      resizable: true,
      collapsible: true,
      visible: true
    },
    {
      id: 'console',
      title: 'Console',
      component: 'ConsolePanel',
      position: 'bottom',
      defaultHeight: 200,
      minHeight: 100,
      maxHeight: 400,
      resizable: true,
      collapsible: true,
      visible: true
    },
    {
      id: 'progress',
      title: 'Progress',
      component: 'ProgressPanel',
      position: 'bottom',
      defaultHeight: 200,
      minHeight: 100,
      maxHeight: 400,
      resizable: true,
      collapsible: true,
      visible: true
    },
    {
      id: 'problems',
      title: 'Problems',
      component: 'ProblemsPanel',
      position: 'bottom',
      defaultHeight: 200,
      minHeight: 100,
      maxHeight: 400,
      resizable: true,
      collapsible: true,
      visible: true
    }
  ]);

  const appSettings = ref<AppSettings>({
    theme: {
      mode: 'auto',
      primaryColor: '#1976d2',
      accentColor: '#26a69a',
      fontSize: 'medium',
      compactMode: false
    },
    layout: {
      showWelcomeScreen: true,
      autoSaveInterval: 30000, // 30 seconds
      confirmBeforeClose: true
    },
    editor: {
      wordWrap: true,
      lineNumbers: true,
      minimap: true,
      fontSize: 14,
      tabSize: 2
    },
    workflow: {
      autoStart: false,
      showProgress: true,
      parallelExecution: true
    }
  });

  const currentTheme = ref<'light' | 'dark'>('light');

  // Computed
  const leftPanels = computed(() => 
    panels.value.filter(panel => panel.position === 'left' && panel.visible)
  );

  const rightPanels = computed(() => 
    panels.value.filter(panel => panel.position === 'right' && panel.visible)
  );

  const bottomPanels = computed(() => 
    panels.value.filter(panel => panel.position === 'bottom' && panel.visible)
  );

  const isCompactMode = computed(() => appSettings.value.theme.compactMode);

  // Actions
  const saveLayoutState = (state: Partial<LayoutState>) => {
    Object.assign(layoutState.value, state);
    localStorage.setItem('layout-state', JSON.stringify(layoutState.value));
  };

  const getLayoutState = (): LayoutState | null => {
    const saved = localStorage.getItem('layout-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        Object.assign(layoutState.value, parsed);
        return layoutState.value;
      } catch (error) {
        console.error('Failed to parse saved layout state:', error);
      }
    }
    return null;
  };

  const resetLayout = () => {
    layoutState.value = {
      leftPanelWidth: 300,
      rightPanelWidth: 300,
      bottomPanelHeight: 200,
      leftPanelCollapsed: false,
      rightPanelCollapsed: false,
      bottomPanelCollapsed: true,
      activeLeftTab: 'explorer',
      activeRightTab: 'properties',
      activeBottomTab: 'console'
    };
    localStorage.removeItem('layout-state');
  };

  const togglePanel = (position: 'left' | 'right' | 'bottom') => {
    switch (position) {
      case 'left':
        layoutState.value.leftPanelCollapsed = !layoutState.value.leftPanelCollapsed;
        break;
      case 'right':
        layoutState.value.rightPanelCollapsed = !layoutState.value.rightPanelCollapsed;
        break;
      case 'bottom':
        layoutState.value.bottomPanelCollapsed = !layoutState.value.bottomPanelCollapsed;
        break;
    }
    saveLayoutState(layoutState.value);
  };

  const setPanelSize = (position: 'left' | 'right' | 'bottom', size: number) => {
    switch (position) {
      case 'left':
        layoutState.value.leftPanelWidth = size;
        break;
      case 'right':
        layoutState.value.rightPanelWidth = size;
        break;
      case 'bottom':
        layoutState.value.bottomPanelHeight = size;
        break;
    }
    saveLayoutState(layoutState.value);
  };

  const setActiveTab = (position: 'left' | 'right' | 'bottom', tabId: string) => {
    switch (position) {
      case 'left':
        layoutState.value.activeLeftTab = tabId;
        break;
      case 'right':
        layoutState.value.activeRightTab = tabId;
        break;
      case 'bottom':
        layoutState.value.activeBottomTab = tabId;
        break;
    }
    saveLayoutState(layoutState.value);
  };

  const addPanel = (panel: PanelConfiguration) => {
    const existingIndex = panels.value.findIndex(p => p.id === panel.id);
    if (existingIndex !== -1) {
      panels.value[existingIndex] = panel;
    } else {
      panels.value.push(panel);
    }
  };

  const removePanel = (panelId: string) => {
    const index = panels.value.findIndex(p => p.id === panelId);
    if (index !== -1) {
      panels.value.splice(index, 1);
    }
  };

  const togglePanelVisibility = (panelId: string) => {
    const panel = panels.value.find(p => p.id === panelId);
    if (panel) {
      panel.visible = !panel.visible;
    }
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    Object.assign(appSettings.value, newSettings);
    localStorage.setItem('app-settings', JSON.stringify(appSettings.value));
  };

  const getSettings = (): AppSettings => {
    const saved = localStorage.getItem('app-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        Object.assign(appSettings.value, parsed);
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
    return appSettings.value;
  };

  const setTheme = (theme: 'light' | 'dark') => {
    currentTheme.value = theme;
    appSettings.value.theme.mode = theme;
    updateSettings(appSettings.value);
  };

  const applyTheme = () => {
    const mode = appSettings.value.theme.mode;
    let theme: 'light' | 'dark';
    
    if (mode === 'auto') {
      // Detect system preference
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      theme = mode;
    }
    
    currentTheme.value = theme;
    
    // Apply CSS custom properties
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    } else {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    }
    
    // Apply primary color
    root.style.setProperty('--q-primary', appSettings.value.theme.primaryColor);
    root.style.setProperty('--q-accent', appSettings.value.theme.accentColor);
  };

  const exportLayout = (): string => {
    return JSON.stringify({
      layoutState: layoutState.value,
      panels: panels.value,
      settings: appSettings.value
    }, null, 2);
  };

  const importLayout = (layoutData: string): boolean => {
    try {
      const data = JSON.parse(layoutData);
      
      if (data.layoutState) {
        Object.assign(layoutState.value, data.layoutState);
      }
      
      if (data.panels) {
        panels.value = data.panels;
      }
      
      if (data.settings) {
        Object.assign(appSettings.value, data.settings);
      }
      
      saveLayoutState(layoutState.value);
      updateSettings(appSettings.value);
      applyTheme();
      
      return true;
    } catch (error) {
      console.error('Failed to import layout:', error);
      return false;
    }
  };

  const getResponsiveLayout = (): 'desktop' | 'tablet' | 'mobile' => {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  };

  const adaptToScreenSize = () => {
    const layout = getResponsiveLayout();
    
    switch (layout) {
      case 'mobile':
        // On mobile, collapse side panels by default
        layoutState.value.leftPanelCollapsed = true;
        layoutState.value.rightPanelCollapsed = true;
        layoutState.value.bottomPanelCollapsed = true;
        break;
        
      case 'tablet':
        // On tablet, show only left panel
        layoutState.value.rightPanelCollapsed = true;
        break;
        
      case 'desktop':
        // On desktop, restore saved state or defaults
        break;
    }
    
    saveLayoutState(layoutState.value);
  };

  // Initialize
  const initialize = () => {
    getLayoutState();
    getSettings();
    applyTheme();
    
    // Listen for system theme changes
    if (appSettings.value.theme.mode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', applyTheme);
    }
    
    // Listen for window resize
    window.addEventListener('resize', adaptToScreenSize);
  };

  return {
    // State
    layoutState,
    panels,
    appSettings,
    currentTheme,
    
    // Computed
    leftPanels,
    rightPanels,
    bottomPanels,
    isCompactMode,
    
    // Actions
    saveLayoutState,
    getLayoutState,
    resetLayout,
    togglePanel,
    setPanelSize,
    setActiveTab,
    addPanel,
    removePanel,
    togglePanelVisibility,
    updateSettings,
    getSettings,
    setTheme,
    applyTheme,
    exportLayout,
    importLayout,
    getResponsiveLayout,
    adaptToScreenSize,
    initialize
  };
});