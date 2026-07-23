import { NextRequest, NextResponse } from 'next/server'
import { shopifyClient } from '@/lib/shopify/client'
import { COLLECTION_PRODUCTS_QUERY } from '@/lib/shopify/queries/product'
import { getShopifyLocalization, selectMarketCountry } from '@/lib/shopify/market'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params
  try {
    const requestedCountry = request.nextUrl.searchParams.get('country')
    const localization = requestedCountry ? await getShopifyLocalization() : null
    const country = localization
      ? (selectMarketCountry(localization.availableCountries, requestedCountry)?.isoCode ?? localization.country.isoCode)
      : (process.env.NEXT_PUBLIC_DEFAULT_COUNTRY || 'US').toUpperCase()
    const { data, errors } = await shopifyClient.request(COLLECTION_PRODUCTS_QUERY, {
      variables: { handle, first: 50, country },
    })
    if (errors) return NextResponse.json({ error: errors }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch collection' }, { status: 500 })
  }
}
