import { describe, it, expect, beforeEach } from 'vitest'
import { NovelParser } from '../services/NovelParser'

describe('Novel Parser Integration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should handle complete novel parsing workflow', async () => {
    // Create a sample novel file
    const novelContent = `第一章 神秘的开始
在一个阳光明媚的早晨，张三走进了学校。
他不知道今天会发生什么奇妙的事情。

李四正在教室里等待着，手中拿着一本古老的书籍。
"这本书有着神秘的力量，"李四对张三说道。

第二章 冒险的旅程
张三和李四决定一起探索这本书的秘密。
他们来到了图书馆，开始研究古老的文字。

王五突然出现了，他似乎知道这本书的来历。
"这是传说中的魔法书，"王五神秘地说道。

第三章 真相大白
经过一番调查，三人终于发现了书的真正秘密。
原来这本书记录着古代魔法师的智慧。

在办公室里，校长告诉他们这本书的历史。
"这本书已经在我们学校保存了一百年，"校长说道。`

    const file = new File([novelContent], 'mystery-novel.txt', { type: 'text/plain' })

    // Step 1: Validate the file
    const validation = NovelParser.validateFile(file)
    expect(validation.isValid).toBe(true)
    expect(validation.errors).toHaveLength(0)

    // Step 2: Parse the complete novel
    const novelStructure = await NovelParser.parseNovel(file, '神秘学校', '测试作者')
    
    // Verify basic structure
    expect(novelStructure.title).toBe('神秘学校')
    expect(novelStructure.author).toBe('测试作者')
    expect(novelStructure.chapters).toHaveLength(3)
    expect(novelStructure.metadata.language).toBe('zh')
    expect(novelStructure.metadata.wordCount).toBeGreaterThan(0)

    // Verify chapters
    expect(novelStructure.chapters[0].title).toBe('第一章 神秘的开始')
    expect(novelStructure.chapters[1].title).toBe('第二章 冒险的旅程')
    expect(novelStructure.chapters[2].title).toBe('第三章 真相大白')

    // Verify content segmentation
    expect(novelStructure.chapters[0].content).toContain('张三走进了学校')
    expect(novelStructure.chapters[0].content).toContain('李四正在教室里等待')
    expect(novelStructure.chapters[1].content).toContain('探索这本书的秘密')
    expect(novelStructure.chapters[2].content).toContain('真正秘密')

    // Verify scenes are detected
    novelStructure.chapters.forEach(chapter => {
      expect(chapter.scenes).toBeDefined()
      expect(chapter.scenes.length).toBeGreaterThan(0)
    })

    // Verify character extraction (at least some characters should be found)
    const allCharacters = novelStructure.chapters.flatMap(ch => 
      ch.scenes.flatMap(scene => scene.characters)
    )
    expect(allCharacters.length).toBeGreaterThan(0)

    // Verify setting extraction (at least some settings should be found)
    const allSettings = novelStructure.chapters.flatMap(ch => 
      ch.scenes.map(scene => scene.setting)
    )
    const nonUnknownSettings = allSettings.filter(setting => setting !== 'Unknown')
    expect(nonUnknownSettings.length).toBeGreaterThan(0)

    // Step 3: Store the parsed novel
    const novelId = await NovelParser.storeNovelStructure(novelStructure)
    expect(novelId).toBeDefined()
    expect(novelId.startsWith('novel_')).toBe(true)

    // Step 4: Retrieve and verify stored novel
    const retrievedNovel = await NovelParser.retrieveNovelStructure(novelId)
    expect(retrievedNovel).toBeDefined()
    expect(retrievedNovel!.title).toBe('神秘学校')
    expect(retrievedNovel!.chapters).toHaveLength(3)

    // Step 5: Validate content integrity
    const integrityCheck = NovelParser.validateContentIntegrity(retrievedNovel!)
    expect(integrityCheck.isValid).toBe(true)
    expect(integrityCheck.errors).toHaveLength(0)

    // Verify novels list is maintained
    const novelsList = JSON.parse(localStorage.getItem('novels_list') || '[]')
    expect(novelsList).toHaveLength(1)
    expect(novelsList[0].title).toBe('神秘学校')
    expect(novelsList[0].author).toBe('测试作者')
  })

  it('should handle English novel parsing workflow', async () => {
    const englishContent = `Chapter 1: The Beginning
John walked into the mysterious library on a quiet Tuesday morning.
He had no idea what adventures awaited him among the dusty shelves.

Mary was already there, reading an ancient tome by the window.
"This book contains secrets from centuries past," she whispered to John.

Chapter 2: The Discovery
Together, John and Mary began to uncover the book's hidden meanings.
They spent hours in the reading room, deciphering cryptic symbols.

Professor Smith appeared suddenly, as if summoned by their curiosity.
"Ah, you've found the Codex Mysterium," he said with a knowing smile.

Chapter 3: The Revelation
After days of research, the trio finally understood the book's true purpose.
It was a guide to ancient wisdom, written by scholars long forgotten.

In his office, the librarian revealed the book's remarkable history.
"This codex has been in our collection for over two centuries," he explained.`

    const file = new File([englishContent], 'mystery-library.txt', { type: 'text/plain' })

    // Parse the English novel
    const novelStructure = await NovelParser.parseNovel(file, 'The Mystery Library', 'Test Author')
    
    // Verify English-specific parsing
    expect(novelStructure.title).toBe('The Mystery Library')
    expect(novelStructure.author).toBe('Test Author')
    expect(novelStructure.chapters).toHaveLength(3)
    expect(novelStructure.metadata.language).toBe('en')

    // Verify English chapter titles
    expect(novelStructure.chapters[0].title).toBe('Chapter 1: The Beginning')
    expect(novelStructure.chapters[1].title).toBe('Chapter 2: The Discovery')
    expect(novelStructure.chapters[2].title).toBe('Chapter 3: The Revelation')

    // Verify English character extraction (basic functionality)
    const allCharacters = novelStructure.chapters.flatMap(ch => 
      ch.scenes.flatMap(scene => scene.characters)
    )
    expect(allCharacters).toContain('John')
    expect(allCharacters).toContain('Mary')
    // Character extraction may not be perfect, but should find main characters

    // Store and retrieve
    const novelId = await NovelParser.storeNovelStructure(novelStructure)
    const retrieved = await NovelParser.retrieveNovelStructure(novelId)
    
    expect(retrieved).toBeDefined()
    expect(retrieved!.metadata.language).toBe('en')
  })

  it('should handle mixed format novel parsing', async () => {
    const mixedContent = `1. Introduction
This is a novel with mixed formatting styles.
It uses numbered sections instead of traditional chapters.

2. Development
The story continues with more complex themes.
Characters begin to develop and interact.

I. Classical Section
This section uses Roman numerals for some reason.
The author decided to mix different numbering systems.

II. Another Classical Section
The story reaches its climax here.
All plot threads begin to converge.

=== Final Chapter ===
This is the conclusion of our mixed-format novel.
Everything comes together in the end.`

    const file = new File([mixedContent], 'mixed-format.txt', { type: 'text/plain' })

    const novelStructure = await NovelParser.parseNovel(file)
    
    // Should detect all different chapter formats
    expect(novelStructure.chapters.length).toBeGreaterThanOrEqual(4)
    
    // Verify different title formats are preserved
    const titles = novelStructure.chapters.map(ch => ch.title)
    expect(titles.some(title => title.includes('1.'))).toBe(true)
    expect(titles.some(title => title.includes('I.'))).toBe(true)
    expect(titles.some(title => title.includes('==='))).toBe(true)

    // Each chapter should have content
    novelStructure.chapters.forEach(chapter => {
      expect(chapter.content.trim().length).toBeGreaterThan(0)
      expect(chapter.wordCount).toBeGreaterThan(0)
    })
  })

  it('should handle error cases gracefully', async () => {
    // Test with invalid file
    const invalidFile = new File([''], 'empty.pdf', { type: 'application/pdf' })
    const validation = NovelParser.validateFile(invalidFile)
    expect(validation.isValid).toBe(false)
    expect(validation.errors.length).toBeGreaterThan(0)

    // Test with empty content
    const emptyFile = new File([''], 'empty.txt', { type: 'text/plain' })
    const emptyValidation = NovelParser.validateFile(emptyFile)
    expect(emptyValidation.isValid).toBe(false)
    expect(emptyValidation.errors.some(e => e.code === 'EMPTY_FILE')).toBe(true)

    // Test parsing should throw for invalid files
    await expect(NovelParser.parseNovel(invalidFile)).rejects.toThrow()
  })

  it('should maintain data consistency across operations', async () => {
    const content = `Chapter 1: Test
This is test content for consistency checking.

Chapter 2: More Test
This is more test content.`

    const file = new File([content], 'consistency-test.txt', { type: 'text/plain' })
    
    // Parse multiple times - should be consistent
    const novel1 = await NovelParser.parseNovel(file, 'Test Novel', 'Test Author')
    const novel2 = await NovelParser.parseNovel(file, 'Test Novel', 'Test Author')
    
    expect(novel1.chapters).toHaveLength(novel2.chapters.length)
    expect(novel1.metadata.wordCount).toBe(novel2.metadata.wordCount)
    
    // Store both and verify they don't interfere
    const id1 = await NovelParser.storeNovelStructure(novel1)
    const id2 = await NovelParser.storeNovelStructure(novel2)
    
    expect(id1).not.toBe(id2)
    
    const retrieved1 = await NovelParser.retrieveNovelStructure(id1)
    const retrieved2 = await NovelParser.retrieveNovelStructure(id2)
    
    expect(retrieved1!.title).toBe(retrieved2!.title)
    expect(retrieved1!.chapters).toHaveLength(retrieved2!.chapters.length)
    
    // Verify novels list contains both
    const novelsList = JSON.parse(localStorage.getItem('novels_list') || '[]')
    expect(novelsList.length).toBeGreaterThanOrEqual(2)
  })
})