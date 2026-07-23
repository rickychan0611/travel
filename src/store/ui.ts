import { create } from 'zustand'

interface UIStore {
  market: { countryCode: string; countryName: string; currencyCode: string }
  mobileMenuOpen: boolean
  setMarket: (market: UIStore['market']) => void
  setMobileMenuOpen: (open: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  market: { countryCode: 'US', countryName: 'United States', currencyCode: 'USD' },
  mobileMenuOpen: false,
  setMarket: (market) => set({ market }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
}))
