<template>
  <q-dialog
    v-model="isVisible"
    position="top"
    class="command-palette-dialog"
    @hide="onHide"
  >
    <q-card class="command-palette">
      <!-- Search Input -->
      <div class="search-container">
        <q-input
          ref="searchInput"
          v-model="searchQuery"
          placeholder="输入命令或搜索..."
          dense
          borderless
          class="search-input"
          @keydown="onKeyDown"
        >
          <template #prepend>
            <q-icon name="search" color="grey-6" />
          </template>
          <template #append v-if="searchQuery">
            <q-btn
              flat
              dense
              round
              icon="clear"
              size="sm"
              @click="clearSearch"
            />
          </template>
        </q-input>
      </div>

      <!-- Command Categories -->
      <div class="categories" v-if="!searchQuery && !showRecent">
        <div
          v-for="category in categories"
          :key="category.id"
          class="category-item"
          @click="selectCategory(category.id)"
        >
          <q-icon :name="category.icon" size="20px" />
          <div class="category-info">
            <div class="category-name">{{ category.name }}</div>
            <div class="category-description">{{ category.description }}</div>
          </div>
          <q-icon name="chevron_right" color="grey-5" />
        </div>
      </div>

      <!-- Recent Commands -->
      <div class="recent-commands" v-if="!searchQuery && showRecent && recentCommands.length > 0">
        <div class="section-header">
          <span>最近使用的命令</span>
          <q-btn
            flat
            dense
            size="sm"
            label="清除"
            @click="clearRecentCommands"
          />
        </div>
        <div
          v-for="(command, index) in recentCommands.slice(0, 5)"
          :key="`recent-${command.id}`"
          class="command-item"
          :class="{ selected: selectedIndex === index }"
          @click="executeCommand(command)"
          @mouseenter="selectedIndex = index"
        >
          <q-icon :name="command.icon || 'flash_on'" size="18px" />
          <div class="command-info">
            <div class="command-name">{{ command.name }}</div>
            <div class="command-description">{{ command.description }}</div>
          </div>
          <div class="command-shortcut" v-if="command.shortcut">
            {{ formatShortcut(command.shortcut) }}
          </div>
        </div>
      </div>

      <!-- Filtered Commands -->
      <div class="commands-list" v-if="searchQuery || selectedCategory">
        <div class="section-header" v-if="selectedCategory">
          <q-btn
            flat
            dense
            icon="arrow_back"
            size="sm"
            @click="goBack"
          />
          <span>{{ getCategoryName(selectedCategory) }}</span>
        </div>
        
        <div class="commands-container">
          <div
            v-for="(command, index) in filteredCommands"
            :key="command.id"
            class="command-item"
            :class="{ selected: selectedIndex === index }"
            @click="executeCommand(command)"
            @mouseenter="selectedIndex = index"
          >
            <q-icon :name="command.icon || 'flash_on'" size="18px" />
            <div class="command-info">
              <div class="command-name">
                <span v-html="highlightMatch(command.name, searchQuery)"></span>
              </div>
              <div class="command-description">
                <span v-html="highlightMatch(command.description, searchQuery)"></span>
              </div>
              <div class="command-category" v-if="searchQuery">
                {{ getCategoryName(command.category) }}
              </div>
            </div>
            <div class="command-shortcut" v-if="command.shortcut">
              {{ formatShortcut(command.shortcut) }}
            </div>
          </div>
        </div>

        <!-- No Results -->
        <div class="no-results" v-if="filteredCommands.length === 0">
          <q-icon name="search_off" size="48px" color="grey-5" />
          <div class="no-results-text">
            <div>未找到命令</div>
            <div class="no-results-subtitle">
              尝试不同的搜索词或浏览分类
            </div>
          </div>
        </div>
      </div>

      <!-- Help Footer -->
      <div class="help-footer">
        <div class="help-shortcuts">
          <span class="shortcut-hint">
            <kbd>↑↓</kbd> 导航
          </span>
          <span class="shortcut-hint">
            <kbd>Enter</kbd> 执行
          </span>
          <span class="shortcut-hint">
            <kbd>Esc</kbd> 关闭
          </span>
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { useCommandStore } from '../../stores/command';

interface Command {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  shortcut?: string;
  action: () => void | Promise<void>;
  enabled?: boolean;
  visible?: boolean;
}

interface CommandCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface Props {
  modelValue: boolean;
  commands?: Command[];
}

const props = withDefaults(defineProps<Props>(), {
  commands: () => []
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'command-executed': [command: Command];
}>();

const commandStore = useCommandStore();

// State
const searchInput = ref<any>(null);
const searchQuery = ref('');
const selectedIndex = ref(0);
const selectedCategory = ref<string | null>(null);
const showRecent = ref(true);
const recentCommands = ref<Command[]>([]);

// Computed
const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const categories = computed<CommandCategory[]>(() => [
  {
    id: 'file',
    name: '文件操作',
    description: '创建、打开、保存和管理文件',
    icon: 'folder'
  },
  {
    id: 'edit',
    name: '编辑',
    description: '文本编辑和格式化命令',
    icon: 'edit'
  },
  {
    id: 'view',
    name: '视图',
    description: '面板和布局管理',
    icon: 'visibility'
  },
  {
    id: 'workflow',
    name: '工作流',
    description: '管道和工作流操作',
    icon: 'account_tree'
  },
  {
    id: 'assets',
    name: '素材',
    description: '素材管理和组织',
    icon: 'collections'
  },
  {
    id: 'tools',
    name: '工具',
    description: '开发和调试工具',
    icon: 'build'
  },
  {
    id: 'help',
    name: '帮助',
    description: '文档和支持',
    icon: 'help'
  }
]);

const allCommands = computed(() => {
  const storeCommands = commandStore.getAllCommands();
  const propCommands = props.commands || [];
  return [...storeCommands, ...propCommands].filter(cmd => cmd.visible !== false);
});

const filteredCommands = computed(() => {
  let commands = allCommands.value;

  // Filter by category
  if (selectedCategory.value) {
    commands = commands.filter(cmd => cmd.category === selectedCategory.value);
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    commands = commands.filter(cmd => 
      cmd.name.toLowerCase().includes(query) ||
      cmd.description.toLowerCase().includes(query) ||
      (cmd.shortcut && cmd.shortcut.toLowerCase().includes(query))
    );

    // Sort by relevance
    commands.sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().indexOf(query);
      const bNameMatch = b.name.toLowerCase().indexOf(query);
      
      // Prioritize name matches over description matches
      if (aNameMatch !== -1 && bNameMatch === -1) return -1;
      if (bNameMatch !== -1 && aNameMatch === -1) return 1;
      
      // If both match in name, prioritize earlier matches
      if (aNameMatch !== -1 && bNameMatch !== -1) {
        return aNameMatch - bNameMatch;
      }
      
      // Fall back to alphabetical
      return a.name.localeCompare(b.name);
    });
  }

  return commands.filter(cmd => cmd.enabled !== false);
});

// Methods
const clearSearch = () => {
  searchQuery.value = '';
  selectedIndex.value = 0;
  focusInput();
};

const selectCategory = (categoryId: string) => {
  selectedCategory.value = categoryId;
  selectedIndex.value = 0;
  showRecent.value = false;
};

const goBack = () => {
  selectedCategory.value = null;
  selectedIndex.value = 0;
  showRecent.value = true;
  focusInput();
};

const getCategoryName = (categoryId: string): string => {
  const category = categories.value.find(cat => cat.id === categoryId);
  return category?.name || categoryId;
};

const executeCommand = async (command: Command) => {
  try {
    await command.action();
    addToRecentCommands(command);
    emit('command-executed', command);
    isVisible.value = false;
  } catch (error) {
    console.error('Failed to execute command:', error);
    // Could show a notification here
  }
};

const addToRecentCommands = (command: Command) => {
  // Remove if already exists
  const existingIndex = recentCommands.value.findIndex(cmd => cmd.id === command.id);
  if (existingIndex !== -1) {
    recentCommands.value.splice(existingIndex, 1);
  }
  
  // Add to beginning
  recentCommands.value.unshift(command);
  
  // Keep only last 10
  if (recentCommands.value.length > 10) {
    recentCommands.value = recentCommands.value.slice(0, 10);
  }
  
  // Save to localStorage
  localStorage.setItem('command-palette-recent', JSON.stringify(
    recentCommands.value.map(cmd => ({ id: cmd.id, timestamp: Date.now() }))
  ));
};

const clearRecentCommands = () => {
  recentCommands.value = [];
  localStorage.removeItem('command-palette-recent');
};

const loadRecentCommands = () => {
  try {
    const saved = localStorage.getItem('command-palette-recent');
    if (saved) {
      const recentIds = JSON.parse(saved);
      recentCommands.value = recentIds
        .map((item: any) => allCommands.value.find(cmd => cmd.id === item.id))
        .filter(Boolean);
    }
  } catch (error) {
    console.error('Failed to load recent commands:', error);
  }
};

const formatShortcut = (shortcut: string): string => {
  return shortcut
    .replace(/Ctrl/g, '⌘')
    .replace(/Alt/g, '⌥')
    .replace(/Shift/g, '⇧')
    .replace(/\+/g, ' ');
};

const highlightMatch = (text: string, query: string): string => {
  if (!query) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

const onKeyDown = (event: KeyboardEvent) => {
  const maxIndex = Math.max(0, filteredCommands.value.length - 1);
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      selectedIndex.value = Math.min(selectedIndex.value + 1, maxIndex);
      break;
      
    case 'ArrowUp':
      event.preventDefault();
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
      break;
      
    case 'Enter':
      event.preventDefault();
      if (filteredCommands.value[selectedIndex.value]) {
        executeCommand(filteredCommands.value[selectedIndex.value]);
      }
      break;
      
    case 'Escape':
      event.preventDefault();
      if (selectedCategory.value) {
        goBack();
      } else {
        isVisible.value = false;
      }
      break;
      
    case 'Backspace':
      if (!searchQuery.value && selectedCategory.value) {
        event.preventDefault();
        goBack();
      }
      break;
  }
};

const onHide = () => {
  // Reset state when dialog closes
  searchQuery.value = '';
  selectedCategory.value = null;
  selectedIndex.value = 0;
  showRecent.value = true;
};

const focusInput = async () => {
  await nextTick();
  if (searchInput.value) {
    searchInput.value.focus();
  }
};

// Watchers
watch(isVisible, async (visible) => {
  if (visible) {
    await focusInput();
    loadRecentCommands();
  }
});

watch(searchQuery, () => {
  selectedIndex.value = 0;
  selectedCategory.value = null;
  showRecent.value = false;
});

watch(filteredCommands, () => {
  selectedIndex.value = 0;
});

// Lifecycle
onMounted(() => {
  loadRecentCommands();
});
</script>

<style scoped lang="scss">
.command-palette-dialog {
  .q-dialog__inner {
    padding-top: 10vh;
  }
}

.command-palette {
  width: 600px;
  max-width: 90vw;
  max-height: 70vh;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.search-container {
  padding: 16px;
  border-bottom: 1px solid var(--q-separator);
}

.search-input {
  font-size: 16px;
  
  :deep(.q-field__control) {
    height: 48px;
  }
  
  :deep(.q-field__native) {
    font-size: 16px;
  }
}

.categories {
  max-height: 400px;
  overflow-y: auto;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background: var(--q-background-hover);
  }
}

.category-info {
  flex: 1;
}

.category-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--q-text-primary);
}

.category-description {
  font-size: 12px;
  color: var(--q-text-secondary);
  margin-top: 2px;
}

.recent-commands,
.commands-list {
  max-height: 400px;
  overflow-y: auto;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--q-background-secondary);
  border-bottom: 1px solid var(--q-separator);
  font-size: 12px;
  font-weight: 500;
  color: var(--q-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.commands-container {
  padding: 4px 0;
}

.command-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover,
  &.selected {
    background: var(--q-background-hover);
  }
  
  &.selected {
    background: var(--q-primary);
    color: white;
    
    .command-description,
    .command-category,
    .command-shortcut {
      color: rgba(255, 255, 255, 0.8);
    }
  }
}

.command-info {
  flex: 1;
  min-width: 0;
}

.command-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--q-text-primary);
  
  :deep(mark) {
    background: var(--q-accent);
    color: white;
    padding: 1px 2px;
    border-radius: 2px;
  }
}

.command-description {
  font-size: 12px;
  color: var(--q-text-secondary);
  margin-top: 2px;
  
  :deep(mark) {
    background: var(--q-accent);
    color: white;
    padding: 1px 2px;
    border-radius: 2px;
  }
}

.command-category {
  font-size: 11px;
  color: var(--q-text-tertiary);
  margin-top: 2px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.command-shortcut {
  font-size: 11px;
  color: var(--q-text-secondary);
  background: var(--q-background-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.no-results-text {
  margin-top: 16px;
  
  div:first-child {
    font-size: 16px;
    font-weight: 500;
    color: var(--q-text-primary);
  }
}

.no-results-subtitle {
  font-size: 14px;
  color: var(--q-text-secondary);
  margin-top: 4px;
}

.help-footer {
  padding: 8px 16px;
  background: var(--q-background-secondary);
  border-top: 1px solid var(--q-separator);
}

.help-shortcuts {
  display: flex;
  gap: 16px;
  font-size: 11px;
  color: var(--q-text-secondary);
}

.shortcut-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  
  kbd {
    background: var(--q-background-tertiary);
    border: 1px solid var(--q-separator);
    border-radius: 3px;
    padding: 2px 4px;
    font-size: 10px;
    font-family: monospace;
  }
}

// Scrollbar styling
.categories,
.recent-commands,
.commands-list {
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--q-separator);
    border-radius: 3px;
    
    &:hover {
      background: var(--q-text-secondary);
    }
  }
}

// Dark theme adjustments
.dark-theme {
  .command-palette {
    background: var(--q-background);
    border: 1px solid var(--q-separator);
  }
}
</style>