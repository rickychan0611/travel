import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getCustomerOrderDetail } from '../orders'

function jsonResponse(data: unknown) {
  return {
    ok: true,
    json: async () => data,
  } as Response
}

const money = (amount: string) => ({ amount, currencyCode: 'USD' })

describe('authenticated Shopify account data', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN = 'example.myshopify.com'
    process.env.SHOPIFY_ADMIN_ACCESS_TOKEN = 'test-token'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns an order only for its authenticated email owner', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        data: {
          orders: {
            nodes: [{ id: 'gid://shopify/Order/1001' }],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      }))
      .mockResolvedValueOnce(jsonResponse({
        data: { order: {
          id: 'gid://shopify/Order/1001',
          legacyResourceId: '1001',
          name: '#1001',
          createdAt: '2026-07-18T10:00:00Z',
          processedAt: '2026-07-18T10:01:00Z',
          cancelledAt: null,
          cancelReason: null,
          displayFinancialStatus: 'PAID',
          displayFulfillmentStatus: 'UNFULFILLED',
          paymentGatewayNames: ['Test payment gateway'],
          currentSubtotalPriceSet: { shopMoney: money('100.00') },
          currentTotalDiscountsSet: { shopMoney: money('10.00') },
          currentTotalTaxSet: { shopMoney: money('5.00') },
          currentTotalPriceSet: { shopMoney: money('95.00') },
          totalRefundedSet: { shopMoney: money('0.00') },
          lineItems: {
            nodes: [{
              id: 'gid://shopify/LineItem/1',
              title: 'Test tour',
              variantTitle: '2026-08-01 / Adult',
              sku: 'TOUR-1',
              quantity: 1,
              currentQuantity: 1,
              originalUnitPriceSet: { shopMoney: money('100.00') },
              discountedTotalSet: { shopMoney: money('90.00') },
              customAttributes: [{ key: 'Departure Date', value: '2026-08-01' }],
              image: null,
              product: { handle: 'test-tour' },
            }],
          },
        } },
      }))
      .mockResolvedValueOnce(jsonResponse({
        data: {
          orders: {
            nodes: [],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      }))
    vi.stubGlobal('fetch', fetchMock)

    const owned = await getCustomerOrderDetail('1001', 'traveler@example.com')
    const notOwned = await getCustomerOrderDetail('1001', 'someone@example.com')

    expect(owned?.name).toBe('#1001')
    expect(owned?.lineItems[0].productHandle).toBe('test-tour')
    expect(notOwned).toBeNull()
  })

  it('rejects malformed order IDs without querying Shopify', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(getCustomerOrderDetail('../1001', 'traveler@example.com')).resolves.toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

})
