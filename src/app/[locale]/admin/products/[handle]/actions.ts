'use server'

import { redirect } from 'next/navigation'
import type { AdminFormState } from '@/components/admin/AdminActionForm'
import { assertAdminUser } from '@/lib/admin/auth'
import { expireStorefrontCaches } from '@/lib/admin/revalidate'
import {
  addProductImage,
  archiveAdminProduct,
  createDatePriceVariants,
  deleteAdminMetaobject,
  deleteAdminProduct,
  deleteDatePriceVariant,
  deleteProductImage,
  getAdminProductByHandle,
  initializeDatePriceVariants,
  renameAdminProductCode,
  setProductReferenceIds,
  updateAdminMetaobject,
  updateAdminProductBasic,
  updateProductFilterMetafields,
  updateVariantPrice,
  upsertAdminMetaobject,
} from '@/lib/admin/shopify-admin'
import { getDatePriceRate } from '@/lib/toursbms/date-price-rates'

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

function resolveActionFormData(
  previousState: AdminFormState | FormData,
  formData?: FormData,
) {
  if (formData && typeof formData.get === 'function') return formData
  if (previousState && typeof (previousState as FormData).get === 'function') return previousState as FormData
  return null
}

function saved(message = 'Saved', data?: unknown): AdminFormState {
  return { error: null, saved: true, message, data }
}

function failed(error: unknown, fallback: string): AdminFormState {
  return {
    error: error instanceof Error ? error.message : fallback,
    saved: false,
  }
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
  if (key === 'departure') return product.departures.map((item) => item.id)
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
  expireStorefrontCaches(locale, handle)
  redirect(`/${locale}/admin/products/${handle || originalHandle}`)
}

export async function saveOverview(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const originalHandle = text(formData, 'originalHandle')
  const handle = text(formData, 'handle')
  const originalProductCode = text(formData, 'originalProductCode').toUpperCase()
  const requestedProductCode = text(formData, 'productCode').toUpperCase()
  try {
    if (requestedProductCode !== originalProductCode) {
      await renameAdminProductCode(originalHandle, requestedProductCode)
    }
    const submittedTags = csv(text(formData, 'tags'))
    const tags = requestedProductCode
      ? [...submittedTags.filter((tag) => !/^code:/i.test(tag)), `code:${requestedProductCode}`]
      : submittedTags
    await updateAdminProductBasic({
      productId: text(formData, 'productId'),
      title: text(formData, 'title'),
      handle,
      status: text(formData, 'status') || 'DRAFT',
      productType: text(formData, 'productType'),
      tags,
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
      pricing_mode: text(formData, 'pricingMode') || 'per_person',
      bookable: formData.get('bookable') === 'on',
      last_synced_at: new Date().toISOString(),
    })
  } catch (error) {
    return failed(error, 'The overview could not be saved. Please try again.')
  }
  expireStorefrontCaches(locale, handle)
  const messages = []
  if (requestedProductCode !== originalProductCode) messages.push(`Product code renamed to ${requestedProductCode} everywhere`)
  if (handle !== originalHandle) messages.push('The new URL handle will be used after reopening this product')
  return saved(messages.length > 0 ? messages.join('. ') : 'Saved')
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
  expireStorefrontCaches(locale, handle)
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
  if (fields.html !== undefined) fields.text = htmlToText(fields.html)
  await updateAdminMetaobject(text(formData, 'metaobjectId'), fields)
  expireStorefrontCaches(locale, handle)
  redirect(`/${locale}/admin/products/${handle}`)
}

export async function saveVariantPrice(formData: FormData) {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const handle = text(formData, 'handle')
  await updateVariantPrice(text(formData, 'productId'), text(formData, 'variantId'), text(formData, 'price'))
  expireStorefrontCaches(locale, handle)
  redirect(`/${locale}/admin/products/${handle}`)
}

export async function saveContentAction(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const contentLocale = text(formData, 'contentLocale') || 'en'
  const handle = text(formData, 'handle')
  const productId = text(formData, 'productId')
  try {
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
  } catch (error) {
    return failed(error, 'The content could not be saved. Please try again.')
  }
  expireStorefrontCaches(locale, handle)
  return saved()
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
  expireStorefrontCaches(locale, handle)
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
  expireStorefrontCaches(locale, handle)
  redirect(`/${locale}/admin/products/${handle}?contentLocale=${contentLocale}#highlights`)
}

export async function saveHighlightsAction(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const contentLocale = text(formData, 'contentLocale') || 'en'
  const handle = text(formData, 'handle')

  try {
    const product = await getAdminProductByHandle(handle)
    if (!product) throw new Error('Product not found')

    let parsed: unknown
    try {
      parsed = JSON.parse(text(formData, 'highlights') || '[]')
    } catch {
      throw new Error('The highlight list is invalid')
    }
    if (!Array.isArray(parsed)) throw new Error('The highlight list is invalid')
    if (parsed.length > 100) throw new Error('A maximum of 100 highlights is supported')

    const drafts = parsed.flatMap((value) => {
      if (!value || typeof value !== 'object') return []
      const row = value as { id?: unknown; clientKey?: unknown; text?: unknown }
      const highlightText = String(row.text ?? '').trim()
      if (!highlightText) return []
      const clientKey = String(row.clientKey ?? '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80)
      if (!clientKey) throw new Error('A highlight row is missing its identifier')
      return [{ id: String(row.id ?? ''), clientKey, text: highlightText }]
    })

    const localeHighlights = product.highlights.filter((item) => item.fields.locale === contentLocale)
    const localeHighlightIds = new Set(localeHighlights.map((item) => item.id))
    const retainedIds = new Set<string>()
    const savedRows: Array<{ id: string; clientKey: string; text: string }> = []

    for (const [index, draft] of drafts.entries()) {
      const existing = draft.id && localeHighlightIds.has(draft.id)
        ? localeHighlights.find((item) => item.id === draft.id)
        : null
      if (existing) {
        await updateAdminMetaobject(existing.id, {
          product_code: productCodeFrom(product),
          locale: contentLocale,
          position: String(index + 1),
          text: draft.text,
        })
        retainedIds.add(existing.id)
        savedRows.push({ ...draft, id: existing.id })
      } else {
        const node = await upsertAdminMetaobject(
          'tour_highlight',
          `${handle}-${contentLocale}-highlight-${draft.clientKey}`,
          {
            product_code: productCodeFrom(product),
            locale: contentLocale,
            position: index + 1,
            text: draft.text,
          },
        )
        retainedIds.add(node.id)
        savedRows.push({ ...draft, id: node.id })
      }
    }

    const otherLocaleIds = product.highlights
      .filter((item) => item.fields.locale !== contentLocale)
      .map((item) => item.id)
    await setProductReferenceIds(product.id, 'highlight', [...otherLocaleIds, ...retainedIds])
    for (const item of localeHighlights) {
      if (!retainedIds.has(item.id)) await deleteAdminMetaobject(item.id)
    }

    expireStorefrontCaches(locale, handle)
    return saved('Highlights saved', { rows: savedRows })
  } catch (error) {
    return failed(error, 'The highlights could not be saved. Please try again.')
  }
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
  expireStorefrontCaches(locale, handle)
  redirect(`/${locale}/admin/products/${handle}?contentLocale=${contentLocale}`)
}

export async function saveItineraryDayAction(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const contentLocale = text(formData, 'contentLocale') || 'en'
  const handle = text(formData, 'handle')
  try {
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
  } catch (error) {
    return failed(error, 'The itinerary day could not be saved. Please try again.')
  }
  expireStorefrontCaches(locale, handle)
  return saved()
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
  expireStorefrontCaches(locale, handle)
  redirect(`/${locale}/admin/products/${handle}?contentLocale=${contentLocale}#itinerary`)
}

export async function saveSimpleMetaobjectAction(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const handle = text(formData, 'handle')
  const fields: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('field:')) fields[key.slice('field:'.length)] = String(value)
  }
  if (fields.html !== undefined) fields.text = htmlToText(fields.html)
  try {
    await updateAdminMetaobject(text(formData, 'metaobjectId'), fields)
  } catch (error) {
    return failed(error, 'This item could not be saved. Please try again.')
  }
  expireStorefrontCaches(locale, handle)
  return saved()
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
  if (fields.html !== undefined) fields.text = htmlToText(fields.html)
  if (type === 'tour_addon' && !fields.code) fields.code = `manual-${Date.now()}`
  const node = await upsertAdminMetaobject(type, `${handle}-${contentLocale}-${slugify(type)}-${Date.now()}`, fields)
  await appendReference(handle, key, node.id)
  expireStorefrontCaches(locale, handle)
  redirect(`/${locale}/admin/products/${handle}?contentLocale=${contentLocale}`)
}

export async function addCostSectionAction(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const contentLocale = text(formData, 'contentLocale') || 'en'
  const handle = text(formData, 'handle')

  try {
    const product = await getAdminProductByHandle(handle)
    if (!product) throw new Error('Product not found')
    const html = text(formData, 'field:html')
    const node = await upsertAdminMetaobject(
      'tour_cost_section',
      `${handle}-${contentLocale}-cost-section-${Date.now()}`,
      {
        product_code: productCodeFrom(product),
        locale: contentLocale,
        section: text(formData, 'field:section'),
        html,
        text: htmlToText(html),
      },
    )
    await appendReference(handle, 'cost_section', node.id)
    expireStorefrontCaches(locale, handle)
    return saved('Cost section added')
  } catch (error) {
    return failed(error, 'The cost section could not be added. Please try again.')
  }
}

export async function addImageAction(formData: FormData) {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const handle = text(formData, 'handle')
  await addProductImage(text(formData, 'productId'), text(formData, 'sourceUrl'), text(formData, 'alt'))
  expireStorefrontCaches(locale, handle)
  redirect(`/${locale}/admin/products/${handle}#images`)
}

export async function deleteImageAction(formData: FormData) {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const handle = text(formData, 'handle')
  await deleteProductImage(text(formData, 'mediaId'))
  expireStorefrontCaches(locale, handle)
  redirect(`/${locale}/admin/products/${handle}#images`)
}

type SubmittedPrice = { variantId?: string; rateType: string; priceType: number; price: string; sku: string; travelerType?: 'adult' | 'child' | 'senior' }

function parseDepartureRates(raw: string, pricingMode: string): SubmittedPrice[] {
  let submitted: unknown
  try { submitted = JSON.parse(raw) } catch { throw new Error('Invalid departure prices') }
  if (!Array.isArray(submitted) || submitted.length < 1) throw new Error('Add at least one departure price')
  const positivePrice = (value: unknown, label: string) => {
    const price = String(value ?? '').trim()
    if (!/^\d+(\.\d{1,2})?$/.test(price) || Number(price) <= 0) throw new Error(`Invalid price for ${label}`)
    return price
  }

  if (pricingMode === 'room_occupancy') {
    const seen = new Set<string>()
    return submitted.flatMap((value) => {
      const row = value as { roomType?: unknown; adult?: { variantId?: unknown; price?: unknown; sku?: unknown }; child?: { variantId?: unknown; price?: unknown; sku?: unknown } }
      const roomType = String(row.roomType ?? '').trim()
      const fixed = getDatePriceRate(roomType)
      if (!fixed || ![3, 4, 5, 6].includes(fixed.priceType)) throw new Error(`Unsupported room type: ${roomType || 'empty'}`)
      if (seen.has(roomType)) throw new Error(`Duplicate room type: ${roomType}`)
      seen.add(roomType)
      const adult: SubmittedPrice = {
        variantId: String(row.adult?.variantId ?? '') || undefined,
        rateType: fixed.label, priceType: fixed.priceType, travelerType: 'adult',
        price: positivePrice(row.adult?.price, `${roomType} Adult`), sku: String(row.adult?.sku ?? '').trim(),
      }
      const childPrice = String(row.child?.price ?? '').trim()
      if (!childPrice) return [adult]
      return [adult, {
        variantId: String(row.child?.variantId ?? '') || undefined,
        rateType: fixed.label, priceType: fixed.priceType, travelerType: 'child' as const,
        price: positivePrice(childPrice, `${roomType} Child`), sku: String(row.child?.sku ?? '').trim(),
      }]
    })
  }

  const seen = new Set<string>()
  return submitted.map((value) => {
    const row = value as { variantId?: unknown; rateType?: unknown; price?: unknown; sku?: unknown }
    const rateType = String(row.rateType ?? '').trim()
    const fixed = getDatePriceRate(rateType)
    if (!fixed || ![1, 2, 7].includes(fixed.priceType)) throw new Error(`Unsupported rate type: ${rateType || 'empty'}`)
    if (seen.has(rateType)) throw new Error(`Duplicate rate type: ${rateType}`)
    seen.add(rateType)
    const travelerType = fixed.priceType === 1 ? 'adult' : fixed.priceType === 2 ? 'child' : 'senior'
    return { variantId: String(row.variantId ?? '') || undefined, rateType: fixed.label, priceType: fixed.priceType, travelerType, price: positivePrice(row.price, rateType), sku: String(row.sku ?? '').trim() }
  })
}

type AdminProduct = NonNullable<Awaited<ReturnType<typeof getAdminProductByHandle>>>

function attachExistingVariantIds(product: AdminProduct, date: string, rows: SubmittedPrice[]) {
  const existing = product.variants.filter((variant) => variant.date === date)
  return rows.map((row) => {
    if (row.variantId) return row
    const match = existing.find((variant) => {
      const travelerType = variant.travelerType ?? (variant.priceType >= 3 && variant.priceType <= 6 ? 'adult' : undefined)
      return variant.priceType === row.priceType && travelerType === row.travelerType
    })
    return match ? { ...row, variantId: match.id } : row
  })
}

async function upsertDeparturePricing(product: AdminProduct, date: string, submittedRows: SubmittedPrice[], status: string, remainingStock: number) {
  const rows = attachExistingVariantIds(product, date, submittedRows)
  const existing = product.variants.filter((variant) => variant.date === date)
  const retainedIds = new Set(rows.map((row) => row.variantId).filter(Boolean))
  for (const row of rows) if (row.variantId) await updateVariantPrice(product.id, row.variantId, row.price)
  const additions = rows.filter((row) => !row.variantId)
  const hasDatePriceVariants = product.variants.some((variant) => /^\d{4}-\d{2}-\d{2}$/.test(variant.date))
  const created = additions.length
    ? hasDatePriceVariants
      ? await createDatePriceVariants({ productId: product.id, date, rates: additions })
      : await initializeDatePriceVariants({ productId: product.id, date, rates: additions })
    : []
  for (const variant of existing) if (!retainedIds.has(variant.id)) await deleteDatePriceVariant(product.id, variant.id)
  const variantMap = Object.fromEntries([
    ...rows.filter((row) => row.variantId).map((row) => [`${row.priceType}:${row.travelerType}`, row.variantId]),
    ...created.map((variant, index) => [`${additions[index].priceType}:${additions[index].travelerType}`, variant.id]),
  ])
  const currentDeparture = product.departures.find((departure) => departure.fields.date === date)
  return upsertAdminMetaobject('tour_departure', currentDeparture?.handle || `${productCodeFrom(product)}-departure-${date}`, {
    product_code: productCodeFrom(product), date, status: status || currentDeparture?.fields.status || 'open',
    remaining_stock: Math.max(0, remainingStock), currency: product.currencyCode,
    prices_json: JSON.stringify(rows), variant_ids_json: JSON.stringify(variantMap),
  })
}

export async function saveRateTemplateAction(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const handle = text(formData, 'handle')
  try {
    const product = await getAdminProductByHandle(handle)
    if (!product) throw new Error('Product not found')
    const pricingMode = text(formData, 'pricingMode') || product.metafields.pricing_mode?.value || 'per_person'
    if (!['per_person', 'room_occupancy'].includes(pricingMode)) throw new Error('Unsupported pricing mode')
    let template: Array<{ rateType: string; travelerType: string }>
    try { template = JSON.parse(text(formData, 'template')) } catch { throw new Error('Invalid rate template') }
    if (!Array.isArray(template) || template.length < 1) throw new Error('Add at least one price variant')
    const seen = new Set<string>()
    for (const item of template) {
      const fixed = getDatePriceRate(item.rateType)
      const key = `${item.rateType}:${item.travelerType}`
      if (seen.has(key)) throw new Error(`Duplicate price variant: ${key}`)
      seen.add(key)
      if (pricingMode === 'room_occupancy') {
        if (!fixed || ![3, 4, 5, 6].includes(fixed.priceType) || !['adult', 'child'].includes(item.travelerType)) throw new Error(`Unsupported room variant: ${key}`)
      } else if (!fixed || ![1, 2, 7].includes(fixed.priceType)) throw new Error(`Unsupported traveler variant: ${key}`)
    }
    if (pricingMode === 'room_occupancy') {
      const rooms = new Set(template.map((item) => item.rateType))
      for (const room of rooms) if (!seen.has(`${room}:adult`)) throw new Error(`${room} requires an Adult price variant`)
    } else if (!seen.has('Adult:adult')) throw new Error('Adult price variant is required')
    await updateProductFilterMetafields(product.id, {
      pricing_mode: pricingMode,
      rate_template: JSON.stringify(template),
    })
    expireStorefrontCaches(locale, handle)
    return saved('Variant setup saved')
  } catch (error) {
    return failed(error, 'The variant setup could not be saved. Please try again.')
  }
}

export async function saveDeparturePricesAction(
  _previousState: AdminFormState | FormData,
  formData?: FormData,
): Promise<AdminFormState> {
  const submittedFormData = resolveActionFormData(_previousState, formData)
  if (!submittedFormData) return failed(new Error('The submitted pricing form was empty. Reload this page and try again.'), 'The departure prices could not be saved.')
  await assertAdminUser()
  const locale = text(submittedFormData, 'locale')
  const handle = text(submittedFormData, 'handle')
  try {
    const product = await getAdminProductByHandle(handle)
    if (!product) throw new Error('Product not found')
    const date = text(submittedFormData, 'date')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Select a valid departure date')
    const pricingMode = text(submittedFormData, 'pricingMode') || product.metafields.pricing_mode?.value
      || (product.variants.some((variant) => ['Single room', 'Double room', 'Triple room', 'Quad room'].includes(variant.rateType)) ? 'room_occupancy' : 'per_person')
    if (!['per_person', 'room_occupancy'].includes(pricingMode)) throw new Error('Unsupported pricing mode')
    const rows = parseDepartureRates(text(submittedFormData, 'rates'), pricingMode)
    const status = text(submittedFormData, 'status') || 'open'
    const remainingStock = Number(text(submittedFormData, 'remainingStock') || 0)
    await updateProductFilterMetafields(product.id, { pricing_mode: pricingMode })
    const departure = await upsertDeparturePricing(product, date, rows, status, remainingStock)
    await setProductReferenceIds(product.id, 'departure', [...new Set([...refsFor(product, 'departure'), departure.id])])
    expireStorefrontCaches(locale, handle)
    return saved('Prices saved', {
      departures: [{
        date,
        status,
        remainingStock: Math.max(0, remainingStock),
        rates: rows.map((row) => ({
          variantId: row.variantId,
          rateType: row.rateType,
          travelerType: row.travelerType,
          price: row.price,
          sku: row.sku,
        })),
      }],
    })
  } catch (error) {
    return failed(error, 'The departure prices could not be saved. Please try again.')
  }
}

export async function saveBulkDeparturePricesAction(
  _previousState: AdminFormState | FormData,
  formData?: FormData,
): Promise<AdminFormState> {
  const submittedFormData = resolveActionFormData(_previousState, formData)
  if (!submittedFormData) return failed(new Error('The submitted pricing form was empty. Reload this page and try again.'), 'The bulk departure prices could not be saved.')
  await assertAdminUser()
  const locale = text(submittedFormData, 'locale')
  const handle = text(submittedFormData, 'handle')
  try {
    const product = await getAdminProductByHandle(handle)
    if (!product) throw new Error('Product not found')
    const pricingMode = text(submittedFormData, 'pricingMode') || product.metafields.pricing_mode?.value
      || (product.variants.some((variant) => ['Single room', 'Double room', 'Triple room', 'Quad room'].includes(variant.rateType)) ? 'room_occupancy' : 'per_person')
    if (!['per_person', 'room_occupancy'].includes(pricingMode)) throw new Error('Unsupported pricing mode')
    let dates: unknown
    try { dates = JSON.parse(text(submittedFormData, 'dates')) } catch { throw new Error('Invalid departure dates') }
    if (!Array.isArray(dates)) throw new Error('Select at least one departure date')
    const uniqueDates = [...new Set(dates.map((date) => String(date)))].filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    if (uniqueDates.length < 1) throw new Error('Select at least one departure date')
    if (uniqueDates.length > 62) throw new Error('Bulk editing is limited to 62 dates at a time')
    const rows = parseDepartureRates(text(submittedFormData, 'rates'), pricingMode)
    const status = text(submittedFormData, 'status') || 'open'
    const remainingStock = Number(text(submittedFormData, 'remainingStock') || 0)
    await updateProductFilterMetafields(product.id, { pricing_mode: pricingMode })
    const departureIds = new Set(refsFor(product, 'departure'))
    for (const date of uniqueDates) {
      const departure = await upsertDeparturePricing(product, date, rows.map((row) => ({ ...row, variantId: undefined })), status, remainingStock)
      departureIds.add(departure.id)
    }
    await setProductReferenceIds(product.id, 'departure', [...departureIds])
    expireStorefrontCaches(locale, handle)
    return saved(`Prices applied to ${uniqueDates.length} dates`, {
      departures: uniqueDates.map((date) => ({
        date,
        status,
        remainingStock: Math.max(0, remainingStock),
        rates: rows.map((row) => ({
          rateType: row.rateType,
          travelerType: row.travelerType,
          price: row.price,
          sku: row.sku,
        })),
      })),
    })
  } catch (error) {
    return failed(error, 'The bulk departure prices could not be saved. Please try again.')
  }
}

export async function deleteVariantAction(formData: FormData) {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const handle = text(formData, 'handle')
  await deleteDatePriceVariant(text(formData, 'productId'), text(formData, 'variantId'))
  expireStorefrontCaches(locale, handle)
  redirect(`/${locale}/admin/products/${handle}#dates`)
}

export async function archiveProductAction(formData: FormData) {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const handle = text(formData, 'handle')
  await archiveAdminProduct(text(formData, 'productId'))
  expireStorefrontCaches(locale, handle)
  redirect(`/${locale}/admin/products/${handle}`)
}

export async function deleteProductAction(formData: FormData) {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const confirmation = text(formData, 'confirm')
  if (confirmation !== 'DELETE') throw new Error('Type DELETE to permanently delete this product')
  await deleteAdminProduct(text(formData, 'productId'))
  expireStorefrontCaches(locale)
  redirect(`/${locale}/admin/products`)
}
