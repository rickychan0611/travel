# Next.js Project Setup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Scaffold a production-ready Next.js 15 storefront connected to Shopify's Storefront API, with i18n (zh-CN / en / zh-TW), Tailwind CSS, shadcn/ui, and Zustand — ready for Phase 1 feature development.

**Architecture:** Next.js 15 App Router with locale-based routing (`/[locale]/...`). Shopify Storefront API is called from Next.js Route Handlers (BFF pattern) so tokens never reach the client. Static pages (homepage, PDPs) use ISR; dynamic pages (cart, agent portal) are client-rendered behind auth.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui, next-intl, Zustand, @shopify/storefront-api-client, Vercel

---

## Prerequisites

- Node.js ≥ 20 installed (`node -v`)
- pnpm installed (`npm i -g pnpm`)
- A Shopify development store with Storefront API access token (Headless channel or Custom App)
- Working directory: `D:\workspace\mstravelnew`

---

### Task 1: Initialise the Next.js 15 project

**Files:**
- Create: `D:\workspace\mstravelnew\` (project root — already exists)

**Step 1: Create Next.js app**

Run in `D:\workspace\mstravelnew`:
```powershell
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack
```

When prompted:
- Would you like to use Turbopack? → **Yes**
- All other options are already set by the flags above

**Step 2: Verify project created**

```powershell
Get-ChildItem
```
Expected: see `src/`, `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`

**Step 3: Start dev server to confirm baseline works**

```powershell
pnpm dev
```
Expected: `▲ Next.js 15.x.x` ready on http://localhost:3000. Visit in browser — see default Next.js page. Stop server (Ctrl+C).

**Step 4: Git init and first commit**

```powershell
git init
git add .
git commit -m "chore: initialise Next.js 15 project with TypeScript, Tailwind, App Router"
```

---

### Task 2: Install core dependencies

**Files:**
- Modify: `package.json` (via pnpm add)

**Step 1: Install Shopify Storefront client and GraphQL tooling**

```powershell
pnpm add @shopify/storefront-api-client graphql
```

**Step 2: Install i18n library**

```powershell
pnpm add next-intl
```

**Step 3: Install state management**

```powershell
pnpm add zustand
```

**Step 4: Install utility libraries**

```powershell
pnpm add clsx tailwind-merge lucide-react
```

**Step 5: Install shadcn/ui CLI and initialise**

```powershell
pnpm dlx shadcn@latest init
```

When prompted:
- Which style? → **Default**
- Which base color? → **Slate**
- CSS variables? → **Yes**

**Step 6: Add first shadcn components needed in Phase 1**

```powershell
pnpm dlx shadcn@latest add button badge tabs card separator skeleton dialog sheet
```

**Step 7: Verify no broken imports**

```powershell
pnpm build
```
Expected: Build completes with no errors. (Ignore "no pages found" type warnings at this stage.)

**Step 8: Commit**

```powershell
git add .
git commit -m "chore: add Shopify client, next-intl, Zustand, shadcn/ui dependencies"
```

---

### Task 3: Configure environment variables

**Files:**
- Create: `.env.local`
- Create: `.env.example`
- Modify: `.gitignore` (ensure `.env.local` is listed)

**Step 1: Create `.env.local`**

```
# Shopify Storefront API
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-storefront-token
SHOPIFY_ADMIN_ACCESS_TOKEN=your-admin-token

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_LOCALE=zh-CN
```

Replace placeholder values with your actual Shopify store domain and Storefront API access token from the Shopify Admin → Apps → Develop apps → your headless app → API credentials.

**Step 2: Create `.env.example` (safe to commit)**

```
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=
SHOPIFY_STOREFRONT_ACCESS_TOKEN=
SHOPIFY_ADMIN_ACCESS_TOKEN=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_DEFAULT_LOCALE=zh-CN
```

**Step 3: Verify `.gitignore` has `.env.local`**

Open `.gitignore` — confirm `.env.local` is present. If not, add it.

**Step 4: Commit**

```powershell
git add .env.example .gitignore
git commit -m "chore: add environment variable templates"
```

---

### Task 4: Set up the Shopify Storefront API client

**Files:**
- Create: `src/lib/shopify/client.ts`
- Create: `src/lib/shopify/types.ts`
- Create: `src/lib/shopify/queries/product.ts`

**Step 1: Create the Shopify client singleton**

`src/lib/shopify/client.ts`:
```typescript
import { createStorefrontApiClient } from '@shopify/storefront-api-client'

if (!process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN) {
  throw new Error('NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN is not set')
}
if (!process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
  throw new Error('SHOPIFY_STOREFRONT_ACCESS_TOKEN is not set')
}

export const shopifyClient = createStorefrontApiClient({
  storeDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
  apiVersion: '2025-01',
  publicAccessToken: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
})
```

**Step 2: Create shared types**

`src/lib/shopify/types.ts`:
```typescript
export interface ShopifyProduct {
  id: string
  handle: string
  title: string
  description: string
  tags: string[]
  productType: string
  vendor: string
  images: {
    nodes: Array<{ url: string; altText: string | null }>
  }
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: string }
  }
  metafields: Array<{ key: string; value: string; type: string } | null>
}

export interface ShopifyCollection {
  id: string
  handle: string
  title: string
  products: {
    nodes: ShopifyProduct[]
  }
}
```

**Step 3: Create first product query**

`src/lib/shopify/queries/product.ts`:
```typescript
export const PRODUCT_QUERY = `#graphql
  query GetProduct($handle: String!, $metafieldKeys: [HasMetafieldsIdentifier!]!) {
    product(handle: $handle) {
      id
      handle
      title
      description
      tags
      productType
      vendor
      images(first: 10) {
        nodes {
          url
          altText
        }
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      metafields(identifiers: $metafieldKeys) {
        key
        value
        type
      }
    }
  }
`

export const COLLECTION_PRODUCTS_QUERY = `#graphql
  query GetCollection($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      id
      handle
      title
      products(first: $first) {
        nodes {
          id
          handle
          title
          tags
          productType
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 1) {
            nodes {
              url
              altText
            }
          }
        }
      }
    }
  }
`
```

**Step 4: Verify TypeScript compiles**

```powershell
pnpm tsc --noEmit
```
Expected: No errors.

**Step 5: Commit**

```powershell
git add src/lib/shopify/
git commit -m "feat: add Shopify Storefront API client and base GraphQL queries"
```

---

### Task 5: Set up i18n routing with next-intl

**Files:**
- Create: `src/i18n/routing.ts`
- Create: `src/i18n/request.ts`
- Create: `src/middleware.ts`
- Create: `messages/zh-CN.json`
- Create: `messages/en.json`
- Create: `messages/zh-TW.json`

**Step 1: Define supported locales and routing**

`src/i18n/routing.ts`:
```typescript
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['zh-CN', 'en', 'zh-TW'],
  defaultLocale: 'zh-CN',
  localePrefix: 'always',
})
```

**Step 2: Create the next-intl request config**

`src/i18n/request.ts`:
```typescript
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as typeof routing.locales[number])) {
    locale = routing.defaultLocale
  }
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
```

**Step 3: Create middleware for locale routing**

`src/middleware.ts`:
```typescript
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
}
```

**Step 4: Create base translation files**

`messages/zh-CN.json`:
```json
{
  "nav": {
    "home": "首页",
    "tours": "旅游产品",
    "about": "关于我们",
    "contact": "联系我们",
    "login": "登录",
    "register": "注册",
    "myBookings": "我的订单",
    "agentPortal": "代理商入口"
  },
  "home": {
    "heroTitle": "探索世界，精彩每一天",
    "heroSubtitle": "专业旅游服务，带您畅游全球",
    "searchPlaceholder": "搜索目的地、产品或线路...",
    "searchBtn": "搜索"
  },
  "product": {
    "from": "起价",
    "perPerson": "/人",
    "days": "天",
    "nights": "晚",
    "bookNow": "立即预订",
    "available": "充足",
    "limited": "紧张",
    "soldOut": "售罄",
    "departure": "出发地",
    "destination": "目的地",
    "duration": "行程天数",
    "groupSize": "最少人数",
    "transport": "交通方式",
    "bookingType": "确认方式",
    "manual": "人工确认",
    "instant": "即时确认"
  },
  "categories": {
    "hot_seasonal": "当季热销",
    "promotion": "买二送二",
    "world_event": "世界杯专线",
    "day_trip": "边边游",
    "premium": "就是精品",
    "small_group": "精品小团",
    "themed": "影视之旅",
    "national_park": "国家公园"
  },
  "booking": {
    "selectDate": "选择日期",
    "selectPartySize": "选择人数",
    "selectPickup": "选择上车地点",
    "addons": "增值服务",
    "summary": "订单摘要",
    "total": "合计",
    "confirm": "确认预订",
    "pending": "待确认",
    "confirmed": "已确认",
    "cancelled": "已取消"
  },
  "common": {
    "loading": "加载中...",
    "error": "出现错误，请重试",
    "seeAll": "查看全部",
    "back": "返回",
    "close": "关闭",
    "save": "保存",
    "cancel": "取消",
    "confirm": "确认",
    "currency": "货币"
  }
}
```

`messages/en.json`:
```json
{
  "nav": {
    "home": "Home",
    "tours": "Tours",
    "about": "About",
    "contact": "Contact",
    "login": "Login",
    "register": "Register",
    "myBookings": "My Bookings",
    "agentPortal": "Agent Portal"
  },
  "home": {
    "heroTitle": "Explore the World, One Adventure at a Time",
    "heroSubtitle": "Professional tour services for travelers worldwide",
    "searchPlaceholder": "Search destinations, products or itineraries...",
    "searchBtn": "Search"
  },
  "product": {
    "from": "From",
    "perPerson": "/person",
    "days": " days",
    "nights": " nights",
    "bookNow": "Book Now",
    "available": "Available",
    "limited": "Limited",
    "soldOut": "Sold Out",
    "departure": "Departure",
    "destination": "Destination",
    "duration": "Duration",
    "groupSize": "Min. Persons",
    "transport": "Transport",
    "bookingType": "Confirmation",
    "manual": "Manual Confirm",
    "instant": "Instant Confirm"
  },
  "categories": {
    "hot_seasonal": "This Season's Picks",
    "promotion": "Buy 2 Get 2",
    "world_event": "World Cup Tours",
    "day_trip": "Day Trips",
    "premium": "Premium Tours",
    "small_group": "Boutique Groups",
    "themed": "Film & TV Tours",
    "national_park": "National Parks"
  },
  "booking": {
    "selectDate": "Select Date",
    "selectPartySize": "Select Party Size",
    "selectPickup": "Select Pickup Location",
    "addons": "Add-on Services",
    "summary": "Order Summary",
    "total": "Total",
    "confirm": "Confirm Booking",
    "pending": "Pending",
    "confirmed": "Confirmed",
    "cancelled": "Cancelled"
  },
  "common": {
    "loading": "Loading...",
    "error": "Something went wrong, please try again",
    "seeAll": "See All",
    "back": "Back",
    "close": "Close",
    "save": "Save",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "currency": "Currency"
  }
}
```

`messages/zh-TW.json`:
```json
{
  "nav": {
    "home": "首頁",
    "tours": "旅遊產品",
    "about": "關於我們",
    "contact": "聯絡我們",
    "login": "登入",
    "register": "註冊",
    "myBookings": "我的訂單",
    "agentPortal": "代理商入口"
  },
  "home": {
    "heroTitle": "探索世界，精彩每一天",
    "heroSubtitle": "專業旅遊服務，帶您暢遊全球",
    "searchPlaceholder": "搜尋目的地、產品或路線...",
    "searchBtn": "搜尋"
  },
  "product": {
    "from": "起價",
    "perPerson": "/人",
    "days": "天",
    "nights": "晚",
    "bookNow": "立即預訂",
    "available": "充足",
    "limited": "緊張",
    "soldOut": "售罄",
    "departure": "出發地",
    "destination": "目的地",
    "duration": "行程天數",
    "groupSize": "最少人數",
    "transport": "交通方式",
    "bookingType": "確認方式",
    "manual": "人工確認",
    "instant": "即時確認"
  },
  "categories": {
    "hot_seasonal": "當季熱銷",
    "promotion": "買二送二",
    "world_event": "世界盃專線",
    "day_trip": "邊邊遊",
    "premium": "就是精品",
    "small_group": "精品小團",
    "themed": "影視之旅",
    "national_park": "國家公園"
  },
  "booking": {
    "selectDate": "選擇日期",
    "selectPartySize": "選擇人數",
    "selectPickup": "選擇上車地點",
    "addons": "增值服務",
    "summary": "訂單摘要",
    "total": "合計",
    "confirm": "確認預訂",
    "pending": "待確認",
    "confirmed": "已確認",
    "cancelled": "已取消"
  },
  "common": {
    "loading": "載入中...",
    "error": "出現錯誤，請重試",
    "seeAll": "查看全部",
    "back": "返回",
    "close": "關閉",
    "save": "儲存",
    "cancel": "取消",
    "confirm": "確認",
    "currency": "貨幣"
  }
}
```

**Step 5: Verify middleware compiles**

```powershell
pnpm tsc --noEmit
```
Expected: No errors.

**Step 6: Commit**

```powershell
git add src/i18n/ src/middleware.ts messages/
git commit -m "feat: add next-intl i18n routing for zh-CN, en, zh-TW"
```

---

### Task 6: Restructure App Router for locale segments

**Files:**
- Create: `src/app/[locale]/layout.tsx`
- Create: `src/app/[locale]/page.tsx`
- Delete: `src/app/page.tsx` (replaced by locale version)
- Delete: `src/app/layout.tsx` (replaced by locale version)
- Create: `src/app/layout.tsx` (root layout — minimal, just html/body)

**Step 1: Create root layout (no locale)**

`src/app/layout.tsx`:
```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
```

**Step 2: Create locale layout**

`src/app/[locale]/layout.tsx`:
```typescript
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import './globals.css'

export const metadata: Metadata = {
  title: 'Global Tour Booking',
  description: 'Book tours worldwide',
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    notFound()
  }
  const messages = await getMessages()
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}
```

**Note:** Move `src/app/globals.css` reference — the `globals.css` file stays in `src/app/` but is imported in the locale layout.

**Step 3: Create locale home page placeholder**

`src/app/[locale]/page.tsx`:
```typescript
import { useTranslations } from 'next-intl'

export default function HomePage() {
  const t = useTranslations('home')
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold">{t('heroTitle')}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{t('heroSubtitle')}</p>
    </main>
  )
}
```

**Step 4: Delete old root page and layout**

```powershell
Remove-Item src/app/page.tsx
```

(Keep `src/app/layout.tsx` but replace with the root layout from Step 1.)

**Step 5: Start dev server and verify routing**

```powershell
pnpm dev
```

Visit:
- http://localhost:3000 → should redirect to http://localhost:3000/zh-CN
- http://localhost:3000/zh-CN → should show 首页 heading
- http://localhost:3000/en → should show "Explore the World" heading
- http://localhost:3000/zh-TW → should show Traditional Chinese heading

Stop server.

**Step 6: Commit**

```powershell
git add src/app/
git commit -m "feat: restructure App Router with locale segments and NextIntlClientProvider"
```

---

### Task 7: Set up the shared Zustand cart store

**Files:**
- Create: `src/store/cart.ts`
- Create: `src/store/ui.ts`

**Step 1: Create cart store**

`src/store/cart.ts`:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  variantId: string
  productHandle: string
  productTitle: string
  departureDate: string
  partySize: number
  pricePerPerson: number
  quantity: number
  pickupLocationId: string | null
  addons: Array<{ id: string; name: string; price: number; quantity: number }>
  lineItemProperties: Record<string, string>
}

interface CartStore {
  items: CartItem[]
  shopifyCartId: string | null
  addItem: (item: CartItem) => void
  removeItem: (variantId: string) => void
  clearCart: () => void
  setShopifyCartId: (id: string) => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      shopifyCartId: null,
      addItem: (item) =>
        set((state) => ({
          items: [...state.items.filter((i) => i.variantId !== item.variantId), item],
        })),
      removeItem: (variantId) =>
        set((state) => ({ items: state.items.filter((i) => i.variantId !== variantId) })),
      clearCart: () => set({ items: [], shopifyCartId: null }),
      setShopifyCartId: (id) => set({ shopifyCartId: id }),
    }),
    { name: 'tour-cart' }
  )
)
```

**Step 2: Create UI store (locale, currency, mobile menu)**

`src/store/ui.ts`:
```typescript
import { create } from 'zustand'

interface UIStore {
  currency: string
  mobileMenuOpen: boolean
  setCurrency: (currency: string) => void
  setMobileMenuOpen: (open: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  currency: 'USD',
  mobileMenuOpen: false,
  setCurrency: (currency) => set({ currency }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
}))
```

**Step 3: Verify TypeScript**

```powershell
pnpm tsc --noEmit
```
Expected: No errors.

**Step 4: Commit**

```powershell
git add src/store/
git commit -m "feat: add Zustand cart and UI stores with persistence"
```

---

### Task 8: Build the shared Header component

**Files:**
- Create: `src/components/layout/Header.tsx`
- Create: `src/components/layout/LocaleSwitcher.tsx`
- Create: `src/components/layout/CurrencySwitcher.tsx`
- Modify: `src/app/[locale]/layout.tsx`

**Step 1: Create LocaleSwitcher**

`src/components/layout/LocaleSwitcher.tsx`:
```typescript
'use client'
import { useLocale } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { routing } from '@/i18n/routing'

const LOCALE_LABELS: Record<string, string> = {
  'zh-CN': '简体中文',
  'en': 'English',
  'zh-TW': '繁體中文',
}

export function LocaleSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  function switchLocale(next: string) {
    const segments = pathname.split('/')
    segments[1] = next
    router.push(segments.join('/'))
  }

  return (
    <select
      value={locale}
      onChange={(e) => switchLocale(e.target.value)}
      className="text-sm bg-transparent border border-border rounded px-2 py-1"
    >
      {routing.locales.map((l) => (
        <option key={l} value={l}>{LOCALE_LABELS[l]}</option>
      ))}
    </select>
  )
}
```

**Step 2: Create CurrencySwitcher**

`src/components/layout/CurrencySwitcher.tsx`:
```typescript
'use client'
import { useUIStore } from '@/store/ui'

const CURRENCIES = ['USD', 'CAD', 'CNY', 'EUR', 'AUD', 'HKD']

export function CurrencySwitcher() {
  const { currency, setCurrency } = useUIStore()
  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value)}
      className="text-sm bg-transparent border border-border rounded px-2 py-1"
    >
      {CURRENCIES.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  )
}
```

**Step 3: Create Header**

`src/components/layout/Header.tsx`:
```typescript
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { LocaleSwitcher } from './LocaleSwitcher'
import { CurrencySwitcher } from './CurrencySwitcher'
import { Button } from '@/components/ui/button'

export function Header({ locale }: { locale: string }) {
  const t = useTranslations('nav')
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href={`/${locale}`} className="text-xl font-bold text-primary">
          GlobalTours
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href={`/${locale}/tours`} className="text-muted-foreground hover:text-foreground transition-colors">
            {t('tours')}
          </Link>
          <Link href={`/${locale}/about`} className="text-muted-foreground hover:text-foreground transition-colors">
            {t('about')}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <CurrencySwitcher />
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${locale}/login`}>{t('login')}</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/${locale}/agent`}>{t('agentPortal')}</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
```

**Step 4: Add Header to locale layout**

In `src/app/[locale]/layout.tsx`, import and add Header after `<body>`:
```typescript
import { Header } from '@/components/layout/Header'

// Inside the body:
<body>
  <NextIntlClientProvider messages={messages}>
    <Header locale={locale} />
    {children}
  </NextIntlClientProvider>
</body>
```

**Step 5: Start dev server and verify header renders**

```powershell
pnpm dev
```
Visit http://localhost:3000/zh-CN — confirm header shows with logo, nav links, locale switcher (简体中文 / English / 繁體中文), currency switcher, Login and Agent Portal buttons. Stop server.

**Step 6: Commit**

```powershell
git add src/components/ src/app/[locale]/layout.tsx
git commit -m "feat: add Header with LocaleSwitcher and CurrencySwitcher"
```

---

### Task 9: Create a Route Handler BFF for Shopify queries

**Files:**
- Create: `src/app/api/shopify/products/route.ts`
- Create: `src/app/api/shopify/collections/[handle]/route.ts`

**Step 1: Create products search API route**

`src/app/api/shopify/products/route.ts`:
```typescript
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
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}
```

**Step 2: Create collection-specific route**

`src/app/api/shopify/collections/[handle]/route.ts`:
```typescript
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
```

**Step 3: Verify build**

```powershell
pnpm build
```
Expected: Build succeeds. (API routes will 500 at runtime until Shopify env vars are set — that is expected.)

**Step 4: Commit**

```powershell
git add src/app/api/
git commit -m "feat: add BFF Route Handlers for Shopify collection and product queries"
```

---

### Task 10: Configure next.config and finalize scaffold

**Files:**
- Modify: `next.config.ts`
- Create: `src/components/layout/Footer.tsx`
- Modify: `src/app/[locale]/layout.tsx`

**Step 1: Update next.config.ts**

`next.config.ts`:
```typescript
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.myshopify.com' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: '**.tripcdn.com' },
    ],
  },
  experimental: {
    typedRoutes: true,
  },
}

export default withNextIntl(nextConfig)
```

**Step 2: Create Footer**

`src/components/layout/Footer.tsx`:
```typescript
import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('nav')
  return (
    <footer className="border-t mt-auto py-8 text-sm text-muted-foreground">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <span>© 2026 GlobalTours. All rights reserved.</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-foreground transition-colors">{t('about')}</a>
          <a href="#" className="hover:text-foreground transition-colors">{t('contact')}</a>
        </div>
      </div>
    </footer>
  )
}
```

**Step 3: Add Footer to locale layout**

In `src/app/[locale]/layout.tsx`, import and add Footer before `</body>`:
```typescript
import { Footer } from '@/components/layout/Footer'
// Inside body, after {children}:
<Footer />
```

Also wrap body content in a flex column:
```typescript
<body className="flex min-h-screen flex-col">
  <NextIntlClientProvider messages={messages}>
    <Header locale={locale} />
    <main className="flex-1">{children}</main>
    <Footer />
  </NextIntlClientProvider>
</body>
```

**Step 4: Final build verification**

```powershell
pnpm build
```
Expected: Build completes successfully. Note any warnings but no errors.

**Step 5: Final dev server smoke test**

```powershell
pnpm dev
```
Verify:
- http://localhost:3000 → redirects to `/zh-CN`
- `/zh-CN` → shows Header + hero text in Chinese + Footer
- `/en` → shows Header + hero text in English + Footer
- `/zh-TW` → shows Header + hero text in Traditional Chinese + Footer
- Locale switcher changes page locale
- Currency switcher updates store (check Zustand DevTools or console)

Stop server.

**Step 6: Final commit**

```powershell
git add .
git commit -m "feat: complete Next.js project scaffold — i18n, Shopify client, BFF routes, layout"
```

---

## Summary

After completing all 10 tasks you will have:

| What | Where |
|---|---|
| Next.js 15 App Router project | `D:\workspace\mstravelnew\` |
| Tailwind CSS v4 + shadcn/ui | `src/components/ui/` |
| next-intl locale routing | `/zh-CN`, `/en`, `/zh-TW` |
| Translation files | `messages/*.json` |
| Shopify Storefront API client | `src/lib/shopify/client.ts` |
| Shopify GraphQL queries | `src/lib/shopify/queries/` |
| BFF Route Handlers | `src/app/api/shopify/` |
| Zustand cart + UI stores | `src/store/` |
| Header (locale + currency switcher) | `src/components/layout/Header.tsx` |
| Footer | `src/components/layout/Footer.tsx` |
| next.config with image domains | `next.config.ts` |

Next phase: **Homepage category tabs + Product Card component** (Phase 1, Task 2).
