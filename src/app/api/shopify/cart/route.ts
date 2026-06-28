import { NextRequest, NextResponse } from 'next/server'
import { shopifyClient } from '@/lib/shopify/client'
import { CART_CREATE_MUTATION } from '@/lib/shopify/queries/cart'
import type { CartItem } from '@/store/cart'

interface CartCreateResult {
  cartCreate: {
    cart: { id: string; checkoutUrl: string } | null
    userErrors: Array<{ field: string[]; message: string }>
  }
}

export async function POST(request: NextRequest) {
  let items: CartItem[]
  let buyerEmail: string | undefined
  let returnUrl: string | undefined

  try {
    const body = await request.json()
    items = body.items
    buyerEmail = body.buyerEmail
    returnUrl = typeof body.returnUrl === 'string' ? body.returnUrl : undefined
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items array is required' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const lines = items.map((item) => ({
    merchandiseId: item.variantId,
    quantity: 1,
    attributes: [
      { key: 'Departure Date', value: item.departureDate },
      { key: 'Party Size',     value: String(item.partySize) },
      ...(item.pickupLocationId
        ? [{ key: 'Pickup Location', value: item.pickupLocationId }]
        : []),
    ],
  }))

  try {
    const { data, errors } = await shopifyClient.request<CartCreateResult>(
      CART_CREATE_MUTATION,
      {
        variables: {
          lines,
          buyerIdentity: buyerEmail ? { email: buyerEmail } : undefined,
        },
      }
    )

    if (errors) {
      console.error('Shopify GraphQL errors:', errors)
      return NextResponse.json({ error: 'Shopify error' }, { status: 502 })
    }

    const userErrors = data?.cartCreate?.userErrors ?? []
    if (userErrors.length > 0) {
      return NextResponse.json({ error: userErrors[0].message }, { status: 422 })
    }

    let checkoutUrl = data?.cartCreate?.cart?.checkoutUrl
    if (!checkoutUrl) {
      return NextResponse.json({ error: 'No checkout URL returned' }, { status: 502 })
    }

    if (returnUrl) {
      checkoutUrl = `${checkoutUrl}?return_to=${encodeURIComponent(returnUrl)}`
    }

    return NextResponse.json({ checkoutUrl })
  } catch (err) {
    console.error('Cart create failed:', err)
    return NextResponse.json({ error: 'Failed to create cart' }, { status: 500 })
  }
}
