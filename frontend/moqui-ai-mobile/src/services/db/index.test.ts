/**
 * Property-based tests for IndexedDB offline cache service
 * 
 * Uses fast-check for property-based testing with fake-indexeddb for IndexedDB simulation
 */

import { describe, it, beforeEach, afterEach, expect } from 'vitest'
import fc from 'fast-check'
import 'fake-indexeddb/auto'
import {
  db,
  cacheOfflineRequest,
  getRequestById,
  getCachedRequests,
  clearCachedRequests,
  type OfflineRequestRecord
} from './index'

describe('Offline Cache Properties', () => {
  beforeEach(async () => {
    // Clear the database before each test
    await clearCachedRequests()
  })

  afterEach(async () => {
    // Clean up after each test
    await clearCachedRequests()
  })

  /**
   * **Feature: phase4-advanced-features, Property 8: Offline cache round-trip**
   * **Validates: Requirements 5.2**
   * 
   * For any request cached during offline mode, the cached request should be 
   * retrievable with identical URL, method, and body.
   */
  it('Property 8: Offline cache round-trip - cached requests are retrievable with identical data', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate valid offline request data
        fc.record({
          requestId: fc.uuid(),
          url: fc.webUrl(),
          method: fc.constantFrom('POST', 'PUT', 'DELETE') as fc.Arbitrary<'POST' | 'PUT' | 'DELETE'>,
          body: fc.json(),
          headers: fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z-]+$/.test(s)),
            fc.string({ maxLength: 100 })
          )
        }),
        async (request) => {
          // Cache the request
          const cachedId = await cacheOfflineRequest(request)
          
          // Retrieve the cached request
          const retrieved = await getRequestById(cachedId)
          
          // Verify the request was retrieved
          expect(retrieved).toBeDefined()
          
          if (retrieved) {
            // Verify round-trip: URL, method, and body should be identical
            expect(retrieved.url).toBe(request.url)
            expect(retrieved.method).toBe(request.method)
            expect(retrieved.body).toBe(request.body)
            expect(retrieved.requestId).toBe(request.requestId)
            expect(retrieved.headers).toEqual(request.headers)
            
            // Verify default values are set correctly
            expect(retrieved.status).toBe('pending')
            expect(retrieved.retryCount).toBe(0)
            expect(retrieved.timestamp).toBeInstanceOf(Date)
          }
          
          // Clean up this specific request for isolation
          await clearCachedRequests()
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})
