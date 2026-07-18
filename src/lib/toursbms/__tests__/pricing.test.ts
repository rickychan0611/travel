import { describe, expect, it } from 'vitest'
import { perPersonTotal, resolveBookingPricingMode, roomTotal, validateRoom } from '../pricing'
import type { RoomAssignment, TourPrice } from '../types'

const prices: TourPrice[] = [
  { priceType: 1, label: 'Adult', amount: 300 },
  { priceType: 2, label: 'Child', amount: 200 },
  { priceType: 3, travelerType: 'adult', label: 'Single room', amount: 500 },
  { priceType: 3, travelerType: 'child', label: 'Single room', amount: 280 },
  { priceType: 4, travelerType: 'adult', label: 'Double room', amount: 400 },
  { priceType: 4, travelerType: 'child', label: 'Double room', amount: 180 },
  { priceType: 5, travelerType: 'adult', label: 'Triple room', amount: 350 },
  { priceType: 7, label: 'Senior', amount: 250 },
]

describe('ToursBMS-aware pricing', () => {
  it('prices per-person adults, children and seniors', () => {
    expect(perPersonTotal({ adults: 2, seniors: 1, children: 1 }, prices)).toBe(1050)
  })
  it('prices adults and children using the selected room type', () => {
    expect(roomTotal({ id: 'r1', priceType: 4, adults: 1, seniors: 0, children: 1 }, prices)).toBe(580)
    expect(roomTotal({ id: 'r1', priceType: 3, adults: 1, seniors: 0, children: 1 }, prices)).toBe(780)
  })
  it('falls seniors back to the room rate', () => {
    expect(roomTotal({ id: 'r1', priceType: 4, adults: 1, seniors: 1, children: 0 }, prices)).toBe(800)
  })
  it('allows two children per adult independently of adult room capacity', () => {
    const underfilled: RoomAssignment = { id: 'r1', priceType: 4, adults: 1, seniors: 0, children: 0 }
    const withTwoChildren: RoomAssignment = { ...underfilled, children: 2 }
    const withThreeChildren: RoomAssignment = { ...underfilled, children: 3 }
    expect(validateRoom(underfilled, prices)).toBeNull()
    expect(validateRoom(withTwoChildren, prices)).toBeNull()
    expect(validateRoom(withThreeChildren, prices)).toContain('up to 2 children')
    expect(validateRoom({ ...underfilled, adults: 3 }, prices)).toContain('up to 2 adults or seniors')
  })
  it('requires an adult or senior room leader', () => {
    expect(validateRoom({ id: 'r1', priceType: 4, adults: 0, seniors: 0, children: 1 }, prices)).toContain('adult or senior')
  })
  it('returns manual-quote errors for missing occupancy or child rates', () => {
    expect(validateRoom({ id: 'r1', priceType: 6, adults: 2, seniors: 0, children: 0 }, prices)).toContain('unavailable')
    expect(validateRoom({ id: 'r1', priceType: 5, adults: 1, seniors: 0, children: 1 }, prices.filter((price) => price.priceType !== 2))).toContain('child price')
  })
  it('falls back to traveler pricing when a departure has no room options', () => {
    expect(resolveBookingPricingMode('room_occupancy', prices.filter((price) => price.priceType <= 2 || price.priceType === 7))).toBe('per_person')
    expect(resolveBookingPricingMode('room_occupancy', prices)).toBe('room_occupancy')
  })
})
