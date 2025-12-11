/**
 * Property-based tests for Route Service
 * 
 * Uses fast-check for property-based testing
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import {
  checkTruckRestrictions,
  RESTRICTED_AREAS,
  type TruckRestrictions
} from './RouteService'

describe('Route Planning Properties', () => {
  /**
   * **Feature: phase4-advanced-features, Property 1: Route planning respects truck restrictions**
   * **Validates: Requirements 1.4**
   * 
   * For any route planning request with truck restrictions (height/weight limits), 
   * the returned route should avoid all restricted areas that exceed the specified limits.
   */
  it('Property 1: Route planning respects truck restrictions - checkTruckRestrictions detects violations', () => {
    fc.assert(
      fc.property(
        // Generate truck restrictions with height between 3.5 and 5.0 meters
        fc.record({
          height: fc.float({ min: Math.fround(3.5), max: Math.fround(5.0), noNaN: true }),
          weight: fc.float({ min: Math.fround(20), max: Math.fround(60), noNaN: true }),
          width: fc.float({ min: Math.fround(2.0), max: Math.fround(3.0), noNaN: true }),
          length: fc.float({ min: Math.fround(10), max: Math.fround(20), noNaN: true })
        }),
        // Generate a subset of restricted area names to include in the route
        fc.subarray(RESTRICTED_AREAS.map(area => area.name), { minLength: 0 }),
        (restrictions: TruckRestrictions, includedAreas: string[]) => {
          // Build route info with the selected restricted areas
          const routeInfo = {
            roads: includedAreas.map(name => `经过${name}路段`)
          }

          const result = checkTruckRestrictions(restrictions, routeInfo)

          // For each restricted area in the route, check if violations are correctly detected
          for (const areaName of includedAreas) {
            const restrictedArea = RESTRICTED_AREAS.find(a => a.name === areaName)
            if (!restrictedArea) continue

            if (restrictedArea.type === 'height' && restrictions.height !== undefined) {
              if (restrictions.height > restrictedArea.limit) {
                // Should have a violation for this area
                const hasViolation = result.violations.some(v => v.includes(areaName))
                expect(hasViolation).toBe(true)
                expect(result.valid).toBe(false)
              }
            }
          }

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 1 variant: Routes without restricted areas should always be valid
   */
  it('Property 1: Route planning respects truck restrictions - routes without restricted areas are valid', () => {
    fc.assert(
      fc.property(
        // Generate any truck restrictions
        fc.record({
          height: fc.float({ min: Math.fround(3.5), max: Math.fround(5.0), noNaN: true }),
          weight: fc.float({ min: Math.fround(20), max: Math.fround(60), noNaN: true }),
          width: fc.float({ min: Math.fround(2.0), max: Math.fround(3.0), noNaN: true }),
          length: fc.float({ min: Math.fround(10), max: Math.fround(20), noNaN: true })
        }),
        // Generate road names that don't include any restricted areas
        fc.array(
          fc.stringMatching(/^[一-龥]{2,4}路$/), // Chinese road names like "浦东路"
          { minLength: 0, maxLength: 10 }
        ),
        (restrictions: TruckRestrictions, roads: string[]) => {
          // Filter out any roads that accidentally match restricted areas
          const safeRoads = roads.filter(road => 
            !RESTRICTED_AREAS.some(area => road.includes(area.name))
          )

          const routeInfo = { roads: safeRoads }
          const result = checkTruckRestrictions(restrictions, routeInfo)

          // Routes without restricted areas should always be valid
          expect(result.valid).toBe(true)
          expect(result.violations).toHaveLength(0)

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 1 variant: Trucks within limits should pass through restricted areas
   */
  it('Property 1: Route planning respects truck restrictions - trucks within limits pass restricted areas', () => {
    fc.assert(
      fc.property(
        // Generate a restricted area
        fc.constantFrom(...RESTRICTED_AREAS),
        // Generate truck height that is within the limit
        fc.float({ min: Math.fround(2.0), max: Math.fround(3.9), noNaN: true }), // All restricted areas have limits >= 4.0
        (restrictedArea, truckHeight) => {
          // Ensure truck height is within the area's limit
          const safeHeight = Math.min(truckHeight, restrictedArea.limit - 0.1)
          
          const restrictions: TruckRestrictions = {
            height: safeHeight,
            weight: 40,
            width: 2.5,
            length: 15
          }

          const routeInfo = {
            roads: [`经过${restrictedArea.name}路段`]
          }

          const result = checkTruckRestrictions(restrictions, routeInfo)

          // Truck within limits should not have violations for this area
          expect(result.valid).toBe(true)
          expect(result.violations).toHaveLength(0)

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 1 variant: Empty route info should always be valid
   */
  it('Property 1: Route planning respects truck restrictions - empty route info is valid', () => {
    fc.assert(
      fc.property(
        // Generate any truck restrictions
        fc.record({
          height: fc.float({ min: Math.fround(3.5), max: Math.fround(5.0), noNaN: true }),
          weight: fc.float({ min: Math.fround(20), max: Math.fround(60), noNaN: true }),
          width: fc.float({ min: Math.fround(2.0), max: Math.fround(3.0), noNaN: true }),
          length: fc.float({ min: Math.fround(10), max: Math.fround(20), noNaN: true })
        }),
        (restrictions: TruckRestrictions) => {
          // Test with undefined route info
          const result1 = checkTruckRestrictions(restrictions, undefined)
          expect(result1.valid).toBe(true)
          expect(result1.violations).toHaveLength(0)

          // Test with empty roads array
          const result2 = checkTruckRestrictions(restrictions, { roads: [] })
          expect(result2.valid).toBe(true)
          expect(result2.violations).toHaveLength(0)

          // Test with undefined roads
          const result3 = checkTruckRestrictions(restrictions, {})
          expect(result3.valid).toBe(true)
          expect(result3.violations).toHaveLength(0)

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 1 variant: Violation messages contain specific information
   */
  it('Property 1: Route planning respects truck restrictions - violation messages are specific', () => {
    fc.assert(
      fc.property(
        // Generate a restricted area
        fc.constantFrom(...RESTRICTED_AREAS),
        // Generate truck height that exceeds the limit
        fc.float({ min: Math.fround(4.6), max: Math.fround(5.5), noNaN: true }),
        (restrictedArea, truckHeight) => {
          // Ensure truck height exceeds the area's limit
          const exceedingHeight = Math.max(truckHeight, restrictedArea.limit + 0.1)
          
          const restrictions: TruckRestrictions = {
            height: exceedingHeight,
            weight: 40,
            width: 2.5,
            length: 15
          }

          const routeInfo = {
            roads: [`经过${restrictedArea.name}路段`]
          }

          const result = checkTruckRestrictions(restrictions, routeInfo)

          // Should have violations
          expect(result.valid).toBe(false)
          expect(result.violations.length).toBeGreaterThan(0)

          // Violation message should contain the area name and limit
          const violation = result.violations[0]
          expect(violation).toContain(restrictedArea.name)
          expect(violation).toContain(restrictedArea.limit.toString())
          expect(violation).toContain(exceedingHeight.toString())

          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})
