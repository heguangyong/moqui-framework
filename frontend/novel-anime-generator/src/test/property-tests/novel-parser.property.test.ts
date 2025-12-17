import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { NovelParser } from '../../services/NovelParser'
import type { NovelStructure, Chapter, Scene, NovelMetadata } from '../../types/core'

describe('Novel Parser Property Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  describe('Property 3: Data persistence round-trip', () => {
    /**
     * **Feature: novel-anime-generator, Property 3: Data persistence round-trip**
     * 
     * For any parsed novel structure, storing and then retrieving the content 
     * should yield an equivalent structure
     * 
     * Validates: Requirements 1.3
     */
    it('should preserve all data through store-retrieve round-trip', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Simplified generator for NovelStructure
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 50 }),
            author: fc.string({ minLength: 1, maxLength: 30 }),
            chapters: fc.array(
              fc.record({
                id: fc.nat().map(n => `chapter_${n}`),
                title: fc.string({ minLength: 1, maxLength: 30 }),
                content: fc.string({ minLength: 5, maxLength: 100 }),
                wordCount: fc.integer({ min: 1, max: 50 }),
                scenes: fc.array(
                  fc.record({
                    id: fc.nat().map(n => `scene_${n}`),
                    chapterId: fc.nat().map(n => `chapter_${n}`),
                    sceneNumber: fc.integer({ min: 1, max: 5 }),
                    content: fc.string({ minLength: 1, maxLength: 50 }),
                    setting: fc.string({ minLength: 1, maxLength: 20 }),
                    characters: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { maxLength: 3 })
                  }),
                  { maxLength: 2 }
                )
              }),
              { minLength: 1, maxLength: 2 }
            ),
            metadata: fc.record({
              wordCount: fc.integer({ min: 1, max: 100 }),
              language: fc.constantFrom('en', 'zh'),
              description: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
              genre: fc.option(fc.string({ maxLength: 20 }), { nil: undefined })
            })
          }),
          async (originalNovel: NovelStructure) => {
            // Store the novel structure
            const novelId = await NovelParser.storeNovelStructure(originalNovel)
            
            // Verify we got a valid ID
            expect(novelId).toBeDefined()
            expect(typeof novelId).toBe('string')
            expect(novelId.length).toBeGreaterThan(0)
            
            // Retrieve the novel structure
            const retrievedNovel = await NovelParser.retrieveNovelStructure(novelId)
            
            // Verify retrieval was successful
            expect(retrievedNovel).not.toBeNull()
            expect(retrievedNovel).toBeDefined()
            
            if (retrievedNovel) {
              // Verify basic properties are preserved
              expect(retrievedNovel.title).toBe(originalNovel.title)
              expect(retrievedNovel.author).toBe(originalNovel.author)
              expect(retrievedNovel.chapters).toHaveLength(originalNovel.chapters.length)
              
              // Verify metadata is preserved
              expect(retrievedNovel.metadata.wordCount).toBe(originalNovel.metadata.wordCount)
              expect(retrievedNovel.metadata.language).toBe(originalNovel.metadata.language)
              expect(retrievedNovel.metadata.description).toBe(originalNovel.metadata.description)
              expect(retrievedNovel.metadata.genre).toBe(originalNovel.metadata.genre)
              
              // Use JSON comparison for deep equality (simpler and more reliable)
              expect(JSON.stringify(retrievedNovel)).toBe(JSON.stringify(originalNovel))
            }
          }
        ),
        { numRuns: 100 } // Run at least 100 iterations as required
      )
    })

    it('should handle simple edge cases in round-trip persistence', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            title: fc.oneof(
              fc.string({ minLength: 1, maxLength: 10 }),
              fc.constantFrom('测试小说', 'Test Novel', 'Novel123')
            ),
            author: fc.oneof(
              fc.string({ minLength: 1, maxLength: 10 }),
              fc.constantFrom('作者', 'Author', 'Test Author')
            ),
            chapters: fc.array(
              fc.record({
                id: fc.nat().map(n => `chapter_${n}`),
                title: fc.string({ minLength: 1, maxLength: 20 }),
                content: fc.string({ minLength: 5, maxLength: 50 }),
                wordCount: fc.integer({ min: 1, max: 20 }),
                scenes: fc.array(
                  fc.record({
                    id: fc.nat().map(n => `scene_${n}`),
                    chapterId: fc.nat().map(n => `chapter_${n}`),
                    sceneNumber: fc.integer({ min: 1, max: 3 }),
                    content: fc.string({ minLength: 1, maxLength: 30 }),
                    setting: fc.string({ minLength: 1, maxLength: 15 }),
                    characters: fc.array(fc.string({ minLength: 1, maxLength: 8 }), { maxLength: 2 })
                  }),
                  { maxLength: 1 }
                )
              }),
              { minLength: 1, maxLength: 1 }
            ),
            metadata: fc.record({
              wordCount: fc.integer({ min: 1, max: 50 }),
              language: fc.constantFrom('en', 'zh'),
              description: fc.option(fc.string({ maxLength: 30 }), { nil: undefined }),
              genre: fc.option(fc.constantFrom('Fantasy', 'Romance'), { nil: undefined })
            })
          }),
          async (edgeCaseNovel: NovelStructure) => {
            // Store and retrieve
            const novelId = await NovelParser.storeNovelStructure(edgeCaseNovel)
            const retrievedNovel = await NovelParser.retrieveNovelStructure(novelId)
            
            expect(retrievedNovel).not.toBeNull()
            if (retrievedNovel) {
              expect(JSON.stringify(retrievedNovel)).toBe(JSON.stringify(edgeCaseNovel))
            }
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})