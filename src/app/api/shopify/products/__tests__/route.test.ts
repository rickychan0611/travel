import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockRequest = vi.fn()

vi.mock('@/lib/shopify/client', () => ({
  shopifyClient: { request: mockRequest },
}))

const { GET } = await import('../route')

const makeUrl = (params: Record<string, string>) => {
  const url = new URL('http://localhost/api/shopify/products')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return url.toString()
}

const mockCollectionData = {
  collection: {
    id: 'gid://shopify/Collection/1',
    handle: 'hot-seasonal',
    title: 'Hot Seasonal',
    products: {
      nodes: [
        {
          id: 'gid://shopify/Product/1',
          handle: 'tour-victoria',
          title: 'Victoria Day Tour',
          tags: ['region:west', 'booking:instant'],
          productType: 'Day Trip',
          priceRange: { minVariantPrice: { amount: '99.00', currencyCode: 'CAD' } },
          images: { nodes: [{ url: 'https://cdn.shopify.com/img.jpg', altText: null }] },
        },
      ],
    },
  },
}

describe('GET /api/shopify/products', () => {
  beforeEach(() => {
    mockRequest.mockReset()
  })

  it('returns 400 when collection param is missing', async () => {
    const req = new NextRequest('http://localhost/api/shopify/products')
    const res = await GET(req)

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('collection param required')
  })

  it('returns 200 with collection data for a valid collection param', async () => {
    mockRequest.mockResolvedValueOnce({ data: mockCollectionData, errors: undefined })

    const req = new NextRequest(makeUrl({ collection: 'hot-seasonal' }))
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.collection.handle).toBe('hot-seasonal')
  })

  it('passes the first param as a number to shopifyClient', async () => {
    mockRequest.mockResolvedValueOnce({ data: mockCollectionData, errors: undefined })

    const req = new NextRequest(makeUrl({ collection: 'hot-seasonal', first: '10' }))
    await GET(req)

    expect(mockRequest).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ variables: { handle: 'hot-seasonal', first: 10 } })
    )
  })

  it('defaults first to 20 when not provided', async () => {
    mockRequest.mockResolvedValueOnce({ data: mockCollectionData, errors: undefined })

    const req = new NextRequest(makeUrl({ collection: 'hot-seasonal' }))
    await GET(req)

    expect(mockRequest).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ variables: { handle: 'hot-seasonal', first: 20 } })
    )
  })

  it('returns 500 when Shopify returns errors', async () => {
    mockRequest.mockResolvedValueOnce({
      data: undefined,
      errors: [{ message: 'Unauthorized' }],
    })

    const req = new NextRequest(makeUrl({ collection: 'hot-seasonal' }))
    const res = await GET(req)

    expect(res.status).toBe(500)
  })

  it('returns 500 when shopifyClient.request throws', async () => {
    mockRequest.mockRejectedValueOnce(new Error('Network error'))

    const req = new NextRequest(makeUrl({ collection: 'hot-seasonal' }))
    const res = await GET(req)

    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('Failed to fetch products')
  })
})
