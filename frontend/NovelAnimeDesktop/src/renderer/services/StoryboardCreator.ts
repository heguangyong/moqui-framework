import type { 
  Screenplay, 
  ScreenplayScene, 
  Storyboard, 
  ShotSpecification, 
  TransitionSpecification,
  Character, 
  LockedProfile,
  CameraAngle,
  ShotType,
  CharacterInShot,
  Setting,
  TransitionType,
  AIVideoGenerationData,
  AIShotData,
  AITransitionData,
  AICompatibilityReport,
  PlatformSpecificData
} from '../types/core'

/**
 * Storyboard Creator Service
 * Generates detailed shot-by-shot visual descriptions from screenplay content
 */
export class StoryboardCreator {
  private static readonly SHOT_DURATION_RANGES = {
    'extreme_wide': { min: 3, max: 8 },
    'wide': { min: 2, max: 6 },
    'medium': { min: 2, max: 5 },
    'close_up': { min: 1, max: 4 },
    'extreme_close_up': { min: 0.5, max: 2 },
    'over_shoulder': { min: 2, max: 5 }
  }

  private static readonly CAMERA_ANGLE_WEIGHTS = {
    'eye_level': 0.4,    // Most common
    'high': 0.2,         // For vulnerability, overview
    'low': 0.15,         // For power, dominance
    'birds_eye': 0.1,    // For establishing shots
    'worms_eye': 0.1,    // For dramatic effect
    'dutch': 0.05        // For tension, unease
  }

  private static readonly SHOT_TYPE_SEQUENCES = {
    'establishing': ['extreme_wide', 'wide', 'medium'],
    'dialogue': ['medium', 'close_up', 'over_shoulder'],
    'action': ['wide', 'medium', 'close_up', 'extreme_close_up'],
    'emotional': ['close_up', 'extreme_close_up', 'medium'],
    'transition': ['wide', 'extreme_wide']
  }

  /**
   * Creates a complete storyboard from screenplay content
   */
  static createStoryboard(
    screenplay: Screenplay, 
    characters: Character[], 
    lockedProfiles: LockedProfile[]
  ): Storyboard {
    const shots: ShotSpecification[] = []
    const transitionSpecs: TransitionSpecification[] = []
    let totalDuration = 0
    let shotCounter = 1

    // Process each scene in the screenplay
    for (const scene of screenplay.scenes) {
      const sceneShots = this.generateShotsForScene(
        scene, 
        characters, 
        lockedProfiles, 
        shotCounter
      )
      
      shots.push(...sceneShots)
      totalDuration += sceneShots.reduce((sum, shot) => sum + shot.duration, 0)
      shotCounter += sceneShots.length

      // Generate transitions between scenes (except for the last scene)
      if (scene !== screenplay.scenes[screenplay.scenes.length - 1]) {
        const transition = this.generateSceneTransition(
          sceneShots[sceneShots.length - 1],
          shotCounter
        )
        transitionSpecs.push(transition)
      }
    }

    // Generate transitions between shots within scenes
    for (let i = 0; i < shots.length - 1; i++) {
      const fromShot = shots[i]
      const toShot = shots[i + 1]
      
      // Only add transition if shots are in the same scene or adjacent scenes
      if (this.shouldAddTransition(fromShot, toShot)) {
        const transition = this.generateShotTransition(fromShot, toShot)
        transitionSpecs.push(transition)
      }
    }

    // Optimize transitions for quality
    const optimizedTransitions = this.optimizeTransitions(transitionSpecs, shots)

    return {
      id: `storyboard_${screenplay.episodeId}`,
      episodeId: screenplay.episodeId,
      shots,
      totalDuration,
      transitionSpecs: optimizedTransitions
    }
  }

  /**
   * Generates shots for a single scene
   */
  private static generateShotsForScene(
    scene: ScreenplayScene,
    characters: Character[],
    lockedProfiles: LockedProfile[],
    startingShotNumber: number
  ): ShotSpecification[] {
    const shots: ShotSpecification[] = []
    const sceneCharacters = characters.filter(char => scene.characters.includes(char.id))
    
    // Analyze scene content to determine shot requirements
    const sceneAnalysis = this.analyzeSceneContent(scene, sceneCharacters)
    
    // Generate establishing shot
    const establishingShot = this.generateEstablishingShot(
      scene, 
      sceneCharacters, 
      lockedProfiles, 
      startingShotNumber
    )
    shots.push(establishingShot)

    // Generate dialogue and action shots
    const contentShots = this.generateContentShots(
      scene,
      sceneCharacters,
      lockedProfiles,
      sceneAnalysis,
      startingShotNumber + 1
    )
    shots.push(...contentShots)

    // Generate closing shot if needed
    if (sceneAnalysis.needsClosingShot) {
      const closingShot = this.generateClosingShot(
        scene,
        sceneCharacters,
        lockedProfiles,
        startingShotNumber + contentShots.length + 1
      )
      shots.push(closingShot)
    }

    return shots
  }

  /**
   * Analyzes scene content to determine shot requirements
   */
  private static analyzeSceneContent(
    scene: ScreenplayScene,
    characters: Character[]
  ): {
    hasDialogue: boolean,
    hasAction: boolean,
    emotionalIntensity: number,
    characterCount: number,
    sceneType: 'establishing' | 'dialogue' | 'action' | 'emotional' | 'transition',
    needsClosingShot: boolean
  } {
    const content = scene.content.toLowerCase()
    
    // Check for dialogue
    const hasDialogue = /[""''「」『』]/.test(scene.content) || 
                       content.includes('said') || 
                       content.includes('replied')

    // Check for action
    const actionWords = ['runs', 'walks', 'jumps', 'grabs', 'opens', 'closes', 'enters', 'leaves']
    const hasAction = actionWords.some(word => content.includes(word))

    // Analyze emotional intensity
    const emotionWords = ['angry', 'sad', 'happy', 'scared', 'surprised', 'love', 'hate']
    const emotionalIntensity = emotionWords.filter(word => content.includes(word)).length / emotionWords.length

    // Determine scene type
    let sceneType: 'establishing' | 'dialogue' | 'action' | 'emotional' | 'transition' = 'dialogue'
    if (emotionalIntensity > 0.3) sceneType = 'emotional'
    else if (hasAction && !hasDialogue) sceneType = 'action'
    else if (!hasDialogue && !hasAction) sceneType = 'establishing'

    return {
      hasDialogue,
      hasAction,
      emotionalIntensity,
      characterCount: characters.length,
      sceneType,
      needsClosingShot: hasAction || emotionalIntensity > 0.5
    }
  }

  /**
   * Generates an establishing shot for the scene
   */
  private static generateEstablishingShot(
    scene: ScreenplayScene,
    characters: Character[],
    lockedProfiles: LockedProfile[],
    shotNumber: number
  ): ShotSpecification {
    const setting = this.createSettingFromScene(scene)
    const charactersInShot = this.positionCharactersInShot(characters, lockedProfiles, 'establishing')

    return {
      shotId: `shot_${scene.id}_${shotNumber}`,
      shotNumber,
      duration: this.calculateShotDuration('wide', scene.content),
      cameraAngle: 'eye_level',
      shotType: 'wide',
      characters: charactersInShot,
      setting,
      visualDescription: this.generateVisualDescription(
        'wide', 
        'eye_level', 
        charactersInShot, 
        setting, 
        'establishing'
      ),
      aiPrompt: this.generateAIPrompt(
        'wide',
        'eye_level',
        charactersInShot,
        setting,
        'establishing shot of the scene'
      )
    }
  }

  /**
   * Generates content shots (dialogue, action, etc.)
   */
  private static generateContentShots(
    scene: ScreenplayScene,
    characters: Character[],
    lockedProfiles: LockedProfile[],
    sceneAnalysis: any,
    startingShotNumber: number
  ): ShotSpecification[] {
    const shots: ShotSpecification[] = []
    const shotSequence = this.SHOT_TYPE_SEQUENCES[sceneAnalysis.sceneType] || this.SHOT_TYPE_SEQUENCES['dialogue']
    
    // Generate shots based on scene type
    for (let i = 0; i < shotSequence.length; i++) {
      const shotType = shotSequence[i] as ShotType
      const cameraAngle = this.selectCameraAngle(shotType, sceneAnalysis)
      const charactersInShot = this.positionCharactersInShot(characters, lockedProfiles, shotType)
      const setting = this.createSettingFromScene(scene)

      const shot: ShotSpecification = {
        shotId: `shot_${scene.id}_${startingShotNumber + i}`,
        shotNumber: startingShotNumber + i,
        duration: this.calculateShotDuration(shotType, scene.content),
        cameraAngle,
        shotType,
        characters: charactersInShot,
        setting,
        visualDescription: this.generateVisualDescription(
          shotType,
          cameraAngle,
          charactersInShot,
          setting,
          sceneAnalysis.sceneType
        ),
        aiPrompt: this.generateAIPrompt(
          shotType,
          cameraAngle,
          charactersInShot,
          setting,
          `${sceneAnalysis.sceneType} shot`
        )
      }

      // Add emotional beat if scene has high emotional intensity
      if (sceneAnalysis.emotionalIntensity > 0.3) {
        shot.emotionalBeat = this.extractEmotionalBeat(scene.content)
      }

      shots.push(shot)
    }

    return shots
  }

  /**
   * Generates a closing shot for the scene
   */
  private static generateClosingShot(
    scene: ScreenplayScene,
    characters: Character[],
    lockedProfiles: LockedProfile[],
    shotNumber: number
  ): ShotSpecification {
    const setting = this.createSettingFromScene(scene)
    const charactersInShot = this.positionCharactersInShot(characters, lockedProfiles, 'medium')

    return {
      shotId: `shot_${scene.id}_${shotNumber}`,
      shotNumber,
      duration: this.calculateShotDuration('medium', scene.content),
      cameraAngle: 'eye_level',
      shotType: 'medium',
      characters: charactersInShot,
      setting,
      visualDescription: this.generateVisualDescription(
        'medium',
        'eye_level',
        charactersInShot,
        setting,
        'closing'
      ),
      aiPrompt: this.generateAIPrompt(
        'medium',
        'eye_level',
        charactersInShot,
        setting,
        'closing shot of the scene'
      )
    }
  }

  /**
   * Creates setting information from scene data
   */
  private static createSettingFromScene(scene: ScreenplayScene): Setting {
    // Extract time of day from scene heading
    const timeOfDay = this.extractTimeOfDay(scene.heading)
    
    return {
      location: scene.setting,
      timeOfDay,
      lighting: this.generateLighting(timeOfDay, scene.setting),
      atmosphere: this.generateAtmosphere(scene.content)
    }
  }

  /**
   * Extracts time of day from scene heading
   */
  private static extractTimeOfDay(heading: string): 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'night' {
    const lowerHeading = heading.toLowerCase()
    
    if (lowerHeading.includes('dawn')) return 'dawn'
    if (lowerHeading.includes('morning')) return 'morning'
    if (lowerHeading.includes('noon')) return 'noon'
    if (lowerHeading.includes('afternoon')) return 'afternoon'
    if (lowerHeading.includes('evening')) return 'evening'
    if (lowerHeading.includes('night')) return 'night'
    
    return 'morning' // Default
  }

  /**
   * Generates lighting description based on time and location
   */
  private static generateLighting(timeOfDay: string, location: string): string {
    const lightingMap: Record<string, string> = {
      'dawn': 'Soft golden light filtering through windows, long shadows',
      'morning': 'Bright natural daylight, clear and energetic',
      'noon': 'Strong overhead lighting, minimal shadows',
      'afternoon': 'Warm angled light, comfortable atmosphere',
      'evening': 'Golden hour lighting, warm and intimate',
      'night': 'Artificial lighting, dramatic shadows and highlights'
    }
    
    let lighting = lightingMap[timeOfDay] || lightingMap['morning']
    
    // Adjust for indoor/outdoor
    if (location.toLowerCase().includes('outdoor') || location.toLowerCase().includes('street')) {
      lighting += ', natural outdoor environment'
    } else {
      lighting += ', indoor ambient lighting'
    }
    
    return lighting
  }

  /**
   * Generates atmosphere description from scene content
   */
  private static generateAtmosphere(content: string): string {
    const lowerContent = content.toLowerCase()
    
    if (lowerContent.includes('tense') || lowerContent.includes('nervous')) return 'tense and suspenseful'
    if (lowerContent.includes('romantic') || lowerContent.includes('love')) return 'romantic and intimate'
    if (lowerContent.includes('action') || lowerContent.includes('fight')) return 'dynamic and energetic'
    if (lowerContent.includes('sad') || lowerContent.includes('crying')) return 'melancholic and somber'
    if (lowerContent.includes('happy') || lowerContent.includes('joy')) return 'cheerful and uplifting'
    
    return 'neutral and balanced'
  }

  /**
   * Positions characters within the shot
   */
  private static positionCharactersInShot(
    characters: Character[],
    lockedProfiles: LockedProfile[],
    shotType: ShotType
  ): CharacterInShot[] {
    const charactersInShot: CharacterInShot[] = []
    
    // Determine how many characters to include based on shot type
    const maxCharacters = this.getMaxCharactersForShotType(shotType)
    const selectedCharacters = characters.slice(0, maxCharacters)
    
    selectedCharacters.forEach((character, index) => {
      const profile = lockedProfiles.find(p => p.characterId === character.id)
      
      charactersInShot.push({
        characterId: character.id,
        position: this.determineCharacterPosition(index, selectedCharacters.length, shotType),
        expression: this.generateCharacterExpression(character, profile),
        action: this.generateCharacterAction(character, shotType),
        prominence: this.determineCharacterProminence(index, selectedCharacters.length)
      })
    })
    
    return charactersInShot
  }

  /**
   * Gets maximum characters for shot type
   */
  private static getMaxCharactersForShotType(shotType: ShotType): number {
    const maxCharactersMap: Record<ShotType, number> = {
      'extreme_wide': 10,
      'wide': 5,
      'medium': 3,
      'close_up': 1,
      'extreme_close_up': 1,
      'over_shoulder': 2
    }
    
    return maxCharactersMap[shotType]
  }

  /**
   * Determines character position in frame
   */
  private static determineCharacterPosition(
    index: number, 
    totalCharacters: number, 
    shotType: ShotType
  ): string {
    if (totalCharacters === 1) return 'center'
    if (totalCharacters === 2) return index === 0 ? 'left' : 'right'
    
    // For 3+ characters
    if (index === 0) return 'left'
    if (index === totalCharacters - 1) return 'right'
    return 'center'
  }

  /**
   * Generates character expression
   */
  private static generateCharacterExpression(
    character: Character, 
    profile?: LockedProfile
  ): string {
    const personality = profile?.lockedAttributes.personality.toLowerCase() || character.attributes.personality.toLowerCase()
    
    if (personality.includes('cheerful') || personality.includes('happy')) return 'smiling, bright eyes'
    if (personality.includes('serious') || personality.includes('stern')) return 'focused, determined look'
    if (personality.includes('shy') || personality.includes('timid')) return 'gentle, slightly averted gaze'
    if (personality.includes('confident') || personality.includes('bold')) return 'confident, direct gaze'
    
    return 'neutral, attentive expression'
  }

  /**
   * Generates character action
   */
  private static generateCharacterAction(character: Character, shotType: ShotType): string {
    if (shotType === 'close_up' || shotType === 'extreme_close_up') {
      return 'speaking or listening intently'
    }
    
    const personality = character.attributes.personality.toLowerCase()
    
    if (personality.includes('active') || personality.includes('energetic')) return 'animated gesturing'
    if (personality.includes('calm') || personality.includes('peaceful')) return 'standing calmly'
    if (personality.includes('nervous') || personality.includes('anxious')) return 'fidgeting slightly'
    
    return 'natural, relaxed posture'
  }

  /**
   * Determines character prominence in shot
   */
  private static determineCharacterProminence(
    index: number, 
    totalCharacters: number
  ): 'foreground' | 'midground' | 'background' {
    if (totalCharacters === 1) return 'foreground'
    if (index === 0) return 'foreground'
    if (index === 1 && totalCharacters > 2) return 'midground'
    return 'background'
  }

  /**
   * Selects appropriate camera angle
   */
  private static selectCameraAngle(shotType: ShotType, sceneAnalysis: any): CameraAngle {
    // Emotional scenes prefer close angles
    if (sceneAnalysis.emotionalIntensity > 0.5) {
      if (shotType === 'close_up' || shotType === 'extreme_close_up') {
        return Math.random() > 0.5 ? 'high' : 'low' // Dramatic angles
      }
    }
    
    // Action scenes prefer dynamic angles
    if (sceneAnalysis.hasAction) {
      const actionAngles: CameraAngle[] = ['low', 'high', 'dutch']
      return actionAngles[Math.floor(Math.random() * actionAngles.length)]
    }
    
    // Default to eye level for dialogue
    return 'eye_level'
  }

  /**
   * Calculates shot duration based on type and content
   */
  private static calculateShotDuration(shotType: ShotType, content: string): number {
    const range = this.SHOT_DURATION_RANGES[shotType]
    const baseTime = (range.min + range.max) / 2
    
    // Adjust based on content length
    const wordCount = content.split(/\s+/).length
    const contentFactor = Math.min(wordCount / 50, 2) // Max 2x multiplier
    
    return Math.round((baseTime * contentFactor) * 10) / 10 // Round to 1 decimal
  }

  /**
   * Generates visual description for the shot
   */
  private static generateVisualDescription(
    shotType: ShotType,
    cameraAngle: CameraAngle,
    characters: CharacterInShot[],
    setting: Setting,
    sceneType: string
  ): string {
    const elements: string[] = []
    
    // Shot composition
    elements.push(`${shotType.replace('_', ' ')} shot from ${cameraAngle.replace('_', ' ')} angle`)
    
    // Setting description
    elements.push(`Location: ${setting.location} during ${setting.timeOfDay}`)
    elements.push(`Lighting: ${setting.lighting}`)
    elements.push(`Atmosphere: ${setting.atmosphere}`)
    
    // Character descriptions
    if (characters.length > 0) {
      const characterDescs = characters.map(char => 
        `Character ${char.characterId} in ${char.prominence} (${char.position}): ${char.expression}, ${char.action}`
      )
      elements.push(`Characters: ${characterDescs.join('; ')}`)
    }
    
    return elements.join('. ')
  }

  /**
   * Generates AI prompt for video generation
   */
  private static generateAIPrompt(
    shotType: ShotType,
    cameraAngle: CameraAngle,
    characters: CharacterInShot[],
    setting: Setting,
    description: string
  ): string {
    const prompt: string[] = []
    
    // Technical specifications
    prompt.push(`${shotType.replace('_', ' ')} shot, ${cameraAngle.replace('_', ' ')} camera angle`)
    
    // Setting and atmosphere
    prompt.push(`${setting.location}, ${setting.timeOfDay}, ${setting.atmosphere}`)
    prompt.push(setting.lighting)
    
    // Characters
    if (characters.length > 0) {
      const characterPrompts = characters.map(char => 
        `character in ${char.position} position, ${char.expression}, ${char.action}`
      )
      prompt.push(characterPrompts.join(', '))
    }
    
    // Style and quality
    prompt.push('high quality, cinematic, detailed, professional animation')
    
    return prompt.join(', ')
  }

  /**
   * Generates structured data output for AI video generation systems
   */
  static generateAICompatibleOutput(storyboard: Storyboard): AIVideoGenerationData {
    const aiData: AIVideoGenerationData = {
      projectId: storyboard.id,
      episodeId: storyboard.episodeId,
      totalDuration: storyboard.totalDuration,
      shots: storyboard.shots.map(shot => this.convertShotToAIFormat(shot)),
      transitions: storyboard.transitionSpecs.map(transition => this.convertTransitionToAIFormat(transition)),
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0',
        format: 'novel-anime-generator',
        compatibility: ['runwayml', 'pika-labs', 'stable-video', 'gen-2']
      }
    }

    return aiData
  }

  /**
   * Converts shot specification to AI-compatible format
   */
  private static convertShotToAIFormat(shot: ShotSpecification): AIShotData {
    return {
      id: shot.shotId,
      sequence: shot.shotNumber,
      duration: shot.duration,
      camera: {
        angle: shot.cameraAngle,
        shotType: shot.shotType,
        movement: this.inferCameraMovement(shot)
      },
      scene: {
        location: shot.setting.location,
        timeOfDay: shot.setting.timeOfDay,
        lighting: shot.setting.lighting,
        atmosphere: shot.setting.atmosphere,
        weather: shot.setting.weather
      },
      characters: shot.characters.map(char => ({
        id: char.characterId,
        position: char.position,
        prominence: char.prominence,
        expression: char.expression,
        action: char.action
      })),
      prompts: {
        primary: shot.aiPrompt,
        detailed: this.generateDetailedAIPrompt(shot),
        negative: this.generateNegativePrompt(shot),
        style: this.generateStylePrompt(shot)
      },
      technical: {
        aspectRatio: '16:9',
        resolution: 'HD',
        frameRate: 24,
        quality: 'high'
      }
    }
  }

  /**
   * Converts transition specification to AI-compatible format
   */
  private static convertTransitionToAIFormat(transition: TransitionSpecification): AITransitionData {
    return {
      id: transition.id,
      fromShotId: transition.fromShotId,
      toShotId: transition.toShotId,
      type: transition.transitionType,
      duration: transition.duration,
      description: transition.description || '',
      parameters: this.generateTransitionParameters(transition)
    }
  }

  /**
   * Infers camera movement from shot characteristics
   */
  private static inferCameraMovement(shot: ShotSpecification): string {
    // Analyze shot characteristics to infer camera movement
    if (shot.characters.some(char => char.action.includes('walking') || char.action.includes('moving'))) {
      return 'follow'
    }
    
    if (shot.shotType === 'extreme_wide' || shot.shotType === 'wide') {
      return 'static'
    }
    
    if (shot.cameraAngle === 'dutch') {
      return 'slight_shake'
    }
    
    return 'static'
  }

  /**
   * Generates detailed AI prompt with enhanced specifications
   */
  private static generateDetailedAIPrompt(shot: ShotSpecification): string {
    const elements: string[] = []
    
    // Camera specifications
    elements.push(`${shot.shotType.replace('_', ' ')} shot`)
    elements.push(`${shot.cameraAngle.replace('_', ' ')} camera angle`)
    
    // Scene composition
    elements.push(`Location: ${shot.setting.location}`)
    elements.push(`Time: ${shot.setting.timeOfDay}`)
    elements.push(`Lighting: ${shot.setting.lighting}`)
    elements.push(`Atmosphere: ${shot.setting.atmosphere}`)
    
    // Character details
    if (shot.characters.length > 0) {
      shot.characters.forEach(char => {
        elements.push(`Character ${char.characterId}: ${char.expression}, ${char.action}, positioned ${char.position}`)
      })
    }
    
    // Emotional context
    if (shot.emotionalBeat) {
      elements.push(`Emotional tone: ${shot.emotionalBeat}`)
    }
    
    // Technical requirements
    elements.push('Professional animation quality')
    elements.push('Cinematic composition')
    elements.push('Detailed rendering')
    elements.push('Smooth motion')
    
    return elements.join(', ')
  }

  /**
   * Generates negative prompt to avoid unwanted elements
   */
  private static generateNegativePrompt(shot: ShotSpecification): string {
    const negativeElements: string[] = [
      'blurry',
      'low quality',
      'distorted',
      'pixelated',
      'artifacts',
      'watermark',
      'text overlay',
      'logo'
    ]
    
    // Add context-specific negative prompts
    if (shot.shotType === 'close_up' || shot.shotType === 'extreme_close_up') {
      negativeElements.push('multiple faces', 'crowd', 'background characters')
    }
    
    if (shot.setting.timeOfDay === 'night') {
      negativeElements.push('daylight', 'bright sun', 'noon lighting')
    }
    
    if (shot.setting.atmosphere.includes('romantic')) {
      negativeElements.push('violence', 'anger', 'conflict')
    }
    
    return negativeElements.join(', ')
  }

  /**
   * Generates style prompt for consistent visual style
   */
  private static generateStylePrompt(shot: ShotSpecification): string {
    const styleElements: string[] = [
      'anime style',
      'professional animation',
      'detailed artwork',
      'consistent character design',
      'cinematic lighting'
    ]
    
    // Add scene-specific style elements
    if (shot.setting.atmosphere.includes('romantic')) {
      styleElements.push('soft colors', 'warm tones', 'gentle lighting')
    } else if (shot.setting.atmosphere.includes('action') || shot.setting.atmosphere.includes('dynamic')) {
      styleElements.push('dynamic composition', 'bold colors', 'dramatic lighting')
    } else if (shot.setting.atmosphere.includes('melancholic')) {
      styleElements.push('muted colors', 'soft shadows', 'atmospheric mood')
    }
    
    return styleElements.join(', ')
  }

  /**
   * Generates transition parameters for AI systems
   */
  private static generateTransitionParameters(transition: TransitionSpecification): Record<string, any> {
    const parameters: Record<string, any> = {
      duration: transition.duration,
      easing: 'ease-in-out'
    }
    
    switch (transition.transitionType) {
      case 'fade':
        parameters.fadeType = 'cross-fade'
        parameters.opacity = { start: 1, end: 0 }
        break
      case 'dissolve':
        parameters.dissolveType = 'smooth'
        parameters.blendMode = 'normal'
        break
      case 'zoom':
        parameters.zoomDirection = 'in'
        parameters.scale = { start: 1, end: 1.2 }
        break
      case 'pan':
        parameters.direction = 'horizontal'
        parameters.speed = 'medium'
        break
      case 'wipe':
        parameters.direction = 'left-to-right'
        parameters.softness = 0.1
        break
      case 'cut':
        parameters.type = 'instant'
        break
    }
    
    return parameters
  }

  /**
   * Validates AI generation compatibility
   */
  static validateAICompatibility(aiData: AIVideoGenerationData): AICompatibilityReport {
    const issues: string[] = []
    const warnings: string[] = []
    const recommendations: string[] = []
    
    // Validate basic structure
    if (!aiData.projectId || !aiData.episodeId) {
      issues.push('Missing required project or episode ID')
    }
    
    if (!aiData.shots || aiData.shots.length === 0) {
      issues.push('No shots found in storyboard data')
    }
    
    // Validate shots
    aiData.shots.forEach((shot, index) => {
      if (!shot.prompts.primary) {
        issues.push(`Shot ${index + 1}: Missing primary AI prompt`)
      }
      
      if (shot.duration < 0.5) {
        warnings.push(`Shot ${index + 1}: Very short duration (${shot.duration}s) may cause issues`)
      }
      
      if (shot.duration > 10) {
        warnings.push(`Shot ${index + 1}: Long duration (${shot.duration}s) may exceed AI limits`)
      }
      
      if (!shot.camera.angle || !shot.camera.shotType) {
        issues.push(`Shot ${index + 1}: Missing camera specifications`)
      }
    })
    
    // Validate transitions
    aiData.transitions.forEach((transition, index) => {
      if (!transition.fromShotId || !transition.toShotId) {
        issues.push(`Transition ${index + 1}: Missing shot references`)
      }
      
      if (transition.duration > 3) {
        warnings.push(`Transition ${index + 1}: Long transition duration may feel slow`)
      }
    })
    
    // Generate recommendations
    if (aiData.shots.length > 50) {
      recommendations.push('Consider splitting into multiple episodes for better processing')
    }
    
    if (aiData.totalDuration > 300) {
      recommendations.push('Long episodes may require batch processing')
    }
    
    const avgShotDuration = aiData.totalDuration / aiData.shots.length
    if (avgShotDuration < 2) {
      recommendations.push('Consider longer shot durations for better AI generation quality')
    }
    
    return {
      isCompatible: issues.length === 0,
      qualityScore: this.calculateCompatibilityScore(issues, warnings),
      issues,
      warnings,
      recommendations,
      supportedPlatforms: aiData.metadata.compatibility,
      validatedAt: new Date().toISOString()
    }
  }

  /**
   * Calculates compatibility quality score
   */
  private static calculateCompatibilityScore(issues: string[], warnings: string[]): number {
    let score = 100
    
    // Deduct points for issues and warnings
    score -= issues.length * 20
    score -= warnings.length * 5
    
    return Math.max(0, score)
  }

  /**
   * Formats storyboard data for specific AI platforms
   */
  static formatForAIPlatform(
    aiData: AIVideoGenerationData, 
    platform: 'runwayml' | 'pika-labs' | 'stable-video' | 'gen-2'
  ): PlatformSpecificData {
    switch (platform) {
      case 'runwayml':
        return this.formatForRunwayML(aiData)
      case 'pika-labs':
        return this.formatForPikaLabs(aiData)
      case 'stable-video':
        return this.formatForStableVideo(aiData)
      case 'gen-2':
        return this.formatForGen2(aiData)
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }
  }

  /**
   * Formats data for RunwayML Gen-2
   */
  private static formatForRunwayML(aiData: AIVideoGenerationData): PlatformSpecificData {
    return {
      platform: 'runwayml',
      format: 'gen-2',
      data: {
        project_id: aiData.projectId,
        shots: aiData.shots.map(shot => ({
          prompt: shot.prompts.primary,
          duration: Math.min(shot.duration, 4), // RunwayML max 4s
          aspect_ratio: '16:9',
          motion: shot.camera.movement === 'static' ? 1 : 3,
          seed: Math.floor(Math.random() * 1000000)
        }))
      }
    }
  }

  /**
   * Formats data for Pika Labs
   */
  private static formatForPikaLabs(aiData: AIVideoGenerationData): PlatformSpecificData {
    return {
      platform: 'pika-labs',
      format: 'v1',
      data: {
        project: aiData.projectId,
        clips: aiData.shots.map(shot => ({
          text: shot.prompts.detailed,
          duration: Math.min(shot.duration, 3), // Pika Labs max 3s
          camera: shot.camera.movement,
          style: shot.prompts.style,
          negative: shot.prompts.negative
        }))
      }
    }
  }

  /**
   * Formats data for Stable Video Diffusion
   */
  private static formatForStableVideo(aiData: AIVideoGenerationData): PlatformSpecificData {
    return {
      platform: 'stable-video',
      format: 'svd',
      data: {
        sequence: aiData.shots.map(shot => ({
          prompt: shot.prompts.primary,
          negative_prompt: shot.prompts.negative,
          duration_frames: Math.round(shot.duration * 24), // 24 FPS
          width: 1024,
          height: 576,
          motion_bucket_id: shot.camera.movement === 'static' ? 127 : 255
        }))
      }
    }
  }

  /**
   * Formats data for Gen-2
   */
  private static formatForGen2(aiData: AIVideoGenerationData): PlatformSpecificData {
    return {
      platform: 'gen-2',
      format: 'v2',
      data: {
        project_name: aiData.episodeId,
        generations: aiData.shots.map(shot => ({
          text_prompt: shot.prompts.primary,
          duration: Math.min(shot.duration, 4),
          aspect_ratio: '16:9',
          upscale: true,
          interpolate: true,
          watermark: false
        }))
      }
    }
  }

  /**
   * Extracts emotional beat from content
   */
  private static extractEmotionalBeat(content: string): string {
    const emotionWords = {
      'anger': ['angry', 'furious', 'rage', 'mad'],
      'sadness': ['sad', 'crying', 'tears', 'sorrow'],
      'joy': ['happy', 'laughing', 'smile', 'joy'],
      'fear': ['afraid', 'scared', 'terrified', 'anxious'],
      'surprise': ['surprised', 'shocked', 'amazed'],
      'love': ['love', 'romantic', 'tender', 'caring']
    }
    
    const lowerContent = content.toLowerCase()
    
    for (const [emotion, keywords] of Object.entries(emotionWords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        return emotion
      }
    }
    
    return 'neutral'
  }

  /**
   * Generates scene transition
   */
  private static generateSceneTransition(
    lastShot: ShotSpecification,
    nextShotNumber: number
  ): TransitionSpecification {
    return {
      id: `transition_scene_${lastShot.shotId}`,
      fromShotId: lastShot.shotId,
      toShotId: `shot_next_scene_${nextShotNumber}`,
      transitionType: 'fade',
      duration: 1.0,
      description: 'Smooth fade transition between scenes'
    }
  }

  /**
   * Generates transition between shots
   */
  private static generateShotTransition(
    fromShot: ShotSpecification,
    toShot: ShotSpecification
  ): TransitionSpecification {
    const transitionType = this.selectTransitionType(fromShot, toShot)
    
    return {
      id: `transition_${fromShot.shotId}_${toShot.shotId}`,
      fromShotId: fromShot.shotId,
      toShotId: toShot.shotId,
      transitionType,
      duration: this.getTransitionDuration(transitionType),
      description: this.generateTransitionDescription(transitionType, fromShot, toShot)
    }
  }

  /**
   * Selects appropriate transition type using advanced algorithms
   */
  private static selectTransitionType(
    fromShot: ShotSpecification,
    toShot: ShotSpecification
  ): TransitionType {
    // Analyze shot characteristics for intelligent transition selection
    const transitionContext = this.analyzeTransitionContext(fromShot, toShot)
    
    // Apply transition selection rules based on context
    return this.applyTransitionRules(transitionContext, fromShot, toShot)
  }

  /**
   * Analyzes context for transition selection
   */
  private static analyzeTransitionContext(
    fromShot: ShotSpecification,
    toShot: ShotSpecification
  ): {
    locationChange: boolean,
    timeChange: boolean,
    scaleChange: 'none' | 'minor' | 'major',
    angleChange: 'none' | 'minor' | 'major',
    emotionalShift: 'none' | 'subtle' | 'dramatic',
    characterContinuity: number,
    narrativePace: 'slow' | 'medium' | 'fast'
  } {
    // Location analysis
    const locationChange = fromShot.setting.location !== toShot.setting.location
    
    // Time analysis
    const timeChange = fromShot.setting.timeOfDay !== toShot.setting.timeOfDay
    
    // Scale change analysis
    const scaleChange = this.analyzeScaleChange(fromShot.shotType, toShot.shotType)
    
    // Angle change analysis
    const angleChange = this.analyzeAngleChange(fromShot.cameraAngle, toShot.cameraAngle)
    
    // Emotional shift analysis
    const emotionalShift = this.analyzeEmotionalShift(fromShot, toShot)
    
    // Character continuity analysis
    const characterContinuity = this.calculateCharacterContinuity(fromShot.characters, toShot.characters)
    
    // Narrative pace analysis
    const narrativePace = this.analyzeNarrativePace(fromShot, toShot)
    
    return {
      locationChange,
      timeChange,
      scaleChange,
      angleChange,
      emotionalShift,
      characterContinuity,
      narrativePace
    }
  }

  /**
   * Applies transition selection rules based on context
   */
  private static applyTransitionRules(
    context: any,
    fromShot: ShotSpecification,
    toShot: ShotSpecification
  ): TransitionType {
    // Rule 1: Major location or time changes require dissolve
    if (context.locationChange || context.timeChange) {
      return 'dissolve'
    }
    
    // Rule 2: Dramatic emotional shifts use fade
    if (context.emotionalShift === 'dramatic') {
      return 'fade'
    }
    
    // Rule 3: Major scale changes use zoom
    if (context.scaleChange === 'major') {
      return 'zoom'
    }
    
    // Rule 4: Fast-paced action sequences use cuts
    if (context.narrativePace === 'fast') {
      return 'cut'
    }
    
    // Rule 5: Major angle changes with character movement use pan
    if (context.angleChange === 'major' && context.characterContinuity > 0.5) {
      return 'pan'
    }
    
    // Rule 6: Subtle emotional shifts use wipe
    if (context.emotionalShift === 'subtle') {
      return 'wipe'
    }
    
    // Default: Use cut for smooth continuity
    return 'cut'
  }

  /**
   * Analyzes scale change between shots
   */
  private static analyzeScaleChange(fromType: ShotType, toType: ShotType): 'none' | 'minor' | 'major' {
    const scaleOrder: ShotType[] = ['extreme_wide', 'wide', 'medium', 'over_shoulder', 'close_up', 'extreme_close_up']
    
    const fromIndex = scaleOrder.indexOf(fromType)
    const toIndex = scaleOrder.indexOf(toType)
    const difference = Math.abs(fromIndex - toIndex)
    
    if (difference === 0) return 'none'
    if (difference <= 2) return 'minor'
    return 'major'
  }

  /**
   * Analyzes angle change between shots
   */
  private static analyzeAngleChange(fromAngle: CameraAngle, toAngle: CameraAngle): 'none' | 'minor' | 'major' {
    if (fromAngle === toAngle) return 'none'
    
    const dramaticAngles = ['birds_eye', 'worms_eye', 'dutch']
    const standardAngles = ['eye_level', 'high', 'low']
    
    const fromDramatic = dramaticAngles.includes(fromAngle)
    const toDramatic = dramaticAngles.includes(toAngle)
    
    // Dramatic to standard or vice versa is major change
    if (fromDramatic !== toDramatic) return 'major'
    
    return 'minor'
  }

  /**
   * Analyzes emotional shift between shots
   */
  private static analyzeEmotionalShift(
    fromShot: ShotSpecification,
    toShot: ShotSpecification
  ): 'none' | 'subtle' | 'dramatic' {
    const fromEmotion = fromShot.emotionalBeat || 'neutral'
    const toEmotion = toShot.emotionalBeat || 'neutral'
    
    if (fromEmotion === toEmotion) return 'none'
    
    // Define emotional intensity levels
    const emotionIntensity: Record<string, number> = {
      'neutral': 0,
      'joy': 2,
      'sadness': 3,
      'anger': 4,
      'fear': 4,
      'surprise': 2,
      'love': 3
    }
    
    const fromIntensity = emotionIntensity[fromEmotion] || 0
    const toIntensity = emotionIntensity[toEmotion] || 0
    const intensityDiff = Math.abs(fromIntensity - toIntensity)
    
    if (intensityDiff >= 3) return 'dramatic'
    if (intensityDiff >= 1) return 'subtle'
    return 'none'
  }

  /**
   * Calculates character continuity between shots
   */
  private static calculateCharacterContinuity(
    fromCharacters: CharacterInShot[],
    toCharacters: CharacterInShot[]
  ): number {
    // Safety checks for undefined or null arrays
    const safeFromCharacters = fromCharacters || []
    const safeToCharacters = toCharacters || []
    
    if (safeFromCharacters.length === 0 && safeToCharacters.length === 0) return 1
    if (safeFromCharacters.length === 0 || safeToCharacters.length === 0) return 0
    
    const fromIds = new Set(safeFromCharacters.map(c => c.characterId))
    const toIds = new Set(safeToCharacters.map(c => c.characterId))
    
    const intersection = new Set([...fromIds].filter(id => toIds.has(id)))
    const union = new Set([...fromIds, ...toIds])
    
    return intersection.size / union.size
  }

  /**
   * Analyzes narrative pace between shots
   */
  private static analyzeNarrativePace(
    fromShot: ShotSpecification,
    toShot: ShotSpecification
  ): 'slow' | 'medium' | 'fast' {
    const avgDuration = (fromShot.duration + toShot.duration) / 2
    
    // Fast pace: short shots
    if (avgDuration < 2) return 'fast'
    
    // Slow pace: long shots
    if (avgDuration > 5) return 'slow'
    
    return 'medium'
  }

  /**
   * Gets transition duration
   */
  private static getTransitionDuration(transitionType: TransitionType): number {
    const durations: Record<TransitionType, number> = {
      'cut': 0,
      'fade': 1.0,
      'dissolve': 1.5,
      'wipe': 0.8,
      'zoom': 1.2,
      'pan': 2.0
    }
    
    return durations[transitionType]
  }

  /**
   * Generates enhanced transition description with continuity specifications
   */
  private static generateTransitionDescription(
    transitionType: TransitionType,
    fromShot: ShotSpecification,
    toShot: ShotSpecification
  ): string {
    const baseDescription = this.getBaseTransitionDescription(transitionType)
    const continuitySpecs = this.generateContinuitySpecifications(fromShot, toShot, transitionType)
    
    return `${baseDescription}. ${continuitySpecs}`
  }

  /**
   * Gets base transition description
   */
  private static getBaseTransitionDescription(transitionType: TransitionType): string {
    const descriptions: Record<TransitionType, string> = {
      'cut': 'Direct cut between shots',
      'fade': 'Smooth fade transition',
      'dissolve': 'Gradual dissolve between shots',
      'wipe': 'Wipe transition across frame',
      'zoom': 'Zoom transition between shot scales',
      'pan': 'Pan transition following movement'
    }
    
    return descriptions[transitionType]
  }

  /**
   * Generates video continuity specifications
   */
  private static generateContinuitySpecifications(
    fromShot: ShotSpecification,
    toShot: ShotSpecification,
    transitionType: TransitionType
  ): string {
    const specs: string[] = []
    
    // Character continuity
    const characterContinuity = this.calculateCharacterContinuity(fromShot.characters, toShot.characters)
    if (characterContinuity > 0) {
      specs.push(`Maintain character positioning for ${Math.round(characterContinuity * 100)}% continuity`)
    }
    
    // Lighting continuity
    if (fromShot.setting.timeOfDay === toShot.setting.timeOfDay) {
      specs.push('Preserve lighting consistency')
    } else {
      specs.push('Gradual lighting adjustment for time change')
    }
    
    // Motion continuity
    const motionSpec = this.generateMotionContinuity(fromShot, toShot, transitionType)
    if (motionSpec) {
      specs.push(motionSpec)
    }
    
    // Audio continuity
    const audioSpec = this.generateAudioContinuity(fromShot, toShot, transitionType)
    if (audioSpec) {
      specs.push(audioSpec)
    }
    
    return specs.join('. ')
  }

  /**
   * Generates motion continuity specifications
   */
  private static generateMotionContinuity(
    fromShot: ShotSpecification,
    toShot: ShotSpecification,
    transitionType: TransitionType
  ): string | null {
    // Analyze character actions for motion continuity
    const fromActions = fromShot.characters.map(c => c.action)
    const toActions = toShot.characters.map(c => c.action)
    
    const hasMovement = [...fromActions, ...toActions].some(action => 
      action.includes('walking') || action.includes('running') || action.includes('moving')
    )
    
    if (!hasMovement) return null
    
    switch (transitionType) {
      case 'pan':
        return 'Follow character movement with smooth camera pan'
      case 'zoom':
        return 'Maintain movement direction during zoom transition'
      case 'cut':
        return 'Match action timing across cut'
      default:
        return 'Preserve movement flow through transition'
    }
  }

  /**
   * Generates audio continuity specifications
   */
  private static generateAudioContinuity(
    fromShot: ShotSpecification,
    toShot: ShotSpecification,
    transitionType: TransitionType
  ): string | null {
    // Check for dialogue continuity
    const fromHasDialogue = fromShot.characters.some(c => c.action.includes('speaking'))
    const toHasDialogue = toShot.characters.some(c => c.action.includes('speaking'))
    
    if (fromHasDialogue || toHasDialogue) {
      switch (transitionType) {
        case 'cut':
          return 'Maintain dialogue audio levels across cut'
        case 'fade':
          return 'Cross-fade dialogue audio smoothly'
        case 'dissolve':
          return 'Blend dialogue audio during dissolve'
        default:
          return 'Preserve dialogue clarity through transition'
      }
    }
    
    return null
  }

  /**
   * Validates transition quality and provides quality score
   */
  static validateTransitionQuality(
    transition: TransitionSpecification,
    fromShot: ShotSpecification,
    toShot: ShotSpecification
  ): {
    qualityScore: number,
    issues: string[],
    recommendations: string[]
  } {
    const issues: string[] = []
    const recommendations: string[] = []
    let qualityScore = 100
    
    // Validate transition type appropriateness
    const typeValidation = this.validateTransitionType(transition.transitionType, fromShot, toShot)
    qualityScore -= typeValidation.penalty
    issues.push(...typeValidation.issues)
    recommendations.push(...typeValidation.recommendations)
    
    // Validate duration appropriateness
    const durationValidation = this.validateTransitionDuration(transition.duration, transition.transitionType)
    qualityScore -= durationValidation.penalty
    issues.push(...durationValidation.issues)
    recommendations.push(...durationValidation.recommendations)
    
    // Validate continuity preservation
    const continuityValidation = this.validateContinuity(fromShot, toShot, transition.transitionType)
    qualityScore -= continuityValidation.penalty
    issues.push(...continuityValidation.issues)
    recommendations.push(...continuityValidation.recommendations)
    
    // Validate visual coherence
    const coherenceValidation = this.validateVisualCoherence(fromShot, toShot, transition.transitionType)
    qualityScore -= coherenceValidation.penalty
    issues.push(...coherenceValidation.issues)
    recommendations.push(...coherenceValidation.recommendations)
    
    return {
      qualityScore: Math.max(0, qualityScore),
      issues,
      recommendations
    }
  }

  /**
   * Validates transition type appropriateness
   */
  private static validateTransitionType(
    transitionType: TransitionType,
    fromShot: ShotSpecification,
    toShot: ShotSpecification
  ): { penalty: number, issues: string[], recommendations: string[] } {
    const issues: string[] = []
    const recommendations: string[] = []
    let penalty = 0
    
    // Check for inappropriate cuts
    if (transitionType === 'cut') {
      if (fromShot.setting.location !== toShot.setting.location) {
        penalty += 20
        issues.push('Cut transition used for location change')
        recommendations.push('Consider using dissolve for location changes')
      }
      
      if (fromShot.setting.timeOfDay !== toShot.setting.timeOfDay) {
        penalty += 15
        issues.push('Cut transition used for time change')
        recommendations.push('Consider using fade for time changes')
      }
    }
    
    // Check for inappropriate fades
    if (transitionType === 'fade') {
      const scaleChange = this.analyzeScaleChange(fromShot.shotType, toShot.shotType)
      if (scaleChange === 'major') {
        penalty += 10
        issues.push('Fade transition used for major scale change')
        recommendations.push('Consider using zoom for major scale changes')
      }
    }
    
    // Check for inappropriate zooms
    if (transitionType === 'zoom') {
      if (fromShot.setting.location !== toShot.setting.location) {
        penalty += 25
        issues.push('Zoom transition used across different locations')
        recommendations.push('Zoom transitions should be used within the same location')
      }
    }
    
    return { penalty, issues, recommendations }
  }

  /**
   * Validates transition duration appropriateness
   */
  private static validateTransitionDuration(
    duration: number,
    transitionType: TransitionType
  ): { penalty: number, issues: string[], recommendations: string[] } {
    const issues: string[] = []
    const recommendations: string[] = []
    let penalty = 0
    
    const optimalDurations: Record<TransitionType, { min: number, max: number, optimal: number }> = {
      'cut': { min: 0, max: 0, optimal: 0 },
      'fade': { min: 0.5, max: 2.0, optimal: 1.0 },
      'dissolve': { min: 1.0, max: 3.0, optimal: 1.5 },
      'wipe': { min: 0.5, max: 1.5, optimal: 0.8 },
      'zoom': { min: 0.8, max: 2.0, optimal: 1.2 },
      'pan': { min: 1.0, max: 3.0, optimal: 2.0 }
    }
    
    const range = optimalDurations[transitionType]
    
    if (duration < range.min) {
      penalty += 15
      issues.push(`Transition duration ${duration}s is too short for ${transitionType}`)
      recommendations.push(`Increase duration to at least ${range.min}s`)
    }
    
    if (duration > range.max) {
      penalty += 10
      issues.push(`Transition duration ${duration}s is too long for ${transitionType}`)
      recommendations.push(`Reduce duration to maximum ${range.max}s`)
    }
    
    return { penalty, issues, recommendations }
  }

  /**
   * Validates continuity preservation
   */
  private static validateContinuity(
    fromShot: ShotSpecification,
    toShot: ShotSpecification,
    transitionType: TransitionType
  ): { penalty: number, issues: string[], recommendations: string[] } {
    const issues: string[] = []
    const recommendations: string[] = []
    let penalty = 0
    
    // Character continuity validation
    const characterContinuity = this.calculateCharacterContinuity(fromShot.characters, toShot.characters)
    if (characterContinuity > 0.5 && transitionType === 'cut') {
      // Good continuity with appropriate transition
    } else if (characterContinuity < 0.3 && transitionType !== 'dissolve') {
      penalty += 15
      issues.push('Poor character continuity without appropriate transition')
      recommendations.push('Use dissolve transition for major character changes')
    }
    
    // Lighting continuity validation
    if (fromShot.setting.lighting !== toShot.setting.lighting && transitionType === 'cut') {
      penalty += 10
      issues.push('Lighting change with abrupt cut transition')
      recommendations.push('Use fade or dissolve for lighting changes')
    }
    
    // Emotional continuity validation
    const emotionalShift = this.analyzeEmotionalShift(fromShot, toShot)
    if (emotionalShift === 'dramatic' && transitionType === 'cut') {
      penalty += 20
      issues.push('Dramatic emotional shift with abrupt cut')
      recommendations.push('Use fade transition for dramatic emotional changes')
    }
    
    return { penalty, issues, recommendations }
  }

  /**
   * Validates visual coherence
   */
  private static validateVisualCoherence(
    fromShot: ShotSpecification,
    toShot: ShotSpecification,
    transitionType: TransitionType
  ): { penalty: number, issues: string[], recommendations: string[] } {
    const issues: string[] = []
    const recommendations: string[] = []
    let penalty = 0
    
    // Color palette coherence
    if (fromShot.setting.atmosphere !== toShot.setting.atmosphere && transitionType === 'cut') {
      penalty += 10
      issues.push('Atmosphere change without smooth transition')
      recommendations.push('Use dissolve to blend different atmospheres')
    }
    
    // Composition coherence
    const scaleChange = this.analyzeScaleChange(fromShot.shotType, toShot.shotType)
    const angleChange = this.analyzeAngleChange(fromShot.cameraAngle, toShot.cameraAngle)
    
    if (scaleChange === 'major' && angleChange === 'major' && transitionType === 'cut') {
      penalty += 25
      issues.push('Major composition change with abrupt cut')
      recommendations.push('Use zoom or pan transition for major composition changes')
    }
    
    return { penalty, issues, recommendations }
  }

  /**
   * Determines if transition should be added between shots
   */
  private static shouldAddTransition(
    fromShot: ShotSpecification,
    toShot: ShotSpecification
  ): boolean {
    // Always add transitions between different shot types
    if (fromShot.shotType !== toShot.shotType) return true
    
    // Add transitions for different camera angles
    if (fromShot.cameraAngle !== toShot.cameraAngle) return true
    
    // Add transitions for emotional beats
    if (fromShot.emotionalBeat !== toShot.emotionalBeat) return true
    
    return false
  }

  /**
   * Optimizes all transitions for quality and smoothness
   */
  private static optimizeTransitions(
    transitions: TransitionSpecification[],
    shots: ShotSpecification[]
  ): TransitionSpecification[] {
    const optimizedTransitions: TransitionSpecification[] = []
    
    for (const transition of transitions) {
      const fromShot = shots.find(s => s.shotId === transition.fromShotId)
      const toShot = shots.find(s => s.shotId === transition.toShotId)
      
      if (!fromShot || !toShot) {
        optimizedTransitions.push(transition)
        continue
      }
      
      // Validate and potentially improve the transition
      const validation = this.validateTransitionQuality(transition, fromShot, toShot)
      
      if (validation.qualityScore < 70) {
        // Try to improve the transition
        const improvedTransition = this.improveTransition(transition, fromShot, toShot, validation)
        optimizedTransitions.push(improvedTransition)
      } else {
        optimizedTransitions.push(transition)
      }
    }
    
    return optimizedTransitions
  }

  /**
   * Improves a transition based on quality validation results
   */
  private static improveTransition(
    transition: TransitionSpecification,
    fromShot: ShotSpecification,
    toShot: ShotSpecification,
    validation: { qualityScore: number, issues: string[], recommendations: string[] }
  ): TransitionSpecification {
    let improvedType = transition.transitionType
    let improvedDuration = transition.duration
    
    // Apply improvements based on recommendations
    for (const recommendation of validation.recommendations) {
      if (recommendation.includes('dissolve')) {
        improvedType = 'dissolve'
        improvedDuration = 1.5
      } else if (recommendation.includes('fade')) {
        improvedType = 'fade'
        improvedDuration = 1.0
      } else if (recommendation.includes('zoom')) {
        improvedType = 'zoom'
        improvedDuration = 1.2
      } else if (recommendation.includes('pan')) {
        improvedType = 'pan'
        improvedDuration = 2.0
      }
      
      // Adjust duration based on recommendations
      if (recommendation.includes('Increase duration')) {
        const match = recommendation.match(/(\d+\.?\d*)s/)
        if (match) {
          improvedDuration = Math.max(improvedDuration, parseFloat(match[1]))
        }
      } else if (recommendation.includes('Reduce duration')) {
        const match = recommendation.match(/(\d+\.?\d*)s/)
        if (match) {
          improvedDuration = Math.min(improvedDuration, parseFloat(match[1]))
        }
      }
    }
    
    return {
      ...transition,
      transitionType: improvedType,
      duration: improvedDuration,
      description: this.generateTransitionDescription(improvedType, fromShot, toShot)
    }
  }

  /**
   * Analyzes transition flow across multiple shots for global optimization
   */
  static analyzeTransitionFlow(
    storyboard: Storyboard
  ): {
    overallQuality: number,
    flowIssues: string[],
    optimizationSuggestions: string[]
  } {
    const flowIssues: string[] = []
    const optimizationSuggestions: string[] = []
    let totalQuality = 0
    let transitionCount = 0
    
    // Analyze each transition in context
    for (let i = 0; i < storyboard.transitionSpecs.length; i++) {
      const transition = storyboard.transitionSpecs[i]
      const fromShot = storyboard.shots.find(s => s.shotId === transition.fromShotId)
      const toShot = storyboard.shots.find(s => s.shotId === transition.toShotId)
      
      if (!fromShot || !toShot) continue
      
      const validation = this.validateTransitionQuality(transition, fromShot, toShot)
      totalQuality += validation.qualityScore
      transitionCount++
      
      // Check for flow patterns
      if (i > 0) {
        const prevTransition = storyboard.transitionSpecs[i - 1]
        const flowPattern = this.analyzeTransitionPattern(prevTransition, transition)
        
        if (flowPattern.hasIssues) {
          flowIssues.push(...flowPattern.issues)
          optimizationSuggestions.push(...flowPattern.suggestions)
        }
      }
    }
    
    // Analyze overall pacing
    const pacingAnalysis = this.analyzePacing(storyboard)
    flowIssues.push(...pacingAnalysis.issues)
    optimizationSuggestions.push(...pacingAnalysis.suggestions)
    
    return {
      overallQuality: transitionCount > 0 ? totalQuality / transitionCount : 100,
      flowIssues,
      optimizationSuggestions
    }
  }

  /**
   * Analyzes patterns between consecutive transitions
   */
  private static analyzeTransitionPattern(
    prevTransition: TransitionSpecification,
    currentTransition: TransitionSpecification
  ): { hasIssues: boolean, issues: string[], suggestions: string[] } {
    const issues: string[] = []
    const suggestions: string[] = []
    
    // Check for repetitive transition types
    if (prevTransition.transitionType === currentTransition.transitionType && 
        prevTransition.transitionType !== 'cut') {
      issues.push(`Repetitive ${prevTransition.transitionType} transitions`)
      suggestions.push('Vary transition types for better visual flow')
    }
    
    // Check for jarring duration changes
    const durationDiff = Math.abs(prevTransition.duration - currentTransition.duration)
    if (durationDiff > 1.5) {
      issues.push('Jarring transition duration changes')
      suggestions.push('Smooth out transition duration variations')
    }
    
    // Check for conflicting transition styles
    const fastTransitions = ['cut', 'wipe']
    const slowTransitions = ['fade', 'dissolve', 'pan']
    
    const prevIsFast = fastTransitions.includes(prevTransition.transitionType)
    const currentIsFast = fastTransitions.includes(currentTransition.transitionType)
    
    if (prevIsFast !== currentIsFast) {
      issues.push('Inconsistent transition pacing')
      suggestions.push('Maintain consistent transition pacing within scenes')
    }
    
    return {
      hasIssues: issues.length > 0,
      issues,
      suggestions
    }
  }

  /**
   * Analyzes overall pacing of transitions
   */
  private static analyzePacing(
    storyboard: Storyboard
  ): { issues: string[], suggestions: string[] } {
    const issues: string[] = []
    const suggestions: string[] = []
    
    // Calculate average transition duration
    const totalDuration = storyboard.transitionSpecs.reduce((sum, t) => sum + t.duration, 0)
    const avgDuration = totalDuration / storyboard.transitionSpecs.length
    
    // Check for pacing issues
    if (avgDuration > 2.0) {
      issues.push('Overall transition pacing is too slow')
      suggestions.push('Reduce transition durations for better pacing')
    } else if (avgDuration < 0.5) {
      issues.push('Overall transition pacing is too fast')
      suggestions.push('Increase transition durations for smoother flow')
    }
    
    // Check for transition density
    const shotDuration = storyboard.totalDuration
    const transitionDensity = storyboard.transitionSpecs.length / (shotDuration / 60) // transitions per minute
    
    if (transitionDensity > 20) {
      issues.push('Too many transitions - may feel choppy')
      suggestions.push('Reduce transition frequency or use more cuts')
    } else if (transitionDensity < 5) {
      issues.push('Too few transitions - may feel static')
      suggestions.push('Add more varied transitions for visual interest')
    }
    
    return { issues, suggestions }
  }
}