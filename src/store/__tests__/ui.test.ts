import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from '../ui'

beforeEach(() => {
  useUIStore.setState({ currency: 'USD', mobileMenuOpen: false })
})

describe('ui store — currency', () => {
  it('defaults to USD', () => {
    expect(useUIStore.getState().currency).toBe('USD')
  })

  it('updates currency via setCurrency', () => {
    useUIStore.getState().setCurrency('CAD')
    expect(useUIStore.getState().currency).toBe('CAD')
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
