import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NovelParser } from '../services/NovelParser'
import { apiService } from '../services/api'
import type { NovelStructure } from '../types/core'

// Mock the API service
vi.mock('../services/api', () => ({
  apiService: {
    parseNovel: vi.fn(),
    getNovel: vi.fn(),
    listNovels: vi.fn(),
    deleteNovel: vi.fn(),
    updateNovel: vi.fn(),
    validateNovelFile: vi.fn()
  }
}))

describe('Data Persistence', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Clear all mocks
    vi.clearAllMocks()
  })

  describe('Local Storage Persistence', () => {
    it('should store novel structure in localStorage', async () => {
      const novelStructure: NovelStructure = {
        title: 'Test Novel',
        author: 'Test Author',
        chapters: [{
          id: 'chapter_1',
          title: 'Chapter 1',
          content: 'Test content',
          wordCount: 2,
          scenes: []
        }],
        metadata: {
          wordCount: 2,
          language: 'en',
          description: 'Test description'
        }
      }

      const novelId = await NovelParser.storeNovelStructure(novelStructure)
      
      expect(novelId).toBeDefined()
      expect(novelId.startsWith('novel_')).toBe(true)
      
      // Check that data was stored in localStorage
      const stored = localStorage.getItem(`novel_${novelId}`)
      expect(stored).toBeDefined()
      
      const parsedData = JSON.parse(stored!)
      expect(parsedData.title).toBe('Test Novel')
      expect(parsedData.author).toBe('Test Author')
      expect(parsedData.chapters).toHaveLength(1)
    })

    it('should retrieve stored novel structure from localStorage', async () => {
      const novelStructure: NovelStructure = {
        title: 'Retrievable Novel',
        author: 'Retrievable Author',
        chapters: [{
          id: 'chapter_1',
          title: 'Chapter 1',
          content: 'Retrievable content',
          wordCount: 2,
          scenes: []
        }],
        metadata: {
          wordCount: 2,
          language: 'en'
        }
      }

      const novelId = await NovelParser.storeNovelStructure(novelStructure)
      const retrieved = await NovelParser.retrieveNovelStructure(novelId)
      
      expect(retrieved).toBeDefined()
      expect(retrieved!.title).toBe('Retrievable Novel')
      expect(retrieved!.author).toBe('Retrievable Author')
      expect(retrieved!.chapters).toHaveLength(1)
      expect(retrieved!.chapters[0].content).toBe('Retrievable content')
    })

    it('should return null for non-existent novel ID', async () => {
      const retrieved = await NovelParser.retrieveNovelStructure('non-existent-id')
      expect(retrieved).toBeNull()
    })

    it('should maintain novels list in localStorage', async () => {
      const novelStructure1: NovelStructure = {
        title: 'First Novel',
        author: 'First Author',
        chapters: [{ id: 'ch1', title: 'Ch1', content: 'Content1', wordCount: 1, scenes: [] }],
        metadata: { wordCount: 1, language: 'en' }
      }

      const novelStructure2: NovelStructure = {
        title: 'Second Novel',
        author: 'Second Author',
        chapters: [{ id: 'ch1', title: 'Ch1', content: 'Content2', wordCount: 1, scenes: [] }],
        metadata: { wordCount: 1, language: 'en' }
      }

      await NovelParser.storeNovelStructure(novelStructure1)
      await NovelParser.storeNovelStructure(novelStructure2)

      const novelsList = JSON.parse(localStorage.getItem('novels_list') || '[]')
      expect(novelsList).toHaveLength(2)
      expect(novelsList[0].title).toBe('First Novel')
      expect(novelsList[1].title).toBe('Second Novel')
    })

    it('should handle corrupted localStorage data gracefully', async () => {
      // Store corrupted data
      localStorage.setItem('novel_corrupted', 'invalid json data')
      
      const retrieved = await NovelParser.retrieveNovelStructure('corrupted')
      expect(retrieved).toBeNull()
    })

    it('should include timestamps in stored data', async () => {
      const novelStructure: NovelStructure = {
        title: 'Timestamped Novel',
        author: 'Time Author',
        chapters: [{ id: 'ch1', title: 'Ch1', content: 'Content', wordCount: 1, scenes: [] }],
        metadata: { wordCount: 1, language: 'en' }
      }

      const beforeStore = new Date()
      const novelId = await NovelParser.storeNovelStructure(novelStructure)
      const afterStore = new Date()

      const stored = localStorage.getItem(`novel_${novelId}`)
      const parsedData = JSON.parse(stored!)
      
      expect(parsedData.createdDate).toBeDefined()
      expect(parsedData.lastUpdated).toBeDefined()
      
      const createdDate = new Date(parsedData.createdDate)
      expect(createdDate.getTime()).toBeGreaterThanOrEqual(beforeStore.getTime())
      expect(createdDate.getTime()).toBeLessThanOrEqual(afterStore.getTime())
    })
  })

  describe('Content Integrity Checks', () => {
    it('should validate stored content integrity', () => {
      const validNovel: NovelStructure = {
        title: 'Valid Novel',
        author: 'Valid Author',
        chapters: [{
          id: 'chapter_1',
          title: 'Chapter 1',
          content: 'Valid content with multiple words',
          wordCount: 5,
          scenes: []
        }],
        metadata: {
          wordCount: 5,
          language: 'en'
        }
      }

      const result = NovelParser.validateContentIntegrity(validNovel)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect missing required fields', () => {
      const invalidNovel: NovelStructure = {
        title: '',
        author: '',
        chapters: [],
        metadata: {
          wordCount: 0,
          language: 'en'
        }
      }

      const result = NovelParser.validateContentIntegrity(invalidNovel)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'MISSING_TITLE')).toBe(true)
      expect(result.errors.some(e => e.code === 'NO_CHAPTERS')).toBe(true)
      expect(result.warnings.some(w => w.code === 'MISSING_AUTHOR')).toBe(true)
    })

    it('should detect empty chapters', () => {
      const novelWithEmptyChapter: NovelStructure = {
        title: 'Novel with Empty Chapter',
        author: 'Author',
        chapters: [{
          id: 'chapter_1',
          title: 'Empty Chapter',
          content: '',
          wordCount: 0,
          scenes: []
        }],
        metadata: {
          wordCount: 0,
          language: 'en'
        }
      }

      const result = NovelParser.validateContentIntegrity(novelWithEmptyChapter)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'EMPTY_CHAPTER')).toBe(true)
    })

    it('should detect word count mismatches', () => {
      const novelWithWrongWordCount: NovelStructure = {
        title: 'Word Count Mismatch',
        author: 'Author',
        chapters: [{
          id: 'chapter_1',
          title: 'Chapter 1',
          content: 'This has exactly five words',
          wordCount: 10, // Wrong count
          scenes: []
        }],
        metadata: {
          wordCount: 100, // Very wrong total count
          language: 'en'
        }
      }

      const result = NovelParser.validateContentIntegrity(novelWithWrongWordCount)
      expect(result.warnings.some(w => w.code === 'WORD_COUNT_MISMATCH')).toBe(true)
      expect(result.warnings.some(w => w.code === 'TOTAL_WORD_COUNT_MISMATCH')).toBe(true)
    })

    it('should validate multiple chapters correctly', () => {
      const multiChapterNovel: NovelStructure = {
        title: 'Multi Chapter Novel',
        author: 'Multi Author',
        chapters: [
          {
            id: 'chapter_1',
            title: 'Chapter 1',
            content: 'First chapter content',
            wordCount: 3,
            scenes: []
          },
          {
            id: 'chapter_2',
            title: 'Chapter 2',
            content: 'Second chapter content',
            wordCount: 3,
            scenes: []
          }
        ],
        metadata: {
          wordCount: 6,
          language: 'en'
        }
      }

      const result = NovelParser.validateContentIntegrity(multiChapterNovel)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('Data Retrieval and Validation', () => {
    it('should handle round-trip storage and retrieval', async () => {
      const originalNovel: NovelStructure = {
        title: 'Round Trip Novel',
        author: 'Round Trip Author',
        chapters: [
          {
            id: 'chapter_1',
            title: 'First Chapter',
            content: 'This is the first chapter with some content.',
            wordCount: 9,
            scenes: [{
              id: 'scene_1',
              chapterId: 'chapter_1',
              sceneNumber: 1,
              content: 'Scene content',
              setting: 'Test setting',
              characters: ['Character1']
            }]
          },
          {
            id: 'chapter_2',
            title: 'Second Chapter',
            content: 'This is the second chapter.',
            wordCount: 5,
            scenes: []
          }
        ],
        metadata: {
          wordCount: 14,
          language: 'en',
          description: 'A test novel for round-trip testing'
        }
      }

      // Store the novel
      const novelId = await NovelParser.storeNovelStructure(originalNovel)
      
      // Retrieve the novel
      const retrievedNovel = await NovelParser.retrieveNovelStructure(novelId)
      
      // Verify all data is preserved
      expect(retrievedNovel).toBeDefined()
      expect(retrievedNovel!.title).toBe(originalNovel.title)
      expect(retrievedNovel!.author).toBe(originalNovel.author)
      expect(retrievedNovel!.chapters).toHaveLength(originalNovel.chapters.length)
      expect(retrievedNovel!.metadata.wordCount).toBe(originalNovel.metadata.wordCount)
      expect(retrievedNovel!.metadata.language).toBe(originalNovel.metadata.language)
      expect(retrievedNovel!.metadata.description).toBe(originalNovel.metadata.description)
      
      // Verify chapter details
      expect(retrievedNovel!.chapters[0].title).toBe(originalNovel.chapters[0].title)
      expect(retrievedNovel!.chapters[0].content).toBe(originalNovel.chapters[0].content)
      expect(retrievedNovel!.chapters[0].wordCount).toBe(originalNovel.chapters[0].wordCount)
      expect(retrievedNovel!.chapters[0].scenes).toHaveLength(1)
      
      // Verify scene details
      expect(retrievedNovel!.chapters[0].scenes[0].setting).toBe('Test setting')
      expect(retrievedNovel!.chapters[0].scenes[0].characters).toContain('Character1')
    })

    it('should preserve complex data structures', async () => {
      const complexNovel: NovelStructure = {
        title: 'Complex Novel',
        author: 'Complex Author',
        chapters: [{
          id: 'chapter_1',
          title: 'Complex Chapter',
          content: 'Complex content with\nmultiple lines\n\nand paragraphs.',
          wordCount: 7,
          scenes: [
            {
              id: 'scene_1',
              chapterId: 'chapter_1',
              sceneNumber: 1,
              content: 'First scene',
              setting: 'Complex setting',
              characters: ['Hero', 'Villain', 'Sidekick']
            },
            {
              id: 'scene_2',
              chapterId: 'chapter_1',
              sceneNumber: 2,
              content: 'Second scene',
              setting: 'Another setting',
              characters: ['Hero', 'Love Interest']
            }
          ]
        }],
        metadata: {
          wordCount: 7,
          language: 'en',
          genre: 'Fantasy',
          description: 'A complex fantasy novel'
        }
      }

      const novelId = await NovelParser.storeNovelStructure(complexNovel)
      const retrieved = await NovelParser.retrieveNovelStructure(novelId)
      
      expect(retrieved).toBeDefined()
      expect(retrieved!.chapters[0].content).toContain('\n')
      expect(retrieved!.chapters[0].scenes).toHaveLength(2)
      expect(retrieved!.chapters[0].scenes[0].characters).toHaveLength(3)
      expect(retrieved!.chapters[0].scenes[1].characters).toHaveLength(2)
      expect(retrieved!.metadata.genre).toBe('Fantasy')
    })

    it('should handle special characters and unicode', async () => {
      const unicodeNovel: NovelStructure = {
        title: '测试小说 🎭',
        author: '作者姓名 ✍️',
        chapters: [{
          id: 'chapter_1',
          title: '第一章：开始 🌟',
          content: '这是一个包含中文和特殊字符的测试内容。\n包含emoji：😀😃😄\n以及其他unicode字符：αβγδε',
          wordCount: 15,
          scenes: [{
            id: 'scene_1',
            chapterId: 'chapter_1',
            sceneNumber: 1,
            content: '场景内容',
            setting: '中文设置',
            characters: ['张三', '李四']
          }]
        }],
        metadata: {
          wordCount: 15,
          language: 'zh',
          description: '包含unicode字符的测试描述 🎯'
        }
      }

      const novelId = await NovelParser.storeNovelStructure(unicodeNovel)
      const retrieved = await NovelParser.retrieveNovelStructure(novelId)
      
      expect(retrieved).toBeDefined()
      expect(retrieved!.title).toBe('测试小说 🎭')
      expect(retrieved!.author).toBe('作者姓名 ✍️')
      expect(retrieved!.chapters[0].title).toBe('第一章：开始 🌟')
      expect(retrieved!.chapters[0].content).toContain('😀😃😄')
      expect(retrieved!.chapters[0].content).toContain('αβγδε')
      expect(retrieved!.chapters[0].scenes[0].characters).toContain('张三')
      expect(retrieved!.chapters[0].scenes[0].characters).toContain('李四')
    })
  })

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      // Mock localStorage to throw an error
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded')
      })

      const novelStructure: NovelStructure = {
        title: 'Error Test Novel',
        author: 'Error Author',
        chapters: [{ id: 'ch1', title: 'Ch1', content: 'Content', wordCount: 1, scenes: [] }],
        metadata: { wordCount: 1, language: 'en' }
      }

      // Should not throw, but handle gracefully
      await expect(NovelParser.storeNovelStructure(novelStructure)).resolves.toBeDefined()

      // Restore original function
      localStorage.setItem = originalSetItem
    })

    it('should handle retrieval errors gracefully', async () => {
      // Mock localStorage to throw an error
      const originalGetItem = localStorage.getItem
      localStorage.getItem = vi.fn(() => {
        throw new Error('Storage access denied')
      })

      const result = await NovelParser.retrieveNovelStructure('test-id')
      expect(result).toBeNull()

      // Restore original function
      localStorage.getItem = originalGetItem
    })

    it('should validate data before storage', async () => {
      const invalidNovel = {
        title: '',
        author: '',
        chapters: [],
        metadata: { wordCount: 0 }
      } as NovelStructure

      // Should still store even if validation fails (storage is separate from validation)
      const novelId = await NovelParser.storeNovelStructure(invalidNovel)
      expect(novelId).toBeDefined()

      // But validation should catch the issues
      const validation = NovelParser.validateContentIntegrity(invalidNovel)
      expect(validation.isValid).toBe(false)
    })
  })
})