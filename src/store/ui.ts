import { create } from 'zustand'

interface UIStore {
  currency: string
  mobileMenuOpen: boolean
  setCurrency: (currency: string) => void
  setMobileMenuOpen: (open: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  currency: 'USD',
  mobileMenuOpen: false,
  setCurrency: (currency) => set({ currency }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
}))
