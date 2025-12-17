import type { 
  Episode, 
  Chapter, 
  Scene, 
  PlotStructure, 
  PlotPoint, 
  Character, 
  KeyEvent, 
  EpisodeStatus,
  ValidationResult,
  ValidationError
} from '../types/core'

/**
 * Episode Generator Service
 * Handles episode division, content adaptation, and story preservation for short video platforms
 */
export class EpisodeGenerator {
  private static readonly DEFAULT_EPISODE_DURATION = 300 // 5 minutes in seconds
  private static readonly MIN_EPISODE_DURATION = 180 // 3 minutes
  private static readonly MAX_EPISODE_DURATION = 600 // 10 minutes
  private static readonly WORDS_PER_MINUTE = 150 // Average reading speed
  private static readonly DRAMATIC_ARC_RATIOS = {
    setup: 0.25,      // 25% for setup
    development: 0.5, // 50% for development
    resolution: 0.25  // 25% for resolution
  }

  /**
   * Generates episodes from novel chapters and plot structure
   */
  static generateEpisodes(
    chapters: Chapter[], 
    plotStructure: PlotStructure, 
    characters: Character[],
    targetEpisodeDuration: number = this.DEFAULT_EPISODE_DURATION
  ): Episode[] {
    const episodes: Episode[] = []
    
    // Calculate optimal episode count based on content length
    const totalWordCount = chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0)
    const estimatedTotalDuration = this.estimateDurationFromWords(totalWordCount)
    const optimalEpisodeCount = Math.ceil(estimatedTotalDuration / targetEpisodeDuration)
    
    // Divide content into episodes
    const episodeSegments = this.divideContentIntoSegments(
      chapters, 
      plotStructure, 
      optimalEpisodeCount
    )
    
    // Create episodes with dramatic arcs
    for (let i = 0; i < episodeSegments.length; i++) {
      const segment = episodeSegments[i]
      const episode = this.createEpisodeFromSegment(
        segment, 
        i + 1, 
        plotStructure, 
        characters,
        targetEpisodeDuration
      )
      
      episodes.push(episode)
    }
    
    // Ensure narrative continuity between episodes
    this.ensureNarrativeContinuity(episodes, plotStructure)
    
    return episodes
  }

  /**
   * Estimates duration from word count
   */
  private static estimateDurationFromWords(wordCount: number): number {
    return Math.ceil((wordCount / this.WORDS_PER_MINUTE) * 60) // Convert to seconds
  }

  /**
   * Divides content into episode segments
   */
  private static divideContentIntoSegments(
    chapters: Chapter[], 
    plotStructure: PlotStructure, 
    targetEpisodeCount: number
  ): Array<{
    chapters: Chapter[]
    plotPoints: PlotPoint[]
    startIndex: number
    endIndex: number
  }> {
    const segments: Array<{
      chapters: Chapter[]
      plotPoints: PlotPoint[]
      startIndex: number
      endIndex: number
    }> = []

    // Calculate chapters per episode
    const chaptersPerEpisode = Math.ceil(chapters.length / targetEpisodeCount)
    
    // Create segments with plot point distribution
    for (let i = 0; i < targetEpisodeCount; i++) {
      const startIndex = i * chaptersPerEpisode
      const endIndex = Math.min(startIndex + chaptersPerEpisode, chapters.length)
      
      if (startIndex >= chapters.length) break
      
      const segmentChapters = chapters.slice(startIndex, endIndex)
      const segmentChapterIds = segmentChapters.map(c => c.id)
      
      // Find plot points that belong to this segment
      const segmentPlotPoints = plotStructure.mainPlotline.filter(plotPoint =>
        plotPoint.chapterIds.some(chapterId => segmentChapterIds.includes(chapterId))
      )
      
      segments.push({
        chapters: segmentChapters,
        plotPoints: segmentPlotPoints,
        startIndex,
        endIndex: endIndex - 1
      })
    }
    
    // Redistribute segments to ensure each has meaningful content
    return this.redistributeSegments(segments, plotStructure)
  }

  /**
   * Redistributes segments to ensure balanced content
   */
  private static redistributeSegments(
    segments: Array<{
      chapters: Chapter[]
      plotPoints: PlotPoint[]
      startIndex: number
      endIndex: number
    }>,
    plotStructure: PlotStructure
  ): Array<{
    chapters: Chapter[]
    plotPoints: PlotPoint[]
    startIndex: number
    endIndex: number
  }> {
    const redistributed = [...segments]
    
    // Ensure critical plot points are well distributed
    const criticalPlotPoints = plotStructure.mainPlotline.filter(p => p.importance === 'critical')
    
    for (let i = 0; i < redistributed.length; i++) {
      const segment = redistributed[i]
      const criticalPointsInSegment = segment.plotPoints.filter(p => p.importance === 'critical')
      
      // If segment has no critical points and is not the first or last, try to balance
      if (criticalPointsInSegment.length === 0 && i > 0 && i < redistributed.length - 1) {
        // Try to move a chapter from adjacent segments
        this.balanceSegmentContent(redistributed, i)
      }
    }
    
    return redistributed
  }

  /**
   * Balances content between segments
   */
  private static balanceSegmentContent(
    segments: Array<{
      chapters: Chapter[]
      plotPoints: PlotPoint[]
      startIndex: number
      endIndex: number
    }>,
    segmentIndex: number
  ): void {
    const currentSegment = segments[segmentIndex]
    
    // Check if we can borrow content from adjacent segments
    if (segmentIndex > 0 && segments[segmentIndex - 1].chapters.length > 1) {
      const prevSegment = segments[segmentIndex - 1]
      const lastChapter = prevSegment.chapters.pop()
      
      if (lastChapter) {
        currentSegment.chapters.unshift(lastChapter)
        // Update plot points accordingly
        this.updateSegmentPlotPoints(currentSegment)
      }
    }
  }

  /**
   * Updates plot points for a segment after content changes
   */
  private static updateSegmentPlotPoints(segment: {
    chapters: Chapter[]
    plotPoints: PlotPoint[]
    startIndex: number
    endIndex: number
  }): void {
    // This would need access to the full plot structure to properly update
    // For now, we'll keep the existing plot points
    // In a full implementation, this would recalculate based on new chapter set
  }

  /**
   * Creates an episode from a content segment
   */
  private static createEpisodeFromSegment(
    segment: {
      chapters: Chapter[]
      plotPoints: PlotPoint[]
      startIndex: number
      endIndex: number
    },
    episodeNumber: number,
    plotStructure: PlotStructure,
    characters: Character[],
    targetDuration: number
  ): Episode {
    const episodeId = `episode_${episodeNumber}_${Date.now()}`
    
    // Generate episode title
    const title = this.generateEpisodeTitle(segment, episodeNumber)
    
    // Create dramatic arc for this episode
    const episodeScenes = this.createEpisodeDramaticArc(segment, targetDuration)
    
    // Generate key events
    const keyEvents = this.generateKeyEvents(segment, episodeId)
    
    // Calculate actual duration
    const totalWords = segment.chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0)
    const estimatedDuration = this.estimateDurationFromWords(totalWords)
    
    // Generate episode summary
    const summary = this.generateEpisodeSummary(segment, episodeNumber)
    
    const episode: Episode = {
      id: episodeId,
      episodeNumber,
      title,
      summary,
      scenes: episodeScenes,
      duration: Math.min(estimatedDuration, targetDuration),
      keyEvents,
      status: 'draft'
    }
    
    return episode
  }

  /**
   * Generates episode title based on content
   */
  private static generateEpisodeTitle(
    segment: {
      chapters: Chapter[]
      plotPoints: PlotPoint[]
      startIndex: number
      endIndex: number
    },
    episodeNumber: number
  ): string {
    // Try to use the most significant plot point as title inspiration
    const significantPlotPoint = segment.plotPoints.find(p => p.importance === 'critical') ||
                               segment.plotPoints.find(p => p.importance === 'major') ||
                               segment.plotPoints[0]
    
    if (significantPlotPoint) {
      // Extract key words from plot point description
      const keyWords = this.extractKeyWords(significantPlotPoint.description)
      if (keyWords.length > 0) {
        return `第${episodeNumber}集: ${keyWords.slice(0, 3).join('与')}`
      }
    }
    
    // Fallback to chapter titles
    if (segment.chapters.length > 0) {
      const firstChapterTitle = segment.chapters[0].title
      if (firstChapterTitle && firstChapterTitle !== `Chapter ${segment.startIndex + 1}`) {
        return `第${episodeNumber}集: ${firstChapterTitle.replace(/第.*章/, '').trim()}`
      }
    }
    
    return `第${episodeNumber}集`
  }

  /**
   * Extracts key words from text
   */
  private static extractKeyWords(text: string): string[] {
    // Simple keyword extraction - in practice would use more sophisticated NLP
    const keywords: string[] = []
    
    // Chinese keywords
    const chineseKeywords = text.match(/[\u4e00-\u9fa5]{2,4}/g) || []
    keywords.push(...chineseKeywords.slice(0, 3))
    
    // English keywords
    const englishKeywords = text.match(/\b[A-Z][a-z]+\b/g) || []
    keywords.push(...englishKeywords.slice(0, 2))
    
    return keywords.filter(word => word.length >= 2)
  }

  /**
   * Creates dramatic arc for episode scenes
   */
  private static createEpisodeDramaticArc(
    segment: {
      chapters: Chapter[]
      plotPoints: PlotPoint[]
      startIndex: number
      endIndex: number
    },
    targetDuration: number
  ): Scene[] {
    const allScenes = segment.chapters.flatMap(chapter => chapter.scenes)
    
    if (allScenes.length === 0) {
      return []
    }
    
    // Calculate duration allocation for dramatic arc
    const setupDuration = targetDuration * this.DRAMATIC_ARC_RATIOS.setup
    const developmentDuration = targetDuration * this.DRAMATIC_ARC_RATIOS.development
    const resolutionDuration = targetDuration * this.DRAMATIC_ARC_RATIOS.resolution
    
    // Organize scenes into dramatic structure
    const setupScenes = this.selectScenesForArcSection(allScenes, 'setup', setupDuration)
    const developmentScenes = this.selectScenesForArcSection(
      allScenes.slice(setupScenes.length), 
      'development', 
      developmentDuration
    )
    const resolutionScenes = this.selectScenesForArcSection(
      allScenes.slice(setupScenes.length + developmentScenes.length), 
      'resolution', 
      resolutionDuration
    )
    
    return [...setupScenes, ...developmentScenes, ...resolutionScenes]
  }

  /**
   * Selects scenes for a specific arc section
   */
  private static selectScenesForArcSection(
    availableScenes: Scene[], 
    arcSection: 'setup' | 'development' | 'resolution',
    targetDuration: number
  ): Scene[] {
    if (availableScenes.length === 0) {
      return []
    }
    
    const selectedScenes: Scene[] = []
    let currentDuration = 0
    
    // Estimate scene durations and select appropriate ones
    for (const scene of availableScenes) {
      const sceneDuration = this.estimateSceneDuration(scene)
      
      if (currentDuration + sceneDuration <= targetDuration || selectedScenes.length === 0) {
        selectedScenes.push(scene)
        currentDuration += sceneDuration
      } else {
        break
      }
    }
    
    return selectedScenes
  }

  /**
   * Estimates duration of a scene
   */
  private static estimateSceneDuration(scene: Scene): number {
    const wordCount = scene.content.split(/\s+/).length
    return this.estimateDurationFromWords(wordCount)
  }

  /**
   * Generates key events for an episode
   */
  private static generateKeyEvents(
    segment: {
      chapters: Chapter[]
      plotPoints: PlotPoint[]
      startIndex: number
      endIndex: number
    },
    episodeId: string
  ): KeyEvent[] {
    const keyEvents: KeyEvent[] = []
    
    // Convert plot points to key events
    segment.plotPoints.forEach((plotPoint, index) => {
      const keyEvent: KeyEvent = {
        id: `${episodeId}_event_${index + 1}`,
        episodeId,
        eventType: this.mapPlotTypeToEventType(plotPoint.type),
        description: plotPoint.description,
        importance: plotPoint.importance,
        timestamp: this.calculateEventTimestamp(index, segment.plotPoints.length)
      }
      
      keyEvents.push(keyEvent)
    })
    
    return keyEvents
  }

  /**
   * Maps plot point type to event type
   */
  private static mapPlotTypeToEventType(plotType: PlotPoint['type']): KeyEvent['eventType'] {
    const mapping: Record<PlotPoint['type'], KeyEvent['eventType']> = {
      'exposition': 'plot_point',
      'inciting_incident': 'conflict',
      'rising_action': 'character_development',
      'climax': 'conflict',
      'falling_action': 'resolution',
      'resolution': 'resolution'
    }
    
    return mapping[plotType] || 'plot_point'
  }

  /**
   * Calculates timestamp for event within episode
   */
  private static calculateEventTimestamp(eventIndex: number, totalEvents: number): number {
    if (totalEvents <= 1) return 0.5
    
    // Distribute events evenly throughout the episode
    return (eventIndex + 1) / (totalEvents + 1)
  }

  /**
   * Generates episode summary
   */
  private static generateEpisodeSummary(
    segment: {
      chapters: Chapter[]
      plotPoints: PlotPoint[]
      startIndex: number
      endIndex: number
    },
    episodeNumber: number
  ): string {
    const plotDescriptions = segment.plotPoints
      .filter(p => p.importance !== 'minor')
      .map(p => p.description)
      .slice(0, 2)
    
    if (plotDescriptions.length > 0) {
      return `第${episodeNumber}集: ${plotDescriptions.join('，')}`
    }
    
    // Fallback to chapter content summary
    const firstChapter = segment.chapters[0]
    if (firstChapter && firstChapter.content.length > 0) {
      const sentences = firstChapter.content.split(/[。！？.!?]/).filter(s => s.trim().length > 0)
      const firstSentence = sentences[0]?.trim() || ''
      
      if (firstSentence.length > 0) {
        return `第${episodeNumber}集: ${firstSentence.substring(0, 50)}${firstSentence.length > 50 ? '...' : ''}`
      }
    }
    
    return `第${episodeNumber}集: 故事继续发展`
  }

  /**
   * Ensures narrative continuity between episodes
   */
  private static ensureNarrativeContinuity(episodes: Episode[], plotStructure: PlotStructure): void {
    for (let i = 0; i < episodes.length - 1; i++) {
      const currentEpisode = episodes[i]
      const nextEpisode = episodes[i + 1]
      
      // Add connection information to episode summaries
      this.addEpisodeConnections(currentEpisode, nextEpisode)
      
      // Ensure character continuity
      this.ensureCharacterContinuity(currentEpisode, nextEpisode)
      
      // Check plot point flow
      this.validatePlotPointFlow(currentEpisode, nextEpisode, plotStructure)
    }
  }

  /**
   * Adds connection information between episodes
   */
  private static addEpisodeConnections(currentEpisode: Episode, nextEpisode: Episode): void {
    // Add cliffhanger or connection hint to current episode summary
    if (!currentEpisode.summary.includes('下集')) {
      const connectionHint = this.generateConnectionHint(currentEpisode, nextEpisode)
      if (connectionHint) {
        currentEpisode.summary += ` ${connectionHint}`
      }
    }
  }

  /**
   * Generates connection hint between episodes
   */
  private static generateConnectionHint(currentEpisode: Episode, nextEpisode: Episode): string {
    // Look for cliffhanger opportunities in current episode's key events
    const lastEvent = currentEpisode.keyEvents[currentEpisode.keyEvents.length - 1]
    
    if (lastEvent && lastEvent.eventType === 'conflict') {
      return '下集预告：冲突将如何解决？'
    }
    
    if (nextEpisode.keyEvents.length > 0) {
      const firstNextEvent = nextEpisode.keyEvents[0]
      if (firstNextEvent.eventType === 'character_development') {
        return '下集预告：角色将面临新的挑战'
      }
    }
    
    return '故事精彩继续...'
  }

  /**
   * Ensures character continuity between episodes
   */
  private static ensureCharacterContinuity(currentEpisode: Episode, nextEpisode: Episode): void {
    // Get characters from current episode
    const currentCharacters = new Set<string>()
    currentEpisode.scenes.forEach(scene => {
      scene.characters.forEach(char => currentCharacters.add(char))
    })
    
    // Get characters from next episode
    const nextCharacters = new Set<string>()
    nextEpisode.scenes.forEach(scene => {
      scene.characters.forEach(char => nextCharacters.add(char))
    })
    
    // Find characters that appear in both episodes
    const continuingCharacters = Array.from(currentCharacters).filter(char => 
      nextCharacters.has(char)
    )
    
    // Add continuity note if there are continuing characters
    if (continuingCharacters.length > 0) {
      // This information could be used by later components for consistency
      // For now, we'll just ensure the data is available
    }
  }

  /**
   * Validates plot point flow between episodes
   */
  private static validatePlotPointFlow(
    currentEpisode: Episode, 
    nextEpisode: Episode, 
    plotStructure: PlotStructure
  ): void {
    // Check if plot points follow logical sequence
    const currentPlotTypes = currentEpisode.keyEvents.map(e => e.eventType)
    const nextPlotTypes = nextEpisode.keyEvents.map(e => e.eventType)
    
    // Ensure no major plot gaps
    const hasResolution = currentPlotTypes.includes('resolution')
    const hasNewConflict = nextPlotTypes.includes('conflict')
    
    if (hasResolution && hasNewConflict) {
      // Good flow: resolution followed by new conflict
      return
    }
    
    // Could add more sophisticated flow validation here
  }

  // ===== CONTENT ADAPTATION WITH STORY PRESERVATION =====

  /**
   * Adjusts episode pacing while preserving essential story elements
   */
  static adjustEpisodePacing(
    episodes: Episode[], 
    targetDuration: number,
    plotStructure: PlotStructure
  ): Episode[] {
    const adjustedEpisodes = episodes.map(episode => ({ ...episode }))
    
    for (let i = 0; i < adjustedEpisodes.length; i++) {
      const episode = adjustedEpisodes[i]
      
      if (episode.duration > targetDuration * 1.2) {
        // Episode is too long - compress content
        this.compressEpisodeContent(episode, targetDuration, plotStructure)
      } else if (episode.duration < targetDuration * 0.8) {
        // Episode is too short - expand content
        this.expandEpisodeContent(episode, targetDuration, adjustedEpisodes, i)
      }
    }
    
    return adjustedEpisodes
  }

  /**
   * Compresses episode content while preserving essential elements
   */
  private static compressEpisodeContent(
    episode: Episode, 
    targetDuration: number, 
    plotStructure: PlotStructure
  ): void {
    // Identify essential story elements that must be preserved
    const essentialEvents = episode.keyEvents.filter(event => 
      event.importance === 'critical' || event.importance === 'major'
    )
    
    // Calculate compression ratio
    const compressionRatio = targetDuration / episode.duration
    
    // Compress scenes while preserving essential content
    const compressedScenes = this.compressScenes(episode.scenes, compressionRatio, essentialEvents)
    
    // Update episode
    episode.scenes = compressedScenes
    episode.duration = targetDuration
    
    // Update summary to reflect compression
    episode.summary = this.generateCompressedSummary(episode.summary, essentialEvents)
  }

  /**
   * Compresses scenes based on importance and compression ratio
   */
  private static compressScenes(
    scenes: Scene[], 
    compressionRatio: number, 
    essentialEvents: KeyEvent[]
  ): Scene[] {
    const compressedScenes: Scene[] = []
    
    for (const scene of scenes) {
      // Check if scene contains essential events
      const isEssential = essentialEvents.some(event => 
        scene.characters.some(char => event.description.includes(char))
      )
      
      if (isEssential) {
        // Keep essential scenes with minimal compression
        const compressedScene = this.compressScene(scene, Math.max(compressionRatio, 0.8))
        compressedScenes.push(compressedScene)
      } else {
        // More aggressive compression for non-essential scenes
        const compressedScene = this.compressScene(scene, compressionRatio * 0.6)
        if (compressedScene.content.length > 50) { // Only keep if still meaningful
          compressedScenes.push(compressedScene)
        }
      }
    }
    
    return compressedScenes
  }

  /**
   * Compresses individual scene content
   */
  private static compressScene(scene: Scene, compressionRatio: number): Scene {
    const sentences = scene.content.split(/[。！？.!?]/).filter(s => s.trim().length > 0)
    const targetSentenceCount = Math.max(1, Math.floor(sentences.length * compressionRatio))
    
    // Keep the most important sentences
    const compressedSentences = sentences.slice(0, targetSentenceCount)
    
    return {
      ...scene,
      content: compressedSentences.join('。') + (compressedSentences.length > 0 ? '。' : '')
    }
  }

  /**
   * Expands episode content to meet target duration
   */
  private static expandEpisodeContent(
    episode: Episode, 
    targetDuration: number, 
    allEpisodes: Episode[], 
    episodeIndex: number
  ): void {
    const expansionRatio = targetDuration / episode.duration
    
    // Expand scenes with additional detail
    const expandedScenes = this.expandScenes(episode.scenes, expansionRatio)
    
    // Add transition scenes if needed
    const transitionScenes = this.generateTransitionScenes(episode, allEpisodes, episodeIndex)
    
    // Update episode
    episode.scenes = [...expandedScenes, ...transitionScenes]
    episode.duration = targetDuration
    
    // Update summary to reflect expansion
    episode.summary = this.generateExpandedSummary(episode.summary, transitionScenes)
  }

  /**
   * Expands scenes with additional detail
   */
  private static expandScenes(scenes: Scene[], expansionRatio: number): Scene[] {
    return scenes.map(scene => {
      // Add descriptive content to expand the scene
      const expandedContent = this.expandSceneContent(scene.content, expansionRatio)
      
      return {
        ...scene,
        content: expandedContent
      }
    })
  }

  /**
   * Expands individual scene content
   */
  private static expandSceneContent(content: string, expansionRatio: number): string {
    const sentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 0)
    const expandedSentences: string[] = []
    
    for (const sentence of sentences) {
      expandedSentences.push(sentence)
      
      // Add descriptive expansion if needed
      if (expansionRatio > 1.2) {
        const expansion = this.generateDescriptiveExpansion(sentence)
        if (expansion) {
          expandedSentences.push(expansion)
        }
      }
    }
    
    return expandedSentences.join('。') + '。'
  }

  /**
   * Generates descriptive expansion for a sentence
   */
  private static generateDescriptiveExpansion(sentence: string): string | null {
    // Simple expansion based on content type
    if (/说|讲|告诉|speak|say|tell/i.test(sentence)) {
      return '他的声音中带着某种情感'
    }
    
    if (/走|跑|移动|move|walk|run/i.test(sentence)) {
      return '脚步声在空间中回响'
    }
    
    if (/看|观察|注视|look|watch|observe/i.test(sentence)) {
      return '目光中透露出复杂的情绪'
    }
    
    return null
  }

  /**
   * Generates transition scenes between episodes
   */
  private static generateTransitionScenes(
    episode: Episode, 
    allEpisodes: Episode[], 
    episodeIndex: number
  ): Scene[] {
    const transitionScenes: Scene[] = []
    
    // Add recap scene if not the first episode
    if (episodeIndex > 0) {
      const recapScene = this.generateRecapScene(episode, allEpisodes[episodeIndex - 1])
      transitionScenes.push(recapScene)
    }
    
    // Add preview scene if not the last episode
    if (episodeIndex < allEpisodes.length - 1) {
      const previewScene = this.generatePreviewScene(episode, allEpisodes[episodeIndex + 1])
      transitionScenes.push(previewScene)
    }
    
    return transitionScenes
  }

  /**
   * Generates recap scene
   */
  private static generateRecapScene(currentEpisode: Episode, previousEpisode: Episode): Scene {
    return {
      id: `${currentEpisode.id}_recap`,
      chapterId: 'transition',
      sceneNumber: 0,
      content: `回顾：${previousEpisode.summary}`,
      setting: 'transition',
      characters: []
    }
  }

  /**
   * Generates preview scene
   */
  private static generatePreviewScene(currentEpisode: Episode, nextEpisode: Episode): Scene {
    return {
      id: `${currentEpisode.id}_preview`,
      chapterId: 'transition',
      sceneNumber: 999,
      content: `下集预告：${nextEpisode.summary}`,
      setting: 'transition',
      characters: []
    }
  }

  /**
   * Preserves essential story elements during adaptation
   */
  static preserveEssentialStoryElements(
    episodes: Episode[], 
    plotStructure: PlotStructure
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []
    
    // Check if all critical plot points are preserved
    const criticalPlotPoints = plotStructure.mainPlotline.filter(p => p.isImmutable)
    
    for (const plotPoint of criticalPlotPoints) {
      const isPreserved = episodes.some(episode =>
        episode.keyEvents.some(event => 
          event.description.includes(plotPoint.description.substring(0, 20))
        )
      )
      
      if (!isPreserved) {
        errors.push({
          code: 'MISSING_CRITICAL_PLOT_POINT',
          message: `Critical plot point not preserved in episodes: ${plotPoint.description}`,
          field: 'plotPoints',
          severity: 'error'
        })
      }
    }
    
    // Check narrative arc preservation
    const arcValidation = this.validateNarrativeArcPreservation(episodes, plotStructure)
    errors.push(...arcValidation.errors)
    warnings.push(...arcValidation.warnings)
    
    // Check character development continuity
    const characterValidation = this.validateCharacterDevelopmentContinuity(episodes)
    warnings.push(...characterValidation.warnings)
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validates narrative arc preservation
   */
  private static validateNarrativeArcPreservation(
    episodes: Episode[], 
    plotStructure: PlotStructure
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []
    
    // Check if setup, confrontation, and resolution are all represented
    const allEventTypes = episodes.flatMap(ep => ep.keyEvents.map(e => e.eventType))
    
    if (!allEventTypes.includes('plot_point')) {
      warnings.push({
        code: 'MISSING_SETUP_ELEMENTS',
        message: 'Setup elements may be underrepresented in episodes',
        field: 'narrativeArc',
        severity: 'warning'
      })
    }
    
    if (!allEventTypes.includes('conflict')) {
      errors.push({
        code: 'MISSING_CONFLICT_ELEMENTS',
        message: 'Conflict elements are missing from episodes',
        field: 'narrativeArc',
        severity: 'error'
      })
    }
    
    if (!allEventTypes.includes('resolution')) {
      warnings.push({
        code: 'MISSING_RESOLUTION_ELEMENTS',
        message: 'Resolution elements may be underrepresented in episodes',
        field: 'narrativeArc',
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
   * Validates character development continuity
   */
  private static validateCharacterDevelopmentContinuity(episodes: Episode[]): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []
    
    // Track character appearances across episodes
    const characterAppearances = new Map<string, number[]>()
    
    episodes.forEach((episode, index) => {
      const episodeCharacters = new Set<string>()
      episode.scenes.forEach(scene => {
        scene.characters.forEach(char => episodeCharacters.add(char))
      })
      
      episodeCharacters.forEach(char => {
        if (!characterAppearances.has(char)) {
          characterAppearances.set(char, [])
        }
        characterAppearances.get(char)!.push(index)
      })
    })
    
    // Check for character continuity issues
    characterAppearances.forEach((appearances, character) => {
      if (appearances.length > 1) {
        // Check for gaps in character appearances
        for (let i = 1; i < appearances.length; i++) {
          const gap = appearances[i] - appearances[i - 1]
          if (gap > 2) {
            warnings.push({
              code: 'CHARACTER_CONTINUITY_GAP',
              message: `Character ${character} has a ${gap}-episode gap in appearances`,
              field: 'characterContinuity',
              severity: 'warning'
            })
          }
        }
      }
    })
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Generates episode metadata including summaries and connections
   */
  static generateEpisodeMetadata(episodes: Episode[]): Episode[] {
    const updatedEpisodes = episodes.map(episode => ({ ...episode }))
    
    for (let i = 0; i < updatedEpisodes.length; i++) {
      const episode = updatedEpisodes[i]
      
      // Enhanced summary with context
      episode.summary = this.generateEnhancedSummary(episode, updatedEpisodes, i)
      
      // Add connection information
      this.addConnectionMetadata(episode, updatedEpisodes, i)
    }
    
    return updatedEpisodes
  }

  /**
   * Generates enhanced summary with context
   */
  private static generateEnhancedSummary(
    episode: Episode, 
    allEpisodes: Episode[], 
    episodeIndex: number
  ): string {
    let enhancedSummary = episode.summary
    
    // Add context from key events
    const majorEvents = episode.keyEvents.filter(e => e.importance === 'major' || e.importance === 'critical')
    if (majorEvents.length > 0) {
      const eventDescriptions = majorEvents.map(e => e.description).join('，')
      enhancedSummary += ` 重要事件：${eventDescriptions}`
    }
    
    // Add character focus information
    const mainCharacters = this.getMainCharactersInEpisode(episode)
    if (mainCharacters.length > 0) {
      enhancedSummary += ` 主要角色：${mainCharacters.join('、')}`
    }
    
    return enhancedSummary
  }

  /**
   * Gets main characters in an episode
   */
  private static getMainCharactersInEpisode(episode: Episode): string[] {
    const characterCounts = new Map<string, number>()
    
    episode.scenes.forEach(scene => {
      scene.characters.forEach(char => {
        characterCounts.set(char, (characterCounts.get(char) || 0) + 1)
      })
    })
    
    // Return characters that appear in multiple scenes
    return Array.from(characterCounts.entries())
      .filter(([_, count]) => count >= 2)
      .map(([char, _]) => char)
      .slice(0, 3) // Limit to top 3
  }

  /**
   * Adds connection metadata to episode
   */
  private static addConnectionMetadata(
    episode: Episode, 
    allEpisodes: Episode[], 
    episodeIndex: number
  ): void {
    // This would add metadata about connections to previous/next episodes
    // For now, we'll just ensure the summary includes connection hints
    if (episodeIndex > 0) {
      const prevEpisode = allEpisodes[episodeIndex - 1]
      // Connection logic already handled in summary generation
    }
    
    if (episodeIndex < allEpisodes.length - 1) {
      const nextEpisode = allEpisodes[episodeIndex + 1]
      // Preview logic already handled in summary generation
    }
  }

  /**
   * Generates compressed summary
   */
  private static generateCompressedSummary(originalSummary: string, essentialEvents: KeyEvent[]): string {
    const eventDescriptions = essentialEvents.map(e => e.description).join('，')
    return `${originalSummary.split('：')[0]}：${eventDescriptions}`
  }

  /**
   * Generates expanded summary
   */
  private static generateExpandedSummary(originalSummary: string, transitionScenes: Scene[]): string {
    if (transitionScenes.length > 0) {
      return `${originalSummary} 包含回顾与预告内容。`
    }
    return originalSummary
  }

  /**
   * Stores episodes for persistence
   */
  static storeEpisodes(episodes: Episode[], novelId: string): string[] {
    const episodeIds: string[] = []
    
    episodes.forEach(episode => {
      const storageKey = `episode_${episode.id}`
      
      try {
        localStorage.setItem(storageKey, JSON.stringify(episode))
        episodeIds.push(episode.id)
      } catch (error) {
        console.error(`Failed to store episode ${episode.id}:`, error)
      }
    })
    
    // Store episode list for the novel
    const episodeListKey = `episodes_${novelId}`
    localStorage.setItem(episodeListKey, JSON.stringify(episodeIds))
    
    return episodeIds
  }

  /**
   * Retrieves episodes for a novel
   */
  static retrieveEpisodes(novelId: string): Episode[] {
    const episodeListKey = `episodes_${novelId}`
    
    try {
      const episodeIds = JSON.parse(localStorage.getItem(episodeListKey) || '[]')
      const episodes: Episode[] = []
      
      for (const episodeId of episodeIds) {
        const storageKey = `episode_${episodeId}`
        const stored = localStorage.getItem(storageKey)
        
        if (stored) {
          episodes.push(JSON.parse(stored))
        }
      }
      
      return episodes.sort((a, b) => a.episodeNumber - b.episodeNumber)
    } catch (error) {
      console.error('Failed to retrieve episodes:', error)
      return []
    }
  }
}