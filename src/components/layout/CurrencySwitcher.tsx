'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUIStore } from '@/store/ui'
import { useCartStore } from '@/store/cart'
import type { ShopifyMarketCountry } from '@/lib/shopify/market'

export function CurrencySwitcher({ className = '' }: { className?: string }) {
  const router = useRouter()
  const market = useUIStore((state) => state.market)
  const setMarket = useUIStore((state) => state.setMarket)
  const cartItems = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)
  const [countries, setCountries] = useState<ShopifyMarketCountry[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/shopify/localization')
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: { countries: ShopifyMarketCountry[]; selected: ShopifyMarketCountry }) => {
        if (!active) return
        setCountries(data.countries)
        setMarket({
          countryCode: data.selected.isoCode,
          countryName: data.selected.name,
          currencyCode: data.selected.currency.isoCode,
        })
      })
      .catch(() => undefined)
    return () => { active = false }
  }, [setMarket])

  async function changeCountry(countryCode: string) {
    if (countryCode === market.countryCode) return
    if (cartItems.length > 0 && !window.confirm('Changing country will clear your cart because Shopify prices differ by market. Continue?')) return

    setSaving(true)
    try {
      const response = await fetch('/api/shopify/localization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countryCode }),
      })
      if (!response.ok) return
      const data = await response.json() as { selected: ShopifyMarketCountry }
      if (cartItems.length > 0) clearCart()
      setMarket({
        countryCode: data.selected.isoCode,
        countryName: data.selected.name,
        currencyCode: data.selected.currency.isoCode,
      })
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <select
      value={market.countryCode}
      onChange={(event) => void changeCountry(event.target.value)}
      disabled={saving || countries.length === 0}
      className={`cursor-pointer bg-transparent text-sm text-[#666] outline-none hover:text-tff-orange disabled:cursor-wait ${className}`}
      aria-label="Country or region"
    >
      {countries.length === 0 ? (
        <option value={market.countryCode}>{market.countryName} — {market.currencyCode}</option>
      ) : countries.map((country) => (
        <option key={country.isoCode} value={country.isoCode}>
          {country.name} — {country.currency.isoCode}
        </option>
      ))}
    </select>
  )
}
