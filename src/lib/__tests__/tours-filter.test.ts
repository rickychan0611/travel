/**
 * Tests for the filtering + search logic used by ToursFilter component.
 * The logic is extracted here so it can be tested without React rendering.
 */
import { describe, it, expect } from 'vitest'
import type { CollectionProduct } from '@/lib/shopify/types'
import { filterTourProducts, type TourFilterKey } from '../tours/filter-products'

function filterProducts(
  products: CollectionProduct[],
  active: TourFilterKey,
  searchQuery: string
): CollectionProduct[] {
  return filterTourProducts(products, active, searchQuery)
}

const makeProduct = (overrides: Partial<CollectionProduct> = {}): CollectionProduct => ({
  id: 'prod-1',
  handle: 'tour-victoria',
  title: 'Victoria Day Tour',
  tags: [],
  productType: 'day-trip',
  priceRange: { minVariantPrice: { amount: '99.00', currencyCode: 'CAD' } },
  images: { nodes: [] },
  ...overrides,
})

const PRODUCTS: CollectionProduct[] = [
  makeProduct({ id: '1', handle: 'victoria-day-tour', title: 'Victoria Day Tour',    productType: 'day-trip' }),
  makeProduct({ id: '2', handle: 'banff-group-tour', title: 'Banff Group Tour',     productType: 'group-tour' }),
  makeProduct({ id: '3', handle: 'whistler-small-group', title: 'Whistler Small Group', productType: 'small-group' }),
  makeProduct({ id: '4', handle: 'vancouver-day-trip', title: 'Vancouver Day Trip',   productType: 'day-trip' }),
]

describe('tours filter — type filter', () => {
  it('"all" returns every product', () => {
    expect(filterProducts(PRODUCTS, 'all', '')).toHaveLength(4)
  })

  it('"day-trip" returns only day-trip products', () => {
    const result = filterProducts(PRODUCTS, 'day-trip', '')
    expect(result).toHaveLength(2)
    result.forEach((p) => expect(p.productType).toBe('day-trip'))
  })

  it('"group-tour" returns only group-tour products', () => {
    const result = filterProducts(PRODUCTS, 'group-tour', '')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Banff Group Tour')
  })

  it('"small-group" returns only small-group products', () => {
    const result = filterProducts(PRODUCTS, 'small-group', '')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Whistler Small Group')
  })

  it('returns empty array when no products match the type', () => {
    expect(filterProducts(PRODUCTS, 'group-tour', 'nonexistent')).toHaveLength(0)
  })
})

describe('tours filter — search query', () => {
  it('empty query returns all products', () => {
    expect(filterProducts(PRODUCTS, 'all', '')).toHaveLength(4)
  })

  it('matches product title case-insensitively', () => {
    const result = filterProducts(PRODUCTS, 'all', 'victoria')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Victoria Day Tour')
  })

  it('returns empty array when query matches nothing', () => {
    expect(filterProducts(PRODUCTS, 'all', 'tokyo')).toHaveLength(0)
  })

  it('matches partial title', () => {
    const result = filterProducts(PRODUCTS, 'all', 'ban')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Banff Group Tour')
  })

  it('matches handle and tags', () => {
    const result = filterProducts([
      makeProduct({ id: '1', title: 'Premium Escape', handle: 'p0001', tags: ['dest-cancun'] }),
    ], 'all', 'cancun')
    expect(result).toHaveLength(1)
  })

  it('matches localized card title and place', () => {
    const result = filterProducts([
      makeProduct({
        id: '1',
        title: 'Dream Vacation',
        localizedTitle: '【白金尊享】带您享受浪漫',
        localizedPlace: '坎昆',
      }),
    ], 'all', '坎昆')
    expect(result).toHaveLength(1)
  })
})

describe('tours filter — combined type + search', () => {
  it('applies both filters with AND logic', () => {
    // day-trip AND "victoria" → only Victoria Day Tour
    const result = filterProducts(PRODUCTS, 'day-trip', 'victoria')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('returns empty when type matches but search does not', () => {
    const result = filterProducts(PRODUCTS, 'day-trip', 'banff')
    expect(result).toHaveLength(0)
  })

  it('returns empty when search matches but type does not', () => {
    const result = filterProducts(PRODUCTS, 'group-tour', 'victoria')
    expect(result).toHaveLength(0)
  })
})
