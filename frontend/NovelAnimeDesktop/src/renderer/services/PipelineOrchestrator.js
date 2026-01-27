import { NovelParser } from './NovelParser.ts';
import { CharacterSystem } from './CharacterSystem.ts';
import { apiService } from './api.ts';

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
    
    console.log('🚀 [PipelineOrchestrator] Starting workflow execution:', {
      executionId,
      workflowId: workflow.id,
      workflowName: workflow.name,
      nodeCount: workflow.nodes?.length || 0,
      connectionCount: workflow.connections?.length || 0,
      initialDataKeys: Object.keys(initialData)
    });
    
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
    
    // Start execution and wait for it to complete
    await this.startExecution(execution);
    
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
      message: '用户取消执行'
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
    
    console.log('🔄 [PipelineOrchestrator] executeNodes called:', {
      workflowId: workflow.id,
      nodeCount: workflow.nodes?.length || 0,
      connectionCount: workflow.connections?.length || 0
    });
    
    // Find starting nodes
    const startingNodes = this.findStartingNodes(workflow);
    
    console.log('🎯 [PipelineOrchestrator] Starting nodes found:', startingNodes.map(n => ({ id: n.id, name: n.name, type: n.type })));
    
    if (startingNodes.length === 0) {
      console.error('❌ [PipelineOrchestrator] No starting nodes found!');
      console.log('📋 All nodes:', workflow.nodes?.map(n => ({ id: n.id, name: n.name, type: n.type })));
      console.log('🔗 All connections:', workflow.connections);
      throw new Error('No starting nodes found in workflow');
    }

    // Execute nodes in sequence for simplicity
    for (const startNode of startingNodes) {
      console.log('▶️ [PipelineOrchestrator] Executing node chain starting from:', startNode.name);
      await this.executeNodeChain(execution, startNode, executedNodes);
    }

    console.log('✅ [PipelineOrchestrator] All nodes executed:', executedNodes.size);

    // Mark execution as completed
    execution.status = 'completed';
    execution.endTime = new Date();
    execution.progress = 100;
    
    this.notifyProgress(execution.id, {
      pipelineId: execution.id,
      status: 'completed',
      progress: 100,
      message: '工作流执行完成'
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
        message: `正在执行: ${node.name}`,
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
      message: '执行失败',
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
        message: `节点执行失败: ${node.name}`,
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
      
      console.log('📖 小说解析器 - 初始数据:', { 
        hasFile: !!data.file, 
        hasNovelId: !!data.novelId,
        hasChapters: !!(data.chapters && data.chapters.length > 0)
      });
      
      // 如果已经有章节数据（从项目加载），直接使用
      if (data.chapters && data.chapters.length > 0) {
        console.log('✅ 使用项目中已有的章节数据:', data.chapters.length, '章');
        return {
          novelId: data.novelId,
          title: data.title || '未命名小说',
          author: data.author || '未知作者',
          chapters: data.chapters,
          metadata: data.metadata || {},
          text: data.chapters.map(c => c.content || '').join('\n\n'),
          structure: {
            chapterCount: data.chapters.length,
            totalScenes: data.chapters.reduce((sum, c) => sum + (c.scenes?.length || 0), 0)
          }
        };
      }
      
      // 如果有文件，使用NovelParser解析
      if (data.file) {
        console.log('📂 解析上传的文件...');
        const novelStructure = await NovelParser.parseNovel(data.file, data.title);
        
        // 存储解析结果
        const novelId = await NovelParser.storeNovelStructure(novelStructure);
        
        console.log('✅ 文件解析完成:', novelStructure.chapters.length, '章');
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
      
      // 🔧 快速修复：优先从 localStorage 查找最新的 novelId
      console.log('📂 [PipelineOrchestrator] 尝试加载小说数据');
      
      // 方式0: 如果没有提供 novelId，尝试从 localStorage 获取最新的
      let targetNovelId = data.novelId;
      if (!targetNovelId) {
        const storedNovelId = localStorage.getItem('novel_anime_current_novel_id');
        if (storedNovelId) {
          targetNovelId = storedNovelId;
          console.log('📦 [方式0] 从 localStorage 获取到最新 novelId:', targetNovelId);
        }
      }
      
      if (targetNovelId) {
        console.log('📂 [PipelineOrchestrator] 使用 novelId:', targetNovelId);
        
        // 方式1: 从 localStorage 加载 (使用 NovelParser)
        console.log('📦 [方式1] 尝试从 NovelParser localStorage 加载...');
        const novelStructure = await NovelParser.retrieveNovelStructure(targetNovelId);
        if (novelStructure && novelStructure.chapters && novelStructure.chapters.length > 0) {
          console.log('✅ 从 NovelParser localStorage 加载成功:', novelStructure.chapters.length, '章');
          return {
            novelId: targetNovelId,
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
        console.log('⚠️ NovelParser localStorage 无数据');
        
        // 方式2: 直接从 localStorage 加载 (使用 novel_ 前缀)
        console.log('📦 [方式2] 尝试从 localStorage (novel_ 前缀) 加载...');
        try {
          const cachedData = localStorage.getItem(`novel_${targetNovelId}`);
          if (cachedData) {
            const novelData = JSON.parse(cachedData);
            if (novelData.chapters && novelData.chapters.length > 0) {
              console.log('✅ 从 localStorage (novel_ 前缀) 加载成功:', novelData.chapters.length, '章');
              return {
                novelId: targetNovelId,
                title: novelData.title,
                author: novelData.author,
                chapters: novelData.chapters,
                metadata: novelData.metadata || {},
                text: novelData.chapters.map(c => c.content || '').join('\n\n'),
                structure: {
                  chapterCount: novelData.chapters.length,
                  totalScenes: novelData.chapters.reduce((sum, c) => sum + (c.scenes?.length || 0), 0)
                }
              };
            }
          }
        } catch (e) {
          console.warn('⚠️ localStorage (novel_ 前缀) 加载失败:', e);
        }
        console.log('⚠️ localStorage (novel_ 前缀) 无数据');
        
        // 方式3: 从后端 API 加载
        console.log('📡 [方式3] 尝试从后端 API 加载... URL: /novel/' + targetNovelId);
        try {
          const response = await apiService.getNovel(targetNovelId);
          console.log('📡 后端 API 响应:', { success: response.success, hasNovel: !!response.novel, message: response.message });
          
          if (response.success && response.novel) {
            const novel = response.novel;
            console.log('✅ 从后端 API 加载成功:', novel.title, '- 章节数:', novel.chapters?.length || 0);
            
            // 如果后端返回的小说没有章节，尝试调用结构分析 API
            if (!novel.chapters || novel.chapters.length === 0) {
              console.log('📊 小说没有章节数据，尝试调用结构分析 API...');
              try {
                const analyzeResponse = await apiService.axiosInstance.post('/novels/analyze-structure', {
                  novelId: targetNovelId
                });
                console.log('📊 结构分析响应:', analyzeResponse.data);
                
                if (analyzeResponse.data.success || analyzeResponse.data.chaptersCreated > 0) {
                  // 重新获取小说数据（现在应该有章节了）
                  console.log('🔄 重新获取小说数据...');
                  const refreshResponse = await apiService.getNovel(targetNovelId);
                  if (refreshResponse.success && refreshResponse.novel?.chapters?.length > 0) {
                    const refreshedNovel = refreshResponse.novel;
                    console.log('✅ 结构分析后获取到章节:', refreshedNovel.chapters.length, '章');
                    
                    const novelData = {
                      id: targetNovelId,
                      title: refreshedNovel.title,
                      author: refreshedNovel.author,
                      chapters: refreshedNovel.chapters,
                      metadata: {
                        wordCount: refreshedNovel.wordCount,
                        status: refreshedNovel.status,
                        sourceType: refreshedNovel.sourceType
                      }
                    };
                    
                    // 存储到 localStorage
                    try {
                      localStorage.setItem(`novel_${targetNovelId}`, JSON.stringify(novelData));
                      console.log('💾 已将小说数据缓存到 localStorage');
                    } catch (e) {
                      console.warn('⚠️ 缓存到 localStorage 失败:', e);
                    }
                    
                    return {
                      novelId: targetNovelId,
                      title: refreshedNovel.title,
                      author: refreshedNovel.author,
                      chapters: refreshedNovel.chapters,
                      metadata: novelData.metadata,
                      text: refreshedNovel.chapters.map(c => c.content || '').join('\n\n'),
                      structure: {
                        chapterCount: refreshedNovel.chapters.length,
                        totalScenes: refreshedNovel.chapters.reduce((sum, c) => sum + (c.scenes?.length || 0), 0)
                      }
                    };
                  }
                }
              } catch (analyzeError) {
                console.error('❌ 结构分析 API 请求失败:', analyzeError);
              }
            }
            
            // 将后端数据存储到 localStorage 以便后续使用
            if (novel.chapters && novel.chapters.length > 0) {
              const novelData = {
                id: targetNovelId,
                title: novel.title,
                author: novel.author,
                chapters: novel.chapters,
                metadata: {
                  wordCount: novel.wordCount,
                  status: novel.status,
                  sourceType: novel.sourceType
                }
              };
              
              // 存储到 localStorage
              try {
                localStorage.setItem(`novel_${targetNovelId}`, JSON.stringify(novelData));
                console.log('💾 已将小说数据缓存到 localStorage');
              } catch (e) {
                console.warn('⚠️ 缓存到 localStorage 失败:', e);
              }
              
              return {
                novelId: targetNovelId,
                title: novel.title,
                author: novel.author,
                chapters: novel.chapters,
                metadata: novelData.metadata,
                text: novel.chapters.map(c => c.content || '').join('\n\n'),
                structure: {
                  chapterCount: novel.chapters.length,
                  totalScenes: novel.chapters.reduce((sum, c) => sum + (c.scenes?.length || 0), 0)
                }
              };
            } else {
              console.warn('⚠️ 后端返回的小说没有章节数据, novel:', JSON.stringify(novel, null, 2));
            }
          } else {
            console.warn('⚠️ 后端 API 加载失败:', response.message);
          }
        } catch (apiError) {
          console.error('❌ 后端 API 请求失败:', apiError);
        }
      }
      
      // 没有小说数据时抛出错误，不使用模拟数据
      throw new Error('无法加载小说数据：请确保已上传小说文件或选择了有效的项目');
    });

    // Character Analyzer - 使用真实的CharacterSystem服务
    this.nodeProcessors.set('character-analyzer', async (context, node) => {
      const previousResults = this.getPreviousNodeResults(context, node);
      const chapters = previousResults?.chapters || [];
      
      console.log('🔍 角色分析器 - 收到章节数据:', chapters.length, '章');
      
      // 检查是否有有效的章节内容
      const hasValidContent = chapters.length > 0 && 
        chapters.some(ch => ch.content || (ch.scenes && ch.scenes.length > 0));
      
      if (hasValidContent) {
        console.log('✅ 使用真实章节数据进行角色分析');
        
        // 尝试调用后端 AI 服务进行智能场景分割
        let processedChapters = chapters;
        const novelId = context.data?.novelId;
        
        if (novelId) {
          try {
            console.log('🤖 调用后端 AI 服务进行智能场景分割...');
            
            // 调用后端 AI 分析服务
            const analyzeResponse = await apiService.axiosInstance.post('/novels/analyze-structure', {
              novelId: novelId
            });
            
            if (analyzeResponse.data?.success) {
              console.log('✅ 后端 AI 分析完成:', analyzeResponse.data);
              
              // 重新获取小说数据（包含 AI 分析后的场景）
              const novelResponse = await apiService.getNovel(novelId);
              if (novelResponse.success && novelResponse.novel?.chapters?.length > 0) {
                processedChapters = novelResponse.novel.chapters.map(chapter => ({
                  ...chapter,
                  id: chapter.chapterId || chapter.id,
                  scenes: (chapter.scenes || []).map((scene, idx) => ({
                    id: scene.sceneId || `${chapter.chapterId}_scene_${idx + 1}`,
                    chapterId: chapter.chapterId || chapter.id,
                    sceneNumber: scene.sceneNumber || idx + 1,
                    content: scene.content || scene.visualDescription || '',
                    title: scene.title || this.generateSceneTitle(scene.content || '', chapter.title, idx + 1),
                    setting: scene.setting || this.inferSetting(scene.content || ''),
                    mood: scene.mood || '中性',
                    characters: scene.characters || this.extractCharactersFromText(scene.content || '')
                  }))
                }));
                console.log('✅ 从后端获取到 AI 分析后的章节数据:', processedChapters.length, '章');
              }
            }
          } catch (error) {
            console.warn('⚠️ 后端 AI 分析失败，使用本地智能分割:', error.message);
          }
        }
        
        // 如果后端分析失败或没有场景数据，使用本地智能分割
        processedChapters = processedChapters.map((chapter, chapterIndex) => {
          if (!chapter.scenes || chapter.scenes.length === 0) {
            // 智能分割章节内容为多个场景
            const scenes = this.splitChapterIntoScenes(chapter, chapterIndex);
            return {
              ...chapter,
              scenes
            };
          }
          return chapter;
        });
        
        try {
          // 使用CharacterSystem识别角色
          const characters = CharacterSystem.identifyCharacters(processedChapters);
          console.log('📊 识别到角色:', characters.length, '个');
          
          // 追踪重复出现的角色
          const trackedCharacters = CharacterSystem.trackRecurringCharacters(characters, processedChapters);
          
          // 为主要角色创建锁定档案
          const mainCharacters = trackedCharacters.filter(
            c => c.role === 'protagonist' || c.role === 'antagonist'
          );
          
          for (const character of mainCharacters) {
            CharacterSystem.createLockedProfile(character);
          }
          
          // 传递章节数据给下一个节点
          return {
            chapters: processedChapters, // 保持章节数据传递
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
        } catch (error) {
          console.error('❌ 角色分析失败:', error);
          throw new Error(`角色分析失败: ${error.message}`);
        }
      }
      
      // 没有有效章节内容时抛出错误
      throw new Error('角色分析失败：没有有效的章节内容，请确保小说已正确解析');
    });

    // Scene Generator - 场景生成节点
    this.nodeProcessors.set('scene-generator', async (context, node) => {
      const previousResults = this.getPreviousNodeResults(context, node);
      const chapters = previousResults?.chapters || [];
      const characters = previousResults?.characters || [];
      
      console.log('🎬 场景生成器 - 收到章节数据:', chapters.length, '章, 角色:', characters.length, '个');
      
      // 从章节中提取场景
      const scenes = [];
      let sceneIndex = 0;
      
      for (const chapter of chapters) {
        if (chapter.scenes && chapter.scenes.length > 0) {
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
        } else if (chapter.content) {
          // 如果章节没有预分割的场景，将整个章节作为一个场景
          sceneIndex++;
          scenes.push({
            id: sceneIndex,
            chapterId: chapter.id,
            title: chapter.title || `场景 ${sceneIndex}`,
            description: chapter.content.substring(0, 100) + '...',
            setting: '未知场景',
            characters: [],
            content: chapter.content
          });
        }
      }
      
      if (scenes.length === 0) {
        // 没有有效场景数据时抛出错误
        throw new Error('场景生成失败：没有有效的场景数据，请确保章节已正确分析');
      }
      
      console.log('✅ 生成了', scenes.length, '个场景');
      return { chapters, characters, scenes, totalScenes: scenes.length };
    });

    // Script Converter - 脚本转换节点
    this.nodeProcessors.set('script-converter', async (context, node) => {
      const previousResults = this.getPreviousNodeResults(context, node);
      const scenes = previousResults?.scenes || [];
      const characters = previousResults?.characters || [];
      
      console.log('📝 脚本转换器 - 收到场景数据:', scenes.length, '个场景');
      
      // 将场景转换为脚本格式
      const scripts = scenes.map((scene, index) => ({
        id: `script_${index + 1}`,
        sceneId: scene.id,
        title: scene.title,
        content: this.convertToScriptFormat(scene),
        dialogues: this.extractDialogues(scene.content || scene.description)
      }));
      
      if (scripts.length === 0) {
        // 没有有效场景数据时抛出错误
        throw new Error('脚本转换失败：没有有效的场景数据，请确保场景已正确生成');
      }
      
      console.log('✅ 生成了', scripts.length, '个脚本');
      return {
        characters,
        scripts,
        totalScripts: scripts.length,
        dialogues: scripts.flatMap(s => s.dialogues)
      };
    });

    // Video Generator - 视频生成节点
    this.nodeProcessors.set('video-generator', async (context, node) => {
      const previousResults = this.getPreviousNodeResults(context, node);
      const scripts = previousResults?.scripts || [];
      const chapters = previousResults?.chapters || [];
      const characters = previousResults?.characters || [];
      const scenes = previousResults?.scenes || [];
      
      console.log('🎥 视频生成器 - 收到脚本数据:', scripts.length, '个脚本');
      
      if (scripts.length === 0) {
        throw new Error('视频生成失败：没有有效的脚本数据，请确保脚本已正确转换');
      }
      
      // TODO: 调用真实的 AI 视频生成服务
      // 目前返回脚本数据作为视频生成的准备数据
      // 实际的视频生成需要集成 AI 视频生成 API（如 Runway、Pika 等）
      
      const videoTasks = scripts.map((script, index) => ({
        id: `video_task_${index + 1}`,
        scriptId: script.id || `script_${index + 1}`,
        title: script.title,
        status: 'pending', // pending, processing, completed, failed
        content: script.content,
        dialogues: script.dialogues
      }));
      
      console.log('✅ 创建了', videoTasks.length, '个视频生成任务');
      
      return {
        // 传递所有上游数据
        chapters,
        characters,
        scenes,
        scripts,
        // 视频生成任务
        videoTasks,
        totalTasks: videoTasks.length,
        metadata: { 
          status: 'tasks_created',
          message: '视频生成任务已创建，等待 AI 视频服务处理',
          resolution: '1080p',
          format: 'mp4'
        }
      };
    });

    // Image Generator - 图片生成节点（新增）
    this.nodeProcessors.set('image-generator', async (context, node) => {
      const previousResults = this.getPreviousNodeResults(context, node);
      const scenes = previousResults?.scenes || [];
      const scripts = previousResults?.scripts || [];
      const chapters = previousResults?.chapters || [];
      const characters = previousResults?.characters || [];
      
      console.log('🎨 图片生成器 - 收到场景数据:', scenes.length, '个场景');
      
      // 动态导入 ImageGenerationService
      const { imageGenerationService } = await import('./ImageGenerationService.ts');
      
      // 为每个场景生成分镜图片
      const storyboards = [];
      
      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        
        try {
          // 构建图片生成提示词
          const prompt = this.buildImagePrompt(scene, characters);
          
          console.log(`🎨 生成分镜 ${i + 1}/${scenes.length}:`, prompt.substring(0, 50) + '...');
          
          // 生成图片
          const result = await imageGenerationService.generateImage({
            prompt,
            width: 800,
            height: 450
          });
          
          storyboards.push({
            id: `storyboard_${i + 1}`,
            sceneId: scene.id,
            description: scene.content?.substring(0, 200) || scene.description || '',
            imageUrl: result.imageUrl,
            thumbnailUrl: result.thumbnailUrl,
            dialogue: this.extractFirstDialogue(scene.content || ''),
            speaker: this.extractSpeaker(scene.content || ''),
            duration: 3000,
            prompt: prompt,
            generatedAt: result.generatedAt
          });
          
          console.log(`✅ 分镜 ${i + 1} 生成完成`);
        } catch (error) {
          console.error(`❌ 分镜 ${i + 1} 生成失败:`, error);
          
          // 失败时使用占位符
          storyboards.push({
            id: `storyboard_${i + 1}`,
            sceneId: scene.id,
            description: scene.content?.substring(0, 200) || scene.description || '',
            imageUrl: undefined, // 将显示占位符
            thumbnailUrl: undefined,
            dialogue: this.extractFirstDialogue(scene.content || ''),
            speaker: this.extractSpeaker(scene.content || ''),
            duration: 3000
          });
        }
      }
      
      console.log('✅ 生成了', storyboards.length, '个分镜图片');
      
      return {
        // 传递所有上游数据
        chapters,
        characters,
        scenes,
        scripts,
        // 分镜数据（包含图片）
        storyboards,
        totalStoryboards: storyboards.length,
        metadata: {
          status: 'images_generated',
          message: `成功生成 ${storyboards.length} 个分镜图片`,
          provider: imageGenerationService.getConfig().provider
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

  /**
   * 智能分割章节内容为多个场景
   * 基于段落分隔、场景标记、对话密度等进行分割
   */
  splitChapterIntoScenes(chapter, chapterIndex) {
    const content = chapter.content || '';
    if (!content.trim()) {
      return [{
        id: `${chapter.id}_scene_1`,
        chapterId: chapter.id,
        sceneNumber: 1,
        content: '',
        title: `${chapter.title || `第${chapterIndex + 1}章`} - 场景1`,
        setting: this.inferSetting(content),
        characters: []
      }];
    }

    const scenes = [];
    
    // 场景分割策略：
    // 1. 按明显的场景分隔符分割（如 "***", "---", "===", 空行组）
    // 2. 按段落数量分割（每3-5个段落为一个场景）
    // 3. 按对话块分割
    
    // 首先尝试按场景分隔符分割
    const sceneDelimiters = /\n\s*(?:\*{3,}|—{3,}|-{3,}|={3,}|·{3,})\s*\n/g;
    let segments = content.split(sceneDelimiters).filter(s => s.trim());
    
    // 如果没有明显分隔符，按段落分割
    if (segments.length <= 1) {
      // 按双换行分割段落
      const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
      
      if (paragraphs.length > 3) {
        // 每3-4个段落组成一个场景
        const paragraphsPerScene = Math.ceil(paragraphs.length / Math.ceil(paragraphs.length / 4));
        segments = [];
        for (let i = 0; i < paragraphs.length; i += paragraphsPerScene) {
          segments.push(paragraphs.slice(i, i + paragraphsPerScene).join('\n\n'));
        }
      } else {
        segments = [content];
      }
    }
    
    // 为每个片段创建场景
    segments.forEach((segment, index) => {
      const sceneNumber = index + 1;
      const sceneTitle = this.generateSceneTitle(segment, chapter.title, sceneNumber);
      const setting = this.inferSetting(segment);
      const characters = this.extractCharactersFromText(segment);
      
      scenes.push({
        id: `${chapter.id}_scene_${sceneNumber}`,
        chapterId: chapter.id,
        sceneNumber,
        content: segment.trim(),
        title: sceneTitle,
        setting,
        characters
      });
    });
    
    console.log(`📖 章节 "${chapter.title}" 分割为 ${scenes.length} 个场景`);
    return scenes;
  }

  /**
   * 生成场景标题
   */
  generateSceneTitle(content, chapterTitle, sceneNumber) {
    // 尝试从内容中提取关键信息作为标题
    const firstLine = content.split('\n')[0]?.trim() || '';
    
    // 如果第一行像是标题（短且不是对话）
    if (firstLine.length > 0 && firstLine.length < 30 && !firstLine.includes('"') && !firstLine.includes('「')) {
      return firstLine;
    }
    
    // 尝试提取场景关键词
    const locationKeywords = this.extractLocationKeywords(content);
    if (locationKeywords) {
      return `${locationKeywords}`;
    }
    
    // 默认标题
    return `${chapterTitle || '章节'} - 场景${sceneNumber}`;
  }

  /**
   * 从文本推断场景设定/地点
   */
  inferSetting(content) {
    if (!content) return '未知场景';
    
    // 常见地点关键词
    const locationPatterns = [
      { pattern: /(?:在|到|来到|走进|进入|回到)([^，。！？\n]{2,10}(?:里|中|内|上|下|前|后|旁))/, group: 1 },
      { pattern: /([^，。！？\n]{2,8}(?:房间|客厅|卧室|厨房|书房|办公室|教室|医院|学校|公司|街道|公园|广场|车站|机场|酒店|餐厅|咖啡厅|商场|超市|银行|图书馆))/, group: 1 },
      { pattern: /([^，。！？\n]{2,6}(?:山|河|湖|海|森林|草原|沙漠|城市|村庄|小镇))/, group: 1 },
      { pattern: /(?:夜晚|清晨|黄昏|傍晚|午后|深夜)的([^，。！？\n]{2,10})/, group: 1 },
    ];
    
    for (const { pattern, group } of locationPatterns) {
      const match = content.match(pattern);
      if (match && match[group]) {
        return match[group].trim();
      }
    }
    
    // 尝试提取时间设定
    const timePatterns = [
      /(?:那天|这天|当天|第二天|次日|翌日)/,
      /(?:早上|上午|中午|下午|傍晚|晚上|深夜|凌晨)/,
      /(?:春天|夏天|秋天|冬天|春日|夏日|秋日|冬日)/
    ];
    
    for (const pattern of timePatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    return '场景';
  }

  /**
   * 提取地点关键词
   */
  extractLocationKeywords(content) {
    const locationMatch = content.match(/(?:在|到|来到|走进|进入|回到)([^，。！？\n]{2,15})/);
    if (locationMatch) {
      return locationMatch[1].trim();
    }
    return null;
  }

  /**
   * 从文本中提取角色名
   */
  extractCharactersFromText(content) {
    const characters = new Set();
    
    // 常见的角色引用模式
    const patterns = [
      // 对话前的角色名：张三说、李四道
      /([^\s，。！？""「」]{2,4})(?:说|道|问|答|喊|叫|笑|哭|叹)/g,
      // 主语位置的角色名
      /(?:^|[。！？\n])([^\s，。！？""「」]{2,4})(?:走|跑|站|坐|看|听|想|觉得|认为|知道|发现)/g,
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const name = match[1].trim();
        // 过滤掉常见的非人名词汇
        if (!this.isCommonWord(name) && name.length >= 2) {
          characters.add(name);
        }
      }
    }
    
    return Array.from(characters).slice(0, 5); // 最多返回5个角色
  }

  /**
   * 检查是否是常见词汇（非人名）
   */
  isCommonWord(word) {
    const commonWords = [
      '他们', '她们', '我们', '你们', '大家', '所有', '这个', '那个',
      '什么', '怎么', '为什么', '哪里', '这里', '那里', '现在', '然后',
      '但是', '因为', '所以', '如果', '虽然', '不过', '而且', '或者',
      '一个', '两个', '几个', '很多', '一些', '这些', '那些', '自己',
      '对方', '别人', '其他', '所有人', '没有人', '有人', '无人'
    ];
    return commonWords.includes(word);
  }

  /**
   * 构建图片生成提示词
   * 🔥 FIX: 增强场景唯一性，确保每个场景生成不同的图片
   */
  buildImagePrompt(scene, characters, sceneIndex = 0, chapterTitle = '') {
    const parts = [];
    
    // 1. 添加章节和场景标识（确保唯一性）
    if (chapterTitle) {
      parts.push(`Chapter: ${chapterTitle}`);
    }
    parts.push(`Scene ${sceneIndex + 1}`);
    
    // 2. 场景标题（最重要的区分因素）
    if (scene.title && scene.title !== '未命名场景') {
      parts.push(scene.title);
    }
    
    // 3. 场景内容（提取更多字符，增加独特性）
    const content = scene.content || scene.description || '';
    if (content) {
      // 🔥 FIX: 提取前200个字符（而不是100），增加独特性
      const visualElements = this.extractVisualElements(content, 200);
      if (visualElements) {
        parts.push(visualElements);
      }
    }
    
    // 4. 场景设定
    if (scene.setting && scene.setting !== '未知场景') {
      parts.push(`Setting: ${scene.setting}`);
    }
    
    // 5. 角色信息
    if (scene.characters && scene.characters.length > 0) {
      const characterNames = scene.characters.slice(0, 3).join(', ');
      parts.push(`Characters: ${characterNames}`);
    }
    
    // 6. 添加场景ID作为最后的保障
    if (scene.id || scene.sceneId) {
      parts.push(`ID: ${scene.id || scene.sceneId}`);
    }
    
    // 7. 如果还是没有内容，使用默认值 + 索引
    if (parts.length === 0) {
      parts.push(`anime scene ${sceneIndex + 1}`);
    }
    
    const prompt = parts.join(', ');
    console.log(`🎨 Scene ${sceneIndex + 1} prompt:`, prompt.substring(0, 100) + '...');
    
    return prompt;
  }

  /**
   * 从文本中提取视觉元素
   * 🔥 FIX: 支持自定义长度，增加场景区分度
   */
  extractVisualElements(text, maxLength = 100) {
    if (!text) return '';
    
    // 提取指定长度的文本
    const shortText = text.substring(0, maxLength).trim();
    
    // 移除对话（引号内的内容）
    const withoutDialogue = shortText.replace(/"[^"]*"/g, '').trim();
    
    return withoutDialogue || shortText;
  }
  
  /**
   * 从场景ID生成唯一的 seed
   * 🔥 FIX: 确保相同场景总是生成相同的seed，不同场景生成不同的seed
   */
  generateSeedFromSceneId(sceneId, sceneIndex = 0) {
    // 如果有场景ID，使用ID生成seed
    if (sceneId) {
      if (typeof sceneId === 'number') {
        return sceneId;
      }
      
      // 如果是字符串，计算哈希值
      let hash = 0;
      for (let i = 0; i < sceneId.length; i++) {
        const char = sceneId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash);
    }
    
    // 如果没有场景ID，使用场景索引生成seed
    return 1000 + sceneIndex;
  }

  /**
   * 提取第一句对话
   */
  extractFirstDialogue(text) {
    if (!text) return undefined;
    
    const dialoguePatterns = [
      /"([^"]+)"/,
      /「([^」]+)」/,
      /"([^"]+)"/
    ];
    
    for (const pattern of dialoguePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return undefined;
  }

  /**
   * 提取说话者
   */
  extractSpeaker(text) {
    if (!text) return undefined;
    
    // 查找"XXX说"、"XXX道"等模式
    const speakerPatterns = [
      /([^\s，。！？""「」]{2,4})(?:说|道|问|答|喊|叫)[:：]?"([^"]+)"/,
      /([^\s，。！？""「」]{2,4})(?:说|道|问|答|喊|叫)[:：]?「([^」]+)」/
    ];
    
    for (const pattern of speakerPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return undefined;
  }
}

export default PipelineOrchestrator;
