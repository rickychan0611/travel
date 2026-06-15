import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  variantId: string
  productHandle: string
  productTitle: string
  departureDate: string
  partySize: number
  pricePerPerson: number
  quantity: number
  pickupLocationId: string | null
  addons: Array<{ id: string; name: string; price: number; quantity: number }>
  lineItemProperties: Record<string, string>
}

interface CartStore {
  items: CartItem[]
  shopifyCartId: string | null
  addItem: (item: CartItem) => void
  removeItem: (variantId: string) => void
  clearCart: () => void
  setShopifyCartId: (id: string) => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      shopifyCartId: null,
      addItem: (item) =>
        set((state) => ({
          items: [...state.items.filter((i) => i.variantId !== item.variantId), item],
        })),
      removeItem: (variantId) =>
        set((state) => ({ items: state.items.filter((i) => i.variantId !== variantId) })),
      clearCart: () => set({ items: [], shopifyCartId: null }),
      setShopifyCartId: (id) => set({ shopifyCartId: id }),
    }),
    { name: 'tour-cart' }
  )
)
