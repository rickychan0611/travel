import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Import after stubbing fetch
const { getOrdersByEmail } = await import('../orders')

const makeRawOrder = (overrides = {}) => ({
  id: 'gid://shopify/Order/1',
  name: '#1001',
  createdAt: '2026-06-01T00:00:00Z',
  totalPriceSet: { shopMoney: { amount: '199.00', currencyCode: 'CAD' } },
  financialStatus: 'PAID',
  fulfillmentStatus: 'FULFILLED',
  statusUrl: 'https://store.myshopify.com/orders/abc/authenticate',
  lineItems: {
    edges: [
      {
        node: {
          title: 'Victoria Day Tour',
          variantTitle: '2 Persons — Jul 1',
          quantity: 1,
          originalTotalSet: { shopMoney: { amount: '199.00', currencyCode: 'CAD' } },
        },
      },
    ],
  },
  ...overrides,
})

const mockApiResponse = (orders: unknown[]) =>
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      data: { orders: { edges: orders.map((node) => ({ node })) } },
    }),
  })

beforeEach(() => {
  mockFetch.mockReset()
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN = 'test-store.myshopify.com'
  process.env.SHOPIFY_ADMIN_ACCESS_TOKEN = 'test-admin-token'
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getOrdersByEmail', () => {
  it('throws when env vars are missing', async () => {
    delete process.env.SHOPIFY_ADMIN_ACCESS_TOKEN
    await expect(getOrdersByEmail('user@example.com')).rejects.toThrow(
      'Shopify Admin env vars not configured'
    )
    process.env.SHOPIFY_ADMIN_ACCESS_TOKEN = 'test-admin-token'
  })

  it('returns an empty array when there are no orders', async () => {
    mockApiResponse([])
    const orders = await getOrdersByEmail('no-orders@example.com')
    expect(orders).toEqual([])
  })

  it('maps API response to Order shape', async () => {
    mockApiResponse([makeRawOrder()])
    const orders = await getOrdersByEmail('user@example.com')

    expect(orders).toHaveLength(1)
    expect(orders[0]).toMatchObject({
      id: 'gid://shopify/Order/1',
      name: '#1001',
      createdAt: '2026-06-01T00:00:00Z',
      total: { amount: '199.00', currencyCode: 'CAD' },
      financialStatus: 'PAID',
      fulfillmentStatus: 'FULFILLED',
      statusUrl: expect.stringContaining('myshopify.com'),
    })
  })

  it('maps lineItems correctly', async () => {
    mockApiResponse([makeRawOrder()])
    const orders = await getOrdersByEmail('user@example.com')
    const item = orders[0].lineItems[0]

    expect(item.title).toBe('Victoria Day Tour')
    expect(item.variantTitle).toBe('2 Persons — Jul 1')
    expect(item.quantity).toBe(1)
  })

  it('queries Shopify Admin API with email filter', async () => {
    mockApiResponse([])
    await getOrdersByEmail('test@example.com')

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.variables.query).toBe('email:test@example.com')
  })

  it('sends X-Shopify-Access-Token header', async () => {
    mockApiResponse([])
    await getOrdersByEmail('user@example.com')

    const headers = mockFetch.mock.calls[0][1].headers
    expect(headers['X-Shopify-Access-Token']).toBe('test-admin-token')
  })

  it('throws when the API returns a non-OK status', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 })
    await expect(getOrdersByEmail('user@example.com')).rejects.toThrow('Shopify Admin API 401')
  })

  it('throws when the API response contains errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ errors: [{ message: 'Access denied' }] }),
    })
    await expect(getOrdersByEmail('user@example.com')).rejects.toThrow('Access denied')
  })

  it('returns multiple orders sorted as received', async () => {
    mockApiResponse([makeRawOrder({ name: '#1001' }), makeRawOrder({ name: '#1002', id: 'gid://shopify/Order/2' })])
    const orders = await getOrdersByEmail('user@example.com')
    expect(orders).toHaveLength(2)
    expect(orders[0].name).toBe('#1001')
    expect(orders[1].name).toBe('#1002')
  })
})
