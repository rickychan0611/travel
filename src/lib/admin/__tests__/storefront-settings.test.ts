import { afterEach, describe, expect, it, vi } from 'vitest'
import { shopifyAdminClient } from '../../shopify/admin-client'

import {
  getStorefrontSettings,
  setStorefrontSsrEnabled,
} from '../storefront-settings'

describe('Shopify-backed storefront settings', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('reads the rendering setting from the Shopify shop metafield', async () => {
    const request = vi.spyOn(shopifyAdminClient, 'request').mockResolvedValueOnce({
      data: { shop: { id: 'gid://shopify/Shop/1', setting: { value: 'true' } } },
    })

    await expect(getStorefrontSettings()).resolves.toEqual({ ssrEnabled: true })
    expect(request).toHaveBeenCalledWith(
      expect.stringContaining('StorefrontSettings'),
      expect.objectContaining({
        cache: 'force-cache',
        next: expect.objectContaining({ tags: ['shopify-storefront-settings'] }),
      }),
    )
  })

  it('defaults safely when the metafield has not been created', async () => {
    vi.spyOn(shopifyAdminClient, 'request').mockResolvedValueOnce({
      data: { shop: { id: 'gid://shopify/Shop/1', setting: null } },
    })

    await expect(getStorefrontSettings()).resolves.toEqual({ ssrEnabled: false })
  })

  it('writes a boolean shop metafield and invalidates the shared cache', async () => {
    const request = vi.spyOn(shopifyAdminClient, 'request')
      .mockResolvedValueOnce({ data: { shop: { id: 'gid://shopify/Shop/1' } } })
      .mockResolvedValueOnce({
        data: {
          metafieldsSet: {
            metafields: [{ id: 'gid://shopify/Metafield/1', value: 'true' }],
            userErrors: [],
          },
        },
      })

    await expect(setStorefrontSsrEnabled(true)).resolves.toEqual({ ssrEnabled: true })
    expect(request.mock.calls[1][1]).toMatchObject({
      variables: {
        metafields: [{
          ownerId: 'gid://shopify/Shop/1',
          namespace: 'toursbms',
          key: 'storefront_ssr_enabled',
          type: 'boolean',
          value: 'true',
        }],
      },
      cache: 'no-store',
    })
  })

  it('surfaces Shopify metafield validation errors', async () => {
    vi.spyOn(shopifyAdminClient, 'request')
      .mockResolvedValueOnce({ data: { shop: { id: 'gid://shopify/Shop/1' } } })
      .mockResolvedValueOnce({
        data: {
          metafieldsSet: {
            metafields: [],
            userErrors: [{ message: 'Access denied' }],
          },
        },
      })

    await expect(setStorefrontSsrEnabled(true)).rejects.toThrow('Access denied')
  })
})
