# Test Case Outlines — GlobalTours

> Tooling recommendations: **Vitest** for unit/integration, **Playwright** for E2E.
> Run unit tests with `pnpm test`, E2E with `pnpm test:e2e`.

---

## Phase 1

### Task 1 — Shopify BFF API Routes

**Unit: `src/lib/shopify/client.ts`**
- Returns a configured storefront client when env vars are present
- Throws a descriptive error when `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` is missing
- Uses `privateAccessToken` (not public token) for all requests

**Integration: `GET /api/shopify/collections/[handle]`**
- Returns 200 + product array for a valid collection handle
- Returns 404 when the collection handle does not exist on Shopify
- Returns 500 when Shopify credentials are invalid
- Response shape includes `id`, `title`, `handle`, `priceRange`, `images`

**Integration: `GET /api/shopify/products/[handle]`**
- Returns 200 + product object for a valid product handle
- Returns 404 for an unknown handle
- Filters out internal tags (e.g. `booking:instant`, `tour-code:*`) from the response

---

### Task 2 — Homepage: CategoryTabs + ProductCard

**Unit: CategoryTabs**
- Renders the first tab as active on mount
- Clicking a different tab triggers a fetch to the correct BFF route
- Displays a loading state while fetching tab data
- Displays an error message when the BFF fetch fails

**Unit: ProductCard**
- Renders product title, price, and image
- `priceRange.minVariantPrice` is formatted with the correct currency symbol
- Internal tags are stripped; display tags show only the label portion (after `:`)
- "Book Now" link points to `/[locale]/tours/[handle]`

**E2E: Homepage**
- Page loads with the default tab pre-populated (SSR data, no loading flash)
- Clicking a category tab loads new products without a full page reload
- Each product card is clickable and navigates to the correct PDP

---

### Task 3 — Product Detail Page (PDP)

**Unit: `PRODUCT_QUERY`**
- Query returns title, description, variants, images, and tags
- Metafields are not requested (no `$metafieldKeys` variable)

**Unit: TourBookingPanel**
- "Select Date" dropdown renders available departure dates from variants
- "Select Party Size" updates the selected variant and displayed price
- Price updates when variant selection changes
- "Add to Cart" is disabled when no date or party size is selected
- "Add to Cart" is enabled and calls `addItem()` with correct payload when fully selected

**E2E: PDP**
- Navigating to `/[locale]/tours/[handle]` renders product title and description
- Selecting a date and party size updates the displayed total price
- Clicking "Add to Cart" adds the item and increments the cart icon badge
- "Back to Tours" link returns to `/[locale]/tours`
- Visiting an invalid handle shows the not-found page

---

### Task 4 — Cart Page + CartIcon

**Unit: cart store (`src/store/cart.ts`)**
- `addItem()` adds a new item with correct fields including `currencyCode`
- `addItem()` with an existing variant ID increases quantity
- `removeItem()` removes the correct item by variant ID
- `clearCart()` empties the items array
- Total is calculated as sum of `pricePerPerson × quantity`
- Store persists to localStorage via Zustand `persist` middleware

**Unit: CartIcon**
- Shows no badge when cart is empty
- Shows correct item count badge after items are added
- Badge updates reactively without page reload

**E2E: Cart page**
- Empty cart shows empty state message
- Adding a tour from PDP appears on the cart page with correct title, variant, and price
- Removing an item from the cart updates the total
- "Proceed to Checkout" button is disabled when cart is empty
- Currency is displayed from `item.currencyCode`, not hardcoded

---

### Task 5 — Tours Listing Page

**Unit: filtering logic**
- "All" filter shows all products
- "Group Tour" filter shows only products with `productType === 'Group Tour'`
- "Day Trip" filter shows only day trip products
- "Small Group" filter shows only small group products
- Combining type filter + search query ANDs both conditions

**Unit: search**
- Searching "victoria" returns products whose title includes "Victoria" (case-insensitive)
- Searching a string with no matches shows the "No tours found" empty state
- Search is debounced — rapid keystrokes do not trigger multiple re-renders per character

**E2E: Tours page**
- `/[locale]/tours` renders a grid of product cards
- Type filter buttons update the displayed products without page reload
- Searching in the text field filters results within 300 ms
- Clicking a product card navigates to the correct PDP

---

### Task 6 — Mobile Menu

**Unit: MobileMenu**
- Panel is hidden (`-translate-x-full`) on initial render
- Clicking the hamburger button opens the panel (`translate-x-0`)
- Clicking the backdrop closes the panel
- Panel closes automatically when the route changes (pathname change via `usePathname`)
- Panel has `aria-hidden="true"` when closed

**E2E: Mobile menu (viewport ≤ 768 px)**
- Hamburger button is visible, desktop nav is hidden
- Menu opens and shows Tours, About links
- Clicking a nav link navigates and closes the menu

---

### Task 7 — About / Login / Agent Pages

**Unit: About page**
- Renders mission statement, three feature cards, and "Browse Tours" CTA
- Feature card titles and descriptions come from i18n, not hardcoded strings
- "Browse Tours" CTA links to `/[locale]/tours`

**Unit: Login page (stub)**
- Page renders without throwing
- Contains a heading or CTA that references login

---

### Task 8 — SEO Metadata

**Unit: `generateMetadata` — homepage**
- Returns `title` matching the i18n `meta.homeTitle` key for each locale
- Returns `description` from `meta.homeDesc`

**Unit: `generateMetadata` — PDP**
- Returns product title as page title
- Returns product description truncated to a reasonable length
- Returns OG image from the first product image URL
- Returns empty object (no throw) when the product handle is invalid

**Unit: Root layout metadata**
- Title template is `'%s | GlobalTours'`
- Child pages use the template; intermediate layouts do not override it

---

### Task 9 — Loading Skeletons + Error / Not-Found Pages

**Unit: Tours loading skeleton**
- Renders the same grid column structure as the real tours page
- Contains `animate-pulse` elements with correct aspect ratios

**Unit: error.tsx**
- Renders a user-friendly error message
- Calls `console.error(error)` via `useEffect`
- "Try again" button calls the `reset()` prop

**Unit: not-found.tsx (global)**
- Renders a 404 message
- Contains a link back to the default locale home (e.g. `/zh-CN`)

**E2E**
- Visiting `/[locale]/tours/nonexistent-handle` shows the not-found UI
- A page that throws a runtime error shows the error boundary UI with a reset button

---

### Task 11 — Shopify Checkout Integration

**Unit: `POST /api/checkout`**
- Calls `cartCreate` mutation with correct `lines` array
- Sets `quantity: 1` per line item regardless of party size
- Attaches `Departure Date`, `Party Size`, `Pickup Location` as custom attributes
- Returns `{ checkoutUrl }` on success
- Returns 422 when Shopify `userErrors` is non-empty
- Returns 502 when Shopify transport errors occur

**Unit: CheckoutButton**
- Calls `POST /api/checkout` with current cart items on click
- Shows a loading state while the request is in flight
- Redirects to `checkoutUrl` on success via `window.location.href`
- Shows an error toast/message on failure

**E2E: Checkout flow**
- Adding a tour and clicking "Proceed to Checkout" redirects to Shopify checkout URL
- URL includes the correct store domain

---

### Task 12 — Footer + currencyCode Fix

**Unit: Footer**
- Renders locale-aware nav links using the `locale` prop
- Does not call `useLocale()` (server component — uses prop instead)
- All link hrefs start with `/${locale}/`

**Unit: currencyCode propagation**
- `CartItem.currencyCode` is set from `selectedVariant.price.currencyCode`
- Cart total row displays currency from `items[0]?.currencyCode`
- No hardcoded `'CAD'` string in cart display components

---

### Task 13 — Tours Search + PDP Back-link

**Unit: search debounce**
- Input value updates immediately on each keystroke
- `searchQuery` (used for filtering) updates after 200 ms of no input
- Rapid typing cancels previous timers (only one filter update fires)

**Unit: PDP back-link**
- "Back to Tours" link renders with `href="/[locale]/tours"`
- Link is visible above the product title

---

## Phase 2 (In Progress)

### Task 2-2 — My Bookings Page

**Unit: `getOrdersByEmail(email)`**
- Returns an array of `Order` objects for a known email
- Returns an empty array when the email has no orders
- Throws when `SHOPIFY_ADMIN_ACCESS_TOKEN` is missing
- Maps `totalPriceSet.shopMoney` → `order.total` correctly

**Unit: BookingsList**
- Renders empty state when `orders` is an empty array
- Renders an error message when `error` prop is non-null
- Displays order name, date (locale-formatted), total, and financial status badge
- "View Order Details" link opens `order.statusUrl` in a new tab
- Financial status badge uses correct colour class (green for PAID, yellow for PENDING, etc.)

**E2E: Bookings page**
- Unauthenticated visit to `/[locale]/bookings` redirects to `/[locale]/login`
- Authenticated user with no orders sees the empty state
- Authenticated user with orders sees a list of order cards

---

### Task 2-3 — Agent Portal

**Unit: AgentDashboard**
- Renders three discount tier cards with tier label, range, and percentage
- Renders three "How to Book" steps in order
- Account manager section shows email as a `mailto:` link
- "Coming Soon" section renders three feature placeholders

**Unit: AgentAccessDenied**
- Renders access denied title and description
- "Contact Account Manager" button links to `mailto:[managerEmail]`

**E2E: Agent portal**
- Unauthenticated visit redirects to `/[locale]/login`
- Authenticated user without `role: agent` sees the access denied page
- Authenticated user with `publicMetadata.role === 'agent'` sees the dashboard

---

### Task 2-1 — Proxy (Middleware)

**Unit: route protection**
- `/[locale]/agent` without auth → 307 redirect to `/[locale]/login`
- `/[locale]/bookings` without auth → 307 redirect to `/[locale]/login`
- `/[locale]/tours` without auth → 200 (public route)
- `/api/*` routes are excluded from proxy entirely

**Unit: i18n locale routing**
- `/` redirects to the default locale path (e.g. `/zh-CN`)
- `/tours` redirects to `/zh-CN/tours`
- Static files (`_next/static`, `favicon.ico`) bypass the proxy

---

## i18n Cross-Cutting

- All user-facing strings use i18n keys — no hardcoded English/Chinese text in components
- All three locales (`en`, `zh-CN`, `zh-TW`) have complete message files with no missing keys
- Locale switcher changes the URL prefix and re-renders page content in the new locale
- `generateMetadata` passes `locale` explicitly to `getTranslations` (not relying on request context)
