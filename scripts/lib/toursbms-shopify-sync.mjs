import { createHash } from 'crypto'

export const DEFAULT_LOCALES = ['en', 'zh-CN', 'zh-TW']

export const LOCALE_TO_TOURSBMS_LANG = {
  en: 3,
  'zh-CN': 1,
  'zh-TW': 2,
}

export const METAOBJECT_DEFINITIONS = [
  {
    type: 'tour_content',
    name: 'Tour Content',
    fields: [
      ['product_code', 'Product code', 'single_line_text_field'],
      ['locale', 'Locale', 'single_line_text_field'],
      ['title', 'Title', 'single_line_text_field'],
      ['subtitle', 'Subtitle', 'single_line_text_field'],
      ['description_html', 'Description HTML', 'multi_line_text_field'],
      ['description_text', 'Description text', 'multi_line_text_field'],
    ],
  },
  {
    type: 'tour_highlight',
    name: 'Tour Highlight',
    fields: [
      ['product_code', 'Product code', 'single_line_text_field'],
      ['locale', 'Locale', 'single_line_text_field'],
      ['position', 'Position', 'number_integer'],
      ['text', 'Text', 'multi_line_text_field'],
    ],
  },
  {
    type: 'tour_itinerary_day',
    name: 'Tour Itinerary Day',
    fields: [
      ['product_code', 'Product code', 'single_line_text_field'],
      ['locale', 'Locale', 'single_line_text_field'],
      ['day_number', 'Day number', 'number_integer'],
      ['title', 'Title', 'single_line_text_field'],
      ['route', 'Route', 'multi_line_text_field'],
      ['description_html', 'Description HTML', 'multi_line_text_field'],
      ['description_text', 'Description text', 'multi_line_text_field'],
      ['stops_json', 'Stops JSON', 'json'],
      ['images_json', 'Images JSON', 'json'],
      ['hotel', 'Hotel', 'single_line_text_field'],
    ],
  },
  {
    type: 'tour_departure',
    name: 'Tour Departure',
    fields: [
      ['product_code', 'Product code', 'single_line_text_field'],
      ['date', 'Date', 'date'],
      ['status', 'Status', 'single_line_text_field'],
      ['remaining_stock', 'Remaining stock', 'number_integer'],
      ['currency', 'Currency', 'single_line_text_field'],
      ['prices_json', 'Prices JSON', 'json'],
      ['variant_ids_json', 'Variant IDs JSON', 'json'],
    ],
  },
  {
    type: 'tour_cost_section',
    name: 'Tour Cost Section',
    fields: [
      ['product_code', 'Product code', 'single_line_text_field'],
      ['locale', 'Locale', 'single_line_text_field'],
      ['section', 'Section', 'single_line_text_field'],
      ['html', 'HTML', 'multi_line_text_field'],
      ['text', 'Text', 'multi_line_text_field'],
    ],
  },
  {
    type: 'tour_policy_notice',
    name: 'Tour Policy Notice',
    fields: [
      ['product_code', 'Product code', 'single_line_text_field'],
      ['locale', 'Locale', 'single_line_text_field'],
      ['notice_type', 'Notice type', 'number_integer'],
      ['type_label', 'Type label', 'single_line_text_field'],
      ['matter_name', 'Matter name', 'single_line_text_field'],
      ['html', 'HTML', 'multi_line_text_field'],
      ['text', 'Text', 'multi_line_text_field'],
    ],
  },
  {
    type: 'tour_pickup_dropoff',
    name: 'Tour Pickup Dropoff',
    fields: [
      ['product_code', 'Product code', 'single_line_text_field'],
      ['locale', 'Locale', 'single_line_text_field'],
      ['kind', 'Kind', 'single_line_text_field'],
      ['code', 'Code', 'single_line_text_field'],
      ['name', 'Name', 'single_line_text_field'],
      ['address', 'Address', 'multi_line_text_field'],
      ['description', 'Description', 'multi_line_text_field'],
      ['is_airport', 'Is airport', 'boolean'],
    ],
  },
  {
    type: 'tour_addon',
    name: 'Tour Add-on',
    fields: [
      ['product_code', 'Product code', 'single_line_text_field'],
      ['locale', 'Locale', 'single_line_text_field'],
      ['code', 'Code', 'single_line_text_field'],
      ['name', 'Name', 'single_line_text_field'],
      ['description', 'Description', 'multi_line_text_field'],
      ['amount', 'Amount', 'number_decimal'],
      ['currency', 'Currency', 'single_line_text_field'],
      ['people_type', 'People type', 'single_line_text_field'],
      ['chargeable', 'Chargeable', 'boolean'],
      ['shopify_variant_id', 'Shopify variant ID', 'single_line_text_field'],
    ],
  },
]

const ADULT_PRICE_TYPES = new Set([3, 4, 5, 6])

export function slugify(input, fallback = 'item') {
  const slug = String(input || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
  return slug || fallback
}

export function stableHandle(...parts) {
  return parts
    .map((part) => slugify(part, ''))
    .filter(Boolean)
    .join('-')
    .slice(0, 255)
}

export function hashHandle(value, prefix = '') {
  const hash = createHash('sha1').update(String(value)).digest('hex').slice(0, 10)
  return stableHandle(prefix, hash)
}

export function asJsonMetafieldValue(value) {
  return JSON.stringify(value ?? null)
}

export function moneyValue(value) {
  const number = Number(value || 0)
  return number.toFixed(2)
}

export function getProductCode(json) {
  return json?.product?.productCode || json?.shopify_mapping?.metafields?.toursbms_product_code || ''
}

export function getProductHandle(json) {
  const productCode = getProductCode(json)
  return json?.shopify_mapping?.handle || stableHandle(json?.product?.title, productCode) || productCode.toLowerCase()
}

export function getProductTitle(json) {
  return String(json?.shopify_mapping?.title || json?.product?.title || getProductCode(json)).trim()
}

export function isAdultPrice(price) {
  return ADULT_PRICE_TYPES.has(Number(price?.priceType))
}

export function isRequestOnlyAddon(addon) {
  const amount = Number(addon?.amount ?? addon?.promoteMoney ?? 0)
  const text = `${addon?.name || ''} ${addon?.descriptionText || addon?.description || ''}`.toLowerCase()
  return (
    amount <= 0 ||
    text.includes('contact operator') ||
    text.includes('quote') ||
    text.includes('first, second, third and fourth') ||
    text.includes('starting from the fifth') ||
    (text.includes('airport') && text.includes('first four')) ||
    text.includes('pre night hotel') ||
    text.includes('post night hotel')
  )
}

export function buildTourVariants(json) {
  const productCode = getProductCode(json)
  const availability = Array.isArray(json?.pricing?.availability) ? json.pricing.availability : []
  const variants = []

  for (const departure of availability) {
    if (!departure?.date || departure.stockStatus !== 200) continue
    for (const price of departure.prices || []) {
      if (!price?.label || !Number(price.amount)) continue
      variants.push({
        date: departure.date,
        priceType: Number(price.priceType || 0),
        label: String(price.label).trim(),
        optionValues: {
          'Departure Date': departure.date,
          'Rate Type': String(price.label).trim(),
        },
        sku: `${productCode}-${departure.date}-${price.priceType}-${slugify(price.label)}`.toUpperCase(),
        price: moneyValue(price.amount),
        currency: departure.currency || json?.pricing?.requestedCurrency || json?.pricing?.defaultCurrency || 'USD',
        inventoryPolicy: 'CONTINUE',
        inventoryQuantity: Number(departure.remainingStock ?? departure.groupStock ?? 0),
        remainingStock: Number(departure.remainingStock ?? departure.groupStock ?? 0),
      })
    }
  }

  return variants
}

function hasBookableVariants(json) {
  return buildTourVariants(json).length > 0
}

export function buildProductImages(json, existingImages = []) {
  const existingBySource = new Map(existingImages.map((image) => [image.sourceUrl, image]))
  return (json?.media?.images || []).filter(Boolean).map((sourceUrl, index) => {
    const previous = existingBySource.get(sourceUrl) || {}
    return {
      sourceUrl,
      shopifyMediaId: previous.shopifyMediaId || null,
      shopifyFileId: previous.shopifyFileId || null,
      position: index + 1,
      role: index === 0 ? 'featured' : 'gallery',
      alt: `${getProductTitle(json)} ${index + 1}`,
    }
  })
}

export function buildProductMetafields(json) {
  const product = json.product || {}
  const pricing = json.pricing || {}
  return [
    ['product_code', getProductCode(json), 'single_line_text_field'],
    ['group_no', product.groupNo || '', 'single_line_text_field'],
    ['view_code', product.productViewCode || '', 'single_line_text_field'],
    ['duration_days', String(product.duration?.days ?? product.raw?.tripDay ?? 0), 'number_integer'],
    ['duration_nights', String(product.duration?.nights ?? product.raw?.nightDay ?? 0), 'number_integer'],
    ['departure_city', product.start?.regionName || '', 'single_line_text_field'],
    ['return_city', product.end?.regionName || '', 'single_line_text_field'],
    ['source_url', json.source?.productPageUrl || '', 'url'],
    ['last_extracted_at', json.extractedAt || new Date().toISOString(), 'date_time'],
    ['availability_summary', asJsonMetafieldValue({
      firstAvailableDate: pricing.firstAvailableDate || pricing.availability?.[0]?.date || null,
      dateCount: pricing.availability?.length || 0,
      basePrices: pricing.basePrices || [],
      supportedCurrencies: pricing.supportedCurrencies || [],
    }), 'json'],
  ].filter(([, value]) => value !== '')
    .map(([key, value, type]) => ({ namespace: 'toursbms', key, value: String(value), type }))
}

export function buildProductPayload(json, status = 'DRAFT') {
  const product = json.product || {}
  const mapping = json.shopify_mapping || {}
  const tags = new Set([
    ...(mapping.tags || []),
    'toursbms',
    product.categoryName ? `category:${product.categoryName}` : '',
    product.groupNo ? `group:${product.groupNo}` : '',
    getProductCode(json) ? `code:${getProductCode(json)}` : '',
  ].filter(Boolean))

  return {
    title: getProductTitle(json),
    handle: getProductHandle(json),
    descriptionHtml: mapping.bodyHtml || json.highlights?.html || product.title || '',
    vendor: mapping.vendor || 'ToursBMS',
    productType: mapping.productType || product.categoryName || 'Tour',
    tags: [...tags],
    status,
    metafields: buildProductMetafields(json),
  }
}

export function buildAddonVariantRows(json, existingAddons = []) {
  if (!hasBookableVariants(json)) return []

  const productCode = getProductCode(json)
  const existingByCode = new Map(existingAddons.map((addon) => [addon.code, addon]))
  return (json.addons || []).map((addon) => {
    const code = addon.code || hashHandle(addon.name, 'addon')
    const previous = existingByCode.get(code) || {}
    const amount = Number(addon.amount || 0)
    const chargeable = !isRequestOnlyAddon(addon)
    return {
      code,
      name: addon.name || code,
      description: addon.descriptionText || addon.description || '',
      amount,
      price: moneyValue(chargeable ? amount : 0),
      currency: addon.currency || json?.pricing?.requestedCurrency || 'USD',
      peopleTypeLabel: addon.peopleTypeLabel || 'All',
      chargeable,
      sku: `${productCode}-ADDON-${code}`.toUpperCase(),
      shopifyVariantId: previous.shopifyVariantId || null,
    }
  })
}

export function buildAddonProductPayload(json, addonRows, status = 'ACTIVE') {
  const productCode = getProductCode(json)
  return {
    title: `${productCode} Tour Add-ons`,
    handle: stableHandle(productCode, 'tour-addons'),
    descriptionHtml: `<p>Hidden add-on merchandise for ${productCode}. Do not publish in storefront navigation.</p>`,
    vendor: 'ToursBMS',
    productType: 'Tour Add-on',
    tags: ['toursbms-addon', `parent:${productCode}`, 'hidden'],
    status,
    variants: addonRows.filter((addon) => addon.chargeable),
  }
}

function field(key, value) {
  if (value === undefined || value === null) return null
  return { key, value: typeof value === 'string' ? value : String(value) }
}

function compactFields(fields) {
  return fields.filter(Boolean).filter((item) => item.value !== '')
}

function sectionStopsTitle(stops = []) {
  return stops
    .map((stop) => String(stop?.label || stop?.place || '').trim())
    .filter(Boolean)
    .join(' > ')
}

export function buildMetaobjectEntries(jsonByLocale, syncSeed = {}) {
  const entries = []
  const baseJson = jsonByLocale.en || Object.values(jsonByLocale)[0]
  const productCode = getProductCode(baseJson)
  const addonRows = buildAddonVariantRows(baseJson, syncSeed.addons || [])
  const addonByCode = new Map(addonRows.map((addon) => [addon.code, addon]))

  for (const [locale, json] of Object.entries(jsonByLocale)) {
    const product = json.product || {}
    const mapping = json.shopify_mapping || {}
    const descriptionHtml = mapping.bodyHtml || json.highlights?.html || product.title || ''
    entries.push({
      type: 'tour_content',
      handle: stableHandle(productCode, locale, 'content'),
      fields: compactFields([
        field('product_code', productCode),
        field('locale', locale),
        field('title', getProductTitle(json)),
        field('subtitle', product.subtitle || ''),
        field('description_html', descriptionHtml),
        field('description_text', stripHtml(descriptionHtml)),
      ]),
    })

    for (const [index, text] of (json.highlights?.text || '').split(/\n+/).filter(Boolean).entries()) {
      entries.push({
        type: 'tour_highlight',
        handle: stableHandle(productCode, locale, 'highlight', index + 1),
        fields: compactFields([
          field('product_code', productCode),
          field('locale', locale),
          field('position', index + 1),
          field('text', text.replace(/^[-*]\s*/, '').trim()),
        ]),
      })
    }

    for (const day of json.itinerary?.days || []) {
      entries.push({
        type: 'tour_itinerary_day',
        handle: stableHandle(productCode, locale, 'day', day.dayNumber),
        fields: compactFields([
          field('product_code', productCode),
          field('locale', locale),
          field('day_number', day.dayNumber),
          field('title', sectionStopsTitle(day.sectionStops) || day.section || `Day ${day.dayNumber}`),
          field('route', day.section || ''),
          field('description_html', extractDayDescriptionHtml(day)),
          field('description_text', stripHtml(extractDayDescriptionHtml(day))),
          field('stops_json', asJsonMetafieldValue(day.sectionStops || [])),
          field('images_json', asJsonMetafieldValue(extractDayImages(day))),
          field('hotel', ''),
        ]),
      })
    }

    const cost = json.cost || {}
    for (const section of [
      ['includes', cost.includesHtml, cost.includesText],
      ['excludes', cost.excludesHtml, cost.excludesText],
    ]) {
      entries.push({
        type: 'tour_cost_section',
        handle: stableHandle(productCode, locale, 'cost', section[0]),
        fields: compactFields([
          field('product_code', productCode),
          field('locale', locale),
          field('section', section[0]),
          field('html', section[1] || ''),
          field('text', section[2] || stripHtml(section[1] || '')),
        ]),
      })
    }

    for (const [index, notice] of (json.policy_notice?.notices || []).entries()) {
      entries.push({
        type: 'tour_policy_notice',
        handle: stableHandle(productCode, locale, 'notice', notice.noticeType ?? index, index + 1),
        fields: compactFields([
          field('product_code', productCode),
          field('locale', locale),
          field('notice_type', notice.noticeType ?? index),
          field('type_label', notice.typeLabel || ''),
          field('matter_name', notice.matterName || ''),
          field('html', notice.html?.primary || notice.html?.secondary || ''),
          field('text', notice.text?.primary || notice.text?.secondary || ''),
        ]),
      })
    }

    for (const kind of ['pickup', 'dropoff']) {
      for (const point of json.pickup_dropoff?.[kind] || []) {
        entries.push({
          type: 'tour_pickup_dropoff',
          handle: stableHandle(productCode, locale, kind, point.code || point.name),
          fields: compactFields([
            field('product_code', productCode),
            field('locale', locale),
            field('kind', kind),
            field('code', point.code || ''),
            field('name', point.name || ''),
            field('address', point.address || ''),
            field('description', point.descriptionText || point.description || ''),
            field('is_airport', Boolean(point.isAirport)),
          ]),
        })
      }
    }

    if (addonRows.length > 0) {
      for (const addon of json.addons || []) {
        const code = addon.code || hashHandle(addon.name, 'addon')
        const addonRow = addonByCode.get(code)
        entries.push({
          type: 'tour_addon',
          handle: stableHandle(productCode, locale, 'addon', code),
          fields: compactFields([
            field('product_code', productCode),
            field('locale', locale),
            field('code', code),
            field('name', addon.name || ''),
            field('description', addon.descriptionText || addon.description || ''),
            field('amount', Number(addon.amount || 0).toFixed(2)),
            field('currency', addon.currency || 'USD'),
            field('people_type', addon.peopleTypeLabel || 'All'),
            field('chargeable', Boolean(addonRow?.chargeable)),
            field('shopify_variant_id', addonRow?.shopifyVariantId || ''),
          ]),
        })
      }
    }
  }

  for (const departure of baseJson.pricing?.availability || []) {
    entries.push({
      type: 'tour_departure',
      handle: stableHandle(productCode, 'departure', departure.date),
      fields: compactFields([
        field('product_code', productCode),
        field('date', departure.date),
        field('status', departure.stockStatus === 200 ? 'open' : 'closed'),
        field('remaining_stock', Number(departure.remainingStock ?? departure.groupStock ?? 0)),
        field('currency', departure.currency || baseJson.pricing?.requestedCurrency || 'USD'),
        field('prices_json', asJsonMetafieldValue(departure.prices || [])),
        field('variant_ids_json', asJsonMetafieldValue({})),
      ]),
    })
  }

  return entries
}

export function buildImageSyncRows(json, existingImages = []) {
  return buildProductImages(json, existingImages)
}

export function buildManifestSkeleton({ jsonByLocale, existingManifest = {}, status = 'DRAFT' }) {
  const baseJson = jsonByLocale.en || Object.values(jsonByLocale)[0]
  const variants = buildTourVariants(baseJson)
  const addons = buildAddonVariantRows(baseJson, existingManifest.addons || [])
  const warnings = [...(existingManifest.warnings || [])]
  if (variants.length === 0) {
    warnings.push('No ToursBMS departure-price variants were extracted; synced product content without date/rate variants.')
    warnings.push('Skipped optional add-ons because the product has no bookable departure-price variants.')
  }
  return {
    productCode: getProductCode(baseJson),
    handle: getProductHandle(baseJson),
    shopifyProductId: existingManifest.shopifyProductId || null,
    shopifyAddonProductId: existingManifest.shopifyAddonProductId || null,
    status,
    locales: Object.keys(jsonByLocale),
    syncedAt: null,
    variants: variants.map((variant) => ({
      ...variant,
      shopifyVariantId: existingManifest.variants?.find?.(
        (item) => item.date === variant.date && Number(item.priceType) === variant.priceType,
      )?.shopifyVariantId || null,
    })),
    addons,
    images: buildImageSyncRows(baseJson, existingManifest.images || []),
    metaobjects: existingManifest.metaobjects || {},
    publication: existingManifest.publication || null,
    warnings,
  }
}

export function buildDryRunPayload(jsonByLocale, existingManifest = {}, status = 'DRAFT') {
  const baseJson = jsonByLocale.en || Object.values(jsonByLocale)[0]
  const manifest = buildManifestSkeleton({ jsonByLocale, existingManifest, status })
  return {
    product: buildProductPayload(baseJson, status),
    variants: manifest.variants,
    addonProduct: buildAddonProductPayload(baseJson, manifest.addons),
    images: manifest.images,
    metaobjectDefinitions: METAOBJECT_DEFINITIONS,
    metaobjects: buildMetaobjectEntries(jsonByLocale, manifest),
    manifest,
  }
}

export function extractDayDescriptionHtml(day) {
  const blocks = []
  const visit = (value, seen = new Set()) => {
    if (!value || typeof value !== 'object' || seen.has(value)) return
    seen.add(value)
    if (Array.isArray(value)) {
      for (const item of value) visit(item, seen)
      return
    }
    if (typeof value.description === 'string' && value.description.trim()) {
      blocks.push(value.description.trim())
    }
    for (const child of Object.values(value)) visit(child, seen)
  }

  for (const content of day.content || []) visit(content.decodedJson)
  return [...new Set(blocks)].join('\n')
}

export function extractDayImages(day) {
  const images = new Map()
  const normalize = (src) => {
    if (typeof src !== 'string' || !src.trim()) return ''
    const value = src.trim()
    if (/^https?:\/\//i.test(value)) return value
    if (value.startsWith('//')) return `https:${value}`
    if (/^[\w-]+\.(?:jpe?g|png|webp|gif)$/i.test(value)) return `https://dimg04.c-ctrip.com/target/${value}`
    return ''
  }
  const visit = (value, seen = new Set()) => {
    if (!value || typeof value !== 'object' || seen.has(value)) return
    seen.add(value)
    if (Array.isArray(value)) {
      for (const item of value) visit(item, seen)
      return
    }
    for (const key of ['imageUrl', 'url', 'src', 'image', 'scenicImage']) {
      const src = normalize(value[key])
      if (src) images.set(src, { src, alt: value.name || value.scenicName || '' })
    }
    for (const child of Object.values(value)) visit(child, seen)
  }
  for (const content of day.content || []) visit(content.decodedJson)
  return [...images.values()]
}

export function stripHtml(html = '') {
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
