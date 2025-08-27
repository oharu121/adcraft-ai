import { describe, it, expect } from 'vitest'

describe('Basic test setup', () => {
  it('should be able to run tests', () => {
    expect(1 + 1).toBe(2)
  })

  it('should have access to vitest globals', () => {
    expect(expect).toBeDefined()
    expect(describe).toBeDefined()
    expect(it).toBeDefined()
  })
})