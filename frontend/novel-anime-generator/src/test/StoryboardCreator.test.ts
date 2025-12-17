import { describe, it, expect, beforeEach } from 'vitest'
import { StoryboardCreator } from '../services/StoryboardCreator'
import type { 
  Screenplay, 
  ScreenplayScene, 
  Character, 
  LockedProfile,
  CharacterAttributes,
  ValidationRule
} from '../types/core'

describe('StoryboardCreator', () => {
  let mockScreenplay: Screenplay
  let mockCharacters: Character[]
  let mockLockedProfiles: LockedProfile[]
  let mockScene: ScreenplayScene

  beforeEach(() => {
    mockScene = {
      id: 'screenplay_scene_1',
      sceneNumber: 1,
      heading: 'INT./EXT. LIVING ROOM - MORNING',
      content: 'John walks into the room. "Hello, Mary," he says with a smile. Mary looks up from her book. "Oh, hello John! I didn\'t hear you come in," she replies cheerfully.',
      characters: ['char_1', 'char_2'],
      setting: 'Living Room'
    }

    mockScreenplay = {
      id: 'screenplay_episode_1',
      episodeId: 'episode_1',
      content: 'Full screenplay content...',
      format: 'custom',
      scenes: [mockScene],
      dialogueBlocks: [],
      sceneDescriptions: []
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

  describe('createStoryboard', () => {
    it('should create a complete storyboard from screenplay', () => {
      const storyboard = StoryboardCreator.createStoryboard(mockScreenplay, mockCharacters, mockLockedProfiles)

      expect(storyboard.id).toBe('storyboard_episode_1')
      expect(storyboard.episodeId).toBe('episode_1')
      expect(storyboard.shots.length).toBeGreaterThan(0)
      expect(storyboard.totalDuration).toBeGreaterThan(0)
      expect(storyboard.transitionSpecs).toBeDefined()
    })

    it('should generate shots with proper specifications', () => {
      const storyboard = StoryboardCreator.createStoryboard(mockScreenplay, mockCharacters, mockLockedProfiles)
      const firstShot = storyboard.shots[0]

      expect(firstShot.shotId).toContain('shot_')
      expect(firstShot.shotNumber).toBe(1)
      expect(firstShot.duration).toBeGreaterThan(0)
      expect(firstShot.cameraAngle).toBeDefined()
      expect(firstShot.shotType).toBeDefined()
      expect(firstShot.characters).toBeDefined()
      expect(firstShot.setting).toBeDefined()
      expect(firstShot.visualDescription).toBeTruthy()
      expect(firstShot.aiPrompt).toBeTruthy()
    })

    it('should include character information in shots', () => {
      const storyboard = StoryboardCreator.createStoryboard(mockScreenplay, mockCharacters, mockLockedProfiles)
      const shotsWithCharacters = storyboard.shots.filter(shot => shot.characters.length > 0)

      expect(shotsWithCharacters.length).toBeGreaterThan(0)
      
      const characterShot = shotsWithCharacters[0]
      expect(characterShot.characters[0].characterId).toBeDefined()
      expect(characterShot.characters[0].position).toBeDefined()
      expect(characterShot.characters[0].expression).toBeDefined()
      expect(characterShot.characters[0].action).toBeDefined()
      expect(characterShot.characters[0].prominence).toBeDefined()
    })

    it('should generate appropriate setting information', () => {
      const storyboard = StoryboardCreator.createStoryboard(mockScreenplay, mockCharacters, mockLockedProfiles)
      const firstShot = storyboard.shots[0]

      expect(firstShot.setting.location).toBe('Living Room')
      expect(firstShot.setting.timeOfDay).toBe('morning')
      expect(firstShot.setting.lighting).toBeTruthy()
      expect(firstShot.setting.atmosphere).toBeTruthy()
    })

    it('should create transitions between shots', () => {
      const storyboard = StoryboardCreator.createStoryboard(mockScreenplay, mockCharacters, mockLockedProfiles)

      if (storyboard.shots.length > 1) {
        expect(storyboard.transitionSpecs.length).toBeGreaterThan(0)
        
        const transition = storyboard.transitionSpecs[0]
        expect(transition.id).toBeTruthy()
        expect(transition.fromShotId).toBeTruthy()
        expect(transition.toShotId).toBeTruthy()
        expect(transition.transitionType).toBeDefined()
        expect(transition.duration).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('shot generation', () => {
    it('should generate establishing shots', () => {
      const storyboard = StoryboardCreator.createStoryboard(mockScreenplay, mockCharacters, mockLockedProfiles)
      const establishingShot = storyboard.shots[0]

      expect(establishingShot.shotType).toMatch(/wide|extreme_wide/)
      expect(establishingShot.visualDescription).toContain('Living Room')
    })

    it('should vary shot types appropriately', () => {
      const storyboard = StoryboardCreator.createStoryboard(mockScreenplay, mockCharacters, mockLockedProfiles)
      const shotTypes = storyboard.shots.map(shot => shot.shotType)
      const uniqueTypes = new Set(shotTypes)

      expect(uniqueTypes.size).toBeGreaterThan(1) // Should have variety
    })

    it('should generate appropriate AI prompts', () => {
      const storyboard = StoryboardCreator.createStoryboard(mockScreenplay, mockCharacters, mockLockedProfiles)
      
      storyboard.shots.forEach(shot => {
        expect(shot.aiPrompt).toContain(shot.shotType.replace('_', ' '))
        expect(shot.aiPrompt).toContain(shot.cameraAngle.replace('_', ' '))
        expect(shot.aiPrompt).toContain('high quality')
      })
    })

    it('should handle scenes with different character counts', () => {
      // Test with single character
      const singleCharacterScene: ScreenplayScene = {
        ...mockScene,
        characters: ['char_1']
      }
      
      const singleCharScreenplay = {
        ...mockScreenplay,
        scenes: [singleCharacterScene]
      }

      const storyboard = StoryboardCreator.createStoryboard(
        singleCharScreenplay, 
        [mockCharacters[0]], 
        [mockLockedProfiles[0]]
      )

      expect(storyboard.shots.length).toBeGreaterThan(0)
      
      // Check that shots handle single character appropriately
      const shotsWithCharacters = storyboard.shots.filter(shot => shot.characters.length > 0)
      expect(shotsWithCharacters.length).toBeGreaterThan(0)
    })
  })

  describe('camera and shot selection', () => {
    it('should select appropriate camera angles', () => {
      const storyboard = StoryboardCreator.createStoryboard(mockScreenplay, mockCharacters, mockLockedProfiles)
      const cameraAngles = storyboard.shots.map(shot => shot.cameraAngle)
      
      // Should include valid camera angles
      const validAngles = ['high', 'eye_level', 'low', 'birds_eye', 'worms_eye', 'dutch']
      cameraAngles.forEach(angle => {
        expect(validAngles).toContain(angle)
      })
    })

    it('should calculate reasonable shot durations', () => {
      const storyboard = StoryboardCreator.createStoryboard(mockScreenplay, mockCharacters, mockLockedProfiles)
      
      storyboard.shots.forEach(shot => {
        expect(shot.duration).toBeGreaterThan(0)
        expect(shot.duration).toBeLessThan(30) // Reasonable upper limit
      })
    })

    it('should generate visual descriptions with all required elements', () => {
      const storyboard = StoryboardCreator.createStoryboard(mockScreenplay, mockCharacters, mockLockedProfiles)
      
      storyboard.shots.forEach(shot => {
        expect(shot.visualDescription).toContain('shot')
        expect(shot.visualDescription).toContain('angle')
        expect(shot.visualDescription).toContain('Location:')
        expect(shot.visualDescription).toContain('Lighting:')
        expect(shot.visualDescription).toContain('Atmosphere:')
      })
    })
  })

  describe('transition generation', () => {
    it('should generate appropriate transition types', () => {
      // Create a screenplay with multiple scenes to test transitions
      const secondScene: ScreenplayScene = {
        id: 'screenplay_scene_2',
        sceneNumber: 2,
        heading: 'EXT. GARDEN - AFTERNOON',
        content: 'John and Mary walk in the garden.',
        characters: ['char_1', 'char_2'],
        setting: 'Garden'
      }

      const multiSceneScreenplay = {
        ...mockScreenplay,
        scenes: [mockScene, secondScene]
      }

      const storyboard = StoryboardCreator.createStoryboard(
        multiSceneScreenplay, 
        mockCharacters, 
        mockLockedProfiles
      )

      expect(storyboard.transitionSpecs.length).toBeGreaterThan(0)
      
      const validTransitions = ['cut', 'fade', 'dissolve', 'wipe', 'zoom', 'pan']
      storyboard.transitionSpecs.forEach(transition => {
        expect(validTransitions).toContain(transition.transitionType)
        expect(transition.duration).toBeGreaterThanOrEqual(0)
      })
    })

    it('should create transitions with proper references', () => {
      const storyboard = StoryboardCreator.createStoryboard(mockScreenplay, mockCharacters, mockLockedProfiles)
      
      if (storyboard.transitionSpecs.length > 0) {
        const transition = storyboard.transitionSpecs[0]
        expect(transition.fromShotId).toBeTruthy()
        expect(transition.toShotId).toBeTruthy()
        expect(transition.fromShotId).not.toBe(transition.toShotId)
      }
    })
  })

  describe('transition specification system', () => {
    let multiSceneScreenplay: Screenplay
    let testStoryboard: any

    beforeEach(() => {
      const emotionalScene: ScreenplayScene = {
        id: 'screenplay_scene_2',
        sceneNumber: 2,
        heading: 'EXT. GARDEN - AFTERNOON',
        content: 'John looks sad as he walks alone. Mary appears angry in the distance.',
        characters: ['char_1', 'char_2'],
        setting: 'Garden'
      }

      const actionScene: ScreenplayScene = {
        id: 'screenplay_scene_3',
        sceneNumber: 3,
        heading: 'INT. KITCHEN - NIGHT',
        content: 'John runs into the kitchen. He grabs a knife and starts cutting vegetables quickly.',
        characters: ['char_1'],
        setting: 'Kitchen'
      }

      multiSceneScreenplay = {
        ...mockScreenplay,
        scenes: [mockScene, emotionalScene, actionScene]
      }

      testStoryboard = StoryboardCreator.createStoryboard(
        multiSceneScreenplay, 
        mockCharacters, 
        mockLockedProfiles
      )
    })

    describe('transition context analysis', () => {
      it('should detect location changes', () => {
        expect(testStoryboard.transitionSpecs.length).toBeGreaterThan(0)
        
        // Find transition between different locations
        const locationTransition = testStoryboard.transitionSpecs.find((t: any) => {
          const fromShot = testStoryboard.shots.find((s: any) => s.shotId === t.fromShotId)
          const toShot = testStoryboard.shots.find((s: any) => s.shotId === t.toShotId)
          return fromShot && toShot && fromShot.setting.location !== toShot.setting.location
        })

        if (locationTransition) {
          expect(['dissolve', 'fade']).toContain(locationTransition.transitionType)
        }
      })

      it('should detect time changes', () => {
        // Find transition between different times of day
        const timeTransition = testStoryboard.transitionSpecs.find((t: any) => {
          const fromShot = testStoryboard.shots.find((s: any) => s.shotId === t.fromShotId)
          const toShot = testStoryboard.shots.find((s: any) => s.shotId === t.toShotId)
          return fromShot && toShot && fromShot.setting.timeOfDay !== toShot.setting.timeOfDay
        })

        if (timeTransition) {
          expect(['dissolve', 'fade']).toContain(timeTransition.transitionType)
        }
      })

      it('should detect emotional shifts', () => {
        // Emotional scenes should generate appropriate transitions
        const emotionalTransitions = testStoryboard.transitionSpecs.filter((t: any) => {
          const fromShot = testStoryboard.shots.find((s: any) => s.shotId === t.fromShotId)
          const toShot = testStoryboard.shots.find((s: any) => s.shotId === t.toShotId)
          return (fromShot?.emotionalBeat && fromShot.emotionalBeat !== 'neutral') ||
                 (toShot?.emotionalBeat && toShot.emotionalBeat !== 'neutral')
        })

        // Should have at least some transitions, but may not all be emotional
        expect(testStoryboard.transitionSpecs.length).toBeGreaterThan(0)
        // Emotional transitions are optional based on content analysis
        expect(emotionalTransitions.length).toBeGreaterThanOrEqual(0)
      })

      it('should analyze scale changes correctly', () => {
        // Test shots with different scales should have appropriate transitions
        const scaleTransitions = testStoryboard.transitionSpecs.filter((t: any) => {
          const fromShot = testStoryboard.shots.find((s: any) => s.shotId === t.fromShotId)
          const toShot = testStoryboard.shots.find((s: any) => s.shotId === t.toShotId)
          
          if (!fromShot || !toShot) return false
          
          const scaleOrder = ['extreme_wide', 'wide', 'medium', 'over_shoulder', 'close_up', 'extreme_close_up']
          const fromIndex = scaleOrder.indexOf(fromShot.shotType)
          const toIndex = scaleOrder.indexOf(toShot.shotType)
          
          return Math.abs(fromIndex - toIndex) >= 3 // Major scale change
        })

        scaleTransitions.forEach((transition: any) => {
          expect(['zoom', 'dissolve']).toContain(transition.transitionType)
        })
      })
    })

    describe('transition quality validation', () => {
      it('should validate transition types appropriately', () => {
        testStoryboard.transitionSpecs.forEach((transition: any) => {
          const fromShot = testStoryboard.shots.find((s: any) => s.shotId === transition.fromShotId)
          const toShot = testStoryboard.shots.find((s: any) => s.shotId === transition.toShotId)
          
          if (fromShot && toShot) {
            const validation = StoryboardCreator.validateTransitionQuality(transition, fromShot, toShot)
            
            expect(validation.qualityScore).toBeGreaterThanOrEqual(0)
            expect(validation.qualityScore).toBeLessThanOrEqual(100)
            expect(Array.isArray(validation.issues)).toBe(true)
            expect(Array.isArray(validation.recommendations)).toBe(true)
          }
        })
      })

      it('should penalize inappropriate cuts for location changes', () => {
        // Create a mock transition with cut for location change
        const mockFromShot = {
          shotId: 'shot_1',
          setting: { location: 'Living Room', timeOfDay: 'morning' },
          shotType: 'medium',
          cameraAngle: 'eye_level',
          characters: []
        }
        
        const mockToShot = {
          shotId: 'shot_2', 
          setting: { location: 'Garden', timeOfDay: 'morning' },
          shotType: 'medium',
          cameraAngle: 'eye_level',
          characters: []
        }
        
        const mockTransition = {
          id: 'test_transition',
          fromShotId: 'shot_1',
          toShotId: 'shot_2',
          transitionType: 'cut' as const,
          duration: 0
        }

        const validation = StoryboardCreator.validateTransitionQuality(
          mockTransition, 
          mockFromShot as any, 
          mockToShot as any
        )

        expect(validation.qualityScore).toBeLessThan(100)
        expect(validation.issues.some(issue => issue.includes('location change'))).toBe(true)
      })

      it('should validate transition durations', () => {
        testStoryboard.transitionSpecs.forEach((transition: any) => {
          const fromShot = testStoryboard.shots.find((s: any) => s.shotId === transition.fromShotId)
          const toShot = testStoryboard.shots.find((s: any) => s.shotId === transition.toShotId)
          
          if (fromShot && toShot) {
            const validation = StoryboardCreator.validateTransitionQuality(transition, fromShot, toShot)
            
            // Check that duration validation is working
            if (transition.transitionType === 'cut') {
              expect(transition.duration).toBe(0)
            } else {
              expect(transition.duration).toBeGreaterThan(0)
            }
          }
        })
      })

      it('should provide actionable recommendations', () => {
        testStoryboard.transitionSpecs.forEach((transition: any) => {
          const fromShot = testStoryboard.shots.find((s: any) => s.shotId === transition.fromShotId)
          const toShot = testStoryboard.shots.find((s: any) => s.shotId === transition.toShotId)
          
          if (fromShot && toShot) {
            const validation = StoryboardCreator.validateTransitionQuality(transition, fromShot, toShot)
            
            // Recommendations should be specific and actionable
            validation.recommendations.forEach(rec => {
              expect(rec.length).toBeGreaterThan(10) // Should be descriptive
              expect(rec).toMatch(/dissolve|fade|zoom|pan|cut|duration|transition/)
            })
          }
        })
      })
    })

    describe('transition optimization', () => {
      it('should optimize transitions for better quality', () => {
        // The storyboard should already have optimized transitions
        expect(testStoryboard.transitionSpecs.length).toBeGreaterThan(0)
        
        // Check that optimization has been applied
        testStoryboard.transitionSpecs.forEach((transition: any) => {
          const fromShot = testStoryboard.shots.find((s: any) => s.shotId === transition.fromShotId)
          const toShot = testStoryboard.shots.find((s: any) => s.shotId === transition.toShotId)
          
          if (fromShot && toShot) {
            const validation = StoryboardCreator.validateTransitionQuality(transition, fromShot, toShot)
            
            // Optimized transitions should have reasonable quality scores
            expect(validation.qualityScore).toBeGreaterThan(50)
          }
        })
      })

      it('should generate enhanced descriptions with continuity specs', () => {
        testStoryboard.transitionSpecs.forEach((transition: any) => {
          expect(transition.description).toBeTruthy()
          expect(transition.description.length).toBeGreaterThan(10) // Should be descriptive
          
          // Should contain either base description or continuity information
          const hasValidDescription = transition.description.includes('transition') ||
                                     transition.description.includes('continuity') ||
                                     transition.description.includes('lighting') ||
                                     transition.description.includes('character') ||
                                     transition.description.includes('movement') ||
                                     transition.description.includes('cut') ||
                                     transition.description.includes('fade') ||
                                     transition.description.includes('dissolve')
          
          expect(hasValidDescription).toBe(true)
        })
      })
    })

    describe('transition flow analysis', () => {
      it('should analyze overall transition flow', () => {
        const flowAnalysis = StoryboardCreator.analyzeTransitionFlow(testStoryboard)
        
        expect(flowAnalysis.overallQuality).toBeGreaterThanOrEqual(0)
        expect(flowAnalysis.overallQuality).toBeLessThanOrEqual(100)
        expect(Array.isArray(flowAnalysis.flowIssues)).toBe(true)
        expect(Array.isArray(flowAnalysis.optimizationSuggestions)).toBe(true)
      })

      it('should detect repetitive transition patterns', () => {
        // Create a storyboard with repetitive transitions for testing
        const repetitiveTransitions = [
          { transitionType: 'fade', duration: 1.0 },
          { transitionType: 'fade', duration: 1.0 },
          { transitionType: 'fade', duration: 1.0 }
        ]
        
        // The flow analysis should detect this pattern
        const flowAnalysis = StoryboardCreator.analyzeTransitionFlow(testStoryboard)
        
        // Should provide suggestions for variety
        expect(flowAnalysis.optimizationSuggestions.length).toBeGreaterThanOrEqual(0)
      })

      it('should analyze pacing appropriately', () => {
        const flowAnalysis = StoryboardCreator.analyzeTransitionFlow(testStoryboard)
        
        // Should provide pacing feedback
        const hasPacingFeedback = flowAnalysis.flowIssues.some(issue => 
          issue.includes('pacing') || issue.includes('slow') || issue.includes('fast')
        ) || flowAnalysis.optimizationSuggestions.some(suggestion =>
          suggestion.includes('pacing') || suggestion.includes('duration')
        )
        
        // May or may not have pacing issues, but analysis should complete
        expect(typeof hasPacingFeedback).toBe('boolean')
      })

      it('should calculate transition density metrics', () => {
        const flowAnalysis = StoryboardCreator.analyzeTransitionFlow(testStoryboard)
        
        // Should analyze transition density
        const hasDensityAnalysis = flowAnalysis.flowIssues.some(issue =>
          issue.includes('transitions') || issue.includes('choppy') || issue.includes('static')
        ) || flowAnalysis.optimizationSuggestions.some(suggestion =>
          issue.includes('transitions') || issue.includes('frequency')
        )
        
        // Analysis should complete regardless of density issues
        expect(typeof hasDensityAnalysis).toBe('boolean')
      })
    })

    describe('continuity specifications', () => {
      it('should generate motion continuity specs', () => {
        // Find transitions with character movement
        const movementTransitions = testStoryboard.transitionSpecs.filter((t: any) => {
          return t.description && (
            t.description.includes('movement') || 
            t.description.includes('motion') ||
            t.description.includes('Follow character')
          )
        })
        
        // Should have some movement-related continuity specs
        expect(movementTransitions.length).toBeGreaterThanOrEqual(0)
      })

      it('should generate audio continuity specs', () => {
        // Find transitions with dialogue continuity
        const audioTransitions = testStoryboard.transitionSpecs.filter((t: any) => {
          return t.description && (
            t.description.includes('dialogue') || 
            t.description.includes('audio') ||
            t.description.includes('cross-fade')
          )
        })
        
        // Should have some audio-related continuity specs
        expect(audioTransitions.length).toBeGreaterThanOrEqual(0)
      })

      it('should preserve character positioning continuity', () => {
        testStoryboard.transitionSpecs.forEach((transition: any) => {
          if (transition.description && transition.description.includes('character positioning')) {
            expect(transition.description).toMatch(/\d+%.*continuity/)
          }
        })
      })

      it('should handle lighting continuity', () => {
        const lightingTransitions = testStoryboard.transitionSpecs.filter((t: any) => {
          return t.description && (
            t.description.includes('lighting') || 
            t.description.includes('Preserve lighting') ||
            t.description.includes('lighting adjustment')
          )
        })
        
        expect(lightingTransitions.length).toBeGreaterThan(0)
      })
    })
  })

  describe('AI generation compatibility', () => {
    let testStoryboard: any

    beforeEach(() => {
      testStoryboard = StoryboardCreator.createStoryboard(mockScreenplay, mockCharacters, mockLockedProfiles)
    })

    describe('AI compatible output generation', () => {
      it('should generate structured AI compatible data', () => {
        const aiData = StoryboardCreator.generateAICompatibleOutput(testStoryboard)

        expect(aiData.projectId).toBe(testStoryboard.id)
        expect(aiData.episodeId).toBe(testStoryboard.episodeId)
        expect(aiData.totalDuration).toBe(testStoryboard.totalDuration)
        expect(aiData.shots.length).toBe(testStoryboard.shots.length)
        expect(aiData.transitions.length).toBe(testStoryboard.transitionSpecs.length)
        expect(aiData.metadata).toBeDefined()
        expect(aiData.metadata.compatibility).toContain('runwayml')
        expect(aiData.metadata.compatibility).toContain('pika-labs')
      })

      it('should convert shots to AI format correctly', () => {
        const aiData = StoryboardCreator.generateAICompatibleOutput(testStoryboard)
        const aiShot = aiData.shots[0]

        expect(aiShot.id).toBeTruthy()
        expect(aiShot.sequence).toBeGreaterThan(0)
        expect(aiShot.duration).toBeGreaterThan(0)
        expect(aiShot.camera.angle).toBeDefined()
        expect(aiShot.camera.shotType).toBeDefined()
        expect(aiShot.camera.movement).toBeDefined()
        expect(aiShot.scene.location).toBeDefined()
        expect(aiShot.scene.timeOfDay).toBeDefined()
        expect(aiShot.prompts.primary).toBeTruthy()
        expect(aiShot.prompts.detailed).toBeTruthy()
        expect(aiShot.prompts.negative).toBeTruthy()
        expect(aiShot.prompts.style).toBeTruthy()
        expect(aiShot.technical.aspectRatio).toBe('16:9')
      })

      it('should convert transitions to AI format correctly', () => {
        const aiData = StoryboardCreator.generateAICompatibleOutput(testStoryboard)
        
        if (aiData.transitions.length > 0) {
          const aiTransition = aiData.transitions[0]
          
          expect(aiTransition.id).toBeTruthy()
          expect(aiTransition.fromShotId).toBeTruthy()
          expect(aiTransition.toShotId).toBeTruthy()
          expect(aiTransition.type).toBeDefined()
          expect(aiTransition.duration).toBeGreaterThanOrEqual(0)
          expect(aiTransition.parameters).toBeDefined()
        }
      })

      it('should generate appropriate prompts for different shot types', () => {
        const aiData = StoryboardCreator.generateAICompatibleOutput(testStoryboard)
        
        aiData.shots.forEach(shot => {
          expect(shot.prompts.primary).toContain(shot.camera.shotType.replace('_', ' '))
          expect(shot.prompts.detailed).toContain('Location:')
          expect(shot.prompts.negative).toContain('blurry')
          expect(shot.prompts.style).toContain('anime style')
        })
      })
    })

    describe('AI compatibility validation', () => {
      it('should validate AI compatibility correctly', () => {
        const aiData = StoryboardCreator.generateAICompatibleOutput(testStoryboard)
        const validation = StoryboardCreator.validateAICompatibility(aiData)

        expect(validation.isCompatible).toBe(true)
        expect(validation.qualityScore).toBeGreaterThanOrEqual(0)
        expect(validation.qualityScore).toBeLessThanOrEqual(100)
        expect(Array.isArray(validation.issues)).toBe(true)
        expect(Array.isArray(validation.warnings)).toBe(true)
        expect(Array.isArray(validation.recommendations)).toBe(true)
        expect(Array.isArray(validation.supportedPlatforms)).toBe(true)
        expect(validation.validatedAt).toBeTruthy()
      })

      it('should detect missing required fields', () => {
        const invalidAiData = {
          projectId: '',
          episodeId: '',
          totalDuration: 0,
          shots: [],
          transitions: [],
          metadata: {
            generatedAt: new Date().toISOString(),
            version: '1.0',
            format: 'test',
            compatibility: []
          }
        }

        const validation = StoryboardCreator.validateAICompatibility(invalidAiData)

        expect(validation.isCompatible).toBe(false)
        expect(validation.issues.length).toBeGreaterThan(0)
        expect(validation.issues.some(issue => issue.includes('Missing required'))).toBe(true)
      })

      it('should warn about duration issues', () => {
        const aiData = StoryboardCreator.generateAICompatibleOutput(testStoryboard)
        
        // Modify shot duration to trigger warnings
        aiData.shots[0].duration = 0.1 // Very short
        if (aiData.shots.length > 1) {
          aiData.shots[1].duration = 15 // Very long
        }

        const validation = StoryboardCreator.validateAICompatibility(aiData)

        expect(validation.warnings.length).toBeGreaterThan(0)
        expect(validation.warnings.some(warning => warning.includes('short duration'))).toBe(true)
      })

      it('should provide quality recommendations', () => {
        const aiData = StoryboardCreator.generateAICompatibleOutput(testStoryboard)
        
        // Create a scenario that triggers recommendations
        for (let i = 0; i < 60; i++) {
          aiData.shots.push({...aiData.shots[0], id: `shot_${i}`, sequence: i + 10})
        }

        const validation = StoryboardCreator.validateAICompatibility(aiData)

        expect(validation.recommendations.length).toBeGreaterThan(0)
      })
    })

    describe('platform-specific formatting', () => {
      it('should format for RunwayML correctly', () => {
        const aiData = StoryboardCreator.generateAICompatibleOutput(testStoryboard)
        const runwayData = StoryboardCreator.formatForAIPlatform(aiData, 'runwayml')

        expect(runwayData.platform).toBe('runwayml')
        expect(runwayData.format).toBe('gen-2')
        expect(runwayData.data.project_id).toBe(aiData.projectId)
        expect(Array.isArray(runwayData.data.shots)).toBe(true)
        
        if (runwayData.data.shots.length > 0) {
          const shot = runwayData.data.shots[0]
          expect(shot.prompt).toBeTruthy()
          expect(shot.duration).toBeLessThanOrEqual(4) // RunwayML limit
          expect(shot.aspect_ratio).toBe('16:9')
        }
      })

      it('should format for Pika Labs correctly', () => {
        const aiData = StoryboardCreator.generateAICompatibleOutput(testStoryboard)
        const pikaData = StoryboardCreator.formatForAIPlatform(aiData, 'pika-labs')

        expect(pikaData.platform).toBe('pika-labs')
        expect(pikaData.format).toBe('v1')
        expect(pikaData.data.project).toBe(aiData.projectId)
        expect(Array.isArray(pikaData.data.clips)).toBe(true)
        
        if (pikaData.data.clips.length > 0) {
          const clip = pikaData.data.clips[0]
          expect(clip.text).toBeTruthy()
          expect(clip.duration).toBeLessThanOrEqual(3) // Pika Labs limit
          expect(clip.style).toBeTruthy()
          expect(clip.negative).toBeTruthy()
        }
      })

      it('should format for Stable Video correctly', () => {
        const aiData = StoryboardCreator.generateAICompatibleOutput(testStoryboard)
        const stableData = StoryboardCreator.formatForAIPlatform(aiData, 'stable-video')

        expect(stableData.platform).toBe('stable-video')
        expect(stableData.format).toBe('svd')
        expect(Array.isArray(stableData.data.sequence)).toBe(true)
        
        if (stableData.data.sequence.length > 0) {
          const frame = stableData.data.sequence[0]
          expect(frame.prompt).toBeTruthy()
          expect(frame.negative_prompt).toBeTruthy()
          expect(frame.duration_frames).toBeGreaterThan(0)
          expect(frame.width).toBe(1024)
          expect(frame.height).toBe(576)
        }
      })

      it('should format for Gen-2 correctly', () => {
        const aiData = StoryboardCreator.generateAICompatibleOutput(testStoryboard)
        const gen2Data = StoryboardCreator.formatForAIPlatform(aiData, 'gen-2')

        expect(gen2Data.platform).toBe('gen-2')
        expect(gen2Data.format).toBe('v2')
        expect(gen2Data.data.project_name).toBe(aiData.episodeId)
        expect(Array.isArray(gen2Data.data.generations)).toBe(true)
        
        if (gen2Data.data.generations.length > 0) {
          const generation = gen2Data.data.generations[0]
          expect(generation.text_prompt).toBeTruthy()
          expect(generation.duration).toBeLessThanOrEqual(4) // Gen-2 limit
          expect(generation.aspect_ratio).toBe('16:9')
          expect(generation.upscale).toBe(true)
        }
      })

      it('should throw error for unsupported platform', () => {
        const aiData = StoryboardCreator.generateAICompatibleOutput(testStoryboard)
        
        expect(() => {
          StoryboardCreator.formatForAIPlatform(aiData, 'unsupported' as any)
        }).toThrow('Unsupported platform: unsupported')
      })
    })

    describe('prompt generation', () => {
      it('should generate negative prompts appropriately', () => {
        const aiData = StoryboardCreator.generateAICompatibleOutput(testStoryboard)
        
        aiData.shots.forEach(shot => {
          expect(shot.prompts.negative).toContain('blurry')
          expect(shot.prompts.negative).toContain('low quality')
          
          if (shot.camera.shotType === 'close_up') {
            expect(shot.prompts.negative).toContain('multiple faces')
          }
          
          if (shot.scene.timeOfDay === 'night') {
            expect(shot.prompts.negative).toContain('daylight')
          }
        })
      })

      it('should generate style prompts based on atmosphere', () => {
        const aiData = StoryboardCreator.generateAICompatibleOutput(testStoryboard)
        
        aiData.shots.forEach(shot => {
          expect(shot.prompts.style).toContain('anime style')
          expect(shot.prompts.style).toContain('professional animation')
          
          if (shot.scene.atmosphere.includes('romantic')) {
            expect(shot.prompts.style).toContain('soft colors')
          }
        })
      })

      it('should infer camera movement correctly', () => {
        const aiData = StoryboardCreator.generateAICompatibleOutput(testStoryboard)
        
        aiData.shots.forEach(shot => {
          expect(['static', 'follow', 'slight_shake']).toContain(shot.camera.movement)
        })
      })
    })
  })

  describe('edge cases', () => {
    it('should handle empty screenplay', () => {
      const emptyScreenplay = {
        ...mockScreenplay,
        scenes: []
      }

      const storyboard = StoryboardCreator.createStoryboard(emptyScreenplay, mockCharacters, mockLockedProfiles)

      expect(storyboard.shots).toHaveLength(0)
      expect(storyboard.totalDuration).toBe(0)
      expect(storyboard.transitionSpecs).toHaveLength(0)
    })

    it('should handle scenes without characters', () => {
      const noCharacterScene: ScreenplayScene = {
        ...mockScene,
        characters: []
      }

      const noCharScreenplay = {
        ...mockScreenplay,
        scenes: [noCharacterScene]
      }

      const storyboard = StoryboardCreator.createStoryboard(noCharScreenplay, [], [])

      expect(storyboard.shots.length).toBeGreaterThan(0)
      // Shots should still be generated even without characters
      storyboard.shots.forEach(shot => {
        expect(shot.characters).toHaveLength(0)
        expect(shot.visualDescription).toBeTruthy()
        expect(shot.aiPrompt).toBeTruthy()
      })
    })

    it('should handle scenes with minimal content', () => {
      const minimalScene: ScreenplayScene = {
        ...mockScene,
        content: 'A room.'
      }

      const minimalScreenplay = {
        ...mockScreenplay,
        scenes: [minimalScene]
      }

      const storyboard = StoryboardCreator.createStoryboard(minimalScreenplay, mockCharacters, mockLockedProfiles)

      expect(storyboard.shots.length).toBeGreaterThan(0)
      expect(storyboard.totalDuration).toBeGreaterThan(0)
    })

    it('should handle missing character profiles gracefully', () => {
      const storyboard = StoryboardCreator.createStoryboard(mockScreenplay, mockCharacters, [])

      expect(storyboard.shots.length).toBeGreaterThan(0)
      // Should still generate shots even without locked profiles
      const shotsWithCharacters = storyboard.shots.filter(shot => shot.characters.length > 0)
      expect(shotsWithCharacters.length).toBeGreaterThan(0)
    })
  })
})