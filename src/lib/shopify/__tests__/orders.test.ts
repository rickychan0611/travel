import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Import after stubbing fetch so the module picks up the stub
const { getOrdersByEmail, getOrderById } = await import('../orders')

// ── Factory helpers ───────────────────────────────────────────────────────────

// Admin API 2026-01: financial/fulfillment status use display* field names
const makeRawOrder = (overrides: Record<string, unknown> = {}) => ({
  id: 'gid://shopify/Order/1',
  name: '#1001',
  createdAt: '2026-06-01T00:00:00Z',
  totalPriceSet: { shopMoney: { amount: '199.00', currencyCode: 'CAD' } },
  displayFinancialStatus: 'Paid',
  displayFulfillmentStatus: 'Fulfilled',
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

const makeRawConfirmationOrder = (overrides: Record<string, unknown> = {}) => ({
  id: 'gid://shopify/Order/42',
  name: '#1042',
  email: 'buyer@example.com',
  number: 1042,
  displayFinancialStatus: 'Paid',
  totalPriceSet: { shopMoney: { amount: '488.00', currencyCode: 'CAD' } },
  lineItems: {
    nodes: [
      {
        title: 'Yellowstone 3-Day Tour',
        variantTitle: '2 Persons',
        quantity: 1,
        originalUnitPriceSet: { shopMoney: { amount: '244.00', currencyCode: 'CAD' } },
        customAttributes: [
          { key: 'Departure Date', value: '2026-08-05' },
          { key: 'Party Size', value: '2' },
        ],
      },
    ],
  },
  ...overrides,
})

const mockOrdersApiResponse = (orders: unknown[]) =>
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      data: { orders: { edges: orders.map((node) => ({ node })) } },
    }),
  })

const mockOrderByIdApiResponse = (order: unknown) =>
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ data: { order } }),
  })

beforeEach(() => {
  mockFetch.mockReset()
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN = 'test-store.myshopify.com'
  process.env.SHOPIFY_ADMIN_ACCESS_TOKEN = 'test-admin-token'
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ── getOrdersByEmail ──────────────────────────────────────────────────────────

describe('getOrdersByEmail', () => {
  it('throws when env vars are missing', async () => {
    delete process.env.SHOPIFY_ADMIN_ACCESS_TOKEN
    await expect(getOrdersByEmail('user@example.com')).rejects.toThrow(
      'Shopify Admin env vars not configured'
    )
    process.env.SHOPIFY_ADMIN_ACCESS_TOKEN = 'test-admin-token'
  })

  it('returns an empty array when there are no orders', async () => {
    mockOrdersApiResponse([])
    const orders = await getOrdersByEmail('no-orders@example.com')
    expect(orders).toEqual([])
  })

  it('maps displayFinancialStatus and displayFulfillmentStatus to output fields', async () => {
    mockOrdersApiResponse([makeRawOrder()])
    const orders = await getOrdersByEmail('user@example.com')

    expect(orders[0]).toMatchObject({
      id: 'gid://shopify/Order/1',
      name: '#1001',
      createdAt: '2026-06-01T00:00:00Z',
      total: { amount: '199.00', currencyCode: 'CAD' },
      financialStatus: 'Paid',
      fulfillmentStatus: 'Fulfilled',
    })
  })

  it('does not include statusUrl in the Order shape', async () => {
    mockOrdersApiResponse([makeRawOrder()])
    const orders = await getOrdersByEmail('user@example.com')
    expect(orders[0]).not.toHaveProperty('statusUrl')
  })

  it('maps lineItems correctly', async () => {
    mockOrdersApiResponse([makeRawOrder()])
    const orders = await getOrdersByEmail('user@example.com')
    const item = orders[0].lineItems[0]

    expect(item.title).toBe('Victoria Day Tour')
    expect(item.variantTitle).toBe('2 Persons — Jul 1')
    expect(item.quantity).toBe(1)
  })

  it('queries Admin API with email: filter', async () => {
    mockOrdersApiResponse([])
    await getOrdersByEmail('test@example.com')

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.variables.query).toBe('email:test@example.com')
  })

  it('sends X-Shopify-Access-Token header', async () => {
    mockOrdersApiResponse([])
    await getOrdersByEmail('user@example.com')

    const headers = mockFetch.mock.calls[0][1].headers
    expect(headers['X-Shopify-Access-Token']).toBe('test-admin-token')
  })

  it('throws when the API returns a non-OK status', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 })
    await expect(getOrdersByEmail('user@example.com')).rejects.toThrow('Shopify Admin API 401')
  })

  it('throws when the API response contains GraphQL errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ errors: [{ message: 'Access denied' }] }),
    })
    await expect(getOrdersByEmail('user@example.com')).rejects.toThrow('Access denied')
  })

  it('returns multiple orders in received order', async () => {
    mockOrdersApiResponse([
      makeRawOrder({ name: '#1001' }),
      makeRawOrder({ name: '#1002', id: 'gid://shopify/Order/2' }),
    ])
    const orders = await getOrdersByEmail('user@example.com')
    expect(orders).toHaveLength(2)
    expect(orders[0].name).toBe('#1001')
    expect(orders[1].name).toBe('#1002')
  })
})

// ── getOrderById ──────────────────────────────────────────────────────────────

describe('getOrderById', () => {
  it('throws when env vars are missing', async () => {
    delete process.env.SHOPIFY_ADMIN_ACCESS_TOKEN
    await expect(getOrderById('gid://shopify/Order/42')).rejects.toThrow(
      'Shopify Admin env vars not configured'
    )
    process.env.SHOPIFY_ADMIN_ACCESS_TOKEN = 'test-admin-token'
  })

  it('returns null when the order does not exist', async () => {
    mockOrderByIdApiResponse(null)
    const order = await getOrderById('gid://shopify/Order/99')
    expect(order).toBeNull()
  })

  it('maps ConfirmationOrder fields correctly', async () => {
    mockOrderByIdApiResponse(makeRawConfirmationOrder())
    const order = await getOrderById('gid://shopify/Order/42')

    expect(order).toMatchObject({
      id: 'gid://shopify/Order/42',
      name: '#1042',
      email: 'buyer@example.com',
      orderNumber: 1042,
      financialStatus: 'Paid',
      total: { amount: '488.00', currencyCode: 'CAD' },
    })
  })

  it('maps line item unitPrice from originalUnitPriceSet', async () => {
    mockOrderByIdApiResponse(makeRawConfirmationOrder())
    const order = await getOrderById('gid://shopify/Order/42')
    const item = order!.lineItems[0]

    expect(item.title).toBe('Yellowstone 3-Day Tour')
    expect(item.variantTitle).toBe('2 Persons')
    expect(item.quantity).toBe(1)
    expect(item.unitPrice).toEqual({ amount: '244.00', currencyCode: 'CAD' })
  })

  it('passes through customAttributes on line items', async () => {
    mockOrderByIdApiResponse(makeRawConfirmationOrder())
    const order = await getOrderById('gid://shopify/Order/42')
    const attrs = order!.lineItems[0].customAttributes

    expect(attrs).toContainEqual({ key: 'Departure Date', value: '2026-08-05' })
    expect(attrs).toContainEqual({ key: 'Party Size', value: '2' })
  })

  it('accepts a numeric ID and converts it to a GID', async () => {
    mockOrderByIdApiResponse(makeRawConfirmationOrder())
    await getOrderById('123456789')

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.variables.id).toBe('gid://shopify/Order/123456789')
  })

  it('passes a GID through unchanged', async () => {
    mockOrderByIdApiResponse(makeRawConfirmationOrder())
    await getOrderById('gid://shopify/Order/42')

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.variables.id).toBe('gid://shopify/Order/42')
  })

  it('sends X-Shopify-Access-Token header', async () => {
    mockOrderByIdApiResponse(makeRawConfirmationOrder())
    await getOrderById('gid://shopify/Order/42')

    const headers = mockFetch.mock.calls[0][1].headers
    expect(headers['X-Shopify-Access-Token']).toBe('test-admin-token')
  })

  it('throws when the API returns a non-OK status', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403 })
    await expect(getOrderById('gid://shopify/Order/42')).rejects.toThrow('Shopify Admin API 403')
  })

  it('throws when the API response contains GraphQL errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ errors: [{ message: 'Order not accessible' }] }),
    })
    await expect(getOrderById('gid://shopify/Order/42')).rejects.toThrow('Order not accessible')
  })

  it('handles null variantTitle on line items', async () => {
    mockOrderByIdApiResponse(
      makeRawConfirmationOrder({
        lineItems: {
          nodes: [
            {
              title: 'Group Tour',
              variantTitle: null,
              quantity: 2,
              originalUnitPriceSet: { shopMoney: { amount: '100.00', currencyCode: 'CAD' } },
              customAttributes: [],
            },
          ],
        },
      })
    )
    const order = await getOrderById('gid://shopify/Order/42')
    expect(order!.lineItems[0].variantTitle).toBeNull()
  })

  it('handles empty customAttributes', async () => {
    mockOrderByIdApiResponse(
      makeRawConfirmationOrder({
        lineItems: {
          nodes: [
            {
              title: 'Tour',
              variantTitle: '1 Person',
              quantity: 1,
              originalUnitPriceSet: { shopMoney: { amount: '100.00', currencyCode: 'CAD' } },
              customAttributes: [],
            },
          ],
        },
      })
    )
    const order = await getOrderById('gid://shopify/Order/42')
    expect(order!.lineItems[0].customAttributes).toEqual([])
  })

  it('handles multiple line items', async () => {
    mockOrderByIdApiResponse(
      makeRawConfirmationOrder({
        lineItems: {
          nodes: [
            {
              title: 'Tour A',
              variantTitle: '2 Persons',
              quantity: 1,
              originalUnitPriceSet: { shopMoney: { amount: '200.00', currencyCode: 'CAD' } },
              customAttributes: [],
            },
            {
              title: 'Tour B',
              variantTitle: '1 Person',
              quantity: 1,
              originalUnitPriceSet: { shopMoney: { amount: '150.00', currencyCode: 'CAD' } },
              customAttributes: [],
            },
          ],
        },
      })
    )
    const order = await getOrderById('gid://shopify/Order/42')
    expect(order!.lineItems).toHaveLength(2)
    expect(order!.lineItems[0].title).toBe('Tour A')
    expect(order!.lineItems[1].title).toBe('Tour B')
  })
})
