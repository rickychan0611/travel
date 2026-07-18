import type { PricingMode } from './date-price-rates'

export type TourPrice = {
  priceType: number
  travelerType?: 'adult' | 'child' | 'senior'
  label: string
  amount: number
  shopifyVariantId?: string
  sku?: string
}

export type TourAvailabilityDay = {
  date: string
  available: boolean
  status: 'available' | 'limited' | 'sold-out'
  remainingStock: number
  currency: string
  prices: TourPrice[]
  lowestPrice: number
  pricingMode: PricingMode
}

export type TravelerCounts = { adults: number; seniors: number; children: number }

export type RoomAssignment = TravelerCounts & {
  id: string
  priceType: 3 | 4 | 5 | 6
}

export type TourItineraryStop = {
  type: 'place' | 'transfer' | string
  label?: string
  place?: string
  vehicle?: string
  vehicleCode?: string
}

export type TourItineraryImage = {
  src: string
  alt: string
  caption?: string
  sourceUrl?: string
  shopifyMediaId?: string
}

export type TourItineraryDay = {
  dayNumber: number
  title: string
  route: string
  descriptionHtml: string
  descriptionText: string
  images: TourItineraryImage[]
  stops: TourItineraryStop[]
  hotel?: string
  regionName?: string
}

export type TourNotice = {
  noticeType: number
  typeLabel: string
  matterName: string
  html: string
  text: string
}

export type TourPickupPoint = {
  code: string
  name: string
  address: string
  description: string
  isAirport: boolean
}

export type TourAddon = {
  code: string
  name: string
  description: string
  amount: number
  currency: string
  peopleTypeLabel: string
  shopifyVariantId?: string
  sku?: string
}

export type TourDetailData = {
  productCode: string
  handle: string
  title: string
  subtitle: string
  description: string
  categoryName: string
  duration: { days: number; nights: number; label: string }
  startName: string
  endName: string
  destinations: string[]
  transfers: string[]
  vehicles: string[]
  gallery: Array<{ src: string; alt: string }>
  highlights: string[]
  highlightsHtml: string
  departureNotes: string
  advanceDay: number
  advanceTime: string
  currency: string
  pricingMode: PricingMode
  basePrices: TourPrice[]
  fromPrice: number
  availability: TourAvailabilityDay[]
  itinerary: {
    travelName: string
    days: TourItineraryDay[]
  }
  cost: {
    includesHtml: string
    includesText: string
    excludesHtml: string
    excludesText: string
  }
  notices: TourNotice[]
  pickup: TourPickupPoint[]
  dropoff: TourPickupPoint[]
  constraints: {
    confirmTypeLabel: string
    isChildAvailable: boolean
    childNote: string
  }
  addons: TourAddon[]
}
