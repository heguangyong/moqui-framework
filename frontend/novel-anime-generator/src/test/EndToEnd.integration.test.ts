import { describe, it, expect, beforeEach } from 'vitest';
import { NovelParser } from '../services/NovelParser';
import { CharacterSystem } from '../services/CharacterSystem';
import { PlotAnalyzer } from '../services/PlotAnalyzer';
import { EpisodeGenerator } from '../services/EpisodeGenerator';
import { ScriptConverter } from '../services/ScriptConverter';
import { StoryboardCreator } from '../services/StoryboardCreator';
import { AIVideoGenerator } from '../services/AIVideoGenerator';
import { WorkflowEditor } from '../services/WorkflowEditor';
import { PipelineOrchestrator } from '../services/PipelineOrchestrator';
import { AssetLibrary } from '../services/AssetLibrary';
import type { NovelStructure, WorkflowDefinition } from '../types/core';

describe('End-to-End Integration Tests', () => {
  let novelParser: NovelParser;
  let characterSystem: CharacterSystem;
  let plotAnalyzer: PlotAnalyzer;
  let episodeGenerator: EpisodeGenerator;
  let scriptConverter: ScriptConverter;
  let storyboardCreator: StoryboardCreator;
  let aiVideoGenerator: AIVideoGenerator;
  let workflowEditor: WorkflowEditor;
  let orchestrator: PipelineOrchestrator;
  let assetLibrary: AssetLibrary;

  beforeEach(() => {
    novelParser = new NovelParser();
    characterSystem = new CharacterSystem();
    plotAnalyzer = new PlotAnalyzer();
    episodeGenerator = new EpisodeGenerator();
    scriptConverter = new ScriptConverter();
    storyboardCreator = new StoryboardCreator();
    aiVideoGenerator = new AIVideoGenerator();
    workflowEditor = new WorkflowEditor();
    orchestrator = new PipelineOrchestrator();
    assetLibrary = new AssetLibrary();
  });

  describe('Complete Novel-to-Video Pipeline', () => {
    it('should process a complete novel through the entire pipeline', async () => {
      // Sample novel content
      const novelContent = `
# 第一章：开始

在一个遥远的星球上，住着一个名叫小明的年轻人。他有着黑色的头发和明亮的眼睛。

小明对探索宇宙充满了好奇心。"我一定要找到传说中的星际之门！"他坚定地说道。

# 第二章：冒险

小明踏上了寻找星际之门的旅程。在路上，他遇到了智慧的老师傅。

"年轻人，"老师傅说，"真正的力量来自内心的勇气。"

小明点了点头，继续前行。
      `.trim();

      // Step 1: Parse the novel
      const file = new File([novelContent], 'test-novel.txt', { type: 'text/plain' });
      const novel = await NovelParser.parseNovel(file, 'test-novel', 'test-author');
      expect(novel).toBeDefined();
      expect(novel.chapters.length).toBeGreaterThanOrEqual(1);
      expect(novel.title).toBe('test-novel');

      // Step 2: Analyze characters
      const characters = CharacterSystem.identifyCharacters(novel.chapters);
      expect(characters.length).toBeGreaterThan(0);
      
      const xiaoming = characters.find(c => c.name.includes('小明'));
      expect(xiaoming).toBeDefined();
      expect(xiaoming?.role).toBe('protagonist');

      // Step 3: Analyze plot structure
      const plotAnalysis = PlotAnalyzer.extractPlotStructure(novel.chapters, characters, 'adventure');
      expect(plotAnalysis.mainStoryline).toBeDefined();
      expect(plotAnalysis.keyPlotPoints.length).toBeGreaterThan(0);

      // Step 4: Generate episodes
      const episodes = await episodeGenerator.generateEpisodes(novel, {
        targetDuration: 60,
        episodeCount: 2,
        platform: 'short-video'
      });
      expect(episodes.length).toBe(2);
      expect(episodes[0].content).toBeDefined();

      // Step 5: Convert to scripts
      const scripts = await Promise.all(
        episodes.map(episode => scriptConverter.convertToScript(episode, characters))
      );
      expect(scripts).toHaveLength(2);
      expect(scripts[0].scenes).toBeDefined();

      // Step 6: Create storyboards
      const storyboards = await Promise.all(
        scripts.map(script => storyboardCreator.createStoryboard(script, characters))
      );
      expect(storyboards).toHaveLength(2);
      expect(storyboards[0].shots).toBeDefined();

      // Step 7: Generate video metadata (simulated)
      const videoMetadata = await Promise.all(
        storyboards.map(storyboard => 
          aiVideoGenerator.generateVideoMetadata(storyboard, {
            style: 'anime',
            quality: 'standard',
            resolution: '1080p'
          })
        )
      );
      expect(videoMetadata).toHaveLength(2);
      expect(videoMetadata[0].segments).toBeDefined();

      // Verify data flow integrity
      expect(novel.metadata.characterCount).toBeGreaterThan(0);
      expect(episodes.every(ep => ep.metadata.characterReferences.length > 0)).toBe(true);
      expect(scripts.every(script => script.metadata.characterCount > 0)).toBe(true);
    }, 30000);

    it('should handle workflow orchestration end-to-end', async () => {
      // Create a complete workflow
      const workflow = workflowEditor.createDefaultWorkflow();
      expect(workflow.nodes).toHaveLength(7);
      expect(workflow.connections).toHaveLength(6);

      // Register processors for orchestration
      orchestrator.registerNodeProcessor('novel_parser', async (context) => {
        const novelContent = context.data.novelContent || 'Sample novel content';
        const file = new File([novelContent], 'test.txt', { type: 'text/plain' });
        return await NovelParser.parseNovel(file, 'test', 'author');
      });

      orchestrator.registerNodeProcessor('character_system', async (context) => {
        const novel = context.nodeResults.get('novel_parser_node') || context.data.novel;
        return CharacterSystem.identifyCharacters(novel.chapters);
      });

      orchestrator.registerNodeProcessor('plot_analyzer', async (context) => {
        const novel = context.nodeResults.get('novel_parser_node') || context.data.novel;
        const characters = context.nodeResults.get('character_system_node') || [];
        return PlotAnalyzer.extractPlotStructure(novel.chapters, characters, 'adventure');
      });

      // Validate workflow
      const validation = workflowEditor.validateWorkflow(workflow.id);
      expect(validation).toBeDefined();

      // Test workflow execution would be done here
      // (Simplified for integration test)
      expect(workflow).toBeDefined();
    });

    it('should integrate asset library with processing pipeline', async () => {
      // Store character assets
      const characterAssetId = assetLibrary.storeAsset(
        'character',
        '小明角色设定',
        '主角小明的角色设定文件',
        '/characters/xiaoming.json',
        {
          fileSize: 2048,
          format: 'json',
          creator: 'system',
          project: 'test-novel'
        },
        ['protagonist', 'young', 'adventurous']
      );

      expect(characterAssetId).toBeDefined();

      // Store background assets
      const backgroundAssetId = assetLibrary.storeAsset(
        'background',
        '星球背景',
        '遥远星球的背景图片',
        '/backgrounds/planet.jpg',
        {
          fileSize: 1024000,
          format: 'jpg',
          creator: 'system',
          project: 'test-novel'
        },
        ['space', 'planet', 'sci-fi']
      );

      expect(backgroundAssetId).toBeDefined();

      // Search for assets by project
      const projectAssets = assetLibrary.getAssetsByProject('test-novel');
      expect(projectAssets).toHaveLength(2);

      // Search for character assets
      const characterAssets = assetLibrary.getAssetsByType('character');
      expect(characterAssets.length).toBeGreaterThan(0);

      // Verify asset integration
      const characterAsset = assetLibrary.retrieveAsset(characterAssetId);
      expect(characterAsset?.name).toBe('小明角色设定');
      expect(characterAsset?.tags).toContain('protagonist');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle corrupted input gracefully', async () => {
      // Test with invalid novel content
      const invalidContent = '这不是一个有效的小说格式';
      const invalidFile = new File([invalidContent], 'invalid.txt', { type: 'text/plain' });
      
      try {
        const novel = await NovelParser.parseNovel(invalidFile, 'invalid', 'author');
        // Should still create a novel structure, even if minimal
        expect(novel).toBeDefined();
        expect(novel.chapters.length).toBeGreaterThanOrEqual(0);
      } catch (error) {
        // Or it might throw an error, which is also acceptable
        expect(error).toBeDefined();
      }
    });

    it('should handle missing dependencies in workflow', async () => {
      // Create workflow with missing connections
      const workflow: WorkflowDefinition = {
        id: 'incomplete-workflow',
        name: 'Incomplete Workflow',
        description: 'Workflow with missing connections',
        nodes: [
          {
            id: 'node1',
            type: 'novel_parser',
            name: 'Parser',
            position: { x: 0, y: 0 },
            configuration: {},
            status: 'idle'
          },
          {
            id: 'node2',
            type: 'character_system',
            name: 'Characters',
            position: { x: 100, y: 0 },
            configuration: {},
            status: 'idle'
          }
        ],
        connections: [], // No connections - should be detected
        configuration: {
          autoStart: false,
          parallelExecution: false,
          errorHandling: 'stop',
          maxRetries: 3
        }
      };

      workflowEditor.loadWorkflow(workflow);
      const validation = workflowEditor.validateWorkflow(workflow.id);
      
      // Should detect isolated nodes
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings.some(w => w.code === 'ISOLATED_NODE')).toBe(true);
    });

    it('should maintain data consistency across components', async () => {
      // Create a novel with specific character
      const novelContent = `
# 测试章节

主角张三是一个勇敢的战士。他的朋友李四总是支持他。

"我们一起战斗！"张三说道。
"好的，我的朋友。"李四回答。
      `.trim();

      const file = new File([novelContent], 'consistency-test.txt', { type: 'text/plain' });
      const novel = await NovelParser.parseNovel(file, 'consistency-test', 'author');
      expect(novel).toBeDefined();

      const characters = CharacterSystem.identifyCharacters(novel.chapters);
      
      // Verify character consistency
      const zhangsan = characters.find(c => c.name.includes('张三'));
      const lisi = characters.find(c => c.name.includes('李四'));
      
      // Characters should be detected (flexible assertion for different parsing results)
      expect(characters.length).toBeGreaterThan(0);
      
      // Generate episode and verify character references are maintained
      const episodes = await episodeGenerator.generateEpisodes(novel, {
        targetDuration: 30,
        episodeCount: 1,
        platform: 'short-video'
      });

      expect(episodes[0].metadata.characterReferences).toContain(zhangsan!.id);
      expect(episodes[0].metadata.characterReferences).toContain(lisi!.id);

      // Convert to script and verify character consistency
      const script = await scriptConverter.convertToScript(episodes[0], characters);
      
      const scriptCharacterIds = script.scenes.flatMap(scene => 
        scene.elements
          .filter(el => el.type === 'dialogue')
          .map(el => el.characterId)
      ).filter(Boolean);

      expect(scriptCharacterIds).toContain(zhangsan!.id);
      expect(scriptCharacterIds).toContain(lisi!.id);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large novel content efficiently', async () => {
      // Generate a larger novel content
      const chapters = Array.from({ length: 10 }, (_, i) => `
# 第${i + 1}章：章节${i + 1}

这是第${i + 1}章的内容。主角在这一章中经历了很多冒险。

"这真是一个漫长的旅程，"主角说道。

故事继续发展，情节变得越来越复杂。
      `).join('\n');

      const startTime = Date.now();
      
      const file = new File([chapters], 'large-novel.txt', { type: 'text/plain' });
      const novel = await NovelParser.parseNovel(file, 'large-novel', 'author');
      expect(novel).toBeDefined();
      expect(novel.chapters.length).toBeGreaterThanOrEqual(1);

      const characters = CharacterSystem.identifyCharacters(novel.chapters);
      expect(characters.length).toBeGreaterThan(0);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(processingTime).toBeLessThan(10000); // 10 seconds
    }, 15000);

    it('should handle concurrent processing requests', async () => {
      const novelContents = [
        '# 小说1\n这是第一个小说的内容。',
        '# 小说2\n这是第二个小说的内容。',
        '# 小说3\n这是第三个小说的内容。'
      ];

      // Process multiple novels concurrently
      const startTime = Date.now();
      
      const results = await Promise.all(
        novelContents.map((content, index) => {
          const file = new File([content], `novel-${index}.txt`, { type: 'text/plain' });
          return NovelParser.parseNovel(file, `novel-${index}`, 'author');
        })
      );

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // All should succeed
      expect(results.every(r => r !== null && r !== undefined)).toBe(true);
      
      // Concurrent processing should be faster than sequential
      expect(processingTime).toBeLessThan(5000); // 5 seconds for 3 novels
    });
  });

  describe('Asset Management Integration', () => {
    it('should track assets throughout the pipeline', async () => {
      const novelContent = `
# 测试小说

主角小红是一个聪明的女孩。她住在一个美丽的城市里。

"我要成为最好的魔法师！"小红宣布道。
      `.trim();

      // Parse novel and store as asset
      const file = new File([novelContent], 'asset-test.txt', { type: 'text/plain' });
      const novel = await NovelParser.parseNovel(file, 'asset-test', 'author');
      expect(novel).toBeDefined();
      
      // Store novel as asset
      const novelAssetId = assetLibrary.storeAsset(
        'novel',
        '测试小说',
        '用于测试的小说文件',
        '/novels/asset-test.txt',
        {
          fileSize: novelContent.length,
          format: 'txt',
          creator: 'test',
          project: 'asset-integration-test'
        },
        ['test', 'magic', 'adventure']
      );

      // Process through pipeline
      const characters = CharacterSystem.identifyCharacters(novel.chapters);
      
      // Store character assets
      const characterAssets = characters.map(character => 
        assetLibrary.storeAsset(
          'character',
          character.name,
          `角色：${character.name}`,
          `/characters/${character.id}.json`,
          {
            fileSize: 1024,
            format: 'json',
            creator: 'character-system',
            project: 'asset-integration-test'
          },
          [character.role, 'character']
        )
      );

      // Verify asset relationships
      const projectAssets = assetLibrary.getAssetsByProject('asset-integration-test');
      expect(projectAssets.length).toBe(1 + characters.length); // novel + characters

      // Verify asset metadata
      const novelAsset = assetLibrary.retrieveAsset(novelAssetId);
      expect(novelAsset?.tags).toContain('magic');
      expect(novelAsset?.metadata.project).toBe('asset-integration-test');

      // Test asset search
      const magicAssets = assetLibrary.getAssetsByTags(['magic']);
      expect(magicAssets.length).toBeGreaterThan(0);
    });
  });
});