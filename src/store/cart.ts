import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  variantId: string
  productHandle: string
  productTitle: string
  departureDate: string
  partySize: number
  pricePerPerson: number
  currencyCode: string
  quantity: number
  pickupLocationId: string | null
  addons: Array<{ id: string; name: string; price: number; quantity: number; variantId?: string }>
  lineItemProperties: Record<string, string>
}

export function getCartItemBaseTotal(
  item: Pick<CartItem, 'partySize' | 'pricePerPerson'> & Partial<Pick<CartItem, 'lineItemProperties'>>,
) {
  const explicitBaseTotal = Number(item.lineItemProperties?.['Base Total'])
  if (Number.isFinite(explicitBaseTotal) && explicitBaseTotal >= 0) return explicitBaseTotal
  return item.pricePerPerson * item.partySize
}

export function getCartItemAddonsTotal(item: Pick<CartItem, 'addons'>) {
  return item.addons.reduce((sum, addon) => sum + addon.price * addon.quantity, 0)
}

export function getCartItemTotal(
  item: Pick<CartItem, 'addons' | 'partySize' | 'pricePerPerson'> & Partial<Pick<CartItem, 'lineItemProperties'>>,
) {
  return getCartItemBaseTotal(item) + getCartItemAddonsTotal(item)
}

export function getCartTotal(
  items: Array<Pick<CartItem, 'addons' | 'partySize' | 'pricePerPerson'> & Partial<Pick<CartItem, 'lineItemProperties'>>>,
) {
  return items.reduce((sum, item) => sum + getCartItemTotal(item), 0)
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
