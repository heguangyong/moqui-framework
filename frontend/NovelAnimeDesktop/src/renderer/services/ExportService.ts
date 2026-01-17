/**
 * ExportService.ts - 导出服务
 * 实现多种格式的内容导出功能
 * 
 * Requirements: 8.3, 8.5
 */

export interface ExportOptions {
  format: 'json' | 'text' | 'images';
  range: 'all' | 'current' | 'custom';
  customStart?: number;
  customEnd?: number;
  includeMetadata: boolean;
  includeTimestamps: boolean;
  openAfterExport: boolean;
  fileName: string;
}

export interface Scene {
  id: string;
  title: string;
  description: string;
  characters?: Array<{ id: string; name: string; role: string }>;
  duration: number;
  chapterIndex?: number;
}

export interface Storyboard {
  id: string;
  description: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  dialogue?: string;
  speaker?: string;
  duration: number;
  sceneId?: string;
}

export interface ExportProgress {
  current: number;
  total: number;
  percentage: number;
  currentItem: string;
  status: 'preparing' | 'exporting' | 'completed' | 'error';
  message: string;
}

export class ExportService {
  private progressCallback?: (progress: ExportProgress) => void;
  private isCancelled = false;

  /**
   * 设置进度回调
   */
  setProgressCallback(callback: (progress: ExportProgress) => void): void {
    this.progressCallback = callback;
  }

  /**
   * 取消导出
   */
  cancel(): void {
    this.isCancelled = true;
  }

  /**
   * 导出场景数据
   */
  async exportScenes(scenes: Scene[], options: ExportOptions): Promise<string> {
    this.isCancelled = false;
    
    try {
      // 确定导出范围
      const itemsToExport = this.getItemsInRange(scenes, options);
      
      this.updateProgress(0, itemsToExport.length, '准备导出...', 'preparing');
      
      let result: string;
      
      switch (options.format) {
        case 'json':
          result = await this.exportScenesAsJSON(itemsToExport, options);
          break;
        case 'text':
          result = await this.exportScenesAsText(itemsToExport, options);
          break;
        case 'images':
          result = await this.exportScenesAsImages(itemsToExport, options);
          break;
        default:
          throw new Error(`不支持的导出格式: ${options.format}`);
      }
      
      this.updateProgress(itemsToExport.length, itemsToExport.length, '导出完成', 'completed');
      
      if (options.openAfterExport) {
        await this.openExportFolder(result);
      }
      
      return result;
    } catch (error) {
      this.updateProgress(0, 0, `导出失败: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 导出分镜头数据
   */
  async exportStoryboards(storyboards: Storyboard[], options: ExportOptions): Promise<string> {
    this.isCancelled = false;
    
    try {
      const itemsToExport = this.getItemsInRange(storyboards, options);
      
      this.updateProgress(0, itemsToExport.length, '准备导出...', 'preparing');
      
      let result: string;
      
      switch (options.format) {
        case 'json':
          result = await this.exportStoryboardsAsJSON(itemsToExport, options);
          break;
        case 'text':
          result = await this.exportStoryboardsAsText(itemsToExport, options);
          break;
        case 'images':
          result = await this.exportStoryboardsAsImages(itemsToExport, options);
          break;
        default:
          throw new Error(`不支持的导出格式: ${options.format}`);
      }
      
      this.updateProgress(itemsToExport.length, itemsToExport.length, '导出完成', 'completed');
      
      if (options.openAfterExport) {
        await this.openExportFolder(result);
      }
      
      return result;
    } catch (error) {
      this.updateProgress(0, 0, `导出失败: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 获取指定范围的项目
   */
  private getItemsInRange<T>(items: T[], options: ExportOptions): T[] {
    switch (options.range) {
      case 'all':
        return items;
      case 'current':
        return items.slice(0, 1); // 假设当前项是第一个
      case 'custom':
        const start = Math.max(0, (options.customStart || 1) - 1);
        const end = Math.min(items.length, options.customEnd || items.length);
        return items.slice(start, end);
      default:
        return items;
    }
  }

  /**
   * 导出场景为 JSON 格式
   */
  private async exportScenesAsJSON(scenes: Scene[], options: ExportOptions): Promise<string> {
    const exportData = {
      type: 'scenes',
      exportedAt: new Date().toISOString(),
      metadata: options.includeMetadata ? {
        totalScenes: scenes.length,
        exportOptions: options
      } : undefined,
      scenes: scenes.map((scene, index) => {
        this.updateProgress(index + 1, scenes.length, `导出场景: ${scene.title}`, 'exporting');
        
        if (this.isCancelled) {
          throw new Error('导出已取消');
        }
        
        return {
          ...scene,
          exportIndex: index + 1,
          timestamp: options.includeTimestamps ? new Date().toISOString() : undefined
        };
      })
    };

    const fileName = `${options.fileName}.json`;
    const filePath = await this.saveFile(fileName, JSON.stringify(exportData, null, 2));
    return filePath;
  }

  /**
   * 导出场景为文本格式
   */
  private async exportScenesAsText(scenes: Scene[], options: ExportOptions): Promise<string> {
    let content = '';
    
    if (options.includeMetadata) {
      content += `场景导出报告\n`;
      content += `导出时间: ${new Date().toLocaleString('zh-CN')}\n`;
      content += `场景数量: ${scenes.length}\n`;
      content += `\n${'='.repeat(50)}\n\n`;
    }

    scenes.forEach((scene, index) => {
      this.updateProgress(index + 1, scenes.length, `导出场景: ${scene.title}`, 'exporting');
      
      if (this.isCancelled) {
        throw new Error('导出已取消');
      }

      content += `场景 ${index + 1}: ${scene.title}\n`;
      content += `描述: ${scene.description}\n`;
      
      if (scene.characters && scene.characters.length > 0) {
        content += `角色: ${scene.characters.map(c => `${c.name}(${c.role})`).join(', ')}\n`;
      }
      
      content += `时长: ${Math.floor(scene.duration / 1000)}秒\n`;
      
      if (options.includeTimestamps) {
        content += `导出时间: ${new Date().toLocaleString('zh-CN')}\n`;
      }
      
      content += `\n${'-'.repeat(30)}\n\n`;
    });

    const fileName = `${options.fileName}.txt`;
    const filePath = await this.saveFile(fileName, content);
    return filePath;
  }

  /**
   * 导出场景为图片序列（模拟）
   */
  private async exportScenesAsImages(scenes: Scene[], options: ExportOptions): Promise<string> {
    // 创建导出文件夹
    const folderName = options.fileName;
    const folderPath = await this.createExportFolder(folderName);

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      this.updateProgress(i + 1, scenes.length, `生成场景图片: ${scene.title}`, 'exporting');
      
      if (this.isCancelled) {
        throw new Error('导出已取消');
      }

      // 模拟图片生成过程
      await this.delay(500);
      
      // 创建场景描述文件
      const sceneInfo = {
        title: scene.title,
        description: scene.description,
        characters: scene.characters,
        duration: scene.duration,
        timestamp: options.includeTimestamps ? new Date().toISOString() : undefined
      };
      
      const infoFileName = `scene_${String(i + 1).padStart(3, '0')}_info.json`;
      await this.saveFileToFolder(folderPath, infoFileName, JSON.stringify(sceneInfo, null, 2));
      
      // 这里应该生成实际的图片文件
      // 目前创建一个占位符文件
      const imageFileName = `scene_${String(i + 1).padStart(3, '0')}.png`;
      await this.saveFileToFolder(folderPath, imageFileName, 'placeholder image data');
    }

    return folderPath;
  }

  /**
   * 导出分镜头为 JSON 格式
   */
  private async exportStoryboardsAsJSON(storyboards: Storyboard[], options: ExportOptions): Promise<string> {
    const exportData = {
      type: 'storyboards',
      exportedAt: new Date().toISOString(),
      metadata: options.includeMetadata ? {
        totalStoryboards: storyboards.length,
        exportOptions: options
      } : undefined,
      storyboards: storyboards.map((storyboard, index) => {
        this.updateProgress(index + 1, storyboards.length, `导出分镜头 ${index + 1}`, 'exporting');
        
        if (this.isCancelled) {
          throw new Error('导出已取消');
        }
        
        return {
          ...storyboard,
          exportIndex: index + 1,
          timestamp: options.includeTimestamps ? new Date().toISOString() : undefined
        };
      })
    };

    const fileName = `${options.fileName}.json`;
    const filePath = await this.saveFile(fileName, JSON.stringify(exportData, null, 2));
    return filePath;
  }

  /**
   * 导出分镜头为文本格式
   */
  private async exportStoryboardsAsText(storyboards: Storyboard[], options: ExportOptions): Promise<string> {
    let content = '';
    
    if (options.includeMetadata) {
      content += `分镜头导出报告\n`;
      content += `导出时间: ${new Date().toLocaleString('zh-CN')}\n`;
      content += `分镜头数量: ${storyboards.length}\n`;
      content += `\n${'='.repeat(50)}\n\n`;
    }

    storyboards.forEach((storyboard, index) => {
      this.updateProgress(index + 1, storyboards.length, `导出分镜头 ${index + 1}`, 'exporting');
      
      if (this.isCancelled) {
        throw new Error('导出已取消');
      }

      content += `分镜头 ${index + 1}\n`;
      content += `描述: ${storyboard.description}\n`;
      
      if (storyboard.dialogue) {
        content += `对话: "${storyboard.dialogue}"\n`;
        if (storyboard.speaker) {
          content += `说话人: ${storyboard.speaker}\n`;
        }
      }
      
      content += `时长: ${Math.floor(storyboard.duration / 1000)}秒\n`;
      
      if (storyboard.imageUrl) {
        content += `图片: ${storyboard.imageUrl}\n`;
      }
      
      if (options.includeTimestamps) {
        content += `导出时间: ${new Date().toLocaleString('zh-CN')}\n`;
      }
      
      content += `\n${'-'.repeat(30)}\n\n`;
    });

    const fileName = `${options.fileName}.txt`;
    const filePath = await this.saveFile(fileName, content);
    return filePath;
  }

  /**
   * 导出分镜头为图片序列
   */
  private async exportStoryboardsAsImages(storyboards: Storyboard[], options: ExportOptions): Promise<string> {
    const folderName = options.fileName;
    const folderPath = await this.createExportFolder(folderName);

    for (let i = 0; i < storyboards.length; i++) {
      const storyboard = storyboards[i];
      this.updateProgress(i + 1, storyboards.length, `导出分镜头图片 ${i + 1}`, 'exporting');
      
      if (this.isCancelled) {
        throw new Error('导出已取消');
      }

      // 模拟图片处理过程
      await this.delay(300);
      
      // 创建分镜头信息文件
      const storyboardInfo = {
        description: storyboard.description,
        dialogue: storyboard.dialogue,
        speaker: storyboard.speaker,
        duration: storyboard.duration,
        originalImageUrl: storyboard.imageUrl,
        timestamp: options.includeTimestamps ? new Date().toISOString() : undefined
      };
      
      const infoFileName = `storyboard_${String(i + 1).padStart(3, '0')}_info.json`;
      await this.saveFileToFolder(folderPath, infoFileName, JSON.stringify(storyboardInfo, null, 2));
      
      // 如果有原始图片，复制图片文件（这里模拟）
      if (storyboard.imageUrl) {
        const imageFileName = `storyboard_${String(i + 1).padStart(3, '0')}.png`;
        await this.saveFileToFolder(folderPath, imageFileName, 'image data from ' + storyboard.imageUrl);
      }
    }

    return folderPath;
  }

  /**
   * 更新进度
   */
  private updateProgress(current: number, total: number, message: string, status: ExportProgress['status']): void {
    if (this.progressCallback) {
      const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
      this.progressCallback({
        current,
        total,
        percentage,
        currentItem: message,
        status,
        message
      });
    }
  }

  /**
   * 保存文件（模拟）
   */
  private async saveFile(fileName: string, content: string): Promise<string> {
    // 模拟文件保存过程
    await this.delay(200);
    
    // 在实际实现中，这里会使用 Electron 的文件 API
    const filePath = `/exports/${fileName}`;
    console.log(`文件已保存: ${filePath}`, { size: content.length });
    
    return filePath;
  }

  /**
   * 创建导出文件夹（模拟）
   */
  private async createExportFolder(folderName: string): Promise<string> {
    await this.delay(100);
    const folderPath = `/exports/${folderName}`;
    console.log(`文件夹已创建: ${folderPath}`);
    return folderPath;
  }

  /**
   * 保存文件到指定文件夹（模拟）
   */
  private async saveFileToFolder(folderPath: string, fileName: string, content: string): Promise<void> {
    await this.delay(50);
    console.log(`文件已保存: ${folderPath}/${fileName}`, { size: content.length });
  }

  /**
   * 打开导出文件夹（模拟）
   */
  private async openExportFolder(path: string): Promise<void> {
    console.log(`打开文件夹: ${path}`);
    // 在实际实现中，这里会使用 Electron 的 shell.openPath
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出单例实例
export const exportService = new ExportService();