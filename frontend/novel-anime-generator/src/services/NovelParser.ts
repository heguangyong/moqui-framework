import type { 
  NovelStructure, 
  Chapter, 
  Scene, 
  ValidationResult, 
  ValidationError, 
  NovelMetadata 
} from '../types/core'

/**
 * Novel Parser Service
 * Handles file validation, text extraction, and chapter boundary detection
 */
export class NovelParser {
  private static readonly SUPPORTED_FORMATS = ['.txt']
  private static readonly MAX_FILE_SIZE = 1024 * 1024 // 1MB
  private static readonly ENCODING_PATTERNS = {
    UTF8: /^[\x00-\x7F]|[\xC2-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}|[\xF0-\xF7][\x80-\xBF]{3}$/,
    UTF16: /^\xFF\xFE|\xFE\xFF/,
    ASCII: /^[\x00-\x7F]*$/
  }

  /**
   * Validates uploaded file format and content
   */
  static validateFile(file: File): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    // Check file extension
    const extension = this.getFileExtension(file.name)
    if (!this.SUPPORTED_FORMATS.includes(extension)) {
      errors.push({
        code: 'INVALID_FORMAT',
        message: `Unsupported file format: ${extension}. Only TXT files are supported.`,
        field: 'fileFormat',
        severity: 'error'
      })
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      errors.push({
        code: 'FILE_TOO_LARGE',
        message: `File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(this.MAX_FILE_SIZE)}).`,
        field: 'fileSize',
        severity: 'error'
      })
    }

    // Check if file is empty
    if (file.size === 0) {
      errors.push({
        code: 'EMPTY_FILE',
        message: 'File is empty. Please upload a file with content.',
        field: 'fileContent',
        severity: 'error'
      })
    }

    // Warn about very small files
    if (file.size < 1000 && file.size > 0) {
      warnings.push({
        code: 'SMALL_FILE',
        message: 'File appears to be very small. Please ensure it contains a complete novel.',
        field: 'fileSize',
        severity: 'warning'
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Extracts text content from file with encoding detection
   */
  static async extractTextContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string
          if (!content) {
            reject(new Error('Failed to read file content'))
            return
          }

          // Detect and handle encoding
          const cleanedContent = this.detectAndCleanEncoding(content)
          resolve(cleanedContent)
        } catch (error) {
          reject(new Error(`Failed to extract text content: ${error}`))
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }

      // Read as text with UTF-8 encoding
      reader.readAsText(file, 'UTF-8')
    })
  }

  /**
   * Detects encoding and cleans text content
   */
  private static detectAndCleanEncoding(content: string): string {
    // Remove BOM if present
    let cleanContent = content.replace(/^\uFEFF/, '')
    
    // Normalize line endings
    cleanContent = cleanContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    
    // Remove excessive whitespace but preserve paragraph structure
    cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n')
    
    // Trim leading and trailing whitespace
    cleanContent = cleanContent.trim()
    
    return cleanContent
  }

  /**
   * Identifies chapter boundaries using various pattern recognition techniques
   */
  static detectChapterBoundaries(content: string): Chapter[] {
    const chapters: Chapter[] = []
    const lines = content.split('\n')
    
    // Common chapter patterns
    const chapterPatterns = [
      /^第[一二三四五六七八九十\d]+章/i,           // Chinese: 第一章, 第二章, etc.
      /^Chapter\s+(\d+|[IVXLCDM]+|One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten)/i, // English: Chapter 1, Chapter I, Chapter One, etc.
      /^第\s*(\d+)\s*章/i,                         // 第 1 章
      /^章节\s*(\d+)/i,                            // 章节 1
      /^\d+\.\s/,                                  // 1. Title format
      /^[IVXLCDM]+\.\s/i,                         // I. Title format
      /^-{3,}.*第.*章.*-{3,}/i,                   // --- 第一章 装饰格式 ---
      /^={3,}.*Chapter.*={3,}/i,                  // === Chapter Two ===
      /^\*{3,}.*第.*章.*\*{3,}/i,                 // *** 第三章 星号装饰 ***
      /^第[0-9]+章/i,                             // 第1章, 第2章, etc.
      /^CHAPTER\s+(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|\d+|[IVXLCDM]+)/i // CHAPTER ONE, etc.
    ]

    let currentChapter: Chapter | null = null
    let chapterContent: string[] = []
    let chapterNumber = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Check if this line matches any chapter pattern
      const isChapterStart = chapterPatterns.some(pattern => pattern.test(line))
      
      if (isChapterStart) {
        // Save previous chapter if exists
        if (currentChapter) {
          let content = chapterContent.join('\n').trim()
          // Clean up excessive line breaks but preserve paragraph structure
          content = content.replace(/\n{3,}/g, '\n\n')
          currentChapter.content = content
          currentChapter.wordCount = this.countWords(currentChapter.content)
          currentChapter.scenes = content.length > 0 ? this.detectScenes(currentChapter.content, currentChapter.id) : []
          chapters.push(currentChapter)
        }

        // Start new chapter
        chapterNumber++
        const chapterId = `chapter_${chapterNumber}`
        currentChapter = {
          id: chapterId,
          title: line || `Chapter ${chapterNumber}`,
          content: '',
          wordCount: 0,
          scenes: []
        }
        chapterContent = []
      } else if (line.length > 0) {
        // Add content to current chapter
        chapterContent.push(line)
      } else if (chapterContent.length > 0) {
        // Preserve paragraph breaks
        chapterContent.push('')
      }
    }

    // Don't forget the last chapter
    if (currentChapter) {
      let content = chapterContent.join('\n').trim()
      // Clean up excessive line breaks but preserve paragraph structure
      content = content.replace(/\n{3,}/g, '\n\n')
      currentChapter.content = content
      currentChapter.wordCount = this.countWords(currentChapter.content)
      currentChapter.scenes = content.length > 0 ? this.detectScenes(currentChapter.content, currentChapter.id) : []
      chapters.push(currentChapter)
    }

    // If no chapters were detected, treat entire content as one chapter
    if (chapters.length === 0 && content.trim().length > 0) {
      const singleChapter: Chapter = {
        id: 'chapter_1',
        title: 'Chapter 1',
        content: content.trim(),
        wordCount: this.countWords(content),
        scenes: this.detectScenes(content, 'chapter_1')
      }
      chapters.push(singleChapter)
    }

    return chapters
  }

  /**
   * Detects scenes within a chapter
   */
  private static detectScenes(content: string, chapterId: string): Scene[] {
    const scenes: Scene[] = []
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0)
    
    // Simple scene detection based on paragraph breaks and content length
    let currentScene: Scene | null = null
    let sceneContent: string[] = []
    let sceneNumber = 0

    for (const paragraph of paragraphs) {
      // Start a new scene every 3-5 paragraphs or when detecting scene breaks
      const isSceneBreak = this.isSceneBreak(paragraph) || 
                          (sceneContent.length >= 4 && Math.random() > 0.7)

      if (isSceneBreak && sceneContent.length > 0) {
        // Save current scene
        if (currentScene) {
          currentScene.content = sceneContent.join('\n\n')
          scenes.push(currentScene)
        }

        // Start new scene
        sceneNumber++
        currentScene = {
          id: `${chapterId}_scene_${sceneNumber}`,
          chapterId,
          sceneNumber,
          content: '',
          setting: this.extractSetting(paragraph),
          characters: this.extractCharacterMentions(paragraph)
        }
        sceneContent = [paragraph]
      } else {
        if (!currentScene) {
          sceneNumber++
          currentScene = {
            id: `${chapterId}_scene_${sceneNumber}`,
            chapterId,
            sceneNumber,
            content: '',
            setting: this.extractSetting(paragraph),
            characters: this.extractCharacterMentions(paragraph)
          }
        }
        sceneContent.push(paragraph)
      }
    }

    // Don't forget the last scene
    if (currentScene && sceneContent.length > 0) {
      currentScene.content = sceneContent.join('\n\n')
      scenes.push(currentScene)
    }

    return scenes
  }

  /**
   * Determines if a paragraph indicates a scene break
   */
  private static isSceneBreak(paragraph: string): boolean {
    const sceneBreakPatterns = [
      /^-{3,}$/,           // --- (horizontal rule)
      /^\*{3,}$/,          // *** (asterisk separator)
      /^#{3,}$/,           // ### (hash separator)
      /^第.*节/,           // Chinese section markers
      /^Scene\s+\d+/i,     // Scene 1, Scene 2, etc.
      /^[0-9]+\./,         // Numbered sections
    ]

    return sceneBreakPatterns.some(pattern => pattern.test(paragraph.trim()))
  }

  /**
   * Extracts setting information from paragraph
   */
  private static extractSetting(paragraph: string): string {
    // Simple setting extraction - look for location indicators
    const settingPatterns = [
      /在(.{1,20}?)(?:，|。|里|中|内)/,
      /(?:来到|走进|进入)(.{1,20}?)(?:，|。)/,
      /(.{1,20}?)(?:房间|大厅|办公室|学校|医院|公园)/
    ]

    for (const pattern of settingPatterns) {
      const match = paragraph.match(pattern)
      if (match) {
        return match[1].trim()
      }
    }

    return 'Unknown'
  }

  /**
   * Extracts character mentions from paragraph
   */
  private static extractCharacterMentions(paragraph: string): string[] {
    // Simple character extraction - look for proper nouns and common name patterns
    const characters: string[] = []
    
    // Chinese name patterns - simplified for common surnames + 1-2 characters
    const chineseNamePattern = /[王李张刘陈杨黄赵吴周徐孙马朱胡郭何高林罗郑梁谢宋唐许韩冯邓曹彭曾萧田董袁潘于蒋蔡余杜叶程苏魏吕丁任沈姚卢姜崔钟谭陆汪范金石廖贾夏韦付方白邹孟熊秦邱江尹薛闫段雷侯龙史陶黎贺顾毛郝龚邵万钱严覃武戴莫孔向汤][\u4e00-\u9fa5]{1,2}/g
    
    // English name patterns (capitalized words)
    const englishNamePattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g

    // Extract Chinese names
    const chineseMatches = paragraph.match(chineseNamePattern)
    if (chineseMatches) {
      // Filter out names that contain common non-name characters
      const filteredChinese = chineseMatches.filter(name => {
        return name.length <= 3 && 
               !name.endsWith('走') && 
               !name.endsWith('进') && 
               !name.endsWith('看') &&
               !name.endsWith('正') &&
               !name.endsWith('在') &&
               !name.endsWith('也') &&
               !name.endsWith('了') &&
               !name.endsWith('的') &&
               !name.endsWith('是') &&
               !name.endsWith('到') &&
               !name.endsWith('等')
      })
      characters.push(...filteredChinese)
    }

    // Extract English names
    const englishMatches = paragraph.match(englishNamePattern)
    if (englishMatches) {
      // Filter out common words that aren't names
      const commonWords = ['The', 'This', 'That', 'Chapter', 'Scene', 'When', 'Where', 'What', 'How', 'Why', 'And', 'But', 'For', 'With', 'From']
      const filteredNames = englishMatches.filter(name => !commonWords.includes(name))
      characters.push(...filteredNames)
    }

    // Remove duplicates and return
    return [...new Set(characters)]
  }

  /**
   * Parses complete novel structure
   */
  static async parseNovel(file: File, title?: string, author?: string): Promise<NovelStructure> {
    // Validate file first
    const validation = this.validateFile(file)
    if (!validation.isValid) {
      throw new Error(`File validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
    }

    // Extract text content
    const textContent = await this.extractTextContent(file)
    
    // Detect chapters
    const chapters = this.detectChapterBoundaries(textContent)
    
    // Calculate metadata
    const wordCount = this.countWords(textContent)
    const metadata: NovelMetadata = {
      wordCount,
      language: this.detectLanguage(textContent),
      description: this.generateDescription(textContent)
    }

    // Create novel structure
    const novelStructure: NovelStructure = {
      title: title || this.extractTitleFromFilename(file.name),
      author: author || 'Unknown Author',
      chapters,
      metadata
    }

    return novelStructure
  }

  /**
   * Stores parsed novel structure (placeholder for persistence layer)
   */
  static async storeNovelStructure(novelStructure: NovelStructure): Promise<string> {
    // This would typically interact with the backend API
    // For now, we'll store in localStorage as a temporary solution
    const novelId = `novel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const storageData = {
      id: novelId,
      ...novelStructure,
      createdDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }

    localStorage.setItem(`novel_${novelId}`, JSON.stringify(storageData))
    
    // Also maintain a list of all novels
    const novelsList = this.getStoredNovelsList()
    novelsList.push({
      id: novelId,
      title: novelStructure.title,
      author: novelStructure.author,
      wordCount: novelStructure.metadata.wordCount,
      createdDate: storageData.createdDate
    })
    localStorage.setItem('novels_list', JSON.stringify(novelsList))

    return novelId
  }

  /**
   * Retrieves stored novel structure
   */
  static async retrieveNovelStructure(novelId: string): Promise<NovelStructure | null> {
    const stored = localStorage.getItem(`novel_${novelId}`)
    if (!stored) {
      return null
    }

    try {
      const data = JSON.parse(stored)
      // Remove storage-specific fields
      const { id, createdDate, lastUpdated, ...novelStructure } = data
      return novelStructure as NovelStructure
    } catch (error) {
      console.error('Failed to parse stored novel:', error)
      return null
    }
  }

  /**
   * Validates content integrity
   */
  static validateContentIntegrity(novelStructure: NovelStructure): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    // Check if novel has title and author
    if (!novelStructure.title || novelStructure.title.trim().length === 0) {
      errors.push({
        code: 'MISSING_TITLE',
        message: 'Novel title is required',
        field: 'title',
        severity: 'error'
      })
    }

    if (!novelStructure.author || novelStructure.author.trim().length === 0) {
      warnings.push({
        code: 'MISSING_AUTHOR',
        message: 'Author information is missing',
        field: 'author',
        severity: 'warning'
      })
    }

    // Check if novel has chapters
    if (!novelStructure.chapters || novelStructure.chapters.length === 0) {
      errors.push({
        code: 'NO_CHAPTERS',
        message: 'Novel must contain at least one chapter',
        field: 'chapters',
        severity: 'error'
      })
    }

    // Validate each chapter
    novelStructure.chapters.forEach((chapter, index) => {
      if (!chapter.content || chapter.content.trim().length === 0) {
        errors.push({
          code: 'EMPTY_CHAPTER',
          message: `Chapter ${index + 1} is empty`,
          field: `chapters[${index}].content`,
          severity: 'error'
        })
      }

      if (chapter.wordCount !== this.countWords(chapter.content)) {
        warnings.push({
          code: 'WORD_COUNT_MISMATCH',
          message: `Chapter ${index + 1} word count may be incorrect`,
          field: `chapters[${index}].wordCount`,
          severity: 'warning'
        })
      }
    })

    // Check total word count
    const calculatedWordCount = novelStructure.chapters.reduce((total, chapter) => total + chapter.wordCount, 0)
    if (Math.abs(calculatedWordCount - novelStructure.metadata.wordCount) > 10) {
      warnings.push({
        code: 'TOTAL_WORD_COUNT_MISMATCH',
        message: 'Total word count may be incorrect',
        field: 'metadata.wordCount',
        severity: 'warning'
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // Utility methods
  private static getFileExtension(filename: string): string {
    return filename.toLowerCase().substring(filename.lastIndexOf('.'))
  }

  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  private static countWords(text: string): number {
    if (!text) return 0
    
    // Handle both English and Chinese text
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = text.replace(/[\u4e00-\u9fa5]/g, '').match(/\b\w+\b/g)?.length || 0
    
    return chineseChars + englishWords
  }

  private static detectLanguage(text: string): string {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const totalChars = text.length
    
    if (chineseChars / totalChars > 0.3) {
      return 'zh'
    }
    return 'en'
  }

  private static generateDescription(text: string): string {
    // Extract first few sentences as description
    const sentences = text.split(/[。！？.!?]/).filter(s => s.trim().length > 0)
    const firstSentences = sentences.slice(0, 3).join('。')
    return firstSentences.length > 200 ? firstSentences.substring(0, 200) + '...' : firstSentences
  }

  private static extractTitleFromFilename(filename: string): string {
    return filename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
  }

  private static getStoredNovelsList(): any[] {
    const stored = localStorage.getItem('novels_list')
    return stored ? JSON.parse(stored) : []
  }
}