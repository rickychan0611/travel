import { NextRequest, NextResponse } from 'next/server'
import { shopifyClient } from '@/lib/shopify/client'
import { CART_CREATE_MUTATION } from '@/lib/shopify/queries/cart'
import type { CartItem } from '@/store/cart'
import { getShopifyLocalization } from '@/lib/shopify/market'

interface CartCreateResult {
  cartCreate: {
    cart: {
      id: string
      checkoutUrl: string
      cost: {
        subtotalAmount: { amount: string; currencyCode: string }
        totalAmount: { amount: string; currencyCode: string }
      }
    } | null
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

function mainLineAttributes(item: CartItem, line: CartItem['priceLines'][number]) {
  return [
    { key: 'Departure Date', value: item.departureDate },
    { key: 'Booking ID', value: item.bookingId },
    { key: 'Rate', value: line.label },
    ...(line.roomNumber ? [{ key: 'Room', value: String(line.roomNumber) }] : []),
    ...Object.entries(line.attributes ?? {}).map(([key, value]) => ({ key, value })),
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
    { key: 'Booking ID', value: item.bookingId },
    { key: 'Departure Date', value: item.departureDate },
    { key: 'Add-on Code', value: addon.id },
  ]
}

export async function POST(request: NextRequest) {
  let items: CartItem[]
  let buyerEmail: string | undefined
  let returnUrl: string | undefined
  let countryCode: string | undefined

  try {
    const body = await request.json()
    items = body.items
    buyerEmail = body.buyerEmail
    returnUrl = typeof body.returnUrl === 'string' ? body.returnUrl : undefined
    countryCode = typeof body.countryCode === 'string' ? body.countryCode.trim().toUpperCase() : undefined
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items array is required' }, { status: 400 })
    }
    if (!countryCode) return NextResponse.json({ error: 'countryCode is required' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const lines = items.flatMap((item) => [
    ...item.priceLines.map((line) => ({
      merchandiseId: line.variantId,
      quantity: line.quantity,
      attributes: mainLineAttributes(item, line),
    })),
    ...item.addons
      .filter((addon) => addon.variantId && addon.price > 0 && addon.quantity > 0)
      .map((addon) => ({
        merchandiseId: addon.variantId!,
        quantity: addon.quantity,
        attributes: addonLineAttributes(item, addon),
      })),
  ])

  try {
    const defaultCountry = (process.env.NEXT_PUBLIC_DEFAULT_COUNTRY || 'US').toUpperCase()
    if (countryCode !== defaultCountry) {
      const localization = await getShopifyLocalization()
      if (!localization.availableCountries.some((country) => country.isoCode === countryCode)) {
        return NextResponse.json({ error: 'Country is not available' }, { status: 400 })
      }
    }
    const buyerIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? undefined
    const { data, errors } = await shopifyClient.request<CartCreateResult>(
      CART_CREATE_MUTATION,
      {
        variables: {
          lines,
          buyerIdentity: { ...(buyerEmail ? { email: buyerEmail } : {}), countryCode },
        },
        ...(buyerIp ? { headers: { 'Shopify-Storefront-Buyer-IP': buyerIp } } : {}),
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

    const cart = data?.cartCreate?.cart
    let checkoutUrl = cart?.checkoutUrl
    if (!checkoutUrl) {
      return NextResponse.json({ error: 'No checkout URL returned' }, { status: 502 })
    }

    if (returnUrl) {
      checkoutUrl = `${checkoutUrl}?return_to=${encodeURIComponent(returnUrl)}`
    }

    return NextResponse.json({ checkoutUrl, cost: cart?.cost })
  } catch (err) {
    console.error('Cart create failed:', err)
    return NextResponse.json({ error: 'Failed to create cart' }, { status: 500 })
  }
}
