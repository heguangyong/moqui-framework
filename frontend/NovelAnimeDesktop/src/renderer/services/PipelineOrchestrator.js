import { NovelParser } from './NovelParser.ts';
import { CharacterSystem } from './CharacterSystem.ts';

/**
 * Pipeline Orchestrator Service for Desktop App
 * Integrates with NovelParser, CharacterSystem and other services
 */
export class PipelineOrchestrator {
  constructor() {
    this.executions = new Map();
    this.progressCallbacks = new Map();
    this.nodeProcessors = new Map();
    this.activeExecutions = 0;
    this.maxConcurrentExecutions = 3;
    
    this.initializeNodeProcessors();
  }

  /**
   * Execute workflow with progress tracking
   */
  async executeWorkflow(workflow, initialData = {}, options = {}) {
    const executionId = `execution_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    const execution = {
      id: executionId,
      workflowId: workflow.id,
      status: 'running',
      startTime: new Date(),
      progress: 0,
      context: {
        executionId,
        workflow,
        data: initialData,
        nodeResults: new Map(),
        errors: [],
        warnings: []
      },
      options: {
        parallelExecution: options.parallelExecution ?? true,
        maxRetries: options.maxRetries ?? 3,
        timeout: options.timeout,
        errorHandling: options.errorHandling ?? 'stop'
      }
    };

    this.executions.set(executionId, execution);
    
    // Start execution
    this.startExecution(execution);
    
    return executionId;
  }

  /**
   * Monitor execution progress
   */
  monitorProgress(executionId, callback) {
    this.progressCallbacks.set(executionId, callback);
  }

  /**
   * Get execution status
   */
  getExecutionStatus(executionId) {
    return this.executions.get(executionId) || null;
  }

  /**
   * Cancel execution
   */
  cancelExecution(executionId) {
    const execution = this.executions.get(executionId);
    if (!execution || ['completed', 'failed', 'cancelled'].includes(execution.status)) {
      return false;
    }

    execution.status = 'cancelled';
    execution.endTime = new Date();
    
    this.notifyProgress(executionId, {
      pipelineId: executionId,
      status: 'cancelled',
      progress: execution.progress,
      message: 'Execution cancelled by user'
    });

    return true;
  }

  // Private methods
  async startExecution(execution) {
    try {
      await this.executeNodes(execution);
    } catch (error) {
      this.handleExecutionError(execution, error);
    }
  }

  async executeNodes(execution) {
    const { workflow } = execution.context;
    const executedNodes = new Set();
    
    // Find starting nodes
    const startingNodes = this.findStartingNodes(workflow);
    
    if (startingNodes.length === 0) {
      throw new Error('No starting nodes found in workflow');
    }

    // Execute nodes in sequence for simplicity
    for (const startNode of startingNodes) {
      await this.executeNodeChain(execution, startNode, executedNodes);
    }

    // Mark execution as completed
    execution.status = 'completed';
    execution.endTime = new Date();
    execution.progress = 100;
    
    this.notifyProgress(execution.id, {
      pipelineId: execution.id,
      status: 'completed',
      progress: 100,
      message: 'Workflow execution completed successfully'
    });
  }

  async executeNodeChain(execution, node, executedNodes) {
    if (executedNodes.has(node.id) || execution.status !== 'running') {
      return;
    }

    try {
      this.notifyProgress(execution.id, {
        pipelineId: execution.id,
        status: 'running',
        progress: execution.progress,
        message: `Executing: ${node.name}`,
        currentNode: node.id
      });

      const result = await this.executeNode(execution.context, node);
      
      execution.context.nodeResults.set(node.id, result);
      executedNodes.add(node.id);
      
      // Update progress
      execution.progress = Math.round((executedNodes.size / execution.context.workflow.nodes.length) * 100);
      
      // Execute dependent nodes
      const dependentNodes = this.getNodeDependents(execution.context.workflow, node.id);
      
      for (const dependentNode of dependentNodes) {
        await this.executeNodeChain(execution, dependentNode, executedNodes);
      }
      
    } catch (error) {
      await this.handleNodeError(execution, node, error);
    }
  }

  async executeNode(context, node) {
    const processor = this.nodeProcessors.get(node.type);
    if (!processor) {
      throw new Error(`No processor found for node type: ${node.type}`);
    }

    return processor(context, node);
  }

  handleExecutionError(execution, error) {
    execution.status = 'failed';
    execution.endTime = new Date();
    execution.context.errors.push({
      error: error.message || error,
      timestamp: new Date()
    });

    this.notifyProgress(execution.id, {
      pipelineId: execution.id,
      status: 'failed',
      progress: execution.progress,
      message: 'Execution failed',
      error: error.message
    });
  }

  async handleNodeError(execution, node, error) {
    const errorInfo = {
      nodeId: node.id,
      nodeName: node.name,
      error: error.message || error,
      timestamp: new Date()
    };

    execution.context.errors.push(errorInfo);

    if (execution.options.errorHandling === 'stop') {
      execution.status = 'failed';
      execution.endTime = new Date();
      
      this.notifyProgress(execution.id, {
        pipelineId: execution.id,
        status: 'failed',
        progress: execution.progress,
        message: `Execution failed at node: ${node.name}`,
        error: error.message
      });
    }
  }

  notifyProgress(executionId, status) {
    const callback = this.progressCallbacks.get(executionId);
    if (callback) {
      callback(status);
    }
  }

  findStartingNodes(workflow) {
    const nodesWithIncoming = new Set();
    
    workflow.connections.forEach(conn => {
      nodesWithIncoming.add(conn.toNodeId);
    });

    return workflow.nodes.filter(node => !nodesWithIncoming.has(node.id));
  }

  getNodeDependents(workflow, nodeId) {
    const dependentIds = workflow.connections
      .filter(conn => conn.fromNodeId === nodeId)
      .map(conn => conn.toNodeId);

    return workflow.nodes.filter(node => dependentIds.includes(node.id));
  }

  initializeNodeProcessors() {
    // Novel Parser - 使用真实的NovelParser服务
    this.nodeProcessors.set('novel-parser', async (context, node) => {
      const { data } = context;
      
      // 如果有文件，使用NovelParser解析
      if (data.file) {
        const novelStructure = await NovelParser.parseNovel(data.file, data.title);
        
        // 存储解析结果
        const novelId = await NovelParser.storeNovelStructure(novelStructure);
        
        return {
          novelId,
          title: novelStructure.title,
          author: novelStructure.author,
          chapters: novelStructure.chapters,
          metadata: novelStructure.metadata,
          text: novelStructure.chapters.map(c => c.content).join('\n\n'),
          structure: {
            chapterCount: novelStructure.chapters.length,
            totalScenes: novelStructure.chapters.reduce((sum, c) => sum + (c.scenes?.length || 0), 0)
          }
        };
      }
      
      // 如果有novelId，从存储中加载
      if (data.novelId) {
        const novelStructure = await NovelParser.retrieveNovelStructure(data.novelId);
        if (novelStructure) {
          return {
            novelId: data.novelId,
            title: novelStructure.title,
            author: novelStructure.author,
            chapters: novelStructure.chapters,
            metadata: novelStructure.metadata,
            text: novelStructure.chapters.map(c => c.content).join('\n\n'),
            structure: {
              chapterCount: novelStructure.chapters.length,
              totalScenes: novelStructure.chapters.reduce((sum, c) => sum + (c.scenes?.length || 0), 0)
            }
          };
        }
      }
      
      // 模拟数据（用于演示）
      await this.simulateProcessing(1000);
      return {
        chapters: ['第一章', '第二章', '第三章'],
        metadata: { totalWords: 50000, estimatedReadTime: '3小时' }
      };
    });

    // Character Analyzer - 使用真实的CharacterSystem服务
    this.nodeProcessors.set('character-analyzer', async (context, node) => {
      const previousResults = this.getPreviousNodeResults(context, node);
      const chapters = previousResults?.chapters || [];
      
      if (chapters.length > 0 && chapters[0].content) {
        // 使用CharacterSystem识别角色
        const characters = CharacterSystem.identifyCharacters(chapters);
        
        // 追踪重复出现的角色
        const trackedCharacters = CharacterSystem.trackRecurringCharacters(characters, chapters);
        
        // 为主要角色创建锁定档案
        const mainCharacters = trackedCharacters.filter(
          c => c.role === 'protagonist' || c.role === 'antagonist'
        );
        
        for (const character of mainCharacters) {
          CharacterSystem.createLockedProfile(character);
        }
        
        return {
          characters: trackedCharacters.map(c => ({
            id: c.id,
            name: c.name,
            role: c.role,
            description: c.attributes?.personality || '',
            appearance: c.attributes?.appearance || '',
            relationships: c.relationships || []
          })),
          relationships: trackedCharacters.flatMap(c => 
            c.relationships.map(r => `${c.name}-${r.toCharacterId}: ${r.relationshipType}`)
          ),
          statistics: {
            total: trackedCharacters.length,
            protagonists: trackedCharacters.filter(c => c.role === 'protagonist').length,
            antagonists: trackedCharacters.filter(c => c.role === 'antagonist').length,
            supporting: trackedCharacters.filter(c => c.role === 'supporting').length,
            minor: trackedCharacters.filter(c => c.role === 'minor').length
          }
        };
      }
      
      // 模拟数据
      await this.simulateProcessing(1500);
      return {
        characters: [
          { name: '主角', role: 'protagonist', description: '勇敢的年轻人' },
          { name: '配角1', role: 'supporting', description: '忠诚的伙伴' }
        ],
        relationships: ['主角-配角1: 朋友关系']
      };
    });

    // Scene Generator - 场景生成节点
    this.nodeProcessors.set('scene-generator', async (context, node) => {
      const previousResults = this.getPreviousNodeResults(context, node);
      const chapters = previousResults?.chapters || [];
      const characters = previousResults?.characters || [];
      
      // 从章节中提取场景
      const scenes = [];
      let sceneIndex = 0;
      
      for (const chapter of chapters) {
        if (chapter.scenes) {
          for (const scene of chapter.scenes) {
            sceneIndex++;
            scenes.push({
              id: sceneIndex,
              chapterId: chapter.id,
              title: `场景 ${sceneIndex}`,
              description: scene.content?.substring(0, 100) + '...',
              setting: scene.setting || '未知场景',
              characters: scene.characters || [],
              content: scene.content
            });
          }
        }
      }
      
      if (scenes.length === 0) {
        // 模拟数据
        await this.simulateProcessing(2000);
        return {
          scenes: [
            { id: 1, title: '开场', description: '故事开始的场景' },
            { id: 2, title: '冲突', description: '主要冲突发生' },
            { id: 3, title: '解决', description: '问题得到解决' }
          ]
        };
      }
      
      return { scenes, totalScenes: scenes.length };
    });

    // Script Converter - 脚本转换节点
    this.nodeProcessors.set('script-converter', async (context, node) => {
      const previousResults = this.getPreviousNodeResults(context, node);
      const scenes = previousResults?.scenes || [];
      
      // 将场景转换为脚本格式
      const scripts = scenes.map((scene, index) => ({
        id: `script_${index + 1}`,
        sceneId: scene.id,
        title: scene.title,
        content: this.convertToScriptFormat(scene),
        dialogues: this.extractDialogues(scene.content || scene.description)
      }));
      
      if (scripts.length === 0) {
        await this.simulateProcessing(2000);
        return {
          scripts: ['场景1脚本', '场景2脚本', '场景3脚本'],
          dialogues: ['对话1', '对话2', '对话3']
        };
      }
      
      return {
        scripts,
        totalScripts: scripts.length,
        dialogues: scripts.flatMap(s => s.dialogues)
      };
    });

    // Video Generator - 视频生成节点
    this.nodeProcessors.set('video-generator', async (context, node) => {
      const previousResults = this.getPreviousNodeResults(context, node);
      const scripts = previousResults?.scripts || [];
      
      // 模拟视频生成（实际实现需要调用AI视频生成服务）
      await this.simulateProcessing(3000);
      
      const videos = scripts.map((script, index) => ({
        id: `video_${index + 1}`,
        scriptId: script.id || `script_${index + 1}`,
        filename: `scene_${index + 1}.mp4`,
        status: 'generated',
        duration: Math.floor(Math.random() * 60) + 30 // 30-90秒
      }));
      
      return {
        videos: videos.length > 0 ? videos : [
          { id: 'video_1', filename: 'video1.mp4', duration: 60 },
          { id: 'video_2', filename: 'video2.mp4', duration: 45 }
        ],
        metadata: { 
          totalDuration: videos.reduce((sum, v) => sum + (v.duration || 0), 0),
          resolution: '1080p',
          format: 'mp4'
        }
      };
    });
  }

  // 获取前置节点的结果
  getPreviousNodeResults(context, currentNode) {
    const { workflow, nodeResults } = context;
    
    // 找到连接到当前节点的所有节点
    const incomingConnections = workflow.connections.filter(
      conn => conn.toNodeId === currentNode.id
    );
    
    // 合并所有前置节点的结果
    const mergedResults = {};
    for (const conn of incomingConnections) {
      const result = nodeResults.get(conn.fromNodeId);
      if (result) {
        Object.assign(mergedResults, result);
      }
    }
    
    return mergedResults;
  }

  // 将场景转换为脚本格式
  convertToScriptFormat(scene) {
    const lines = [];
    lines.push(`【场景】${scene.title || '未命名场景'}`);
    lines.push(`【地点】${scene.setting || '未知'}`);
    if (scene.characters?.length > 0) {
      lines.push(`【人物】${scene.characters.join('、')}`);
    }
    lines.push('');
    lines.push(scene.description || scene.content || '');
    return lines.join('\n');
  }

  // 从文本中提取对话
  extractDialogues(text) {
    if (!text) return [];
    
    const dialoguePatterns = [
      /"([^"]+)"/g,
      /「([^」]+)」/g,
      /"([^"]+)"/g
    ];
    
    const dialogues = [];
    for (const pattern of dialoguePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        dialogues.push(match[1]);
      }
    }
    
    return dialogues.slice(0, 10); // 限制返回数量
  }

  async simulateProcessing(duration) {
    return new Promise(resolve => setTimeout(resolve, duration));
  }
}