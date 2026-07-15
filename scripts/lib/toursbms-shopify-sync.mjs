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

function tagSlug(input) {
  return String(input || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function includesAny(text, values) {
  return values.some((value) => text.includes(value.toLowerCase()))
}

function addTag(tags, value) {
  if (value) tags.add(value)
}

export function buildDiscoveryTags(json) {
  const tags = new Set(['tour'])
  const product = json?.product || {}
  const rawText = [
    product.title,
    product.subtitle,
    product.categoryName,
    product.start?.regionName,
    product.end?.regionName,
    ...(product.destinations || []).map((destination) => destination.spotName),
  ].filter(Boolean).join(' ')
  const text = rawText.toLowerCase()
  const days = Number(product.duration?.days ?? product.raw?.tripDay ?? 0)
  const category = tagSlug(product.categoryName)
  const start = tagSlug(product.start?.regionName)
  const end = tagSlug(product.end?.regionName)

  addTag(tags, category ? `category-${category}` : '')
  addTag(tags, start ? `dest-${start}` : '')
  addTag(tags, end && end !== start ? `dest-${end}` : '')
  if (days > 0) addTag(tags, `duration-${days}-day${days === 1 ? '' : 's'}`)
  if (days > 0 && days <= 2) addTag(tags, 'duration-short')

  if (includesAny(text, ['cancun', 'cancún', '坎昆'])) addTag(tags, 'dest-cancun')
  if (includesAny(text, ['new york', '纽约', '紐約'])) addTag(tags, 'dest-new-york')
  if (includesAny(text, ['yellowstone', '黄石', '黃石'])) addTag(tags, 'dest-yellowstone')
  if (includesAny(text, ['calgary', 'banff', 'rockies', '卡尔加里', '卡爾加里', '班芙', '落基'])) addTag(tags, 'dest-calgary')
  if (includesAny(text, ['alaska', 'anchorage', 'fairbanks', '阿拉斯加', '安克雷奇', '费尔班克斯'])) addTag(tags, 'dest-alaska')
  if (includesAny(text, ['china', 'beijing', 'shanghai', 'xian', '中国', '中國', '北京', '上海', '西安'])) addTag(tags, 'dest-china')
  if (includesAny(text, ['peru', 'machu picchu', 'cusco', '秘鲁', '秘魯', '马丘比丘', '馬丘比丘'])) addTag(tags, 'dest-peru')
  if (includesAny(text, ['salt lake', '盐湖城', '鹽湖城'])) addTag(tags, 'dest-salt-lake-city')

  if (includesAny(text, ['mexico', 'cancun', 'peru', 'chile', 'argentina', 'costa rica', 'colombia', '秘鲁', '智利'])) {
    addTag(tags, 'region-latin-america')
  }
  if (includesAny(text, ['europe', 'spain', 'greece', 'switzerland', 'iceland', '欧洲', '歐洲', '西班牙', '希腊', '希臘'])) {
    addTag(tags, 'region-europe')
  }
  if (includesAny(text, ['china', 'vietnam', 'thailand', '中国', '中國', '越南', '泰国', '泰國'])) {
    addTag(tags, 'region-asia')
  }
  if (includesAny(text, ['new york', 'yellowstone', 'calgary', 'alaska', 'los angeles', 'san francisco', 'seattle', '纽约', '黄石', '卡尔加里', '阿拉斯加'])) {
    addTag(tags, 'region-north-america')
  }

  if (includesAny(text, ['白金尊享', 'platinum', 'premium'])) addTag(tags, 'type-platinum')
  if (includesAny(text, ['金榜怡享', 'gold'])) addTag(tags, 'type-gold')
  if (includesAny(text, ['银榜惠享', '銀榜惠享', 'silver'])) addTag(tags, 'type-silver')
  if (includesAny(text, ['私家包团', '私家包團', 'private'])) addTag(tags, 'type-private')
  if (includesAny(text, ['边边游', '邊邊遊'])) addTag(tags, 'type-local')

  if (days === 1) addTag(tags, 'day-trip')
  if (days > 1) addTag(tags, 'group-tour')

  return [...tags]
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

function uniqueStrings(values) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))]
}

function destinationNames(product) {
  return uniqueStrings([
    product.start?.regionName,
    ...(product.destinations || []).flatMap((destination) => [
      destination.spotName,
      destination.scenicName,
      destination.provinceName,
      destination.cityName,
    ]),
    product.end?.regionName,
  ])
}

function inferCountry(product) {
  const text = [
    product.title,
    product.categoryName,
    product.start?.regionName,
    product.end?.regionName,
    ...destinationNames(product),
  ].filter(Boolean).join(' ').toLowerCase()

  if (includesAny(text, ['cancun', 'mexico', 'chich', 'xcaret', 'tulum', 'åŽæ˜†', 'å¢¨è¥¿å“¥'])) return 'Mexico'
  if (includesAny(text, ['canada', 'calgary', 'banff', 'vancouver', 'toronto', 'rockies', 'åŠ æ‹¿å¤§', 'å¡å°”åŠ é‡Œ', 'å¡çˆ¾åŠ é‡Œ', 'æ¸©å“¥åŽ', 'æº«å“¥è¯'])) return 'Canada'
  if (includesAny(text, ['united states', 'usa', 'new york', 'yellowstone', 'los angeles', 'san francisco', 'alaska', 'washington', 'salt lake', 'ç¾Žå›½', 'ç¾Žåœ‹', 'çº½çº¦', 'ç´ç´„'])) return 'United States'
  if (includesAny(text, ['china', 'beijing', 'shanghai', 'xian', 'ä¸­å›½', 'ä¸­åœ‹', 'åŒ—äº¬', 'ä¸Šæµ·'])) return 'China'
  if (includesAny(text, ['peru', 'machu picchu', 'cusco', 'ç§˜é²', 'ç§˜é­¯'])) return 'Peru'
  if (includesAny(text, ['europe', 'spain', 'greece', 'switzerland', 'iceland', 'æ¬§æ´²', 'æ­æ´²'])) return 'Europe'
  return product.categoryName || ''
}

function inferProductType(product, variants) {
  const text = `${product.title || ''} ${product.categoryName || ''}`.toLowerCase()
  const days = Number(product.duration?.days ?? product.raw?.tripDay ?? 0)
  if (includesAny(text, ['private', 'ç§å®¶åŒ…å›¢', 'ç§å®¶åŒ…åœ˜'])) return 'private'
  if (days === 1) return 'day-tour'
  if (variants.length === 0) return 'content-only'
  return 'group-tour'
}

function inferConfirmMethod(json) {
  const raw = json?.constraints?.confirmType ?? json?.departure?.confirmType ?? json?.product?.raw?.confirmType
  if (raw === 1 || raw === '1') return 'manual'
  if (raw === 2 || raw === '2') return 'instant'
  return ''
}

function priceRangeFromVariants(variants, pricing) {
  const amounts = variants.map((variant) => Number(variant.price)).filter((amount) => Number.isFinite(amount) && amount > 0)
  for (const price of pricing.basePrices || []) {
    const amount = Number(price.amount)
    if (Number.isFinite(amount) && amount > 0) amounts.push(amount)
  }
  if (amounts.length === 0) return { min: '', max: '' }
  return {
    min: Math.min(...amounts).toFixed(2),
    max: Math.max(...amounts).toFixed(2),
  }
}

function departureRange(availability = []) {
  const dates = availability.map((departure) => departure?.date).filter(Boolean).sort()
  return {
    earliest: dates[0] || '',
    latest: dates[dates.length - 1] || '',
  }
}

function discoveryLabels(tags) {
  return tags
    .filter((tag) => tag.startsWith('type-') || tag.startsWith('region-') || tag.startsWith('dest-'))
    .map((tag) => tag.replace(/-/g, ' '))
}

export function buildProductMetafields(json) {
  const product = json.product || {}
  const pricing = json.pricing || {}
  const variants = buildTourVariants(json)
  const tags = buildDiscoveryTags(json)
  const prices = priceRangeFromVariants(variants, pricing)
  const departures = departureRange(pricing.availability || [])
  const destinations = destinationNames(product)
  return [
    ['product_code', getProductCode(json), 'single_line_text_field'],
    ['group_no', product.groupNo || '', 'single_line_text_field'],
    ['view_code', product.productViewCode || '', 'single_line_text_field'],
    ['duration_days', String(product.duration?.days ?? product.raw?.tripDay ?? 0), 'number_integer'],
    ['duration_nights', String(product.duration?.nights ?? product.raw?.nightDay ?? 0), 'number_integer'],
    ['departure_city', product.start?.regionName || '', 'single_line_text_field'],
    ['return_city', product.end?.regionName || '', 'single_line_text_field'],
    ['country', inferCountry(product), 'single_line_text_field'],
    ['city', product.start?.regionName || destinations[0] || '', 'single_line_text_field'],
    ['destinations', asJsonMetafieldValue(destinations), 'json'],
    ['labels', asJsonMetafieldValue(discoveryLabels(tags)), 'json'],
    ['min_price', prices.min, 'number_decimal'],
    ['max_price', prices.max, 'number_decimal'],
    ['earliest_departure', departures.earliest, 'date'],
    ['latest_departure', departures.latest, 'date'],
    ['product_type', inferProductType(product, variants), 'single_line_text_field'],
    ['confirm_method', inferConfirmMethod(json), 'single_line_text_field'],
    ['bookable', variants.length > 0 ? 'true' : 'false', 'boolean'],
    ['last_synced_at', new Date().toISOString(), 'date_time'],
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
  const variants = buildTourVariants(json)
  const country = inferCountry(product)
  const city = product.start?.regionName || destinationNames(product)[0] || ''
  const type = inferProductType(product, variants)
  const confirmMethod = inferConfirmMethod(json)
  const tags = new Set([
    ...(mapping.tags || []),
    ...buildDiscoveryTags(json),
    'toursbms',
    country ? `country-${tagSlug(country)}` : '',
    city ? `city-${tagSlug(city)}` : '',
    type ? `product-type-${tagSlug(type)}` : '',
    confirmMethod ? `confirm-${tagSlug(confirmMethod)}` : '',
    variants.length > 0 ? 'bookable' : 'content-only',
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
