import { NextRequest, NextResponse } from 'next/server'
import { shopifyClient } from '@/lib/shopify/client'
import { COLLECTION_PRODUCTS_QUERY } from '@/lib/shopify/queries/product'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const collection = searchParams.get('collection')
  const first = parseInt(searchParams.get('first') ?? '20')

  if (!collection) {
    return NextResponse.json({ error: 'collection param required' }, { status: 400 })
  }

  try {
    const { data, errors } = await shopifyClient.request(COLLECTION_PRODUCTS_QUERY, {
      variables: { handle: collection, first },
    })

    if (errors) {
      return NextResponse.json({ error: errors }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}
