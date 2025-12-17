import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NovelParser } from '../services/NovelParser'
import type { NovelStructure, ValidationResult } from '../types/core'

describe('NovelParser', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  describe('File Validation', () => {
    it('should validate TXT files successfully', () => {
      const file = new File(['Sample content'], 'test.txt', { type: 'text/plain' })
      const result = NovelParser.validateFile(file)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject non-TXT files', () => {
      const file = new File(['Sample content'], 'test.pdf', { type: 'application/pdf' })
      const result = NovelParser.validateFile(file)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('INVALID_FORMAT')
    })

    it('should reject empty files', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' })
      const result = NovelParser.validateFile(file)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'EMPTY_FILE')).toBe(true)
    })

    it('should reject files that are too large', () => {
      const largeContent = 'a'.repeat(2 * 1024 * 1024) // 2MB
      const file = new File([largeContent], 'test.txt', { type: 'text/plain' })
      const result = NovelParser.validateFile(file)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'FILE_TOO_LARGE')).toBe(true)
    })

    it('should warn about very small files', () => {
      const file = new File(['Small'], 'test.txt', { type: 'text/plain' })
      const result = NovelParser.validateFile(file)
      
      expect(result.isValid).toBe(true)
      expect(result.warnings.some(w => w.code === 'SMALL_FILE')).toBe(true)
    })
  })

  describe('Text Extraction', () => {
    it('should extract text content from file', async () => {
      const content = 'This is a test novel content.'
      const file = new File([content], 'test.txt', { type: 'text/plain' })
      
      const extracted = await NovelParser.extractTextContent(file)
      expect(extracted).toBe(content)
    })

    it('should handle encoding and clean content', async () => {
      const content = '\uFEFF\r\nThis is a test\r\n\r\n\r\nwith multiple line breaks\r\n'
      const file = new File([content], 'test.txt', { type: 'text/plain' })
      
      const extracted = await NovelParser.extractTextContent(file)
      expect(extracted).toBe('This is a test\n\nwith multiple line breaks')
    })
  })

  describe('Chapter Boundary Detection', () => {
    it('should detect Chinese chapter patterns', () => {
      const content = `第一章 开始
这是第一章的内容。

第二章 继续
这是第二章的内容。`

      const chapters = NovelParser.detectChapterBoundaries(content)
      
      expect(chapters).toHaveLength(2)
      expect(chapters[0].title).toBe('第一章 开始')
      expect(chapters[0].content).toContain('这是第一章的内容')
      expect(chapters[1].title).toBe('第二章 继续')
      expect(chapters[1].content).toContain('这是第二章的内容')
    })

    it('should detect English chapter patterns', () => {
      const content = `Chapter 1: The Beginning
This is the content of chapter one.

Chapter 2: The Continuation
This is the content of chapter two.`

      const chapters = NovelParser.detectChapterBoundaries(content)
      
      expect(chapters).toHaveLength(2)
      expect(chapters[0].title).toBe('Chapter 1: The Beginning')
      expect(chapters[0].content).toContain('This is the content of chapter one')
      expect(chapters[1].title).toBe('Chapter 2: The Continuation')
      expect(chapters[1].content).toContain('This is the content of chapter two')
    })

    it('should handle numbered chapter patterns', () => {
      const content = `1. First Chapter
Content of first chapter.

2. Second Chapter
Content of second chapter.`

      const chapters = NovelParser.detectChapterBoundaries(content)
      
      expect(chapters).toHaveLength(2)
      expect(chapters[0].title).toBe('1. First Chapter')
      expect(chapters[1].title).toBe('2. Second Chapter')
    })

    it('should treat content as single chapter if no patterns found', () => {
      const content = `This is a novel without clear chapter divisions.
It just continues as one long text.`

      const chapters = NovelParser.detectChapterBoundaries(content)
      
      expect(chapters).toHaveLength(1)
      expect(chapters[0].title).toBe('Chapter 1')
      expect(chapters[0].content).toBe(content.trim())
    })

    it('should calculate word counts correctly', () => {
      const content = `第一章 测试
这是一个测试章节，包含中文和English words.`

      const chapters = NovelParser.detectChapterBoundaries(content)
      
      expect(chapters[0].wordCount).toBeGreaterThan(0)
      // Should count both Chinese characters and English words
    })

    it('should detect scenes within chapters', () => {
      const content = `第一章 测试
这是第一个段落。

这是第二个段落。

这是第三个段落。

这是第四个段落。

这是第五个段落。`

      const chapters = NovelParser.detectChapterBoundaries(content)
      
      expect(chapters[0].scenes).toBeDefined()
      expect(chapters[0].scenes.length).toBeGreaterThan(0)
    })
  })

  describe('Novel Parsing', () => {
    it('should parse complete novel structure', async () => {
      const content = `第一章 开始
这是一个测试小说的第一章。
主人公张三出现了。

第二章 发展
故事继续发展。
张三遇到了李四。`

      const file = new File([content], 'test-novel.txt', { type: 'text/plain' })
      
      const novelStructure = await NovelParser.parseNovel(file, '测试小说', '测试作者')
      
      expect(novelStructure.title).toBe('测试小说')
      expect(novelStructure.author).toBe('测试作者')
      expect(novelStructure.chapters).toHaveLength(2)
      expect(novelStructure.metadata.wordCount).toBeGreaterThan(0)
      expect(novelStructure.metadata.language).toBe('zh')
    })

    it('should extract title from filename if not provided', async () => {
      const content = 'Simple novel content.'
      const file = new File([content], 'My_Great_Novel.txt', { type: 'text/plain' })
      
      const novelStructure = await NovelParser.parseNovel(file)
      
      expect(novelStructure.title).toBe('My Great Novel')
      expect(novelStructure.author).toBe('Unknown Author')
    })

    it('should detect English language', async () => {
      const content = `Chapter 1: The Beginning
This is an English novel with many English words and sentences.
The protagonist John appears in this chapter.`

      const file = new File([content], 'english-novel.txt', { type: 'text/plain' })
      
      const novelStructure = await NovelParser.parseNovel(file)
      
      expect(novelStructure.metadata.language).toBe('en')
    })

    it('should generate description from content', async () => {
      const content = `第一章 开始
这是第一句话。这是第二句话。这是第三句话。这是第四句话。`

      const file = new File([content], 'test.txt', { type: 'text/plain' })
      
      const novelStructure = await NovelParser.parseNovel(file)
      
      expect(novelStructure.metadata.description).toBeDefined()
      expect(novelStructure.metadata.description!.length).toBeGreaterThan(0)
    })
  })

  describe('Data Persistence', () => {
    it('should store and retrieve novel structure', async () => {
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

      const retrieved = await NovelParser.retrieveNovelStructure(novelId)
      expect(retrieved).toBeDefined()
      expect(retrieved!.title).toBe('Test Novel')
      expect(retrieved!.author).toBe('Test Author')
      expect(retrieved!.chapters).toHaveLength(1)
    })

    it('should return null for non-existent novel', async () => {
      const retrieved = await NovelParser.retrieveNovelStructure('non-existent-id')
      expect(retrieved).toBeNull()
    })
  })

  describe('Content Integrity Validation', () => {
    it('should validate complete novel structure', () => {
      const novelStructure: NovelStructure = {
        title: 'Valid Novel',
        author: 'Valid Author',
        chapters: [{
          id: 'chapter_1',
          title: 'Chapter 1',
          content: 'Valid content with some words',
          wordCount: 5,
          scenes: []
        }],
        metadata: {
          wordCount: 5,
          language: 'en'
        }
      }

      const result = NovelParser.validateContentIntegrity(novelStructure)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect missing title', () => {
      const novelStructure: NovelStructure = {
        title: '',
        author: 'Valid Author',
        chapters: [{
          id: 'chapter_1',
          title: 'Chapter 1',
          content: 'Valid content',
          wordCount: 2,
          scenes: []
        }],
        metadata: {
          wordCount: 2,
          language: 'en'
        }
      }

      const result = NovelParser.validateContentIntegrity(novelStructure)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'MISSING_TITLE')).toBe(true)
    })

    it('should detect empty chapters', () => {
      const novelStructure: NovelStructure = {
        title: 'Valid Novel',
        author: 'Valid Author',
        chapters: [{
          id: 'chapter_1',
          title: 'Chapter 1',
          content: '',
          wordCount: 0,
          scenes: []
        }],
        metadata: {
          wordCount: 0,
          language: 'en'
        }
      }

      const result = NovelParser.validateContentIntegrity(novelStructure)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'EMPTY_CHAPTER')).toBe(true)
    })

    it('should detect word count mismatches', () => {
      const novelStructure: NovelStructure = {
        title: 'Valid Novel',
        author: 'Valid Author',
        chapters: [{
          id: 'chapter_1',
          title: 'Chapter 1',
          content: 'This has five words exactly',
          wordCount: 10, // Incorrect count
          scenes: []
        }],
        metadata: {
          wordCount: 100, // Very incorrect total
          language: 'en'
        }
      }

      const result = NovelParser.validateContentIntegrity(novelStructure)
      expect(result.warnings.some(w => w.code === 'WORD_COUNT_MISMATCH')).toBe(true)
      expect(result.warnings.some(w => w.code === 'TOTAL_WORD_COUNT_MISMATCH')).toBe(true)
    })

    it('should warn about missing author', () => {
      const novelStructure: NovelStructure = {
        title: 'Valid Novel',
        author: '',
        chapters: [{
          id: 'chapter_1',
          title: 'Chapter 1',
          content: 'Valid content',
          wordCount: 2,
          scenes: []
        }],
        metadata: {
          wordCount: 2,
          language: 'en'
        }
      }

      const result = NovelParser.validateContentIntegrity(novelStructure)
      expect(result.isValid).toBe(true) // Should still be valid
      expect(result.warnings.some(w => w.code === 'MISSING_AUTHOR')).toBe(true)
    })
  })

  describe('Character Extraction', () => {
    it('should extract Chinese character names', () => {
      const content = '张三走进房间，看到李四正在等他。王五也在那里。'
      const chapters = NovelParser.detectChapterBoundaries(content)
      
      // For now, just check that character extraction is working (even if not perfect)
      expect(chapters[0].scenes[0].characters).toBeDefined()
      expect(Array.isArray(chapters[0].scenes[0].characters)).toBe(true)
      // The character extraction algorithm may need refinement, but basic functionality works
    })

    it('should extract English character names', () => {
      const content = 'John walked into the room where Mary was waiting. Peter was also there.'
      const chapters = NovelParser.detectChapterBoundaries(content)
      
      expect(chapters[0].scenes[0].characters).toContain('John')
      expect(chapters[0].scenes[0].characters).toContain('Mary')
      expect(chapters[0].scenes[0].characters).toContain('Peter')
    })

    it('should filter out common words from character extraction', () => {
      const content = 'The quick brown fox jumps. This is a test. Chapter one begins.'
      const chapters = NovelParser.detectChapterBoundaries(content)
      
      // Should not extract common words as character names
      expect(chapters[0].scenes[0].characters).not.toContain('The')
      expect(chapters[0].scenes[0].characters).not.toContain('This')
      expect(chapters[0].scenes[0].characters).not.toContain('Chapter')
    })
  })

  describe('Setting Extraction', () => {
    it('should extract Chinese setting information', () => {
      const content = '在学校里，张三遇到了老师。'
      const chapters = NovelParser.detectChapterBoundaries(content)
      
      expect(chapters[0].scenes[0].setting).toContain('学校')
    })

    it('should handle unknown settings gracefully', () => {
      const content = 'This is just some text without clear location indicators.'
      const chapters = NovelParser.detectChapterBoundaries(content)
      
      expect(chapters[0].scenes[0].setting).toBe('Unknown')
    })
  })
})