import { beforeEach, describe, expect, it } from 'vitest'
import { getCartItemAddonsTotal, getCartItemBaseTotal, getCartItemTotal, getCartTotal, useCartStore, type CartItem } from '../cart'

const makeItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  bookingId: 'booking-1', productHandle: 'tour', productTitle: 'Tour', departureDate: '2026-07-01',
  pricingMode: 'per_person', travelers: { adults: 2, seniors: 0, children: 0 }, roomSummary: [],
  priceLines: [{ variantId: 'variant-1', label: 'Adult', quantity: 2, unitPrice: 100 }],
  currencyCode: 'CAD', pickupLocationId: null, addons: [], ...overrides,
})

beforeEach(() => useCartStore.setState({ items: [], shopifyCartId: null }))

describe('cart store', () => {
  it('uses booking ID so the same variant can appear in separate bookings', () => {
    useCartStore.getState().addItem(makeItem({ bookingId: 'b-1' }))
    useCartStore.getState().addItem(makeItem({ bookingId: 'b-2' }))
    expect(useCartStore.getState().items).toHaveLength(2)
  })
  it('replaces the same booking', () => {
    useCartStore.getState().addItem(makeItem())
    useCartStore.getState().addItem(makeItem({ travelers: { adults: 3, seniors: 0, children: 0 } }))
    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().items[0].travelers.adults).toBe(3)
  })
  it('removes and clears bookings', () => {
    useCartStore.getState().addItem(makeItem())
    useCartStore.getState().removeItem('booking-1')
    expect(useCartStore.getState().items).toHaveLength(0)
    useCartStore.getState().setShopifyCartId('cart')
    useCartStore.getState().clearCart()
    expect(useCartStore.getState().shopifyCartId).toBeNull()
  })
})

describe('cart totals', () => {
  it('totals all Shopify price lines with real quantities', () => {
    const item = makeItem({ priceLines: [
      { variantId: 'adult', label: 'Double', quantity: 2, unitPrice: 100 },
      { variantId: 'child', label: 'Child', quantity: 1, unitPrice: 50 },
    ] })
    expect(getCartItemBaseTotal(item)).toBe(250)
  })
  it('adds chargeable add-ons', () => {
    const item = makeItem({ addons: [{ id: 'a', name: 'Add-on', price: 25, quantity: 2 }] })
    expect(getCartItemAddonsTotal(item)).toBe(50)
    expect(getCartItemTotal(item)).toBe(250)
  })
  it('sums multiple bookings', () => {
    expect(getCartTotal([makeItem(), makeItem({ bookingId: 'b2' })])).toBe(400)
  })
})
