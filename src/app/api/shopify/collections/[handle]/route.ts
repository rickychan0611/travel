import { NextRequest, NextResponse } from 'next/server'
import { shopifyClient } from '@/lib/shopify/client'
import { COLLECTION_PRODUCTS_QUERY } from '@/lib/shopify/queries/product'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params
  try {
    const { data, errors } = await shopifyClient.request(COLLECTION_PRODUCTS_QUERY, {
      variables: { handle, first: 50 },
    })
    if (errors) return NextResponse.json({ error: errors }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch collection' }, { status: 500 })
  }
}
