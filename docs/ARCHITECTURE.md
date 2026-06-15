# Solution Architecture & Design
# Global Tour Booking Platform — Shopify + Next.js

**Version:** 1.0  
**Date:** 2026-06-14

---

## 1. Solution Overview

We build on **Shopify** as the commerce backbone (catalog, cart, checkout, orders, payments, discounts, customer accounts) and layer a **Next.js** storefront on top via the **Shopify Storefront API** and **Admin API**. Tour-specific data that Shopify's native model cannot express (departure calendars, party-size pricing, itineraries, add-ons, pickup locations) is stored in **Shopify Metafields / Metaobjects** and surfaced through the custom storefront.

This approach avoids rebuilding commodity commerce infrastructure (PCI checkout, order management, discount engine, email notifications) while allowing full UI and booking-logic ownership through Next.js.

```
┌────────────────────────────────────────────────────────────┐
│                     USERS                                   │
│   B2C Traveler          B2B Agent         Operator/Admin    │
└──────────┬──────────────────┬──────────────────┬───────────┘
           │                  │                  │
           ▼                  ▼                  ▼
┌──────────────────────────────────────────────────────────┐
│               Next.js Storefront (Vercel)                  │
│                                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐  │
│  │  Public Site │  │ Agent Portal│  │  (Shopify Admin) │  │
│  │  (App Router)│  │ /agent/*    │  │  + custom app    │  │
│  └──────┬──────┘  └──────┬──────┘  └────────┬─────────┘  │
│         │                │                   │             │
└─────────┼────────────────┼───────────────────┼────────────┘
          │                │                   │
          ▼                ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│                      Shopify                             │
│                                                         │
│  Storefront API    Admin API      Webhooks              │
│  ─────────────     ──────────     ────────              │
│  Products          Orders         order/created         │
│  Collections       Customers      order/updated         │
│  Cart & Checkout   Discounts      product/updated       │
│  Customer Auth     Metafields     inventory/update      │
│  Payments          Metaobjects                          │
└─────────────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────┐
│   Payment Providers                │
│   Stripe / Alipay / WeChat Pay /   │
│   PayPal (via Shopify Payments +   │
│   custom payment extensions)       │
└────────────────────────────────────┘
```

---

## 2. What Shopify Handles Natively

These capabilities are **used as-is** with no custom code beyond configuration:

| Shopify Feature | How it Maps to This Platform |
|---|---|
| **Products & Variants** | Each tour is a Shopify product; variants represent party-size tiers (1-person, 2-person, 3-person, 4-person) per departure date batch |
| **Collections** | Tour categories (Hot Picks, Premium Small Groups, Yellowstone, Day Trips, etc.) |
| **Metafields** | Store tour-specific data: itinerary, add-ons, pickup locations, departure schedule, cancellation policy |
| **Metaobjects** | Reusable structured schemas — e.g. `Itinerary Day`, `Addon Service`, `Pickup Location`, `Departure Window` |
| **Inventory** | Track seat availability per variant (departure date × party size) |
| **Cart & Checkout** | Native Shopify checkout handles cart, address, payment |
| **Customer Accounts** | Shopify Customer API for B2C registration, login, order history |
| **Discounts & Promotions** | Automatic discounts for Buy-2-Get-2, seasonal codes, agent-specific price lists |
| **Shopify Functions** | Custom discount logic, cart transformations (e.g. mandatory add-on auto-add) |
| **Shopify Flow** | Automate workflows: send confirmation email on order creation, alert operator on new pending booking, notify agent on booking status change |
| **Order Management** | Operator views all bookings; can add tags (Pending / Confirmed / Cancelled) |
| **Email Notifications** | Order confirmation, shipping (repurposed as "booking confirmed") emails via Shopify templates |
| **B2B Wholesale (Shopify Plus)** | Agent-specific price lists, company accounts, net rate visibility |
| **Markets** | Multi-currency + multi-language storefront configuration |
| **Analytics** | Shopify Analytics for revenue, conversion, top products |
| **Shopify Admin** | Operator back-office for products, orders, customers, discounts |

---

## 3. What Requires Custom Next.js Development

These are tour-booking-specific features that Shopify's native UI cannot express:

### 3.1 Public Storefront (`/`)

| Component | Complexity | Description |
|---|---|---|
| **Homepage category tabs** | Medium | Tabbed section per category; sub-tabs filter by departure city; pulls collections from Shopify via Storefront API |
| **Product card** | Low | Tour code badge, tier tag, departure city tag, title, base price |
| **Global search + filters** | High | Keyword + multi-filter (departure city, destination, duration, date range, price) search page with faceted results |
| **Promotional banners** | Low | CMS-driven banner slots using Shopify Metaobjects or a headless CMS block |

### 3.2 Product Detail Page (`/tours/[handle]`)

| Component | Complexity | Description |
|---|---|---|
| **Image gallery** | Low | Hero + thumbnail strip |
| **Departure calendar** | High | Monthly calendar; per-date pricing fetched from Shopify variant pricing; color-coded availability using inventory data |
| **Party-size pricing panel** | Medium | Reads variants (1p/2p/3p/4p) for selected date; calculates total; syncs with calendar |
| **Pickup / dropoff selector** | Medium | Metaobject-backed list; user selects pickup slot; stored in cart attributes |
| **Add-on services table** | Medium | Reads Metafield list of add-on Metaobjects; mandatory items auto-add to cart via Shopify Functions; optional items user-selects |
| **Departure schedule grid** | Low | Renders Metafield JSON — date ranges × days of week + special dates |
| **Tabbed content** | Low | Tabs backed by Metafield rich text / JSON: Highlights, Costs, Itinerary, Terms |
| **Day-by-day itinerary** | Medium | Renders structured `Itinerary Day` Metaobject list: day number, time slots, activities, hotels, attraction descriptions |
| **Currency switcher** | Medium | Client-side currency conversion using live exchange rates; updates displayed prices (checkout always in base currency) |
| **Export / Print / Send** | Medium | PDF generation (react-pdf or puppeteer serverless function); print stylesheet; mailto/share link |

### 3.3 Booking Flow

| Component | Complexity | Description |
|---|---|---|
| **Passenger info form** | High | Custom form injected before Shopify checkout; passenger data stored as order line item properties / cart attributes |
| **Order summary review** | Medium | Pre-checkout summary page showing all line items, add-ons, total with breakdown |
| **Manual-confirmation status page** | Medium | Post-checkout page showing "Pending Confirmation" for products tagged `manual-confirm`; polls order status via API |
| **Booking status tracking** | Medium | Customer-facing status page: Confirmed / Pending / Cancelled; reads order tags and metafields |

### 3.4 Agent Portal (`/agent`)

| Component | Complexity | Description |
|---|---|---|
| **Agent registration form** | Medium | Custom form; creates Shopify B2B company account; sets approval status tag |
| **Agent login** | Low | Shopify B2B customer auth via Storefront API |
| **Quick search by tour code** | Low | Filter Shopify products by `sku` / `handle` matching the tour code |
| **Agent dashboard** | High | Order list with filters; revenue summary; CSV export; booking status breakdown |
| **Bulk passenger entry** | High | Multi-passenger form with row-per-passenger; optional CSV upload mapped to passenger fields |
| **Agent share link** | Low | URL with agent UTM / ref code for commission tracking |

### 3.5 Infrastructure & Cross-cutting

| Concern | Approach |
|---|---|
| **Rendering strategy** | Homepage + PDP: SSG with ISR (revalidate every 5 min for pricing); Checkout flow: CSR; Agent portal: CSR behind auth |
| **Authentication** | B2C: Shopify Customer Accounts API (new); B2B: Shopify B2B; Operator: Shopify Admin login |
| **i18n** | `next-intl`; locale routing `/cn/`, `/en/`, `/tw/`; translation files per locale; Shopify Markets for currency |
| **State management** | Zustand or React Context for cart state, selected date, party size, add-ons |
| **API layer** | Next.js Route Handlers as BFF (Backend for Frontend) — proxy Shopify Storefront API calls, apply business logic, avoid exposing tokens client-side |
| **Webhooks** | Shopify webhooks → Next.js API route → trigger email (booking confirmed), Slack alert (new pending booking), inventory update |
| **PDF generation** | Serverless function (Vercel Edge) using `@react-pdf/renderer` for tour detail and booking confirmation PDFs |
| **Exchange rates** | Cron job (Vercel Cron) fetches rates from Open Exchange Rates API every hour; stored in KV store (Vercel KV) |
| **Search** | Shopify Storefront Search API for basic; Algolia or Shopify Search & Discovery app for faceted filtering at scale |

---

## 4. Shopify Data Model

### 4.1 Product Structure

```
Shopify Product = 1 Tour
  ├── title: "Grand Teton + Yellowstone 3-Day Tour (大提顿+黄石3日游)"
  ├── handle: "grand-teton-yellowstone-3day-y3"
  ├── product_type: "group-tour" | "small-group" | "day-trip" | "themed"
  ├── tags: ["departure:salt-lake-city", "region:west-us", "tier:silver",
  │          "category:national-park", "manual-confirm", "tour-code:Y3"]
  ├── vendor: "UV Tours" (operator name)
  │
  ├── Variants (departure-date × party-size):
  │     e.g. "2026-06-26 | 1 Person" → price: $718
  │          "2026-06-26 | 2 Persons" → price: $488
  │          "2026-06-26 | 3 Persons" → price: $448
  │          "2026-06-26 | 4 Persons" → price: $408
  │          "2026-06-28 | 1 Person" → price: $718 ...
  │     (inventory tracked per variant = seats remaining)
  │
  └── Metafields:
        tour_code: "Y3"
        map_code: "R0001762"
        duration_days: 3
        duration_nights: 2
        departure_city: "Salt Lake City"
        destination_city: "Salt Lake City"
        transport_mode: "coach"
        booking_type: "manual" | "instant"
        min_pax: 1
        tier_label: "silver" | "gold" | "premium"
        highlights: ["Visit 15 Yellowstone attractions", "Bilingual guide"]
        included: ["Professional coach", "Bilingual guide", "Hotels"]
        excluded: ["Meals", "Service fee $15/day/person", "Personal expenses"]
        itinerary: [reference list → ItineraryDay metaobjects]
        addons: [reference list → AddonService metaobjects]
        pickup_locations: [reference list → PickupLocation metaobjects]
        dropoff_locations: [reference list → PickupLocation metaobjects]
        departure_windows: [reference list → DepartureWindow metaobjects]
        cancellation_policy: [JSON array of tiers]
        booking_restrictions: rich text
        booking_notices: rich text
        travel_advisories: rich text
```

### 4.2 Key Metaobject Schemas

**ItineraryDay**
```
day_number: integer
label: string ("Day 1 — Salt Lake City → Grand Teton → Yellowstone")
time_slots: [{ time: "全天", icon: "mountain", title: "...", description: "..." }]
hotel: string
hotel_grade: string
```

**AddonService**
```
name: string
name_en: string
applicable_to: "all" | "adult" | "child"
description: string
price: decimal
currency: string
mandatory: boolean
days_covered: integer
included_items: string
```

**PickupLocation**
```
name: string
address: string
departure_time: string
map_url: string
```

**DepartureWindow**
```
start_date: date
end_date: date
days_of_week: [0,1,4,6]  (0=Sun, 1=Mon, etc.)
special_dates: [date array]
min_pax_guaranteed: integer
notes: string
```

### 4.3 Collections

```
Shopify Collections map to homepage categories:
  hot-seasonal-east-us
  hot-seasonal-west-us
  hot-seasonal-canada
  promotion-buy2get2
  world-cup-2026
  day-trips-new-york
  day-trips-los-angeles
  premium-small-groups
  boutique-tours
  film-tv-tours-east
  film-tv-tours-west
  yellowstone-national-park
  (+ automated collections by tag for departure city sub-filters)
```

---

## 5. Key Technical Decisions

### Decision 1: Shopify Variant Strategy for Tour Dates

**Problem:** Tours have many departure dates × party sizes, potentially 1000+ variants per product.

**Options:**
- A. One variant per (date × party-size) — simple but hits Shopify's 2,000-variant limit per product
- B. One variant per party-size tier; dates managed via Metaobject + custom inventory API — bypasses limit but requires custom inventory layer
- C. Split long-running tours into seasonal products (e.g. "Y3 Summer 2026") — manageable variant count, natural for seasonal pricing

**Recommendation: Option C** for seasonal products with bounded date ranges. For day-trips with perpetual schedules, use Option B with a lightweight inventory service (Supabase or Vercel Postgres).

### Decision 2: Checkout Flow — Native vs. Custom

**Problem:** Shopify's native checkout cannot collect tour-specific passenger info (name, DOB, passport number).

**Options:**
- A. Use Shopify Checkout Extensions (UI Extensions) to add passenger form fields inside Shopify checkout
- B. Custom pre-checkout page in Next.js; store data as cart/line item attributes; proceed to Shopify checkout for payment only

**Recommendation: Option A** (Checkout Extensions) — keeps PCI scope entirely within Shopify, better mobile UX, no redirect friction. Fall back to Option B if extension capabilities are insufficient for complex multi-passenger forms.

### Decision 3: Agent Pricing (B2B)

**Options:**
- A. Shopify B2B (requires Shopify Plus) — company accounts, price lists, draft orders
- B. Custom agent accounts with discount codes applied at checkout
- C. Separate Next.js-managed price list stored in database, not using Shopify B2B

**Recommendation: Option A (Shopify Plus B2B)** if budget allows — it handles net pricing, volume discounts, and company accounts natively. If Shopify Plus is not in scope for v1, use Option B with agent-specific automatic discount codes as a stepping stone.

### Decision 4: Search & Filtering

**Options:**
- A. Shopify Storefront Search API — free, integrated, limited faceting
- B. Algolia with Shopify connector — powerful faceting, usage-based cost
- C. Shopify Search & Discovery app — free, configurable filters, sufficient for most catalogs

**Recommendation: Option C** for v1. Upgrade to Algolia when catalog exceeds 5,000 products or search UX becomes a bottleneck.

---

## 6. Project Stack Summary

| Layer | Technology |
|---|---|
| Storefront framework | Next.js 15 (App Router) |
| Hosting | Vercel |
| Commerce engine | Shopify (Headless via Storefront API) |
| Styling | Tailwind CSS |
| UI components | shadcn/ui (customized) |
| i18n | next-intl |
| State | Zustand |
| Auth (B2C) | Shopify Customer Accounts API |
| Auth (B2B) | Shopify B2B (Plus) |
| Search | Shopify Search & Discovery → Algolia (v2) |
| Payments | Shopify Payments + Alipay + WeChat Pay |
| PDF generation | @react-pdf/renderer (Vercel Serverless) |
| Exchange rates | Open Exchange Rates API → Vercel KV cache |
| Database (custom inventory) | Vercel Postgres (if needed for Option B inventory) |
| Email (transactional) | Shopify Email + SendGrid for custom templates |
| Analytics | Shopify Analytics + Vercel Analytics |
| CMS (banners/content) | Shopify Metaobjects (no separate CMS needed for v1) |

---

## 7. Phased Delivery Plan

### Phase 1 — Foundation (weeks 1–6)
- Shopify store setup: product schema, metafield/metaobject definitions, collections
- Next.js project scaffold: App Router, i18n (zh-CN + en), Tailwind, Shopify Storefront API integration
- Homepage with category tabs (static content)
- Product detail page: gallery, metadata, calendar (basic), tabs, itinerary renderer
- Native Shopify checkout (basic — no passenger form yet)
- B2C customer accounts (login, order history)

### Phase 2 — Full Booking Flow (weeks 7–10)
- Departure calendar with live pricing and inventory
- Party-size pricing panel with add-on selection
- Pickup/dropoff location selector
- Passenger information form (Checkout Extension or pre-checkout page)
- Order summary review page
- Manual-confirmation status flow
- Cancellation policy display + self-service cancel

### Phase 3 — Agent Portal (weeks 11–14)
- Agent registration + admin approval workflow
- Agent login and dashboard
- Net-rate pricing (Shopify B2B price lists)
- Quick search by tour code
- Bulk passenger entry
- Booking reports export (CSV)
- Agent share links with referral tracking

### Phase 4 — Commerce & Growth (weeks 15–18)
- Multi-currency with live exchange rates
- Alipay + WeChat Pay integration
- PDF export (tour detail + booking confirmation)
- Promotional banners and flash-sale countdown
- Buy-2-Get-2 and discount campaign configuration
- Advanced search with faceted filters
- Shopify Flow automations (operator alerts, status emails)

### Phase 5 — Optimization (post-launch)
- Performance tuning (ISR, Edge caching for PDPs)
- SEO: JSON-LD structured data for tour products
- Algolia upgrade for search
- A/B testing on booking flow
- Analytics dashboards for operators

---

## 8. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Shopify variant limit (2,000/product) hit by long-running tours | Medium | High | Use seasonal product splitting or custom inventory service from Phase 1 |
| Alipay/WeChat Pay approval timeline | High | Medium | Start payment provider onboarding in week 1; use Stripe only for MVP if delayed |
| Shopify Plus cost for B2B features | Medium | Medium | Phase B2B to Phase 3 and decide on Plus vs. discount-code workaround after Phase 1 revenue projection |
| Checkout Extension limitation for complex passenger forms | Low | High | Prototype the passenger form in Checkout Extension in Phase 1 spike; fall back to pre-checkout page if blocked |
| Metafield query performance for large catalogs | Low | Medium | Use Shopify's indexed metafield queries; add Redis cache layer if needed |
