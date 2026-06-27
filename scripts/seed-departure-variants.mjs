/**
 * Seed departure variants for a tour product in Shopify.
 *
 * Creates the product if it does not exist; adds any missing departure × party-size
 * variants. Idempotent: re-running skips departure dates that already have variants.
 *
 * Usage:
 *   node scripts/seed-departure-variants.mjs
 *   node scripts/seed-departure-variants.mjs --handle my-other-tour
 *
 * Config: scripts/seed-data/departures.json
 * Env:    .env.local (NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_ACCESS_TOKEN)
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// ── Env ──────────────────────────────────────────────────────────────────────

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
  console.error('❌ Missing NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN in .env.local')
  process.exit(1)
}

// ── Config ────────────────────────────────────────────────────────────────────

const config = JSON.parse(
  readFileSync(resolve(process.cwd(), 'scripts/seed-data/departures.json'), 'utf-8'),
)
const handleArgIdx = process.argv.indexOf('--handle')
const handle = handleArgIdx !== -1 ? process.argv[handleArgIdx + 1] : config.productHandle

const PARTY_SIZES = ['1 Person', '2 Persons', '3 Persons', '4 Persons']

// ── HTTP helpers ──────────────────────────────────────────────────────────────

const wait = ms => new Promise(r => setTimeout(r, ms))

async function shopifyGet(path) {
  await wait(300)
  const res = await fetch(`${API}${path}`, { headers: HEADERS })
  const json = await res.json()
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}: ${JSON.stringify(json.errors ?? json)}`)
  return json
}

async function shopifyPost(path, body) {
  await wait(600)
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}: ${JSON.stringify(json.errors ?? json)}`)
  return json
}

// ── Inventory ─────────────────────────────────────────────────────────────────

async function getLocationId() {
  const { locations } = await shopifyGet('/locations.json')
  if (!locations?.length) throw new Error('No locations found in Shopify store')
  return locations[0].id
}

async function setInventory(locationId, inventoryItemId, available) {
  await shopifyPost('/inventory_levels/set.json', {
    location_id: locationId,
    inventory_item_id: inventoryItemId,
    available,
  })
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚀 Seeding: ${handle}`)

  const locationId = await getLocationId()
  console.log(`✓ Location ID: ${locationId}`)

  // 1. Check for existing product
  const { products } = await shopifyGet(
    `/products.json?handle=${handle}&fields=id,handle,variants,options`,
  )
  let product = products?.[0] ?? null

  if (!product) {
    // 2a. Create product with all departure × party-size variants in one call
    console.log('  Creating product...')
    const allVariants = config.departures.flatMap(dep =>
      PARTY_SIZES.map(ps => ({
        option1: dep.date,
        option2: ps,
        price: dep.prices[ps],
        inventory_management: 'shopify',
        inventory_quantity: 0, // overridden below via inventory_levels/set
      })),
    )

    const { product: created } = await shopifyPost('/products.json', {
      product: {
        title: config.productTitle,
        handle: config.productHandle,
        product_type: config.productType,
        tags: (config.tags ?? []).join(', '),
        options: [
          { name: 'Departure', position: 1 },
          { name: 'Party Size', position: 2 },
        ],
        variants: allVariants,
        published: false,
      },
    })
    product = created
    console.log(`  ✓ Created product ID: ${product.id}`)

    // Set inventory for every variant
    for (const variant of product.variants) {
      const dep = config.departures.find(d => d.date === variant.option1)
      if (!dep) continue
      await setInventory(locationId, variant.inventory_item_id, dep.inventory)
      console.log(`  ✓ Inventory: ${variant.option1} / ${variant.option2} → ${dep.inventory}`)
    }
  } else {
    // 2b. Add only the missing departure dates
    console.log(`  Found existing product ID: ${product.id}`)
    const existingDates = new Set(product.variants.map(v => v.option1))

    for (const dep of config.departures) {
      if (existingDates.has(dep.date)) {
        console.log(`  ↩ Skip (exists): ${dep.date}`)
        continue
      }
      console.log(`  + Adding: ${dep.date}`)
      for (const ps of PARTY_SIZES) {
        const { variant } = await shopifyPost(`/products/${product.id}/variants.json`, {
          variant: {
            option1: dep.date,
            option2: ps,
            price: dep.prices[ps],
            inventory_management: 'shopify',
          },
        })
        await setInventory(locationId, variant.inventory_item_id, dep.inventory)
        console.log(`    ✓ ${ps} → ${dep.prices[ps]} (qty: ${dep.inventory})`)
      }
    }
  }

  console.log('\n✅ Done!')
  console.log(`  👉 Publish this product to the Headless channel in Shopify Admin:`)
  console.log(`     https://${DOMAIN}/admin/products/${product.id}`)
}

main().catch(e => {
  console.error('\n❌', e.message)
  process.exit(1)
})
