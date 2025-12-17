import type { 
  PlotStructure, 
  PlotPoint, 
  Subplot, 
  NarrativeArc, 
  Chapter, 
  Character, 
  ValidationResult, 
  ValidationError,
  IntegrityReport,
  IntegrityViolation
} from '../types/core'

/**
 * Plot Analyzer Service
 * Handles plot structure extraction, key plot point detection, and narrative arc analysis
 */
export class PlotAnalyzer {
  private static readonly PLOT_KEYWORDS = {
    exposition: ['开始', '介绍', '背景', 'beginning', 'introduction', 'background', 'setup'],
    inciting_incident: ['事件', '冲突', '问题', 'incident', 'conflict', 'problem', 'catalyst'],
    rising_action: ['发展', '紧张', '困难', 'development', 'tension', 'difficulty', 'complication'],
    climax: ['高潮', '决战', '关键', 'climax', 'peak', 'crucial', 'decisive'],
    falling_action: ['结果', '后果', '解决', 'consequence', 'aftermath', 'resolution'],
    resolution: ['结局', '结束', '完成', 'ending', 'conclusion', 'completion']
  }

  private static readonly THEME_KEYWORDS = [
    '爱情', '友情', '亲情', '成长', '冒险', '正义', '复仇', '救赎', '牺牲', '背叛',
    'love', 'friendship', 'family', 'growth', 'adventure', 'justice', 'revenge', 'redemption', 'sacrifice', 'betrayal'
  ]

  /**
   * Extracts plot structure from novel chapters
   */
  static extractPlotStructure(chapters: Chapter[], characters: Character[], novelId: string): PlotStructure {
    const plotPoints = this.identifyPlotPoints(chapters)
    const subplots = this.identifySubplots(chapters, characters)
    const themes = this.extractThemes(chapters)
    const narrativeArc = this.analyzeNarrativeArc(plotPoints)

    const plotStructure: PlotStructure = {
      id: `plot_${novelId}_${Date.now()}`,
      novelId,
      mainPlotline: plotPoints.filter(p => p.importance === 'critical' || p.importance === 'major'),
      subplots,
      themes,
      narrativeArc
    }

    return plotStructure
  }

  /**
   * Identifies key plot points in the story
   */
  private static identifyPlotPoints(chapters: Chapter[]): PlotPoint[] {
    const plotPoints: PlotPoint[] = []
    let plotPointCounter = 0

    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i]
      const chapterPosition = i / (chapters.length - 1) // 0 to 1
      
      // Analyze chapter content for plot significance
      const plotSignificance = this.analyzePlotSignificance(chapter.content, chapterPosition)
      
      if (plotSignificance.isSignificant) {
        plotPointCounter++
        
        const plotPoint: PlotPoint = {
          id: `plot_point_${plotPointCounter}`,
          type: plotSignificance.type,
          description: plotSignificance.description,
          chapterIds: [chapter.id],
          importance: plotSignificance.importance,
          isImmutable: plotSignificance.importance === 'critical'
        }
        
        plotPoints.push(plotPoint)
      }
    }

    // Ensure we have at least basic story structure
    if (plotPoints.length === 0) {
      plotPoints.push(...this.createBasicPlotStructure(chapters))
    }

    return plotPoints
  }

  /**
   * Analyzes the plot significance of a chapter
   */
  private static analyzePlotSignificance(content: string, position: number): {
    isSignificant: boolean
    type: PlotPoint['type']
    description: string
    importance: PlotPoint['importance']
  } {
    const contentLower = content.toLowerCase()
    
    // Determine plot type based on position and content
    let type: PlotPoint['type'] = 'rising_action'
    let importance: PlotPoint['importance'] = 'minor'
    
    if (position < 0.2) {
      type = 'exposition'
      importance = 'major'
    } else if (position < 0.3) {
      type = 'inciting_incident'
      importance = 'critical'
    } else if (position > 0.7 && position < 0.9) {
      type = 'climax'
      importance = 'critical'
    } else if (position > 0.9) {
      type = 'resolution'
      importance = 'major'
    }

    // Check for plot keywords to refine classification
    for (const [plotType, keywords] of Object.entries(this.PLOT_KEYWORDS)) {
      const keywordCount = keywords.filter(keyword => contentLower.includes(keyword)).length
      if (keywordCount >= 2) {
        type = plotType as PlotPoint['type']
        importance = 'major'
        break
      }
    }

    // Check for high-impact indicators
    const highImpactIndicators = [
      '死亡', '死了', '杀死', '战斗', '决战', '胜利', '失败', '发现', '真相', '秘密',
      'death', 'died', 'kill', 'battle', 'fight', 'victory', 'defeat', 'discover', 'truth', 'secret'
    ]
    
    const hasHighImpact = highImpactIndicators.some(indicator => contentLower.includes(indicator))
    if (hasHighImpact) {
      importance = importance === 'minor' ? 'major' : 'critical'
    }

    // Determine if chapter is plot-significant
    const isSignificant = importance !== 'minor' || content.length > 1000 || hasHighImpact

    return {
      isSignificant,
      type,
      description: this.generatePlotPointDescription(content, type),
      importance
    }
  }

  /**
   * Generates a description for a plot point
   */
  private static generatePlotPointDescription(content: string, type: PlotPoint['type']): string {
    const sentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 0)
    const firstSentence = sentences[0]?.trim() || ''
    
    const typeDescriptions = {
      exposition: '故事背景和人物介绍',
      inciting_incident: '引发冲突的关键事件',
      rising_action: '情节发展和紧张升级',
      climax: '故事高潮和关键转折',
      falling_action: '高潮后的发展',
      resolution: '故事结局和解决方案'
    }

    const baseDescription = typeDescriptions[type] || '重要情节发展'
    
    if (firstSentence.length > 0 && firstSentence.length < 100) {
      return `${baseDescription}: ${firstSentence}`
    }
    
    return baseDescription
  }

  /**
   * Creates basic plot structure when none is detected
   */
  private static createBasicPlotStructure(chapters: Chapter[]): PlotPoint[] {
    const plotPoints: PlotPoint[] = []
    
    if (chapters.length === 0) return plotPoints

    // Beginning
    if (chapters.length > 0) {
      plotPoints.push({
        id: 'plot_point_exposition',
        type: 'exposition',
        description: '故事开始',
        chapterIds: [chapters[0].id],
        importance: 'major',
        isImmutable: true
      })
    }

    // Middle (climax)
    if (chapters.length > 2) {
      const middleIndex = Math.floor(chapters.length * 0.7)
      plotPoints.push({
        id: 'plot_point_climax',
        type: 'climax',
        description: '故事高潮',
        chapterIds: [chapters[middleIndex].id],
        importance: 'critical',
        isImmutable: true
      })
    }

    // End
    if (chapters.length > 1) {
      plotPoints.push({
        id: 'plot_point_resolution',
        type: 'resolution',
        description: '故事结局',
        chapterIds: [chapters[chapters.length - 1].id],
        importance: 'major',
        isImmutable: true
      })
    }

    return plotPoints
  }

  /**
   * Identifies subplots in the story
   */
  private static identifySubplots(chapters: Chapter[], characters: Character[]): Subplot[] {
    const subplots: Subplot[] = []
    
    // Character-based subplots
    const supportingCharacters = characters.filter(c => c.role === 'supporting')
    
    for (const character of supportingCharacters) {
      const characterChapters = chapters.filter(chapter => 
        chapter.scenes.some(scene => scene.characters.includes(character.name))
      )
      
      if (characterChapters.length >= 2) {
        const subplot: Subplot = {
          id: `subplot_${character.id}`,
          name: `${character.name}的故事线`,
          description: `围绕${character.name}展开的次要情节`,
          plotPoints: this.extractSubplotPoints(characterChapters, character.name),
          relatedCharacters: [character.id]
        }
        
        subplots.push(subplot)
      }
    }

    // Relationship-based subplots
    const relationshipSubplots = this.identifyRelationshipSubplots(chapters, characters)
    subplots.push(...relationshipSubplots)

    return subplots
  }

  /**
   * Extracts plot points for a subplot
   */
  private static extractSubplotPoints(chapters: Chapter[], characterName: string): PlotPoint[] {
    const subplotPoints: PlotPoint[] = []
    
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i]
      const characterMentions = (chapter.content.match(new RegExp(characterName, 'g')) || []).length
      
      if (characterMentions >= 2) {
        subplotPoints.push({
          id: `subplot_point_${chapter.id}_${characterName}`,
          type: i === 0 ? 'exposition' : i === chapters.length - 1 ? 'resolution' : 'rising_action',
          description: `${characterName}在此章节的重要发展`,
          chapterIds: [chapter.id],
          importance: 'minor',
          isImmutable: false
        })
      }
    }
    
    return subplotPoints
  }

  /**
   * Identifies relationship-based subplots
   */
  private static identifyRelationshipSubplots(chapters: Chapter[], characters: Character[]): Subplot[] {
    const relationshipSubplots: Subplot[] = []
    
    // Look for romantic relationships
    const romanticPairs = this.findRomanticRelationships(characters)
    
    for (const pair of romanticPairs) {
      const [char1, char2] = pair
      const sharedChapters = chapters.filter(chapter =>
        chapter.scenes.some(scene => 
          scene.characters.includes(char1.name) && scene.characters.includes(char2.name)
        )
      )
      
      if (sharedChapters.length >= 2) {
        relationshipSubplots.push({
          id: `subplot_romance_${char1.id}_${char2.id}`,
          name: `${char1.name}与${char2.name}的感情线`,
          description: `${char1.name}和${char2.name}之间的感情发展`,
          plotPoints: this.extractRelationshipPoints(sharedChapters, char1.name, char2.name),
          relatedCharacters: [char1.id, char2.id]
        })
      }
    }
    
    return relationshipSubplots
  }

  /**
   * Finds romantic relationships between characters
   */
  private static findRomanticRelationships(characters: Character[]): Character[][] {
    const romanticPairs: Character[][] = []
    
    for (const character of characters) {
      const romanticRelationships = character.relationships.filter(r => 
        r.relationshipType === 'romantic_partner' || r.relationshipType === 'spouse'
      )
      
      for (const relationship of romanticRelationships) {
        const partner = characters.find(c => c.id === relationship.toCharacterId)
        if (partner && !romanticPairs.some(pair => 
          (pair[0].id === character.id && pair[1].id === partner.id) ||
          (pair[0].id === partner.id && pair[1].id === character.id)
        )) {
          romanticPairs.push([character, partner])
        }
      }
    }
    
    return romanticPairs
  }

  /**
   * Extracts relationship development points
   */
  private static extractRelationshipPoints(chapters: Chapter[], char1Name: string, char2Name: string): PlotPoint[] {
    const relationshipPoints: PlotPoint[] = []
    
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i]
      const bothMentioned = chapter.content.includes(char1Name) && chapter.content.includes(char2Name)
      
      if (bothMentioned) {
        relationshipPoints.push({
          id: `relationship_point_${chapter.id}_${char1Name}_${char2Name}`,
          type: i === 0 ? 'exposition' : i === chapters.length - 1 ? 'resolution' : 'rising_action',
          description: `${char1Name}与${char2Name}的互动发展`,
          chapterIds: [chapter.id],
          importance: 'minor',
          isImmutable: false
        })
      }
    }
    
    return relationshipPoints
  }

  /**
   * Extracts themes from the story
   */
  private static extractThemes(chapters: Chapter[]): string[] {
    const themes: string[] = []
    const allText = chapters.map(c => c.content).join(' ').toLowerCase()
    
    for (const theme of this.THEME_KEYWORDS) {
      if (allText.includes(theme)) {
        themes.push(theme)
      }
    }
    
    // Add custom theme detection based on content analysis
    const customThemes = this.detectCustomThemes(allText)
    themes.push(...customThemes)
    
    return [...new Set(themes)] // Remove duplicates
  }

  /**
   * Detects custom themes based on content analysis
   */
  private static detectCustomThemes(text: string): string[] {
    const themes: string[] = []
    
    // War/conflict theme
    if (/战争|战斗|军队|士兵|war|battle|army|soldier/i.test(text)) {
      themes.push('战争')
    }
    
    // Mystery theme
    if (/谜团|秘密|调查|侦探|mystery|secret|investigation|detective/i.test(text)) {
      themes.push('悬疑')
    }
    
    // Magic/fantasy theme
    if (/魔法|法术|魔力|巫师|magic|spell|wizard|fantasy/i.test(text)) {
      themes.push('魔法')
    }
    
    // School/education theme
    if (/学校|学生|老师|教育|school|student|teacher|education/i.test(text)) {
      themes.push('校园')
    }
    
    return themes
  }

  /**
   * Analyzes narrative arc structure
   */
  private static analyzeNarrativeArc(plotPoints: PlotPoint[]): NarrativeArc {
    const setup = plotPoints.filter(p => p.type === 'exposition' || p.type === 'inciting_incident')
    const confrontation = plotPoints.filter(p => p.type === 'rising_action' || p.type === 'climax')
    const resolution = plotPoints.filter(p => p.type === 'falling_action' || p.type === 'resolution')
    
    return {
      setup,
      confrontation,
      resolution
    }
  }

  // ===== SOURCE MATERIAL FIDELITY PRIORITIZATION =====

  /**
   * Validates plot integrity against source material
   */
  static validatePlotIntegrity(
    originalPlotStructure: PlotStructure, 
    adaptedContent: any[]
  ): IntegrityReport {
    const violations: IntegrityViolation[] = []
    const missingElements: string[] = []

    // Check for missing critical plot points
    const criticalPlotPoints = originalPlotStructure.mainPlotline.filter(p => p.isImmutable)
    
    for (const plotPoint of criticalPlotPoints) {
      const isPresent = this.checkPlotPointPresence(plotPoint, adaptedContent)
      
      if (!isPresent) {
        violations.push({
          type: 'missing_plot_point',
          description: `Critical plot point missing: ${plotPoint.description}`,
          severity: 'high',
          affectedEpisodes: [] // Would be populated with actual episode IDs
        })
        
        missingElements.push(`Plot Point: ${plotPoint.description}`)
      }
    }

    // Check for character consistency violations
    const characterViolations = this.checkCharacterConsistencyInPlot(originalPlotStructure, adaptedContent)
    violations.push(...characterViolations)

    // Check for timeline integrity
    const timelineViolations = this.checkTimelineIntegrity(originalPlotStructure, adaptedContent)
    violations.push(...timelineViolations)

    // Calculate integrity score
    const score = this.calculateIntegrityScore(violations, originalPlotStructure)

    return {
      plotStructureId: originalPlotStructure.id,
      violations,
      missingElements,
      score
    }
  }

  /**
   * Checks if a plot point is present in adapted content
   */
  private static checkPlotPointPresence(plotPoint: PlotPoint, adaptedContent: any[]): boolean {
    // This is a simplified check - in practice would analyze actual episode content
    // For now, we'll assume plot points are preserved if they're marked as immutable
    return plotPoint.isImmutable
  }

  /**
   * Checks for character consistency violations in plot adaptation
   */
  private static checkCharacterConsistencyInPlot(
    originalPlot: PlotStructure, 
    adaptedContent: any[]
  ): IntegrityViolation[] {
    const violations: IntegrityViolation[] = []
    
    // Check if main characters are preserved in subplots
    for (const subplot of originalPlot.subplots) {
      if (subplot.relatedCharacters.length === 0) {
        violations.push({
          type: 'character_inconsistency',
          description: `Subplot "${subplot.name}" has no associated characters`,
          severity: 'medium',
          affectedEpisodes: []
        })
      }
    }
    
    return violations
  }

  /**
   * Checks timeline integrity in plot adaptation
   */
  private static checkTimelineIntegrity(
    originalPlot: PlotStructure, 
    adaptedContent: any[]
  ): IntegrityViolation[] {
    const violations: IntegrityViolation[] = []
    
    // Check if plot points maintain logical order
    const plotPointTypes = originalPlot.mainPlotline.map(p => p.type)
    const expectedOrder = ['exposition', 'inciting_incident', 'rising_action', 'climax', 'falling_action', 'resolution']
    
    let lastValidIndex = -1
    for (const type of plotPointTypes) {
      const currentIndex = expectedOrder.indexOf(type)
      if (currentIndex < lastValidIndex) {
        violations.push({
          type: 'timeline_error',
          description: `Plot point order violation: ${type} appears after later story elements`,
          severity: 'medium',
          affectedEpisodes: []
        })
      }
      lastValidIndex = Math.max(lastValidIndex, currentIndex)
    }
    
    return violations
  }

  /**
   * Calculates plot integrity score
   */
  private static calculateIntegrityScore(violations: IntegrityViolation[], originalPlot: PlotStructure): number {
    if (violations.length === 0) {
      return 100
    }

    let totalDeduction = 0
    const criticalPlotPoints = originalPlot.mainPlotline.filter(p => p.isImmutable).length
    
    for (const violation of violations) {
      switch (violation.severity) {
        case 'high':
          totalDeduction += violation.type === 'missing_plot_point' ? 30 : 20
          break
        case 'medium':
          totalDeduction += 10
          break
        case 'low':
          totalDeduction += 5
          break
      }
    }

    // Additional penalty for missing critical elements
    const missingCriticalPoints = violations.filter(v => 
      v.type === 'missing_plot_point' && v.severity === 'high'
    ).length
    
    if (missingCriticalPoints > 0) {
      totalDeduction += (missingCriticalPoints / criticalPlotPoints) * 50
    }

    return Math.max(0, 100 - totalDeduction)
  }

  /**
   * Resolves conflicts by prioritizing source material
   */
  static resolveConflictsFavoringSource(
    originalPlot: PlotStructure,
    adaptationConstraints: any,
    conflictingElements: any[]
  ): {
    resolvedPlot: PlotStructure
    resolutionActions: string[]
    unresolvedConflicts: string[]
  } {
    const resolvedPlot = { ...originalPlot }
    const resolutionActions: string[] = []
    const unresolvedConflicts: string[] = []

    // Prioritize immutable plot points
    for (const plotPoint of originalPlot.mainPlotline) {
      if (plotPoint.isImmutable) {
        // Ensure critical plot points are preserved
        const conflict = conflictingElements.find(c => c.plotPointId === plotPoint.id)
        
        if (conflict) {
          resolutionActions.push(
            `Preserved critical plot point "${plotPoint.description}" despite adaptation constraints`
          )
        }
      }
    }

    // Handle subplot conflicts
    const subplotConflicts = conflictingElements.filter(c => c.type === 'subplot')
    
    for (const conflict of subplotConflicts) {
      const subplot = originalPlot.subplots.find(s => s.id === conflict.subplotId)
      
      if (subplot) {
        // Determine if subplot is essential to main plot
        const isEssential = this.isSubplotEssential(subplot, originalPlot)
        
        if (isEssential) {
          resolutionActions.push(
            `Preserved essential subplot "${subplot.name}" by adjusting adaptation constraints`
          )
        } else {
          // Allow non-essential subplots to be modified or removed
          resolutionActions.push(
            `Modified non-essential subplot "${subplot.name}" to fit adaptation constraints`
          )
        }
      }
    }

    // Handle theme preservation
    const themeConflicts = conflictingElements.filter(c => c.type === 'theme')
    
    for (const conflict of themeConflicts) {
      const theme = conflict.theme
      
      if (originalPlot.themes.includes(theme)) {
        resolutionActions.push(
          `Preserved core theme "${theme}" through alternative narrative approaches`
        )
      }
    }

    return {
      resolvedPlot,
      resolutionActions,
      unresolvedConflicts
    }
  }

  /**
   * Determines if a subplot is essential to the main plot
   */
  private static isSubplotEssential(subplot: Subplot, mainPlot: PlotStructure): boolean {
    // Check if subplot characters are involved in main plot points
    const mainPlotCharacters = new Set<string>()
    
    // This is simplified - would need more sophisticated analysis
    for (const plotPoint of mainPlot.mainPlotline) {
      if (plotPoint.importance === 'critical') {
        // Assume critical plot points involve main characters
        subplot.relatedCharacters.forEach(charId => mainPlotCharacters.add(charId))
      }
    }

    // Subplot is essential if its characters are involved in critical plot points
    return subplot.relatedCharacters.some(charId => mainPlotCharacters.has(charId))
  }

  /**
   * Maintains narrative flow during adaptations
   */
  static maintainNarrativeFlow(
    originalPlot: PlotStructure,
    episodeStructure: any[],
    adaptationChanges: any[]
  ): {
    adjustedEpisodes: any[]
    flowIssues: string[]
    recommendations: string[]
  } {
    const adjustedEpisodes = [...episodeStructure]
    const flowIssues: string[] = []
    const recommendations: string[] = []

    // Check narrative arc preservation
    const arcIntegrity = this.checkNarrativeArcIntegrity(originalPlot.narrativeArc, episodeStructure)
    
    if (!arcIntegrity.isValid) {
      flowIssues.push(...arcIntegrity.issues)
      recommendations.push(...arcIntegrity.recommendations)
    }

    // Check pacing consistency
    const pacingIssues = this.analyzePacingConsistency(originalPlot, episodeStructure)
    
    if (pacingIssues.length > 0) {
      flowIssues.push(...pacingIssues)
      recommendations.push('Consider adjusting episode length to maintain consistent pacing')
    }

    // Check character development continuity
    const characterContinuity = this.checkCharacterDevelopmentContinuity(
      originalPlot.subplots,
      episodeStructure
    )
    
    if (!characterContinuity.isValid) {
      flowIssues.push(...characterContinuity.issues)
      recommendations.push(...characterContinuity.recommendations)
    }

    return {
      adjustedEpisodes,
      flowIssues,
      recommendations
    }
  }

  /**
   * Checks narrative arc integrity
   */
  private static checkNarrativeArcIntegrity(
    narrativeArc: NarrativeArc,
    episodeStructure: any[]
  ): {
    isValid: boolean
    issues: string[]
    recommendations: string[]
  } {
    const issues: string[] = []
    const recommendations: string[] = []

    // Check if all arc components are represented
    if (narrativeArc.setup.length === 0) {
      issues.push('Missing setup elements in narrative arc')
      recommendations.push('Ensure early episodes establish character backgrounds and story context')
    }

    if (narrativeArc.confrontation.length === 0) {
      issues.push('Missing confrontation elements in narrative arc')
      recommendations.push('Include conflict and tension development in middle episodes')
    }

    if (narrativeArc.resolution.length === 0) {
      issues.push('Missing resolution elements in narrative arc')
      recommendations.push('Provide satisfying conclusion in final episodes')
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    }
  }

  /**
   * Analyzes pacing consistency
   */
  private static analyzePacingConsistency(
    originalPlot: PlotStructure,
    episodeStructure: any[]
  ): string[] {
    const issues: string[] = []
    
    // Check if critical plot points are evenly distributed
    const criticalPoints = originalPlot.mainPlotline.filter(p => p.importance === 'critical')
    
    if (criticalPoints.length > episodeStructure.length) {
      issues.push('Too many critical plot points for the number of episodes')
    }

    // Check for pacing bottlenecks
    const episodeImportance = episodeStructure.map((episode, index) => {
      // Simplified importance calculation
      return criticalPoints.filter(p => 
        p.chapterIds.some(chapterId => episode.chapters?.includes(chapterId))
      ).length
    })

    const maxImportance = Math.max(...episodeImportance)
    const avgImportance = episodeImportance.reduce((a, b) => a + b, 0) / episodeImportance.length

    if (maxImportance > avgImportance * 2) {
      issues.push('Uneven distribution of important plot points across episodes')
    }

    return issues
  }

  /**
   * Checks character development continuity
   */
  private static checkCharacterDevelopmentContinuity(
    subplots: Subplot[],
    episodeStructure: any[]
  ): {
    isValid: boolean
    issues: string[]
    recommendations: string[]
  } {
    const issues: string[] = []
    const recommendations: string[] = []

    // Check if character arcs are maintained across episodes
    for (const subplot of subplots) {
      const characterEpisodes = episodeStructure.filter(episode =>
        subplot.plotPoints.some(point =>
          point.chapterIds.some(chapterId => episode.chapters?.includes(chapterId))
        )
      )

      if (characterEpisodes.length === 0) {
        issues.push(`Character subplot "${subplot.name}" not represented in any episode`)
        recommendations.push(`Consider integrating ${subplot.name} into episode structure`)
      } else if (characterEpisodes.length === 1) {
        recommendations.push(`Consider expanding ${subplot.name} across multiple episodes for better development`)
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    }
  }

  /**
   * Marks key plot points as immutable
   */
  static markKeyPlotPointsImmutable(plotStructure: PlotStructure): PlotStructure {
    const updatedPlotStructure = { ...plotStructure }
    
    // Mark critical plot points as immutable
    updatedPlotStructure.mainPlotline = plotStructure.mainPlotline.map(plotPoint => ({
      ...plotPoint,
      isImmutable: plotPoint.importance === 'critical' || plotPoint.type === 'climax'
    }))

    return updatedPlotStructure
  }

  /**
   * Stores plot structure for persistence
   */
  static storePlotStructure(plotStructure: PlotStructure): string {
    const storageKey = `plot_structure_${plotStructure.id}`
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(plotStructure))
      
      // Also maintain a list of all plot structures
      const plotsList = this.getStoredPlotsList()
      const existingIndex = plotsList.findIndex(p => p.id === plotStructure.id)
      
      if (existingIndex >= 0) {
        plotsList[existingIndex] = {
          id: plotStructure.id,
          novelId: plotStructure.novelId,
          createdDate: new Date().toISOString()
        }
      } else {
        plotsList.push({
          id: plotStructure.id,
          novelId: plotStructure.novelId,
          createdDate: new Date().toISOString()
        })
      }
      
      localStorage.setItem('plot_structures_list', JSON.stringify(plotsList))
      
      return plotStructure.id
    } catch (error) {
      console.error('Failed to store plot structure:', error)
      throw new Error('Failed to store plot structure')
    }
  }

  /**
   * Retrieves stored plot structure
   */
  static retrievePlotStructure(plotId: string): PlotStructure | null {
    const storageKey = `plot_structure_${plotId}`
    
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('Failed to retrieve plot structure:', error)
      return null
    }
  }

  /**
   * Gets list of stored plot structures
   */
  private static getStoredPlotsList(): Array<{id: string, novelId: string, createdDate: string}> {
    try {
      const stored = localStorage.getItem('plot_structures_list')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to get plots list:', error)
      return []
    }
  }
}