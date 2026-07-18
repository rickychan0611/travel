import type {
  TourAddon,
  TourAvailabilityDay,
  TourDetailData,
  TourItineraryDay,
  TourItineraryStop,
  TourNotice,
  TourPickupPoint,
  TourPrice,
} from '@/lib/toursbms/types'

const TOUR_PRODUCT_QUERY = `#graphql
  query TourProduct($id: ID!, $variantsAfter: String) {
    product(id: $id) {
      id
      handle
      title
      descriptionHtml
      tags
      productType
      vendor
      status
      media(first: 30) {
        nodes {
          ... on MediaImage {
            id
            image {
              url
              altText
            }
          }
        }
      }
      variants(first: 250, after: $variantsAfter) {
        nodes {
          id
          title
          sku
          price
          inventoryQuantity
          selectedOptions {
            name
            value
          }
          priceType: metafield(namespace: "toursbms", key: "price_type") {
            value
          }
          travelerType: metafield(namespace: "toursbms", key: "traveler_type") {
            value
          }
          departureDate: metafield(namespace: "toursbms", key: "departure_date") {
            value
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
      productCode: metafield(namespace: "toursbms", key: "product_code") { value }
      groupNo: metafield(namespace: "toursbms", key: "group_no") { value }
      viewCode: metafield(namespace: "toursbms", key: "view_code") { value }
      durationDays: metafield(namespace: "toursbms", key: "duration_days") { value }
      durationNights: metafield(namespace: "toursbms", key: "duration_nights") { value }
      departureCity: metafield(namespace: "toursbms", key: "departure_city") { value }
      returnCity: metafield(namespace: "toursbms", key: "return_city") { value }
      availabilitySummary: metafield(namespace: "toursbms", key: "availability_summary") { value }
      contentRefs: metafield(namespace: "toursbms", key: "content") {
        references(first: 20) { nodes { ...MetaobjectFields } }
      }
      highlightRefs: metafield(namespace: "toursbms", key: "highlight") {
        references(first: 250) { nodes { ...MetaobjectFields } }
      }
      itineraryDayRefs: metafield(namespace: "toursbms", key: "itinerary_day") {
        references(first: 250) { nodes { ...MetaobjectFields } }
      }
      costSectionRefs: metafield(namespace: "toursbms", key: "cost_section") {
        references(first: 250) { nodes { ...MetaobjectFields } }
      }
      policyNoticeRefs: metafield(namespace: "toursbms", key: "policy_notice") {
        references(first: 250) { nodes { ...MetaobjectFields } }
      }
      pickupDropoffRefs: metafield(namespace: "toursbms", key: "pickup_dropoff") {
        references(first: 250) { nodes { ...MetaobjectFields } }
      }
      addonRefs: metafield(namespace: "toursbms", key: "addon") {
        references(first: 250) { nodes { ...MetaobjectFields } }
      }
      departureRefs: metafield(namespace: "toursbms", key: "departure") {
        references(first: 250) { nodes { ...MetaobjectFields } }
      }
    }
  }

  fragment MetaobjectFields on Metaobject {
    id
    handle
    type
    fields {
      key
      value
      type
    }
  }
`

type ShopifyTourProductResponse = {
  product: ShopifyTourProduct | null
}

type ShopifyTourProduct = {
  id: string
  handle: string
  title: string
  descriptionHtml: string
  tags: string[]
  productType: string
  vendor: string
  status: string
  media: { nodes: Array<{ id?: string; image?: { url: string; altText: string | null } | null }> }
  variants: {
    nodes: ShopifyVariant[]
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
  }
  productCode?: { value: string } | null
  groupNo?: { value: string } | null
  viewCode?: { value: string } | null
  durationDays?: { value: string } | null
  durationNights?: { value: string } | null
  departureCity?: { value: string } | null
  returnCity?: { value: string } | null
  availabilitySummary?: { value: string } | null
  contentRefs?: MetaobjectReferenceConnection | null
  highlightRefs?: MetaobjectReferenceConnection | null
  itineraryDayRefs?: MetaobjectReferenceConnection | null
  costSectionRefs?: MetaobjectReferenceConnection | null
  policyNoticeRefs?: MetaobjectReferenceConnection | null
  pickupDropoffRefs?: MetaobjectReferenceConnection | null
  addonRefs?: MetaobjectReferenceConnection | null
  departureRefs?: MetaobjectReferenceConnection | null
}

type ShopifyVariant = {
  id: string
  title: string
  sku?: string | null
  price: string
  inventoryQuantity: number | null
  selectedOptions: Array<{ name: string; value: string }>
  priceType?: { value: string } | null
  travelerType?: { value: string } | null
  departureDate?: { value: string } | null
}

type MetaobjectReferenceConnection = {
  references?: {
    nodes: MetaobjectNode[]
  } | null
}

type MetaobjectNode = {
  id: string
  handle: string
  type: string
  fields: Array<{ key: string; value: string | null; type: string }>
}

type ShopifyClientLike = {
  request<T>(
    query: string,
    options?: {
      variables?: Record<string, unknown>
      cache?: RequestCache
      next?: { revalidate?: number | false; tags?: string[] }
    },
  ): Promise<{ data?: T; errors?: unknown }>
}

type SyncManifest = {
  productCode?: string
  handle?: string
  shopifyProductId?: string
}

const RATE_LABEL_TO_PRICE_TYPE: Record<string, number> = {
  adult: 1,
  child: 2,
  'single room': 3,
  'double room': 4,
  'triple room': 5,
  'quad room': 6,
}

function metaValue(value?: { value: string } | null) {
  return value?.value ?? ''
}

function numberValue(value?: string | null, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function htmlToText(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function metaobjects(connection?: MetaobjectReferenceConnection | null) {
  return connection?.references?.nodes ?? []
}

function fieldsOf(node: MetaobjectNode) {
  return Object.fromEntries(node.fields.map((field) => [field.key, field.value ?? '']))
}

function localeMatches(fields: Record<string, string>, locale: string) {
  return !fields.locale || fields.locale === locale
}

function localizedMetaobjects(connection: MetaobjectReferenceConnection | null | undefined, locale: string) {
  const nodes = metaobjects(connection)
  const exact = nodes.filter((node) => localeMatches(fieldsOf(node), locale))
  if (exact.length > 0) return exact
  const english = nodes.filter((node) => fieldsOf(node).locale === 'en')
  return english.length > 0 ? english : nodes
}

function selectedOption(variant: ShopifyVariant, name: string) {
  return variant.selectedOptions.find((option) => option.name === name)?.value ?? ''
}

function priceTypeFromVariant(variant: ShopifyVariant) {
  const explicit = Number(variant.priceType?.value)
  if (Number.isFinite(explicit) && explicit > 0) return explicit
  return RATE_LABEL_TO_PRICE_TYPE[selectedOption(variant, 'Rate Type').toLowerCase()] ?? 0
}

function travelerTypeFromVariant(variant: ShopifyVariant): TourPrice['travelerType'] {
  const explicit = variant.travelerType?.value
  if (explicit === 'adult' || explicit === 'child' || explicit === 'senior') return explicit
  const label = selectedOption(variant, 'Rate Type')
  if (/\s[·-]\sChild$/i.test(label)) return 'child'
  if (/\s[·-]\sSenior$/i.test(label)) return 'senior'
  if (/\s[·-]\sAdult$/i.test(label)) return 'adult'
  const priceType = priceTypeFromVariant(variant)
  if (priceType >= 3 && priceType <= 6) return 'adult'
  if (priceType === 1) return 'adult'
  if (priceType === 2) return 'child'
  if (priceType === 7) return 'senior'
  return undefined
}

function buildAvailability(product: ShopifyTourProduct, departureRows: MetaobjectNode[], currency: string): TourAvailabilityDay[] {
  const departuresByDate = new Map(departureRows.map((node) => [fieldsOf(node).date, fieldsOf(node)]))
  const grouped = new Map<string, TourAvailabilityDay>()

  for (const variant of product.variants.nodes) {
    const date = variant.departureDate?.value || selectedOption(variant, 'Departure Date')
    const optionLabel = selectedOption(variant, 'Rate Type') || variant.title
    const label = optionLabel.replace(/\s[·-]\s(?:Adult|Child|Senior)$/i, '')
    if (!date || !label) continue

    const departure = departuresByDate.get(date)
    const amount = numberValue(variant.price)
    const price: TourPrice = {
      priceType: priceTypeFromVariant(variant),
      travelerType: travelerTypeFromVariant(variant),
      label,
      amount,
      shopifyVariantId: variant.id,
      sku: variant.sku ?? undefined,
    }

    const existing = grouped.get(date)
    if (existing) {
      existing.prices.push(price)
      existing.lowestPrice = Math.min(existing.lowestPrice, amount)
      existing.available = existing.available || product.status === 'ACTIVE'
      existing.status = existing.available ? existing.status : 'sold-out'
      continue
    }

    const remainingStock = numberValue(departure?.remaining_stock, variant.inventoryQuantity ?? 0)
    const pricingMode = product.variants.nodes.some((candidate) => {
      const type = priceTypeFromVariant(candidate)
      return type >= 3 && type <= 6
    }) ? 'room_occupancy' : 'per_person'
    const available = product.status === 'ACTIVE' && (departure?.status !== 'closed')
    grouped.set(date, {
      date,
      available,
      status: available ? (remainingStock > 0 && remainingStock <= 10 ? 'limited' : 'available') : 'sold-out',
      remainingStock,
      currency,
      prices: [price],
      lowestPrice: amount,
      pricingMode,
    })
  }

  return [...grouped.values()].map((day) => {
    const primary = day.prices.filter((price) => price.travelerType !== 'child' && price.travelerType !== 'senior')
    return { ...day, lowestPrice: Math.min(...(primary.length ? primary : day.prices).map((price) => price.amount)) }
  }).sort((a, b) => a.date.localeCompare(b.date))
}

function buildHighlights(product: ShopifyTourProduct, locale: string) {
  return localizedMetaobjects(product.highlightRefs, locale)
    .map((node) => fieldsOf(node))
    .sort((a, b) => numberValue(a.position) - numberValue(b.position))
    .map((fields) => fields.text)
    .filter(Boolean)
}

function buildLocalizedContent(product: ShopifyTourProduct, locale: string) {
  const fields = localizedMetaobjects(product.contentRefs, locale)
    .map((node) => fieldsOf(node))
    .find((row) => row.title || row.description_html)

  return {
    title: fields?.title || product.title,
    subtitle: fields?.subtitle || '',
    descriptionHtml: fields?.description_html || product.descriptionHtml,
    descriptionText: fields?.description_text || htmlToText(fields?.description_html || product.descriptionHtml),
  }
}

function buildItinerary(product: ShopifyTourProduct, locale: string, travelName: string): TourDetailData['itinerary'] {
  const days = localizedMetaobjects(product.itineraryDayRefs, locale)
    .map((node): TourItineraryDay => {
      const fields = fieldsOf(node)
      return {
        dayNumber: numberValue(fields.day_number),
        title: fields.title || `Day ${fields.day_number}`,
        route: fields.route || '',
        descriptionHtml: fields.description_html || '',
        descriptionText: fields.description_text || '',
        images: parseJson(fields.images_json, []),
        stops: parseJson<TourItineraryStop[]>(fields.stops_json, []),
        hotel: fields.hotel || undefined,
      }
    })
    .sort((a, b) => a.dayNumber - b.dayNumber)

  return {
    travelName,
    days,
  }
}

function buildCost(product: ShopifyTourProduct, locale: string): TourDetailData['cost'] {
  const sections = localizedMetaobjects(product.costSectionRefs, locale).map((node) => fieldsOf(node))
  const sectionKey = (value: string) => value.trim().toLowerCase().replace(/[\s_-]+/g, '')
  const includes = sections.find((section) => ['include', 'includes', 'included'].includes(sectionKey(section.section || '')))
  const excludes = sections.find((section) => ['exclude', 'excludes', 'excluded', 'notincluded'].includes(sectionKey(section.section || '')))
  return {
    includesHtml: includes?.html || '',
    includesText: includes?.text || '',
    excludesHtml: excludes?.html || '',
    excludesText: excludes?.text || '',
  }
}

function buildNotices(product: ShopifyTourProduct, locale: string): TourNotice[] {
  return localizedMetaobjects(product.policyNoticeRefs, locale)
    .map((node): TourNotice => {
      const fields = fieldsOf(node)
      return {
        noticeType: numberValue(fields.notice_type, -1),
        typeLabel: fields.type_label || '',
        matterName: fields.matter_name || '',
        html: fields.html || '',
        text: fields.text || '',
      }
    })
    .sort((a, b) => a.noticeType - b.noticeType)
}

function buildPickupDropoff(product: ShopifyTourProduct, locale: string, kind: 'pickup' | 'dropoff'): TourPickupPoint[] {
  return localizedMetaobjects(product.pickupDropoffRefs, locale)
    .map((node) => fieldsOf(node))
    .filter((fields) => fields.kind === kind)
    .map((fields) => ({
      code: fields.code || '',
      name: fields.name || '',
      address: fields.address || '',
      description: fields.description || '',
      isAirport: fields.is_airport === 'true',
    }))
}

function buildAddons(product: ShopifyTourProduct, locale: string, currency: string): TourAddon[] {
  return localizedMetaobjects(product.addonRefs, locale)
    .map((node): TourAddon => {
      const fields = fieldsOf(node)
      return {
        code: fields.code || node.handle,
        name: fields.name || '',
        description: fields.description || '',
        amount: numberValue(fields.amount),
        currency: fields.currency || currency,
        peopleTypeLabel: fields.people_type || 'All',
        shopifyVariantId: fields.shopify_variant_id || undefined,
      }
    })
}

function buildBasePrices(availability: TourAvailabilityDay[]) {
  return availability.find((day) => day.available)?.prices ?? availability[0]?.prices ?? []
}

function durationLabel(days: number, nights: number) {
  if (!days && !nights) return ''
  return `${days} days / ${nights} nights`
}

export async function getShopifyTourProductByHandle(
  client: ShopifyClientLike,
  manifest: SyncManifest,
  _requestedHandle: string,
  locale: string,
): Promise<TourDetailData | null> {
  if (!manifest.shopifyProductId) return null
  let after: string | null = null
  let product: ShopifyTourProduct | null = null
  const variants: ShopifyVariant[] = []

  do {
    const response: { data?: ShopifyTourProductResponse; errors?: unknown } = await client.request<ShopifyTourProductResponse>(TOUR_PRODUCT_QUERY, {
      variables: { id: manifest.shopifyProductId, variantsAfter: after },
      // Departure status, capacity, and price variants are operational data.
      // Always read them from Shopify so a saved room rate is immediately
      // selectable and checkout totals cannot be calculated from stale data.
      cache: 'no-store',
    })
    const pageProduct = response.data?.product
    if (response.errors || !pageProduct) return null
    product ??= pageProduct
    variants.push(...pageProduct.variants.nodes)
    after = pageProduct.variants.pageInfo.hasNextPage ? pageProduct.variants.pageInfo.endCursor : null
  } while (after)

  if (!product) return null
  const shopifyProduct: ShopifyTourProduct = {
    ...product,
    variants: {
      ...product.variants,
      nodes: variants,
    },
  }

  const productCode = metaValue(shopifyProduct.productCode) || manifest.productCode || ''
  const availabilitySummary = parseJson<{ supportedCurrencies?: Array<{ currencyNum?: string }> }>(
    metaValue(shopifyProduct.availabilitySummary),
    {},
  )
  const currency = availabilitySummary.supportedCurrencies?.[0]?.currencyNum || 'USD'
  const departureRows = metaobjects(shopifyProduct.departureRefs)
  const availability = buildAvailability(shopifyProduct, departureRows, currency)
  const basePrices = buildBasePrices(availability)
  const pricingMode = availability[0]?.pricingMode ?? 'per_person'
  const fromPrice = availability.reduce(
    (lowest, day) => Math.min(lowest, day.lowestPrice),
    Number.POSITIVE_INFINITY,
  )
  const durationDays = numberValue(metaValue(shopifyProduct.durationDays))
  const durationNights = numberValue(metaValue(shopifyProduct.durationNights))
  const localizedContent = buildLocalizedContent(shopifyProduct, locale)

  return {
    productCode,
    handle: shopifyProduct.handle,
    title: localizedContent.title,
    subtitle: localizedContent.subtitle,
    description: localizedContent.descriptionText,
    categoryName: shopifyProduct.productType,
    duration: {
      days: durationDays,
      nights: durationNights,
      label: durationLabel(durationDays, durationNights),
    },
    startName: metaValue(shopifyProduct.departureCity),
    endName: metaValue(shopifyProduct.returnCity),
    destinations: [],
    transfers: [],
    vehicles: [],
    gallery: shopifyProduct.media.nodes
      .map((node) => node.image)
      .filter((image): image is { url: string; altText: string | null } => Boolean(image?.url))
      .map((image, index) => ({
        src: image.url,
        alt: image.altText || `${localizedContent.title} ${index + 1}`,
      })),
    highlights: buildHighlights(shopifyProduct, locale),
    highlightsHtml: '',
    departureNotes: '',
    advanceDay: 0,
    advanceTime: '',
    currency,
    pricingMode,
    basePrices,
    fromPrice: Number.isFinite(fromPrice) ? fromPrice : 0,
    availability,
    itinerary: buildItinerary(shopifyProduct, locale, localizedContent.title),
    cost: buildCost(shopifyProduct, locale),
    notices: buildNotices(shopifyProduct, locale),
    pickup: buildPickupDropoff(shopifyProduct, locale, 'pickup'),
    dropoff: buildPickupDropoff(shopifyProduct, locale, 'dropoff'),
    constraints: {
      confirmTypeLabel: '',
      isChildAvailable: basePrices.some((price) => price.travelerType === 'child' || price.priceType === 2),
      childNote: '',
    },
    addons: buildAddons(shopifyProduct, locale, currency),
  }
}
