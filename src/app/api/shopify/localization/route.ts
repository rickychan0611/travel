import { NextRequest, NextResponse } from 'next/server'
import {
  getShopifyLocalization,
  MARKET_COOKIE,
  selectMarketCountry,
} from '@/lib/shopify/market'

export async function GET(request: NextRequest) {
  try {
    const localization = await getShopifyLocalization()
    const selected = selectMarketCountry(
      localization.availableCountries,
      request.cookies.get(MARKET_COOKIE)?.value,
    ) ?? localization.country
    return NextResponse.json({ countries: localization.availableCountries, selected })
  } catch {
    return NextResponse.json({ error: 'Failed to load Shopify markets' }, { status: 502 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { countryCode?: string }
    const localization = await getShopifyLocalization()
    const requested = body.countryCode?.trim().toUpperCase()
    const selected = localization.availableCountries.find((country) => country.isoCode === requested)
    if (!selected) return NextResponse.json({ error: 'Country is not available' }, { status: 400 })

    const response = NextResponse.json({ selected })
    response.cookies.set(MARKET_COOKIE, selected.isoCode, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
