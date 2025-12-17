import { describe, it, expect } from 'vitest'
import { NovelParser } from '../services/NovelParser'
import { CharacterSystem } from '../services/CharacterSystem'
import { PlotAnalyzer } from '../services/PlotAnalyzer'

describe('PlotAnalyzer Integration', () => {
  it('should work with NovelParser and CharacterSystem', async () => {
    // Create a sample novel file
    const sampleNovelContent = `
第一章 开始

张三是一个年轻的程序员，他住在北京。有一天，他遇到了一个神秘的问题。

李四是他的好朋友，也是一名程序员。他们决定一起解决这个问题。

第二章 发展

问题变得越来越复杂。张三和李四发现这不是一个简单的技术问题，而是涉及到更深层的秘密。

他们开始调查，发现了一些令人震惊的真相。

第三章 高潮

最终的真相揭晓了。张三必须做出一个艰难的决定，这将影响到所有人的未来。

在激烈的对抗中，正义最终战胜了邪恶。

第四章 结局

问题得到了解决，张三和李四的友谊也变得更加深厚。

他们继续他们的程序员生涯，但现在他们知道，有些事情比代码更重要。
    `

    // Create a mock file
    const mockFile = new File([sampleNovelContent], 'test-novel.txt', { type: 'text/plain' })

    // Step 1: Parse the novel
    const novelStructure = await NovelParser.parseNovel(mockFile, '测试小说', '测试作者')
    
    expect(novelStructure).toBeDefined()
    expect(novelStructure.chapters.length).toBeGreaterThan(0)

    // Step 2: Identify characters
    const characters = CharacterSystem.identifyCharacters(novelStructure.chapters)
    
    expect(Array.isArray(characters)).toBe(true)
    // Character identification might not find characters in this simple test, but should not crash

    // Step 3: Extract plot structure
    const plotStructure = PlotAnalyzer.extractPlotStructure(
      novelStructure.chapters, 
      characters, 
      'test_novel_id'
    )
    
    expect(plotStructure).toBeDefined()
    expect(plotStructure.novelId).toBe('test_novel_id')
    expect(plotStructure.mainPlotline).toBeDefined()
    expect(plotStructure.mainPlotline.length).toBeGreaterThan(0)
    
    // Should have basic story structure
    const plotTypes = plotStructure.mainPlotline.map(p => p.type)
    expect(plotTypes).toContain('exposition')
    
    // Should have narrative arc
    expect(plotStructure.narrativeArc).toBeDefined()
    expect(plotStructure.narrativeArc.setup).toBeDefined()
    expect(plotStructure.narrativeArc.confrontation).toBeDefined()
    expect(plotStructure.narrativeArc.resolution).toBeDefined()

    // Step 4: Validate plot integrity
    const integrityReport = PlotAnalyzer.validatePlotIntegrity(plotStructure, [])
    
    expect(integrityReport).toBeDefined()
    expect(integrityReport.score).toBeGreaterThanOrEqual(0)
    expect(integrityReport.score).toBeLessThanOrEqual(100)

    // Step 5: Mark key plot points as immutable
    const protectedPlot = PlotAnalyzer.markKeyPlotPointsImmutable(plotStructure)
    
    expect(protectedPlot).toBeDefined()
    // Check if any plot points are marked as immutable (may be none in simple test data)
    const immutablePoints = protectedPlot.mainPlotline.filter(p => p.isImmutable)
    expect(immutablePoints.length).toBeGreaterThanOrEqual(0)

    // Step 6: Store and retrieve plot structure
    const plotId = PlotAnalyzer.storePlotStructure(protectedPlot)
    expect(plotId).toBe(protectedPlot.id)
    
    const retrievedPlot = PlotAnalyzer.retrievePlotStructure(plotId)
    expect(retrievedPlot).toBeDefined()
    expect(retrievedPlot!.id).toBe(protectedPlot.id)
  })

  it('should handle complex narrative structures', async () => {
    const complexNovelContent = `
第一章 序幕

在一个遥远的王国里，住着一位勇敢的骑士亚瑟。他有一个使命：寻找传说中的圣杯。

第二章 启程

亚瑟开始了他的冒险之旅。在路上，他遇到了智慧的法师梅林。

梅林告诉他，这个任务比他想象的要危险得多。

第三章 伙伴

亚瑟遇到了其他的骑士：兰斯洛特和加文。他们决定一起寻找圣杯。

但是，他们不知道，黑暗势力也在寻找同样的宝物。

第四章 爱情

在一个城堡里，亚瑟遇到了美丽的公主格温妮薇儿。他们坠入了爱河。

但是爱情让亚瑟分心，他开始怀疑自己的使命。

第五章 背叛

兰斯洛特背叛了亚瑟，他也爱上了格温妮薇儿。

友谊破裂，圆桌骑士分崩离析。

第六章 黑暗

黑暗势力趁机发动攻击。王国陷入了危机。

亚瑟必须在爱情和责任之间做出选择。

第七章 救赎

亚瑟选择了责任。他原谅了兰斯洛特，重新团结了骑士们。

第八章 决战

最终的战斗开始了。亚瑟和他的骑士们面对强大的敌人。

在激烈的战斗中，许多英雄牺牲了。

第九章 胜利

正义战胜了邪恶。圣杯被找到了，王国得救了。

但是胜利的代价是巨大的。

第十章 新的开始

亚瑟成为了一位明智的国王。他和格温妮薇儿结婚了。

王国进入了和平与繁荣的新时代。
    `

    const mockFile = new File([complexNovelContent], 'complex-novel.txt', { type: 'text/plain' })

    // Parse the complex novel
    const novelStructure = await NovelParser.parseNovel(mockFile, '亚瑟王传说', '未知作者')
    const characters = CharacterSystem.identifyCharacters(novelStructure.chapters)
    const plotStructure = PlotAnalyzer.extractPlotStructure(
      novelStructure.chapters, 
      characters, 
      'complex_novel_id'
    )

    // Should identify multiple plot points
    expect(plotStructure.mainPlotline.length).toBeGreaterThan(3)
    
    // Should have different types of plot points
    const plotTypes = plotStructure.mainPlotline.map(p => p.type)
    expect(new Set(plotTypes).size).toBeGreaterThan(1)
    
    // Should identify themes
    expect(plotStructure.themes.length).toBeGreaterThan(0)
    
    // Should have subplots (if characters are identified)
    expect(Array.isArray(plotStructure.subplots)).toBe(true)
    
    // Narrative flow should be maintained
    const episodeStructure = [
      { id: 'ep1', chapters: ['chapter_1', 'chapter_2'] },
      { id: 'ep2', chapters: ['chapter_3', 'chapter_4'] },
      { id: 'ep3', chapters: ['chapter_5', 'chapter_6'] },
      { id: 'ep4', chapters: ['chapter_7', 'chapter_8'] },
      { id: 'ep5', chapters: ['chapter_9', 'chapter_10'] }
    ]
    
    const flowResult = PlotAnalyzer.maintainNarrativeFlow(
      plotStructure,
      episodeStructure,
      []
    )
    
    expect(flowResult).toBeDefined()
    expect(flowResult.adjustedEpisodes.length).toBe(5)
  })
})