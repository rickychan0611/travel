# Shopify API Connection Reference

How this Next.js app talks to Shopify: upstream endpoints, auth, GraphQL operations, and the app’s own `/api/shopify/*` routes.

**API version:** `2026-01`  
**Store domain:** `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` (e.g. `your-store.myshopify.com`)

中文版：[SHOPIFY_API.zh-CN.md](./SHOPIFY_API.zh-CN.md)

---

## Overview

The app uses **two Shopify APIs**:

| API | Purpose | Auth | Used for |
|---|---|---|---|
| **Storefront API** | Public catalog + cart/checkout | `SHOPIFY_STOREFRONT_ACCESS_TOKEN` (private token via `@shopify/storefront-api-client`) | Products, collections, cart create → checkout URL |
| **Admin API** | Privileged order data | `SHOPIFY_ADMIN_ACCESS_TOKEN` (`X-Shopify-Access-Token` header) | Orders by email, order by ID (bookings + confirmation) |

```
Browser / Server Components
        │
        ├─ shopifyClient.request(...)     ──► Storefront GraphQL
        │                                      https://{domain}/api/2026-01/graphql.json
        │
        ├─ GET/POST /api/shopify/*        ──► (same Storefront client)
        │
        └─ getOrdersByEmail / getOrderById ──► Admin GraphQL
                                               https://{domain}/admin/api/2026-01/graphql.json
```

---

## Environment variables

| Variable | Exposed to client? | Description |
|---|---|---|
| `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` | Yes | Shopify store hostname |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | No | Storefront API private access token |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | No | Admin API token (`read_orders` required for order pages) |

Defined in `.env.example` / `.env.local`. Client setup: `src/lib/shopify/client.ts`.

---

## 1. Shopify upstream endpoints

### 1.1 Storefront GraphQL

| | |
|---|---|
| **URL** | `https://{NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN}/api/2026-01/graphql.json` |
| **Method** | `POST` |
| **Auth** | Private Storefront access token (SDK `privateAccessToken`) |
| **Client** | `src/lib/shopify/client.ts` → `createStorefrontApiClient` |
| **Description** | Single GraphQL endpoint for catalog reads and cart mutations. The SDK builds the URL from `storeDomain` + `apiVersion`. |

#### GraphQL operations (Storefront)

| Operation | File | Description | Call sites |
|---|---|---|---|
| `GetProduct` | `src/lib/shopify/queries/product.ts` | Product by `handle`: title, description, tags, images, price range, variants (departure/party options). | Tour detail page `src/app/[locale]/tours/[handle]/page.tsx` |
| `GetAllProducts` | same | First N products (list cards). | Tours index `src/app/[locale]/tours/page.tsx` |
| `GetCollection` | same | Collection by `handle` + nested products. | Home page; `GET /api/shopify/products`; `GET /api/shopify/collections/[handle]` |
| `CartCreate` | `src/lib/shopify/queries/cart.ts` | Creates a cart with line items + optional `buyerIdentity.email`; returns `checkoutUrl` for Shopify-hosted payment. | `POST /api/shopify/cart` |

---

### 1.2 Admin GraphQL

| | |
|---|---|
| **URL** | `https://{NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN}/admin/api/2026-01/graphql.json` |
| **Method** | `POST` |
| **Auth** | Header `X-Shopify-Access-Token: {SHOPIFY_ADMIN_ACCESS_TOKEN}` |
| **Client** | Raw `fetch` in `src/lib/shopify/orders.ts` (server-only) |
| **Description** | Privileged order queries. Never call from the browser; tokens stay server-side. |

#### GraphQL operations (Admin)

| Operation | Function | Description | Call sites |
|---|---|---|---|
| `GetOrdersByEmail` | `getOrdersByEmail(email)` | Up to 20 orders matching `email:{email}`, newest first. Line items + financial/fulfillment status. | Bookings page; order-confirmation fallback |
| `GetOrderById` | `getOrderById(id)` | Single order by numeric ID or GID (`gid://shopify/Order/...`). Returns `null` if missing. | Order confirmation page |

---

### 1.3 Admin REST (setup script only)

Used only by `scripts/setup-shopify.mjs` for local seed data — **not** by the running app:

| Method | Path | Description |
|---|---|---|
| `GET` / `POST` | `https://{domain}/admin/api/2026-01/...` | Create collections/products for dev setup |

---

## 2. Next.js app API routes (BFF)

These are **this app’s** HTTP endpoints. They proxy to the Storefront API and are safe for the browser to call.

### `GET /api/shopify/products`

| | |
|---|---|
| **File** | `src/app/api/shopify/products/route.ts` |
| **Query params** | `collection` (required) — collection handle; `first` (optional, default `20`) |
| **Upstream** | Storefront `GetCollection` |
| **Description** | Returns products in a Shopify collection as JSON (`data` from GraphQL). `400` if `collection` missing. |

**Example:** `GET /api/shopify/products?collection=hot-seasonal&first=20`

---

### `GET /api/shopify/collections/[handle]`

| | |
|---|---|
| **File** | `src/app/api/shopify/collections/[handle]/route.ts` |
| **Path param** | `handle` — collection handle |
| **Upstream** | Storefront `GetCollection` with `first: 50` |
| **Description** | Same collection query as products route, fixed page size 50. Used by home category tabs (`CategoryTabs`). |

**Example:** `GET /api/shopify/collections/hot-seasonal`

---

### `POST /api/shopify/cart`

| | |
|---|---|
| **File** | `src/app/api/shopify/cart/route.ts` |
| **Body** | `{ items: CartItem[], buyerEmail?: string, returnUrl?: string }` |
| **Upstream** | Storefront `CartCreate` |
| **Description** | Builds cart lines from variant IDs + attributes (Departure Date, Party Size, Pickup Location). Optionally sets buyer email. Returns `{ checkoutUrl }` for redirect to Shopify checkout. Appends `?return_to=` when `returnUrl` is provided. |

**Status codes:** `400` bad body; `422` Shopify userErrors; `502` GraphQL/checkout failure; `500` unexpected error.

**Example body:**

```json
{
  "items": [
    {
      "variantId": "gid://shopify/ProductVariant/123",
      "departureDate": "2026-08-15",
      "partySize": 2,
      "pickupLocationId": "hotel-a"
    }
  ],
  "buyerEmail": "user@example.com",
  "returnUrl": "https://example.com/zh-CN/order-confirmation"
}
```

---

## 3. Direct server usage (no app route)

Some pages call Shopify from Server Components without going through `/api/shopify/*`:

| Page | Shopify call |
|---|---|
| `/[locale]` (home) | `COLLECTION_PRODUCTS_QUERY` via `shopifyClient` |
| `/[locale]/tours` | `ALL_PRODUCTS_QUERY` |
| `/[locale]/tours/[handle]` | `PRODUCT_QUERY` |
| `/[locale]/bookings` | `getOrdersByEmail` (Admin) |
| `/[locale]/order-confirmation` | `getOrderById` / `getOrdersByEmail` (Admin) |

Checkout flow: cart page → `POST /api/shopify/cart` → browser redirects to Shopify `checkoutUrl` → after payment, Shopify Return URL → `/[locale]/order-confirmation?order_id=...`.

---

## 4. Related files

| Path | Role |
|---|---|
| `src/lib/shopify/client.ts` | Storefront SDK client |
| `src/lib/shopify/orders.ts` | Admin GraphQL helpers |
| `src/lib/shopify/queries/product.ts` | Product/collection queries |
| `src/lib/shopify/queries/cart.ts` | Cart create mutation |
| `src/lib/shopify/types.ts` | Shared product/collection types |
| `src/lib/shopify/utils/parseVariants.ts` | Variant → departure dates |
| `next.config.ts` | Allows `**.myshopify.com` and `cdn.shopify.com` images |

---

## 5. Official Shopify docs

- [Storefront API](https://shopify.dev/docs/api/storefront)
- [Admin GraphQL API](https://shopify.dev/docs/api/admin-graphql)
- [Cart / checkout (Headless)](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart)
