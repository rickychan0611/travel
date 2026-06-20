import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore, type CartItem } from '../cart'

const makeItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  variantId: 'variant-1',
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

beforeEach(() => {
  useCartStore.setState({ items: [], shopifyCartId: null })
})

describe('cart store — addItem', () => {
  it('adds a new item to an empty cart', () => {
    useCartStore.getState().addItem(makeItem())
    expect(useCartStore.getState().items).toHaveLength(1)
  })

  it('stores all item fields correctly', () => {
    const item = makeItem({ variantId: 'v-99', productTitle: 'Test Tour', currencyCode: 'CAD' })
    useCartStore.getState().addItem(item)
    expect(useCartStore.getState().items[0]).toMatchObject(item)
  })

  it('replaces existing item when same variantId is added again', () => {
    useCartStore.getState().addItem(makeItem({ partySize: 2 }))
    useCartStore.getState().addItem(makeItem({ partySize: 4 }))
    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].partySize).toBe(4)
  })

  it('adds multiple items with different variantIds', () => {
    useCartStore.getState().addItem(makeItem({ variantId: 'v-1' }))
    useCartStore.getState().addItem(makeItem({ variantId: 'v-2' }))
    expect(useCartStore.getState().items).toHaveLength(2)
  })

  it('carries currencyCode from the item (not hardcoded)', () => {
    useCartStore.getState().addItem(makeItem({ currencyCode: 'USD' }))
    expect(useCartStore.getState().items[0].currencyCode).toBe('USD')
  })
})

describe('cart store — removeItem', () => {
  it('removes the item with the matching variantId', () => {
    useCartStore.getState().addItem(makeItem({ variantId: 'v-1' }))
    useCartStore.getState().addItem(makeItem({ variantId: 'v-2' }))
    useCartStore.getState().removeItem('v-1')
    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].variantId).toBe('v-2')
  })

  it('is a no-op when variantId does not exist', () => {
    useCartStore.getState().addItem(makeItem())
    useCartStore.getState().removeItem('nonexistent')
    expect(useCartStore.getState().items).toHaveLength(1)
  })
})

describe('cart store — clearCart', () => {
  it('empties the items array', () => {
    useCartStore.getState().addItem(makeItem({ variantId: 'v-1' }))
    useCartStore.getState().addItem(makeItem({ variantId: 'v-2' }))
    useCartStore.getState().clearCart()
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('resets shopifyCartId to null', () => {
    useCartStore.getState().setShopifyCartId('cart-abc')
    useCartStore.getState().clearCart()
    expect(useCartStore.getState().shopifyCartId).toBeNull()
  })
})

describe('cart store — setShopifyCartId', () => {
  it('stores the cart id', () => {
    useCartStore.getState().setShopifyCartId('cart-xyz')
    expect(useCartStore.getState().shopifyCartId).toBe('cart-xyz')
  })
})

describe('cart total calculation', () => {
  it('sums pricePerPerson × quantity across all items', () => {
    useCartStore.getState().addItem(makeItem({ variantId: 'v-1', pricePerPerson: 100, quantity: 1 }))
    useCartStore.getState().addItem(makeItem({ variantId: 'v-2', pricePerPerson: 200, quantity: 2 }))
    const items = useCartStore.getState().items
    const total = items.reduce((acc, i) => acc + i.pricePerPerson * i.quantity, 0)
    expect(total).toBe(500)
  })
})
