import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('merges conflicting Tailwind utilities', () => {
    expect(cn('p-2', undefined, 'p-4')).toBe('p-4')
  })
})
