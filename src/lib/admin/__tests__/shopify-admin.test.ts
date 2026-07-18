import { afterEach, describe, expect, it, vi } from 'vitest'
import { shopifyAdminClient } from '../../shopify/admin-client'
import { normalizeProductCode, resolveAdminProductCodes, updateProductFilterMetafields, validateProductCode } from '../shopify-admin'

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
