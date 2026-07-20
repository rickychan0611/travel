import { describe, expect, it } from 'vitest'
import {
  buildAddonVariantMetafields,
  buildDryRunPayload,
  buildProductImages,
  buildFilterFacets,
  buildProductMetafields,
  buildProductPayload,
  buildSearchAliases,
  buildTourVariantMetafields,
  buildTourVariants,
  isRequestOnlyAddon,
  mergeSyncedProductTags,
  nonShippableInventoryItemInput,
} from './toursbms-shopify-sync.mjs'

const fixture = {
  extractedAt: '2026-07-13T00:00:00.000Z',
  product: {
    productCode: 'P00000001',
    productViewCode: 'R0000001',
    groupNo: 'TEST4D',
    title: 'Test Cancun Tour',
    categoryName: 'Mexico',
    duration: { days: 4, nights: 3, label: '4 days / 3 nights' },
    start: { regionName: 'Cancun' },
    end: { regionName: 'Cancun' },
  },
  media: {
    images: ['https://example.com/one.jpg', 'https://example.com/two.jpg'],
  },
  highlights: { text: 'One highlight\nSecond highlight', html: '<ul><li>One highlight</li></ul>' },
  pricing: {
    requestedCurrency: 'USD',
    availability: [
      {
        date: '2026-07-13',
        stockStatus: 200,
        remainingStock: 10,
        currency: 'USD',
        prices: [
          { priceType: 3, label: 'Single room', amount: 1919 },
          { priceType: 2, label: 'Child', amount: 709 },
        ],
      },
      {
        date: '2026-07-14',
        stockStatus: 200,
        remainingStock: 8,
        currency: 'USD',
        prices: [
          { priceType: 3, label: 'Single room', amount: 1999 },
          { priceType: 2, label: 'Child', amount: 799 },
        ],
      },
    ],
  },
  itinerary: {
    days: [
      {
        dayNumber: 1,
        section: 'Home|||3+++Cancun',
        sectionStops: [{ type: 'place', label: 'Home' }, { type: 'transfer', place: 'Cancun', vehicle: 'Airplane' }],
        content: [],
      },
    ],
  },
  cost: { includesHtml: '<p>Included</p>', excludesHtml: '<p>Excluded</p>' },
  policy_notice: { notices: [] },
  pickup_dropoff: { pickup: [], dropoff: [] },
  addons: [
    { code: 'S1', name: 'Chargeable Add-on', amount: 15, currency: 'USD', peopleTypeLabel: 'All' },
    { code: 'S2', name: 'Add pre night hotel', amount: 0, currency: 'USD', peopleTypeLabel: 'All' },
  ],
  shopify_mapping: {
    handle: 'test-cancun-tour',
    title: 'Test Cancun Tour',
    tags: ['tour'],
  },
  source: { productPageUrl: 'https://example.com/product' },
}

describe('ToursBMS Shopify sync builders', () => {
  it('builds storefront filter facets from ToursBMS data', () => {
    const facets = buildFilterFacets({
      ...fixture,
      product: { ...fixture.product, productForm: 1, transfers: ['Airport pick-up'], destinations: [{ provinceName: 'Yucatan' }] },
      constraints: { confirmType: 1 },
    })
    expect(facets.durationDays).toBe(4)
    expect(facets.departureDates).toEqual(['2026-07-13', '2026-07-14'])
    expect(facets.transfers).toEqual(['airport-pick-up'])
    expect(facets.tourFormats).toEqual(['package-tour'])
    expect(facets.confirmMethods).toEqual(['manual'])
  })

  it('replaces sync-owned tags while retaining manual Shopify tags', () => {
    expect(mergeSyncedProductTags(['staff-pick', 'region-europe', 'code:OLD'], ['tour', 'region-asia', 'code:NEW'])).toEqual(['staff-pick', 'tour', 'region-asia', 'code:NEW'])
  })
  it('marks synced Shopify inventory items as not requiring shipping', () => {
    expect(nonShippableInventoryItemInput()).toEqual({ requiresShipping: false })
  })

  it('builds variant metafields separately from the productSet payload', () => {
    expect(buildTourVariantMetafields('gid://shopify/ProductVariant/1', {
      date: '2026-07-13',
      priceType: 3,
      travelerType: 'adult',
    })).toEqual([
      expect.objectContaining({ ownerId: 'gid://shopify/ProductVariant/1', key: 'departure_date', value: '2026-07-13' }),
      expect.objectContaining({ ownerId: 'gid://shopify/ProductVariant/1', key: 'price_type', value: '3' }),
      expect.objectContaining({ ownerId: 'gid://shopify/ProductVariant/1', key: 'traveler_type', value: 'adult' }),
    ])
    expect(buildAddonVariantMetafields('gid://shopify/ProductVariant/2', { code: 'S1' })).toEqual([
      expect.objectContaining({ ownerId: 'gid://shopify/ProductVariant/2', key: 'addon_code', value: 'S1' }),
    ])
  })

  it('creates one variant per departure date and price type', () => {
    const variants = buildTourVariants(fixture)

    expect(variants).toHaveLength(4)
    expect(variants[0]).toMatchObject({
      date: '2026-07-13',
      priceType: 3,
      travelerType: 'adult',
      label: 'Single room · Adult',
      price: '1919.00',
      sku: 'P00000001-2026-07-13-3-ADULT',
    })
    expect(variants[1]).toMatchObject({ priceType: 3, travelerType: 'child', label: 'Single room · Child', price: '709.00' })
  })

  it('keeps image source URL order and roles stable', () => {
    const images = buildProductImages(fixture)

    expect(images).toEqual([
      expect.objectContaining({ sourceUrl: 'https://example.com/one.jpg', position: 1, role: 'featured' }),
      expect.objectContaining({ sourceUrl: 'https://example.com/two.jpg', position: 2, role: 'gallery' }),
    ])
  })

  it('classifies request-only add-ons and builds dry-run payload sections', () => {
    expect(isRequestOnlyAddon(fixture.addons[0])).toBe(false)
    expect(isRequestOnlyAddon(fixture.addons[1])).toBe(true)

    const payload = buildDryRunPayload({ en: fixture })
    expect(payload.product.handle).toBe('test-cancun-tour')
    expect(payload.addonProduct.variants).toHaveLength(1)
    expect(payload.metaobjects.some((entry) => entry.type === 'tour_departure')).toBe(true)
    expect(payload.images).toHaveLength(2)
  })

  it('allows products with no departure variants to sync content only', () => {
    const payload = buildDryRunPayload({
      en: {
        ...fixture,
        pricing: { ...fixture.pricing, availability: [], basePrices: [], firstAvailableDate: null },
      },
    })

    expect(payload.variants).toHaveLength(0)
    expect(payload.addonProduct.variants).toHaveLength(0)
    expect(payload.metaobjects.some((entry) => entry.type === 'tour_addon')).toBe(false)
    expect(payload.metaobjects.some((entry) => entry.type === 'tour_content')).toBe(true)
  })

  it('adds Shopify filter facts and discovery tags for admin/category pages', () => {
    const metafields = Object.fromEntries(buildProductMetafields(fixture).map((field) => [field.key, field.value]))
    const payload = buildProductPayload(fixture, 'ACTIVE')

    expect(metafields.country).toBe('Mexico')
    expect(metafields.city).toBe('Cancun')
    expect(metafields.bookable).toBe('true')
    expect(metafields.min_price).toBe('709.00')
    expect(metafields.max_price).toBe('1999.00')
    expect(metafields.earliest_departure).toBe('2026-07-13')
    expect(metafields.latest_departure).toBe('2026-07-14')
    expect(metafields.pricing_mode).toBe('room_occupancy')
    expect(JSON.parse(metafields.rate_template)).toEqual([
      { rateType: 'Single room', travelerType: 'adult' },
      { rateType: 'Single room', travelerType: 'child' },
    ])
    expect(payload.tags).toEqual(expect.arrayContaining(['country-mexico', 'city-cancun', 'bookable']))
  })

  it('builds multilingual structured search aliases', () => {
    const aliases = buildSearchAliases({
      en: fixture,
      'zh-CN': {
        ...fixture,
        product: { ...fixture.product, title: '坎昆精选行程', start: { regionName: '坎昆' }, end: { regionName: '坎昆' } },
        shopify_mapping: { ...fixture.shopify_mapping, title: '坎昆精选行程' },
      },
    })
    expect(aliases).toEqual(expect.arrayContaining(['Test Cancun Tour', '坎昆精选行程', 'Mexico', 'Cancun']))
    const metafields = Object.fromEntries(buildProductMetafields(fixture, { en: fixture, 'zh-CN': { ...fixture, product: { ...fixture.product, title: '坎昆精选行程' }, shopify_mapping: { ...fixture.shopify_mapping, title: '坎昆精选行程' } } }).map((field) => [field.key, field.value]))
    expect(JSON.parse(metafields.search_aliases)).toContain('坎昆精选行程')
  })
})
