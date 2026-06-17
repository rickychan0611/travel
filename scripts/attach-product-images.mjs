/**
 * Attaches a stock travel photo to each tour product that has no images.
 * Uses the Shopify Admin REST API — Shopify downloads and hosts the image.
 *
 * Run: node scripts/attach-product-images.mjs
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

// Load .env.local manually (no dotenv dependency needed)
function loadEnv() {
  try {
    const raw = readFileSync(resolve(__dir, '../.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const match = line.match(/^([^#=\s]+)\s*=\s*(.*)$/)
      if (match) process.env[match[1]] ??= match[2].replace(/^['"]|['"]$/g, '')
    }
  } catch { /* .env.local not found — rely on process.env */ }
}
loadEnv()

const DOMAIN  = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const TOKEN   = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN
const API     = `https://${DOMAIN}/admin/api/2026-01`

if (!DOMAIN || !TOKEN) {
  console.error('Missing NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Curated photo URLs matched by product handle.
// Source: Unsplash (free to use). Replace any URL with your own if needed.
// ---------------------------------------------------------------------------
const PHOTO_MAP = {
  'grand-canyon-antelope-3day-gc1':   'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=1200&q=80&auto=format&fit=crop',
  'grand-canyon-day-trip-la-gc2':     'https://images.unsplash.com/photo-1527549993586-dff825b37782?w=1200&q=80&auto=format&fit=crop',
  'grand-teton-yellowstone-3day-y3':  'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&q=80&auto=format&fit=crop',
  'premium-yellowstone-5day-ps1':     'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80&auto=format&fit=crop',
  'boutique-alaska-glacier-7day-btq1':'https://images.unsplash.com/photo-1520769945061-0a448c463865?w=1200&q=80&auto=format&fit=crop',
  'niagara-falls-day-trip-nf1':       'https://images.unsplash.com/photo-1489447068241-b3490214e879?w=1200&q=80&auto=format&fit=crop',
  'las-vegas-day-trip-lv1':           'https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=1200&q=80&auto=format&fit=crop',
  'la-film-studios-tour-ft2':         'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=1200&q=80&auto=format&fit=crop',
  'ny-film-tv-locations-ft1':         'https://images.unsplash.com/photo-1496588152823-86ff7695e68f?w=1200&q=80&auto=format&fit=crop',
  'philly-dc-day-trip-pd1':           'https://images.unsplash.com/photo-1617581629397-a72507c3de9e?w=1200&q=80&auto=format&fit=crop',
  'world-cup-2026-vancouver-wc1':     'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=1200&q=80&auto=format&fit=crop',
}

// Fallback: deterministic placeholder for any handle not in the map
function photoUrl(handle) {
  return PHOTO_MAP[handle] ?? `https://picsum.photos/seed/${handle}/1200/675`
}

// ---------------------------------------------------------------------------
async function shopifyGet(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'X-Shopify-Access-Token': TOKEN },
  })
  return res.json()
}

async function shopifyPost(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  return res.json()
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ---------------------------------------------------------------------------
async function main() {
  console.log(`\nFetching products from ${DOMAIN}...\n`)
  const { products } = await shopifyGet('/products.json?limit=250&fields=id,handle,title,images')

  const tourProducts = products.filter(p =>
    Object.keys(PHOTO_MAP).includes(p.handle) ||
    (p.handle.includes('tour') || p.handle.includes('trip') || p.handle.includes('falls') || p.handle.includes('world-cup') || p.handle.includes('boutique') || p.handle.includes('premium') || p.handle.includes('glacier'))
  )

  console.log(`Found ${tourProducts.length} tour products\n`)

  for (const product of tourProducts) {
    if (product.images.length > 0) {
      console.log(`⏭  ${product.handle} — already has ${product.images.length} image(s), skipping`)
      continue
    }

    const src = photoUrl(product.handle)
    process.stdout.write(`📷 ${product.handle} — attaching image... `)

    const result = await shopifyPost(`/products/${product.id}/images.json`, {
      image: { src },
    })

    if (result.image?.id) {
      console.log(`✅ done (image id: ${result.image.id})`)
    } else {
      console.log(`❌ failed`)
      console.error('   Response:', JSON.stringify(result))
    }

    // Stay well within the 2 req/s REST rate limit
    await sleep(600)
  }

  console.log('\nDone. Refresh your Shopify Admin to see the images.')
  console.log('Note: images may take a few seconds to propagate to the Storefront API.\n')
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
