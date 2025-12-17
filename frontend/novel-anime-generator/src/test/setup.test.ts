import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

describe('Test Setup Verification', () => {
  it('should have vitest working correctly', () => {
    expect(true).toBe(true)
  })

  it('should have fast-check working correctly', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return typeof n === 'number'
      }),
      { numRuns: 10 }
    )
  })

  it('should have TypeScript types working', () => {
    const testString: string = 'test'
    const testNumber: number = 42
    const testBoolean: boolean = true
    
    expect(typeof testString).toBe('string')
    expect(typeof testNumber).toBe('number')
    expect(typeof testBoolean).toBe('boolean')
  })
})