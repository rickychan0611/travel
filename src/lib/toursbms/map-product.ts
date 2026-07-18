import type {
  TourAddon,
  TourAvailabilityDay,
  TourDetailData,
  TourItineraryImage,
  TourItineraryDay,
  TourItineraryStop,
  TourNotice,
  TourPickupPoint,
  TourPrice,
} from './types'

type RawPrice = {
  priceType?: number
  label?: string
  amount?: number
  travelerType?: 'adult' | 'child' | 'senior'
}

type RawAvailability = {
  date?: string
  currency?: string
  stockStatus?: number
  remainingStock?: number
  prices?: RawPrice[]
  isGroupRoom?: boolean
}

type RawContent = {
  contentType?: number
  relatedName?: string
  decodedJson?: unknown
}

type RawDay = {
  dayNumber?: number
  section?: string
  sectionStops?: Array<{
    type?: string
    label?: string
    place?: string
    vehicle?: string
  }>
  content?: RawContent[]
}

type RawNotice = {
  noticeType?: number
  typeLabel?: string
  matterName?: string
  html?: { primary?: string; secondary?: string }
  text?: { primary?: string; secondary?: string }
}

type RawPoint = {
  code?: string
  name?: string
  address?: string
  description?: string
  descriptionText?: string
  isAirport?: boolean
}

type RawAddon = {
  code?: string
  name?: string
  description?: string
  descriptionText?: string
  amount?: number
  currency?: string
  peopleTypeLabel?: string
}

export type ToursBmsProductJson = {
  product?: {
    productCode?: string
    title?: string
    subtitle?: string
    categoryName?: string
    duration?: { days?: number; nights?: number; label?: string }
    start?: { regionName?: string }
    end?: { regionName?: string }
    destinations?: Array<{ spotName?: string }>
    transfers?: string[]
    vehicles?: string[]
  }
  media?: { images?: string[] }
  highlights?: { html?: string; text?: string }
  departure?: {
    html?: string
    text?: string
    advanceDay?: number
    advanceTime?: string
  }
  pricing?: {
    requestedCurrency?: string
    basePrices?: RawPrice[]
    availability?: RawAvailability[]
    pricingMode?: 'per_person' | 'room_occupancy'
  }
  itinerary?: {
    travelName?: string
    days?: RawDay[]
  }
  cost?: {
    includesHtml?: string
    includesText?: string
    excludesHtml?: string
    excludesText?: string
  }
  policy_notice?: { notices?: RawNotice[] }
  pickup_dropoff?: {
    pickup?: RawPoint[]
    dropoff?: RawPoint[]
  }
  constraints?: {
    confirmTypeLabel?: string
    isChildAvailable?: boolean
    childNote?: string
  }
  addons?: RawAddon[]
  shopify_mapping?: { handle?: string }
}

const ADULT_PRICE_TYPES = new Set([3, 4, 5, 6])
const LIMITED_STOCK_THRESHOLD = 10

function mapPrices(prices: RawPrice[] | undefined, pricingMode: 'per_person' | 'room_occupancy'): TourPrice[] {
  const mapped = (prices ?? [])
    .filter((price) => typeof price.amount === 'number' && price.amount > 0)
    .map((price) => ({
      priceType: price.priceType ?? 0,
      travelerType: price.travelerType ?? (price.priceType === 1 ? 'adult' : price.priceType === 2 ? 'child' : price.priceType === 7 ? 'senior' : 'adult'),
      label: price.label?.trim() || `Type ${price.priceType ?? '?'}`,
      amount: Number(price.amount),
    }))
  if (pricingMode !== 'room_occupancy') return mapped
  const genericChild = mapped.find((price) => price.priceType === 2)
  return mapped.filter((price) => ADULT_PRICE_TYPES.has(price.priceType)).flatMap((adult) => [
    { ...adult, travelerType: 'adult' as const },
    ...(genericChild ? [{ ...genericChild, priceType: adult.priceType, label: adult.label, travelerType: 'child' as const }] : []),
  ])
}

function lowestAdultPrice(prices: TourPrice[]): number {
  const adults = prices.filter((price) => ADULT_PRICE_TYPES.has(price.priceType) && price.travelerType !== 'child')
  const pool = adults.length > 0 ? adults : prices
  if (pool.length === 0) return 0
  return Math.min(...pool.map((price) => price.amount))
}

function parseHighlights(text: string, html: string): string[] {
  const fromText = text
    .split(/\n+/)
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean)
  if (fromText.length > 0) return fromText

  return html
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .split(/\n+/)
    .map((line) => line.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim())
    .filter(Boolean)
}

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
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

function getObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
}

function collectDescriptionHtml(value: unknown, seen = new Set<unknown>()): string[] {
  if (!value || seen.has(value) || typeof value !== 'object') return []
  seen.add(value)

  if (Array.isArray(value)) return value.flatMap((item) => collectDescriptionHtml(item, seen))

  const object = value as Record<string, unknown>
  const descriptions = typeof object.description === 'string' && object.description.trim()
    ? [object.description.trim()]
    : []

  return [
    ...descriptions,
    ...Object.values(object).flatMap((item) => collectDescriptionHtml(item, seen)),
  ]
}

function normalizeItineraryImageSrc(value: unknown): string {
  if (typeof value !== 'string') return ''
  const src = value.trim()
  if (!src) return ''
  if (/^https?:\/\//i.test(src)) return src
  if (src.startsWith('//')) return `https:${src}`
  if (/^[\w-]+\.(?:jpe?g|png|webp|gif)$/i.test(src)) return `https://dimg04.c-ctrip.com/target/${src}`
  return ''
}

function collectItineraryImages(value: unknown, seen = new Set<unknown>()): TourItineraryImage[] {
  if (!value || seen.has(value) || typeof value !== 'object') return []
  seen.add(value)

  if (Array.isArray(value)) return value.flatMap((item) => collectItineraryImages(item, seen))

  const object = value as Record<string, unknown>
  const imageCandidates = [
    object.imageUrl,
    object.url,
    object.src,
    object.image,
    object.scenicImage,
  ]
  const directImages = imageCandidates
    .map(normalizeItineraryImageSrc)
    .filter(Boolean)
    .map((src) => ({
      src,
      alt: typeof object.name === 'string'
        ? object.name
        : typeof object.scenicName === 'string'
          ? object.scenicName
          : '',
    }))

  return [
    ...directImages,
    ...Object.values(object).flatMap((item) => collectItineraryImages(item, seen)),
  ]
}

function firstHotelName(value: unknown): string | undefined {
  if (!value) return undefined
  if (Array.isArray(value)) {
    for (const item of value) {
      const hotel = firstHotelName(item)
      if (hotel) return hotel
    }
    return undefined
  }

  const object = getObject(value)
  if (!object) return undefined
  if (typeof object.hotelName === 'string' && object.hotelName.trim()) return object.hotelName.trim()
  return firstHotelName(Object.values(object))
}

function mapStops(day: RawDay): TourItineraryStop[] {
  return (day.sectionStops ?? []).map((stop) => {
    if (stop.type === 'transfer') {
      return {
        type: 'transfer',
        label: (stop.place ?? '').trim(),
        vehicle: stop.vehicle,
      }
    }
    return {
      type: stop.type ?? 'place',
      label: (stop.label ?? stop.place ?? '').trim(),
      vehicle: stop.vehicle,
    }
  }).filter((stop) => stop.label)
}

function mapItineraryDay(day: RawDay): TourItineraryDay {
  const dayNumber = day.dayNumber ?? 0
  const stops = mapStops(day)
  const content = day.content ?? []
  const titleBlock = content.find((item) => item.contentType === 100 && item.relatedName?.trim())
  const hotelBlock = content.find((item) => item.contentType === 8)
  const hotelObject = getObject(hotelBlock?.decodedJson)
  const hotel = firstHotelName(hotelObject?.content)
  const regionName = typeof hotelObject?.regionName === 'string' ? hotelObject.regionName : undefined
  const route = stops.map((stop) => stop.label).join(' → ')
  const descriptionHtml = Array.from(
    new Set(content.flatMap((item) => collectDescriptionHtml(item.decodedJson))),
  ).join('\n')
  const images = Array.from(
    new Map(
      content
        .flatMap((item) => collectItineraryImages(item.decodedJson))
        .map((image) => [image.src, image]),
    ).values(),
  )
  const title =
    titleBlock?.relatedName?.trim() ||
    day.section?.trim() ||
    route ||
    `Day ${dayNumber}`

  return {
    dayNumber,
    title,
    route,
    descriptionHtml,
    descriptionText: htmlToText(descriptionHtml),
    images,
    stops,
    hotel,
    regionName,
  }
}

function mapAvailability(rows: RawAvailability[] | undefined, currency: string): TourAvailabilityDay[] {
  return (rows ?? [])
    .filter((row) => Boolean(row.date))
    .map((row) => {
      const pricingMode = row.isGroupRoom || row.prices?.some((price) => ADULT_PRICE_TYPES.has(Number(price.priceType))) ? 'room_occupancy' : 'per_person'
      const prices = mapPrices(row.prices, pricingMode)
      const remainingStock = row.remainingStock ?? 0
      const soldOut = row.stockStatus !== 200 || prices.length === 0
      const limited = !soldOut && remainingStock > 0 && remainingStock <= LIMITED_STOCK_THRESHOLD
      return {
        date: row.date!,
        available: !soldOut,
        status: soldOut ? 'sold-out' : limited ? 'limited' : 'available',
        remainingStock,
        currency: row.currency || currency,
        prices,
        lowestPrice: lowestAdultPrice(prices),
        pricingMode,
      }
    })
}

function mapPoint(point: RawPoint): TourPickupPoint {
  return {
    code: point.code ?? '',
    name: point.name ?? '',
    address: point.address ?? '',
    description: (point.descriptionText || point.description || '').trim(),
    isAirport: Boolean(point.isAirport),
  }
}

function mapNotice(notice: RawNotice): TourNotice {
  const html = (notice.html?.primary || notice.html?.secondary || '').trim()
  const text = (notice.text?.primary || notice.text?.secondary || '').trim()
  return {
    noticeType: notice.noticeType ?? -1,
    typeLabel: notice.typeLabel ?? '',
    matterName: notice.matterName ?? '',
    html,
    text,
  }
}

function mapAddon(addon: RawAddon): TourAddon {
  return {
    code: addon.code ?? '',
    name: addon.name ?? '',
    description: (addon.descriptionText || addon.description || '').trim(),
    amount: Number(addon.amount ?? 0),
    currency: addon.currency || 'USD',
    peopleTypeLabel: addon.peopleTypeLabel ?? '',
  }
}

export function mapToursBmsProduct(json: ToursBmsProductJson): TourDetailData {
  const product = json.product ?? {}
  const currency = json.pricing?.requestedCurrency || 'USD'
  const pricingMode = json.pricing?.pricingMode
    ?? (json.pricing?.availability?.some((day) => day.isGroupRoom) ? 'room_occupancy' : 'per_person')
  const availability = mapAvailability(json.pricing?.availability, currency)
  const basePrices = pricingMode === 'room_occupancy' && availability[0]?.prices.length
    ? availability[0].prices
    : mapPrices(json.pricing?.basePrices, pricingMode)
  const fromPrice =
    availability.find((day) => day.available)?.lowestPrice ||
    lowestAdultPrice(basePrices)

  const productCode = product.productCode ?? ''
  const handle =
    json.shopify_mapping?.handle ||
    productCode.toLowerCase()

  const highlightsText = json.highlights?.text ?? ''
  const highlightsHtml = json.highlights?.html ?? ''

  return {
    productCode,
    handle,
    title: (product.title ?? '').trim(),
    subtitle: (product.subtitle ?? '').trim(),
    description: highlightsText || product.title || '',
    categoryName: product.categoryName ?? '',
    duration: {
      days: product.duration?.days ?? json.itinerary?.days?.length ?? 0,
      nights: product.duration?.nights ?? 0,
      label: product.duration?.label ?? '',
    },
    startName: product.start?.regionName ?? '',
    endName: product.end?.regionName ?? '',
    destinations: (product.destinations ?? []).map((d) => d.spotName ?? '').filter(Boolean),
    transfers: product.transfers ?? [],
    vehicles: product.vehicles ?? [],
    gallery: (json.media?.images ?? []).map((src, index) => ({
      src,
      alt: `${product.title ?? 'Tour'} ${index + 1}`,
    })),
    highlights: parseHighlights(highlightsText, highlightsHtml),
    highlightsHtml,
    departureNotes: (json.departure?.text || json.departure?.html || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .trim(),
    advanceDay: json.departure?.advanceDay ?? 0,
    advanceTime: json.departure?.advanceTime ?? '',
    currency,
    pricingMode,
    basePrices,
    fromPrice,
    availability,
    itinerary: {
      travelName: json.itinerary?.travelName ?? '',
      days: (json.itinerary?.days ?? []).map(mapItineraryDay),
    },
    cost: {
      includesHtml: json.cost?.includesHtml ?? '',
      includesText: json.cost?.includesText ?? '',
      excludesHtml: json.cost?.excludesHtml ?? '',
      excludesText: json.cost?.excludesText ?? '',
    },
    notices: (json.policy_notice?.notices ?? []).map(mapNotice).filter((n) => n.html || n.text),
    pickup: (json.pickup_dropoff?.pickup ?? []).map(mapPoint),
    dropoff: (json.pickup_dropoff?.dropoff ?? []).map(mapPoint),
    constraints: {
      confirmTypeLabel: json.constraints?.confirmTypeLabel ?? '',
      isChildAvailable: Boolean(json.constraints?.isChildAvailable),
      childNote: json.constraints?.childNote ?? '',
    },
    addons: (json.addons ?? []).map(mapAddon),
  }
}

export function findChildPrice(prices: TourPrice[]): TourPrice | undefined {
  return prices.find((price) => price.priceType === 2)
}

export function findAdultRoomPrices(prices: TourPrice[]): TourPrice[] {
  return prices.filter((price) => ADULT_PRICE_TYPES.has(price.priceType) && price.travelerType !== 'child' && price.travelerType !== 'senior')
}
