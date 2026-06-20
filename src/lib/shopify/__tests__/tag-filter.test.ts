/**
 * Tests for internal-tag filtering logic used on PDP and ProductCard.
 * Tags like "booking:instant", "tour-code:Y3", "region:west" are internal
 * and must be stripped before being displayed to users.
 */
import { describe, it, expect } from 'vitest'

const INTERNAL_PREFIXES = ['booking:', 'tour-code:', 'region:']

function filterDisplayTags(tags: string[]): string[] {
  return tags.filter((t) => !INTERNAL_PREFIXES.some((prefix) => t.startsWith(prefix)))
}

function stripTagPrefix(tag: string): string {
  return tag.replace(/^[^:]+:/, '')
}

describe('filterDisplayTags', () => {
  it('removes booking: tags', () => {
    expect(filterDisplayTags(['booking:instant'])).toEqual([])
  })

  it('removes tour-code: tags', () => {
    expect(filterDisplayTags(['tour-code:Y3'])).toEqual([])
  })

  it('removes region: tags', () => {
    expect(filterDisplayTags(['region:west'])).toEqual([])
  })

  it('keeps user-facing tags', () => {
    expect(filterDisplayTags(['family-friendly', 'guided'])).toEqual(['family-friendly', 'guided'])
  })

  it('filters mixed tag arrays correctly', () => {
    const tags = ['booking:instant', 'family-friendly', 'tour-code:Y3', 'guided', 'region:west']
    expect(filterDisplayTags(tags)).toEqual(['family-friendly', 'guided'])
  })

  it('returns empty array for all-internal tags', () => {
    expect(filterDisplayTags(['booking:manual', 'tour-code:X1', 'region:east'])).toEqual([])
  })

  it('returns all tags when none are internal', () => {
    const tags = ['adventure', 'nature', 'hiking']
    expect(filterDisplayTags(tags)).toEqual(tags)
  })
})

describe('stripTagPrefix', () => {
  it('strips key: prefix from a tag', () => {
    expect(stripTagPrefix('difficulty:easy')).toBe('easy')
  })

  it('returns tag unchanged when there is no colon', () => {
    expect(stripTagPrefix('adventure')).toBe('adventure')
  })

  it('handles multiple colons — strips only the first key', () => {
    expect(stripTagPrefix('category:food:drink')).toBe('food:drink')
  })
})
