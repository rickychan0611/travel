import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import type { CartItem } from '@/store/cart'
import { shopifyClient } from '../../../../../lib/shopify/client'

const { POST } = await import('../route')

// ── Cart item factory ─────────────────────────────────────────────────────────

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

const makeSuccess = (checkoutUrl = 'https://store.myshopify.com/checkouts/abc') => ({
  data: {
    cartCreate: {
      cart: { id: 'cart-1', checkoutUrl },
      userErrors: [],
    },
  },
  errors: undefined,
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/shopify/cart', () => {
  let requestSpy: ReturnType<typeof vi.spyOn<typeof shopifyClient, 'request'>>

  beforeEach(() => {
    requestSpy = vi.spyOn(shopifyClient, 'request')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── Input validation ──────────────────────────────────────────────────────

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

  // ── Happy path ────────────────────────────────────────────────────────────

  it('returns 200 with checkoutUrl on success', async () => {
    requestSpy.mockResolvedValueOnce(makeSuccess('https://store.myshopify.com/checkouts/abc') as never)

    const res = await POST(makeRequest({ items: [makeItem()] }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.checkoutUrl).toBe('https://store.myshopify.com/checkouts/abc')
  })

  // ── buyerIdentity / buyerEmail ────────────────────────────────────────────

  it('passes buyerIdentity.email when buyerEmail is in the request body', async () => {
    requestSpy.mockResolvedValueOnce(makeSuccess() as never)

    await POST(makeRequest({ items: [makeItem()], buyerEmail: 'user@example.com' }))

    const variables = requestSpy.mock.calls[0][1]?.variables
    expect(variables?.buyerIdentity).toEqual({ email: 'user@example.com' })
  })

  it('omits buyerIdentity when buyerEmail is absent', async () => {
    requestSpy.mockResolvedValueOnce(makeSuccess() as never)

    await POST(makeRequest({ items: [makeItem()] }))

    const variables = requestSpy.mock.calls[0][1]?.variables
    expect(variables?.buyerIdentity).toBeUndefined()
  })

  it('omits buyerIdentity when buyerEmail is an empty string', async () => {
    requestSpy.mockResolvedValueOnce(makeSuccess() as never)

    await POST(makeRequest({ items: [makeItem()], buyerEmail: '' }))

    const variables = requestSpy.mock.calls[0][1]?.variables
    expect(variables?.buyerIdentity).toBeUndefined()
  })

  // ── Line item construction ────────────────────────────────────────────────

  it('sends quantity 1 per line item regardless of partySize', async () => {
    requestSpy.mockResolvedValueOnce(makeSuccess() as never)

    await POST(makeRequest({ items: [makeItem({ partySize: 5 })] }))

    const lines = requestSpy.mock.calls[0][1]?.variables?.lines
    expect(lines[0].quantity).toBe(1)
  })

  it('attaches Departure Date and Party Size as line item attributes', async () => {
    requestSpy.mockResolvedValueOnce(makeSuccess() as never)

    await POST(makeRequest({
      items: [makeItem({ departureDate: '2026-08-15', partySize: 3 })],
    }))

    const attrs = requestSpy.mock.calls[0][1]?.variables?.lines[0].attributes
    expect(attrs).toContainEqual({ key: 'Departure Date', value: '2026-08-15' })
    expect(attrs).toContainEqual({ key: 'Party Size', value: '3' })
  })

  it('includes Pickup Location attribute when pickupLocationId is set', async () => {
    requestSpy.mockResolvedValueOnce(makeSuccess() as never)

    await POST(makeRequest({ items: [makeItem({ pickupLocationId: 'pickup-downtown' })] }))

    const attrs = requestSpy.mock.calls[0][1]?.variables?.lines[0].attributes
    expect(attrs).toContainEqual({ key: 'Pickup Location', value: 'pickup-downtown' })
  })

  it('omits Pickup Location attribute when pickupLocationId is null', async () => {
    requestSpy.mockResolvedValueOnce(makeSuccess() as never)

    await POST(makeRequest({ items: [makeItem({ pickupLocationId: null })] }))

    const attrs = requestSpy.mock.calls[0][1]?.variables?.lines[0].attributes
    expect(attrs.map((a: { key: string }) => a.key)).not.toContain('Pickup Location')
  })

  it('creates one line per cart item for multiple items', async () => {
    requestSpy.mockResolvedValueOnce(makeSuccess() as never)

    const items = [
      makeItem({ variantId: 'gid://shopify/ProductVariant/1', departureDate: '2026-07-01' }),
      makeItem({ variantId: 'gid://shopify/ProductVariant/2', departureDate: '2026-08-01' }),
    ]
    await POST(makeRequest({ items }))

    const lines = requestSpy.mock.calls[0][1]?.variables?.lines
    expect(lines).toHaveLength(2)
    expect(lines[0].merchandiseId).toBe('gid://shopify/ProductVariant/1')
    expect(lines[1].merchandiseId).toBe('gid://shopify/ProductVariant/2')
  })

  // ── Shopify error handling ────────────────────────────────────────────────

  it('returns 502 when Shopify returns GraphQL errors', async () => {
    requestSpy.mockResolvedValueOnce({ data: undefined, errors: [{ message: 'Unauthorized' }] } as never)

    const res = await POST(makeRequest({ items: [makeItem()] }))
    expect(res.status).toBe(502)
  })

  it('returns 422 when Shopify returns userErrors', async () => {
    requestSpy.mockResolvedValueOnce({
      data: { cartCreate: { cart: null, userErrors: [{ field: ['merchandiseId'], message: 'The merchandise with id X does not exist.' }] } },
      errors: undefined,
    } as never)

    const res = await POST(makeRequest({ items: [makeItem()] }))
    const json = await res.json()

    expect(res.status).toBe(422)
    expect(json.error).toBe('The merchandise with id X does not exist.')
  })

  it('returns 502 when checkoutUrl is missing from the response', async () => {
    requestSpy.mockResolvedValueOnce({ data: { cartCreate: { cart: null, userErrors: [] } }, errors: undefined } as never)

    const res = await POST(makeRequest({ items: [makeItem()] }))
    expect(res.status).toBe(502)
  })

  it('returns 500 when shopifyClient.request throws', async () => {
    requestSpy.mockRejectedValueOnce(new Error('Network failure'))

    const res = await POST(makeRequest({ items: [makeItem()] }))
    expect(res.status).toBe(500)
  })
})
