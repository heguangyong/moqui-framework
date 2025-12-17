import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useLayoutStore } from './layout';
import { useProjectStore } from './project';
import { useWorkflowStore } from './workflow';
import { useNotificationStore } from './notification';

export interface Command {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  shortcut?: string;
  action: () => void | Promise<void>;
  enabled?: boolean;
  visible?: boolean;
  context?: string[];
}

export interface CommandCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const useCommandStore = defineStore('command', () => {
  const router = useRouter();
  const layoutStore = useLayoutStore();
  const projectStore = useProjectStore();
  const workflowStore = useWorkflowStore();
  const notificationStore = useNotificationStore();

  // State
  const customCommands = ref<Command[]>([]);
  const commandHistory = ref<string[]>([]);
  const shortcuts = ref<Map<string, string>>(new Map());

  // Built-in commands
  const builtInCommands = computed<Command[]>(() => [
    // File Operations
    {
      id: 'file.new-project',
      name: '新建项目',
      description: '创建一个新的小说转动漫项目',
      category: 'file',
      icon: 'add',
      shortcut: 'Ctrl+N',
      action: () => projectStore.createNewProject()
    },
    {
      id: 'file.open-project',
      name: '打开项目',
      description: '打开一个现有项目',
      category: 'file',
      icon: 'folder_open',
      shortcut: 'Ctrl+O',
      action: () => projectStore.openProject()
    },
    {
      id: 'file.save-project',
      name: '保存项目',
      description: '保存当前项目',
      category: 'file',
      icon: 'save',
      shortcut: 'Ctrl+S',
      action: () => projectStore.saveCurrentProject(),
      enabled: computed(() => !!projectStore.currentProject)
    },
    {
      id: 'file.import-novel',
      name: '导入小说',
      description: '导入小说文本文件',
      category: 'file',
      icon: 'upload_file',
      action: () => projectStore.importNovel()
    },
    {
      id: 'file.export-video',
      name: '导出视频',
      description: '导出生成的视频',
      category: 'file',
      icon: 'download',
      action: () => projectStore.exportVideo(),
      enabled: computed(() => !!projectStore.currentProject?.hasGeneratedVideo)
    },

    // Edit Operations
    {
      id: 'edit.undo',
      name: '撤销',
      description: '撤销上一个操作',
      category: 'edit',
      icon: 'undo',
      shortcut: 'Ctrl+Z',
      action: () => console.log('Undo action')
    },
    {
      id: 'edit.redo',
      name: '重做',
      description: '重做上一个撤销的操作',
      category: 'edit',
      icon: 'redo',
      shortcut: 'Ctrl+Y',
      action: () => console.log('Redo action')
    },
    {
      id: 'edit.find',
      name: '查找',
      description: '在当前文档中查找文本',
      category: 'edit',
      icon: 'search',
      shortcut: 'Ctrl+F',
      action: () => console.log('Find action')
    },
    {
      id: 'edit.replace',
      name: '查找和替换',
      description: '在当前文档中查找和替换文本',
      category: 'edit',
      icon: 'find_replace',
      shortcut: 'Ctrl+H',
      action: () => console.log('Replace action')
    },

    // View Operations
    {
      id: 'view.toggle-left-panel',
      name: '切换左侧面板',
      description: '显示或隐藏左侧边栏',
      category: 'view',
      icon: 'view_sidebar',
      shortcut: 'Ctrl+1',
      action: () => layoutStore.togglePanel('left')
    },
    {
      id: 'view.toggle-right-panel',
      name: '切换右侧面板',
      description: '显示或隐藏右侧边栏',
      category: 'view',
      icon: 'view_sidebar',
      shortcut: 'Ctrl+2',
      action: () => layoutStore.togglePanel('right')
    },
    {
      id: 'view.toggle-bottom-panel',
      name: '切换底部面板',
      description: '显示或隐藏底部面板',
      category: 'view',
      icon: 'view_agenda',
      shortcut: 'Ctrl+3',
      action: () => layoutStore.togglePanel('bottom')
    },
    {
      id: 'view.toggle-theme',
      name: 'Toggle Theme',
      description: 'Switch between light and dark themes',
      category: 'view',
      icon: 'brightness_6',
      action: () => {
        const newTheme = layoutStore.currentTheme === 'light' ? 'dark' : 'light';
        layoutStore.setTheme(newTheme);
      }
    },
    {
      id: 'view.reset-layout',
      name: 'Reset Layout',
      description: 'Reset panels to default layout',
      category: 'view',
      icon: 'restore',
      action: () => layoutStore.resetLayout()
    },
    {
      id: 'view.fullscreen',
      name: 'Toggle Fullscreen',
      description: 'Enter or exit fullscreen mode',
      category: 'view',
      icon: 'fullscreen',
      shortcut: 'F11',
      action: () => {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
      }
    },

    // Workflow Operations
    {
      id: 'workflow.new-workflow',
      name: 'New Workflow',
      description: 'Create a new workflow',
      category: 'workflow',
      icon: 'add_circle',
      action: () => workflowStore.createNewWorkflow()
    },
    {
      id: 'workflow.run-workflow',
      name: 'Run Workflow',
      description: 'Execute the current workflow',
      category: 'workflow',
      icon: 'play_arrow',
      shortcut: 'Ctrl+R',
      action: () => workflowStore.runCurrentWorkflow(),
      enabled: computed(() => !!workflowStore.activeWorkflow)
    },
    {
      id: 'workflow.stop-workflow',
      name: 'Stop Workflow',
      description: 'Stop the running workflow',
      category: 'workflow',
      icon: 'stop',
      action: () => workflowStore.stopCurrentWorkflow(),
      enabled: computed(() => workflowStore.isRunning)
    },
    {
      id: 'workflow.pause-workflow',
      name: 'Pause Workflow',
      description: 'Pause the running workflow',
      category: 'workflow',
      icon: 'pause',
      action: () => workflowStore.pauseCurrentWorkflow(),
      enabled: computed(() => workflowStore.isRunning && !workflowStore.isPaused)
    },
    {
      id: 'workflow.resume-workflow',
      name: 'Resume Workflow',
      description: 'Resume the paused workflow',
      category: 'workflow',
      icon: 'play_arrow',
      action: () => workflowStore.resumeCurrentWorkflow(),
      enabled: computed(() => workflowStore.isPaused)
    },

    // Asset Operations
    {
      id: 'assets.import-assets',
      name: 'Import Assets',
      description: 'Import assets from files',
      category: 'assets',
      icon: 'upload',
      action: () => console.log('Import assets')
    },
    {
      id: 'assets.export-assets',
      name: 'Export Assets',
      description: 'Export selected assets',
      category: 'assets',
      icon: 'download',
      action: () => console.log('Export assets')
    },
    {
      id: 'assets.refresh-library',
      name: 'Refresh Asset Library',
      description: 'Refresh the asset library',
      category: 'assets',
      icon: 'refresh',
      action: () => console.log('Refresh assets')
    },
    {
      id: 'assets.search-assets',
      name: 'Search Assets',
      description: 'Search for assets in the library',
      category: 'assets',
      icon: 'search',
      shortcut: 'Ctrl+Shift+A',
      action: () => console.log('Search assets')
    },

    // Tools
    {
      id: 'tools.open-console',
      name: 'Open Console',
      description: 'Open the developer console',
      category: 'tools',
      icon: 'terminal',
      shortcut: 'Ctrl+Shift+I',
      action: () => {
        layoutStore.setActiveTab('bottom', 'console');
        if (layoutStore.layoutState.bottomPanelCollapsed) {
          layoutStore.togglePanel('bottom');
        }
      }
    },
    {
      id: 'tools.clear-console',
      name: 'Clear Console',
      description: 'Clear the console output',
      category: 'tools',
      icon: 'clear_all',
      action: () => console.clear()
    },
    {
      id: 'tools.reload-app',
      name: 'Reload Application',
      description: 'Reload the entire application',
      category: 'tools',
      icon: 'refresh',
      shortcut: 'Ctrl+Shift+R',
      action: () => window.location.reload()
    },

    // Help
    {
      id: 'help.show-shortcuts',
      name: 'Keyboard Shortcuts',
      description: 'Show all keyboard shortcuts',
      category: 'help',
      icon: 'keyboard',
      shortcut: 'Ctrl+/',
      action: () => showKeyboardShortcuts()
    },
    {
      id: 'help.documentation',
      name: 'Documentation',
      description: 'Open the documentation',
      category: 'help',
      icon: 'help_outline',
      action: () => window.open('https://docs.example.com', '_blank')
    },
    {
      id: 'help.about',
      name: 'About',
      description: 'Show application information',
      category: 'help',
      icon: 'info',
      action: () => showAboutDialog()
    },
    {
      id: 'help.report-issue',
      name: 'Report Issue',
      description: 'Report a bug or issue',
      category: 'help',
      icon: 'bug_report',
      action: () => window.open('https://github.com/example/issues', '_blank')
    }
  ]);

  // Computed
  const allCommands = computed(() => [
    ...builtInCommands.value,
    ...customCommands.value
  ]);

  const enabledCommands = computed(() => 
    allCommands.value.filter(cmd => {
      if (typeof cmd.enabled === 'function') {
        return cmd.enabled();
      }
      return cmd.enabled !== false;
    })
  );

  const commandsByCategory = computed(() => {
    const categories: Record<string, Command[]> = {};
    enabledCommands.value.forEach(command => {
      if (!categories[command.category]) {
        categories[command.category] = [];
      }
      categories[command.category].push(command);
    });
    return categories;
  });

  // Actions
  const registerCommand = (command: Command) => {
    const existingIndex = customCommands.value.findIndex(cmd => cmd.id === command.id);
    if (existingIndex !== -1) {
      customCommands.value[existingIndex] = command;
    } else {
      customCommands.value.push(command);
    }
  };

  const unregisterCommand = (commandId: string) => {
    const index = customCommands.value.findIndex(cmd => cmd.id === commandId);
    if (index !== -1) {
      customCommands.value.splice(index, 1);
    }
  };

  const executeCommand = async (commandId: string) => {
    const command = allCommands.value.find(cmd => cmd.id === commandId);
    if (!command) {
      throw new Error(`Command not found: ${commandId}`);
    }

    if (typeof command.enabled === 'function' && !command.enabled()) {
      throw new Error(`Command is disabled: ${commandId}`);
    }

    if (command.enabled === false) {
      throw new Error(`Command is disabled: ${commandId}`);
    }

    try {
      await command.action();
      addToHistory(commandId);
    } catch (error) {
      console.error(`Failed to execute command ${commandId}:`, error);
      throw error;
    }
  };

  const getCommand = (commandId: string): Command | undefined => {
    return allCommands.value.find(cmd => cmd.id === commandId);
  };

  const getAllCommands = (): Command[] => {
    return enabledCommands.value;
  };

  const getCommandsByCategory = (category: string): Command[] => {
    return commandsByCategory.value[category] || [];
  };

  const searchCommands = (query: string): Command[] => {
    const lowerQuery = query.toLowerCase();
    return enabledCommands.value.filter(cmd =>
      cmd.name.toLowerCase().includes(lowerQuery) ||
      cmd.description.toLowerCase().includes(lowerQuery) ||
      (cmd.shortcut && cmd.shortcut.toLowerCase().includes(lowerQuery))
    );
  };

  const addToHistory = (commandId: string) => {
    // Remove if already exists
    const existingIndex = commandHistory.value.indexOf(commandId);
    if (existingIndex !== -1) {
      commandHistory.value.splice(existingIndex, 1);
    }

    // Add to beginning
    commandHistory.value.unshift(commandId);

    // Keep only last 50
    if (commandHistory.value.length > 50) {
      commandHistory.value = commandHistory.value.slice(0, 50);
    }

    // Save to localStorage
    localStorage.setItem('command-history', JSON.stringify(commandHistory.value));
  };

  const getRecentCommands = (limit: number = 10): Command[] => {
    return commandHistory.value
      .slice(0, limit)
      .map(id => getCommand(id))
      .filter((cmd): cmd is Command => cmd !== undefined);
  };

  const clearHistory = () => {
    commandHistory.value = [];
    localStorage.removeItem('command-history');
  };

  const registerShortcut = (shortcut: string, commandId: string) => {
    shortcuts.value.set(shortcut, commandId);
  };

  const unregisterShortcut = (shortcut: string) => {
    shortcuts.value.delete(shortcut);
  };

  const handleKeyboardShortcut = async (event: KeyboardEvent): Promise<boolean> => {
    const shortcut = buildShortcutString(event);
    const commandId = shortcuts.value.get(shortcut);
    
    if (commandId) {
      event.preventDefault();
      try {
        await executeCommand(commandId);
        return true;
      } catch (error) {
        console.error('Failed to execute shortcut command:', error);
      }
    }
    
    return false;
  };

  const buildShortcutString = (event: KeyboardEvent): string => {
    const parts: string[] = [];
    
    if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    
    // Handle special keys
    const specialKeys: Record<string, string> = {
      ' ': 'Space',
      'Enter': 'Enter',
      'Escape': 'Escape',
      'Tab': 'Tab',
      'Backspace': 'Backspace',
      'Delete': 'Delete',
      'ArrowUp': 'Up',
      'ArrowDown': 'Down',
      'ArrowLeft': 'Left',
      'ArrowRight': 'Right',
      'F1': 'F1', 'F2': 'F2', 'F3': 'F3', 'F4': 'F4',
      'F5': 'F5', 'F6': 'F6', 'F7': 'F7', 'F8': 'F8',
      'F9': 'F9', 'F10': 'F10', 'F11': 'F11', 'F12': 'F12'
    };
    
    const key = specialKeys[event.key] || event.key.toUpperCase();
    parts.push(key);
    
    return parts.join('+');
  };

  const initializeShortcuts = () => {
    // Register shortcuts from built-in commands
    builtInCommands.value.forEach(command => {
      if (command.shortcut) {
        registerShortcut(command.shortcut, command.id);
      }
    });
  };

  const loadHistory = () => {
    try {
      const saved = localStorage.getItem('command-history');
      if (saved) {
        commandHistory.value = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load command history:', error);
    }
  };

  // Helper functions for specific commands
  const showKeyboardShortcuts = () => {
    const shortcuts = allCommands.value
      .filter(cmd => cmd.shortcut)
      .map(cmd => ({
        name: cmd.name,
        shortcut: cmd.shortcut,
        category: cmd.category
      }));

    notificationStore.showDialog({
      title: 'Keyboard Shortcuts',
      message: 'Available keyboard shortcuts',
      data: shortcuts
    });
  };

  const showAboutDialog = () => {
    notificationStore.showDialog({
      title: 'About Novel Anime Generator',
      message: 'AI-powered system for converting novels into animated videos',
      data: {
        version: '1.0.0',
        author: 'Novel Anime Generator Team',
        license: 'MIT'
      }
    });
  };

  // Initialize
  const initialize = () => {
    loadHistory();
    initializeShortcuts();
    
    // Listen for keyboard shortcuts globally
    document.addEventListener('keydown', handleKeyboardShortcut);
  };

  const cleanup = () => {
    document.removeEventListener('keydown', handleKeyboardShortcut);
  };

  return {
    // State
    customCommands,
    commandHistory,
    shortcuts,
    
    // Computed
    allCommands,
    enabledCommands,
    commandsByCategory,
    
    // Actions
    registerCommand,
    unregisterCommand,
    executeCommand,
    getCommand,
    getAllCommands,
    getCommandsByCategory,
    searchCommands,
    addToHistory,
    getRecentCommands,
    clearHistory,
    registerShortcut,
    unregisterShortcut,
    handleKeyboardShortcut,
    buildShortcutString,
    initializeShortcuts,
    loadHistory,
    initialize,
    cleanup
  };
});