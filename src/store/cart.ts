import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PricingMode, } from '@/lib/toursbms/date-price-rates'
import type { TravelerCounts } from '@/lib/toursbms/types'

export type CartPriceLine = {
  variantId: string
  label: string
  quantity: number
  unitPrice: number
  roomNumber?: number
  attributes?: Record<string, string>
}

export interface CartItem {
  bookingId: string
  productHandle: string
  productTitle: string
  departureDate: string
  pricingMode: PricingMode
  travelers: TravelerCounts
  roomSummary: string[]
  priceLines: CartPriceLine[]
  currencyCode: string
  pickupLocationId: string | null
  addons: Array<{ id: string; name: string; price: number; quantity: number; variantId?: string }>
}

export function getCartItemBaseTotal(item: Pick<CartItem, 'priceLines'>) {
  return item.priceLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)
}

export function getCartItemAddonsTotal(item: Pick<CartItem, 'addons'>) {
  return item.addons.reduce((sum, addon) => sum + addon.price * addon.quantity, 0)
}

export function getCartItemTotal(item: Pick<CartItem, 'priceLines' | 'addons'>) {
  return getCartItemBaseTotal(item) + getCartItemAddonsTotal(item)
}

export function getCartTotal(items: Array<Pick<CartItem, 'priceLines' | 'addons'>>) {
  return items.reduce((sum, item) => sum + getCartItemTotal(item), 0)
}

interface CartStore {
  items: CartItem[]
  shopifyCartId: string | null
  addItem: (item: CartItem) => void
  removeItem: (bookingId: string) => void
  clearCart: () => void
  setShopifyCartId: (id: string) => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [], shopifyCartId: null,
      addItem: (item) => set((state) => ({ items: [...state.items.filter((i) => i.bookingId !== item.bookingId), item] })),
      removeItem: (bookingId) => set((state) => ({ items: state.items.filter((i) => i.bookingId !== bookingId) })),
      clearCart: () => set({ items: [], shopifyCartId: null }),
      setShopifyCartId: (id) => set({ shopifyCartId: id }),
    }),
    { name: 'tour-cart', version: 2, migrate: () => ({ items: [], shopifyCartId: null }) },
  ),
)
