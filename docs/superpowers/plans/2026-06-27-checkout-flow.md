# Checkout Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the end-to-end booking flow: cart → Shopify hosted payment → custom login-protected order confirmation page.

**Architecture:** The cart API route reads the Clerk user's email via `currentUser()` and passes it as `buyerIdentity.email` in the Shopify `cartCreate` mutation. After payment, Shopify redirects to `/[locale]/order-confirmation?order_id=xxx`. The confirmation page (Server Component) verifies Clerk auth, fetches the order from Shopify Admin GraphQL API, checks `order.email === user.email`, and renders the trip summary.

**Tech Stack:** Next.js 16 App Router, Shopify Storefront API + Admin API (GraphQL, 2026-01), Clerk (`@clerk/nextjs/server`), next-intl v4, shadcn/ui (@base-ui/react), Tailwind CSS 4, Zustand 5.

## Global Constraints

- **Next.js 16**: `params` and `searchParams` in pages are `Promise<{...}>` — always `await` them.
- **next-intl v4**: Server Components use `await getTranslations({ locale, namespace })`. Client Components use `useTranslations(namespace)`. Never mix them.
- **Clerk**: Server-side auth uses `currentUser()` or `auth()` from `@clerk/nextjs/server`. Client-side uses `useUser()` / `useAuth()` from `@clerk/nextjs`.
- **Shopify Admin API**: All Admin API calls are server-only. Use `process.env.SHOPIFY_ADMIN_ACCESS_TOKEN` — never expose to client. API version: `2026-01`.
- **shadcn/ui on @base-ui/react**: No `asChild` prop available. Use direct element composition.
- **TypeScript strict mode**: No `any` casts. Type all Admin API response shapes explicitly.
- **No `'use client'` on the order confirmation page** — it is a Server Component throughout.
- **PREREQUISITE (before starting Task 3):** Refresh `SHOPIFY_ADMIN_ACCESS_TOKEN` in `.env.local` with a token that has `read_orders` + `write_products` scopes. The existing 24-hour token from the prior session is expired. Update Vercel env vars (Production + Preview) after refreshing.
- **PREREQUISITE (before E2E testing):** Configure the Shopify Headless channel Return URL to `https://mstravelnew.vercel.app/zh-CN/order-confirmation` in Shopify Admin → Settings → Apps and sales channels → Headless → Return URL.

---

## File Map

| Action | File | What changes |
|--------|------|-------------|
| Modify | `messages/zh-CN.json` | Add `orderConfirmation` namespace |
| Modify | `messages/en.json` | Add `orderConfirmation` namespace |
| Modify | `src/lib/shopify/orders.ts` | Add `ConfirmationOrder` type + `getOrderById()` function |
| Modify | `src/lib/shopify/queries/cart.ts` | Add `$buyerIdentity` variable to `CART_CREATE_MUTATION` |
| Modify | `src/app/api/shopify/cart/route.ts` | Call `currentUser()`, pass `buyerIdentity`, return 401 if unauthenticated |
| Modify | `src/app/[locale]/cart/page.tsx` | Add `useUser()` login gate before checkout CTA |
| Create | `src/app/[locale]/order-confirmation/page.tsx` | Server Component: auth guard + Admin API fetch + UI |

---

### Task 1: i18n — Add `orderConfirmation` Namespace

**Files:**
- Modify: `messages/zh-CN.json`
- Modify: `messages/en.json`

**Interfaces:**
- Produces: translation keys `orderConfirmation.{title, orderNumber, itinerarySummary, departureDate, partySize, pricePerPerson, subtotal, total, emailSentTo, orderStatus, continueBrowsing, myBookings, status.paid, status.pending, status.refunded, status.other}` — consumed by Task 4.

- [ ] **Step 1: Add keys to `messages/zh-CN.json`**

Open `messages/zh-CN.json`. Add the following block as a new top-level key after `"calendar"`:

```json
  "orderConfirmation": {
    "title": "预订成功！",
    "orderNumber": "订单号",
    "itinerarySummary": "行程摘要",
    "departureDate": "出发日期",
    "partySize": "人数",
    "pricePerPerson": "单价",
    "subtotal": "小计",
    "total": "合计",
    "emailSentTo": "确认邮件已发送至",
    "orderStatus": "订单状态",
    "continueBrowsing": "继续浏览行程",
    "myBookings": "查看我的预订",
    "status": {
      "paid": "已付款",
      "pending": "待付款",
      "refunded": "已退款",
      "other": "处理中"
    }
  }
```

- [ ] **Step 2: Add keys to `messages/en.json`**

Open `messages/en.json`. Add the following block as a new top-level key after `"calendar"`:

```json
  "orderConfirmation": {
    "title": "Booking Confirmed!",
    "orderNumber": "Order",
    "itinerarySummary": "Trip Summary",
    "departureDate": "Departure Date",
    "partySize": "Party Size",
    "pricePerPerson": "Price",
    "subtotal": "Subtotal",
    "total": "Total",
    "emailSentTo": "Confirmation email sent to",
    "orderStatus": "Order Status",
    "continueBrowsing": "Browse Tours",
    "myBookings": "My Bookings",
    "status": {
      "paid": "Paid",
      "pending": "Pending",
      "refunded": "Refunded",
      "other": "Processing"
    }
  }
```

- [ ] **Step 3: Type-check**

```bash
cd /home/user/workspace/mstravelnew
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add messages/zh-CN.json messages/en.json
git commit -m "feat: add orderConfirmation i18n namespace (zh-CN + en)"
```

---

### Task 2: Admin API — Add `getOrderById` to `orders.ts`

**Files:**
- Modify: `src/lib/shopify/orders.ts`

**Interfaces:**
- Consumes: nothing from prior tasks.
- Produces: `ConfirmationOrder` type and `getOrderById(id: string): Promise<ConfirmationOrder | null>` — consumed by Task 4.

**Context:** `orders.ts` already has `getOrdersByEmail()` which uses the Admin GraphQL endpoint. We add a second function `getOrderById()` following the exact same pattern.

- [ ] **Step 1: Add types and `getOrderById` to `src/lib/shopify/orders.ts`**

Append the following to the end of `src/lib/shopify/orders.ts` (after the existing `getOrdersByEmail` function):

```typescript
// ── Single-order fetch (for order confirmation page) ───────────────────────

export interface ConfirmationLineItem {
  title: string
  variantTitle: string | null
  quantity: number
  unitPrice: ShopifyMoney
  customAttributes: Array<{ key: string; value: string }>
}

export interface ConfirmationOrder {
  id: string
  name: string          // e.g. "#1042" — Shopify's display name
  email: string
  orderNumber: number
  financialStatus: string  // "PAID" | "PENDING" | "REFUNDED" | etc.
  total: ShopifyMoney
  lineItems: ConfirmationLineItem[]
}

const ORDER_BY_ID_QUERY = `
  query GetOrderById($id: ID!) {
    order(id: $id) {
      id
      name
      email
      orderNumber
      financialStatus
      totalPriceSet { shopMoney { amount currencyCode } }
      lineItems(first: 10) {
        nodes {
          title
          variantTitle
          quantity
          originalUnitPriceSet { shopMoney { amount currencyCode } }
          customAttributes { key value }
        }
      }
    }
  }
`

type RawConfirmationLineItem = {
  title: string
  variantTitle: string | null
  quantity: number
  originalUnitPriceSet: { shopMoney: ShopifyMoney }
  customAttributes: Array<{ key: string; value: string }>
}

type RawConfirmationOrder = {
  id: string
  name: string
  email: string
  orderNumber: number
  financialStatus: string
  totalPriceSet: { shopMoney: ShopifyMoney }
  lineItems: { nodes: RawConfirmationLineItem[] }
}

/**
 * Fetch a single order from Shopify Admin GraphQL API.
 * Accepts either a numeric order ID ("5678901234567") or a Shopify GID
 * ("gid://shopify/Order/5678901234567"). Returns null if the order does
 * not exist (Shopify returns null in `data.order`).
 */
export async function getOrderById(id: string): Promise<ConfirmationOrder | null> {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN
  if (!domain || !token) throw new Error('Shopify Admin env vars not configured')

  const gid = id.startsWith('gid://') ? id : `gid://shopify/Order/${id}`

  const res = await fetch(`https://${domain}/admin/api/2026-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({ query: ORDER_BY_ID_QUERY, variables: { id: gid } }),
    cache: 'no-store',
  })

  if (!res.ok) throw new Error(`Shopify Admin API ${res.status}`)

  const json = await res.json() as {
    data: { order: RawConfirmationOrder | null }
    errors?: Array<{ message: string }>
  }
  if (json.errors) throw new Error(json.errors[0]?.message ?? 'Shopify Admin API error')

  const o = json.data.order
  if (!o) return null

  return {
    id: o.id,
    name: o.name,
    email: o.email,
    orderNumber: o.orderNumber,
    financialStatus: o.financialStatus,
    total: o.totalPriceSet.shopMoney,
    lineItems: o.lineItems.nodes.map((n) => ({
      title: n.title,
      variantTitle: n.variantTitle,
      quantity: n.quantity,
      unitPrice: n.originalUnitPriceSet.shopMoney,
      customAttributes: n.customAttributes,
    })),
  }
}
```

- [ ] **Step 2: Type-check**

```bash
cd /home/user/workspace/mstravelnew
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/shopify/orders.ts
git commit -m "feat: add getOrderById to Shopify Admin orders helper"
```

---

### Task 3: Cart → Checkout with `buyerIdentity` + Login Gate

**Files:**
- Modify: `src/lib/shopify/queries/cart.ts`
- Modify: `src/app/api/shopify/cart/route.ts`
- Modify: `src/app/[locale]/cart/page.tsx`

**Interfaces:**
- Consumes: `currentUser()` from `@clerk/nextjs/server` (API route); `useUser()` from `@clerk/nextjs` (cart page client component).
- Produces: updated `/api/shopify/cart` that requires auth and sends `buyerIdentity.email` to Shopify; cart page that blocks unauthenticated checkout.

**PREREQUISITE:** `SHOPIFY_ADMIN_ACCESS_TOKEN` in `.env.local` must be a valid Admin API token with `read_orders` scope. The existing token starting with `shpat_` is a 24-hour token that has likely expired. Refresh it before testing this task:
1. Visit your Shopify Dev Dashboard app.
2. Generate a new access token with scopes `read_orders write_products`.
3. Update `.env.local`: `SHOPIFY_ADMIN_ACCESS_TOKEN=<new_token>`.
4. Restart the dev server.

- [ ] **Step 1: Update `CART_CREATE_MUTATION` to accept `buyerIdentity`**

Replace the entire contents of `src/lib/shopify/queries/cart.ts` with:

```typescript
export const CART_CREATE_MUTATION = `#graphql
  mutation CartCreate(
    $lines: [CartLineInput!]!
    $note: String
    $buyerIdentity: CartBuyerIdentityInput
  ) {
    cartCreate(input: { lines: $lines, note: $note, buyerIdentity: $buyerIdentity }) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`
```

- [ ] **Step 2: Update `/api/shopify/cart/route.ts` to require auth and pass `buyerIdentity`**

Replace the entire contents of `src/app/api/shopify/cart/route.ts` with:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
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
  const user = await currentUser()
  if (!user) {
    return NextResponse.json({ error: 'Login required to checkout' }, { status: 401 })
  }
  const buyerEmail = user.emailAddresses[0]?.emailAddress

  let items: CartItem[]
  try {
    const body = await request.json()
    items = body.items
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

    const checkoutUrl = data?.cartCreate?.cart?.checkoutUrl
    if (!checkoutUrl) {
      return NextResponse.json({ error: 'No checkout URL returned' }, { status: 502 })
    }

    return NextResponse.json({ checkoutUrl })
  } catch (err) {
    console.error('Cart create failed:', err)
    return NextResponse.json({ error: 'Failed to create cart' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Add login gate to `src/app/[locale]/cart/page.tsx`**

Replace the entire contents of `src/app/[locale]/cart/page.tsx` with:

```typescript
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useUser } from '@clerk/nextjs'
import { ShoppingCart, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '@/store/cart'

export default function CartPage() {
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations('booking')
  const tc = useTranslations('common')
  const { isSignedIn, isLoaded } = useUser()

  const items = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)

  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const total = items.reduce((sum, item) => sum + item.pricePerPerson * item.partySize, 0)

  const handleCheckout = async () => {
    if (!isSignedIn) return
    setCheckoutLoading(true)
    setCheckoutError(null)
    try {
      const res = await fetch('/api/shopify/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCheckoutError(data.error ?? 'Checkout failed. Please try again.')
        return
      }
      window.location.href = data.checkoutUrl
    } catch {
      setCheckoutError('Network error. Please check your connection and try again.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center px-4 py-24 text-center">
        <ShoppingCart className="size-12 text-muted-foreground/40 mb-4" />
        <h1 className="text-xl font-semibold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse our tours and add something you love.
        </p>
        <Link href={`/${locale}`} className="mt-6">
          <Button>Browse Tours</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{t('summary')}</h1>
          <Link href={`/${locale}`} className="text-sm text-muted-foreground hover:text-foreground">
            ← {tc('back')}
          </Link>
        </div>

        {/* Cart items */}
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.variantId}
              className="flex items-start gap-4 rounded-xl border bg-card p-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm leading-snug">{item.productTitle}</p>
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{item.partySize} person{item.partySize > 1 ? 's' : ''}</span>
                  <span>·</span>
                  <span>{item.departureDate}</span>
                </div>
                <p className="mt-2 text-sm font-bold">
                  {item.currencyCode} {(item.pricePerPerson * item.partySize).toFixed(0)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeItem(item.variantId)}
                aria-label="Remove item"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        <Separator className="my-6" />

        {/* Total */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-base font-semibold">{t('total')}</span>
          <span className="text-2xl font-bold">{items[0]?.currencyCode ?? 'CAD'} {total.toFixed(0)}</span>
        </div>

        {/* Error */}
        {checkoutError && (
          <p className="mb-4 text-sm text-destructive text-center">{checkoutError}</p>
        )}

        {/* Checkout CTA — shows login prompt when unauthenticated */}
        {isLoaded && !isSignedIn ? (
          <div className="space-y-3">
            <p className="text-sm text-center text-muted-foreground">
              请登录后继续结账
            </p>
            <Link href={`/${locale}/login`}>
              <Button className="w-full" size="lg">登录 / 注册</Button>
            </Link>
          </div>
        ) : (
          <>
            <Button
              className="w-full"
              size="lg"
              disabled={checkoutLoading || !isLoaded}
              onClick={handleCheckout}
            >
              {checkoutLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Processing…
                </>
              ) : (
                'Proceed to Checkout'
              )}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              You will be redirected to Shopify&apos;s secure checkout.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Type-check**

```bash
cd /home/user/workspace/mstravelnew
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Start dev server and verify cart page login gate**

```bash
npm run dev
```

Open http://localhost:3000/zh-CN/cart in the browser.

**Verify when NOT logged in:**
- The checkout button area shows "请登录后继续结账" text and a "登录 / 注册" button.
- Clicking "登录 / 注册" navigates to the login page.

**Verify when logged in:**
- The "Proceed to Checkout" button is visible and enabled.
- Clicking it fires the POST to `/api/shopify/cart` and redirects to Shopify's checkout URL.
  (Full redirect to Shopify checkout requires a real variant ID in the cart.)

- [ ] **Step 6: Commit**

```bash
git add src/lib/shopify/queries/cart.ts src/app/api/shopify/cart/route.ts src/app/\[locale\]/cart/page.tsx
git commit -m "feat: add buyerIdentity to cartCreate and login gate to cart page"
```

---

### Task 4: Order Confirmation Page

**Files:**
- Create: `src/app/[locale]/order-confirmation/page.tsx`

**Interfaces:**
- Consumes: `getOrderById(id)` → `ConfirmationOrder | null` from Task 2; `orderConfirmation.*` i18n keys from Task 1; `currentUser()` from `@clerk/nextjs/server`.
- Produces: `/[locale]/order-confirmation?order_id=xxx` route — the page Shopify redirects to after payment.

**Context:** This is a Server Component. `params` and `searchParams` are both Promises (Next.js 16). Auth uses `currentUser()` (same pattern as `src/app/[locale]/bookings/page.tsx`). Unauthenticated users are redirected to `/${locale}/login`. If `order_id` is missing or the order doesn't belong to the logged-in user, `notFound()` is called (renders the 404 page).

- [ ] **Step 1: Create `src/app/[locale]/order-confirmation/page.tsx`**

```typescript
import { currentUser } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getOrderById } from '@/lib/shopify/orders'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'orderConfirmation' })
  return { title: t('title') }
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PAID: 'default',
  PENDING: 'secondary',
  REFUNDED: 'destructive',
}

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ order_id?: string }>
}) {
  const { locale } = await params
  const { order_id } = await searchParams
  const t = await getTranslations({ locale, namespace: 'orderConfirmation' })

  const user = await currentUser()
  if (!user) {
    redirect(`/${locale}/login`)
  }
  const userEmail = user.emailAddresses[0]?.emailAddress ?? ''

  if (!order_id) notFound()

  let order: Awaited<ReturnType<typeof getOrderById>>
  try {
    order = await getOrderById(order_id)
  } catch {
    notFound()
  }
  if (!order) notFound()

  if (order.email.toLowerCase() !== userEmail.toLowerCase()) {
    notFound()
  }

  const statusLabels: Record<string, string> = {
    PAID: t('status.paid'),
    PENDING: t('status.pending'),
    REFUNDED: t('status.refunded'),
  }
  const statusLabel = statusLabels[order.financialStatus] ?? t('status.other')

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      {/* Success header */}
      <div className="flex flex-col items-center text-center mb-8">
        <CheckCircle className="size-12 text-green-500 mb-3" />
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('orderNumber')} {order.name}
        </p>
      </div>

      {/* Trip summary card */}
      <div className="rounded-xl border bg-card p-6 space-y-5 mb-4">
        <h2 className="font-semibold">{t('itinerarySummary')}</h2>
        {order.lineItems.map((item, i) => {
          const departureDate = item.customAttributes.find((a) => a.key === 'Departure Date')?.value
          const unitAmount = parseFloat(item.unitPrice.amount)
          const subtotal = (unitAmount * item.quantity).toFixed(2)
          return (
            <div key={i} className="text-sm space-y-1">
              <p className="font-medium">{item.title}</p>
              {departureDate && (
                <p className="text-muted-foreground">
                  {t('departureDate')}：{departureDate}
                </p>
              )}
              {item.variantTitle && (
                <p className="text-muted-foreground">
                  {t('partySize')}：{item.variantTitle}
                </p>
              )}
              <p className="text-muted-foreground">
                {t('pricePerPerson')}：{item.unitPrice.currencyCode}{' '}
                {unitAmount.toFixed(0)} × {item.quantity}
              </p>
              <p className="font-medium">
                {t('subtotal')}：{item.unitPrice.currencyCode} {subtotal}
              </p>
            </div>
          )
        })}
        <Separator />
        <div className="flex justify-between font-bold">
          <span>{t('total')}</span>
          <span>
            {order.total.currencyCode} {parseFloat(order.total.amount).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Status + email card */}
      <div className="rounded-xl border bg-card p-6 space-y-3 mb-8">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">{t('orderStatus')}</span>
          <Badge variant={STATUS_VARIANTS[order.financialStatus] ?? 'outline'}>
            {statusLabel}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('emailSentTo')}{' '}
          <span className="text-foreground">{order.email}</span>
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href={`/${locale}/tours`} className="flex-1">
          <Button variant="outline" className="w-full">
            {t('continueBrowsing')}
          </Button>
        </Link>
        <Link href={`/${locale}/bookings`} className="flex-1">
          <Button className="w-full">{t('myBookings')}</Button>
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Sync files to WSL and type-check**

```bash
# In WSL:
cp -r /mnt/d/workspace/mstravelnew/src /home/user/workspace/mstravelnew/
cd /home/user/workspace/mstravelnew
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Verify auth redirect in browser**

Start dev server (`npm run dev`). Open http://localhost:3000/zh-CN/order-confirmation (no `order_id`).

**Expected behaviors:**
- If NOT logged in → redirects to `/zh-CN/login`
- If logged in, no `order_id` → renders Next.js 404 page
- If logged in, `?order_id=99999999` (fake) → renders 404 page (getOrderById returns null)

These three cases can be verified locally without a real Shopify order.

- [ ] **Step 4: Verify with a real order (production only)**

This step requires deploying to Vercel and completing a real checkout:

1. Deploy to Vercel preview: `vercel deploy` (or push to branch).
2. Ensure `SHOPIFY_ADMIN_ACCESS_TOKEN` has `read_orders` scope in Vercel env.
3. Ensure Shopify Headless Return URL is configured (see Global Constraints).
4. Add a tour to cart while logged in. Click "Proceed to Checkout".
5. Complete checkout using Shopify's test payment (card `4242 4242 4242 4242`, any future date, any CVC).
6. Confirm Shopify redirects back to `https://<your-preview>.vercel.app/zh-CN/order-confirmation?order_id=xxx`.
7. Verify the page shows the tour name, departure date, party size, total, and status "已付款".
8. Log out, visit the same URL → redirected to login.
9. Log in as a DIFFERENT user, visit the same URL → 404.

- [ ] **Step 5: Commit**

```bash
cd /home/user/workspace/mstravelnew
git add src/app/\[locale\]/order-confirmation/page.tsx
git commit -m "feat: add order confirmation page with Clerk auth and Shopify Admin order fetch"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task that covers it |
|---|---|
| `buyerIdentity.email` in cartCreate | Task 3 |
| Login required before checkout | Task 3 (cart page gate) |
| `/[locale]/order-confirmation?order_id=xxx` route | Task 4 |
| Auth check → redirect if unauthenticated | Task 4 |
| Fetch from Shopify Admin API | Task 2 + Task 4 |
| Ownership check (order.email === user.email) | Task 4 |
| UI: order number, tour name, departure date, party size, price, total, status | Task 4 |
| i18n for both zh-CN and en | Task 1 |
| Admin API token prerequisite documented | Task 3 header |
| Shopify Return URL prerequisite documented | Global Constraints |
| Error states: missing order_id → 404, wrong owner → 404 | Task 4 |
| Error state: API error → Next.js error boundary (throw) | Task 4 (catch → notFound) |
| "My Bookings" CTA links to `/[locale]/bookings` | Task 4 (existing bookings page) |

**No placeholders found.**

**Type consistency:**
- `ConfirmationOrder` defined in Task 2, imported in Task 4 via `ReturnType<typeof getOrderById>` — consistent.
- `getOrderById(id: string)` defined in Task 2, called with `order_id: string` in Task 4 — consistent.
- `t('status.paid')`, `t('status.pending')`, `t('status.refunded')`, `t('status.other')` — all keys defined in Task 1 — consistent.
