import { describe, expect, it } from 'vitest'
import { buildProductFilterOptions, filterProducts, parseProductFilterState, productFilterSearchParams } from '../product-filters'
import type { CollectionProduct } from '../types'

function product(id: string, facets: Record<string, unknown>, amount = '100'): CollectionProduct {
  return {
    id,
    handle: id,
    title: `Tour ${id}`,
    productCode: { value: id.toUpperCase() },
    tags: ['tour'],
    productType: 'Tour',
    filterFacets: { value: JSON.stringify(facets) },
    priceRange: { minVariantPrice: { amount, currencyCode: 'USD' } },
    images: { nodes: [] },
  }
}

const products = [
  product('one', { productTypes: ['Seattle'], departureCountries: ['United States'], departureCities: ['Seattle'], returnCities: ['Seattle'], destinations: ['Yellowstone'], labels: ['Outdoor Adventure'], durationDays: 3, departureDates: ['2026-08-10'], transfers: ['airport-pick-up'], tourFormats: ['package-tour'], confirmMethods: ['manual'] }, '300'),
  product('two', { productTypes: ['Vancouver'], departureCountries: ['Canada'], departureCities: ['Vancouver'], returnCities: ['Calgary'], destinations: ['Banff'], durationDays: 5, departureDates: ['2026-09-15'], transfers: ['airport-drop-off'], tourFormats: ['private-group'], confirmMethods: ['instant'] }, '900'),
]

describe('product filters', () => {
  it('parses repeated URL values and normalizes invalid values', () => {
    const state = parseProductFilterState({ region: ['asia', 'other'], destination: ['yellowstone', 'banff'], days: ['3', '-2'], minPrice: '100', sort: 'price-asc', page: '2' })
    expect(state.regions).toEqual(['asia', 'other'])
    expect(state.destinations).toEqual(['yellowstone', 'banff'])
    expect(state.days).toEqual([3])
    expect(state.minPrice).toBe(100)
    expect(state.sort).toBe('price-asc')
    expect(state.page).toBe(2)
  })

  it('uses OR inside a facet and AND between facets', () => {
    const state = parseProductFilterState({ departureCountry: ['united-states', 'canada'], tourFormat: 'package-tour' })
    expect(filterProducts(products, state).map((item) => item.id)).toEqual(['one'])
  })

  it('matches an actual departure date inside the range', () => {
    const state = parseProductFilterState({ departureFrom: '2026-09-01', departureTo: '2026-09-30' })
    expect(filterProducts(products, state).map((item) => item.id)).toEqual(['two'])
  })

  it('builds dynamic options and counts from current products', () => {
    const options = buildProductFilterOptions(products)
    expect(options.departureCountries).toEqual([
      { value: 'canada', label: 'Canada', count: 1 },
      { value: 'united-states', label: 'United States', count: 1 },
    ])
    expect(options.days.map((item) => item.value)).toEqual(['3', '5'])
  })

  it('serializes filters into a shareable URL query', () => {
    const state = parseProductFilterState({ destination: ['yellowstone', 'banff'], q: 'P0001', page: '3' })
    const query = productFilterSearchParams(state)
    expect(new URLSearchParams(query).getAll('destination')).toEqual(['yellowstone', 'banff'])
    expect(new URLSearchParams(query).get('page')).toBe('3')
  })

  it('infers duration from existing product titles when the Shopify facet is missing', () => {
    const existingOneDayProduct = product('legacy-one-day', {})
    existingOneDayProduct.title = 'Isla Mujeres Catamaran Sailing 1-Day Tour'
    const state = parseProductFilterState({ days: '1' })

    expect(filterProducts([existingOneDayProduct], state).map((item) => item.id)).toEqual(['legacy-one-day'])
  })

  it('filters Asia and Other from synced Shopify region tags', () => {
    const asia = product('asia', {})
    asia.title = 'Maldives Island Resort'
    const other = product('other', {})
    other.searchAliases = { value: JSON.stringify(['Egypt', 'Africa']) }
    const europe = product('europe', {})
    europe.tags.push('region-europe')
    const state = parseProductFilterState({ region: ['asia', 'other'] })

    expect(filterProducts([asia, other, europe], state).map((item) => item.id)).toEqual(['asia', 'other'])
    expect(buildProductFilterOptions([asia, other, europe]).regions.map((item) => item.value)).toEqual(['asia', 'europe', 'other'])
  })
})
