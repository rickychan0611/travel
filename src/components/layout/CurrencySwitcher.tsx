'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useUIStore } from '@/store/ui'
import { useCartStore } from '@/store/cart'
import type { ShopifyMarketCountry } from '@/lib/shopify/market'

function localizedCountryName(isoCode: string, locale: string, fallback: string) {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(isoCode) || fallback
  } catch {
    return fallback
  }
}

export function CurrencySwitcher({ className = '' }: { className?: string }) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('statusBar')
  const market = useUIStore((state) => state.market)
  const setMarket = useUIStore((state) => state.setMarket)
  const cartItems = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)
  const [countries, setCountries] = useState<ShopifyMarketCountry[]>([])
  const [saving, setSaving] = useState(false)
  const regionNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([locale], { type: 'region' })
    } catch {
      return null
    }
  }, [locale])

  function labelFor(country: Pick<ShopifyMarketCountry, 'isoCode' | 'name' | 'currency'>) {
    const countryName = regionNames?.of(country.isoCode) || localizedCountryName(country.isoCode, locale, country.name)
    return `${countryName} — ${country.currency.isoCode}`
  }

  useEffect(() => {
    let active = true
    fetch('/api/shopify/localization')
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: { countries: ShopifyMarketCountry[]; selected: ShopifyMarketCountry }) => {
        if (!active) return
        setCountries(data.countries)
        setMarket({
          countryCode: data.selected.isoCode,
          countryName: localizedCountryName(data.selected.isoCode, locale, data.selected.name),
          currencyCode: data.selected.currency.isoCode,
        })
      })
      .catch(() => undefined)
    return () => { active = false }
  }, [locale, setMarket])

  async function changeCountry(countryCode: string) {
    if (countryCode === market.countryCode) return
    if (cartItems.length > 0 && !window.confirm(t('clearCartConfirm'))) return

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
        countryName: localizedCountryName(data.selected.isoCode, locale, data.selected.name),
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
      aria-label={t('countryAria')}
    >
      {countries.length === 0 ? (
        <option value={market.countryCode}>
          {localizedCountryName(market.countryCode, locale, market.countryName)} — {market.currencyCode}
        </option>
      ) : countries.map((country) => (
        <option key={country.isoCode} value={country.isoCode}>
          {labelFor(country)}
        </option>
      ))}
    </select>
  )
}
