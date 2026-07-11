# Shopify API 对接说明

本文说明本 Next.js 应用如何连接 Shopify：上游接口、鉴权方式、GraphQL 操作，以及应用自身的 `/api/shopify/*` 路由。

**API 版本：** `2026-01`  
**店铺域名：** `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`（例如 `your-store.myshopify.com`）

英文版：[SHOPIFY_API.md](./SHOPIFY_API.md)

---

## 概览

应用使用 **两套 Shopify API**：

| API | 用途 | 鉴权 | 使用场景 |
|---|---|---|---|
| **Storefront API** | 公开商品目录 + 购物车/结账 | `SHOPIFY_STOREFRONT_ACCESS_TOKEN`（通过 `@shopify/storefront-api-client` 的私有令牌） | 商品、专辑（Collection）、创建购物车 → 结账 URL |
| **Admin API** | 特权订单数据 | `SHOPIFY_ADMIN_ACCESS_TOKEN`（请求头 `X-Shopify-Access-Token`） | 按邮箱查订单、按 ID 查订单（我的预订 + 订单确认） |

```
浏览器 / Server Components
        │
        ├─ shopifyClient.request(...)     ──► Storefront GraphQL
        │                                      https://{domain}/api/2026-01/graphql.json
        │
        ├─ GET/POST /api/shopify/*        ──► （同一 Storefront 客户端）
        │
        └─ getOrdersByEmail / getOrderById ──► Admin GraphQL
                                               https://{domain}/admin/api/2026-01/graphql.json
```

---

## 环境变量

| 变量 | 是否暴露给客户端 | 说明 |
|---|---|---|
| `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` | 是 | Shopify 店铺主机名 |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | 否 | Storefront API 私有访问令牌 |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | 否 | Admin API 令牌（订单页需要 `read_orders` 权限） |

定义于 `.env.example` / `.env.local`。客户端初始化：`src/lib/shopify/client.ts`。

---

## 1. Shopify 上游接口

### 1.1 Storefront GraphQL

| | |
|---|---|
| **URL** | `https://{NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN}/api/2026-01/graphql.json` |
| **方法** | `POST` |
| **鉴权** | Storefront 私有访问令牌（SDK 的 `privateAccessToken`） |
| **客户端** | `src/lib/shopify/client.ts` → `createStorefrontApiClient` |
| **说明** | 商品目录读取与购物车变更的统一 GraphQL 入口。SDK 根据 `storeDomain` + `apiVersion` 拼出 URL。 |

#### GraphQL 操作（Storefront）

| 操作 | 文件 | 说明 | 调用位置 |
|---|---|---|---|
| `GetProduct` | `src/lib/shopify/queries/product.ts` | 按 `handle` 取商品：标题、描述、标签、图片、价格区间、变体（出发日/人数选项）。 | 线路详情页 `src/app/[locale]/tours/[handle]/page.tsx` |
| `GetAllProducts` | 同上 | 取前 N 个商品（列表卡片）。 | 线路列表 `src/app/[locale]/tours/page.tsx` |
| `GetCollection` | 同上 | 按 `handle` 取专辑及其商品。 | 首页；`GET /api/shopify/products`；`GET /api/shopify/collections/[handle]` |
| `CartCreate` | `src/lib/shopify/queries/cart.ts` | 创建购物车（行项目 + 可选 `buyerIdentity.email`）；返回 Shopify 托管支付用的 `checkoutUrl`。 | `POST /api/shopify/cart` |

---

### 1.2 Admin GraphQL

| | |
|---|---|
| **URL** | `https://{NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN}/admin/api/2026-01/graphql.json` |
| **方法** | `POST` |
| **鉴权** | 请求头 `X-Shopify-Access-Token: {SHOPIFY_ADMIN_ACCESS_TOKEN}` |
| **客户端** | `src/lib/shopify/orders.ts` 中的原生 `fetch`（仅服务端） |
| **说明** | 特权订单查询。切勿在浏览器中调用；令牌只留在服务端。 |

#### GraphQL 操作（Admin）

| 操作 | 函数 | 说明 | 调用位置 |
|---|---|---|---|
| `GetOrdersByEmail` | `getOrdersByEmail(email)` | 最多 20 条匹配 `email:{email}` 的订单，按创建时间倒序。含行项目与支付/履约状态。 | 我的预订页；订单确认页兜底 |
| `GetOrderById` | `getOrderById(id)` | 按数字 ID 或 GID（`gid://shopify/Order/...`）取单笔订单；不存在则返回 `null`。 | 订单确认页 |

---

### 1.3 Admin REST（仅初始化脚本）

仅由 `scripts/setup-shopify.mjs` 用于本地种子数据 —— **运行中的应用不会调用**：

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` / `POST` | `https://{domain}/admin/api/2026-01/...` | 开发环境创建专辑/商品 |

---

## 2. Next.js 应用 API 路由（BFF）

以下是**本应用**的 HTTP 接口，代理到 Storefront API，浏览器可安全调用。

### `GET /api/shopify/products`

| | |
|---|---|
| **文件** | `src/app/api/shopify/products/route.ts` |
| **查询参数** | `collection`（必填）— 专辑 handle；`first`（可选，默认 `20`） |
| **上游** | Storefront `GetCollection` |
| **说明** | 以 JSON 返回某专辑下的商品（GraphQL 的 `data`）。缺少 `collection` 时返回 `400`。 |

**示例：** `GET /api/shopify/products?collection=hot-seasonal&first=20`

---

### `GET /api/shopify/collections/[handle]`

| | |
|---|---|
| **文件** | `src/app/api/shopify/collections/[handle]/route.ts` |
| **路径参数** | `handle` — 专辑 handle |
| **上游** | Storefront `GetCollection`，`first: 50` |
| **说明** | 与 products 路由相同的专辑查询，固定取 50 条。供首页分类 Tab（`CategoryTabs`）使用。 |

**示例：** `GET /api/shopify/collections/hot-seasonal`

---

### `POST /api/shopify/cart`

| | |
|---|---|
| **文件** | `src/app/api/shopify/cart/route.ts` |
| **请求体** | `{ items: CartItem[], buyerEmail?: string, returnUrl?: string }` |
| **上游** | Storefront `CartCreate` |
| **说明** | 根据变体 ID 与属性（出发日 Departure Date、人数 Party Size、上车点 Pickup Location）组装购物车行。可设置买家邮箱。返回 `{ checkoutUrl }` 用于跳转 Shopify 结账。若提供 `returnUrl`，会追加 `?return_to=`。 |

**状态码：** `400` 请求体无效；`422` Shopify userErrors；`502` GraphQL/结账失败；`500` 未预期错误。

**请求体示例：**

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

## 3. 服务端直接调用（不经应用路由）

部分页面在 Server Components 中直接调 Shopify，不经过 `/api/shopify/*`：

| 页面 | Shopify 调用 |
|---|---|
| `/[locale]`（首页） | 经 `shopifyClient` 调用 `COLLECTION_PRODUCTS_QUERY` |
| `/[locale]/tours` | `ALL_PRODUCTS_QUERY` |
| `/[locale]/tours/[handle]` | `PRODUCT_QUERY` |
| `/[locale]/bookings` | `getOrdersByEmail`（Admin） |
| `/[locale]/order-confirmation` | `getOrderById` / `getOrdersByEmail`（Admin） |

结账流程：购物车页 → `POST /api/shopify/cart` → 浏览器跳转 Shopify `checkoutUrl` → 支付完成后经 Shopify Return URL → `/[locale]/order-confirmation?order_id=...`。

---

## 4. 相关文件

| 路径 | 作用 |
|---|---|
| `src/lib/shopify/client.ts` | Storefront SDK 客户端 |
| `src/lib/shopify/orders.ts` | Admin GraphQL 辅助函数 |
| `src/lib/shopify/queries/product.ts` | 商品/专辑查询 |
| `src/lib/shopify/queries/cart.ts` | 创建购物车 mutation |
| `src/lib/shopify/types.ts` | 商品/专辑共享类型 |
| `src/lib/shopify/utils/parseVariants.ts` | 变体 → 出发日期 |
| `next.config.ts` | 允许 `**.myshopify.com` 与 `cdn.shopify.com` 图片 |

---

## 5. Shopify 官方文档

- [Storefront API](https://shopify.dev/docs/api/storefront)
- [Admin GraphQL API](https://shopify.dev/docs/api/admin-graphql)
- [购物车 / 结账（Headless）](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart)
