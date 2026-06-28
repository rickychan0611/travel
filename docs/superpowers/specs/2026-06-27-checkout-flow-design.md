# Checkout Flow — Design Spec

**Date:** 2026-06-27  
**Phase:** Phase 3 · Feature 1  
**Status:** Approved

---

## Goal

Enable end-to-end checkout: cart → Shopify hosted payment → custom order confirmation page, with login-protected order display sourced from Shopify Admin API.

---

## Scope

**In scope:**
- Pass `buyerIdentity.email` (Clerk user email) and `redirectUrl` in `cartCreate` mutation
- Custom order confirmation page at `/[locale]/order-confirmation?order_id=xxx`
- Shopify Admin API order fetch (`read_orders` scope)
- Login guard: unauthenticated → redirect to login
- Ownership check: `order.email` must match Clerk user's primary email

**Out of scope (Phase 3):**
- Pickup location selection (Phase 4)
- "My Bookings" page (Phase 4)
- Multi-language return URL configuration (English locale — Phase 4)
- Custom transactional email (Shopify's native email is sufficient)

---

## Architecture

### Data Flow

```
User clicks "Proceed to Checkout"
    ↓
POST /api/shopify/cart
  · buyerIdentity.email = Clerk user's primary email address
  · redirectUrl = https://mstravelnew.vercel.app/zh-CN/order-confirmation
  · Returns checkoutUrl from Shopify
    ↓
Browser redirects → Shopify hosted checkout (address / payment)
    ↓
Payment succeeds
    ↓
Shopify redirects → /zh-CN/order-confirmation?order_id={shopify_order_id}
    ↓
Server Component: auth() from Clerk
  · Not signed in → redirect(/zh-CN/login)
    ↓
fetchOrder(order_id) via Shopify Admin API
  · 404 from Shopify → notFound()
    ↓
Ownership check: order.email === user.emailAddresses[0].emailAddress
  · Mismatch → notFound()
    ↓
Render confirmation page
```

### Shopify Redirect Parameter

Shopify appends `order_id` (numeric, e.g. `5678901234567`) as a query parameter to the configured Return URL. The Return URL is configured once in Shopify Admin under the Headless sales channel settings (manual step, see Prerequisites).

---

## Files

### New

| File | Responsibility |
|---|---|
| `src/app/[locale]/order-confirmation/page.tsx` | Server Component: auth guard, param parsing, Admin API call, ownership check, render |
| `src/lib/shopify/admin/fetchOrder.ts` | `fetchOrder(id: string)` — calls `GET /admin/api/2026-01/orders/{id}.json`, returns typed order or null. Server-only (`'server-only'` import). |

### Modified

| File | Change |
|---|---|
| `src/lib/shopify/queries/cart.ts` | Add `$buyerIdentity: CartBuyerIdentityInput`, `$redirectUrl: URL` inputs to `CART_CREATE_MUTATION`; include `buyerIdentity { ... }` in mutation body |
| `src/app/api/shopify/cart/route.ts` | Read Clerk `auth()` to get user email; pass `buyerIdentity` and `redirectUrl` to cart mutation variables |
| `messages/zh-CN.json` | Add `orderConfirmation` namespace |
| `messages/en.json` | Add `orderConfirmation` namespace |

---

## Component: Order Confirmation Page

**Route:** `/[locale]/order-confirmation`  
**Type:** Server Component (no `'use client'`)  
**Auth:** Clerk `auth()` — redirect to `/${locale}/login` if `!userId`

### Query Parameter

- `order_id` (string, required) — Shopify numeric order ID  
- Missing or invalid → `notFound()`

### Shopify Admin API Call

```
GET https://{SHOPIFY_STORE_DOMAIN}/admin/api/2026-01/orders/{id}.json
Headers: X-Shopify-Access-Token: {SHOPIFY_ADMIN_ACCESS_TOKEN}
```

Required fields: `id`, `order_number`, `email`, `financial_status`, `total_price`, `currency`, `line_items`

Each `line_item` includes: `name`, `variant_title`, `price`, `quantity`, `properties[]`

### Ownership Verification

```
order.email.toLowerCase() === user.emailAddresses[0].emailAddress.toLowerCase()
```

Mismatch or Admin API 404 → `notFound()` (do not reveal whether the order exists).

### UI Layout

```
┌─────────────────────────────────────────┐
│  ✓  预订成功！                           │
│     订单号 #1042                         │
├─────────────────────────────────────────┤
│  行程摘要                                │
│  ┌───────────────────────────────────┐  │
│  │ [line_item.name]                  │  │
│  │ 出发日期：[properties.Departure]   │  │
│  │ 人数：[variant_title]              │  │
│  │ 单价：[price] × [quantity]        │  │
│  │ 小计：[price × quantity]          │  │
│  └───────────────────────────────────┘  │
│  合计：[total_price] [currency]          │
├─────────────────────────────────────────┤
│  确认邮件已发送至 [order.email]          │
│  订单状态：[financial_status badge]      │
├─────────────────────────────────────────┤
│  [继续浏览行程]    [查看我的预订(占位)]  │
└─────────────────────────────────────────┘
```

**Financial status badge mapping:**

| Shopify value | Display (zh-CN) | Color |
|---|---|---|
| `paid` | 已付款 | green |
| `pending` | 待付款 | amber |
| `refunded` | 已退款 | red |
| other | 处理中 | gray |

---

## i18n Keys

### `messages/zh-CN.json` — `orderConfirmation` namespace

```json
{
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
    "status": {
      "paid": "已付款",
      "pending": "待付款",
      "refunded": "已退款",
      "other": "处理中"
    },
    "continueBrowsing": "继续浏览行程",
    "myBookings": "查看我的预订",
    "notFound": "订单不存在或无权查看"
  }
}
```

### `messages/en.json` — `orderConfirmation` namespace

```json
{
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
    "status": {
      "paid": "Paid",
      "pending": "Pending",
      "refunded": "Refunded",
      "other": "Processing"
    },
    "continueBrowsing": "Browse Tours",
    "myBookings": "My Bookings",
    "notFound": "Order not found or access denied"
  }
}
```

---

## Prerequisites (Manual Steps Before Implementation)

### 1. Shopify Admin API Token with `read_orders` Scope

The current `SHOPIFY_ADMIN_ACCESS_TOKEN` in `.env.local` may be expired (it was a 24h client-credentials token from a prior session). Before implementing:

1. Go to Shopify Dev Dashboard for the headless app
2. Request a new token with scopes: `read_orders`, `write_products` (keep existing)
3. Update `.env.local` locally
4. Update Vercel env vars (Production + Preview) via the Vercel dashboard or API

### 2. Shopify Headless Channel Return URL

In Shopify Admin:
1. Go to **Settings → Apps and sales channels → Headless**
2. Set **Return URL** (or "Thank you page URL") to:  
   `https://mstravelnew.vercel.app/zh-CN/order-confirmation`
3. Save

This is the URL Shopify will redirect to after successful payment, with `?order_id=xxx` appended.

---

## Error States

| Condition | Behavior |
|---|---|
| Not logged in | `redirect(/${locale}/login)` |
| `order_id` param missing | `notFound()` |
| Admin API returns 404 | `notFound()` |
| Admin API error (5xx) | Throw → Next.js error boundary |
| `order.email` mismatch | `notFound()` |

---

## Out of Scope Decisions

- **Pickup location**: deferred to Phase 4
- **My Bookings page**: "查看我的预订" button renders as a disabled/placeholder link in Phase 3
- **English locale return URL**: only `zh-CN` return URL configured in Phase 3; English locale order confirmation page still works if user navigates manually or via `en` locale
- **Guest checkout**: not supported; cart page should show login prompt if user is unauthenticated before checkout
