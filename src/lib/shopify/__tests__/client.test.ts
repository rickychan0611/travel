import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('shopify client', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('creates a client when env vars are present', async () => {
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN = 'test-store.myshopify.com'
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN = 'test-token'
    const { shopifyClient } = await import('../client')
    expect(shopifyClient).toBeDefined()
    expect(typeof shopifyClient.request).toBe('function')
  })

  it('throws when NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN is missing', async () => {
    delete process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
    await expect(import('../client')).rejects.toThrow(
      'NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN is not set'
    )
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN = 'test-store.myshopify.com'
  })

  it('throws when SHOPIFY_STOREFRONT_ACCESS_TOKEN is missing', async () => {
    delete process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN
    await expect(import('../client')).rejects.toThrow(
      'SHOPIFY_STOREFRONT_ACCESS_TOKEN is not set'
    )
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN = 'test-storefront-token'
  })

  it('uses privateAccessToken (server-only token)', async () => {
    const createClient = vi.fn().mockReturnValue({ request: vi.fn() })
    vi.doMock('@shopify/storefront-api-client', () => ({
      createStorefrontApiClient: createClient,
    }))
    await import('../client')
    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({ privateAccessToken: expect.any(String) })
    )
    expect(createClient).not.toHaveBeenCalledWith(
      expect.objectContaining({ publicAccessToken: expect.any(String) })
    )
  })
})
