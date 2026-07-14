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

function formatAddonAttribute(item: CartItem) {
  return item.addons
    .map((addon) => {
      if (addon.price <= 0) return `${addon.name} (request only)`
      return `${addon.name} x ${addon.quantity} (${item.currencyCode} ${(addon.price * addon.quantity).toFixed(2)})`
    })
    .join('; ')
}

function mainLineAttributes(item: CartItem) {
  return [
    { key: 'Departure Date', value: item.departureDate },
    { key: 'Party Size',     value: String(item.partySize) },
    ...(item.lineItemProperties
      ? Object.entries(item.lineItemProperties)
          .filter((entry): entry is [string, string] => Boolean(entry[1]))
          .map(([key, value]) => ({ key, value: String(value) }))
      : []),
    ...(item.pickupLocationId
      ? [{ key: 'Pickup Location', value: item.pickupLocationId }]
      : []),
    ...(item.addons.length > 0
      ? [{ key: 'Add-ons', value: formatAddonAttribute(item) }]
      : []),
  ]
}

function addonLineAttributes(item: CartItem, addon: CartItem['addons'][number]) {
  return [
    { key: 'Parent Tour', value: item.productTitle },
    { key: 'Tour Variant', value: item.variantId },
    { key: 'Departure Date', value: item.departureDate },
    { key: 'Add-on Code', value: addon.id },
  ]
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

  const lines = items.flatMap((item) => [
    {
      merchandiseId: item.variantId,
      quantity: 1,
      attributes: mainLineAttributes(item),
    },
    ...item.addons
      .filter((addon) => addon.variantId && addon.price > 0 && addon.quantity > 0)
      .map((addon) => ({
        merchandiseId: addon.variantId!,
        quantity: addon.quantity,
        attributes: addonLineAttributes(item, addon),
      })),
  ])

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
