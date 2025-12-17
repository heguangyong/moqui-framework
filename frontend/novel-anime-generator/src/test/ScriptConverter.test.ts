import { describe, it, expect, beforeEach } from 'vitest'
import { ScriptConverter } from '../services/ScriptConverter'
import type { 
  Episode, 
  Scene, 
  Character, 
  LockedProfile, 
  DialogueBlock, 
  SceneDescription,
  CharacterAttributes,
  ValidationRule
} from '../types/core'

describe('ScriptConverter', () => {
  let mockEpisode: Episode
  let mockCharacters: Character[]
  let mockLockedProfiles: LockedProfile[]
  let mockScene: Scene

  beforeEach(() => {
    mockScene = {
      id: 'scene_1',
      chapterId: 'chapter_1',
      sceneNumber: 1,
      content: 'John walked into the room. "Hello, Mary," he said with a smile. Mary looked up from her book. "Oh, hello John! I didn\'t hear you come in," she replied cheerfully.',
      setting: 'Living Room',
      mood: 'friendly',
      characters: ['char_1', 'char_2']
    }

    mockEpisode = {
      id: 'episode_1',
      episodeNumber: 1,
      title: 'The Meeting',
      summary: 'John and Mary meet in the living room',
      scenes: [mockScene],
      duration: 300,
      keyEvents: [],
      status: 'draft'
    }

    mockCharacters = [
      {
        id: 'char_1',
        name: 'John',
        role: 'protagonist',
        attributes: {
          appearance: 'tall, dark hair, kind eyes',
          personality: 'friendly, confident, outgoing'
        } as CharacterAttributes,
        relationships: [],
        appearances: []
      },
      {
        id: 'char_2',
        name: 'Mary',
        role: 'supporting',
        attributes: {
          appearance: 'petite, blonde hair, bright smile',
          personality: 'cheerful, intelligent, bookish'
        } as CharacterAttributes,
        relationships: [],
        appearances: []
      }
    ]

    mockLockedProfiles = [
      {
        characterId: 'char_1',
        lockedAttributes: mockCharacters[0].attributes,
        consistencyRules: [] as ValidationRule[],
        isLocked: true
      },
      {
        characterId: 'char_2',
        lockedAttributes: mockCharacters[1].attributes,
        consistencyRules: [] as ValidationRule[],
        isLocked: true
      }
    ]
  })

  describe('convertToScript', () => {
    it('should convert episode to screenplay format', () => {
      const screenplay = ScriptConverter.convertToScript(mockEpisode, mockCharacters, mockLockedProfiles)

      expect(screenplay.id).toBe('screenplay_episode_1')
      expect(screenplay.episodeId).toBe('episode_1')
      expect(screenplay.format).toBe('custom')
      expect(screenplay.scenes).toHaveLength(1)
      expect(screenplay.dialogueBlocks.length).toBeGreaterThan(0)
      expect(screenplay.sceneDescriptions).toHaveLength(1)
      expect(screenplay.content).toContain('INT./EXT. LIVING ROOM')
    })

    it('should generate proper scene headings', () => {
      const screenplay = ScriptConverter.convertToScript(mockEpisode, mockCharacters, mockLockedProfiles)
      const scene = screenplay.scenes[0]

      expect(scene.heading).toMatch(/INT\.\/EXT\. LIVING ROOM - (DAY|NIGHT|MORNING|AFTERNOON)/)
      expect(scene.sceneNumber).toBe(1)
      expect(scene.characters).toEqual(['char_1', 'char_2'])
      expect(scene.setting).toBe('Living Room')
    })

    it('should handle multiple scenes in episode', () => {
      const secondScene: Scene = {
        id: 'scene_2',
        chapterId: 'chapter_1',
        sceneNumber: 2,
        content: 'Later that evening, John and Mary sat by the fireplace.',
        setting: 'Fireplace Area',
        characters: ['char_1', 'char_2']
      }

      mockEpisode.scenes.push(secondScene)
      const screenplay = ScriptConverter.convertToScript(mockEpisode, mockCharacters, mockLockedProfiles)

      expect(screenplay.scenes).toHaveLength(2)
      expect(screenplay.scenes[1].heading).toContain('FIREPLACE AREA')
    })
  })

  describe('extractDialogue', () => {
    it('should extract dialogue with standard quotes', () => {
      const content = 'John said "Hello there" and Mary replied "Hi John!"'
      const dialogueBlocks = ScriptConverter.extractDialogue(content, mockCharacters)

      expect(dialogueBlocks).toHaveLength(2)
      expect(dialogueBlocks[0].text).toBe('Hello there')
      expect(dialogueBlocks[1].text).toBe('Hi John!')
    })

    it('should extract dialogue with single quotes', () => {
      const content = "John said 'Hello there' and Mary replied 'Hi John!'"
      const dialogueBlocks = ScriptConverter.extractDialogue(content, mockCharacters)

      expect(dialogueBlocks).toHaveLength(2)
      expect(dialogueBlocks[0].text).toBe('Hello there')
      expect(dialogueBlocks[1].text).toBe('Hi John!')
    })

    it('should identify character speakers', () => {
      const content = 'John said "Hello Mary" and Mary replied "Hello John"'
      const dialogueBlocks = ScriptConverter.extractDialogue(content, mockCharacters)

      expect(dialogueBlocks[0].characterId).toBe('char_1') // John
      expect(dialogueBlocks[1].characterId).toBe('char_2') // Mary
    })

    it('should extract emotional context', () => {
      const content = 'John said angrily "I can\'t believe this!" Mary replied sadly "I\'m sorry"'
      const dialogueBlocks = ScriptConverter.extractDialogue(content, mockCharacters)

      expect(dialogueBlocks[0].emotion).toBe('anger')
      expect(dialogueBlocks[1].emotion).toBe('sadness')
    })

    it('should handle dialogue without clear speakers', () => {
      const content = '"Hello there" someone said'
      const dialogueBlocks = ScriptConverter.extractDialogue(content, mockCharacters)

      expect(dialogueBlocks).toHaveLength(1)
      expect(dialogueBlocks[0].characterId).toBe('char_1') // Defaults to first character
    })

    it('should extract parenthetical directions', () => {
      const content = 'John said (whispering) "Come here"'
      const dialogueBlocks = ScriptConverter.extractDialogue(content, mockCharacters)

      expect(dialogueBlocks[0].direction).toBe('whispering')
    })
  })

  describe('generateSceneDescriptions', () => {
    it('should generate visual and action descriptions', () => {
      const descriptions = ScriptConverter.generateSceneDescriptions(mockScene, mockCharacters)

      expect(descriptions).toHaveLength(1)
      const desc = descriptions[0]
      expect(desc.sceneId).toBe('scene_1')
      expect(desc.visualDescription).toContain('Living Room')
      expect(desc.visualDescription).toContain('John')
      expect(desc.visualDescription).toContain('Mary')
      expect(desc.actionDescription).toContain('walks')
      expect(desc.mood).toBe('friendly')
    })

    it('should extract mood from content when not provided', () => {
      const sceneWithoutMood: Scene = {
        ...mockScene,
        mood: undefined,
        content: 'There was tension in the air as John nervously approached Mary.'
      }

      const descriptions = ScriptConverter.generateSceneDescriptions(sceneWithoutMood, mockCharacters)
      expect(descriptions[0].mood).toBe('tense')
    })

    it('should handle action-heavy scenes', () => {
      const actionScene: Scene = {
        ...mockScene,
        content: 'John ran quickly across the room, jumped over the table, and grabbed the keys.'
      }

      const descriptions = ScriptConverter.generateSceneDescriptions(actionScene, mockCharacters)
      expect(descriptions[0].actionDescription).toContain('runs')
      expect(descriptions[0].actionDescription).toContain('jumps')
      expect(descriptions[0].actionDescription).toContain('grabs')
    })

    it('should provide mood-appropriate visual elements', () => {
      const romanticScene: Scene = {
        ...mockScene,
        content: 'John looked lovingly into Mary\'s eyes as they shared a tender moment.'
      }

      const descriptions = ScriptConverter.generateSceneDescriptions(romanticScene, mockCharacters)
      expect(descriptions[0].mood).toBe('romantic')
      expect(descriptions[0].visualDescription.toLowerCase()).toContain('warm')
    })
  })

  describe('validateCharacterVoiceConsistency', () => {
    let dialogueBlocks: DialogueBlock[]

    beforeEach(() => {
      dialogueBlocks = [
        {
          id: 'dialogue_1',
          characterId: 'char_1',
          text: 'Hello there, how are you doing today?',
          emotion: 'joy'
        },
        {
          id: 'dialogue_2',
          characterId: 'char_1',
          text: 'I am absolutely furious about this situation!',
          emotion: 'anger'
        },
        {
          id: 'dialogue_3',
          characterId: 'char_2',
          text: 'Oh my, that sounds wonderful!',
          emotion: 'joy'
        }
      ]
    })

    it('should validate consistent character voices', () => {
      // Modify character to be consistently cheerful
      mockCharacters[0].attributes.personality = 'cheerful, optimistic, friendly'
      mockLockedProfiles[0].lockedAttributes.personality = 'cheerful, optimistic, friendly'

      const consistentDialogue = [
        {
          id: 'dialogue_1',
          characterId: 'char_1',
          text: 'Hello there, how wonderful to see you!',
          emotion: 'joy'
        },
        {
          id: 'dialogue_2',
          characterId: 'char_1',
          text: 'What a beautiful day it is!',
          emotion: 'joy'
        }
      ]

      const result = ScriptConverter.validateCharacterVoiceConsistency(
        consistentDialogue, 
        mockCharacters, 
        mockLockedProfiles
      )

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect emotion inconsistencies', () => {
      // Set John as calm personality but give him angry dialogue
      mockCharacters[0].attributes.personality = 'calm, peaceful, serene'
      mockLockedProfiles[0].lockedAttributes.personality = 'calm, peaceful, serene'

      const result = ScriptConverter.validateCharacterVoiceConsistency(
        dialogueBlocks, 
        mockCharacters, 
        mockLockedProfiles
      )

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'VOICE_EMOTION_INCONSISTENT')).toBe(true)
    })

    it('should detect verbosity inconsistencies', () => {
      // Set character as terse but give verbose dialogue
      mockCharacters[0].attributes.personality = 'quiet, terse, reserved'
      mockLockedProfiles[0].lockedAttributes.personality = 'quiet, terse, reserved'

      const verboseDialogue = [
        {
          id: 'dialogue_1',
          characterId: 'char_1',
          text: 'Well, I must say that this is quite an extraordinary situation that we find ourselves in today, and I believe we should carefully consider all the various options and possibilities before making any hasty decisions.',
          emotion: 'joy'
        }
      ]

      const result = ScriptConverter.validateCharacterVoiceConsistency(
        verboseDialogue, 
        mockCharacters, 
        mockLockedProfiles
      )

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'VOICE_VERBOSITY_INCONSISTENT')).toBe(true)
    })

    it('should handle missing character profiles gracefully', () => {
      const dialogueWithUnknownCharacter = [
        {
          id: 'dialogue_1',
          characterId: 'unknown_char',
          text: 'Hello there',
          emotion: 'joy'
        }
      ]

      const result = ScriptConverter.validateCharacterVoiceConsistency(
        dialogueWithUnknownCharacter, 
        mockCharacters, 
        mockLockedProfiles
      )

      expect(result.isValid).toBe(true) // Should not fail for unknown characters
    })
  })

  describe('translateEmotionalBeats', () => {
    it('should translate emotional content to visual directions', () => {
      const content = 'John felt angry about the situation. Mary was sad to see him upset.'
      const directions = ScriptConverter.translateEmotionalBeats(content, mockCharacters)

      expect(directions).toHaveLength(2)
      expect(directions[0]).toContain('John')
      expect(directions[0]).toContain('fists') // Updated to match new format
      expect(directions[1]).toContain('Mary')
      expect(directions[1]).toContain('Shoulders') // Updated to match new format
    })

    it('should handle multiple emotions in single sentence', () => {
      const content = 'John was surprised and then became angry when he saw what happened.'
      const directions = ScriptConverter.translateEmotionalBeats(content, mockCharacters)

      expect(directions.length).toBeGreaterThan(0)
      expect(directions.some(d => d.includes('eyebrows') || d.includes('fists'))).toBe(true)
    })

    it('should provide generic directions when character not identified', () => {
      const content = 'Someone in the room felt very sad about the news.'
      const directions = ScriptConverter.translateEmotionalBeats(content, mockCharacters)

      expect(directions).toHaveLength(1)
      expect(directions[0]).toContain('Shoulders') // Updated to match new format
      expect(directions[0]).not.toContain('John')
      expect(directions[0]).not.toContain('Mary')
    })

    it('should handle content without emotional beats', () => {
      const content = 'John walked to the store and bought some groceries.'
      const directions = ScriptConverter.translateEmotionalBeats(content, mockCharacters)

      expect(directions).toHaveLength(0)
    })

    it('should detect emotional intensity levels', () => {
      const content = 'John was extremely angry about the situation. Mary felt slightly sad.'
      const directions = ScriptConverter.translateEmotionalBeats(content, mockCharacters)

      expect(directions).toHaveLength(2)
      expect(directions[0]).toContain('INTENSITY: HIGH') // extremely angry
      expect(directions[1]).toContain('INTENSITY: LOW') // slightly sad
    })

    it('should provide detailed visual directions with camera and lighting', () => {
      const content = 'John was furious about the situation.'
      const directions = ScriptConverter.translateEmotionalBeats(content, mockCharacters)

      expect(directions.length).toBeGreaterThan(0)
      expect(directions[0]).toContain('FACIAL:')
      expect(directions[0]).toContain('BODY:')
      expect(directions[0]).toContain('MOVEMENT:')
      expect(directions[0]).toContain('CAMERA:')
      expect(directions[0]).toContain('INTENSITY:')
    })

    it('should format emotional directions for production', () => {
      const directions = [
        'John - FACIAL: Eyes narrow | BODY: Fists clench | MOVEMENT: Quick steps | CAMERA: Close-up | INTENSITY: HIGH'
      ]
      const sceneContext = {
        setting: 'Office',
        timeOfDay: 'AFTERNOON',
        mood: 'tense'
      }

      const formatted = ScriptConverter.formatEmotionalDirectionsForProduction(directions, sceneContext)

      expect(formatted.sceneSetup).toContain('LOCATION: Office')
      expect(formatted.sceneSetup).toContain('TIME: AFTERNOON')
      expect(formatted.sceneSetup).toContain('MOOD: tense')
      expect(formatted.characterDirections.length).toBeGreaterThan(0) // At least some character directions
      expect(formatted.cameraInstructions).toHaveLength(1)
      expect(formatted.lightingNotes.length).toBeGreaterThan(0)
    })
  })

  describe('screenplay formatting', () => {
    it('should convert past tense to present tense', () => {
      const sceneWithPastTense: Scene = {
        ...mockScene,
        content: 'John walked into the room and sat down. He looked at Mary and smiled.'
      }

      const episode = { ...mockEpisode, scenes: [sceneWithPastTense] }
      const screenplay = ScriptConverter.convertToScript(episode, mockCharacters, mockLockedProfiles)

      expect(screenplay.content.toLowerCase()).toContain('walks')
      expect(screenplay.content.toLowerCase()).toContain('sits')
      expect(screenplay.content.toLowerCase()).toContain('looks')
    })

    it('should format dialogue with character names and emotions', () => {
      const screenplay = ScriptConverter.convertToScript(mockEpisode, mockCharacters, mockLockedProfiles)

      expect(screenplay.content).toContain('JOHN')
      expect(screenplay.content).toContain('MARY')
    })

    it('should include scene descriptions in formatted output', () => {
      const screenplay = ScriptConverter.convertToScript(mockEpisode, mockCharacters, mockLockedProfiles)

      expect(screenplay.content).toContain('LIVING ROOM')
      expect(screenplay.content).toContain('The scene takes place')
    })

    it('should separate scenes with dividers', () => {
      const secondScene: Scene = {
        id: 'scene_2',
        chapterId: 'chapter_1',
        sceneNumber: 2,
        content: 'Another scene content',
        setting: 'Kitchen',
        characters: ['char_1']
      }

      mockEpisode.scenes.push(secondScene)
      const screenplay = ScriptConverter.convertToScript(mockEpisode, mockCharacters, mockLockedProfiles)

      expect(screenplay.content).toContain('---')
    })
  })

  describe('edge cases', () => {
    it('should handle empty episode', () => {
      const emptyEpisode: Episode = {
        ...mockEpisode,
        scenes: []
      }

      const screenplay = ScriptConverter.convertToScript(emptyEpisode, mockCharacters, mockLockedProfiles)

      expect(screenplay.scenes).toHaveLength(0)
      expect(screenplay.dialogueBlocks).toHaveLength(0)
      expect(screenplay.sceneDescriptions).toHaveLength(0)
    })

    it('should handle scene without dialogue', () => {
      const noDialogueScene: Scene = {
        ...mockScene,
        content: 'John walked through the empty hallway. The silence was deafening.'
      }

      const episode = { ...mockEpisode, scenes: [noDialogueScene] }
      const screenplay = ScriptConverter.convertToScript(episode, mockCharacters, mockLockedProfiles)

      expect(screenplay.dialogueBlocks).toHaveLength(0)
      expect(screenplay.sceneDescriptions).toHaveLength(1)
    })

    it('should handle scene without characters', () => {
      const noCharacterScene: Scene = {
        ...mockScene,
        characters: [],
        content: 'The wind blew through the empty room.'
      }

      const episode = { ...mockEpisode, scenes: [noCharacterScene] }
      const screenplay = ScriptConverter.convertToScript(episode, [], [])

      expect(screenplay.scenes).toHaveLength(1)
      expect(screenplay.scenes[0].characters).toHaveLength(0)
    })

    it('should handle malformed dialogue', () => {
      const malformedContent = 'John said "Hello and then Mary said Hi but forgot to close the quote'
      const dialogueBlocks = ScriptConverter.extractDialogue(malformedContent, mockCharacters)

      // Should handle gracefully without crashing
      expect(Array.isArray(dialogueBlocks)).toBe(true)
    })

    it('should handle special characters in dialogue', () => {
      const specialContent = 'John said "Hello! How are you? I\'m fine... really." Mary replied "That\'s great!"'
      const dialogueBlocks = ScriptConverter.extractDialogue(specialContent, mockCharacters)

      expect(dialogueBlocks).toHaveLength(2)
      expect(dialogueBlocks[0].text).toContain('!')
      expect(dialogueBlocks[0].text).toContain('?')
      expect(dialogueBlocks[0].text).toContain('...')
    })
  })
})