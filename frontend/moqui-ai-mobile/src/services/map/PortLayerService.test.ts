/**
 * Property-based tests for Port Layer Service
 * 
 * Uses fast-check for property-based testing
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import {
  loadPortLayer,
  getTerminals,
  getGates,
  getParkingLots,
  type PortCode
} from './PortLayerService'

describe('Port Layer Properties', () => {
  /**
   * **Feature: phase4-advanced-features, Property 2: Port layer contains required POI types**
   * **Validates: Requirements 2.1, 2.2, 2.3**
   * 
   * For any port layer load request, the returned POI list should contain at least 
   * one terminal, one gate, and one parking lot for the specified port.
   */
  it('Property 2: Port layer contains required POI types - loadPortLayer returns terminals, gates, and parking lots', async () => {
    // Test with 'ALL' port code - should always have all POI types
    await fc.assert(
      fc.asyncProperty(
        fc.constant('ALL' as PortCode),
        async (portCode) => {
          const pois = await loadPortLayer(portCode)
          
          // Count POIs by type
          const terminals = pois.filter(poi => poi.type === 'terminal')
          const gates = pois.filter(poi => poi.type === 'gate')
          const parkingLots = pois.filter(poi => poi.type === 'parking')
          
          // Property: Must have at least one of each required type
          expect(terminals.length).toBeGreaterThanOrEqual(1)
          expect(gates.length).toBeGreaterThanOrEqual(1)
          expect(parkingLots.length).toBeGreaterThanOrEqual(1)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  }, 30000) // Increase timeout for async property tests

  /**
   * Property 2 variant: Each specific port should have required POI types
   */
  it('Property 2: Port layer contains required POI types - specific ports have required POI types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('YSG', 'WGQ', 'WS') as fc.Arbitrary<PortCode>,
        async (portCode) => {
          const pois = await loadPortLayer(portCode)
          
          // Count POIs by type
          const terminals = pois.filter(poi => poi.type === 'terminal')
          const gates = pois.filter(poi => poi.type === 'gate')
          const parkingLots = pois.filter(poi => poi.type === 'parking')
          
          // Property: Each port must have at least one terminal, gate, and parking lot
          expect(terminals.length).toBeGreaterThanOrEqual(1)
          expect(gates.length).toBeGreaterThanOrEqual(1)
          expect(parkingLots.length).toBeGreaterThanOrEqual(1)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  }, 30000) // Increase timeout for async property tests

  /**
   * Property 2 variant: Helper functions return correct POI types
   */
  it('Property 2: Port layer contains required POI types - helper functions return correct types', () => {
    fc.assert(
      fc.property(
        fc.constant(null), // No input needed, just run the check
        () => {
          const terminals = getTerminals()
          const gates = getGates()
          const parkingLots = getParkingLots()
          
          // All terminals should have type 'terminal'
          expect(terminals.every(poi => poi.type === 'terminal')).toBe(true)
          expect(terminals.length).toBeGreaterThanOrEqual(1)
          
          // All gates should have type 'gate'
          expect(gates.every(poi => poi.type === 'gate')).toBe(true)
          expect(gates.length).toBeGreaterThanOrEqual(1)
          
          // All parking lots should have type 'parking'
          expect(parkingLots.every(poi => poi.type === 'parking')).toBe(true)
          expect(parkingLots.length).toBeGreaterThanOrEqual(1)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 2 variant: All POIs have valid structure
   */
  it('Property 2: Port layer contains required POI types - all POIs have valid structure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('ALL', 'YSG', 'WGQ', 'WS') as fc.Arbitrary<PortCode>,
        async (portCode) => {
          const pois = await loadPortLayer(portCode)
          
          // Every POI should have required fields
          for (const poi of pois) {
            expect(poi.id).toBeDefined()
            expect(typeof poi.id).toBe('string')
            expect(poi.id.length).toBeGreaterThan(0)
            
            expect(poi.name).toBeDefined()
            expect(typeof poi.name).toBe('string')
            expect(poi.name.length).toBeGreaterThan(0)
            
            expect(poi.type).toBeDefined()
            expect(['terminal', 'gate', 'parking', 'checkpoint']).toContain(poi.type)
            
            expect(poi.position).toBeDefined()
            expect(Array.isArray(poi.position)).toBe(true)
            expect(poi.position.length).toBe(2)
            expect(typeof poi.position[0]).toBe('number') // longitude
            expect(typeof poi.position[1]).toBe('number') // latitude
            
            expect(poi.address).toBeDefined()
            expect(typeof poi.address).toBe('string')
          }
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  }, 30000) // Increase timeout for async property tests
})
