import { promises as fs } from 'fs'
import path from 'path'
import { SHOPIFY_CACHE_REVALIDATE_SECONDS } from '@/lib/shopify/cache'
import type { TourDetailData } from './types'

const PRODUCTS_DIR = path.join(process.cwd(), 'data', 'toursbms-products')
const SHOPIFY_SYNC_DIR = path.join(process.cwd(), 'data', 'shopify-sync')
const MEMORY_CACHE_TTL_MS = SHOPIFY_CACHE_REVALIDATE_SECONDS * 1000

const tourDetailMemoryCache = new Map<
  string,
  {
    expiresAt: number
    value: Promise<TourDetailData | null>
  }
>()

function normalizeKey(value: string) {
  return value.trim().toLowerCase()
}

function extractProductCode(handle: string): string | null {
  const match = normalizeKey(handle).match(/p\d{5,}/i)
  return match ? match[0].toUpperCase() : null
}

type ShopifySyncManifest = {
  productCode?: string
  handle?: string
  shopifyProductId?: string
  variants?: Array<{
    date?: string
    priceType?: number
    shopifyVariantId?: string | null
    sku?: string
  }>
  addons?: Array<{
    code?: string
    shopifyVariantId?: string | null
    sku?: string
  }>
}

async function readAllShopifySyncManifests(): Promise<ShopifySyncManifest[]> {
  try {
    const files = await fs.readdir(SHOPIFY_SYNC_DIR)
    const manifests = await Promise.all(
      files
        .filter((file) => file.endsWith('.json') && !file.endsWith('.dry-run.json'))
        .map(async (file) => {
          try {
            const raw = await fs.readFile(path.join(SHOPIFY_SYNC_DIR, file), 'utf8')
            return JSON.parse(raw) as ShopifySyncManifest
          } catch {
            return null
          }
        }),
    )
    return manifests.filter((manifest): manifest is ShopifySyncManifest => Boolean(manifest))
  } catch {
    return []
  }
}

async function readShopifySyncManifest(productCode: string): Promise<ShopifySyncManifest | null> {
  try {
    const raw = await fs.readFile(path.join(SHOPIFY_SYNC_DIR, `${productCode}.json`), 'utf8')
    return JSON.parse(raw) as ShopifySyncManifest
  } catch {
    return null
  }
}

async function readShopifyProduct(manifest: ShopifySyncManifest, handle: string, locale?: string): Promise<TourDetailData | null> {
  if (!manifest) return null

  try {
    const [{ shopifyAdminClient }, { getShopifyTourProductByHandle }] = await Promise.all([
      import('@/lib/shopify/admin-client'),
      import('@/lib/shopify/tour-product'),
    ])
    return getShopifyTourProductByHandle(shopifyAdminClient, manifest, handle, locale || 'en')
  } catch (error) {
    console.error('Failed to load Shopify tour product', error)
    return null
  }
}

async function getToursBmsProductByHandleUncached(handle: string, locale?: string): Promise<TourDetailData | null> {
  const key = normalizeKey(handle)
  if (!key) return null

  const byCode = extractProductCode(handle)
  if (byCode) {
    const manifest = await readShopifySyncManifest(byCode)
    if (!manifest) return null
    return readShopifyProduct(manifest, manifest.handle || handle, locale)
  }

  const manifests = await readAllShopifySyncManifests()
  const manifest = manifests.find((item) => normalizeKey(item.handle || '') === key)
  return manifest ? readShopifyProduct(manifest, manifest.handle || handle, locale) : null
}

export async function getToursBmsProductByHandle(handle: string, locale?: string): Promise<TourDetailData | null> {
  const cacheKey = `${normalizeKey(handle)}:${locale || 'en'}`
  const cached = tourDetailMemoryCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  const value = getToursBmsProductByHandleUncached(handle, locale)
  const cacheableValue = value.then((tour) => {
    if (!tour) tourDetailMemoryCache.delete(cacheKey)
    return tour
  })
  tourDetailMemoryCache.set(cacheKey, {
    expiresAt: Date.now() + MEMORY_CACHE_TTL_MS,
    value: cacheableValue,
  })

  try {
    return await cacheableValue
  } catch (error) {
    tourDetailMemoryCache.delete(cacheKey)
    throw error
  }
}

export async function listToursBmsProductCodes(): Promise<string[]> {
  try {
    const files = await fs.readdir(PRODUCTS_DIR)
    return files
      .filter((file) => file.endsWith('.json'))
      .map((file) => path.basename(file, '.json'))
  } catch {
    return []
  }
}
