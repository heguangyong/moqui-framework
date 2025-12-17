import { describe, it, expect } from 'vitest'
import type { 
  NovelStructure, 
  Character, 
  Episode, 
  Storyboard, 
  Asset,
  ProcessingPipeline 
} from '@/types/core'

describe('Core Type Definitions', () => {
  it('should have properly defined NovelStructure interface', () => {
    const novel: NovelStructure = {
      title: 'Test Novel',
      author: 'Test Author',
      chapters: [],
      metadata: {
        wordCount: 1000
      }
    }
    
    expect(novel.title).toBe('Test Novel')
    expect(novel.author).toBe('Test Author')
    expect(Array.isArray(novel.chapters)).toBe(true)
    expect(novel.metadata.wordCount).toBe(1000)
  })

  it('should have properly defined Character interface', () => {
    const character: Character = {
      id: 'char-1',
      name: 'Test Character',
      role: 'protagonist',
      attributes: {
        appearance: 'Tall and dark-haired',
        personality: 'Brave and determined'
      },
      relationships: [],
      appearances: []
    }
    
    expect(character.id).toBe('char-1')
    expect(character.name).toBe('Test Character')
    expect(character.role).toBe('protagonist')
    expect(character.attributes.appearance).toBe('Tall and dark-haired')
  })

  it('should have properly defined Episode interface', () => {
    const episode: Episode = {
      id: 'ep-1',
      episodeNumber: 1,
      title: 'Test Episode',
      summary: 'A test episode',
      scenes: [],
      duration: 300,
      keyEvents: [],
      status: 'draft'
    }
    
    expect(episode.id).toBe('ep-1')
    expect(episode.episodeNumber).toBe(1)
    expect(episode.status).toBe('draft')
    expect(episode.duration).toBe(300)
  })

  it('should have properly defined Storyboard interface', () => {
    const storyboard: Storyboard = {
      id: 'sb-1',
      episodeId: 'ep-1',
      shots: [],
      totalDuration: 300,
      transitionSpecs: []
    }
    
    expect(storyboard.id).toBe('sb-1')
    expect(storyboard.episodeId).toBe('ep-1')
    expect(Array.isArray(storyboard.shots)).toBe(true)
    expect(storyboard.totalDuration).toBe(300)
  })

  it('should have properly defined Asset interface', () => {
    const asset: Asset = {
      id: 'asset-1',
      assetType: 'character',
      name: 'Test Asset',
      description: 'A test asset',
      filePath: '/path/to/asset',
      metadata: {
        fileSize: 1024,
        format: 'png'
      },
      version: '1.0.0',
      isShared: false,
      createdDate: new Date(),
      tags: ['test']
    }
    
    expect(asset.id).toBe('asset-1')
    expect(asset.assetType).toBe('character')
    expect(asset.isShared).toBe(false)
    expect(Array.isArray(asset.tags)).toBe(true)
  })

  it('should have properly defined ProcessingPipeline interface', () => {
    const pipeline: ProcessingPipeline = {
      id: 'pipeline-1',
      novelId: 'novel-1',
      status: 'pending',
      currentStage: 'parsing',
      configuration: {
        targetEpisodeDuration: 300,
        videoQuality: 'medium',
        parallelProcessing: true,
        autoRetry: true,
        maxRetries: 3,
        customSettings: {}
      },
      stages: [],
      startedDate: new Date(),
      progress: 0
    }
    
    expect(pipeline.id).toBe('pipeline-1')
    expect(pipeline.status).toBe('pending')
    expect(pipeline.currentStage).toBe('parsing')
    expect(pipeline.configuration.targetEpisodeDuration).toBe(300)
    expect(pipeline.progress).toBe(0)
  })
})