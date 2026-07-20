import { describe, expect, it } from 'vitest'
import {
  catalogKeywordHref,
  matchCatalogProducts,
  normalizeCatalogKeyword,
  productMatchesCatalogKeyword,
} from '../../catalog-keywords'
import type { CollectionProduct } from '../types'

function product(id: string, aliases: string[], tags: string[] = []): CollectionProduct {
  return {
    id,
    handle: id,
    title: aliases[0] || id,
    tags: ['tour', ...tags],
    productType: 'Tour',
    searchAliases: { value: JSON.stringify(aliases) },
    priceRange: { minVariantPrice: { amount: '100', currencyCode: 'USD' } },
    images: { nodes: [] },
  }
}

describe('catalog keyword navigation', () => {
  it('normalizes accents, URL encoding, and display suffixes', () => {
    expect(normalizeCatalogKeyword('Canc%C3%BAn Tours')).toBe('cancun')
    expect(normalizeCatalogKeyword('北美热门线路')).toBe('北美')
    expect(catalogKeywordHref('en', 'Los Angeles')).toBe('/en/Los%20Angeles')
    expect(catalogKeywordHref('en', 'Day & Short Tours', { days: 1 })).toBe('/en/Day%20%26%20Short%20Tours?days=1')
  })

  it('matches multilingual structured aliases without description text', () => {
    const china = product('china', ['China', '中国', 'Beijing'], ['region-asia'])
    const seattle = product('seattle', ['Seattle', 'Rocky Mountains', 'Canada'], ['region-north-america'])
    expect(productMatchesCatalogKeyword(china, '中国旅游')).toBe(true)
    expect(productMatchesCatalogKeyword(seattle, 'China')).toBe(false)
  })

  it('uses Signature Collections translations as runtime equivalents', () => {
    const losAngeles = product('los-angeles', ['Los Angeles'], ['region-north-america'])
    expect(productMatchesCatalogKeyword(losAngeles, '洛杉矶')).toBe(true)
    expect(productMatchesCatalogKeyword(losAngeles, '洛杉磯')).toBe(true)
  })

  it('expands broad regional keywords', () => {
    const usa = product('usa', ['United States', 'New York'], ['region-north-america'])
    const peru = product('peru', ['Peru'], ['region-latin-america'])
    const japan = product('japan', ['Japan'], ['region-asia'])
    expect(matchCatalogProducts([usa, peru, japan], 'Americas').map((item) => item.id)).toEqual(['usa', 'peru'])
  })

  it('matches one-day navigation from the structured duration facet', () => {
    const oneDay = product('one-day', ['Seattle'])
    oneDay.filterFacets = { value: JSON.stringify({ durationDays: 1 }) }
    const multiDay = product('multi-day', ['Seattle'])
    multiDay.filterFacets = { value: JSON.stringify({ durationDays: 3 }) }

    expect(matchCatalogProducts([oneDay, multiDay], 'Day & Short Tours').map((item) => item.id)).toEqual(['one-day'])
  })
})
