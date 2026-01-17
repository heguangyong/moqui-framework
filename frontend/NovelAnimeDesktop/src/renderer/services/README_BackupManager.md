# Backup Manager 使用指南

## 概述

BackupManager 提供了完整的项目数据备份和恢复功能，确保用户数据的安全性和可恢复性。

## 功能特性

### 1. 自动备份
- 每次保存项目前自动创建备份
- 保留最近10个备份文件
- 自动清理旧备份

### 2. 数据恢复
- 从指定备份恢复项目
- 从最新备份快速恢复
- 智能数据验证

### 3. 数据完整性验证
- 验证项目数据结构
- 检测数据损坏
- 提供详细的错误和警告信息

### 4. 智能恢复
- 尝试从多个备份恢复
- 自动选择有效的备份
- 损坏数据的自动修复尝试

## 使用方法

### 基础使用

```typescript
import { backupManager } from './services/BackupManager';

// 1. 创建备份
await backupManager.createBackup(projectId);

// 2. 列出所有备份
const backups = await backupManager.listBackups(projectId);
console.log('可用备份:', backups);

// 3. 从指定备份恢复
await backupManager.restoreFromBackup(projectId, backupFileName);

// 4. 从最新备份恢复
await backupManager.restoreFromLatestBackup(projectId);

// 5. 获取备份统计信息
const stats = await backupManager.getBackupStats(projectId);
console.log('备份统计:', stats);
```

### 高级功能

```typescript
// 验证项目数据
const validation = backupManager.validateProject(projectData);
if (!validation.valid) {
  console.error('数据验证失败:', validation.errors);
  console.warn('警告:', validation.warnings);
}

// 尝试恢复损坏的项目
const recoveredProject = await backupManager.recoverProject(projectId);
if (recoveredProject) {
  console.log('项目恢复成功');
} else {
  console.error('无法恢复项目');
}

// 清理旧备份
const deletedCount = await backupManager.cleanOldBackups(projectId);
console.log(`清理了 ${deletedCount} 个旧备份`);

// 设置最大备份数量
backupManager.setMaxBackups(20); // 保留20个备份
```

### 在UI中使用

```vue
<template>
  <div class="backup-manager">
    <h3>备份管理</h3>
    
    <!-- 备份列表 -->
    <div class="backup-list">
      <div v-for="backup in backups" :key="backup.fileName" class="backup-item">
        <span>{{ formatDate(backup.timestamp) }}</span>
        <button @click="restore(backup.fileName)">恢复</button>
      </div>
    </div>
    
    <!-- 备份统计 -->
    <div class="backup-stats">
      <p>总备份数: {{ stats.totalBackups }}</p>
      <p>最新备份: {{ formatDate(stats.newestBackup) }}</p>
      <p>最旧备份: {{ formatDate(stats.oldestBackup) }}</p>
    </div>
    
    <!-- 操作按钮 -->
    <div class="actions">
      <button @click="createBackup">创建备份</button>
      <button @click="restoreLatest">恢复最新</button>
      <button @click="cleanOld">清理旧备份</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { backupManager } from '../services/BackupManager';
import { useProjectStore } from '../stores/project';

const projectStore = useProjectStore();
const backups = ref([]);
const stats = ref({});

onMounted(async () => {
  await loadBackups();
  await loadStats();
});

async function loadBackups() {
  const projectId = projectStore.currentProject?.projectId;
  if (projectId) {
    backups.value = await backupManager.listBackups(projectId);
  }
}

async function loadStats() {
  const projectId = projectStore.currentProject?.projectId;
  if (projectId) {
    stats.value = await backupManager.getBackupStats(projectId);
  }
}

async function createBackup() {
  const projectId = projectStore.currentProject?.projectId;
  if (projectId) {
    const success = await backupManager.createBackup(projectId);
    if (success) {
      await loadBackups();
      await loadStats();
    }
  }
}

async function restore(backupFileName) {
  const projectId = projectStore.currentProject?.projectId;
  if (projectId) {
    const confirmed = confirm('确定要恢复此备份吗？当前数据将被覆盖。');
    if (confirmed) {
      const success = await backupManager.restoreFromBackup(projectId, backupFileName);
      if (success) {
        alert('恢复成功！');
        // 重新加载项目数据
        await projectStore.loadProject(projectId);
      } else {
        alert('恢复失败，请查看控制台日志。');
      }
    }
  }
}

async function restoreLatest() {
  const projectId = projectStore.currentProject?.projectId;
  if (projectId) {
    const confirmed = confirm('确定要恢复最新备份吗？');
    if (confirmed) {
      const success = await backupManager.restoreFromLatestBackup(projectId);
      if (success) {
        alert('恢复成功！');
        await projectStore.loadProject(projectId);
      }
    }
  }
}

async function cleanOld() {
  const projectId = projectStore.currentProject?.projectId;
  if (projectId) {
    const deletedCount = await backupManager.cleanOldBackups(projectId);
    alert(`清理了 ${deletedCount} 个旧备份`);
    await loadBackups();
    await loadStats();
  }
}

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN');
}
</script>
```

## 备份文件格式

### 文件命名
```
project.json.backup.2025-01-15T10-30-00-000Z
```

格式说明：
- `project.json.backup.` - 固定前缀
- `2025-01-15` - 日期
- `T` - 分隔符
- `10-30-00-000` - 时间（时-分-秒-毫秒）
- `Z` - UTC时区标识

### 存储位置
```
~/NovelAnimeProjects/
└── project-uuid/
    └── .backups/
        ├── project.json.backup.2025-01-15T10-00-00-000Z
        ├── project.json.backup.2025-01-15T10-30-00-000Z
        └── project.json.backup.2025-01-15T11-00-00-000Z
```

## 数据验证

### 验证规则

BackupManager 会验证以下项目：

**必需字段**:
- `projectId` - 项目唯一标识
- `name` - 项目名称
- `type` - 项目类型
- `createdDate` - 创建日期

**数据结构**:
- `novels` - 必须是数组
- `characters` - 必须是数组
- `workflows` - 必须是数组
- `assets` - 必须是数组
- `settings` - 必须是对象

**日期格式**:
- `createdDate` - 必须是有效的ISO日期
- `lastUpdated` - 如果存在，必须是有效的ISO日期

### 验证结果

```typescript
interface ValidationResult {
  valid: boolean;        // 是否通过验证
  errors: string[];      // 错误列表（阻止使用）
  warnings: string[];    // 警告列表（可以使用但需注意）
}
```

## 错误处理

### 常见错误

1. **备份创建失败**
   - 原因：磁盘空间不足、权限问题
   - 解决：检查磁盘空间，确认文件权限

2. **备份恢复失败**
   - 原因：备份文件损坏、数据格式不兼容
   - 解决：尝试其他备份，使用 `recoverProject()` 自动恢复

3. **数据验证失败**
   - 原因：项目数据结构不完整
   - 解决：查看 `validation.errors` 了解具体问题

### 错误处理示例

```typescript
try {
  const success = await backupManager.restoreFromBackup(projectId, backupFileName);
  if (!success) {
    // 尝试自动恢复
    const recovered = await backupManager.recoverProject(projectId);
    if (recovered) {
      console.log('自动恢复成功');
    } else {
      console.error('无法恢复项目，请联系技术支持');
    }
  }
} catch (error) {
  console.error('恢复过程出错:', error);
  // 显示用户友好的错误消息
  alert('恢复失败，请稍后重试');
}
```

## 最佳实践

### 1. 定期备份
```typescript
// 在关键操作前创建备份
async function performCriticalOperation() {
  // 先备份
  await backupManager.createBackup(projectId);
  
  try {
    // 执行操作
    await criticalOperation();
  } catch (error) {
    // 如果失败，可以恢复
    await backupManager.restoreFromLatestBackup(projectId);
  }
}
```

### 2. 备份管理
```typescript
// 定期清理旧备份
setInterval(async () => {
  const projectId = getCurrentProjectId();
  if (projectId) {
    await backupManager.cleanOldBackups(projectId);
  }
}, 24 * 60 * 60 * 1000); // 每天清理一次
```

### 3. 数据验证
```typescript
// 加载项目前验证数据
async function loadProject(projectId) {
  const project = await fileSystemService.readProjectFile(projectId);
  
  if (project) {
    const validation = backupManager.validateProject(project);
    
    if (!validation.valid) {
      console.error('项目数据无效:', validation.errors);
      // 尝试恢复
      const recovered = await backupManager.recoverProject(projectId);
      return recovered;
    }
    
    if (validation.warnings.length > 0) {
      console.warn('项目数据警告:', validation.warnings);
    }
    
    return project;
  }
  
  return null;
}
```

### 4. 用户通知
```typescript
// 监听备份事件
window.addEventListener('backup-created', (event) => {
  console.log('备份已创建:', event.detail);
  // 显示通知
  showNotification('备份已创建', 'success');
});

window.addEventListener('backup-restored', (event) => {
  console.log('备份已恢复:', event.detail);
  showNotification('备份已恢复', 'success');
});
```

## 性能考虑

### 备份大小
- 单个备份文件通常 < 1MB
- 10个备份约占用 10MB 磁盘空间
- 建议定期清理旧备份

### 备份速度
- 创建备份：< 100ms（小项目）
- 恢复备份：< 200ms（小项目）
- 列出备份：< 50ms

### 优化建议
1. 不要频繁创建备份（已由AutoSaveManager控制）
2. 定期清理旧备份释放空间
3. 大项目考虑增量备份（未来功能）

## 与AutoSaveManager集成

BackupManager 与 AutoSaveManager 无缝集成：

```typescript
import { autoSaveManager } from './AutoSaveManager';
import { backupManager } from './BackupManager';

// AutoSaveManager 会在每次保存前自动创建备份
autoSaveManager.start(projectId);

// 手动强制保存（会触发备份）
await autoSaveManager.forceSave();

// 查看备份
const backups = await backupManager.listBackups(projectId);
```

## 故障恢复流程

### 应用崩溃恢复

```typescript
// 应用启动时检查
async function onAppStart() {
  const lastProject = getLastOpenedProject();
  
  if (lastProject) {
    try {
      // 尝试加载项目
      const project = await projectManager.loadProject(lastProject.projectId);
      
      if (!project) {
        // 加载失败，尝试恢复
        const recovered = await backupManager.recoverProject(lastProject.projectId);
        
        if (recovered) {
          alert('检测到上次异常退出，已自动恢复项目数据');
        } else {
          alert('无法恢复项目，请手动选择备份');
        }
      }
    } catch (error) {
      console.error('启动恢复失败:', error);
    }
  }
}
```

## API参考

### BackupManager 类

#### 方法

##### createBackup(projectId: string): Promise<boolean>
创建项目备份

##### listBackups(projectId: string): Promise<BackupInfo[]>
列出所有可用备份

##### restoreFromBackup(projectId: string, backupFileName: string): Promise<boolean>
从指定备份恢复

##### restoreFromLatestBackup(projectId: string): Promise<boolean>
从最新备份恢复

##### validateProject(project: any): ValidationResult
验证项目数据结构

##### recoverProject(projectId: string): Promise<Project | null>
尝试恢复损坏的项目

##### cleanOldBackups(projectId: string): Promise<number>
清理旧备份，返回删除的数量

##### getBackupStats(projectId: string): Promise<BackupStats>
获取备份统计信息

##### setMaxBackups(max: number): void
设置最大备份数量

### 类型定义

```typescript
interface BackupInfo {
  fileName: string;
  timestamp: Date;
  size?: number;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface BackupStats {
  totalBackups: number;
  oldestBackup: Date | null;
  newestBackup: Date | null;
  totalSize?: number;
}
```

## 相关文档

- [AutoSaveManager 使用指南](./README_AutoSaveManager.md)
- [FileSystemService 文档](./README_FileSystemService.md)
- [ProjectManager 文档](./README_ProjectManager.md)

---

**版本**: v1.0  
**最后更新**: 2025-01-15  
**Requirements**: 10.2, 10.5
