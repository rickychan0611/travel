import type { PricingMode } from './date-price-rates'
import type { RoomAssignment, TourPrice, TravelerCounts } from './types'

export const ROOM_CAPACITY: Record<RoomAssignment['priceType'], number> = { 3: 1, 4: 2, 5: 3, 6: 4 }

export function findPrice(prices: TourPrice[], priceType: number, travelerType?: TourPrice['travelerType']) {
  const candidates = prices.filter((price) => price.priceType === priceType)
  if (!travelerType) {
    if (candidates[0]) return candidates[0]
    // Some legacy traveler variants have no numeric price type. Their
    // traveler type is still sufficient to price a non-room departure.
    if (priceType === 1) return prices.find((price) => price.travelerType === 'adult' && (price.priceType < 3 || price.priceType > 6))
    if (priceType === 2) return prices.find((price) => price.travelerType === 'child' && (price.priceType < 3 || price.priceType > 6))
    if (priceType === 7) return prices.find((price) => price.travelerType === 'senior' && (price.priceType < 3 || price.priceType > 6))
    return undefined
  }
  const exact = candidates.find((price) => price.travelerType === travelerType)
  if (exact) return exact
  if (travelerType === 'adult' && priceType >= 3 && priceType <= 6) {
    return candidates.find((price) => !price.travelerType)
  }
  // Legacy room data had one generic child rate. Keep it readable until the
  // product is resaved or resynced into room-specific child variants.
  if (travelerType === 'child' && priceType >= 3 && priceType <= 6) {
    return prices.find((price) => price.priceType === 2)
  }
  return undefined
}

export function resolveBookingPricingMode(pricingMode: PricingMode, prices: TourPrice[]): PricingMode {
  if (pricingMode !== 'room_occupancy') return pricingMode
  const hasRoomOptions = prices.some((price) => price.priceType >= 3 && price.priceType <= 6 && price.travelerType !== 'child' && price.travelerType !== 'senior')
  return hasRoomOptions ? 'room_occupancy' : 'per_person'
}

export function travelerTotal(counts: TravelerCounts) {
  return counts.adults + counts.seniors + counts.children
}

export function validateRoom(room: RoomAssignment, prices: TourPrice[]) {
  const adultOccupants = room.adults + room.seniors
  if (adultOccupants < 1) return 'Each room needs at least one adult or senior.'
  if (adultOccupants > ROOM_CAPACITY[room.priceType]) return `This room allows up to ${ROOM_CAPACITY[room.priceType]} adults or seniors.`
  if (room.children > adultOccupants * 2) return 'Each adult or senior may bring up to 2 children.'
  if (!findPrice(prices, room.priceType, 'adult')) return 'The adult price for this room is unavailable.'
  if (room.children > 0 && !findPrice(prices, room.priceType, 'child')) return 'The child price for this room is unavailable.'
  return null
}

export function roomTotal(room: RoomAssignment, prices: TourPrice[]) {
  const occupancy = findPrice(prices, room.priceType, 'adult')
  const child = findPrice(prices, room.priceType, 'child')
  if (!occupancy) return 0
  return occupancy.amount * room.adults
    + occupancy.amount * room.seniors
    + (child?.amount ?? 0) * room.children
}

export function perPersonTotal(counts: TravelerCounts, prices: TourPrice[]) {
  return counts.adults * (findPrice(prices, 1)?.amount ?? 0)
    + counts.children * (findPrice(prices, 2)?.amount ?? 0)
    + counts.seniors * (findPrice(prices, 7)?.amount ?? findPrice(prices, 1)?.amount ?? 0)
}
