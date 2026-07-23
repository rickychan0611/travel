import { cookies } from 'next/headers'
import { shopifyReadRequest } from './client'

export const MARKET_COOKIE = 'shopify-country'
export const DEFAULT_COUNTRY = (process.env.NEXT_PUBLIC_DEFAULT_COUNTRY || 'US').toUpperCase()

export type ShopifyMarketCountry = {
  isoCode: string
  name: string
  currency: { isoCode: string; name: string; symbol: string }
}

type LocalizationResponse = {
  localization: {
    country: ShopifyMarketCountry
    availableCountries: ShopifyMarketCountry[]
  }
}

export const LOCALIZATION_QUERY = `#graphql
  query StorefrontLocalization {
    localization {
      country { isoCode name currency { isoCode name symbol } }
      availableCountries { isoCode name currency { isoCode name symbol } }
    }
  }
`

export async function getShopifyLocalization() {
  const { data, errors } = await shopifyReadRequest<LocalizationResponse>(LOCALIZATION_QUERY, {
    tags: ['shopify-localization'],
  })
  if (errors || !data?.localization) throw new Error('Could not load Shopify localization')
  return data.localization
}

export function selectMarketCountry(countries: ShopifyMarketCountry[], requested?: string | null) {
  const normalized = requested?.trim().toUpperCase()
  return countries.find((country) => country.isoCode === normalized)
    ?? countries.find((country) => country.isoCode === DEFAULT_COUNTRY)
    ?? countries[0]
}

export async function getSelectedMarket() {
  const [cookieStore, localization] = await Promise.all([cookies(), getShopifyLocalization()])
  return selectMarketCountry(localization.availableCountries, cookieStore.get(MARKET_COOKIE)?.value)
    ?? localization.country
}

export function marketCacheTags(countryCode: string, tags: string[]) {
  return [...tags, `shopify-market-${countryCode.toUpperCase()}`]
}
