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
      ['pricing_mode', 'Pricing mode', 'single_line_text_field'],
      ['stock_type', 'Stock type', 'number_integer'],
      ['source_stock', 'Source stock', 'number_integer'],
      ['sold_stock', 'Sold stock', 'number_integer'],
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

const PRODUCT_FORM_LABELS = {
  1: 'package-tour',
  2: 'diy-tour',
  3: 'private-group',
  4: 'free-day',
  5: 'one-day-tour',
  6: 'customized-tour',
}

export function isSyncOwnedProductTag(tag) {
  const value = String(tag || '').toLowerCase()
  return ['tour', 'toursbms', 'bookable', 'content-only', 'day-trip', 'group-tour'].includes(value)
    || ['category-', 'dest-', 'duration-', 'region-', 'type-', 'country-', 'city-', 'product-type-', 'confirm-', 'category:', 'group:', 'code:'].some((prefix) => value.startsWith(prefix))
}

export function mergeSyncedProductTags(existingTags = [], syncedTags = []) {
  return [...new Set([...existingTags.filter((tag) => !isSyncOwnedProductTag(tag)), ...syncedTags].filter(Boolean))]
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
  if (includesAny(text, ['united states', 'usa', 'new york', 'yellowstone', 'los angeles', 'san francisco', 'seattle', 'alaska', 'hawaii', '美国', '美國', '纽约', '紐約', '黄石', '黃石', '阿拉斯加', '夏威夷'])) addTag(tags, 'region-united-states')
  if (includesAny(text, ['canada', 'calgary', 'banff', 'vancouver', 'toronto', 'jasper', '加拿大', '卡尔加里', '卡爾加里', '班芙', '温哥华', '溫哥華', '多伦多', '多倫多'])) {
    addTag(tags, 'region-canada')
    addTag(tags, 'region-north-america')
  }
  if (includesAny(text, ['japan', 'korea', 'singapore', 'malaysia', 'taiwan', 'maldives', '日本', '韩国', '韓國', '新加坡', '马来西亚', '馬來西亞', '台湾', '台灣', '马尔代夫', '馬爾代夫'])) addTag(tags, 'region-asia')
  if (includesAny(text, ['australia', 'new zealand', 'oceania', '澳大利亚', '澳大利亞', '澳洲', '新西兰', '紐西蘭'])) addTag(tags, 'region-oceania')
  if (includesAny(text, ['africa', 'egypt', 'morocco', 'kenya', 'south africa', '非洲', '埃及', '摩洛哥', '肯尼亚', '肯亞', '南非'])) addTag(tags, 'region-africa')
  if (includesAny(text, ['middle east', 'dubai', 'israel', 'jordan', '中东', '中東', '迪拜', '以色列', '约旦', '約旦'])) addTag(tags, 'region-middle-east')

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
    const sourcePrices = (departure.prices || []).filter((price) => price?.label && Number(price.amount))
    const roomMode = departure.isGroupRoom != null
      ? Boolean(departure.isGroupRoom)
      : json?.pricing?.pricingMode === 'room_occupancy' || sourcePrices.some((price) => ADULT_PRICE_TYPES.has(Number(price.priceType)))
    const genericChild = sourcePrices.find((price) => Number(price.priceType) === 2)
    const normalizedPrices = roomMode
      ? sourcePrices.filter((price) => ADULT_PRICE_TYPES.has(Number(price.priceType))).flatMap((roomPrice) => [
          { ...roomPrice, travelerType: 'adult', variantLabel: `${String(roomPrice.label).trim()} · Adult` },
          ...(genericChild ? [{ ...genericChild, priceType: Number(roomPrice.priceType), label: roomPrice.label, travelerType: 'child', variantLabel: `${String(roomPrice.label).trim()} · Child` }] : []),
        ])
      : sourcePrices.map((price) => ({
          ...price,
          travelerType: Number(price.priceType) === 1 ? 'adult' : Number(price.priceType) === 2 ? 'child' : Number(price.priceType) === 7 ? 'senior' : undefined,
          variantLabel: String(price.label).trim(),
        }))
    for (const price of normalizedPrices) {
      variants.push({
        date: departure.date,
        priceType: Number(price.priceType || 0),
        travelerType: price.travelerType,
        roomType: roomMode ? String(price.label).trim() : undefined,
        label: price.variantLabel,
        optionValues: {
          'Departure Date': departure.date,
          'Rate Type': price.variantLabel,
        },
        sku: `${productCode}-${departure.date}-${price.priceType}-${price.travelerType || slugify(price.label)}`.toUpperCase(),
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
    ...(product.location?.cities || []),
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
  if (product.location?.primaryCountry) return product.location.primaryCountry
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

export function buildFilterFacets(json) {
  const product = json?.product || {}
  const availability = Array.isArray(json?.pricing?.availability) ? json.pricing.availability : []
  const durationDays = Number(product.duration?.days ?? product.raw?.tripDay ?? 0)
  const productForm = Number(product.productForm ?? product.raw?.productForm ?? 0)
  const transfers = uniqueStrings(product.transfers || []).map((value) => tagSlug(value))
  const confirmMethod = inferConfirmMethod(json)
  const manualLabels = uniqueStrings(json?.shopify_mapping?.filterLabels || json?.shopify_mapping?.labels || [])
  return {
    version: 1,
    productTypes: uniqueStrings([product.categoryName]),
    departureCountries: uniqueStrings(product.location?.countries?.length ? product.location.countries : [inferCountry(product)]),
    departureCities: uniqueStrings(product.location?.cities?.length ? product.location.cities : [product.start?.regionName]),
    returnCities: uniqueStrings([product.end?.regionName]),
    destinations: destinationNames(product),
    labels: manualLabels,
    durationDays: Number.isFinite(durationDays) && durationDays > 0 ? durationDays : null,
    departureDates: uniqueStrings(availability.filter((item) => item?.stockStatus === 200 && item?.date).map((item) => item.date)).sort(),
    transfers,
    tourFormats: uniqueStrings([PRODUCT_FORM_LABELS[productForm] || inferProductType(product, buildTourVariants(json))]),
    confirmMethods: uniqueStrings([confirmMethod]),
  }
}

const SEARCH_ALIAS_EXPANSIONS = {
  'region-north-america': ['Americas', 'North America', '美洲', '北美洲', '北美热门线路', '北美熱門線路'],
  'region-united-states': ['United States', 'USA', '美国', '美國'],
  'region-canada': ['Canada', '加拿大'],
  'region-latin-america': ['Americas', 'Latin America', 'South America', '拉丁美洲', '南美洲'],
  'region-europe': ['Europe', '欧洲', '歐洲'],
  'region-asia': ['Asia', '亚洲', '亞洲'],
  'region-oceania': ['Oceania', 'Australia', 'New Zealand', '大洋洲', '澳大利亚', '澳大利亞', '新西兰', '紐西蘭'],
  'region-africa': ['Africa', '非洲'],
  'region-middle-east': ['Middle East', '中东', '中東'],
  'type-private': ['Private Tours', 'Private', '私家包团', '私家包團'],
  'type-platinum': ['Platinum Tours', 'Platinum', '白金尊享'],
  'duration-1-day': ['Day Tours', 'Day Trip', '一日游', '一日遊', '一日游与短线', '一日遊與短線'],
}

export function buildSearchAliases(jsonByLocale) {
  const localized = jsonByLocale && !jsonByLocale.product ? Object.values(jsonByLocale) : [jsonByLocale]
  const aliases = []
  const discoveryTags = new Set()

  for (const json of localized.filter(Boolean)) {
    const product = json.product || {}
    const facets = buildFilterFacets(json)
    const tags = buildDiscoveryTags(json)
    tags.forEach((tag) => discoveryTags.add(tag))
    aliases.push(
      getProductCode(json),
      getProductHandle(json),
      getProductTitle(json),
      product.subtitle,
      product.groupNo,
      product.categoryName,
      product.start?.regionName,
      product.end?.regionName,
      ...(json.shopify_mapping?.tags || []),
      ...tags,
      ...tags.map((tag) => tag.replace(/-/g, ' ')),
      ...facets.productTypes,
      ...facets.departureCountries,
      ...facets.departureCities,
      ...facets.returnCities,
      ...facets.destinations,
      ...facets.labels,
      ...facets.tourFormats,
      ...destinationNames(product),
    )
  }

  for (const tag of discoveryTags) aliases.push(...(SEARCH_ALIAS_EXPANSIONS[tag] || []))
  return uniqueStrings(aliases)
}

export function buildProductMetafields(json, jsonByLocale = { en: json }) {
  const product = json.product || {}
  const pricing = json.pricing || {}
  const variants = buildTourVariants(json)
  const tags = buildDiscoveryTags(json)
  const prices = priceRangeFromVariants(variants, pricing)
  const departures = departureRange(pricing.availability || [])
  const destinations = destinationNames(product)
  const countries = uniqueStrings(product.location?.countries || [inferCountry(product)])
  const cities = uniqueStrings(product.location?.cities || [product.start?.regionName || destinations[0]])
  const pricingMode = pricing.pricingMode
    || (pricing.availability?.some((day) => day.isGroupRoom) || variants.some((variant) => ADULT_PRICE_TYPES.has(Number(variant.priceType))) ? 'room_occupancy' : 'per_person')
  const rateTemplate = [...new Map(variants.map((variant) => {
    const rateType = variant.roomType || variant.label
    const travelerType = variant.travelerType || (variant.priceType === 2 ? 'child' : variant.priceType === 7 ? 'senior' : 'adult')
    const item = { rateType, travelerType }
    return [`${rateType}:${travelerType}`, item]
  })).values()]
  return [
    ['product_code', getProductCode(json), 'single_line_text_field'],
    ['group_no', product.groupNo || '', 'single_line_text_field'],
    ['view_code', product.productViewCode || '', 'single_line_text_field'],
    ['duration_days', String(product.duration?.days ?? product.raw?.tripDay ?? 0), 'number_integer'],
    ['duration_nights', String(product.duration?.nights ?? product.raw?.nightDay ?? 0), 'number_integer'],
    ['departure_city', product.start?.regionName || '', 'single_line_text_field'],
    ['return_city', product.end?.regionName || '', 'single_line_text_field'],
    ['country', product.location?.primaryCountry || inferCountry(product), 'single_line_text_field'],
    ['city', product.location?.primaryCity || product.start?.regionName || destinations[0] || '', 'single_line_text_field'],
    ['countries', asJsonMetafieldValue(countries), 'json'],
    ['cities', asJsonMetafieldValue(cities), 'json'],
    ['destinations', asJsonMetafieldValue(destinations), 'json'],
    ['labels', asJsonMetafieldValue(discoveryLabels(tags)), 'json'],
    ['search_aliases', asJsonMetafieldValue(buildSearchAliases(jsonByLocale)), 'json'],
    ['filter_facets', asJsonMetafieldValue(buildFilterFacets(json)), 'json'],
    ['min_price', prices.min, 'number_decimal'],
    ['max_price', prices.max, 'number_decimal'],
    ['earliest_departure', departures.earliest, 'date'],
    ['latest_departure', departures.latest, 'date'],
    ['product_type', inferProductType(product, variants), 'single_line_text_field'],
    ['confirm_method', inferConfirmMethod(json), 'single_line_text_field'],
    ['pricing_mode', pricingMode, 'single_line_text_field'],
    ['rate_template', asJsonMetafieldValue(rateTemplate), 'json'],
    ['bookable', variants.length > 0 ? 'true' : 'false', 'boolean'],
    ['last_synced_at', new Date().toISOString(), 'date_time'],
    ['source_url', json.source?.productPageUrl || '', 'url'],
    ['last_extracted_at', json.extractedAt || new Date().toISOString(), 'date_time'],
    ['availability_summary', asJsonMetafieldValue({
      pricingMode,
      firstAvailableDate: pricing.firstAvailableDate || pricing.availability?.[0]?.date || null,
      dateCount: pricing.availability?.length || 0,
      basePrices: pricing.basePrices || [],
      supportedCurrencies: pricing.supportedCurrencies || [],
      departureDates: buildFilterFacets(json).departureDates,
    }), 'json'],
  ].filter(([, value]) => value !== '')
    .map(([key, value, type]) => ({ namespace: 'toursbms', key, value: String(value), type }))
}

export function buildProductPayload(json, status = 'DRAFT', jsonByLocale = { en: json }) {
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
    metafields: buildProductMetafields(json, jsonByLocale),
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
    const variantIds = Object.fromEntries((syncSeed.variants || [])
      .filter((variant) => variant.date === departure.date && variant.shopifyVariantId)
      .map((variant) => [`${variant.priceType}:${variant.travelerType || 'rate'}`, variant.shopifyVariantId]))
    entries.push({
      type: 'tour_departure',
      handle: stableHandle(productCode, 'departure', departure.date),
      fields: compactFields([
        field('product_code', productCode),
        field('date', departure.date),
        field('status', departure.stockStatus === 200 ? 'open' : 'closed'),
        field('remaining_stock', Number(departure.remainingStock ?? departure.groupStock ?? 0)),
        field('currency', departure.currency || baseJson.pricing?.requestedCurrency || 'USD'),
        field('pricing_mode', departure.isGroupRoom ? 'room_occupancy' : 'per_person'),
        field('stock_type', Number(departure.stockType || 0)),
        field('source_stock', Number(departure.groupStock || 0)),
        field('sold_stock', Number(departure.groupSaleStock || 0)),
        field('prices_json', asJsonMetafieldValue(buildTourVariants(baseJson).filter((variant) => variant.date === departure.date).map(({ priceType, travelerType, roomType, price }) => ({ priceType, travelerType, label: roomType, amount: Number(price) })))),
        field('variant_ids_json', asJsonMetafieldValue(variantIds)),
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
        (item) => item.date === variant.date && Number(item.priceType) === variant.priceType && (item.travelerType || 'adult') === (variant.travelerType || 'adult'),
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
    product: buildProductPayload(baseJson, status, jsonByLocale),
    variants: manifest.variants,
    addonProduct: buildAddonProductPayload(baseJson, manifest.addons),
    images: manifest.images,
    metaobjectDefinitions: METAOBJECT_DEFINITIONS,
    metaobjects: buildMetaobjectEntries(jsonByLocale, manifest),
    manifest,
  }
}

export function nonShippableInventoryItemInput() {
  return { requiresShipping: false }
}

export function buildTourVariantMetafields(ownerId, variant) {
  return [
    { ownerId, namespace: 'toursbms', key: 'departure_date', type: 'single_line_text_field', value: variant.date },
    { ownerId, namespace: 'toursbms', key: 'price_type', type: 'number_integer', value: String(variant.priceType) },
    ...(variant.travelerType
      ? [{ ownerId, namespace: 'toursbms', key: 'traveler_type', type: 'single_line_text_field', value: variant.travelerType }]
      : []),
  ]
}

export function buildAddonVariantMetafields(ownerId, addon) {
  return [
    { ownerId, namespace: 'toursbms', key: 'addon_code', type: 'single_line_text_field', value: addon.code },
  ]
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
