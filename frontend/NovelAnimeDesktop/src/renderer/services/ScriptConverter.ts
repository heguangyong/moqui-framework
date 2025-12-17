import type { 
  Episode, 
  Scene, 
  Screenplay, 
  ScreenplayScene, 
  DialogueBlock, 
  SceneDescription, 
  Character, 
  LockedProfile, 
  ValidationResult,
  ValidationError
} from '../types/core'

/**
 * Script Converter Service
 * Transforms narrative prose into screenplay format with detailed scene descriptions
 */
export class ScriptConverter {
  private static readonly DIALOGUE_PATTERNS = [
    /"([^"]+)"/g,                    // Standard quotes
    /'([^']+)'/g,                    // Single quotes
    /「([^」]+)」/g,                  // Japanese quotes
    /『([^』]+)』/g,                  // Japanese double quotes
    /said\s+([^.!?]+)[.!?]/gi,       // "said" patterns
    /replied\s+([^.!?]+)[.!?]/gi,    // "replied" patterns
    /asked\s+([^.!?]+)[.!?]/gi       // "asked" patterns
  ]

  private static readonly EMOTION_KEYWORDS = {
    anger: ['angry', 'angrily', 'furious', 'furiously', 'rage', 'mad', 'irritated', 'annoyed', 'enraged', 'livid', 'seething', 'incensed', 'outraged', 'irate'],
    sadness: ['sad', 'sadly', 'crying', 'tears', 'sorrow', 'grief', 'melancholy', 'weeping', 'sobbing', 'mourning', 'dejected', 'despondent', 'heartbroken', 'miserable'],
    joy: ['happy', 'happily', 'laughing', 'smile', 'joy', 'cheerful', 'cheerfully', 'delighted', 'ecstatic', 'elated', 'jubilant', 'euphoric', 'overjoyed', 'gleeful'],
    fear: ['afraid', 'scared', 'terrified', 'anxious', 'worried', 'nervous', 'nervously', 'frightened', 'panicked', 'alarmed', 'apprehensive', 'petrified', 'trembling'],
    surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'startled', 'stunned', 'bewildered', 'flabbergasted', 'dumbfounded', 'taken aback'],
    disgust: ['disgusted', 'revolted', 'repulsed', 'sickened', 'nauseated', 'appalled', 'horrified', 'repelled'],
    love: ['love', 'lovingly', 'affection', 'tender', 'tenderly', 'caring', 'romantic', 'passionate', 'adoring', 'devoted', 'infatuated', 'enamored'],
    contempt: ['contempt', 'scorn', 'disdain', 'sneering', 'mocking', 'condescending', 'dismissive'],
    pride: ['proud', 'proudly', 'triumphant', 'victorious', 'accomplished', 'satisfied', 'confident'],
    shame: ['ashamed', 'embarrassed', 'humiliated', 'mortified', 'guilty', 'remorseful', 'regretful'],
    excitement: ['excited', 'thrilled', 'exhilarated', 'energetic', 'enthusiastic', 'animated', 'vibrant'],
    calm: ['calm', 'peaceful', 'serene', 'tranquil', 'composed', 'relaxed', 'centered']
  }

  private static readonly ACTION_VERBS = [
    'walked', 'ran', 'jumped', 'sat', 'stood', 'looked', 'turned', 'moved',
    'grabbed', 'held', 'touched', 'pushed', 'pulled', 'opened', 'closed',
    'entered', 'left', 'approached', 'retreated', 'climbed', 'descended'
  ]

  /**
   * Converts an episode to screenplay format
   */
  static convertToScript(episode: Episode, characters: Character[], lockedProfiles: LockedProfile[]): Screenplay {
    const screenplay: Screenplay = {
      id: `screenplay_${episode.id}`,
      episodeId: episode.id,
      content: '',
      format: 'custom',
      scenes: [],
      dialogueBlocks: [],
      sceneDescriptions: []
    }

    // Process each scene in the episode
    for (const scene of episode.scenes) {
      const screenplayScene = this.convertSceneToScreenplay(scene, characters, lockedProfiles)
      screenplay.scenes.push(screenplayScene)

      // Extract dialogue blocks from the scene
      const dialogueBlocks = this.extractDialogue(scene.content, characters)
      screenplay.dialogueBlocks.push(...dialogueBlocks)

      // Generate scene descriptions
      const sceneDescriptions = this.generateSceneDescriptions(scene, characters)
      screenplay.sceneDescriptions.push(...sceneDescriptions)
    }

    // Generate the complete screenplay content
    screenplay.content = this.formatScreenplayContent(screenplay.scenes, screenplay.dialogueBlocks, screenplay.sceneDescriptions)

    return screenplay
  }

  /**
   * Converts a single scene to screenplay format
   */
  private static convertSceneToScreenplay(
    scene: Scene, 
    characters: Character[], 
    lockedProfiles: LockedProfile[]
  ): ScreenplayScene {
    const sceneCharacters = characters.filter(char => scene.characters.includes(char.id))
    
    return {
      id: `screenplay_scene_${scene.id}`,
      sceneNumber: scene.sceneNumber,
      heading: this.generateSceneHeading(scene),
      content: this.formatSceneContent(scene, sceneCharacters),
      characters: scene.characters,
      setting: scene.setting
    }
  }

  /**
   * Generates a properly formatted scene heading
   */
  private static generateSceneHeading(scene: Scene): string {
    const location = scene.setting.toUpperCase()
    const timeOfDay = this.extractTimeOfDay(scene.content)
    
    return `INT./EXT. ${location} - ${timeOfDay}`
  }

  /**
   * Extracts time of day from scene content
   */
  private static extractTimeOfDay(content: string): string {
    const timePatterns = {
      'DAWN': ['dawn', 'sunrise', 'early morning', 'first light'],
      'MORNING': ['morning', 'am', 'breakfast'],
      'NOON': ['noon', 'midday', 'lunch'],
      'AFTERNOON': ['afternoon', 'pm', 'evening'],
      'NIGHT': ['night', 'midnight', 'dark', 'evening']
    }

    const lowerContent = content.toLowerCase()
    
    for (const [time, patterns] of Object.entries(timePatterns)) {
      if (patterns.some(pattern => lowerContent.includes(pattern))) {
        return time
      }
    }
    
    return 'DAY'
  }

  /**
   * Formats scene content for screenplay
   */
  private static formatSceneContent(scene: Scene, characters: Character[]): string {
    let formattedContent = scene.content
    
    // Replace narrative descriptions with action lines
    formattedContent = this.convertNarrativeToAction(formattedContent)
    
    // Format dialogue properly
    formattedContent = this.formatDialogueForScreenplay(formattedContent, characters)
    
    return formattedContent
  }

  /**
   * Converts narrative descriptions to screenplay action lines
   */
  private static convertNarrativeToAction(content: string): string {
    // Split content into paragraphs
    const paragraphs = content.split('\n\n')
    const actionLines: string[] = []

    for (const paragraph of paragraphs) {
      if (this.isDialogueParagraph(paragraph)) {
        actionLines.push(paragraph) // Keep dialogue as-is for now
      } else {
        // Convert narrative to action description
        const actionLine = this.narrativeToActionLine(paragraph)
        if (actionLine.trim()) {
          // Convert to present tense before making uppercase
          const presentTense = this.convertToPresentTense(actionLine)
          actionLines.push(presentTense.toUpperCase())
        }
      }
    }

    return actionLines.join('\n\n')
  }

  /**
   * Checks if a paragraph contains dialogue
   */
  private static isDialogueParagraph(paragraph: string): boolean {
    return this.DIALOGUE_PATTERNS.some(pattern => {
      pattern.lastIndex = 0 // Reset regex state
      return pattern.test(paragraph)
    })
  }

  /**
   * Converts narrative text to action line format
   */
  private static narrativeToActionLine(narrative: string): string {
    // Remove excessive adjectives and focus on actions
    let actionLine = narrative
    
    // Extract key actions and movements
    const actions = this.extractActions(narrative)
    if (actions.length > 0) {
      actionLine = actions.join('. ') + '.'
    }
    
    // Ensure present tense
    actionLine = this.convertToPresentTense(actionLine)
    
    return actionLine
  }

  /**
   * Extracts action verbs and movements from narrative text
   */
  private static extractActions(text: string): string[] {
    const actions: string[] = []
    const sentences = text.split(/[.!?]+/)
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim()
      if (!trimmed) continue
      
      // Look for action verbs
      const hasAction = this.ACTION_VERBS.some(verb => 
        trimmed.toLowerCase().includes(verb)
      )
      
      if (hasAction) {
        actions.push(trimmed)
      }
    }
    
    return actions
  }

  /**
   * Converts past tense verbs to present tense for screenplay format
   */
  private static convertToPresentTense(text: string): string {
    const pastToPresent: Record<string, string> = {
      'walked': 'walks',
      'ran': 'runs',
      'jumped': 'jumps',
      'sat': 'sits',
      'stood': 'stands',
      'looked': 'looks',
      'turned': 'turns',
      'moved': 'moves',
      'grabbed': 'grabs',
      'held': 'holds',
      'opened': 'opens',
      'closed': 'closes',
      'entered': 'enters',
      'left': 'leaves',
      'said': 'says',
      'replied': 'replies',
      'asked': 'asks'
    }
    
    let presentText = text
    for (const [past, present] of Object.entries(pastToPresent)) {
      const regex = new RegExp(`\\b${past}\\b`, 'gi')
      presentText = presentText.replace(regex, present)
    }
    
    return presentText
  }

  /**
   * Formats dialogue for screenplay format
   */
  private static formatDialogueForScreenplay(content: string, characters: Character[]): string {
    let formattedContent = content
    
    // Process each dialogue pattern
    for (const pattern of this.DIALOGUE_PATTERNS) {
      pattern.lastIndex = 0 // Reset regex state
      formattedContent = formattedContent.replace(pattern, (match, dialogue) => {
        const speaker = this.identifyDialogueSpeaker(match, characters)
        const emotion = this.extractEmotionalDirection(match)
        
        let formattedDialogue = `${speaker.toUpperCase()}\n`
        if (emotion) {
          formattedDialogue += `(${emotion})\n`
        }
        formattedDialogue += dialogue
        
        return formattedDialogue
      })
    }
    
    return formattedContent
  }

  /**
   * Identifies the speaker of a dialogue line
   */
  private static identifyDialogueSpeaker(dialogueContext: string, characters: Character[]): string {
    // Look for character names in the surrounding context
    // Prioritize names that appear BEFORE the quote (indicating the speaker)
    let bestMatch = ''
    let bestDistance = Infinity
    let bestIsBeforeQuote = false
    
    const quoteIndex = dialogueContext.search(/["'「『]/)
    
    for (const character of characters) {
      const namePattern = new RegExp(`\\b${character.name}\\b`, 'gi')
      let match
      
      while ((match = namePattern.exec(dialogueContext)) !== null) {
        if (quoteIndex !== -1) {
          const distance = Math.abs(match.index - quoteIndex)
          const isBeforeQuote = match.index < quoteIndex
          
          // Prioritize names that appear before the quote
          // If both are before/after quote, choose the closer one
          if (isBeforeQuote && !bestIsBeforeQuote) {
            bestDistance = distance
            bestMatch = character.name
            bestIsBeforeQuote = true
          } else if (isBeforeQuote === bestIsBeforeQuote && distance < bestDistance) {
            bestDistance = distance
            bestMatch = character.name
          }
        } else {
          return character.name // If no quote found, return first match
        }
      }
    }
    
    if (bestMatch) {
      return bestMatch
    }
    
    // Default to first character if no specific speaker found
    return characters.length > 0 ? characters[0].name : 'CHARACTER'
  }

  /**
   * Extracts emotional direction from dialogue context
   */
  private static extractEmotionalDirection(context: string): string | null {
    const lowerContext = context.toLowerCase()
    const quoteIndex = context.search(/["'「『]/)
    
    // If we can find the quote, look for emotions both before and after it
    if (quoteIndex !== -1) {
      const beforeQuote = lowerContext.substring(0, quoteIndex)
      const afterQuote = lowerContext.substring(quoteIndex)
      
      // First check before the quote (more reliable)
      for (const [emotion, keywords] of Object.entries(this.EMOTION_KEYWORDS)) {
        if (keywords.some(keyword => beforeQuote.includes(keyword))) {
          return emotion
        }
      }
      
      // Then check after the quote
      for (const [emotion, keywords] of Object.entries(this.EMOTION_KEYWORDS)) {
        if (keywords.some(keyword => afterQuote.includes(keyword))) {
          return emotion
        }
      }
    } else {
      // Fallback to searching the entire context
      for (const [emotion, keywords] of Object.entries(this.EMOTION_KEYWORDS)) {
        if (keywords.some(keyword => lowerContext.includes(keyword))) {
          return emotion
        }
      }
    }
    
    return null
  }

  /**
   * Extracts dialogue blocks from scene content
   */
  static extractDialogue(content: string, characters: Character[]): DialogueBlock[] {
    const dialogueBlocks: DialogueBlock[] = []
    let blockId = 1
    
    // Find all quotes in order of appearance
    const quotes: Array<{match: RegExpMatchArray, pattern: RegExp, dialogue: string, start: number, end: number}> = []
    
    const quotePatterns = [
      /"([^"]+)"/g,                    // Standard quotes
      /'([^']+)'/g,                    // Single quotes
      /「([^」]+)」/g,                  // Japanese quotes
      /『([^』]+)』/g                   // Japanese double quotes
    ]
    
    for (const pattern of quotePatterns) {
      pattern.lastIndex = 0 // Reset regex state
      let match
      
      while ((match = pattern.exec(content)) !== null) {
        const start = match.index
        const end = match.index + match[0].length
        
        quotes.push({
          match,
          pattern,
          dialogue: match[1],
          start,
          end
        })
      }
    }
    
    // Sort quotes by position in text
    quotes.sort((a, b) => a.start - b.start)
    
    // Remove overlapping quotes (keep the first one)
    const processedQuotes = []
    for (const quote of quotes) {
      const overlaps = processedQuotes.some(processed => 
        (quote.start >= processed.start && quote.start < processed.end) || 
        (quote.end > processed.start && quote.end <= processed.end)
      )
      
      if (!overlaps) {
        processedQuotes.push(quote)
      }
    }
    
    // Process quotes in order
    for (const quote of processedQuotes) {
      // Use a smaller context window for speaker identification
      const speakerContextStart = Math.max(0, quote.start - 30)
      const speakerContextEnd = Math.min(content.length, quote.end + 10)
      const speakerContext = content.substring(speakerContextStart, speakerContextEnd)
      
      // Use a larger context window for emotion extraction
      const emotionContextStart = Math.max(0, quote.start - 50)
      const emotionContextEnd = Math.min(content.length, quote.end + 20)
      const emotionContext = content.substring(emotionContextStart, emotionContextEnd)
      
      const speaker = this.identifyDialogueSpeaker(speakerContext, characters)
      const emotion = this.extractEmotionalDirection(emotionContext)
      
      const character = characters.find(c => c.name.toLowerCase() === speaker.toLowerCase())
      
      dialogueBlocks.push({
        id: `dialogue_${blockId++}`,
        characterId: character?.id || 'unknown',
        text: quote.dialogue,
        emotion: emotion || undefined,
        direction: this.extractDialogueDirection(emotionContext)
      })
    }
    
    return dialogueBlocks
  }

  /**
   * Extracts dialogue direction from context
   */
  private static extractDialogueDirection(context: string): string | undefined {
    const directionPatterns = [
      /\((.*?)\)/g,  // Parenthetical directions
      /\[(.*?)\]/g   // Bracketed directions
    ]
    
    for (const pattern of directionPatterns) {
      const match = pattern.exec(context)
      if (match) {
        return match[1]
      }
    }
    
    return undefined
  }

  /**
   * Generates detailed scene descriptions
   */
  static generateSceneDescriptions(scene: Scene, characters: Character[]): SceneDescription[] {
    const descriptions: SceneDescription[] = []
    
    // Generate visual description
    const visualDescription = this.generateVisualDescription(scene, characters)
    
    // Generate action description
    const actionDescription = this.generateActionDescription(scene.content)
    
    // Extract mood
    const mood = this.extractMood(scene.content)
    
    descriptions.push({
      id: `scene_desc_${scene.id}`,
      sceneId: scene.id,
      visualDescription,
      actionDescription,
      mood
    })
    
    return descriptions
  }

  /**
   * Generates visual description for the scene
   */
  private static generateVisualDescription(scene: Scene, characters: Character[]): string {
    const elements: string[] = []
    
    // Add setting description
    elements.push(`The scene takes place in ${scene.setting}.`)
    
    // Add character descriptions
    const sceneCharacters = characters.filter(char => scene.characters.includes(char.id))
    if (sceneCharacters.length > 0) {
      const characterDescs = sceneCharacters.map(char => 
        `${char.name} (${char.attributes.appearance})`
      ).join(', ')
      elements.push(`Present characters: ${characterDescs}.`)
    }
    
    // Add mood-based visual elements - prioritize scene.mood if available
    const mood = scene.mood || this.extractMood(scene.content)
    if (mood) {
      elements.push(this.getMoodVisualElements(mood))
    }
    
    return elements.join(' ')
  }

  /**
   * Generates action description from scene content
   */
  private static generateActionDescription(content: string): string {
    const actions = this.extractActions(content)
    
    if (actions.length === 0) {
      return 'Characters engage in dialogue and interaction.'
    }
    
    // Convert to present tense and format
    const presentActions = actions.map(action => this.convertToPresentTense(action))
    return presentActions.join('. ') + '.'
  }

  /**
   * Extracts mood from scene content
   */
  private static extractMood(content: string): string {
    const lowerContent = content.toLowerCase()
    
    // Check for mood indicators
    const moodPatterns = {
      'tense': ['tension', 'nervous', 'anxious', 'worried', 'stress'],
      'romantic': ['love', 'romantic', 'tender', 'intimate', 'passion'],
      'dramatic': ['dramatic', 'intense', 'climax', 'confrontation'],
      'peaceful': ['calm', 'peaceful', 'serene', 'quiet', 'tranquil'],
      'mysterious': ['mystery', 'mysterious', 'unknown', 'secret', 'hidden'],
      'action': ['fight', 'battle', 'chase', 'run', 'escape', 'danger'],
      'friendly': ['friendly', 'cheerful', 'warm', 'welcoming', 'pleasant']
    }
    
    for (const [mood, keywords] of Object.entries(moodPatterns)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        return mood
      }
    }
    
    return 'neutral'
  }

  /**
   * Gets visual elements based on mood
   */
  private static getMoodVisualElements(mood: string): string {
    const moodVisuals: Record<string, string> = {
      'tense': 'The lighting is harsh and shadows are prominent, creating an atmosphere of unease.',
      'romantic': 'Soft, warm lighting bathes the scene with gentle shadows and intimate framing.',
      'dramatic': 'Dynamic lighting and camera angles emphasize the emotional intensity.',
      'peaceful': 'Natural, even lighting creates a calm and harmonious visual atmosphere.',
      'mysterious': 'Low-key lighting with deep shadows creates an air of mystery and intrigue.',
      'action': 'High-contrast lighting and dynamic camera movement convey energy and excitement.',
      'friendly': 'Warm, inviting lighting creates a comfortable and welcoming atmosphere.',
      'neutral': 'Balanced lighting and standard framing maintain visual clarity.'
    }
    
    return moodVisuals[mood] || moodVisuals['neutral']
  }

  /**
   * Formats the complete screenplay content
   */
  private static formatScreenplayContent(
    scenes: ScreenplayScene[], 
    dialogueBlocks: DialogueBlock[], 
    sceneDescriptions: SceneDescription[]
  ): string {
    const content: string[] = []
    
    for (const scene of scenes) {
      // Add scene heading
      content.push(scene.heading)
      content.push('')
      
      // Add scene description - extract original scene ID from screenplay scene ID
      const originalSceneId = scene.id.replace('screenplay_scene_', '')
      const sceneDesc = sceneDescriptions.find(desc => desc.sceneId === originalSceneId)
      if (sceneDesc) {
        content.push(sceneDesc.visualDescription)
        content.push('')
        content.push(sceneDesc.actionDescription)
        content.push('')
      }
      
      // Add formatted scene content
      content.push(scene.content)
      content.push('')
      content.push('---')
      content.push('')
    }
    
    return content.join('\n')
  }

  /**
   * Validates character voice consistency across dialogue blocks
   */
  static validateCharacterVoiceConsistency(
    dialogueBlocks: DialogueBlock[], 
    characters: Character[], 
    lockedProfiles: LockedProfile[]
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []
    
    // Group dialogue by character
    const characterDialogue = new Map<string, DialogueBlock[]>()
    
    for (const block of dialogueBlocks) {
      if (!characterDialogue.has(block.characterId)) {
        characterDialogue.set(block.characterId, [])
      }
      characterDialogue.get(block.characterId)!.push(block)
    }
    
    // Validate consistency for each character
    for (const [characterId, blocks] of characterDialogue) {
      const character = characters.find(c => c.id === characterId)
      const profile = lockedProfiles.find(p => p.characterId === characterId)
      
      if (!character || !profile) {
        warnings.push({
          code: 'MISSING_CHARACTER_PROFILE',
          message: `Character profile not found for character ID: ${characterId}`,
          field: `character.${characterId}`,
          severity: 'warning'
        })
        continue
      }
      
      // Check for voice consistency patterns
      const voiceErrors = this.validateCharacterVoicePatterns(blocks, character, profile)
      errors.push(...voiceErrors.filter(e => e.severity === 'error'))
      warnings.push(...voiceErrors.filter(e => e.severity === 'warning'))
      
      // Check for dialogue pattern consistency
      const patternErrors = this.validateDialoguePatterns(blocks, character, profile)
      errors.push(...patternErrors.filter(e => e.severity === 'error'))
      warnings.push(...patternErrors.filter(e => e.severity === 'warning'))
      
      // Check for speaking style consistency
      const styleErrors = this.validateSpeakingStyle(blocks, character, profile)
      errors.push(...styleErrors.filter(e => e.severity === 'error'))
      warnings.push(...styleErrors.filter(e => e.severity === 'warning'))
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validates voice patterns for a specific character
   */
  private static validateCharacterVoicePatterns(
    blocks: DialogueBlock[], 
    character: Character, 
    profile: LockedProfile
  ): ValidationError[] {
    const errors: ValidationError[] = []
    
    // Extract personality traits that affect speech
    const personality = profile.lockedAttributes.personality.toLowerCase()
    
    // Check for consistency violations
    for (const block of blocks) {
      // Check emotional consistency
      if (block.emotion) {
        const isConsistent = this.isEmotionConsistentWithPersonality(block.emotion, personality)
        if (!isConsistent) {
          errors.push({
            code: 'VOICE_EMOTION_INCONSISTENT',
            message: `Character ${character.name} shows emotion "${block.emotion}" inconsistent with personality "${personality}"`,
            field: `dialogue.${block.id}.emotion`,
            severity: 'error'
          })
        }
      }
      
      // Check dialogue length consistency (some characters are verbose, others terse)
      const expectedVerbosity = this.getExpectedVerbosity(personality)
      const actualVerbosity = this.calculateVerbosity(block.text)
      
      if (Math.abs(expectedVerbosity - actualVerbosity) > 0.5) {
        errors.push({
          code: 'VOICE_VERBOSITY_INCONSISTENT',
          message: `Character ${character.name} dialogue verbosity inconsistent with personality`,
          field: `dialogue.${block.id}.text`,
          severity: 'error'
        })
      }
    }
    
    return errors
  }

  /**
   * Checks if emotion is consistent with character personality
   */
  private static isEmotionConsistentWithPersonality(emotion: string, personality: string): boolean {
    const personalityEmotionMap: Record<string, string[]> = {
      'calm': ['joy', 'love'],
      'peaceful': ['joy', 'love'],
      'serene': ['joy', 'love'],
      'aggressive': ['anger', 'disgust'],
      'cheerful': ['joy', 'surprise', 'love'],
      'melancholy': ['sadness', 'fear'],
      'confident': ['joy', 'surprise'],
      'shy': ['fear', 'sadness'],
      'passionate': ['anger', 'love', 'joy'],
      'quiet': ['sadness', 'fear'],
      'terse': ['anger', 'disgust'],
      'reserved': ['fear', 'sadness']
    }
    
    for (const [trait, allowedEmotions] of Object.entries(personalityEmotionMap)) {
      if (personality.includes(trait)) {
        return allowedEmotions.includes(emotion)
      }
    }
    
    return true // Allow if no specific personality trait found
  }

  /**
   * Gets expected verbosity based on personality
   */
  private static getExpectedVerbosity(personality: string): number {
    if (personality.includes('verbose') || personality.includes('talkative')) return 1.0
    if (personality.includes('quiet') || personality.includes('terse') || personality.includes('reserved')) return 0.2
    if (personality.includes('intellectual') || personality.includes('scholarly')) return 0.8
    return 0.5 // Default moderate verbosity
  }

  /**
   * Calculates verbosity score for dialogue text
   */
  private static calculateVerbosity(text: string): number {
    const wordCount = text.split(/\s+/).length
    if (wordCount > 20) return 1.0
    if (wordCount > 10) return 0.7
    if (wordCount > 5) return 0.5
    if (wordCount > 2) return 0.3
    return 0.1
  }

  /**
   * Validates dialogue patterns for character consistency
   */
  private static validateDialoguePatterns(
    blocks: DialogueBlock[], 
    character: Character, 
    profile: LockedProfile
  ): ValidationError[] {
    const errors: ValidationError[] = []
    
    if (blocks.length < 2) return errors // Need at least 2 dialogue blocks to compare
    
    // Analyze dialogue patterns
    const patterns = this.analyzeDialoguePatterns(blocks)
    const expectedPatterns = this.getExpectedDialoguePatterns(profile)
    
    // Check sentence structure consistency
    const structureVariance = this.calculateStructureVariance(patterns.sentenceStructures)
    if (structureVariance > 0.7) {
      errors.push({
        code: 'DIALOGUE_STRUCTURE_INCONSISTENT',
        message: `Character ${character.name} shows inconsistent sentence structure patterns`,
        field: `character.${character.id}.dialogue_structure`,
        severity: 'warning'
      })
    }
    
    // Check vocabulary consistency
    const vocabularyShift = this.detectVocabularyShift(patterns.vocabularyLevels)
    if (vocabularyShift > 0.6) {
      errors.push({
        code: 'VOCABULARY_LEVEL_SHIFT',
        message: `Character ${character.name} shows significant vocabulary level changes`,
        field: `character.${character.id}.vocabulary`,
        severity: 'warning'
      })
    }
    
    // Check formality consistency
    const formalityShift = this.detectFormalityShift(patterns.formalityLevels)
    if (formalityShift > 0.5) {
      errors.push({
        code: 'FORMALITY_INCONSISTENT',
        message: `Character ${character.name} shows inconsistent formality levels`,
        field: `character.${character.id}.formality`,
        severity: 'warning'
      })
    }
    
    return errors
  }

  /**
   * Validates speaking style consistency
   */
  private static validateSpeakingStyle(
    blocks: DialogueBlock[], 
    character: Character, 
    profile: LockedProfile
  ): ValidationError[] {
    const errors: ValidationError[] = []
    
    if (blocks.length < 2) return errors
    
    // Analyze speaking style elements
    const styles = blocks.map(block => this.analyzeSpeakingStyle(block.text))
    
    // Check for consistent use of contractions
    const contractionUsage = styles.map(s => s.contractionRatio)
    const contractionVariance = this.calculateVariance(contractionUsage)
    if (contractionVariance > 0.3) {
      errors.push({
        code: 'CONTRACTION_USAGE_INCONSISTENT',
        message: `Character ${character.name} shows inconsistent contraction usage`,
        field: `character.${character.id}.contractions`,
        severity: 'warning'
      })
    }
    
    // Check for consistent question patterns
    const questionRatios = styles.map(s => s.questionRatio)
    const questionVariance = this.calculateVariance(questionRatios)
    if (questionVariance > 0.4) {
      errors.push({
        code: 'QUESTION_PATTERN_INCONSISTENT',
        message: `Character ${character.name} shows inconsistent questioning patterns`,
        field: `character.${character.id}.questions`,
        severity: 'warning'
      })
    }
    
    // Check for consistent exclamation usage
    const exclamationRatios = styles.map(s => s.exclamationRatio)
    const exclamationVariance = this.calculateVariance(exclamationRatios)
    if (exclamationVariance > 0.4) {
      errors.push({
        code: 'EXCLAMATION_PATTERN_INCONSISTENT',
        message: `Character ${character.name} shows inconsistent exclamation usage`,
        field: `character.${character.id}.exclamations`,
        severity: 'warning'
      })
    }
    
    return errors
  }

  /**
   * Analyzes dialogue patterns for a character
   */
  private static analyzeDialoguePatterns(blocks: DialogueBlock[]): {
    sentenceStructures: number[],
    vocabularyLevels: number[],
    formalityLevels: number[]
  } {
    return {
      sentenceStructures: blocks.map(block => this.analyzeSentenceStructure(block.text)),
      vocabularyLevels: blocks.map(block => this.analyzeVocabularyLevel(block.text)),
      formalityLevels: blocks.map(block => this.analyzeFormalityLevel(block.text))
    }
  }

  /**
   * Gets expected dialogue patterns based on character profile
   */
  private static getExpectedDialoguePatterns(profile: LockedProfile): {
    expectedStructure: number,
    expectedVocabulary: number,
    expectedFormality: number
  } {
    const personality = profile.lockedAttributes.personality.toLowerCase()
    
    return {
      expectedStructure: personality.includes('intellectual') ? 0.8 : 0.5,
      expectedVocabulary: personality.includes('educated') ? 0.8 : 0.4,
      expectedFormality: personality.includes('formal') ? 0.8 : 0.3
    }
  }

  /**
   * Analyzes sentence structure complexity
   */
  private static analyzeSentenceStructure(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim())
    if (sentences.length === 0) return 0
    
    let complexitySum = 0
    for (const sentence of sentences) {
      const words = sentence.trim().split(/\s+/)
      const clauses = sentence.split(/[,;:]/).length
      const complexity = (words.length * 0.1) + (clauses * 0.2)
      complexitySum += Math.min(complexity, 1.0)
    }
    
    return complexitySum / sentences.length
  }

  /**
   * Analyzes vocabulary level sophistication
   */
  private static analyzeVocabularyLevel(text: string): number {
    const words = text.toLowerCase().split(/\s+/)
    const sophisticatedWords = [
      'consequently', 'furthermore', 'nevertheless', 'moreover', 'therefore',
      'substantial', 'significant', 'considerable', 'remarkable', 'extraordinary',
      'comprehend', 'perceive', 'acknowledge', 'contemplate', 'deliberate'
    ]
    
    const sophisticatedCount = words.filter(word => 
      sophisticatedWords.includes(word) || word.length > 8
    ).length
    
    return Math.min(sophisticatedCount / words.length, 1.0)
  }

  /**
   * Analyzes formality level
   */
  private static analyzeFormalityLevel(text: string): number {
    const formalIndicators = [
      'please', 'thank you', 'excuse me', 'pardon', 'sir', 'madam',
      'would you', 'could you', 'may I', 'might I'
    ]
    const informalIndicators = [
      'yeah', 'nah', 'gonna', 'wanna', 'gotta', 'ain\'t',
      'hey', 'yo', 'dude', 'man', 'guys'
    ]
    
    const lowerText = text.toLowerCase()
    const formalCount = formalIndicators.filter(indicator => lowerText.includes(indicator)).length
    const informalCount = informalIndicators.filter(indicator => lowerText.includes(indicator)).length
    
    if (formalCount + informalCount === 0) return 0.5 // Neutral
    return formalCount / (formalCount + informalCount)
  }

  /**
   * Analyzes speaking style elements
   */
  private static analyzeSpeakingStyle(text: string): {
    contractionRatio: number,
    questionRatio: number,
    exclamationRatio: number
  } {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim())
    const totalSentences = sentences.length || 1
    
    // Count contractions
    const contractions = text.match(/\w+'\w+/g) || []
    const contractionRatio = contractions.length / text.split(/\s+/).length
    
    // Count questions
    const questions = text.match(/\?/g) || []
    const questionRatio = questions.length / totalSentences
    
    // Count exclamations
    const exclamations = text.match(/!/g) || []
    const exclamationRatio = exclamations.length / totalSentences
    
    return {
      contractionRatio,
      questionRatio,
      exclamationRatio
    }
  }

  /**
   * Calculates variance in a set of values
   */
  private static calculateVariance(values: number[]): number {
    if (values.length < 2) return 0
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length
    
    return Math.sqrt(variance) // Return standard deviation
  }

  /**
   * Calculates structure variance
   */
  private static calculateStructureVariance(structures: number[]): number {
    return this.calculateVariance(structures)
  }

  /**
   * Detects vocabulary level shift
   */
  private static detectVocabularyShift(vocabularyLevels: number[]): number {
    if (vocabularyLevels.length < 2) return 0
    
    let maxShift = 0
    for (let i = 1; i < vocabularyLevels.length; i++) {
      const shift = Math.abs(vocabularyLevels[i] - vocabularyLevels[i - 1])
      maxShift = Math.max(maxShift, shift)
    }
    
    return maxShift
  }

  /**
   * Detects formality level shift
   */
  private static detectFormalityShift(formalityLevels: number[]): number {
    if (formalityLevels.length < 2) return 0
    
    let maxShift = 0
    for (let i = 1; i < formalityLevels.length; i++) {
      const shift = Math.abs(formalityLevels[i] - formalityLevels[i - 1])
      maxShift = Math.max(maxShift, shift)
    }
    
    return maxShift
  }

  /**
   * Translates emotional beats into actionable visual direction
   */
  static translateEmotionalBeats(content: string, characters: Character[]): string[] {
    const emotionalDirections: string[] = []
    
    // Extract emotional beats from content
    const emotionalBeats = this.extractEmotionalBeats(content)
    
    for (const beat of emotionalBeats) {
      const direction = this.emotionalBeatToVisualDirection(beat, characters)
      if (direction) {
        emotionalDirections.push(direction)
      }
    }
    
    return emotionalDirections
  }

  /**
   * Creates actionable direction formatting for video production
   */
  static formatEmotionalDirectionsForProduction(
    directions: string[],
    sceneContext: {setting: string, timeOfDay: string, mood?: string}
  ): {
    sceneSetup: string,
    characterDirections: string[],
    cameraInstructions: string[],
    lightingNotes: string[]
  } {
    const characterDirections: string[] = []
    const cameraInstructions: string[] = []
    const lightingNotes: string[] = []
    
    // Process each direction
    for (const direction of directions) {
      const parts = direction.split(' | ')
      const characterName = parts[0].split(' - ')[0]
      
      // Extract specific instruction types
      for (const part of parts) {
        if (part.startsWith('FACIAL:') || part.startsWith('BODY:') || part.startsWith('MOVEMENT:')) {
          characterDirections.push(`${characterName}: ${part}`)
        } else if (part.startsWith('CAMERA:')) {
          cameraInstructions.push(part.replace('CAMERA: ', ''))
        }
      }
    }
    
    // Generate scene setup
    const sceneSetup = this.generateSceneSetup(sceneContext)
    
    // Generate lighting notes based on mood and emotions
    const lightingNotes_generated = this.generateLightingNotes(sceneContext, directions)
    lightingNotes.push(...lightingNotes_generated)
    
    return {
      sceneSetup,
      characterDirections,
      cameraInstructions,
      lightingNotes
    }
  }

  /**
   * Generates scene setup description
   */
  private static generateSceneSetup(sceneContext: {setting: string, timeOfDay: string, mood?: string}): string {
    const elements: string[] = []
    
    elements.push(`LOCATION: ${sceneContext.setting}`)
    elements.push(`TIME: ${sceneContext.timeOfDay}`)
    
    if (sceneContext.mood) {
      elements.push(`MOOD: ${sceneContext.mood}`)
    }
    
    return elements.join(' | ')
  }

  /**
   * Generates lighting notes based on scene context and emotions
   */
  private static generateLightingNotes(
    sceneContext: {setting: string, timeOfDay: string, mood?: string},
    directions: string[]
  ): string[] {
    const notes: string[] = []
    
    // Base lighting for time of day
    const timeBasedLighting = this.getTimeBasedLighting(sceneContext.timeOfDay)
    if (timeBasedLighting) {
      notes.push(timeBasedLighting)
    }
    
    // Mood-based lighting adjustments
    if (sceneContext.mood) {
      const moodLighting = this.getMoodBasedLighting(sceneContext.mood)
      if (moodLighting) {
        notes.push(moodLighting)
      }
    }
    
    // Emotion-based lighting adjustments
    const emotionLighting = this.getEmotionBasedLighting(directions)
    notes.push(...emotionLighting)
    
    return notes
  }

  /**
   * Gets lighting setup based on time of day
   */
  private static getTimeBasedLighting(timeOfDay: string): string | null {
    const lightingMap: Record<string, string> = {
      'DAWN': 'Soft, warm light from low angle, long shadows, golden hour quality',
      'MORNING': 'Bright, natural light, clear shadows, energetic feel',
      'NOON': 'Strong overhead lighting, minimal shadows, high contrast',
      'AFTERNOON': 'Warm, angled light, moderate shadows, comfortable atmosphere',
      'NIGHT': 'Low-key lighting, dramatic shadows, artificial light sources',
      'DAY': 'Natural daylight, balanced exposure, clear visibility'
    }
    
    return lightingMap[timeOfDay] || null
  }

  /**
   * Gets lighting adjustments based on scene mood
   */
  private static getMoodBasedLighting(mood: string): string | null {
    const moodLightingMap: Record<string, string> = {
      'tense': 'Harsh, directional lighting with strong shadows to create unease',
      'romantic': 'Soft, warm lighting with gentle fill, intimate atmosphere',
      'dramatic': 'High contrast lighting, dramatic shadows, emotional emphasis',
      'peaceful': 'Even, natural lighting, soft shadows, calming atmosphere',
      'mysterious': 'Low-key lighting, deep shadows, selective illumination',
      'action': 'Dynamic lighting, quick changes, high energy feel',
      'friendly': 'Warm, inviting lighting, soft shadows, comfortable feel'
    }
    
    return moodLightingMap[mood] || null
  }

  /**
   * Gets lighting adjustments based on emotional content
   */
  private static getEmotionBasedLighting(directions: string[]): string[] {
    const lightingNotes: string[] = []
    const emotionCounts = new Map<string, number>()
    
    // Count emotional intensities
    for (const direction of directions) {
      if (direction.includes('INTENSITY: HIGH')) {
        const emotion = this.extractEmotionFromDirection(direction)
        if (emotion) {
          emotionCounts.set(emotion, (emotionCounts.get(emotion) || 0) + 1)
        }
      }
    }
    
    // Generate lighting notes for dominant emotions
    for (const [emotion, count] of emotionCounts) {
      if (count >= 1) { // At least one high-intensity emotion
        const emotionLighting = this.getEmotionSpecificLighting(emotion)
        if (emotionLighting) {
          lightingNotes.push(emotionLighting)
        }
      }
    }
    
    return lightingNotes
  }

  /**
   * Extracts emotion type from direction string
   */
  private static extractEmotionFromDirection(direction: string): string | null {
    const emotionKeywords = Object.keys(this.EMOTION_KEYWORDS)
    const lowerDirection = direction.toLowerCase()
    
    for (const emotion of emotionKeywords) {
      if (lowerDirection.includes(emotion)) {
        return emotion
      }
    }
    
    return null
  }

  /**
   * Gets specific lighting for individual emotions
   */
  private static getEmotionSpecificLighting(emotion: string): string | null {
    const emotionLightingMap: Record<string, string> = {
      'anger': 'Red-tinted lighting or harsh white light to emphasize intensity',
      'sadness': 'Cool, blue-tinted lighting with soft shadows for melancholy',
      'joy': 'Bright, warm lighting with golden tones for happiness',
      'fear': 'Flickering or unstable lighting, cold tones, deep shadows',
      'surprise': 'Sudden lighting changes or bright flashes to emphasize shock',
      'love': 'Soft, warm lighting with gentle glow, romantic atmosphere',
      'contempt': 'Harsh, unflattering lighting from below to show disdain',
      'pride': 'Strong, confident lighting, well-lit to show self-assurance'
    }
    
    return emotionLightingMap[emotion] || null
  }

  /**
   * Extracts emotional beats from narrative content
   */
  private static extractEmotionalBeats(content: string): Array<{emotion: string, context: string, intensity: number, character?: string}> {
    const beats: Array<{emotion: string, context: string, intensity: number, character?: string}> = []
    const sentences = content.split(/[.!?]+/)
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim()
      if (!trimmed) continue
      
      // Find all emotions in this sentence with intensity analysis
      for (const [emotion, keywords] of Object.entries(this.EMOTION_KEYWORDS)) {
        const matchedKeywords = keywords.filter(keyword => trimmed.toLowerCase().includes(keyword))
        if (matchedKeywords.length > 0) {
          const intensity = this.calculateEmotionalIntensity(trimmed, matchedKeywords)
          const character = this.extractCharacterFromContext(trimmed)
          
          beats.push({ 
            emotion, 
            context: trimmed, 
            intensity,
            character
          })
        }
      }
    }
    
    // Remove duplicate emotions in the same context, keeping the highest intensity
    const uniqueBeats = this.deduplicateEmotionalBeats(beats)
    
    return uniqueBeats
  }

  /**
   * Calculates emotional intensity based on context and keywords
   */
  private static calculateEmotionalIntensity(context: string, matchedKeywords: string[]): number {
    let intensity = 0.5 // Base intensity
    
    const lowerContext = context.toLowerCase()
    
    // Intensity modifiers
    const intensifiers = ['very', 'extremely', 'incredibly', 'absolutely', 'completely', 'utterly', 'deeply']
    const diminishers = ['slightly', 'somewhat', 'a little', 'barely', 'hardly']
    
    // Check for intensifiers
    if (intensifiers.some(word => lowerContext.includes(word))) {
      intensity += 0.3
    }
    
    // Check for diminishers
    if (diminishers.some(word => lowerContext.includes(word))) {
      intensity -= 0.2
    }
    
    // Multiple keywords increase intensity
    intensity += (matchedKeywords.length - 1) * 0.1
    
    // Exclamation marks increase intensity
    const exclamationCount = (context.match(/!/g) || []).length
    intensity += exclamationCount * 0.1
    
    // Capitalization increases intensity
    if (context === context.toUpperCase() && context.length > 3) {
      intensity += 0.2
    }
    
    return Math.min(Math.max(intensity, 0.1), 1.0) // Clamp between 0.1 and 1.0
  }

  /**
   * Extracts character name from emotional context
   */
  private static extractCharacterFromContext(context: string): string | undefined {
    // Look for possessive patterns (John's, Mary's)
    const possessiveMatch = context.match(/(\w+)'s\s+(?:face|eyes|voice|heart|mind)/i)
    if (possessiveMatch) {
      return possessiveMatch[1]
    }
    
    // Look for subject patterns (John felt, Mary was)
    const subjectMatch = context.match(/^(\w+)\s+(?:felt|was|became|looked|seemed)/i)
    if (subjectMatch) {
      return subjectMatch[1]
    }
    
    return undefined
  }

  /**
   * Removes duplicate emotional beats, keeping the highest intensity
   */
  private static deduplicateEmotionalBeats(beats: Array<{emotion: string, context: string, intensity: number, character?: string}>): Array<{emotion: string, context: string, intensity: number, character?: string}> {
    const uniqueBeats = new Map<string, {emotion: string, context: string, intensity: number, character?: string}>()
    
    for (const beat of beats) {
      const key = `${beat.emotion}_${beat.context}`
      const existing = uniqueBeats.get(key)
      
      if (!existing || beat.intensity > existing.intensity) {
        uniqueBeats.set(key, beat)
      }
    }
    
    return Array.from(uniqueBeats.values())
  }

  /**
   * Converts emotional beat to visual direction
   */
  private static emotionalBeatToVisualDirection(
    beat: {emotion: string, context: string, intensity: number, character?: string}, 
    characters: Character[]
  ): string | null {
    const baseDirections = this.getEmotionalVisualDirections(beat.emotion, beat.intensity)
    if (!baseDirections) return null
    
    // Try to identify which character is experiencing the emotion
    let character = null
    if (beat.character) {
      character = characters.find(c => c.name.toLowerCase() === beat.character!.toLowerCase())
    }
    if (!character) {
      character = this.identifyEmotionalCharacter(beat.context, characters)
    }
    
    // Generate comprehensive visual direction
    const direction = this.formatVisualDirection(baseDirections, character, beat.intensity)
    
    return direction
  }

  /**
   * Gets visual directions based on emotion and intensity
   */
  private static getEmotionalVisualDirections(emotion: string, intensity: number): {
    facial: string,
    body: string,
    movement: string,
    camera?: string
  } | null {
    const directions: Record<string, {
      facial: string,
      body: string,
      movement: string,
      camera?: string
    }> = {
      'anger': {
        facial: intensity > 0.7 ? 'Face contorts with rage, eyes blazing, teeth clenched' : 
                intensity > 0.4 ? 'Jaw tightens, eyes narrow with intensity, brow furrows' : 
                'Slight frown, eyes show irritation',
        body: intensity > 0.7 ? 'Fists clench tightly, shoulders tense, body rigid with fury' :
              intensity > 0.4 ? 'Hands form fists, posture becomes aggressive' :
              'Slight tension in shoulders, hands tighten',
        movement: intensity > 0.7 ? 'Sharp, aggressive movements, may slam objects or gesture violently' :
                  intensity > 0.4 ? 'Quick, jerky movements, steps forward assertively' :
                  'Restrained but tense movements',
        camera: intensity > 0.7 ? 'Close-up on face, low angle to show dominance' : 'Medium shot, slight low angle'
      },
      'sadness': {
        facial: intensity > 0.7 ? 'Tears stream down face, expression crumples with grief' :
                intensity > 0.4 ? 'Eyes glisten with unshed tears, face shows deep sorrow' :
                'Slight downturn of mouth, eyes show melancholy',
        body: intensity > 0.7 ? 'Shoulders shake with sobs, body curls inward protectively' :
              intensity > 0.4 ? 'Shoulders slump, head bows, arms wrap around self' :
              'Slight slouch, head tilts down',
        movement: intensity > 0.7 ? 'Slow, heavy movements, may collapse or sink down' :
                  intensity > 0.4 ? 'Movements become sluggish, steps are hesitant' :
                  'Slightly slower movements, less energy',
        camera: intensity > 0.7 ? 'Close-up on face, high angle to show vulnerability' : 'Medium shot, eye level'
      },
      'joy': {
        facial: intensity > 0.7 ? 'Face radiates pure happiness, wide genuine smile, eyes crinkle with joy' :
                intensity > 0.4 ? 'Bright smile, eyes sparkle with happiness' :
                'Gentle smile, eyes show contentment',
        body: intensity > 0.7 ? 'Body language open and expansive, may jump or dance' :
              intensity > 0.4 ? 'Upright posture, shoulders back, chest open' :
              'Relaxed, comfortable posture',
        movement: intensity > 0.7 ? 'Energetic, bouncy movements, may clap or gesture enthusiastically' :
                  intensity > 0.4 ? 'Light, buoyant movements, quick gestures' :
                  'Smooth, relaxed movements',
        camera: intensity > 0.7 ? 'Wide shot to capture full body energy, bright lighting' : 'Medium shot, warm lighting'
      },
      'fear': {
        facial: intensity > 0.7 ? 'Eyes wide with terror, face pale, mouth agape' :
                intensity > 0.4 ? 'Eyes widen, eyebrows raise, face shows alarm' :
                'Slight widening of eyes, concerned expression',
        body: intensity > 0.7 ? 'Body trembles, may cower or freeze completely' :
              intensity > 0.4 ? 'Tense posture, may step back, arms protective' :
              'Slight tension, more alert posture',
        movement: intensity > 0.7 ? 'Jerky, panicked movements or complete stillness' :
                  intensity > 0.4 ? 'Quick, nervous movements, steps backward' :
                  'Cautious, hesitant movements',
        camera: intensity > 0.7 ? 'Close-up with shaky cam, high angle' : 'Medium shot, slightly unstable'
      },
      'surprise': {
        facial: intensity > 0.7 ? 'Eyes extremely wide, mouth drops open, eyebrows shoot up' :
                intensity > 0.4 ? 'Eyebrows raise, eyes widen, mouth opens slightly' :
                'Slight widening of eyes, raised eyebrows',
        body: intensity > 0.7 ? 'Body jerks back, may stumble or freeze' :
              intensity > 0.4 ? 'Slight backward movement, body tenses' :
              'Momentary stillness, slight tension',
        movement: intensity > 0.7 ? 'Sudden, startled movement, may jump or recoil' :
                  intensity > 0.4 ? 'Quick, reactive movement' :
                  'Brief pause in movement',
        camera: intensity > 0.7 ? 'Quick zoom or sudden cut, dramatic angle' : 'Standard shot with quick focus'
      },
      'disgust': {
        facial: intensity > 0.7 ? 'Face contorts with revulsion, nose wrinkles deeply, lips curl' :
                intensity > 0.4 ? 'Nose wrinkles, lips turn downward, eyes narrow' :
                'Slight nose wrinkle, subtle frown',
        body: intensity > 0.7 ? 'Body recoils, may turn away completely' :
              intensity > 0.4 ? 'Leans back, shoulders pull away' :
              'Slight backward lean',
        movement: intensity > 0.7 ? 'Sharp movement away, may cover nose or mouth' :
                  intensity > 0.4 ? 'Steps back, turns head away' :
                  'Subtle avoidance movement',
        camera: 'Medium shot, may include what\'s causing disgust'
      },
      'love': {
        facial: intensity > 0.7 ? 'Eyes soft and adoring, gentle smile, face glows with warmth' :
                intensity > 0.4 ? 'Warm smile, eyes tender and caring' :
                'Soft expression, gentle eyes',
        body: intensity > 0.7 ? 'Open, welcoming posture, may reach out lovingly' :
              intensity > 0.4 ? 'Relaxed, open posture, leans slightly forward' :
              'Comfortable, approachable posture',
        movement: intensity > 0.7 ? 'Gentle, flowing movements, may embrace or caress' :
                  intensity > 0.4 ? 'Soft, caring gestures' :
                  'Gentle, considerate movements',
        camera: intensity > 0.7 ? 'Close-up with soft lighting, warm tones' : 'Medium shot, soft focus'
      },
      'contempt': {
        facial: 'One corner of mouth turns up in sneer, eyes show disdain, eyebrows slightly raised',
        body: 'Posture erect and dismissive, may cross arms or turn slightly away',
        movement: 'Deliberate, controlled movements with air of superiority',
        camera: 'Medium shot, slight low angle to show character\'s sense of superiority'
      },
      'pride': {
        facial: 'Chin raised slightly, confident smile, eyes bright with satisfaction',
        body: 'Chest out, shoulders back, posture tall and confident',
        movement: 'Confident, purposeful movements, may gesture broadly',
        camera: 'Medium to wide shot, slightly low angle to emphasize confidence'
      },
      'shame': {
        facial: 'Eyes downcast, face flushed, expression shows regret',
        body: 'Shoulders hunched, body seems to shrink, arms may wrap around self',
        movement: 'Hesitant, withdrawn movements, avoids eye contact',
        camera: 'High angle to emphasize vulnerability, soft lighting'
      },
      'excitement': {
        facial: 'Eyes bright and animated, wide smile, face shows energy',
        body: 'Energetic posture, may bounce or fidget with enthusiasm',
        movement: 'Quick, animated movements, gestures with enthusiasm',
        camera: 'Dynamic shots, may use movement to capture energy'
      },
      'calm': {
        facial: 'Peaceful expression, relaxed features, gentle eyes',
        body: 'Relaxed, centered posture, breathing appears deep and steady',
        movement: 'Slow, deliberate movements, graceful and controlled',
        camera: 'Steady shots, soft lighting, peaceful composition'
      }
    }
    
    return directions[emotion] || null
  }

  /**
   * Formats visual direction with character and intensity information
   */
  private static formatVisualDirection(
    directions: {facial: string, body: string, movement: string, camera?: string},
    character: Character | null,
    intensity: number
  ): string {
    const parts: string[] = []
    
    // Character identification
    const characterName = character ? character.name : 'CHARACTER'
    
    // Facial expression
    parts.push(`FACIAL: ${directions.facial}`)
    
    // Body language
    parts.push(`BODY: ${directions.body}`)
    
    // Movement
    parts.push(`MOVEMENT: ${directions.movement}`)
    
    // Camera direction (if specified)
    if (directions.camera) {
      parts.push(`CAMERA: ${directions.camera}`)
    }
    
    // Intensity note
    const intensityLabel = intensity > 0.7 ? 'HIGH' : intensity > 0.4 ? 'MEDIUM' : 'LOW'
    parts.push(`INTENSITY: ${intensityLabel}`)
    
    return `${characterName} - ${parts.join(' | ')}`
  }

  /**
   * Identifies which character is experiencing the emotion
   */
  private static identifyEmotionalCharacter(context: string, characters: Character[]): Character | null {
    for (const character of characters) {
      const namePattern = new RegExp(`\\b${character.name}\\b`, 'i')
      if (namePattern.test(context)) {
        return character
      }
    }
    return null
  }

  /**
   * Maintains character speaking style consistency across scenes
   */
  static maintainCharacterVoiceConsistency(
    dialogueBlocks: DialogueBlock[], 
    characters: Character[], 
    lockedProfiles: LockedProfile[]
  ): DialogueBlock[] {
    const maintainedBlocks: DialogueBlock[] = []
    
    // Group dialogue by character to analyze patterns
    const characterDialogue = new Map<string, DialogueBlock[]>()
    
    for (const block of dialogueBlocks) {
      if (!characterDialogue.has(block.characterId)) {
        characterDialogue.set(block.characterId, [])
      }
      characterDialogue.get(block.characterId)!.push(block)
    }
    
    // Process each character's dialogue for consistency
    for (const block of dialogueBlocks) {
      const character = characters.find(c => c.id === block.characterId)
      const profile = lockedProfiles.find(p => p.characterId === block.characterId)
      const characterBlocks = characterDialogue.get(block.characterId) || []
      
      if (!character || !profile) {
        maintainedBlocks.push(block)
        continue
      }
      
      // Apply voice consistency adjustments
      const adjustedBlock = this.adjustDialogueForConsistency(
        block, 
        character, 
        profile, 
        characterBlocks
      )
      
      maintainedBlocks.push(adjustedBlock)
    }
    
    return maintainedBlocks
  }

  /**
   * Adjusts dialogue block for voice consistency
   */
  private static adjustDialogueForConsistency(
    block: DialogueBlock,
    character: Character,
    profile: LockedProfile,
    allCharacterBlocks: DialogueBlock[]
  ): DialogueBlock {
    const personality = profile.lockedAttributes.personality.toLowerCase()
    let adjustedText = block.text
    
    // Establish character's speaking patterns from existing dialogue
    const speakingPatterns = this.establishSpeakingPatterns(allCharacterBlocks, personality)
    
    // Apply consistency adjustments
    adjustedText = this.adjustVocabularyLevel(adjustedText, speakingPatterns.vocabularyLevel)
    adjustedText = this.adjustFormalityLevel(adjustedText, speakingPatterns.formalityLevel)
    adjustedText = this.adjustContractionUsage(adjustedText, speakingPatterns.contractionUsage)
    adjustedText = this.adjustSentenceStructure(adjustedText, speakingPatterns.sentenceComplexity)
    
    return {
      ...block,
      text: adjustedText
    }
  }

  /**
   * Establishes speaking patterns from character's dialogue history
   */
  private static establishSpeakingPatterns(
    blocks: DialogueBlock[], 
    personality: string
  ): {
    vocabularyLevel: number,
    formalityLevel: number,
    contractionUsage: number,
    sentenceComplexity: number
  } {
    if (blocks.length === 0) {
      // Use personality-based defaults
      return {
        vocabularyLevel: personality.includes('intellectual') ? 0.7 : 0.4,
        formalityLevel: personality.includes('formal') ? 0.8 : 0.3,
        contractionUsage: personality.includes('casual') ? 0.6 : 0.2,
        sentenceComplexity: personality.includes('verbose') ? 0.8 : 0.5
      }
    }
    
    // Calculate averages from existing dialogue
    const vocabularyLevels = blocks.map(b => this.analyzeVocabularyLevel(b.text))
    const formalityLevels = blocks.map(b => this.analyzeFormalityLevel(b.text))
    const styles = blocks.map(b => this.analyzeSpeakingStyle(b.text))
    const structures = blocks.map(b => this.analyzeSentenceStructure(b.text))
    
    return {
      vocabularyLevel: this.average(vocabularyLevels),
      formalityLevel: this.average(formalityLevels),
      contractionUsage: this.average(styles.map(s => s.contractionRatio)),
      sentenceComplexity: this.average(structures)
    }
  }

  /**
   * Adjusts vocabulary level to match character pattern
   */
  private static adjustVocabularyLevel(text: string, targetLevel: number): string {
    const currentLevel = this.analyzeVocabularyLevel(text)
    const difference = targetLevel - currentLevel
    
    if (Math.abs(difference) < 0.2) return text // Close enough
    
    let adjustedText = text
    
    if (difference > 0) {
      // Need to increase sophistication
      adjustedText = this.enhanceVocabulary(adjustedText)
    } else {
      // Need to simplify vocabulary
      adjustedText = this.simplifyVocabulary(adjustedText)
    }
    
    return adjustedText
  }

  /**
   * Adjusts formality level to match character pattern
   */
  private static adjustFormalityLevel(text: string, targetLevel: number): string {
    const currentLevel = this.analyzeFormalityLevel(text)
    const difference = targetLevel - currentLevel
    
    if (Math.abs(difference) < 0.2) return text
    
    let adjustedText = text
    
    if (difference > 0) {
      // Need to increase formality
      adjustedText = this.increaseFormality(adjustedText)
    } else {
      // Need to decrease formality
      adjustedText = this.decreaseFormality(adjustedText)
    }
    
    return adjustedText
  }

  /**
   * Adjusts contraction usage to match character pattern
   */
  private static adjustContractionUsage(text: string, targetUsage: number): string {
    const currentStyle = this.analyzeSpeakingStyle(text)
    const difference = targetUsage - currentStyle.contractionRatio
    
    if (Math.abs(difference) < 0.1) return text
    
    let adjustedText = text
    
    if (difference > 0) {
      // Need more contractions
      adjustedText = this.addContractions(adjustedText)
    } else {
      // Need fewer contractions
      adjustedText = this.removeContractions(adjustedText)
    }
    
    return adjustedText
  }

  /**
   * Adjusts sentence structure complexity
   */
  private static adjustSentenceStructure(text: string, targetComplexity: number): string {
    const currentComplexity = this.analyzeSentenceStructure(text)
    const difference = targetComplexity - currentComplexity
    
    if (Math.abs(difference) < 0.2) return text
    
    // For now, return original text - sentence restructuring is complex
    // This could be enhanced with more sophisticated NLP
    return text
  }

  /**
   * Enhances vocabulary sophistication
   */
  private static enhanceVocabulary(text: string): string {
    const enhancements: Record<string, string> = {
      'big': 'substantial',
      'small': 'diminutive',
      'good': 'excellent',
      'bad': 'deplorable',
      'think': 'contemplate',
      'see': 'perceive',
      'know': 'comprehend',
      'want': 'desire',
      'need': 'require'
    }
    
    let enhanced = text
    for (const [simple, sophisticated] of Object.entries(enhancements)) {
      const regex = new RegExp(`\\b${simple}\\b`, 'gi')
      enhanced = enhanced.replace(regex, sophisticated)
    }
    
    return enhanced
  }

  /**
   * Simplifies vocabulary
   */
  private static simplifyVocabulary(text: string): string {
    const simplifications: Record<string, string> = {
      'substantial': 'big',
      'diminutive': 'small',
      'excellent': 'good',
      'deplorable': 'bad',
      'contemplate': 'think',
      'perceive': 'see',
      'comprehend': 'know',
      'desire': 'want',
      'require': 'need'
    }
    
    let simplified = text
    for (const [complex, simple] of Object.entries(simplifications)) {
      const regex = new RegExp(`\\b${complex}\\b`, 'gi')
      simplified = simplified.replace(regex, simple)
    }
    
    return simplified
  }

  /**
   * Increases formality of text
   */
  private static increaseFormality(text: string): string {
    const formalizations: Record<string, string> = {
      'yeah': 'yes',
      'nah': 'no',
      'gonna': 'going to',
      'wanna': 'want to',
      'gotta': 'have to',
      'ain\'t': 'am not',
      'hey': 'excuse me',
      'dude': 'sir',
      'guys': 'everyone'
    }
    
    let formal = text
    for (const [informal, formalWord] of Object.entries(formalizations)) {
      const regex = new RegExp(`\\b${informal}\\b`, 'gi')
      formal = formal.replace(regex, formalWord)
    }
    
    return formal
  }

  /**
   * Decreases formality of text
   */
  private static decreaseFormality(text: string): string {
    const informalizations: Record<string, string> = {
      'yes': 'yeah',
      'no': 'nah',
      'going to': 'gonna',
      'want to': 'wanna',
      'have to': 'gotta',
      'excuse me': 'hey',
      'sir': 'dude',
      'everyone': 'guys'
    }
    
    let informal = text
    for (const [formalWord, informalWord] of Object.entries(informalizations)) {
      const regex = new RegExp(`\\b${formalWord}\\b`, 'gi')
      informal = informal.replace(regex, informalWord)
    }
    
    return informal
  }

  /**
   * Adds contractions to text
   */
  private static addContractions(text: string): string {
    const contractions: Record<string, string> = {
      'do not': 'don\'t',
      'does not': 'doesn\'t',
      'did not': 'didn\'t',
      'will not': 'won\'t',
      'would not': 'wouldn\'t',
      'could not': 'couldn\'t',
      'should not': 'shouldn\'t',
      'cannot': 'can\'t',
      'I am': 'I\'m',
      'you are': 'you\'re',
      'he is': 'he\'s',
      'she is': 'she\'s',
      'it is': 'it\'s',
      'we are': 'we\'re',
      'they are': 'they\'re',
      'I have': 'I\'ve',
      'you have': 'you\'ve',
      'we have': 'we\'ve',
      'they have': 'they\'ve',
      'I will': 'I\'ll',
      'you will': 'you\'ll',
      'he will': 'he\'ll',
      'she will': 'she\'ll',
      'we will': 'we\'ll',
      'they will': 'they\'ll'
    }
    
    let contracted = text
    for (const [full, contraction] of Object.entries(contractions)) {
      const regex = new RegExp(`\\b${full}\\b`, 'gi')
      contracted = contracted.replace(regex, contraction)
    }
    
    return contracted
  }

  /**
   * Removes contractions from text
   */
  private static removeContractions(text: string): string {
    const expansions: Record<string, string> = {
      'don\'t': 'do not',
      'doesn\'t': 'does not',
      'didn\'t': 'did not',
      'won\'t': 'will not',
      'wouldn\'t': 'would not',
      'couldn\'t': 'could not',
      'shouldn\'t': 'should not',
      'can\'t': 'cannot',
      'I\'m': 'I am',
      'you\'re': 'you are',
      'he\'s': 'he is',
      'she\'s': 'she is',
      'it\'s': 'it is',
      'we\'re': 'we are',
      'they\'re': 'they are',
      'I\'ve': 'I have',
      'you\'ve': 'you have',
      'we\'ve': 'we have',
      'they\'ve': 'they have',
      'I\'ll': 'I will',
      'you\'ll': 'you will',
      'he\'ll': 'he will',
      'she\'ll': 'she will',
      'we\'ll': 'we will',
      'they\'ll': 'they will'
    }
    
    let expanded = text
    for (const [contraction, full] of Object.entries(expansions)) {
      const regex = new RegExp(`\\b${contraction}\\b`, 'gi')
      expanded = expanded.replace(regex, full)
    }
    
    return expanded
  }

  /**
   * Calculates average of number array
   */
  private static average(numbers: number[]): number {
    if (numbers.length === 0) return 0
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length
  }

  /**
   * Validates voice consistency across multiple episodes/scenes
   */
  static validateCrossSceneVoiceConsistency(
    episodeDialogues: Map<string, DialogueBlock[]>, 
    characters: Character[], 
    lockedProfiles: LockedProfile[]
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []
    
    // Collect all dialogue blocks for each character across episodes
    const allCharacterDialogue = new Map<string, DialogueBlock[]>()
    
    for (const [episodeId, dialogueBlocks] of episodeDialogues) {
      for (const block of dialogueBlocks) {
        if (!allCharacterDialogue.has(block.characterId)) {
          allCharacterDialogue.set(block.characterId, [])
        }
        allCharacterDialogue.get(block.characterId)!.push({
          ...block,
          id: `${episodeId}_${block.id}` // Track episode origin
        })
      }
    }
    
    // Validate consistency for each character across all episodes
    for (const [characterId, blocks] of allCharacterDialogue) {
      const character = characters.find(c => c.id === characterId)
      const profile = lockedProfiles.find(p => p.characterId === characterId)
      
      if (!character || !profile || blocks.length < 3) continue
      
      // Check for voice drift across episodes
      const driftErrors = this.detectVoiceDrift(blocks, character, profile)
      errors.push(...driftErrors.filter(e => e.severity === 'error'))
      warnings.push(...driftErrors.filter(e => e.severity === 'warning'))
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Detects voice drift across multiple dialogue instances
   */
  private static detectVoiceDrift(
    blocks: DialogueBlock[], 
    character: Character, 
    profile: LockedProfile
  ): ValidationError[] {
    const errors: ValidationError[] = []
    
    // Analyze patterns in chronological order
    const patterns = blocks.map(block => ({
      blockId: block.id,
      vocabulary: this.analyzeVocabularyLevel(block.text),
      formality: this.analyzeFormalityLevel(block.text),
      style: this.analyzeSpeakingStyle(block.text),
      structure: this.analyzeSentenceStructure(block.text)
    }))
    
    // Check for significant drift in vocabulary
    const vocabularyDrift = this.calculateDriftTrend(patterns.map(p => p.vocabulary))
    if (Math.abs(vocabularyDrift) > 0.3) {
      errors.push({
        code: 'VOCABULARY_DRIFT_DETECTED',
        message: `Character ${character.name} shows vocabulary drift across episodes`,
        field: `character.${character.id}.vocabulary_drift`,
        severity: 'warning'
      })
    }
    
    // Check for significant drift in formality
    const formalityDrift = this.calculateDriftTrend(patterns.map(p => p.formality))
    if (Math.abs(formalityDrift) > 0.4) {
      errors.push({
        code: 'FORMALITY_DRIFT_DETECTED',
        message: `Character ${character.name} shows formality drift across episodes`,
        field: `character.${character.id}.formality_drift`,
        severity: 'warning'
      })
    }
    
    // Check for drift in contraction usage
    const contractionDrift = this.calculateDriftTrend(patterns.map(p => p.style.contractionRatio))
    if (Math.abs(contractionDrift) > 0.3) {
      errors.push({
        code: 'CONTRACTION_DRIFT_DETECTED',
        message: `Character ${character.name} shows contraction usage drift across episodes`,
        field: `character.${character.id}.contraction_drift`,
        severity: 'warning'
      })
    }
    
    return errors
  }

  /**
   * Calculates drift trend in a series of values
   */
  private static calculateDriftTrend(values: number[]): number {
    if (values.length < 3) return 0
    
    // Simple linear regression to detect trend
    const n = values.length
    const sumX = (n * (n - 1)) / 2 // Sum of indices 0, 1, 2, ...
    const sumY = values.reduce((sum, val) => sum + val, 0)
    const sumXY = values.reduce((sum, val, index) => sum + (index * val), 0)
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6 // Sum of squares of indices
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    
    return slope
  }
}