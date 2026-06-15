# Product Requirements Document
# Global Tour Booking Platform

**Version:** 1.0  
**Date:** 2026-06-14  
**Status:** Draft

---

## 1. Executive Summary

This document defines requirements for a new global tour booking platform serving both end-traveler customers (B2C) and travel agents (B2B). The platform is inspired by UV Bookings (uvbookings.toursbms.com), a Chinese-market group-tour system for North America, and expands the concept to support multi-region destinations, multiple languages, and a dual-portal model.

The platform enables tour operators to list and manage structured group-tour products, while travelers and agents can browse, price-check, and book those tours through a modern web storefront.

---

## 2. Target Users

### 2.1 B2C — End Travelers
- Primary demographic: Chinese-speaking travelers (Mainland China, Taiwan, Hong Kong, diaspora)
- Secondary: English-speaking international travelers
- Device split: ~60% mobile, ~40% desktop
- Expectation: intuitive product discovery, transparent per-person pricing, self-service booking with clear cancellation terms

### 2.2 B2B — Travel Agents / Resellers
- Independent travel agents managing bookings on behalf of clients
- Small travel agencies purchasing wholesale tour slots
- Expectation: fast product lookup by tour code, bulk passenger entry, exportable booking confirmations, net-rate pricing visibility

### 2.3 Tour Operators / Admins
- Staff managing product catalog, inventory, pricing, and departure schedules
- Expectation: back-office tools for managing tours, monitoring bookings, and communicating with agents and travelers

---

## 3. Product Vision

A clean, trustworthy booking platform where any traveler or agent in the world can discover structured tour products, see real-time pricing and availability by departure date, and complete a booking in under 5 minutes — in their preferred language and currency.

---

## 4. Core Feature Modules

---

### 4.1 Homepage & Discovery

#### 4.1.1 Hero Section
- Full-width banner with rotating featured promotions (e.g. seasonal campaigns, World Cup packages, buy-2-get-2 deals)
- CTA button linking to featured collection or search

#### 4.1.2 Product Category Browsing
- Horizontal tab navigation grouping products by category type, each with sub-tabs filtering by departure city/region.

**Required top-level categories (extensible):**

| Category Key | Display Name | Sub-filter type |
|---|---|---|
| hot_seasonal | 当季热销 / This Season's Picks | By region (East US, West US, Canada, etc.) |
| promotion | 买二送二 / Buy 2 Get 2 | By border crossing or region |
| world_event | 2026 World Cup Tours | By home country |
| day_trip | 边边游 / Border Day Trips | By departure city |
| premium | 就是精品 / Premium Small Groups | By departure city |
| small_group | 精品小团 / Boutique Groups | By sub-brand / region |
| themed | 影视之旅 / Film & TV Tours | By coast (East/West/Canada) |
| national_park | National Park Tours | By park / departure city |

- Each category section is collapsible (show/hide toggle)
- Product cards display: tour code, short title, badge tags (silver/gold tier), departure city tag
- "See all" link per category navigating to filtered search results

#### 4.1.3 Global Search
- Keyword search bar in header (always visible)
- Filters: departure city, destination region, duration (days), tour type, price range, departure date range
- Results page with sort options: relevance, price (low→high), departure date, popularity

#### 4.1.4 Promotional Banners / Flash Sales
- Configurable banner slots tied to collection tags or discount campaigns
- Support for countdown timers on limited-time promotions

---

### 4.2 Product Detail Page

The product detail page is the conversion centerpiece. It must communicate trust, value, and logistics clearly.

#### 4.2.1 Header Section
- Hero image (primary photo) + thumbnail gallery (4–6 images)
- Product title (Chinese + English bilingual)
- Badge tags: tier label (银榜/金榜/就是精品 or custom), departure city tag, tour type tag
- Product code + map code (e.g. Y3, R0001762)
- Key metadata row:
  - Departure city → Destination city
  - Duration (e.g. 3 days 2 nights / 3天2晚)
  - Group size / min persons
  - Booking confirmation method (instant / manual)
  - Transportation type (bus / car / flight)
  - Attraction highlights (top 3, with "more" expand)

#### 4.2.2 Date & Availability Calendar
- Monthly calendar view showing all available departure dates
- Per-date price displayed on calendar cells (base price per person at lowest sharing tier)
- Color coding: available / limited / sold out / not operating
- Selected date highlights in accent color
- Date selector syncs with pricing section below

#### 4.2.3 Pickup & Dropoff Locations
- Pickup location list with departure time and address per option (searchable)
- Dropoff location list with address
- "View more" expand for long lists

#### 4.2.4 Pricing Panel
- Date selector (syncs with calendar above)
- Inventory status indicator: 充足 (Available) / 紧张 (Limited) / 售罄 (Sold out)
- Currency switcher (USD / CAD / CNY / EUR / AUD, etc.)
- **Party-size tiered pricing table:**
  - 单人入住 / 1 person sharing: $X/person
  - 两人入住 / 2 persons sharing: $X/person
  - 三人入住 / 3 persons sharing: $X/person
  - 四人入住 / 4 persons sharing: $X/person
  - (Additional tiers configurable per product)
- Total price auto-calculated when user selects party size + passenger count

#### 4.2.5 Value-Added Services (Add-ons)
- Table of optional/mandatory add-on services:
  - Name, applicable group (all / adult / child), description, price per unit
- Mandatory fees clearly marked and auto-added to total
- Optional items with checkbox selection

#### 4.2.6 Departure Schedule Grid
- List of operating date ranges with days-of-week (e.g. Mon/Tue/Fri/Sun)
- Special one-off dates clearly listed
- Minimum group size for guaranteed departure

#### 4.2.7 Export / Print / Send
- Export tour details as PDF
- Print-friendly layout
- Send tour summary via email or share link

#### 4.2.8 Tabbed Content Section
Four fixed tabs, content managed by operator:

**Tab 1 — 产品特色 / Product Highlights**
- Bullet-point tour selling points
- What makes this tour unique

**Tab 2 — 费用说明 / Cost Breakdown**
- Included in price (e.g. coach, bilingual guide, hotels)
- Not included (e.g. meals, personal expenses, service fee)
- Optional items table (name, days included, price, description)

**Tab 3 — 行程介绍 / Day-by-Day Itinerary**
- Each day: day number + date-agnostic label + location route (City A → Park B → City C)
- Time slots: 全天 (full day) / 上午 / 下午 / 晚上
- Activity icons (mountain, hotel, transport)
- Attraction descriptions (expandable)
- Evening accommodation: hotel name + grade
- Expandable/collapsible days

**Tab 4 — 协议&须知 / Terms & Notices**
- Booking restrictions (age, ID requirements)
- Cancellation policy table:
  - Days before departure → penalty % of booking price
- General travel notes (special travel advisories, park fee notices)
- Booking notices (minor policy, hotel room types, park ticket policy, medical restrictions)

---

### 4.3 Booking Flow

#### 4.3.1 Booking Initiation
- "Book Now" / "确认出行" CTA on product detail page
- Requires user to select: departure date, party size, pickup location, add-ons
- Guest checkout allowed; account creation prompted post-booking

#### 4.3.2 Passenger Information Form
For each passenger:
- Full name (as on passport)
- Gender
- Date of birth
- Passport / ID number (optional, configurable per product)
- Contact: mobile number, email (lead passenger only)
- Special requests / notes field

#### 4.3.3 Order Summary & Review
- Itemized price breakdown:
  - Base tour price × party size
  - Mandatory add-ons
  - Selected optional add-ons
  - Subtotal / taxes / service fees
- Selected date, pickup location, passenger names
- Cancellation policy reminder

#### 4.3.4 Payment
- Supported payment methods:
  - Credit/debit card (Visa, Mastercard, Amex) via Stripe
  - Alipay (for CNY-denominated bookings)
  - WeChat Pay (for CNY-denominated bookings)
  - PayPal
  - Pay later / deposit (configurable per product: full payment or X% deposit)
- Multi-currency checkout matching currency switcher selection

#### 4.3.5 Confirmation
- Booking confirmation number generated
- Confirmation email sent to lead passenger (bilingual)
- For manual-confirmation products: "Pending Confirmation" status shown; operator reviews and confirms within defined SLA (e.g. 24h)
- Booking status page: Confirmed / Pending / Cancelled

---

### 4.4 Customer Account (B2C Portal)

#### 4.4.1 Registration & Login
- Email + password registration
- Social login: WeChat, Google, Apple
- SMS verification (China mobile numbers supported)

#### 4.4.2 My Bookings
- List of past and upcoming bookings
- Booking detail view (matches order summary)
- Booking status (Confirmed / Pending / Cancelled / Completed)
- Cancel booking action (within policy window)
- Download confirmation PDF

#### 4.4.3 Wishlist / Saved Tours
- Save product to wishlist for later
- Wishlist displayed on account dashboard

#### 4.4.4 Profile
- Saved passenger profiles (pre-fill on future bookings)
- Preferred currency and language
- Contact info management

---

### 4.5 Agent Portal (B2B)

#### 4.5.1 Agent Registration & Approval
- Agent self-registration with company info
- Admin approval workflow before portal access is granted
- Agent tier assignment (affects net rate visibility)

#### 4.5.2 Agent Pricing
- Agents see net rates (wholesale price) instead of retail pricing
- Agent-specific markup configurable by operator
- Commission rate displayed per product

#### 4.5.3 Quick Search by Tour Code
- Search bar accepting product code (e.g. "Y3", "BBY-NL1")
- Instant product lookup with date/price matrix

#### 4.5.4 Booking on Behalf of Clients
- Multi-passenger entry form (bulk paste or CSV import)
- Ability to book multiple products in a single session
- Agent reference number field

#### 4.5.5 Agent Dashboard
- Bookings placed by the agent
- Pending / confirmed / cancelled breakdown
- Revenue summary (month / year)
- Download booking reports (CSV / Excel)

#### 4.5.6 Export & Share
- Export full product details (PDF / printable) to share with clients
- Share product link with pre-filled agent code for commission tracking

---

### 4.6 Tour Operator / Admin Back-office

#### 4.6.1 Product Management
- Create / edit / archive tour products
- Manage product metadata, images, tabs content
- Set badge tags, departure city tags, category assignments
- Publish / unpublish products

#### 4.6.2 Inventory & Departure Calendar
- Set operating date ranges and days-of-week per product
- Set per-date availability (seat count)
- Block dates / add special one-off dates
- Set minimum group size for guaranteed departure

#### 4.6.3 Pricing Management
- Set party-size tiered pricing per departure date
- Define add-on services (mandatory vs optional, adult/child rates)
- Manage currency exchange rates or use live exchange API
- Create promotional pricing / discount campaigns

#### 4.6.4 Order Management
- View all incoming bookings
- Manual confirmation workflow (approve / reject pending bookings)
- Passenger manifest view per departure date
- Send operator notes / updates to booked customers

#### 4.6.5 Agent Management
- Approve / reject agent registrations
- Assign agent tier and net rate
- View agent booking history

#### 4.6.6 Reporting & Analytics
- Booking volume by product / date range / region
- Revenue by channel (B2C vs B2B)
- Popular departure dates
- Cancellation rate

---

## 5. Internationalization (i18n)

| Dimension | Requirement |
|---|---|
| Languages | Simplified Chinese (primary), Traditional Chinese, English (minimum v1) |
| Currencies | USD, CAD, CNY, EUR, AUD, HKD (configurable) |
| Date formats | Support both YYYY-MM-DD and region-aware formatting |
| RTL | Not required for v1 |
| Time zones | Display departure dates/times in local tour timezone |

---

## 6. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms |
| Mobile | Responsive-first; all booking flows fully functional on mobile |
| SEO | SSR/SSG for product pages; structured data (JSON-LD) for tours |
| Accessibility | WCAG 2.1 AA for key flows |
| Security | PCI-DSS compliant checkout; HTTPS everywhere; no raw card data stored |
| Availability | 99.9% uptime SLA |
| Scalability | Support catalog of 10,000+ products; 500 concurrent bookings |
| Compliance | GDPR (EU), PIPL (China) data handling where applicable |

---

## 7. Out of Scope (v1)

- Native mobile apps (iOS / Android)
- Live chat / customer support integration
- Loyalty / points reward program
- Custom tour builder / itinerary planner
- Supplier / ground operator sub-portal

---

## 8. Success Metrics

| Metric | Target (6 months post-launch) |
|---|---|
| Booking conversion rate (PDP → confirmed) | ≥ 3.5% |
| Average booking completion time | < 5 minutes |
| B2B agent portal active users | 50+ agencies |
| Mobile booking share | ≥ 55% |
| Product catalog size | 500+ tours |
| System uptime | ≥ 99.9% |

---

## 9. Glossary

| Term | Meaning |
|---|---|
| PDP | Product Detail Page |
| B2C | Business to Consumer (direct traveler) |
| B2B | Business to Business (travel agent) |
| Party-size pricing | Per-person price that varies by how many people share a room |
| Manual confirmation | Operator must review and approve booking before it is confirmed |
| Add-on | Optional or mandatory extra service attached to a tour booking |
| Departure date | The calendar date a specific tour group departs |
| Tour code | Short alphanumeric identifier for a product (e.g. Y3, BBY-NL1) |
