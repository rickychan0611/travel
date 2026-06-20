import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn utility', () => {
  it('returns a single class unchanged', () => {
    expect(cn('text-sm')).toBe('text-sm')
  })

  it('merges multiple classes', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
  })

  it('resolves Tailwind conflicts — last class wins', () => {
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })

  it('handles conditional classes (falsy values are ignored)', () => {
    expect(cn('base', false && 'ignored', undefined, 'visible')).toBe('base visible')
  })

  it('handles object syntax', () => {
    expect(cn({ 'font-bold': true, italic: false })).toBe('font-bold')
  })

  it('returns empty string for no arguments', () => {
    expect(cn()).toBe('')
  })
})
