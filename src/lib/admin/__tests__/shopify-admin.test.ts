import { afterEach, describe, expect, it, vi } from 'vitest'
import { shopifyAdminClient } from '../../shopify/admin-client'
import {
  createAdminProduct,
  createDatePriceVariants,
  initializeDatePriceVariants,
  normalizeProductCode,
  resolveAdminProductCodes,
  updateProductFilterMetafields,
  validateProductCode,
} from '../shopify-admin'

describe('admin product creation', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates its initial Shopify variant as a non-physical item and publishes to the storefront channel', async () => {
    const request = vi.spyOn(shopifyAdminClient, 'request')
      .mockResolvedValueOnce({
        data: {
          productSet: {
            product: { id: 'gid://shopify/Product/1', handle: 'example-tour' },
            userErrors: [],
            productSetOperation: { userErrors: [] },
          },
        },
      })
      .mockResolvedValueOnce({
        data: { publications: { nodes: [{ id: 'gid://shopify/Publication/1', name: 'Travel Website Development' }] } },
      })
      .mockResolvedValueOnce({
        data: { publishablePublish: { userErrors: [] } },
      })

    await createAdminProduct({
      title: 'Example tour',
      handle: 'example-tour',
      productCode: 'P00000001',
      productType: 'Tour',
    })

    expect(request.mock.calls[0]?.[1]?.variables).toMatchObject({
      input: {
        variants: [{
          price: '0.00',
          inventoryItem: { requiresShipping: false },
        }],
      },
    })
    expect(request.mock.calls[2]?.[1]?.variables).toMatchObject({
      id: 'gid://shopify/Product/1',
      input: [{ publicationId: 'gid://shopify/Publication/1' }],
    })
  })
})

describe('product code validation', () => {
  it('normalizes codes before saving', () => {
    expect(normalizeProductCode(' p00008484 ')).toBe('P00008484')
    expect(validateProductCode(' custom-tour_12 ')).toBe('CUSTOM-TOUR_12')
  })

  it('rejects unsafe product codes', () => {
    expect(() => validateProductCode('P 00008484')).toThrow(/3-40 characters/)
    expect(() => validateProductCode('')).toThrow(/required/)
  })
})

describe('resolveAdminProductCodes', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('resolves case-insensitive product codes to Shopify product IDs', async () => {
    vi.spyOn(shopifyAdminClient, 'request').mockResolvedValue({
      data: {
        products: {
          nodes: [{
            id: 'gid://shopify/Product/8484',
            title: 'Example tour',
            metafields: { nodes: [{ namespace: 'toursbms', key: 'product_code', value: 'P00008484', type: 'single_line_text_field' }] },
          }],
          pageInfo: { hasNextPage: false, endCursor: null },
        },
      },
    })

    const result = await resolveAdminProductCodes(['p00008484'])

    expect(result.get('P00008484')).toBe('gid://shopify/Product/8484')
  })
})

describe('updateProductFilterMetafields', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('omits optional empty strings while preserving false and zero values', async () => {
    const request = vi.spyOn(shopifyAdminClient, 'request').mockResolvedValue({
      data: { metafieldsSet: { userErrors: [] } },
    })

    await updateProductFilterMetafields('gid://shopify/Product/1', {
      country: '',
      city: '   ',
      earliest_departure: '',
      duration_days: 0,
      bookable: false,
      pricing_mode: 'per_person',
    })

    expect(request).toHaveBeenCalledOnce()
    expect(request.mock.calls[0]?.[1]?.variables).toEqual({
      metafields: [
        {
          ownerId: 'gid://shopify/Product/1',
          namespace: 'toursbms',
          key: 'duration_days',
          type: 'number_integer',
          value: '0',
        },
        {
          ownerId: 'gid://shopify/Product/1',
          namespace: 'toursbms',
          key: 'bookable',
          type: 'boolean',
          value: 'false',
        },
        {
          ownerId: 'gid://shopify/Product/1',
          namespace: 'toursbms',
          key: 'pricing_mode',
          type: 'single_line_text_field',
          value: 'per_person',
        },
      ],
    })
  })

  it('does not call Shopify when every value is empty', async () => {
    const request = vi.spyOn(shopifyAdminClient, 'request')

    await updateProductFilterMetafields('gid://shopify/Product/1', {
      country: '',
      latest_departure: '  ',
    })

    expect(request).not.toHaveBeenCalled()
  })
})

describe('admin variant publication', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.SHOPIFY_STOREFRONT_PUBLICATION_NAME
  })

  it('publishes a product after adding date-price variants', async () => {
    const request = vi.spyOn(shopifyAdminClient, 'request')
      .mockResolvedValueOnce({
        data: { productVariantsBulkCreate: { productVariants: [{ id: 'gid://shopify/ProductVariant/1' }], userErrors: [] } },
      })
      .mockResolvedValueOnce({
        data: { publications: { nodes: [{ id: 'gid://shopify/Publication/1', name: 'Travel Website Development' }] } },
      })
      .mockResolvedValueOnce({
        data: { publishablePublish: { userErrors: [] } },
      })

    await createDatePriceVariants({
      productId: 'gid://shopify/Product/1',
      date: '2026-08-01',
      rates: [{ rateType: 'Adult', price: '100.00', priceType: 1, travelerType: 'adult' }],
    })

    expect(request).toHaveBeenCalledTimes(3)
    expect(request.mock.calls[0]?.[1]?.variables).toMatchObject({
      variants: [{ inventoryItem: { requiresShipping: false } }],
    })
    expect(request.mock.calls[2]?.[1]?.variables).toEqual({
      id: 'gid://shopify/Product/1',
      input: [{ publicationId: 'gid://shopify/Publication/1' }],
    })
  })

  it('publishes a product after initializing its first date-price variants', async () => {
    process.env.SHOPIFY_STOREFRONT_PUBLICATION_NAME = 'Custom Storefront'
    const request = vi.spyOn(shopifyAdminClient, 'request')
      .mockResolvedValueOnce({
        data: {
          productSet: {
            product: { variants: { nodes: [{ id: 'gid://shopify/ProductVariant/2' }] } },
            userErrors: [],
            productSetOperation: { userErrors: [] },
          },
        },
      })
      .mockResolvedValueOnce({
        data: { publications: { nodes: [{ id: 'gid://shopify/Publication/2', name: 'Custom Storefront' }] } },
      })
      .mockResolvedValueOnce({
        data: { publishablePublish: { userErrors: [] } },
      })

    await initializeDatePriceVariants({
      productId: 'gid://shopify/Product/2',
      date: '2026-08-02',
      rates: [{ rateType: 'Adult', price: '150.00', priceType: 1, travelerType: 'adult' }],
    })

    expect(request).toHaveBeenCalledTimes(3)
    expect(request.mock.calls[0]?.[1]?.variables).toMatchObject({
      input: {
        variants: [{ inventoryItem: { requiresShipping: false } }],
      },
    })
    expect(request.mock.calls[2]?.[1]?.variables).toEqual({
      id: 'gid://shopify/Product/2',
      input: [{ publicationId: 'gid://shopify/Publication/2' }],
    })
  })
})
