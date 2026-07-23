import { promises as fs } from 'fs'
import path from 'path'
import type { TourDetailData } from './types'

const PRODUCTS_DIR = path.join(process.cwd(), 'data', 'toursbms-products')
const SHOPIFY_SYNC_DIR = path.join(process.cwd(), 'data', 'shopify-sync')
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
    const [{ shopifyClient }, { getShopifyTourProductByHandle }, { getSelectedMarket }] = await Promise.all([
      import('@/lib/shopify/client'),
      import('@/lib/shopify/tour-product'),
      import('@/lib/shopify/market'),
    ])
    const market = await getSelectedMarket()
    return getShopifyTourProductByHandle(shopifyClient, manifest, handle, locale || 'en', market.isoCode)
  } catch (error) {
    console.error('Failed to load Shopify tour product', error)
    return null
  }
}

async function readShopifyProductByHandle(handle: string, locale?: string): Promise<TourDetailData | null> {
  try {
    const { getAdminProductByHandle } = await import('@/lib/admin/shopify-admin')
    const product = await getAdminProductByHandle(handle)
    if (!product || normalizeKey(product.handle) !== normalizeKey(handle)) return null

    return readShopifyProduct({
      productCode: product.productCode,
      handle: product.handle,
      shopifyProductId: product.id,
    }, product.handle, locale)
  } catch (error) {
    console.error('Failed to find Shopify tour product by handle', error)
    return null
  }
}

async function getToursBmsProductByHandleUncached(handle: string, locale?: string): Promise<TourDetailData | null> {
  const key = normalizeKey(handle)
  if (!key) return null

  const byCode = extractProductCode(handle)
  if (byCode) {
    const manifest = await readShopifySyncManifest(byCode)
    if (manifest) {
      const product = await readShopifyProduct(manifest, manifest.handle || handle, locale)
      if (product) return product
    }
    return readShopifyProductByHandle(handle, locale)
  }

  const manifests = await readAllShopifySyncManifests()
  const manifest = manifests.find((item) => normalizeKey(item.handle || '') === key)
  if (manifest) {
    const product = await readShopifyProduct(manifest, manifest.handle || handle, locale)
    if (product) return product
  }
  return readShopifyProductByHandle(handle, locale)
}

export async function getToursBmsProductByHandle(handle: string, locale?: string): Promise<TourDetailData | null> {
  // Shopify fetches already use Next.js cache tags. A separate process-local
  // cache cannot be invalidated across requests/instances and caused newly
  // saved room variants to remain invisible for up to 30 minutes.
  return getToursBmsProductByHandleUncached(handle, locale)
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
