import type { 
  Character, 
  CharacterRole, 
  CharacterAttributes, 
  LockedProfile, 
  Relationship, 
  Appearance, 
  Chapter, 
  Scene, 
  ValidationResult, 
  ValidationError,
  ConsistencyReport,
  ConsistencyViolation
} from '../types/core'

/**
 * Character System Service
 * Handles character identification, profile creation, consistency enforcement, and network integration
 */
export class CharacterSystem {
  private static readonly MIN_APPEARANCES_FOR_MAJOR = 3
  private static readonly MIN_APPEARANCES_FOR_SUPPORTING = 2
  private static readonly PROTAGONIST_INDICATORS = [
    '主角', '主人公', '我', '自己', 'protagonist', 'main character', 'hero', 'heroine'
  ]
  private static readonly ANTAGONIST_INDICATORS = [
    '反派', '敌人', '对手', '坏人', 'antagonist', 'villain', 'enemy', 'rival'
  ]

  /**
   * Identifies characters from novel chapters using named entity recognition
   */
  static identifyCharacters(chapters: Chapter[]): Character[] {
    const characterMap = new Map<string, Character>()
    const characterAppearances = new Map<string, Appearance[]>()
    const characterMentions = new Map<string, number>()

    // First pass: collect all character mentions and appearances
    for (const chapter of chapters) {
      for (const scene of chapter.scenes) {
        const mentionedCharacters = this.extractCharacterMentions(scene.content)
        
        for (const characterName of mentionedCharacters) {
          const normalizedName = this.normalizeCharacterName(characterName)
          
          // Count mentions
          characterMentions.set(normalizedName, (characterMentions.get(normalizedName) || 0) + 1)
          
          // Record appearance
          const appearance: Appearance = {
            id: `${scene.id}_${normalizedName}_${Date.now()}`,
            characterId: normalizedName,
            sceneId: scene.id,
            description: this.extractCharacterDescription(scene.content, characterName),
            importance: this.determineAppearanceImportance(scene.content, characterName)
          }
          
          if (!characterAppearances.has(normalizedName)) {
            characterAppearances.set(normalizedName, [])
          }
          characterAppearances.get(normalizedName)!.push(appearance)
        }
      }
    }

    // Second pass: create character objects with role classification
    for (const [characterName, mentions] of characterMentions.entries()) {
      const appearances = characterAppearances.get(characterName) || []
      const role = this.classifyCharacterRole(characterName, mentions, appearances, chapters)
      
      // Only include characters that appear at least once or have significant roles
      if (mentions >= 1 || role === 'protagonist' || role === 'antagonist') {
        const character: Character = {
          id: this.generateCharacterId(characterName),
          name: characterName,
          role,
          attributes: this.extractCharacterAttributes(characterName, appearances, chapters),
          relationships: [], // Will be populated in relationship mapping
          appearances
        }
        
        characterMap.set(characterName, character)
      }
    }

    // Third pass: identify relationships between characters
    const characters = Array.from(characterMap.values())
    this.identifyRelationships(characters, chapters)

    return characters
  }

  /**
   * Extracts character mentions from text using NLP techniques
   */
  private static extractCharacterMentions(text: string): string[] {
    const characters: string[] = []
    
    // Chinese name patterns - common surnames + 1-2 characters
    const chineseNamePattern = /[王李张刘陈杨黄赵吴周徐孙马朱胡郭何高林罗郑梁谢宋唐许韩冯邓曹彭曾萧田董袁潘于蒋蔡余杜叶程苏魏吕丁任沈姚卢姜崔钟谭陆汪范金石廖贾夏韦付方白邹孟熊秦邱江尹薛闫段雷侯龙史陶黎贺顾毛郝龚邵万钱严覃武戴莫孔向汤][\u4e00-\u9fa5]{1,2}/g
    
    // English name patterns (capitalized words, including compound names)
    const englishNamePattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g
    
    // Pronoun patterns that might indicate character focus
    const pronounPatterns = /\b(他|她|它|我|你|He|She|I|You)\b/g

    // Extract Chinese names
    const chineseMatches = text.match(chineseNamePattern)
    if (chineseMatches) {
      const filteredChinese = chineseMatches.filter(name => this.isValidCharacterName(name))
      characters.push(...filteredChinese)
    }

    // Extract English names
    const englishMatches = text.match(englishNamePattern)
    if (englishMatches) {
      const filteredEnglish = englishMatches.filter(name => this.isValidCharacterName(name))
      characters.push(...filteredEnglish)
    }

    // Remove duplicates and return
    return [...new Set(characters)]
  }

  /**
   * Validates if a string is likely a character name
   */
  private static isValidCharacterName(name: string): boolean {
    // Filter out common words that aren't names
    const commonWords = [
      'The', 'This', 'That', 'Chapter', 'Scene', 'When', 'Where', 'What', 'How', 'Why', 
      'And', 'But', 'For', 'With', 'From', 'After', 'Before', 'During', 'While',
      '第一', '第二', '第三', '第四', '第五', '第六', '第七', '第八', '第九', '第十',
      '今天', '昨天', '明天', '现在', '以前', '以后', '时候', '地方', '东西', '事情',
      '问题', '方法', '办法', '结果', '原因', '情况', '条件', '机会', '可能', '应该'
    ]
    
    if (commonWords.includes(name)) {
      return false
    }
    
    // Check length constraints
    if (name.length < 2 || name.length > 4) {
      return false
    }
    
    // For Chinese names, check if it contains valid name characters
    if (/[\u4e00-\u9fa5]/.test(name)) {
      // Should not contain common non-name characters
      const invalidChars = ['是', '在', '有', '和', '与', '或', '但', '而', '就', '都', '也', '还', '又', '才', '只', '不', '没', '很', '太', '最', '更', '比', '像', '如', '若', '要', '会', '能', '可', '应', '该', '将', '把', '被', '让', '使', '给', '为', '向', '从', '到', '于', '对', '关', '按', '根', '据', '由', '经', '通', '过', '来', '去', '上', '下', '进', '出', '回', '起', '开', '关', '看', '听', '说', '做', '走', '跑', '站', '坐', '躺', '睡', '吃', '喝', '笑', '哭', '想', '知', '道', '等']
      
      // Check if name contains any invalid characters
      for (const char of invalidChars) {
        if (name.includes(char)) {
          return false
        }
      }
      
      // For 2-character names, both should be valid name characters
      if (name.length === 2) {
        return true
      }
      
      // For 3-character names, should follow surname + given name pattern
      if (name.length === 3) {
        return true
      }
    }
    
    return true
  }

  /**
   * Normalizes character names for consistent identification
   */
  private static normalizeCharacterName(name: string): string {
    // Remove extra whitespace and normalize case
    let normalized = name.trim()
    
    // For English names, use title case
    if (/^[A-Za-z\s]+$/.test(normalized)) {
      normalized = normalized.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
    }
    
    return normalized
  }

  /**
   * Classifies character role based on appearance frequency and context
   */
  private static classifyCharacterRole(
    characterName: string, 
    mentions: number, 
    appearances: Appearance[], 
    chapters: Chapter[]
  ): CharacterRole {
    // Check for explicit role indicators in text
    const allText = chapters.map(c => c.content).join(' ')
    const nameContext = this.getCharacterContext(characterName, allText)
    
    // Check for protagonist indicators
    if (this.PROTAGONIST_INDICATORS.some(indicator => nameContext.includes(indicator))) {
      return 'protagonist'
    }
    
    // Check for antagonist indicators
    if (this.ANTAGONIST_INDICATORS.some(indicator => nameContext.includes(indicator))) {
      return 'antagonist'
    }
    
    // Classify based on appearance frequency and importance
    const majorAppearances = appearances.filter(a => a.importance === 'major').length
    const totalAppearances = appearances.length
    
    if (mentions >= 10 && majorAppearances >= this.MIN_APPEARANCES_FOR_MAJOR) {
      return 'protagonist'
    } else if (mentions >= 5 && totalAppearances >= this.MIN_APPEARANCES_FOR_SUPPORTING) {
      return 'supporting'
    } else {
      return 'minor'
    }
  }

  /**
   * Gets context around character mentions for role classification
   */
  private static getCharacterContext(characterName: string, text: string): string {
    const contexts: string[] = []
    const regex = new RegExp(`(.{0,50})${characterName}(.{0,50})`, 'gi')
    let match
    
    while ((match = regex.exec(text)) !== null) {
      contexts.push(match[0])
    }
    
    return contexts.join(' ')
  }

  /**
   * Extracts character description from scene content
   */
  private static extractCharacterDescription(sceneContent: string, characterName: string): string {
    // Look for descriptive text around character mentions
    const regex = new RegExp(`(.{0,100})${characterName}(.{0,100})`, 'i')
    const match = sceneContent.match(regex)
    
    if (match) {
      // Extract descriptive adjectives and phrases
      const context = match[0]
      const descriptiveWords = this.extractDescriptiveWords(context)
      return descriptiveWords.join(', ')
    }
    
    return ''
  }

  /**
   * Extracts descriptive words from text
   */
  private static extractDescriptiveWords(text: string): string[] {
    const descriptive: string[] = []
    
    // Chinese descriptive patterns
    const chineseDescriptive = /[美丑高矮胖瘦年轻年老聪明愚蠢善良邪恶勇敢胆小温柔粗暴安静吵闹快乐悲伤愤怒平静紧张放松严肃幽默冷漠热情骄傲谦虚自信害羞外向内向活泼沉默机智迟钝细心粗心耐心急躁诚实虚伪友好敌对礼貌粗鲁优雅粗俗文雅野蛮]/g
    
    // English descriptive patterns (adjectives)
    const englishDescriptive = /\b(beautiful|ugly|tall|short|fat|thin|young|old|smart|stupid|kind|evil|brave|coward|gentle|rough|quiet|loud|happy|sad|angry|calm|nervous|relaxed|serious|funny|cold|warm|proud|humble|confident|shy|outgoing|introverted|lively|silent|clever|slow|careful|careless|patient|impatient|honest|dishonest|friendly|hostile|polite|rude|elegant|vulgar|refined|wild)\b/gi
    
    const chineseMatches = text.match(chineseDescriptive)
    if (chineseMatches) {
      descriptive.push(...chineseMatches)
    }
    
    const englishMatches = text.match(englishDescriptive)
    if (englishMatches) {
      descriptive.push(...englishMatches.map(word => word.toLowerCase()))
    }
    
    return [...new Set(descriptive)]
  }

  /**
   * Determines the importance of a character's appearance in a scene
   */
  private static determineAppearanceImportance(sceneContent: string, characterName: string): 'major' | 'minor' | 'background' {
    const mentions = (sceneContent.match(new RegExp(characterName, 'gi')) || []).length
    const sceneLength = sceneContent.length
    const mentionDensity = mentions / (sceneLength / 100) // mentions per 100 characters
    
    if (mentionDensity > 2 || mentions >= 5) {
      return 'major'
    } else if (mentionDensity > 0.5 || mentions >= 2) {
      return 'minor'
    } else {
      return 'background'
    }
  }

  /**
   * Extracts character attributes from appearances and context
   */
  private static extractCharacterAttributes(
    characterName: string, 
    appearances: Appearance[], 
    chapters: Chapter[]
  ): CharacterAttributes {
    const allDescriptions = appearances.map(a => a.description).join(' ')
    const allText = chapters.map(c => c.content).join(' ')
    const characterContext = this.getCharacterContext(characterName, allText)
    
    return {
      appearance: this.extractAppearanceDescription(allDescriptions + ' ' + characterContext),
      personality: this.extractPersonalityTraits(characterContext),
      age: this.extractAge(characterContext),
      gender: this.extractGender(characterContext, characterName),
      occupation: this.extractOccupation(characterContext),
      background: this.extractBackground(characterContext)
    }
  }

  /**
   * Extracts appearance description from text
   */
  private static extractAppearanceDescription(text: string): string {
    const appearanceWords = this.extractDescriptiveWords(text)
    const physicalDescriptors = appearanceWords.filter(word => 
      /^(美|丑|高|矮|胖|瘦|年轻|年老|beautiful|ugly|tall|short|fat|thin|young|old)/.test(word)
    )
    return physicalDescriptors.join(', ') || 'Unknown appearance'
  }

  /**
   * Extracts personality traits from text
   */
  private static extractPersonalityTraits(text: string): string {
    const personalityWords = this.extractDescriptiveWords(text)
    const personalityTraits = personalityWords.filter(word => 
      !/^(美|丑|高|矮|胖|瘦|年轻|年老|beautiful|ugly|tall|short|fat|thin|young|old)/.test(word)
    )
    return personalityTraits.join(', ') || 'Unknown personality'
  }

  /**
   * Extracts age information from text
   */
  private static extractAge(text: string): number | undefined {
    const agePattern = /(\d+)[岁年]|(\d+)\s*years?\s*old/i
    const match = text.match(agePattern)
    if (match) {
      return parseInt(match[1] || match[2])
    }
    return undefined
  }

  /**
   * Extracts gender from text and name patterns
   */
  private static extractGender(text: string, characterName: string): string | undefined {
    // Check for explicit gender indicators
    if (/她|女|girl|woman|female|lady/i.test(text)) {
      return 'female'
    }
    if (/他|男|boy|man|male|gentleman/i.test(text)) {
      return 'male'
    }
    
    // Check name patterns for gender hints (simplified)
    if (/[美丽花香雪月莲梅兰菊竹]/.test(characterName)) {
      return 'female'
    }
    if (/[强勇刚雄龙虎豹鹰]/.test(characterName)) {
      return 'male'
    }
    
    return undefined
  }

  /**
   * Extracts occupation from text
   */
  private static extractOccupation(text: string): string | undefined {
    const occupationPatterns = [
      /是(.{1,10}?)[师生员工人]/, // Chinese occupation patterns
      /works?\s+as\s+a?\s*(.{1,20}?)[\s,.]/, // English occupation patterns
      /职业是(.{1,10}?)/, // "职业是..."
      /从事(.{1,10}?)工作/ // "从事...工作"
    ]
    
    for (const pattern of occupationPatterns) {
      const match = text.match(pattern)
      if (match) {
        return match[1].trim()
      }
    }
    
    return undefined
  }

  /**
   * Extracts background information from text
   */
  private static extractBackground(text: string): string | undefined {
    // Look for background information patterns
    const backgroundPatterns = [
      /出生于(.{1,20}?)/, // "出生于..."
      /来自(.{1,20}?)/, // "来自..."
      /born\s+in\s+(.{1,20}?)[\s,.]/, // "born in..."
      /from\s+(.{1,20}?)[\s,.]/ // "from..."
    ]
    
    for (const pattern of backgroundPatterns) {
      const match = text.match(pattern)
      if (match) {
        return match[1].trim()
      }
    }
    
    return undefined
  }

  /**
   * Identifies relationships between characters
   */
  private static identifyRelationships(characters: Character[], chapters: Chapter[]): void {
    const allText = chapters.map(c => c.content).join(' ')
    
    for (let i = 0; i < characters.length; i++) {
      for (let j = i + 1; j < characters.length; j++) {
        const char1 = characters[i]
        const char2 = characters[j]
        
        const relationship = this.analyzeRelationship(char1.name, char2.name, allText)
        if (relationship) {
          // Add bidirectional relationship
          char1.relationships.push({
            id: `rel_${char1.id}_${char2.id}`,
            fromCharacterId: char1.id,
            toCharacterId: char2.id,
            relationshipType: relationship.type,
            description: relationship.description,
            strength: relationship.strength
          })
          
          char2.relationships.push({
            id: `rel_${char2.id}_${char1.id}`,
            fromCharacterId: char2.id,
            toCharacterId: char1.id,
            relationshipType: relationship.reciprocal || relationship.type,
            description: relationship.description,
            strength: relationship.strength
          })
        }
      }
    }
  }

  /**
   * Analyzes relationship between two characters
   */
  private static analyzeRelationship(name1: string, name2: string, text: string): {
    type: string
    reciprocal?: string
    description: string
    strength: number
  } | null {
    // Look for co-occurrence patterns
    const coOccurrencePattern = new RegExp(`(.{0,100})(${name1}.{0,50}${name2}|${name2}.{0,50}${name1})(.{0,100})`, 'gi')
    const matches = text.match(coOccurrencePattern)
    
    if (!matches || matches.length === 0) {
      return null
    }
    
    const context = matches.join(' ')
    const strength = Math.min(matches.length, 10) // Cap at 10
    
    // Analyze relationship type from context
    const relationshipType = this.determineRelationshipType(context, name1, name2)
    
    return {
      type: relationshipType.type,
      reciprocal: relationshipType.reciprocal,
      description: `Relationship inferred from ${matches.length} co-occurrences`,
      strength
    }
  }

  /**
   * Determines relationship type from context
   */
  private static determineRelationshipType(context: string, name1: string, name2: string): {
    type: string
    reciprocal?: string
  } {
    // Family relationships
    if (/父亲|爸爸|father|dad/i.test(context)) {
      return { type: 'father', reciprocal: 'child' }
    }
    if (/母亲|妈妈|mother|mom/i.test(context)) {
      return { type: 'mother', reciprocal: 'child' }
    }
    if (/兄弟|brother/i.test(context)) {
      return { type: 'brother' }
    }
    if (/姐妹|sister/i.test(context)) {
      return { type: 'sister' }
    }
    
    // Romantic relationships
    if (/恋人|情人|男友|女友|boyfriend|girlfriend|lover/i.test(context)) {
      return { type: 'romantic_partner' }
    }
    if (/丈夫|妻子|husband|wife/i.test(context)) {
      return { type: 'spouse' }
    }
    
    // Professional relationships
    if (/老板|上司|boss|supervisor/i.test(context)) {
      return { type: 'boss', reciprocal: 'subordinate' }
    }
    if (/同事|colleague/i.test(context)) {
      return { type: 'colleague' }
    }
    
    // Friendship and rivalry
    if (/朋友|friend/i.test(context)) {
      return { type: 'friend' }
    }
    if (/敌人|对手|enemy|rival/i.test(context)) {
      return { type: 'enemy' }
    }
    
    // Default to acquaintance
    return { type: 'acquaintance' }
  }

  /**
   * Generates unique character ID
   */
  private static generateCharacterId(characterName: string): string {
    const normalized = characterName.toLowerCase().replace(/\s+/g, '_')
    return `char_${normalized}_${Date.now()}`
  }

  /**
   * Tracks recurring characters across chapters
   */
  static trackRecurringCharacters(characters: Character[], chapters: Chapter[]): Character[] {
    // Update character appearances with chapter information
    for (const character of characters) {
      const chapterAppearances = new Map<string, number>()
      
      for (const appearance of character.appearances) {
        // Find which chapter this scene belongs to
        const chapter = chapters.find(c => c.scenes.some(s => s.id === appearance.sceneId))
        if (chapter) {
          chapterAppearances.set(chapter.id, (chapterAppearances.get(chapter.id) || 0) + 1)
        }
      }
      
      // Update character role based on recurring appearances
      const chaptersWithAppearances = chapterAppearances.size
      const totalChapters = chapters.length
      const appearanceRatio = chaptersWithAppearances / totalChapters
      
      if (appearanceRatio >= 0.7 && character.role === 'supporting') {
        character.role = 'protagonist'
      } else if (appearanceRatio >= 0.4 && character.role === 'minor') {
        character.role = 'supporting'
      }
    }
    
    return characters
  }

  // ===== CHARACTER PROFILE CREATION AND LOCKING SYSTEM =====

  /**
   * Creates a locked character profile to prevent attribute drift
   */
  static createLockedProfile(character: Character, visualReference?: any): LockedProfile {
    const lockedProfile: LockedProfile = {
      characterId: character.id,
      lockedAttributes: { ...character.attributes },
      visualReference,
      consistencyRules: this.generateConsistencyRules(character),
      isLocked: true
    }

    // Store the locked profile
    this.storeLockedProfile(lockedProfile)
    
    return lockedProfile
  }

  /**
   * Generates consistency rules for a character
   */
  private static generateConsistencyRules(character: Character): any[] {
    const rules: any[] = []

    // Appearance consistency rules
    if (character.attributes.appearance) {
      rules.push({
        id: `appearance_${character.id}`,
        name: 'Appearance Consistency',
        description: 'Character appearance must remain consistent across all scenes',
        validator: (content: string) => this.validateAppearanceConsistency(content, character.attributes.appearance),
        isActive: true
      })
    }

    // Personality consistency rules
    if (character.attributes.personality) {
      rules.push({
        id: `personality_${character.id}`,
        name: 'Personality Consistency',
        description: 'Character personality traits must remain consistent',
        validator: (content: string) => this.validatePersonalityConsistency(content, character.attributes.personality),
        isActive: true
      })
    }

    // Age consistency rules
    if (character.attributes.age) {
      rules.push({
        id: `age_${character.id}`,
        name: 'Age Consistency',
        description: 'Character age must remain consistent unless story progression warrants change',
        validator: (content: string) => this.validateAgeConsistency(content, character.attributes.age!),
        isActive: true
      })
    }

    // Gender consistency rules
    if (character.attributes.gender) {
      rules.push({
        id: `gender_${character.id}`,
        name: 'Gender Consistency',
        description: 'Character gender must remain consistent',
        validator: (content: string) => this.validateGenderConsistency(content, character.attributes.gender!),
        isActive: true
      })
    }

    // Relationship consistency rules
    if (character.relationships.length > 0) {
      rules.push({
        id: `relationships_${character.id}`,
        name: 'Relationship Consistency',
        description: 'Character relationships must remain consistent with established dynamics',
        validator: (content: string) => this.validateRelationshipConsistency(content, character.relationships),
        isActive: true
      })
    }

    return rules
  }

  /**
   * Validates appearance consistency
   */
  private static validateAppearanceConsistency(content: string, expectedAppearance: string): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    const extractedAppearance = this.extractAppearanceDescription(content)
    const expectedTraits = expectedAppearance.split(',').map(t => t.trim().toLowerCase())
    const actualTraits = extractedAppearance.split(',').map(t => t.trim().toLowerCase())

    // Check for conflicting appearance descriptions
    const conflicts = this.findAppearanceConflicts(expectedTraits, actualTraits)
    
    for (const conflict of conflicts) {
      errors.push({
        code: 'APPEARANCE_CONFLICT',
        message: `Character appearance conflict: expected "${conflict.expected}" but found "${conflict.actual}"`,
        field: 'appearance',
        severity: 'error'
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Finds conflicts between expected and actual appearance traits
   */
  private static findAppearanceConflicts(expected: string[], actual: string[]): Array<{expected: string, actual: string}> {
    const conflicts: Array<{expected: string, actual: string}> = []
    
    // Define conflicting trait pairs
    const conflictPairs = [
      ['tall', 'short'], ['高', '矮'],
      ['fat', 'thin'], ['胖', '瘦'],
      ['young', 'old'], ['年轻', '年老'],
      ['beautiful', 'ugly'], ['美', '丑']
    ]

    for (const expectedTrait of expected) {
      for (const actualTrait of actual) {
        for (const [trait1, trait2] of conflictPairs) {
          if ((expectedTrait.includes(trait1) && actualTrait.includes(trait2)) ||
              (expectedTrait.includes(trait2) && actualTrait.includes(trait1))) {
            conflicts.push({ expected: expectedTrait, actual: actualTrait })
          }
        }
      }
    }

    return conflicts
  }

  /**
   * Validates personality consistency
   */
  private static validatePersonalityConsistency(content: string, expectedPersonality: string): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    const extractedPersonality = this.extractPersonalityTraits(content)
    const expectedTraits = expectedPersonality.split(',').map(t => t.trim().toLowerCase())
    const actualTraits = extractedPersonality.split(',').map(t => t.trim().toLowerCase())

    // Check for conflicting personality traits
    const conflicts = this.findPersonalityConflicts(expectedTraits, actualTraits)
    
    for (const conflict of conflicts) {
      errors.push({
        code: 'PERSONALITY_CONFLICT',
        message: `Character personality conflict: expected "${conflict.expected}" but found "${conflict.actual}"`,
        field: 'personality',
        severity: 'error'
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Finds conflicts between expected and actual personality traits
   */
  private static findPersonalityConflicts(expected: string[], actual: string[]): Array<{expected: string, actual: string}> {
    const conflicts: Array<{expected: string, actual: string}> = []
    
    // Define conflicting personality pairs
    const conflictPairs = [
      ['kind', 'evil'], ['善良', '邪恶'],
      ['brave', 'coward'], ['勇敢', '胆小'],
      ['gentle', 'rough'], ['温柔', '粗暴'],
      ['quiet', 'loud'], ['安静', '吵闹'],
      ['happy', 'sad'], ['快乐', '悲伤'],
      ['calm', 'angry'], ['平静', '愤怒'],
      ['confident', 'shy'], ['自信', '害羞'],
      ['outgoing', 'introverted'], ['外向', '内向'],
      ['patient', 'impatient'], ['耐心', '急躁'],
      ['honest', 'dishonest'], ['诚实', '虚伪']
    ]

    for (const expectedTrait of expected) {
      for (const actualTrait of actual) {
        for (const [trait1, trait2] of conflictPairs) {
          if ((expectedTrait.includes(trait1) && actualTrait.includes(trait2)) ||
              (expectedTrait.includes(trait2) && actualTrait.includes(trait1))) {
            conflicts.push({ expected: expectedTrait, actual: actualTrait })
          }
        }
      }
    }

    return conflicts
  }

  /**
   * Validates age consistency
   */
  private static validateAgeConsistency(content: string, expectedAge: number): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    const extractedAge = this.extractAge(content)
    
    if (extractedAge !== undefined) {
      const ageDifference = Math.abs(extractedAge - expectedAge)
      
      if (ageDifference > 5) {
        errors.push({
          code: 'AGE_CONFLICT',
          message: `Character age conflict: expected around ${expectedAge} but found ${extractedAge}`,
          field: 'age',
          severity: 'error'
        })
      } else if (ageDifference > 2) {
        warnings.push({
          code: 'AGE_INCONSISTENCY',
          message: `Character age inconsistency: expected ${expectedAge} but found ${extractedAge}`,
          field: 'age',
          severity: 'warning'
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validates gender consistency
   */
  private static validateGenderConsistency(content: string, expectedGender: string): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    const extractedGender = this.extractGender(content, '')
    
    if (extractedGender && extractedGender !== expectedGender) {
      errors.push({
        code: 'GENDER_CONFLICT',
        message: `Character gender conflict: expected "${expectedGender}" but found "${extractedGender}"`,
        field: 'gender',
        severity: 'error'
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validates relationship consistency
   */
  private static validateRelationshipConsistency(content: string, expectedRelationships: Relationship[]): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    // This is a simplified validation - in a real implementation, 
    // we would check if the relationships mentioned in content match expected relationships
    // For now, we'll just return valid
    
    return {
      isValid: true,
      errors,
      warnings
    }
  }

  /**
   * Stores a locked profile (placeholder for persistence layer)
   */
  private static storeLockedProfile(profile: LockedProfile): void {
    const key = `locked_profile_${profile.characterId}`
    localStorage.setItem(key, JSON.stringify(profile))
    
    // Also maintain a list of all locked profiles
    const profilesList = this.getStoredProfilesList()
    const existingIndex = profilesList.findIndex(p => p.characterId === profile.characterId)
    
    if (existingIndex >= 0) {
      profilesList[existingIndex] = profile
    } else {
      profilesList.push(profile)
    }
    
    localStorage.setItem('locked_profiles_list', JSON.stringify(profilesList))
  }

  /**
   * Retrieves a locked profile
   */
  static getLockedProfile(characterId: string): LockedProfile | null {
    const key = `locked_profile_${characterId}`
    const stored = localStorage.getItem(key)
    
    if (!stored) {
      return null
    }
    
    try {
      return JSON.parse(stored) as LockedProfile
    } catch (error) {
      console.error('Failed to parse locked profile:', error)
      return null
    }
  }

  /**
   * Gets list of all stored profiles
   */
  private static getStoredProfilesList(): LockedProfile[] {
    const stored = localStorage.getItem('locked_profiles_list')
    return stored ? JSON.parse(stored) : []
  }

  /**
   * Updates a locked profile
   */
  static updateLockedProfile(characterId: string, updates: Partial<LockedProfile>): LockedProfile | null {
    const existingProfile = this.getLockedProfile(characterId)
    
    if (!existingProfile) {
      return null
    }
    
    const updatedProfile = { ...existingProfile, ...updates }
    this.storeLockedProfile(updatedProfile)
    
    return updatedProfile
  }

  /**
   * Unlocks a character profile
   */
  static unlockProfile(characterId: string): boolean {
    const profile = this.getLockedProfile(characterId)
    
    if (!profile) {
      return false
    }
    
    profile.isLocked = false
    this.storeLockedProfile(profile)
    
    return true
  }

  /**
   * Creates character relationship mapping
   */
  static createRelationshipMapping(characters: Character[]): Map<string, Relationship[]> {
    const relationshipMap = new Map<string, Relationship[]>()
    
    for (const character of characters) {
      relationshipMap.set(character.id, character.relationships)
    }
    
    return relationshipMap
  }

  /**
   * Updates character relationship mapping when new relationships are discovered
   */
  static updateRelationshipMapping(
    relationshipMap: Map<string, Relationship[]>, 
    newRelationship: Relationship
  ): void {
    const fromCharacterRelationships = relationshipMap.get(newRelationship.fromCharacterId) || []
    
    // Check if relationship already exists
    const existingRelationship = fromCharacterRelationships.find(
      r => r.toCharacterId === newRelationship.toCharacterId
    )
    
    if (existingRelationship) {
      // Update existing relationship
      existingRelationship.relationshipType = newRelationship.relationshipType
      existingRelationship.description = newRelationship.description
      existingRelationship.strength = Math.max(existingRelationship.strength || 0, newRelationship.strength || 0)
    } else {
      // Add new relationship
      fromCharacterRelationships.push(newRelationship)
    }
    
    relationshipMap.set(newRelationship.fromCharacterId, fromCharacterRelationships)
  }

  // ===== CHARACTER CONSISTENCY ENFORCEMENT =====

  /**
   * Validates character consistency across video generation content
   */
  static validateCharacterConsistency(
    content: string, 
    characterId: string, 
    lockedProfiles: LockedProfile[]
  ): ConsistencyReport {
    const lockedProfile = lockedProfiles.find(p => p.characterId === characterId)
    
    if (!lockedProfile || !lockedProfile.isLocked) {
      return {
        characterId,
        violations: [],
        score: 100,
        recommendations: ['Character profile is not locked - consider locking for consistency enforcement']
      }
    }

    const violations: ConsistencyViolation[] = []
    const recommendations: string[] = []

    // Run all consistency rules
    for (const rule of lockedProfile.consistencyRules) {
      if (rule.isActive) {
        const validationResult = rule.validator(content)
        
        if (!validationResult.isValid) {
          for (const error of validationResult.errors) {
            violations.push({
              type: this.mapErrorToViolationType(error.code),
              description: error.message,
              severity: error.severity === 'error' ? 'high' : 'medium',
              affectedScenes: [content.substring(0, 50) + '...'] // Simplified - would need scene IDs
            })
          }
        }

        // Add warnings as recommendations
        for (const warning of validationResult.warnings) {
          recommendations.push(warning.message)
        }
      }
    }

    // Calculate consistency score
    const score = this.calculateConsistencyScore(violations)

    return {
      characterId,
      violations,
      score,
      recommendations
    }
  }

  /**
   * Maps error codes to violation types
   */
  private static mapErrorToViolationType(errorCode: string): 'visual' | 'behavioral' | 'dialogue' {
    if (errorCode.includes('APPEARANCE') || errorCode.includes('AGE') || errorCode.includes('GENDER')) {
      return 'visual'
    } else if (errorCode.includes('PERSONALITY') || errorCode.includes('RELATIONSHIP')) {
      return 'behavioral'
    } else {
      return 'dialogue'
    }
  }

  /**
   * Calculates consistency score based on violations
   */
  private static calculateConsistencyScore(violations: ConsistencyViolation[]): number {
    if (violations.length === 0) {
      return 100
    }

    let totalDeduction = 0
    
    for (const violation of violations) {
      switch (violation.severity) {
        case 'high':
          totalDeduction += 20
          break
        case 'medium':
          totalDeduction += 10
          break
        case 'low':
          totalDeduction += 5
          break
      }
    }

    return Math.max(0, 100 - totalDeduction)
  }

  /**
   * Enforces character consistency constraints during content generation
   */
  static enforceConsistencyConstraints(
    generatedContent: string, 
    characterId: string, 
    lockedProfiles: LockedProfile[]
  ): { isValid: boolean; correctedContent?: string; violations: ConsistencyViolation[] } {
    const consistencyReport = this.validateCharacterConsistency(generatedContent, characterId, lockedProfiles)
    
    if (consistencyReport.violations.length === 0) {
      return {
        isValid: true,
        violations: []
      }
    }

    // Attempt to correct high-severity violations
    let correctedContent = generatedContent
    const remainingViolations: ConsistencyViolation[] = []

    for (const violation of consistencyReport.violations) {
      if (violation.severity === 'high') {
        const correction = this.attemptViolationCorrection(correctedContent, violation, characterId, lockedProfiles)
        if (correction.success) {
          correctedContent = correction.correctedContent!
        } else {
          remainingViolations.push(violation)
        }
      } else {
        remainingViolations.push(violation)
      }
    }

    return {
      isValid: remainingViolations.length === 0,
      correctedContent: correctedContent !== generatedContent ? correctedContent : undefined,
      violations: remainingViolations
    }
  }

  /**
   * Attempts to correct a consistency violation
   */
  private static attemptViolationCorrection(
    content: string, 
    violation: ConsistencyViolation, 
    characterId: string, 
    lockedProfiles: LockedProfile[]
  ): { success: boolean; correctedContent?: string } {
    const lockedProfile = lockedProfiles.find(p => p.characterId === characterId)
    
    if (!lockedProfile) {
      return { success: false }
    }

    let correctedContent = content

    // Attempt corrections based on violation type
    switch (violation.type) {
      case 'visual':
        correctedContent = this.correctVisualViolation(content, violation, lockedProfile)
        break
      case 'behavioral':
        correctedContent = this.correctBehavioralViolation(content, violation, lockedProfile)
        break
      case 'dialogue':
        correctedContent = this.correctDialogueViolation(content, violation, lockedProfile)
        break
    }

    return {
      success: correctedContent !== content,
      correctedContent: correctedContent !== content ? correctedContent : undefined
    }
  }

  /**
   * Corrects visual consistency violations
   */
  private static correctVisualViolation(
    content: string, 
    violation: ConsistencyViolation, 
    lockedProfile: LockedProfile
  ): string {
    let correctedContent = content

    // Simple correction approach - replace conflicting descriptions
    if (violation.description.includes('appearance conflict')) {
      // Extract the expected appearance from locked profile
      const expectedAppearance = lockedProfile.lockedAttributes.appearance
      
      if (expectedAppearance) {
        // This is a simplified correction - in practice, would need more sophisticated NLP
        const appearanceTraits = expectedAppearance.split(',').map(t => t.trim())
        
        // Replace conflicting traits (simplified approach)
        for (const trait of appearanceTraits) {
          if (trait.includes('tall') || trait.includes('高')) {
            correctedContent = correctedContent.replace(/short|矮/gi, trait)
          }
          if (trait.includes('young') || trait.includes('年轻')) {
            correctedContent = correctedContent.replace(/old|年老/gi, trait)
          }
        }
      }
    }

    return correctedContent
  }

  /**
   * Corrects behavioral consistency violations
   */
  private static correctBehavioralViolation(
    content: string, 
    violation: ConsistencyViolation, 
    lockedProfile: LockedProfile
  ): string {
    let correctedContent = content

    // Simple correction approach for personality conflicts
    if (violation.description.includes('personality conflict')) {
      const expectedPersonality = lockedProfile.lockedAttributes.personality
      
      if (expectedPersonality) {
        const personalityTraits = expectedPersonality.split(',').map(t => t.trim())
        
        // Replace conflicting personality traits (simplified approach)
        for (const trait of personalityTraits) {
          if (trait.includes('kind') || trait.includes('善良')) {
            correctedContent = correctedContent.replace(/evil|邪恶/gi, trait)
          }
          if (trait.includes('brave') || trait.includes('勇敢')) {
            correctedContent = correctedContent.replace(/coward|胆小/gi, trait)
          }
        }
      }
    }

    return correctedContent
  }

  /**
   * Corrects dialogue consistency violations
   */
  private static correctDialogueViolation(
    content: string, 
    violation: ConsistencyViolation, 
    lockedProfile: LockedProfile
  ): string {
    // For now, return unchanged - dialogue correction would require more sophisticated NLP
    return content
  }

  /**
   * Maintains relationship dynamics during content generation
   */
  static maintainRelationshipDynamics(
    content: string, 
    characterIds: string[], 
    relationshipMap: Map<string, Relationship[]>
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    // Check if character interactions in content match established relationships
    for (let i = 0; i < characterIds.length; i++) {
      for (let j = i + 1; j < characterIds.length; j++) {
        const char1Id = characterIds[i]
        const char2Id = characterIds[j]
        
        const char1Relationships = relationshipMap.get(char1Id) || []
        const relationshipToChar2 = char1Relationships.find(r => r.toCharacterId === char2Id)
        
        if (relationshipToChar2) {
          const interactionValidation = this.validateCharacterInteraction(
            content, 
            char1Id, 
            char2Id, 
            relationshipToChar2
          )
          
          errors.push(...interactionValidation.errors)
          warnings.push(...interactionValidation.warnings)
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validates character interaction against established relationship
   */
  private static validateCharacterInteraction(
    content: string, 
    char1Id: string, 
    char2Id: string, 
    relationship: Relationship
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    // This is a simplified validation - in practice would need more sophisticated analysis
    // For now, we'll check for obvious conflicts based on relationship type
    
    const relationshipType = relationship.relationshipType.toLowerCase()
    
    if (relationshipType === 'enemy' || relationshipType === 'rival') {
      // Check if content shows them being friendly
      if (/friend|friendly|kind|nice|love/i.test(content)) {
        warnings.push({
          code: 'RELATIONSHIP_INCONSISTENCY',
          message: `Characters ${char1Id} and ${char2Id} are established as enemies but content shows friendly interaction`,
          field: 'relationship',
          severity: 'warning'
        })
      }
    } else if (relationshipType === 'friend' || relationshipType === 'romantic_partner') {
      // Check if content shows them being hostile
      if (/enemy|hate|hostile|fight|attack/i.test(content)) {
        warnings.push({
          code: 'RELATIONSHIP_INCONSISTENCY',
          message: `Characters ${char1Id} and ${char2Id} are established as ${relationshipType} but content shows hostile interaction`,
          field: 'relationship',
          severity: 'warning'
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Creates validation rules for character attributes
   */
  static createAttributeValidationRules(character: Character): any[] {
    return this.generateConsistencyRules(character)
  }

  /**
   * Validates character attributes against rules
   */
  static validateCharacterAttributes(
    character: Character, 
    validationRules: any[]
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    for (const rule of validationRules) {
      if (rule.isActive) {
        // Create content string from character attributes for validation
        const attributeContent = [
          character.attributes.appearance,
          character.attributes.personality,
          character.attributes.age?.toString(),
          character.attributes.gender,
          character.attributes.occupation,
          character.attributes.background
        ].filter(Boolean).join(' ')

        const validationResult = rule.validator(attributeContent)
        
        errors.push(...validationResult.errors)
        warnings.push(...validationResult.warnings)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // ===== DYNAMIC CHARACTER NETWORK INTEGRATION =====

  /**
   * Integrates new characters into existing character network
   */
  static integrateNewCharacter(
    newCharacter: Character, 
    existingCharacters: Character[], 
    chapters: Chapter[]
  ): { 
    updatedCharacters: Character[]; 
    newRelationships: Relationship[]; 
    conflicts: string[] 
  } {
    const conflicts: string[] = []
    const newRelationships: Relationship[] = []
    const updatedCharacters = [...existingCharacters]

    // Check for name conflicts
    const nameConflict = existingCharacters.find(c => 
      this.normalizeCharacterName(c.name) === this.normalizeCharacterName(newCharacter.name)
    )

    if (nameConflict) {
      conflicts.push(`Character name conflict: "${newCharacter.name}" already exists as "${nameConflict.name}"`)
      // Resolve by adding suffix
      newCharacter.name = `${newCharacter.name}_${Date.now()}`
      newCharacter.id = this.generateCharacterId(newCharacter.name)
    }

    // Identify relationships with existing characters
    const allText = chapters.map(c => c.content).join(' ')
    
    for (const existingCharacter of existingCharacters) {
      const relationship = this.analyzeRelationship(newCharacter.name, existingCharacter.name, allText)
      
      if (relationship) {
        // Create bidirectional relationship
        const newToExisting: Relationship = {
          id: `rel_${newCharacter.id}_${existingCharacter.id}`,
          fromCharacterId: newCharacter.id,
          toCharacterId: existingCharacter.id,
          relationshipType: relationship.type,
          description: relationship.description,
          strength: relationship.strength
        }

        const existingToNew: Relationship = {
          id: `rel_${existingCharacter.id}_${newCharacter.id}`,
          fromCharacterId: existingCharacter.id,
          toCharacterId: newCharacter.id,
          relationshipType: relationship.reciprocal || relationship.type,
          description: relationship.description,
          strength: relationship.strength
        }

        newCharacter.relationships.push(newToExisting)
        existingCharacter.relationships.push(existingToNew)
        
        newRelationships.push(newToExisting, existingToNew)
      }
    }

    // Check for relationship conflicts
    const relationshipConflicts = this.detectRelationshipConflicts(newCharacter, existingCharacters)
    conflicts.push(...relationshipConflicts)

    // Add new character to the list
    updatedCharacters.push(newCharacter)

    return {
      updatedCharacters,
      newRelationships,
      conflicts
    }
  }

  /**
   * Detects conflicts in character relationships
   */
  private static detectRelationshipConflicts(
    newCharacter: Character, 
    existingCharacters: Character[]
  ): string[] {
    const conflicts: string[] = []

    for (const relationship of newCharacter.relationships) {
      const targetCharacter = existingCharacters.find(c => c.id === relationship.toCharacterId)
      
      if (targetCharacter) {
        // Check for conflicting relationship types
        const existingRelationship = targetCharacter.relationships.find(
          r => r.toCharacterId === newCharacter.id
        )

        if (existingRelationship && this.areRelationshipsConflicting(relationship, existingRelationship)) {
          conflicts.push(
            `Relationship conflict between "${newCharacter.name}" and "${targetCharacter.name}": ` +
            `new relationship "${relationship.relationshipType}" conflicts with existing "${existingRelationship.relationshipType}"`
          )
        }
      }
    }

    return conflicts
  }

  /**
   * Checks if two relationships are conflicting
   */
  private static areRelationshipsConflicting(rel1: Relationship, rel2: Relationship): boolean {
    const conflictingPairs = [
      ['friend', 'enemy'],
      ['romantic_partner', 'enemy'],
      ['family', 'enemy'],
      ['boss', 'subordinate'], // These should be reciprocal, not conflicting
      ['parent', 'child'] // These should be reciprocal, not conflicting
    ]

    const type1 = rel1.relationshipType.toLowerCase()
    const type2 = rel2.relationshipType.toLowerCase()

    return conflictingPairs.some(([t1, t2]) => 
      (type1.includes(t1) && type2.includes(t2)) || 
      (type1.includes(t2) && type2.includes(t1))
    )
  }

  /**
   * Updates relationship network when new relationships are discovered
   */
  static updateCharacterNetwork(
    characters: Character[], 
    newRelationships: Relationship[]
  ): Character[] {
    const characterMap = new Map(characters.map(c => [c.id, c]))

    for (const relationship of newRelationships) {
      const fromCharacter = characterMap.get(relationship.fromCharacterId)
      
      if (fromCharacter) {
        // Check if relationship already exists
        const existingRelationship = fromCharacter.relationships.find(
          r => r.toCharacterId === relationship.toCharacterId
        )

        if (existingRelationship) {
          // Update existing relationship
          existingRelationship.relationshipType = relationship.relationshipType
          existingRelationship.description = relationship.description
          existingRelationship.strength = Math.max(
            existingRelationship.strength || 0, 
            relationship.strength || 0
          )
        } else {
          // Add new relationship
          fromCharacter.relationships.push(relationship)
        }
      }
    }

    return Array.from(characterMap.values())
  }

  /**
   * Resolves conflicts in character interactions
   */
  static resolveCharacterInteractionConflicts(
    characters: Character[], 
    conflictReports: string[]
  ): { 
    resolvedCharacters: Character[]; 
    resolutionActions: string[]; 
    unresolvedConflicts: string[] 
  } {
    const resolvedCharacters = [...characters]
    const resolutionActions: string[] = []
    const unresolvedConflicts: string[] = []

    for (const conflict of conflictReports) {
      const resolution = this.attemptConflictResolution(conflict, resolvedCharacters)
      
      if (resolution.success) {
        resolutionActions.push(resolution.action!)
        // Apply resolution changes to characters
        if (resolution.updatedCharacters) {
          resolution.updatedCharacters.forEach((updatedChar, index) => {
            const charIndex = resolvedCharacters.findIndex(c => c.id === updatedChar.id)
            if (charIndex >= 0) {
              resolvedCharacters[charIndex] = updatedChar
            }
          })
        }
      } else {
        unresolvedConflicts.push(conflict)
      }
    }

    return {
      resolvedCharacters,
      resolutionActions,
      unresolvedConflicts
    }
  }

  /**
   * Attempts to resolve a specific character conflict
   */
  private static attemptConflictResolution(
    conflict: string, 
    characters: Character[]
  ): { 
    success: boolean; 
    action?: string; 
    updatedCharacters?: Character[] 
  } {
    // Name conflict resolution
    if (conflict.includes('name conflict')) {
      // Already handled in integrateNewCharacter - mark as resolved
      return {
        success: true,
        action: 'Resolved name conflict by adding unique suffix'
      }
    }

    // Relationship conflict resolution
    if (conflict.includes('Relationship conflict')) {
      const resolution = this.resolveRelationshipConflict(conflict, characters)
      return resolution
    }

    // Default: cannot resolve
    return { success: false }
  }

  /**
   * Resolves relationship conflicts between characters
   */
  private static resolveRelationshipConflict(
    conflict: string, 
    characters: Character[]
  ): { 
    success: boolean; 
    action?: string; 
    updatedCharacters?: Character[] 
  } {
    // Extract character names from conflict message (simplified parsing)
    const nameMatches = conflict.match(/"([^"]+)"/g)
    
    if (!nameMatches || nameMatches.length < 2) {
      return { success: false }
    }

    const char1Name = nameMatches[0].replace(/"/g, '')
    const char2Name = nameMatches[1].replace(/"/g, '')

    const char1 = characters.find(c => c.name === char1Name)
    const char2 = characters.find(c => c.name === char2Name)

    if (!char1 || !char2) {
      return { success: false }
    }

    // Simple resolution strategy: keep the stronger relationship
    const char1ToChar2 = char1.relationships.find(r => r.toCharacterId === char2.id)
    const char2ToChar1 = char2.relationships.find(r => r.toCharacterId === char1.id)

    if (char1ToChar2 && char2ToChar1) {
      const strongerRelationship = (char1ToChar2.strength || 0) >= (char2ToChar1.strength || 0) 
        ? char1ToChar2 
        : char2ToChar1

      // Update both relationships to match the stronger one
      char1ToChar2.relationshipType = strongerRelationship.relationshipType
      char2ToChar1.relationshipType = this.getReciprocalRelationshipType(strongerRelationship.relationshipType)

      return {
        success: true,
        action: `Resolved relationship conflict by using stronger relationship: ${strongerRelationship.relationshipType}`,
        updatedCharacters: [char1, char2]
      }
    }

    return { success: false }
  }

  /**
   * Gets reciprocal relationship type
   */
  private static getReciprocalRelationshipType(relationshipType: string): string {
    const reciprocalMap: Record<string, string> = {
      'parent': 'child',
      'child': 'parent',
      'boss': 'subordinate',
      'subordinate': 'boss',
      'teacher': 'student',
      'student': 'teacher'
    }

    return reciprocalMap[relationshipType.toLowerCase()] || relationshipType
  }

  /**
   * Builds character network graph for visualization and analysis
   */
  static buildCharacterNetworkGraph(characters: Character[]): {
    nodes: Array<{ id: string; name: string; role: CharacterRole; importance: number }>
    edges: Array<{ from: string; to: string; type: string; strength: number }>
  } {
    const nodes = characters.map(character => ({
      id: character.id,
      name: character.name,
      role: character.role,
      importance: this.calculateCharacterImportance(character)
    }))

    const edges: Array<{ from: string; to: string; type: string; strength: number }> = []
    
    for (const character of characters) {
      for (const relationship of character.relationships) {
        // Avoid duplicate edges by only adding if from < to (lexicographically)
        if (character.id < relationship.toCharacterId) {
          edges.push({
            from: character.id,
            to: relationship.toCharacterId,
            type: relationship.relationshipType,
            strength: relationship.strength || 1
          })
        }
      }
    }

    return { nodes, edges }
  }

  /**
   * Calculates character importance based on role and relationships
   */
  private static calculateCharacterImportance(character: Character): number {
    let importance = 0

    // Base importance by role
    switch (character.role) {
      case 'protagonist':
        importance += 100
        break
      case 'antagonist':
        importance += 80
        break
      case 'supporting':
        importance += 50
        break
      case 'minor':
        importance += 20
        break
    }

    // Add importance based on number of relationships
    importance += character.relationships.length * 5

    // Add importance based on number of appearances
    importance += character.appearances.length * 2

    return importance
  }

  /**
   * Analyzes character network for potential issues
   */
  static analyzeCharacterNetwork(characters: Character[]): {
    isolatedCharacters: Character[]
    overconnectedCharacters: Character[]
    relationshipInconsistencies: string[]
    networkHealth: number
  } {
    const isolatedCharacters = characters.filter(c => c.relationships.length === 0)
    const overconnectedCharacters = characters.filter(c => c.relationships.length > 10)
    const relationshipInconsistencies: string[] = []

    // Check for relationship inconsistencies
    for (const character of characters) {
      for (const relationship of character.relationships) {
        const targetCharacter = characters.find(c => c.id === relationship.toCharacterId)
        
        if (targetCharacter) {
          const reciprocalRelationship = targetCharacter.relationships.find(
            r => r.toCharacterId === character.id
          )

          if (!reciprocalRelationship) {
            relationshipInconsistencies.push(
              `Missing reciprocal relationship: ${character.name} -> ${targetCharacter.name} (${relationship.relationshipType})`
            )
          }
        }
      }
    }

    // Calculate network health score
    const totalCharacters = characters.length
    const connectedCharacters = characters.filter(c => c.relationships.length > 0).length
    const connectionRatio = totalCharacters > 0 ? connectedCharacters / totalCharacters : 0
    const inconsistencyPenalty = relationshipInconsistencies.length * 5
    
    const networkHealth = Math.max(0, Math.min(100, (connectionRatio * 100) - inconsistencyPenalty))

    return {
      isolatedCharacters,
      overconnectedCharacters,
      relationshipInconsistencies,
      networkHealth
    }
  }
}