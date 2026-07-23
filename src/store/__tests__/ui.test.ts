import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from '../ui'

beforeEach(() => {
  useUIStore.setState({ market: { countryCode: 'US', countryName: 'United States', currencyCode: 'USD' }, mobileMenuOpen: false })
})

describe('ui store — market', () => {
  it('defaults to USD', () => {
    expect(useUIStore.getState().market.currencyCode).toBe('USD')
  })

  it('updates market via setMarket', () => {
    useUIStore.getState().setMarket({ countryCode: 'CA', countryName: 'Canada', currencyCode: 'CAD' })
    expect(useUIStore.getState().market.countryCode).toBe('CA')
  })
})

describe('ui store — mobileMenuOpen', () => {
  it('defaults to false', () => {
    expect(useUIStore.getState().mobileMenuOpen).toBe(false)
  })

  it('opens menu via setMobileMenuOpen(true)', () => {
    useUIStore.getState().setMobileMenuOpen(true)
    expect(useUIStore.getState().mobileMenuOpen).toBe(true)
  })

  it('closes menu via setMobileMenuOpen(false)', () => {
    useUIStore.getState().setMobileMenuOpen(true)
    useUIStore.getState().setMobileMenuOpen(false)
    expect(useUIStore.getState().mobileMenuOpen).toBe(false)
  })
})
