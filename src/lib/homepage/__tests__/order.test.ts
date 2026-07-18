import { describe, expect, it } from 'vitest'
import { moveHomepageItem, sortHomepageItems } from '../order'

const items = [
  { id: 'third', position: 3 },
  { id: 'first', position: 1 },
  { id: 'second', position: 2 },
]

describe('homepage ordering', () => {
  it('sorts items by position', () => {
    expect(sortHomepageItems(items).map((item) => item.id)).toEqual(['first', 'second', 'third'])
  })

  it('moves an item up or down without creating duplicate positions in the resulting order', () => {
    expect(moveHomepageItem(items, 'second', 'up').map((item) => item.id)).toEqual(['second', 'first', 'third'])
    expect(moveHomepageItem(items, 'second', 'down').map((item) => item.id)).toEqual(['first', 'third', 'second'])
  })

  it('keeps boundary items in place', () => {
    expect(moveHomepageItem(items, 'first', 'up').map((item) => item.id)).toEqual(['first', 'second', 'third'])
    expect(moveHomepageItem(items, 'third', 'down').map((item) => item.id)).toEqual(['first', 'second', 'third'])
  })
})
