/**
 * Shopify store setup script.
 * Creates collections and test products for local development.
 * Run: node scripts/setup-shopify.mjs
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// Parse .env.local
const envText = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
const env = {}
for (const line of envText.split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const idx = t.indexOf('=')
  if (idx === -1) continue
  env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim()
}

const DOMAIN = env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const TOKEN = env.SHOPIFY_ADMIN_ACCESS_TOKEN
const API = `https://${DOMAIN}/admin/api/2026-01`
const HEADERS = { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN }

if (!DOMAIN || !TOKEN) {
  console.error('Missing NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN in .env.local')
  process.exit(1)
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

async function shopifyGet(path) {
  await wait(300)
  const res = await fetch(`${API}${path}`, { headers: HEADERS })
  const json = await res.json()
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}: ${JSON.stringify(json.errors ?? json)}`)
  return json
}

async function shopifyPost(path, body) {
  await wait(600) // stay well under rate limit
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}: ${JSON.stringify(json.errors ?? json)}`)
  return json
}

// ─── Collections ────────────────────────────────────────────────────────────

const COLLECTION_DEFS = [
  { handle: 'hot-seasonal-east-us',        title: '当季热销 · 美东 / Hot Picks East US' },
  { handle: 'hot-seasonal-west-us',        title: '当季热销 · 美西 / Hot Picks West US' },
  { handle: 'hot-seasonal-canada',         title: '当季热销 · 加拿大 / Hot Picks Canada' },
  { handle: 'promotion-buy2get2',          title: '买二送二 / Buy 2 Get 2' },
  { handle: 'world-cup-2026',              title: '2026 World Cup Tours / 世界杯专线' },
  { handle: 'day-trips-new-york',          title: '边边游 · 纽约 / Day Trips New York' },
  { handle: 'day-trips-los-angeles',       title: '边边游 · 洛杉矶 / Day Trips Los Angeles' },
  { handle: 'premium-small-groups',        title: '就是精品 / Premium Small Groups' },
  { handle: 'boutique-tours',              title: '精品小团 / Boutique Groups' },
  { handle: 'film-tv-tours-east',          title: '影视之旅 · 东岸 / Film & TV Tours East' },
  { handle: 'film-tv-tours-west',          title: '影视之旅 · 西岸 / Film & TV Tours West' },
  { handle: 'yellowstone-national-park',   title: '国家公园 · 黄石 / Yellowstone' },
]

// ─── Products ───────────────────────────────────────────────────────────────

const mkVariants = (prices, skuBase) =>
  Object.entries(prices).map(([label, price], i) => ({
    option1: label,
    price: price.toFixed(2),
    sku: `${skuBase}-${i + 1}P`,
  }))

const PRODUCT_DEFS = [
  {
    collections: ['hot-seasonal-west-us', 'yellowstone-national-park'],
    product: {
      title: 'Grand Teton + Yellowstone 3-Day Tour (大提顿+黄石3日游)',
      handle: 'grand-teton-yellowstone-3day-y3',
      body_html: '<p>Explore 15 must-see attractions across Grand Teton and Yellowstone. Bilingual guide. Departs Salt Lake City.</p>',
      vendor: 'GlobalTours',
      product_type: 'group-tour',
      tags: 'departure:salt-lake-city,region:west-us,tier:silver,category:national-park,booking:manual,tour-code:Y3,hot-seasonal',
      variants: mkVariants({ '1 Person': 718, '2 Persons': 488, '3 Persons': 448, '4 Persons': 408 }, 'Y3'),
    },
  },
  {
    collections: ['hot-seasonal-west-us', 'yellowstone-national-park'],
    product: {
      title: 'Grand Canyon + Antelope Canyon 3-Day Tour (大峡谷+羚羊峡谷3日游)',
      handle: 'grand-canyon-antelope-3day-gc1',
      body_html: '<p>Marvel at the Grand Canyon South Rim and magical Antelope Canyon slot canyons. Departs Las Vegas.</p>',
      vendor: 'GlobalTours',
      product_type: 'group-tour',
      tags: 'departure:las-vegas,region:west-us,tier:gold,category:national-park,booking:manual,tour-code:GC1,hot-seasonal',
      variants: mkVariants({ '1 Person': 628, '2 Persons': 428, '3 Persons': 388, '4 Persons': 358 }, 'GC1'),
    },
  },
  {
    collections: ['hot-seasonal-east-us', 'day-trips-new-york', 'promotion-buy2get2'],
    product: {
      title: 'Niagara Falls Day Trip from New York (尼亚加拉瀑布一日游)',
      handle: 'niagara-falls-day-trip-nf1',
      body_html: '<p>Experience the majestic Niagara Falls on this full-day tour from NYC. Boat cruise included.</p>',
      vendor: 'GlobalTours',
      product_type: 'day-trip',
      tags: 'departure:new-york,region:east-us,tier:silver,category:day-trip,booking:instant,tour-code:NF1,hot-seasonal',
      variants: mkVariants({ '1 Person': 168, '2 Persons': 148, '3 Persons': 138, '4 Persons': 128 }, 'NF1'),
    },
  },
  {
    collections: ['hot-seasonal-east-us', 'day-trips-new-york'],
    product: {
      title: 'Philadelphia + Washington DC Day Trip from NYC (费城+华盛顿一日游)',
      handle: 'philly-dc-day-trip-pd1',
      body_html: '<p>Visit the Liberty Bell, Independence Hall, and the US Capitol on this dual-city day tour departing New York.</p>',
      vendor: 'GlobalTours',
      product_type: 'day-trip',
      tags: 'departure:new-york,region:east-us,tier:silver,category:day-trip,booking:instant,tour-code:PD1',
      variants: mkVariants({ '1 Person': 148, '2 Persons': 128, '3 Persons': 118, '4 Persons': 108 }, 'PD1'),
    },
  },
  {
    collections: ['day-trips-los-angeles'],
    product: {
      title: 'Las Vegas Day Trip from Los Angeles (拉斯维加斯一日游)',
      handle: 'las-vegas-day-trip-lv1',
      body_html: '<p>Experience the dazzling Las Vegas Strip on this exciting day tour departing Los Angeles.</p>',
      vendor: 'GlobalTours',
      product_type: 'day-trip',
      tags: 'departure:los-angeles,region:west-us,tier:gold,category:day-trip,booking:instant,tour-code:LV1',
      variants: mkVariants({ '1 Person': 138, '2 Persons': 118, '3 Persons': 108, '4 Persons': 98 }, 'LV1'),
    },
  },
  {
    collections: ['day-trips-los-angeles'],
    product: {
      title: 'Grand Canyon South Rim Day Trip from LA (大峡谷一日游·洛杉矶出发)',
      handle: 'grand-canyon-day-trip-la-gc2',
      body_html: '<p>Full-day visit to the Grand Canyon South Rim departing Los Angeles. Includes guided walk and IMAX film.</p>',
      vendor: 'GlobalTours',
      product_type: 'day-trip',
      tags: 'departure:los-angeles,region:west-us,tier:silver,category:day-trip,booking:instant,tour-code:GC2',
      variants: mkVariants({ '1 Person': 178, '2 Persons': 158, '3 Persons': 148, '4 Persons': 138 }, 'GC2'),
    },
  },
  {
    collections: ['premium-small-groups', 'yellowstone-national-park'],
    product: {
      title: 'Premium Yellowstone + Grand Teton 5-Day Small Group (精品黄石小团5日游)',
      handle: 'premium-yellowstone-5day-ps1',
      body_html: '<p>Exclusive small-group luxury experience. Max 8 guests. Private vehicle, gourmet meals, and luxury lodging included.</p>',
      vendor: 'GlobalTours',
      product_type: 'small-group',
      tags: 'departure:salt-lake-city,region:west-us,tier:premium,category:premium,booking:manual,tour-code:PS1',
      variants: mkVariants({ '2 Persons': 1288, '3 Persons': 988, '4 Persons': 888 }, 'PS1'),
    },
  },
  {
    collections: ['world-cup-2026', 'hot-seasonal-canada'],
    product: {
      title: '2026 World Cup Canada – Vancouver Package (世界杯加拿大温哥华套餐)',
      handle: 'world-cup-2026-vancouver-wc1',
      body_html: '<p>Watch the 2026 FIFA World Cup group-stage matches in Vancouver. Package: match tickets + 3-night hotel + city tour.</p>',
      vendor: 'GlobalTours',
      product_type: 'group-tour',
      tags: 'departure:vancouver,region:canada,tier:gold,category:world-event,booking:manual,tour-code:WC1',
      variants: mkVariants({ '1 Person': 2888, '2 Persons': 2488 }, 'WC1'),
    },
  },
  {
    collections: ['boutique-tours', 'hot-seasonal-canada'],
    product: {
      title: 'Boutique Alaska Glacier Tour 7-Day (精品阿拉斯加冰川7日游)',
      handle: 'boutique-alaska-glacier-7day-btq1',
      body_html: '<p>Premium small-group exploration of Alaska glaciers, fjords, and wildlife. Max 10 guests. Seaplane excursion included.</p>',
      vendor: 'GlobalTours',
      product_type: 'small-group',
      tags: 'departure:anchorage,region:canada,tier:premium,category:small-group,booking:manual,tour-code:BTQ1',
      variants: mkVariants({ '2 Persons': 3288, '3 Persons': 2888, '4 Persons': 2488 }, 'BTQ1'),
    },
  },
  {
    collections: ['film-tv-tours-east', 'hot-seasonal-east-us'],
    product: {
      title: 'New York Film & TV Locations Tour (纽约影视打卡一日游)',
      handle: 'ny-film-tv-locations-ft1',
      body_html: '<p>Visit filming locations from Friends, Seinfeld, Spider-Man, and more. Perfect for film fans exploring NYC.</p>',
      vendor: 'GlobalTours',
      product_type: 'day-trip',
      tags: 'departure:new-york,region:east-us,tier:silver,category:themed,booking:instant,tour-code:FT1',
      variants: mkVariants({ '1 Person': 128, '2 Persons': 108, '3 Persons': 98, '4 Persons': 88 }, 'FT1'),
    },
  },
  {
    collections: ['film-tv-tours-west', 'hot-seasonal-west-us'],
    product: {
      title: 'Los Angeles Film & TV Studios Tour (洛杉矶影视城一日游)',
      handle: 'la-film-studios-tour-ft2',
      body_html: '<p>Behind-the-scenes access to Universal Studios and the Warner Bros. lot. See real TV and movie sets.</p>',
      vendor: 'GlobalTours',
      product_type: 'day-trip',
      tags: 'departure:los-angeles,region:west-us,tier:gold,category:themed,booking:instant,tour-code:FT2',
      variants: mkVariants({ '1 Person': 158, '2 Persons': 138, '3 Persons': 128, '4 Persons': 118 }, 'FT2'),
    },
  },
]

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🏪 Setting up Shopify store: ${DOMAIN}\n`)

  // Step 1: Fetch existing collections, create any missing ones
  console.log('━━━ Collections ━━━')
  const collectionIds = {}

  // Fetch all existing custom collections (up to 250)
  const { custom_collections: existing } = await shopifyGet('/custom_collections.json?limit=250')
  for (const c of existing) collectionIds[c.handle] = c.id

  for (const def of COLLECTION_DEFS) {
    if (collectionIds[def.handle]) {
      console.log(`  ↩ ${def.handle}  (existing id: ${collectionIds[def.handle]})`)
      continue
    }
    try {
      const { custom_collection } = await shopifyPost('/custom_collections.json', { custom_collection: def })
      collectionIds[def.handle] = custom_collection.id
      console.log(`  ✓ ${def.handle}  (id: ${custom_collection.id})`)
    } catch (err) {
      console.error(`  ✗ ${def.handle}: ${err.message}`)
    }
  }

  // Step 2: Create products and link to collections
  // Fetch existing products by handle to avoid duplicates
  const { products: existingProducts } = await shopifyGet('/products.json?limit=250&fields=id,handle')
  const existingHandles = new Set(existingProducts.map((p) => p.handle))

  console.log('\n━━━ Products ━━━')
  for (const { product: productData, collections } of PRODUCT_DEFS) {
    if (existingHandles.has(productData.handle)) {
      // Product exists — still ensure it's linked to the right collections
      const existing = existingProducts.find((p) => p.handle === productData.handle)
      const code = productData.tags.match(/tour-code:(\w+)/)?.[1] ?? '??'
      console.log(`  ↩ [${code}] ${productData.title.slice(0, 55)} (exists — linking collections)`)
      for (const handle of collections) {
        const collectionId = collectionIds[handle]
        if (!collectionId) continue
        try {
          await shopifyPost('/collects.json', { collect: { product_id: existing.id, collection_id: collectionId } })
          console.log(`      → ${handle}`)
        } catch {
          // already collected — ignore
        }
      }
      continue
    }

    // Shopify requires options + option1 on variants (not variant.title)
    const payload = { ...productData, options: [{ name: 'Party Size' }] }

    let product
    try {
      ;({ product } = await shopifyPost('/products.json', { product: payload }))
      console.log(`  ✓ [${productData.tags.match(/tour-code:(\w+)/)?.[1] ?? '??'}] ${productData.title.slice(0, 60)}`)
    } catch (err) {
      console.error(`  ✗ ${productData.handle}: ${err.message}`)
      continue
    }

    for (const handle of collections) {
      const collectionId = collectionIds[handle]
      if (!collectionId) { console.warn(`      ⚠ Unknown collection: ${handle}`); continue }
      try {
        await shopifyPost('/collects.json', { collect: { product_id: product.id, collection_id: collectionId } })
        console.log(`      → ${handle}`)
      } catch (err) {
        console.error(`      ✗ collect ${handle}: ${err.message}`)
      }
    }
  }

  console.log('\n✅ Done! Collections and products are live in your Shopify store.\n')
}

main().catch((err) => { console.error(err); process.exit(1) })
