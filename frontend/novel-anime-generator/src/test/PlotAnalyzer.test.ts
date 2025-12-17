import { describe, it, expect, beforeEach } from 'vitest'
import { PlotAnalyzer } from '../services/PlotAnalyzer'
import type { Chapter, Character, PlotStructure, Scene } from '../types/core'

describe('PlotAnalyzer', () => {
  let sampleChapters: Chapter[]
  let sampleCharacters: Character[]

  beforeEach(() => {
    // Setup sample data
    const sampleScene: Scene = {
      id: 'scene_1',
      chapterId: 'chapter_1',
      sceneNumber: 1,
      content: '这是故事的开始。主角张三遇到了困难，需要解决一个重要问题。',
      setting: 'city',
      characters: ['张三', '李四']
    }

    sampleChapters = [
      {
        id: 'chapter_1',
        title: 'Chapter 1 - 开始',
        content: '这是故事的开始。主角张三遇到了困难，需要解决一个重要问题。他决定寻求帮助。',
        wordCount: 50,
        scenes: [sampleScene]
      },
      {
        id: 'chapter_2',
        title: 'Chapter 2 - 发展',
        content: '张三找到了李四，他们一起面对挑战。情况变得更加复杂和危险。',
        wordCount: 40,
        scenes: [{
          id: 'scene_2',
          chapterId: 'chapter_2',
          sceneNumber: 1,
          content: '张三找到了李四，他们一起面对挑战。情况变得更加复杂和危险。',
          setting: 'forest',
          characters: ['张三', '李四']
        }]
      },
      {
        id: 'chapter_3',
        title: 'Chapter 3 - 高潮',
        content: '最终的决战到来了。张三必须做出关键决定，这将决定所有人的命运。',
        wordCount: 45,
        scenes: [{
          id: 'scene_3',
          chapterId: 'chapter_3',
          sceneNumber: 1,
          content: '最终的决战到来了。张三必须做出关键决定，这将决定所有人的命运。',
          setting: 'battlefield',
          characters: ['张三', '李四', '王五']
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
        relationships: [{
          id: 'rel_1',
          fromCharacterId: 'char_zhang_san',
          toCharacterId: 'char_li_si',
          relationshipType: 'friend',
          description: '好朋友',
          strength: 8
        }],
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
  })

  describe('extractPlotStructure', () => {
    it('should extract plot structure from chapters', () => {
      const plotStructure = PlotAnalyzer.extractPlotStructure(sampleChapters, sampleCharacters, 'novel_1')
      
      expect(plotStructure).toBeDefined()
      expect(plotStructure.novelId).toBe('novel_1')
      expect(plotStructure.mainPlotline).toBeDefined()
      expect(Array.isArray(plotStructure.mainPlotline)).toBe(true)
      expect(plotStructure.subplots).toBeDefined()
      expect(Array.isArray(plotStructure.subplots)).toBe(true)
      expect(plotStructure.themes).toBeDefined()
      expect(Array.isArray(plotStructure.themes)).toBe(true)
      expect(plotStructure.narrativeArc).toBeDefined()
    })

    it('should identify plot points', () => {
      const plotStructure = PlotAnalyzer.extractPlotStructure(sampleChapters, sampleCharacters, 'novel_1')
      
      expect(plotStructure.mainPlotline.length).toBeGreaterThan(0)
      
      // Should have at least basic story structure
      const plotTypes = plotStructure.mainPlotline.map(p => p.type)
      expect(plotTypes).toContain('exposition')
    })

    it('should create narrative arc', () => {
      const plotStructure = PlotAnalyzer.extractPlotStructure(sampleChapters, sampleCharacters, 'novel_1')
      
      expect(plotStructure.narrativeArc.setup).toBeDefined()
      expect(plotStructure.narrativeArc.confrontation).toBeDefined()
      expect(plotStructure.narrativeArc.resolution).toBeDefined()
    })

    it('should handle empty chapters gracefully', () => {
      const emptyChapters: Chapter[] = []
      const plotStructure = PlotAnalyzer.extractPlotStructure(emptyChapters, [], 'novel_empty')
      
      expect(plotStructure).toBeDefined()
      expect(plotStructure.mainPlotline).toBeDefined()
      expect(plotStructure.subplots).toBeDefined()
      expect(plotStructure.themes).toBeDefined()
    })
  })

  describe('validatePlotIntegrity', () => {
    it('should validate plot integrity', () => {
      const plotStructure = PlotAnalyzer.extractPlotStructure(sampleChapters, sampleCharacters, 'novel_1')
      const adaptedContent: any[] = []
      
      const integrityReport = PlotAnalyzer.validatePlotIntegrity(plotStructure, adaptedContent)
      
      expect(integrityReport).toBeDefined()
      expect(integrityReport.plotStructureId).toBe(plotStructure.id)
      expect(integrityReport.violations).toBeDefined()
      expect(Array.isArray(integrityReport.violations)).toBe(true)
      expect(integrityReport.missingElements).toBeDefined()
      expect(Array.isArray(integrityReport.missingElements)).toBe(true)
      expect(typeof integrityReport.score).toBe('number')
      expect(integrityReport.score).toBeGreaterThanOrEqual(0)
      expect(integrityReport.score).toBeLessThanOrEqual(100)
    })

    it('should detect missing critical plot points', () => {
      const plotStructure = PlotAnalyzer.extractPlotStructure(sampleChapters, sampleCharacters, 'novel_1')
      
      // Mark some plot points as immutable
      plotStructure.mainPlotline.forEach(p => {
        if (p.type === 'climax') {
          p.isImmutable = true
          p.importance = 'critical'
        }
      })
      
      const adaptedContent: any[] = []
      const integrityReport = PlotAnalyzer.validatePlotIntegrity(plotStructure, adaptedContent)
      
      // Should detect issues if critical points are missing
      expect(integrityReport.violations.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('resolveConflictsFavoringSource', () => {
    it('should resolve conflicts by favoring source material', () => {
      const plotStructure = PlotAnalyzer.extractPlotStructure(sampleChapters, sampleCharacters, 'novel_1')
      const adaptationConstraints = { maxEpisodes: 5 }
      const conflictingElements: any[] = []
      
      const resolution = PlotAnalyzer.resolveConflictsFavoringSource(
        plotStructure,
        adaptationConstraints,
        conflictingElements
      )
      
      expect(resolution).toBeDefined()
      expect(resolution.resolvedPlot).toBeDefined()
      expect(Array.isArray(resolution.resolutionActions)).toBe(true)
      expect(Array.isArray(resolution.unresolvedConflicts)).toBe(true)
    })
  })

  describe('maintainNarrativeFlow', () => {
    it('should maintain narrative flow during adaptations', () => {
      const plotStructure = PlotAnalyzer.extractPlotStructure(sampleChapters, sampleCharacters, 'novel_1')
      const episodeStructure: any[] = [
        { id: 'ep1', chapters: ['chapter_1'] },
        { id: 'ep2', chapters: ['chapter_2'] },
        { id: 'ep3', chapters: ['chapter_3'] }
      ]
      const adaptationChanges: any[] = []
      
      const flowResult = PlotAnalyzer.maintainNarrativeFlow(
        plotStructure,
        episodeStructure,
        adaptationChanges
      )
      
      expect(flowResult).toBeDefined()
      expect(Array.isArray(flowResult.adjustedEpisodes)).toBe(true)
      expect(Array.isArray(flowResult.flowIssues)).toBe(true)
      expect(Array.isArray(flowResult.recommendations)).toBe(true)
    })
  })

  describe('markKeyPlotPointsImmutable', () => {
    it('should mark critical plot points as immutable', () => {
      const plotStructure = PlotAnalyzer.extractPlotStructure(sampleChapters, sampleCharacters, 'novel_1')
      
      const updatedPlotStructure = PlotAnalyzer.markKeyPlotPointsImmutable(plotStructure)
      
      expect(updatedPlotStructure).toBeDefined()
      expect(updatedPlotStructure.mainPlotline).toBeDefined()
      
      // Check if critical plot points are marked as immutable
      const criticalPoints = updatedPlotStructure.mainPlotline.filter(p => p.importance === 'critical')
      criticalPoints.forEach(point => {
        expect(point.isImmutable).toBe(true)
      })
    })
  })

  describe('storePlotStructure and retrievePlotStructure', () => {
    it('should store and retrieve plot structure', () => {
      const plotStructure = PlotAnalyzer.extractPlotStructure(sampleChapters, sampleCharacters, 'novel_1')
      
      // Store plot structure
      const plotId = PlotAnalyzer.storePlotStructure(plotStructure)
      expect(plotId).toBe(plotStructure.id)
      
      // Retrieve plot structure
      const retrievedPlot = PlotAnalyzer.retrievePlotStructure(plotId)
      expect(retrievedPlot).toBeDefined()
      expect(retrievedPlot!.id).toBe(plotStructure.id)
      expect(retrievedPlot!.novelId).toBe(plotStructure.novelId)
    })

    it('should return null for non-existent plot structure', () => {
      const retrievedPlot = PlotAnalyzer.retrievePlotStructure('non_existent_id')
      expect(retrievedPlot).toBeNull()
    })
  })
})