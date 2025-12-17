import { describe, it, expect } from 'vitest'
import { NovelParser } from '../services/NovelParser'
import { CharacterSystem } from '../services/CharacterSystem'
import { PlotAnalyzer } from '../services/PlotAnalyzer'
import { EpisodeGenerator } from '../services/EpisodeGenerator'

describe('EpisodeGenerator Integration', () => {
  it('should work with complete pipeline from novel to episodes', async () => {
    // Create a comprehensive novel for testing
    const complexNovelContent = `
第一章 新的开始

张三刚刚大学毕业，来到北京寻找工作机会。他是一个充满理想的年轻人，梦想着在科技行业闯出一片天地。

在一家咖啡店里，他遇到了李四，一个经验丰富的程序员。李四看出了张三的潜力，决定帮助他。

第二章 初入职场

在李四的推荐下，张三进入了一家创业公司。公司的氛围很好，同事们都很友善。

但是，张三很快发现，理想和现实之间存在着巨大的差距。工作比他想象的要困难得多。

第三章 遇到挫折

项目遇到了重大问题，客户对产品不满意。张三感到压力巨大，开始怀疑自己的能力。

李四鼓励他不要放弃，告诉他这是成长必经的路。

第四章 团队合作

为了解决问题，张三和团队成员王五、赵六一起加班加点。他们互相支持，共同面对挑战。

在这个过程中，张三学会了团队合作的重要性。

第五章 突破困境

经过不懈努力，团队终于找到了解决方案。客户对新的产品非常满意。

张三感到前所未有的成就感，他意识到困难只是成功路上的垫脚石。

第六章 新的挑战

公司决定开发一个更大的项目，张三被任命为项目负责人。这是一个巨大的机会，也是一个巨大的挑战。

他必须带领团队完成这个艰巨的任务。

第七章 领导力的考验

作为项目负责人，张三面临着前所未有的压力。他需要协调不同部门，管理复杂的项目进度。

在这个过程中，他逐渐培养出了领导力。

第八章 危机时刻

项目进行到一半时，出现了技术危机。如果不能及时解决，整个项目都可能失败。

张三必须做出关键决定，这将决定项目的成败。

第九章 最终决战

张三决定采用一个大胆的技术方案。虽然风险很大，但这是唯一的机会。

整个团队都支持他的决定，大家齐心协力实施这个方案。

第十章 成功与成长

项目最终获得了巨大成功，公司的业务得到了快速发展。张三也从一个初出茅庐的毕业生成长为了优秀的项目经理。

他明白了，成功不仅仅是个人的努力，更需要团队的合作和坚持不懈的精神。
    `

    const mockFile = new File([complexNovelContent], 'career-story.txt', { type: 'text/plain' })

    // Step 1: Parse the novel
    const novelStructure = await NovelParser.parseNovel(mockFile, '职场成长记', '测试作者')
    
    expect(novelStructure).toBeDefined()
    expect(novelStructure.chapters.length).toBe(10)

    // Step 2: Identify characters
    const characters = CharacterSystem.identifyCharacters(novelStructure.chapters)
    
    expect(Array.isArray(characters)).toBe(true)
    // May or may not find characters, but should not crash

    // Step 3: Extract plot structure
    const plotStructure = PlotAnalyzer.extractPlotStructure(
      novelStructure.chapters, 
      characters, 
      'career_story_novel'
    )
    
    expect(plotStructure).toBeDefined()
    expect(plotStructure.mainPlotline.length).toBeGreaterThan(0)

    // Step 4: Generate episodes
    const episodes = EpisodeGenerator.generateEpisodes(
      novelStructure.chapters,
      plotStructure,
      characters,
      300 // 5 minutes per episode
    )
    
    expect(episodes).toBeDefined()
    expect(episodes.length).toBeGreaterThan(0)
    expect(episodes.length).toBeLessThanOrEqual(novelStructure.chapters.length)
    
    // Validate episode structure
    episodes.forEach((episode, index) => {
      expect(episode.episodeNumber).toBe(index + 1)
      expect(episode.title).toBeDefined()
      expect(episode.summary).toBeDefined()
      expect(episode.duration).toBeGreaterThan(0)
      expect(episode.scenes.length).toBeGreaterThan(0)
      expect(episode.status).toBe('draft')
    })

    // Step 5: Adjust pacing
    const adjustedEpisodes = EpisodeGenerator.adjustEpisodePacing(
      episodes,
      240, // 4 minutes target
      plotStructure
    )
    
    expect(adjustedEpisodes.length).toBe(episodes.length)
    adjustedEpisodes.forEach(episode => {
      expect(episode.duration).toBeLessThanOrEqual(300) // Should be adjusted
    })

    // Step 6: Validate story preservation
    const validation = EpisodeGenerator.preserveEssentialStoryElements(
      adjustedEpisodes,
      plotStructure
    )
    
    expect(validation).toBeDefined()
    expect(typeof validation.isValid).toBe('boolean')
    
    // Step 7: Generate enhanced metadata
    const finalEpisodes = EpisodeGenerator.generateEpisodeMetadata(adjustedEpisodes)
    
    expect(finalEpisodes.length).toBe(adjustedEpisodes.length)
    finalEpisodes.forEach(episode => {
      expect(episode.summary.length).toBeGreaterThan(0)
    })

    // Step 8: Store and retrieve
    const novelId = 'career_story_test'
    const episodeIds = EpisodeGenerator.storeEpisodes(finalEpisodes, novelId)
    expect(episodeIds.length).toBe(finalEpisodes.length)
    
    const retrievedEpisodes = EpisodeGenerator.retrieveEpisodes(novelId)
    expect(retrievedEpisodes.length).toBe(finalEpisodes.length)
  })

  it('should handle different episode duration requirements', async () => {
    const shortNovelContent = `
第一章 开始
这是一个简短的故事。主角面临一个问题。

第二章 发展  
问题变得复杂了。主角寻求帮助。

第三章 结局
问题得到了解决。主角学到了重要的教训。
    `

    const mockFile = new File([shortNovelContent], 'short-story.txt', { type: 'text/plain' })

    // Parse and analyze
    const novelStructure = await NovelParser.parseNovel(mockFile, '短篇故事', '测试作者')
    const characters = CharacterSystem.identifyCharacters(novelStructure.chapters)
    const plotStructure = PlotAnalyzer.extractPlotStructure(novelStructure.chapters, characters, 'short_story')

    // Test different episode durations
    const durations = [60, 180, 300, 600] // 1, 3, 5, 10 minutes

    for (const duration of durations) {
      const episodes = EpisodeGenerator.generateEpisodes(
        novelStructure.chapters,
        plotStructure,
        characters,
        duration
      )

      expect(episodes.length).toBeGreaterThan(0)
      
      // Episodes should respect target duration (with some flexibility)
      episodes.forEach(episode => {
        expect(episode.duration).toBeGreaterThan(0)
        expect(episode.duration).toBeLessThanOrEqual(duration * 2) // Allow flexibility for short content
      })
    }
  })

  it('should maintain narrative continuity across episodes', async () => {
    const serialNovelContent = `
第一章 神秘的开始
侦探约翰接到了一个奇怪的案件。受害者在密室中消失了。

第二章 调查线索
约翰开始调查，发现了一些奇怪的线索。每个线索都指向不同的方向。

第三章 嫌疑人
约翰找到了几个嫌疑人。每个人都有不在场证明，但约翰觉得事情没那么简单。

第四章 真相浮现
约翰发现了关键证据。真相开始浮现，但还有最后一个谜团。

第五章 最终揭秘
约翰揭露了真相。原来这是一个精心策划的阴谋。
    `

    const mockFile = new File([serialNovelContent], 'detective-story.txt', { type: 'text/plain' })

    // Full pipeline
    const novelStructure = await NovelParser.parseNovel(mockFile, '侦探故事', '测试作者')
    const characters = CharacterSystem.identifyCharacters(novelStructure.chapters)
    const plotStructure = PlotAnalyzer.extractPlotStructure(novelStructure.chapters, characters, 'detective_story')
    
    const episodes = EpisodeGenerator.generateEpisodes(
      novelStructure.chapters,
      plotStructure,
      characters,
      240 // 4 minutes
    )

    // Check narrative continuity
    expect(episodes.length).toBeGreaterThanOrEqual(1)
    
    if (episodes.length > 1) {
      for (let i = 0; i < episodes.length - 1; i++) {
        const currentEpisode = episodes[i]
        const nextEpisode = episodes[i + 1]
        
        // Episodes should have sequential numbers
        expect(nextEpisode.episodeNumber).toBe(currentEpisode.episodeNumber + 1)
        
        // Episodes should have meaningful content
        expect(currentEpisode.scenes.length).toBeGreaterThan(0)
        expect(nextEpisode.scenes.length).toBeGreaterThan(0)
        
        // Episodes should have summaries
        expect(currentEpisode.summary.length).toBeGreaterThan(0)
        expect(nextEpisode.summary.length).toBeGreaterThan(0)
      }
    } else {
      // Single episode should still have valid structure
      const episode = episodes[0]
      expect(episode.scenes.length).toBeGreaterThan(0)
      expect(episode.summary.length).toBeGreaterThan(0)
    }

    // Validate story preservation
    const validation = EpisodeGenerator.preserveEssentialStoryElements(episodes, plotStructure)
    expect(validation).toBeDefined()
    
    // Should have minimal errors for a well-structured story
    expect(validation.errors.length).toBeLessThanOrEqual(1)
  })
})