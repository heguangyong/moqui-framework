import { describe, it, expect } from 'vitest'
import { NovelParser } from '../services/NovelParser'

describe('Chapter Boundary Detection', () => {
  describe('Pattern Recognition', () => {
    it('should detect various Chinese chapter patterns', () => {
      const testCases = [
        {
          content: `第一章 开始\n内容1\n\n第二章 继续\n内容2`,
          expectedTitles: ['第一章 开始', '第二章 继续']
        },
        {
          content: `第1章 数字章节\n内容1\n\n第2章 另一章\n内容2`,
          expectedTitles: ['第1章 数字章节', '第2章 另一章']
        },
        {
          content: `第 1 章 带空格\n内容1\n\n第 2 章 另一章\n内容2`,
          expectedTitles: ['第 1 章 带空格', '第 2 章 另一章']
        },
        {
          content: `章节1 简单格式\n内容1\n\n章节2 另一章\n内容2`,
          expectedTitles: ['章节1 简单格式', '章节2 另一章']
        }
      ]

      testCases.forEach(({ content, expectedTitles }) => {
        const chapters = NovelParser.detectChapterBoundaries(content)
        expect(chapters).toHaveLength(expectedTitles.length)
        expectedTitles.forEach((title, index) => {
          expect(chapters[index].title).toBe(title)
        })
      })
    })

    it('should detect various English chapter patterns', () => {
      const testCases = [
        {
          content: `Chapter 1: The Beginning\nContent 1\n\nChapter 2: The Middle\nContent 2`,
          expectedTitles: ['Chapter 1: The Beginning', 'Chapter 2: The Middle']
        },
        {
          content: `Chapter I\nContent 1\n\nChapter II\nContent 2`,
          expectedTitles: ['Chapter I', 'Chapter II']
        },
        {
          content: `CHAPTER ONE\nContent 1\n\nCHAPTER TWO\nContent 2`,
          expectedTitles: ['CHAPTER ONE', 'CHAPTER TWO']
        }
      ]

      testCases.forEach(({ content, expectedTitles }) => {
        const chapters = NovelParser.detectChapterBoundaries(content)
        expect(chapters).toHaveLength(expectedTitles.length)
        expectedTitles.forEach((title, index) => {
          expect(chapters[index].title).toBe(title)
        })
      })
    })

    it('should detect numbered list patterns', () => {
      const content = `1. First Section
Content of first section.

2. Second Section  
Content of second section.

3. Third Section
Content of third section.`

      const chapters = NovelParser.detectChapterBoundaries(content)
      expect(chapters).toHaveLength(3)
      expect(chapters[0].title).toBe('1. First Section')
      expect(chapters[1].title).toBe('2. Second Section')
      expect(chapters[2].title).toBe('3. Third Section')
    })

    it('should detect Roman numeral patterns', () => {
      const content = `I. First Chapter
Content of first chapter.

II. Second Chapter
Content of second chapter.

III. Third Chapter
Content of third chapter.`

      const chapters = NovelParser.detectChapterBoundaries(content)
      expect(chapters).toHaveLength(3)
      expect(chapters[0].title).toBe('I. First Chapter')
      expect(chapters[1].title).toBe('II. Second Chapter')
      expect(chapters[2].title).toBe('III. Third Chapter')
    })

    it('should detect decorated chapter patterns', () => {
      const content = `--- 第一章 装饰格式 ---
Content of first chapter.

=== Chapter Two ===
Content of second chapter.

*** 第三章 星号装饰 ***
Content of third chapter.`

      const chapters = NovelParser.detectChapterBoundaries(content)
      expect(chapters).toHaveLength(3)
      expect(chapters[0].title).toBe('--- 第一章 装饰格式 ---')
      expect(chapters[1].title).toBe('=== Chapter Two ===')
      expect(chapters[2].title).toBe('*** 第三章 星号装饰 ***')
    })
  })

  describe('Content Segmentation', () => {
    it('should properly segment content between chapters', () => {
      const content = `第一章 开始
这是第一章的第一段。

这是第一章的第二段。

第二章 继续
这是第二章的内容。

这里还有更多内容。`

      const chapters = NovelParser.detectChapterBoundaries(content)
      
      expect(chapters).toHaveLength(2)
      expect(chapters[0].content).toContain('这是第一章的第一段')
      expect(chapters[0].content).toContain('这是第一章的第二段')
      expect(chapters[0].content).not.toContain('这是第二章的内容')
      
      expect(chapters[1].content).toContain('这是第二章的内容')
      expect(chapters[1].content).toContain('这里还有更多内容')
      expect(chapters[1].content).not.toContain('这是第一章')
    })

    it('should preserve paragraph structure within chapters', () => {
      const content = `第一章 测试
第一段内容。

第二段内容。


第三段内容。

第二章 另一章
另一章的内容。`

      const chapters = NovelParser.detectChapterBoundaries(content)
      
      expect(chapters[0].content).toContain('第一段内容。\n\n第二段内容。\n\n第三段内容。')
    })

    it('should handle empty lines correctly', () => {
      const content = `第一章 测试


内容开始。



内容结束。


第二章 另一章
另一章内容。`

      const chapters = NovelParser.detectChapterBoundaries(content)
      
      expect(chapters).toHaveLength(2)
      expect(chapters[0].content.trim()).toBe('内容开始。\n\n内容结束。')
      expect(chapters[1].content.trim()).toBe('另一章内容。')
    })
  })

  describe('Content Organization', () => {
    it('should assign correct chapter IDs and numbers', () => {
      const content = `第一章 开始
内容1

第二章 继续  
内容2

第三章 结束
内容3`

      const chapters = NovelParser.detectChapterBoundaries(content)
      
      expect(chapters).toHaveLength(3)
      expect(chapters[0].id).toBe('chapter_1')
      expect(chapters[1].id).toBe('chapter_2')
      expect(chapters[2].id).toBe('chapter_3')
    })

    it('should calculate word counts for each chapter', () => {
      const content = `第一章 短章节
短内容。

第二章 长章节
这是一个比较长的章节，包含更多的文字内容。
它有多个段落和更多的词汇。
总体来说内容比第一章要丰富得多。`

      const chapters = NovelParser.detectChapterBoundaries(content)
      
      expect(chapters).toHaveLength(2)
      expect(chapters[0].wordCount).toBeLessThan(chapters[1].wordCount)
      expect(chapters[0].wordCount).toBeGreaterThan(0)
      expect(chapters[1].wordCount).toBeGreaterThan(0)
    })

    it('should detect scenes within chapters', () => {
      const content = `第一章 测试章节
第一个场景的内容。

第二个场景的内容。

第三个场景的内容。

第四个场景的内容。

第五个场景的内容。`

      const chapters = NovelParser.detectChapterBoundaries(content)
      
      expect(chapters).toHaveLength(1)
      expect(chapters[0].scenes).toBeDefined()
      expect(chapters[0].scenes.length).toBeGreaterThan(0)
      
      // Each scene should have proper IDs
      chapters[0].scenes.forEach((scene, index) => {
        expect(scene.id).toBe(`chapter_1_scene_${index + 1}`)
        expect(scene.chapterId).toBe('chapter_1')
        expect(scene.sceneNumber).toBe(index + 1)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle content without clear chapter divisions', () => {
      const content = `这是一个没有明确章节划分的小说。
它只是一段连续的文本。
没有章节标题或分隔符。`

      const chapters = NovelParser.detectChapterBoundaries(content)
      
      expect(chapters).toHaveLength(1)
      expect(chapters[0].title).toBe('Chapter 1')
      expect(chapters[0].content).toBe(content.trim())
    })

    it('should handle mixed language chapter patterns', () => {
      const content = `第一章 中文开始
中文内容。

Chapter 2: English Chapter
English content.

第三章 回到中文
更多中文内容。`

      const chapters = NovelParser.detectChapterBoundaries(content)
      
      expect(chapters).toHaveLength(3)
      expect(chapters[0].title).toBe('第一章 中文开始')
      expect(chapters[1].title).toBe('Chapter 2: English Chapter')
      expect(chapters[2].title).toBe('第三章 回到中文')
    })

    it('should handle very short chapters', () => {
      const content = `第一章 短
短。

第二章 也短
也短。`

      const chapters = NovelParser.detectChapterBoundaries(content)
      
      expect(chapters).toHaveLength(2)
      expect(chapters[0].content.trim()).toBe('短。')
      expect(chapters[1].content.trim()).toBe('也短。')
    })

    it('should handle chapters with only titles', () => {
      const content = `第一章 只有标题

第二章 另一个标题

第三章 最后一个标题`

      const chapters = NovelParser.detectChapterBoundaries(content)
      
      expect(chapters).toHaveLength(3)
      chapters.forEach(chapter => {
        expect(chapter.title).toBeDefined()
        expect(chapter.content.trim()).toBe('')
        expect(chapter.wordCount).toBe(0)
      })
    })

    it('should handle false positive chapter patterns', () => {
      const content = `第一章 真正的章节
这里提到了"第二章"但这不是真正的章节标题。
文中说到第三章的内容很有趣。

第二章 这才是真正的第二章
这是真正的第二章内容。`

      const chapters = NovelParser.detectChapterBoundaries(content)
      
      expect(chapters).toHaveLength(2)
      expect(chapters[0].title).toBe('第一章 真正的章节')
      expect(chapters[1].title).toBe('第二章 这才是真正的第二章')
      
      // First chapter should contain the false positive mentions
      expect(chapters[0].content).toContain('第二章')
      expect(chapters[0].content).toContain('第三章')
    })
  })

  describe('Structural Element Identification', () => {
    it('should identify scene breaks within chapters', () => {
      const content = `第一章 测试
第一个场景。

---

第二个场景。

***

第三个场景。`

      const chapters = NovelParser.detectChapterBoundaries(content)
      
      expect(chapters).toHaveLength(1)
      expect(chapters[0].scenes.length).toBeGreaterThan(1)
    })

    it('should extract setting information from scenes', () => {
      const content = `第一章 测试
在学校里，学生们正在上课。

来到公园，孩子们在玩耍。

走进办公室，员工们在工作。`

      const chapters = NovelParser.detectChapterBoundaries(content)
      
      expect(chapters).toHaveLength(1)
      expect(chapters[0].scenes.length).toBeGreaterThan(0)
      
      // At least one scene should have extracted setting information
      const hasSettingInfo = chapters[0].scenes.some(scene => 
        scene.setting && scene.setting !== 'Unknown'
      )
      expect(hasSettingInfo).toBe(true)
    })

    it('should maintain scene continuity within chapters', () => {
      const content = `第一章 连续场景
场景一的内容。

场景二的内容。

场景三的内容。`

      const chapters = NovelParser.detectChapterBoundaries(content)
      
      expect(chapters).toHaveLength(1)
      
      // Scenes should be numbered sequentially
      chapters[0].scenes.forEach((scene, index) => {
        expect(scene.sceneNumber).toBe(index + 1)
        expect(scene.chapterId).toBe(chapters[0].id)
      })
    })
  })
})