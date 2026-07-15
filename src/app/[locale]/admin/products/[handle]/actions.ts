'use server'

import { redirect } from 'next/navigation'
import { assertAdminUser } from '@/lib/admin/auth'
import { revalidateStorefrontCaches } from '@/lib/admin/revalidate'
import {
  addProductImage,
  archiveAdminProduct,
  createDatePriceVariant,
  deleteAdminMetaobject,
  deleteAdminProduct,
  deleteDatePriceVariant,
  deleteProductImage,
  getAdminProductByHandle,
  setProductReferenceIds,
  updateAdminMetaobject,
  updateAdminProductBasic,
  updateProductFilterMetafields,
  updateVariantPrice,
  upsertAdminMetaobject,
} from '@/lib/admin/shopify-admin'

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

function csv(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

function htmlToText(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function titleFromStopsJson(value: string) {
  try {
    const stops = JSON.parse(value) as Array<{ type?: string; label?: string; place?: string; name?: string }>
    if (!Array.isArray(stops)) return ''
    return stops
      .reduce<string[]>((names, stop) => {
        const name = (stop.label || stop.place || stop.name || '').trim()
        if (name && names[names.length - 1] !== name) names.push(name)
        return names
      }, [])
      .join(' > ')
  } catch {
    return ''
  }
}

type ItineraryImageInput = {
  src?: string
  url?: string
  image?: string
  alt?: string
  caption?: string
  sourceUrl?: string
  shopifyMediaId?: string
}

function isShopifyImageUrl(value: string) {
  try {
    const url = new URL(value)
    return url.hostname === 'cdn.shopify.com' || url.hostname.endsWith('.myshopify.com')
  } catch {
    return false
  }
}

function imageUrlFrom(value: unknown) {
  if (typeof value === 'string') return value.trim()
  if (!value || typeof value !== 'object') return ''
  const image = value as ItineraryImageInput
  return (image.src || image.url || image.image || '').trim()
}

async function normalizeItineraryImages(value: string, productId: string) {
  let parsed: unknown
  try {
    parsed = JSON.parse(value || '[]')
  } catch {
    parsed = []
  }

  if (!Array.isArray(parsed)) return '[]'

  const normalized = []
  for (const item of parsed) {
    const src = imageUrlFrom(item)
    if (!src) continue
    const image = typeof item === 'object' && item ? item as ItineraryImageInput : {}
    const caption = (image.caption || image.alt || '').trim()
    const shopifyMediaId = (image.shopifyMediaId || '').trim()
    const sourceUrl = (image.sourceUrl || src).trim()

    if (!shopifyMediaId && productId && !isShopifyImageUrl(src)) {
      try {
        const uploaded = await addProductImage(productId, src, caption)
        normalized.push({
          src: uploaded.url,
          alt: caption,
          caption,
          sourceUrl,
          shopifyMediaId: uploaded.id,
        })
        continue
      } catch (error) {
        normalized.push({
          src,
          alt: caption,
          caption,
          sourceUrl,
          shopifyMediaId: '',
          uploadError: error instanceof Error ? error.message : String(error),
        })
        continue
      }
    }

    normalized.push({
      src,
      alt: caption,
      caption,
      sourceUrl,
      shopifyMediaId,
    })
  }

  return JSON.stringify(normalized)
}

function productCodeFrom(product: Awaited<ReturnType<typeof getAdminProductByHandle>>) {
  return product?.productCode || product?.metafields.product_code?.value || ''
}

function refsFor(product: Awaited<ReturnType<typeof getAdminProductByHandle>>, key: string) {
  if (!product) return []
  if (key === 'content') return product.content.map((item) => item.id)
  if (key === 'highlight') return product.highlights.map((item) => item.id)
  if (key === 'itinerary_day') return product.itineraryDays.map((item) => item.id)
  if (key === 'cost_section') return product.costSections.map((item) => item.id)
  if (key === 'policy_notice') return product.policyNotices.map((item) => item.id)
  if (key === 'pickup_dropoff') return product.pickupDropoffs.map((item) => item.id)
  if (key === 'addon') return product.addons.map((item) => item.id)
  return []
}

async function appendReference(handle: string, key: string, id: string) {
  const product = await getAdminProductByHandle(handle)
  if (!product) throw new Error('Product not found')
  await setProductReferenceIds(product.id, key, [...new Set([...refsFor(product, key), id])])
  return product
}

async function removeReference(handle: string, key: string, id: string) {
  const product = await getAdminProductByHandle(handle)
  if (!product) throw new Error('Product not found')
  await setProductReferenceIds(product.id, key, refsFor(product, key).filter((item) => item !== id))
  return product
}

export async function saveProductBasics(formData: FormData) {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const originalHandle = text(formData, 'originalHandle')
  const handle = text(formData, 'handle')
  await updateAdminProductBasic({
    productId: text(formData, 'productId'),
    title: text(formData, 'title'),
    handle,
    status: text(formData, 'status') || 'DRAFT',
    productType: text(formData, 'productType'),
    tags: csv(text(formData, 'tags')),
    descriptionHtml: text(formData, 'descriptionHtml'),
  })
  revalidateStorefrontCaches(locale, handle)
  redirect(`/${locale}/admin/products/${handle || originalHandle}`)
}

export async function saveOverview(formData: FormData) {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const originalHandle = text(formData, 'originalHandle')
  const handle = text(formData, 'handle')
  await updateAdminProductBasic({
    productId: text(formData, 'productId'),
    title: text(formData, 'title'),
    handle,
    status: text(formData, 'status') || 'DRAFT',
    productType: text(formData, 'productType'),
    tags: csv(text(formData, 'tags')),
    descriptionHtml: text(formData, 'descriptionHtml'),
  })
  await updateProductFilterMetafields(text(formData, 'productId'), {
    country: text(formData, 'country'),
    city: text(formData, 'city'),
    destinations: text(formData, 'destinations'),
    labels: text(formData, 'labels'),
    duration_days: text(formData, 'durationDays'),
    min_price: text(formData, 'minPrice'),
    max_price: text(formData, 'maxPrice'),
    earliest_departure: text(formData, 'earliestDeparture'),
    latest_departure: text(formData, 'latestDeparture'),
    product_type: text(formData, 'productTypeFact'),
    confirm_method: text(formData, 'confirmMethod'),
    bookable: formData.get('bookable') === 'on',
    last_synced_at: new Date().toISOString(),
  })
  revalidateStorefrontCaches(locale, handle)
  redirect(`/${locale}/admin/products/${handle || originalHandle}`)
}

export async function saveFilterFacts(formData: FormData) {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const handle = text(formData, 'handle')
  await updateProductFilterMetafields(text(formData, 'productId'), {
    country: text(formData, 'country'),
    city: text(formData, 'city'),
    destinations: text(formData, 'destinations'),
    labels: text(formData, 'labels'),
    duration_days: text(formData, 'durationDays'),
    min_price: text(formData, 'minPrice'),
    max_price: text(formData, 'maxPrice'),
    earliest_departure: text(formData, 'earliestDeparture'),
    latest_departure: text(formData, 'latestDeparture'),
    product_type: text(formData, 'productTypeFact'),
    confirm_method: text(formData, 'confirmMethod'),
    bookable: formData.get('bookable') === 'on',
    last_synced_at: new Date().toISOString(),
  })
  revalidateStorefrontCaches(locale, handle)
  redirect(`/${locale}/admin/products/${handle}`)
}

export async function saveMetaobjectContent(formData: FormData) {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const handle = text(formData, 'handle')
  const fields: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('field:')) fields[key.slice('field:'.length)] = String(value)
  }
  await updateAdminMetaobject(text(formData, 'metaobjectId'), fields)
  revalidateStorefrontCaches(locale, handle)
  redirect(`/${locale}/admin/products/${handle}`)
}

export async function saveVariantPrice(formData: FormData) {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const handle = text(formData, 'handle')
  await updateVariantPrice(text(formData, 'productId'), text(formData, 'variantId'), text(formData, 'price'))
  revalidateStorefrontCaches(locale, handle)
  redirect(`/${locale}/admin/products/${handle}`)
}

export async function saveContentAction(formData: FormData) {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const contentLocale = text(formData, 'contentLocale') || 'en'
  const handle = text(formData, 'handle')
  const productId = text(formData, 'productId')
  const product = await getAdminProductByHandle(handle)
  if (!product) throw new Error('Product not found')
  const title = text(formData, 'title')
  const subtitle = text(formData, 'subtitle')
  const descriptionHtml = text(formData, 'descriptionHtml')
  const existingId = text(formData, 'metaobjectId')

  if (contentLocale === 'en') {
    await updateAdminProductBasic({
      productId,
      title,
      handle,
      status: product.status,
      productType: product.productType,
      tags: product.tags,
      descriptionHtml,
    })
  }

  const node = await upsertAdminMetaobject(
    'tour_content',
    existingId ? product.content.find((item) => item.id === existingId)?.handle || `${handle}-${contentLocale}` : `${handle}-${contentLocale}`,
    {
      product_code: productCodeFrom(product),
      locale: contentLocale,
      title,
      subtitle,
      description_html: descriptionHtml,
      description_text: htmlToText(descriptionHtml),
    },
  )
  await setProductReferenceIds(product.id, 'content', [...new Set([...product.content.map((item) => item.id), node.id])])
  revalidateStorefrontCaches(locale, handle)
  redirect(`/${locale}/admin/products/${handle}?contentLocale=${contentLocale}`)
}

export async function saveHighlightAction(formData: FormData) {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const contentLocale = text(formData, 'contentLocale') || 'en'
  const handle = text(formData, 'handle')
  await updateAdminMetaobject(text(formData, 'metaobjectId'), {
    product_code: text(formData, 'productCode'),
    locale: contentLocale,
    position: text(formData, 'position') || '1',
    text: text(formData, 'text'),
  })
  revalidateStorefrontCaches(locale, handle)
  redirect(`/${locale}/admin/products/${handle}?contentLocale=${contentLocale}#highlights`)
}

export async function addHighlightAction(formData: FormData) {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const contentLocale = text(formData, 'contentLocale') || 'en'
  const handle = text(formData, 'handle')
  const product = await getAdminProductByHandle(handle)
  if (!product) throw new Error('Product not found')
  const position = product.highlights.filter((item) => item.fields.locale === contentLocale).length + 1
  const node = await upsertAdminMetaobject('tour_highlight', `${handle}-${contentLocale}-highlight-${Date.now()}`, {
    product_code: productCodeFrom(product),
    locale: contentLocale,
    position,
    text: text(formData, 'text'),
  })
  await appendReference(handle, 'highlight', node.id)
  revalidateStorefrontCaches(locale, handle)
  redirect(`/${locale}/admin/products/${handle}?contentLocale=${contentLocale}#highlights`)
}

export async function deleteContentItemAction(formData: FormData) {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const contentLocale = text(formData, 'contentLocale') || 'en'
  const handle = text(formData, 'handle')
  const key = text(formData, 'referenceKey')
  const id = text(formData, 'metaobjectId')
  await removeReference(handle, key, id)
  await deleteAdminMetaobject(id)
  revalidateStorefrontCaches(locale, handle)
  redirect(`/${locale}/admin/products/${handle}?contentLocale=${contentLocale}`)
}

export async function saveItineraryDayAction(formData: FormData) {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const contentLocale = text(formData, 'contentLocale') || 'en'
  const handle = text(formData, 'handle')
  const descriptionHtml = text(formData, 'descriptionHtml')
  const stopsJson = text(formData, 'stopsJson') || '[]'
  const generatedTitle = titleFromStopsJson(stopsJson)
  const title = text(formData, 'title') || generatedTitle
  const route = text(formData, 'route') || generatedTitle
  const imagesJson = await normalizeItineraryImages(text(formData, 'imagesJson') || '[]', text(formData, 'productId'))
  await updateAdminMetaobject(text(formData, 'metaobjectId'), {
    product_code: text(formData, 'productCode'),
    locale: contentLocale,
    day_number: text(formData, 'dayNumber') || '1',
    title,
    route,
    description_html: descriptionHtml,
    description_text: htmlToText(descriptionHtml),
    stops_json: stopsJson,
    images_json: imagesJson,
    hotel: text(formData, 'hotel'),
  })
  revalidateStorefrontCaches(locale, handle)
  redirect(`/${locale}/admin/products/${handle}?contentLocale=${contentLocale}#itinerary`)
}

export async function addItineraryDayAction(formData: FormData) {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const contentLocale = text(formData, 'contentLocale') || 'en'
  const handle = text(formData, 'handle')
  const product = await getAdminProductByHandle(handle)
  if (!product) throw new Error('Product not found')
  const dayNumber = product.itineraryDays.filter((item) => item.fields.locale === contentLocale).length + 1
  const descriptionHtml = text(formData, 'descriptionHtml')
  const stopsJson = text(formData, 'stopsJson') || '[]'
  const generatedTitle = titleFromStopsJson(stopsJson)
  const title = text(formData, 'title') || generatedTitle || `Day ${dayNumber}`
  const route = text(formData, 'route') || generatedTitle
  const imagesJson = await normalizeItineraryImages(text(formData, 'imagesJson') || '[]', product.id)
  const node = await upsertAdminMetaobject('tour_itinerary_day', `${handle}-${contentLocale}-day-${Date.now()}`, {
    product_code: productCodeFrom(product),
    locale: contentLocale,
    day_number: dayNumber,
    title,
    route,
    description_html: descriptionHtml,
    description_text: htmlToText(descriptionHtml),
    stops_json: stopsJson,
    images_json: imagesJson,
    hotel: '',
  })
  await appendReference(handle, 'itinerary_day', node.id)
  revalidateStorefrontCaches(locale, handle)
  redirect(`/${locale}/admin/products/${handle}?contentLocale=${contentLocale}#itinerary`)
}

export async function saveSimpleMetaobjectAction(formData: FormData) {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const contentLocale = text(formData, 'contentLocale') || 'en'
  const handle = text(formData, 'handle')
  const fields: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('field:')) fields[key.slice('field:'.length)] = String(value)
  }
  await updateAdminMetaobject(text(formData, 'metaobjectId'), fields)
  revalidateStorefrontCaches(locale, handle)
  redirect(`/${locale}/admin/products/${handle}?contentLocale=${contentLocale}`)
}

export async function addSimpleMetaobjectAction(formData: FormData) {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const contentLocale = text(formData, 'contentLocale') || 'en'
  const handle = text(formData, 'handle')
  const product = await getAdminProductByHandle(handle)
  if (!product) throw new Error('Product not found')
  const type = text(formData, 'type')
  const key = text(formData, 'referenceKey')
  const fields: Record<string, string> = {
    product_code: productCodeFrom(product),
    locale: contentLocale,
  }
  for (const [fieldKey, value] of formData.entries()) {
    if (fieldKey.startsWith('field:')) fields[fieldKey.slice('field:'.length)] = String(value)
  }
  if (type === 'tour_addon' && !fields.code) fields.code = `manual-${Date.now()}`
  const node = await upsertAdminMetaobject(type, `${handle}-${contentLocale}-${slugify(type)}-${Date.now()}`, fields)
  await appendReference(handle, key, node.id)
  revalidateStorefrontCaches(locale, handle)
  redirect(`/${locale}/admin/products/${handle}?contentLocale=${contentLocale}`)
}

export async function addImageAction(formData: FormData) {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const handle = text(formData, 'handle')
  await addProductImage(text(formData, 'productId'), text(formData, 'sourceUrl'), text(formData, 'alt'))
  revalidateStorefrontCaches(locale, handle)
  redirect(`/${locale}/admin/products/${handle}#images`)
}

export async function deleteImageAction(formData: FormData) {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const handle = text(formData, 'handle')
  await deleteProductImage(text(formData, 'mediaId'))
  revalidateStorefrontCaches(locale, handle)
  redirect(`/${locale}/admin/products/${handle}#images`)
}

export async function addVariantAction(formData: FormData) {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const handle = text(formData, 'handle')
  await createDatePriceVariant({
    productId: text(formData, 'productId'),
    date: text(formData, 'date'),
    rateType: text(formData, 'rateType'),
    price: text(formData, 'price'),
    priceType: text(formData, 'priceType'),
    sku: text(formData, 'sku'),
  })
  revalidateStorefrontCaches(locale, handle)
  redirect(`/${locale}/admin/products/${handle}#dates`)
}

export async function deleteVariantAction(formData: FormData) {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const handle = text(formData, 'handle')
  await deleteDatePriceVariant(text(formData, 'productId'), text(formData, 'variantId'))
  revalidateStorefrontCaches(locale, handle)
  redirect(`/${locale}/admin/products/${handle}#dates`)
}

export async function archiveProductAction(formData: FormData) {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const handle = text(formData, 'handle')
  await archiveAdminProduct(text(formData, 'productId'))
  revalidateStorefrontCaches(locale, handle)
  redirect(`/${locale}/admin/products/${handle}`)
}

export async function deleteProductAction(formData: FormData) {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const confirmation = text(formData, 'confirm')
  if (confirmation !== 'DELETE') throw new Error('Type DELETE to permanently delete this product')
  await deleteAdminProduct(text(formData, 'productId'))
  revalidateStorefrontCaches(locale)
  redirect(`/${locale}/admin/products`)
}
