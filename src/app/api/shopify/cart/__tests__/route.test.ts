import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import type { CartItem } from '@/store/cart'

const mockRequest = vi.fn()

vi.mock('@/lib/shopify/client', () => ({
  shopifyClient: { request: mockRequest },
}))

const { POST } = await import('../route')

const makeItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  variantId: 'gid://shopify/ProductVariant/1',
  productHandle: 'tour-victoria',
  productTitle: 'Victoria Day Tour',
  departureDate: '2026-07-01',
  partySize: 2,
  pricePerPerson: 99,
  currencyCode: 'CAD',
  quantity: 1,
  pickupLocationId: null,
  addons: [],
  lineItemProperties: {},
  ...overrides,
})

const makeRequest = (body: unknown) =>
  new NextRequest('http://localhost/api/shopify/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

const mockSuccess = (checkoutUrl = 'https://store.myshopify.com/checkouts/abc') => ({
  data: {
    cartCreate: {
      cart: { id: 'cart-1', checkoutUrl },
      userErrors: [],
    },
  },
  errors: undefined,
})

describe('POST /api/shopify/cart', () => {
  beforeEach(() => {
    mockRequest.mockReset()
  })

  it('returns 400 when body is invalid JSON', async () => {
    const req = new NextRequest('http://localhost/api/shopify/cart', {
      method: 'POST',
      body: 'not-json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when items array is missing', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it('returns 400 when items array is empty', async () => {
    const res = await POST(makeRequest({ items: [] }))
    expect(res.status).toBe(400)
  })

  it('returns 200 with checkoutUrl on success', async () => {
    mockRequest.mockResolvedValueOnce(mockSuccess('https://store.myshopify.com/checkouts/abc'))

    const res = await POST(makeRequest({ items: [makeItem()] }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.checkoutUrl).toBe('https://store.myshopify.com/checkouts/abc')
  })

  it('sends quantity: 1 per line item regardless of partySize', async () => {
    mockRequest.mockResolvedValueOnce(mockSuccess())

    await POST(makeRequest({ items: [makeItem({ partySize: 5 })] }))

    const calledWith = mockRequest.mock.calls[0][1].variables.lines[0]
    expect(calledWith.quantity).toBe(1)
  })

  it('attaches Departure Date and Party Size as line item attributes', async () => {
    mockRequest.mockResolvedValueOnce(mockSuccess())

    await POST(makeRequest({ items: [makeItem({ departureDate: '2026-08-15', partySize: 3 })] }))

    const attrs: Array<{ key: string; value: string }> =
      mockRequest.mock.calls[0][1].variables.lines[0].attributes

    expect(attrs).toContainEqual({ key: 'Departure Date', value: '2026-08-15' })
    expect(attrs).toContainEqual({ key: 'Party Size',     value: '3' })
  })

  it('includes Pickup Location attribute when pickupLocationId is set', async () => {
    mockRequest.mockResolvedValueOnce(mockSuccess())

    await POST(makeRequest({ items: [makeItem({ pickupLocationId: 'pickup-downtown' })] }))

    const attrs: Array<{ key: string; value: string }> =
      mockRequest.mock.calls[0][1].variables.lines[0].attributes

    expect(attrs).toContainEqual({ key: 'Pickup Location', value: 'pickup-downtown' })
  })

  it('omits Pickup Location attribute when pickupLocationId is null', async () => {
    mockRequest.mockResolvedValueOnce(mockSuccess())

    await POST(makeRequest({ items: [makeItem({ pickupLocationId: null })] }))

    const attrs: Array<{ key: string; value: string }> =
      mockRequest.mock.calls[0][1].variables.lines[0].attributes

    expect(attrs.map((a) => a.key)).not.toContain('Pickup Location')
  })

  it('returns 502 when Shopify returns GraphQL errors', async () => {
    mockRequest.mockResolvedValueOnce({
      data: undefined,
      errors: [{ message: 'Unauthorized' }],
    })

    const res = await POST(makeRequest({ items: [makeItem()] }))
    expect(res.status).toBe(502)
  })

  it('returns 422 when Shopify returns userErrors', async () => {
    mockRequest.mockResolvedValueOnce({
      data: {
        cartCreate: {
          cart: null,
          userErrors: [{ field: ['merchandiseId'], message: 'Invalid variant' }],
        },
      },
      errors: undefined,
    })

    const res = await POST(makeRequest({ items: [makeItem()] }))
    const json = await res.json()

    expect(res.status).toBe(422)
    expect(json.error).toBe('Invalid variant')
  })

  it('returns 502 when checkoutUrl is missing from the response', async () => {
    mockRequest.mockResolvedValueOnce({
      data: { cartCreate: { cart: null, userErrors: [] } },
      errors: undefined,
    })

    const res = await POST(makeRequest({ items: [makeItem()] }))
    expect(res.status).toBe(502)
  })

  it('returns 500 when shopifyClient.request throws', async () => {
    mockRequest.mockRejectedValueOnce(new Error('Network failure'))

    const res = await POST(makeRequest({ items: [makeItem()] }))
    expect(res.status).toBe(500)
  })
})
