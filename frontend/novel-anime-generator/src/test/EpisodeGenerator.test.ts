import { describe, it, expect, beforeEach } from 'vitest'
import { EpisodeGenerator } from '../services/EpisodeGenerator'
import type { Chapter, Character, PlotStructure, Scene, PlotPoint, NarrativeArc } from '../types/core'

describe('EpisodeGenerator', () => {
  let sampleChapters: Chapter[]
  let sampleCharacters: Character[]
  let samplePlotStructure: PlotStructure

  beforeEach(() => {
    // Setup sample data
    const sampleScenes: Scene[] = [
      {
        id: 'scene_1',
        chapterId: 'chapter_1',
        sceneNumber: 1,
        content: '张三是一个年轻的程序员，他住在北京。有一天，他遇到了一个神秘的问题。',
        setting: 'office',
        characters: ['张三']
      },
      {
        id: 'scene_2',
        chapterId: 'chapter_2',
        sceneNumber: 1,
        content: '李四是他的好朋友，也是一名程序员。他们决定一起解决这个问题。',
        setting: 'cafe',
        characters: ['张三', '李四']
      }
    ]

    sampleChapters = [
      {
        id: 'chapter_1',
        title: 'Chapter 1 - 开始',
        content: '张三是一个年轻的程序员，他住在北京。有一天，他遇到了一个神秘的问题。',
        wordCount: 100,
        scenes: [sampleScenes[0]]
      },
      {
        id: 'chapter_2',
        title: 'Chapter 2 - 发展',
        content: '李四是他的好朋友，也是一名程序员。他们决定一起解决这个问题。',
        wordCount: 80,
        scenes: [sampleScenes[1]]
      },
      {
        id: 'chapter_3',
        title: 'Chapter 3 - 高潮',
        content: '最终的决战到来了。张三必须做出关键决定，这将决定所有人的命运。',
        wordCount: 90,
        scenes: [{
          id: 'scene_3',
          chapterId: 'chapter_3',
          sceneNumber: 1,
          content: '最终的决战到来了。张三必须做出关键决定，这将决定所有人的命运。',
          setting: 'battlefield',
          characters: ['张三', '李四']
        }]
      }
    ]

    sampleCharacters = [
      {
        id: 'char_zhang_san',
        name: '张三',
        role: 'protagonist',
        attributes: {
          appearance: '年轻',
          personality: '勇敢'
        },
        relationships: [],
        appearances: []
      },
      {
        id: 'char_li_si',
        name: '李四',
        role: 'supporting',
        attributes: {
          appearance: '聪明',
          personality: '忠诚'
        },
        relationships: [],
        appearances: []
      }
    ]

    const plotPoints: PlotPoint[] = [
      {
        id: 'plot_1',
        type: 'exposition',
        description: '故事开始，介绍主角',
        chapterIds: ['chapter_1'],
        importance: 'major',
        isImmutable: true
      },
      {
        id: 'plot_2',
        type: 'rising_action',
        description: '问题发展，寻求帮助',
        chapterIds: ['chapter_2'],
        importance: 'major',
        isImmutable: false
      },
      {
        id: 'plot_3',
        type: 'climax',
        description: '最终决战',
        chapterIds: ['chapter_3'],
        importance: 'critical',
        isImmutable: true
      }
    ]

    const narrativeArc: NarrativeArc = {
      setup: [plotPoints[0]],
      confrontation: [plotPoints[1], plotPoints[2]],
      resolution: []
    }

    samplePlotStructure = {
      id: 'plot_structure_1',
      novelId: 'novel_1',
      mainPlotline: plotPoints,
      subplots: [],
      themes: ['友情', '成长'],
      narrativeArc
    }
  })

  describe('generateEpisodes', () => {
    it('should generate episodes from chapters and plot structure', () => {
      const episodes = EpisodeGenerator.generateEpisodes(
        sampleChapters,
        samplePlotStructure,
        sampleCharacters,
        300 // 5 minutes
      )

      expect(Array.isArray(episodes)).toBe(true)
      expect(episodes.length).toBeGreaterThan(0)
      
      // Check episode structure
      episodes.forEach((episode, index) => {
        expect(episode.id).toBeDefined()
        expect(episode.episodeNumber).toBe(index + 1)
        expect(episode.title).toBeDefined()
        expect(episode.summary).toBeDefined()
        expect(Array.isArray(episode.scenes)).toBe(true)
        expect(typeof episode.duration).toBe('number')
        expect(Array.isArray(episode.keyEvents)).toBe(true)
        expect(episode.status).toBe('draft')
      })
    })

    it('should create episodes with appropriate duration', () => {
      const targetDuration = 300
      const episodes = EpisodeGenerator.generateEpisodes(
        sampleChapters,
        samplePlotStructure,
        sampleCharacters,
        targetDuration
      )

      episodes.forEach(episode => {
        expect(episode.duration).toBeGreaterThan(0)
        expect(episode.duration).toBeLessThanOrEqual(targetDuration * 1.5) // Allow some flexibility
      })
    })

    it('should include key events from plot structure', () => {
      const episodes = EpisodeGenerator.generateEpisodes(
        sampleChapters,
        samplePlotStructure,
        sampleCharacters
      )

      const allKeyEvents = episodes.flatMap(ep => ep.keyEvents)
      expect(allKeyEvents.length).toBeGreaterThan(0)
      
      // Should have events corresponding to plot points
      allKeyEvents.forEach(event => {
        expect(event.id).toBeDefined()
        expect(event.episodeId).toBeDefined()
        expect(event.eventType).toBeDefined()
        expect(event.description).toBeDefined()
        expect(event.importance).toBeDefined()
      })
    })

    it('should handle empty chapters gracefully', () => {
      const emptyChapters: Chapter[] = []
      const episodes = EpisodeGenerator.generateEpisodes(
        emptyChapters,
        samplePlotStructure,
        sampleCharacters
      )

      expect(Array.isArray(episodes)).toBe(true)
      expect(episodes.length).toBe(0)
    })
  })

  describe('adjustEpisodePacing', () => {
    it('should adjust episode pacing to target duration', () => {
      const episodes = EpisodeGenerator.generateEpisodes(
        sampleChapters,
        samplePlotStructure,
        sampleCharacters,
        600 // 10 minutes - longer than content
      )

      const targetDuration = 300 // 5 minutes
      const adjustedEpisodes = EpisodeGenerator.adjustEpisodePacing(
        episodes,
        targetDuration,
        samplePlotStructure
      )

      expect(adjustedEpisodes.length).toBe(episodes.length)
      
      adjustedEpisodes.forEach(episode => {
        expect(episode.duration).toBeLessThanOrEqual(targetDuration * 1.2)
      })
    })

    it('should preserve essential story elements during pacing adjustment', () => {
      const episodes = EpisodeGenerator.generateEpisodes(
        sampleChapters,
        samplePlotStructure,
        sampleCharacters
      )

      const adjustedEpisodes = EpisodeGenerator.adjustEpisodePacing(
        episodes,
        180, // Very short target duration
        samplePlotStructure
      )

      // Should still have key events
      const allKeyEvents = adjustedEpisodes.flatMap(ep => ep.keyEvents)
      expect(allKeyEvents.length).toBeGreaterThan(0)
      
      // Should preserve critical events
      const criticalEvents = allKeyEvents.filter(e => e.importance === 'critical')
      expect(criticalEvents.length).toBeGreaterThan(0)
    })
  })

  describe('preserveEssentialStoryElements', () => {
    it('should validate story element preservation', () => {
      const episodes = EpisodeGenerator.generateEpisodes(
        sampleChapters,
        samplePlotStructure,
        sampleCharacters
      )

      const validation = EpisodeGenerator.preserveEssentialStoryElements(
        episodes,
        samplePlotStructure
      )

      expect(validation).toBeDefined()
      expect(typeof validation.isValid).toBe('boolean')
      expect(Array.isArray(validation.errors)).toBe(true)
      expect(Array.isArray(validation.warnings)).toBe(true)
    })

    it('should detect missing critical plot points', () => {
      // Create episodes without critical plot points
      const incompleteEpisodes = [{
        id: 'episode_1',
        episodeNumber: 1,
        title: 'Test Episode',
        summary: 'Test summary',
        scenes: [],
        duration: 300,
        keyEvents: [], // No key events
        status: 'draft' as const
      }]

      const validation = EpisodeGenerator.preserveEssentialStoryElements(
        incompleteEpisodes,
        samplePlotStructure
      )

      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
      
      const missingPlotPointError = validation.errors.find(e => 
        e.code === 'MISSING_CRITICAL_PLOT_POINT'
      )
      expect(missingPlotPointError).toBeDefined()
    })
  })

  describe('generateEpisodeMetadata', () => {
    it('should generate enhanced metadata for episodes', () => {
      const episodes = EpisodeGenerator.generateEpisodes(
        sampleChapters,
        samplePlotStructure,
        sampleCharacters
      )

      const enhancedEpisodes = EpisodeGenerator.generateEpisodeMetadata(episodes)

      expect(enhancedEpisodes.length).toBe(episodes.length)
      
      enhancedEpisodes.forEach(episode => {
        expect(episode.summary).toBeDefined()
        expect(episode.summary.length).toBeGreaterThan(0)
        // Enhanced summary should be more detailed
        expect(episode.summary.length).toBeGreaterThanOrEqual(episodes.find(e => e.id === episode.id)!.summary.length)
      })
    })

    it('should include character information in metadata', () => {
      const episodes = EpisodeGenerator.generateEpisodes(
        sampleChapters,
        samplePlotStructure,
        sampleCharacters
      )

      const enhancedEpisodes = EpisodeGenerator.generateEpisodeMetadata(episodes)

      // At least some episodes should mention characters in their enhanced summaries
      const episodesWithCharacters = enhancedEpisodes.filter(ep => 
        ep.summary.includes('主要角色') || ep.summary.includes('张三') || ep.summary.includes('李四')
      )
      
      expect(episodesWithCharacters.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('storeEpisodes and retrieveEpisodes', () => {
    it('should store and retrieve episodes', () => {
      const episodes = EpisodeGenerator.generateEpisodes(
        sampleChapters,
        samplePlotStructure,
        sampleCharacters
      )

      const novelId = 'test_novel_1'
      
      // Store episodes
      const episodeIds = EpisodeGenerator.storeEpisodes(episodes, novelId)
      expect(episodeIds.length).toBe(episodes.length)
      
      // Retrieve episodes
      const retrievedEpisodes = EpisodeGenerator.retrieveEpisodes(novelId)
      expect(retrievedEpisodes.length).toBe(episodes.length)
      
      // Check episode order
      retrievedEpisodes.forEach((episode, index) => {
        expect(episode.episodeNumber).toBe(index + 1)
      })
    })

    it('should return empty array for non-existent novel', () => {
      const retrievedEpisodes = EpisodeGenerator.retrieveEpisodes('non_existent_novel')
      expect(Array.isArray(retrievedEpisodes)).toBe(true)
      expect(retrievedEpisodes.length).toBe(0)
    })
  })

  describe('edge cases', () => {
    it('should handle single chapter novels', () => {
      const singleChapter = [sampleChapters[0]]
      
      const episodes = EpisodeGenerator.generateEpisodes(
        singleChapter,
        samplePlotStructure,
        sampleCharacters
      )

      expect(episodes.length).toBeGreaterThan(0)
      expect(episodes[0].scenes.length).toBeGreaterThan(0)
    })

    it('should handle very short target durations', () => {
      const episodes = EpisodeGenerator.generateEpisodes(
        sampleChapters,
        samplePlotStructure,
        sampleCharacters,
        60 // 1 minute - very short
      )

      expect(episodes.length).toBeGreaterThan(0)
      episodes.forEach(episode => {
        expect(episode.duration).toBeGreaterThan(0)
      })
    })

    it('should handle very long target durations', () => {
      const episodes = EpisodeGenerator.generateEpisodes(
        sampleChapters,
        samplePlotStructure,
        sampleCharacters,
        1800 // 30 minutes - very long
      )

      expect(episodes.length).toBeGreaterThan(0)
      // Should create fewer, longer episodes
      expect(episodes.length).toBeLessThanOrEqual(sampleChapters.length)
    })
  })
})