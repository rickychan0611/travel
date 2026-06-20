import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockRequest = vi.fn()

vi.mock('@/lib/shopify/client', () => ({
  shopifyClient: { request: mockRequest },
}))

// Import after mock is set up
const { GET } = await import('../route')

const makeParams = (handle: string) =>
  ({ params: Promise.resolve({ handle }) }) as { params: Promise<{ handle: string }> }

const makeCollectionData = (handle: string) => ({
  collection: {
    id: `gid://shopify/Collection/1`,
    handle,
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
})

describe('GET /api/shopify/collections/[handle]', () => {
  beforeEach(() => {
    mockRequest.mockReset()
  })

  it('returns 200 with collection data for a valid handle', async () => {
    const data = makeCollectionData('hot-seasonal')
    mockRequest.mockResolvedValueOnce({ data, errors: undefined })

    const req = new NextRequest('http://localhost/api/shopify/collections/hot-seasonal')
    const res = await GET(req, makeParams('hot-seasonal'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.collection.handle).toBe('hot-seasonal')
    expect(json.collection.products.nodes).toHaveLength(1)
  })

  it('returns 200 with null collection when handle does not exist', async () => {
    mockRequest.mockResolvedValueOnce({ data: { collection: null }, errors: undefined })

    const req = new NextRequest('http://localhost/api/shopify/collections/nonexistent')
    const res = await GET(req, makeParams('nonexistent'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.collection).toBeNull()
  })

  it('returns 500 when Shopify returns errors', async () => {
    mockRequest.mockResolvedValueOnce({
      data: undefined,
      errors: [{ message: 'Unauthorized' }],
    })

    const req = new NextRequest('http://localhost/api/shopify/collections/hot-seasonal')
    const res = await GET(req, makeParams('hot-seasonal'))

    expect(res.status).toBe(500)
  })

  it('returns 500 when shopifyClient.request throws', async () => {
    mockRequest.mockRejectedValueOnce(new Error('Network error'))

    const req = new NextRequest('http://localhost/api/shopify/collections/hot-seasonal')
    const res = await GET(req, makeParams('hot-seasonal'))

    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('Failed to fetch collection')
  })

  it('response products include id, title, handle, priceRange, and images', async () => {
    const data = makeCollectionData('hot-seasonal')
    mockRequest.mockResolvedValueOnce({ data, errors: undefined })

    const req = new NextRequest('http://localhost/api/shopify/collections/hot-seasonal')
    const res = await GET(req, makeParams('hot-seasonal'))
    const json = await res.json()
    const product = json.collection.products.nodes[0]

    expect(product).toMatchObject({
      id: expect.any(String),
      handle: expect.any(String),
      title: expect.any(String),
      priceRange: { minVariantPrice: { amount: expect.any(String), currencyCode: expect.any(String) } },
      images: { nodes: expect.any(Array) },
    })
  })
})
