import { describe, expect, it } from 'vitest'
import {
  buildDryRunPayload,
  buildProductImages,
  buildProductMetafields,
  buildProductPayload,
  buildTourVariants,
  isRequestOnlyAddon,
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
  it('creates one variant per departure date and price type', () => {
    const variants = buildTourVariants(fixture)

    expect(variants).toHaveLength(4)
    expect(variants[0]).toMatchObject({
      date: '2026-07-13',
      priceType: 3,
      label: 'Single room',
      price: '1919.00',
      sku: 'P00000001-2026-07-13-3-SINGLE-ROOM',
    })
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
    expect(payload.tags).toEqual(expect.arrayContaining(['country-mexico', 'city-cancun', 'bookable']))
  })
})
