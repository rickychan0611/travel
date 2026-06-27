import { parseDepartureDates } from '../parseVariants'
import type { ProductVariant } from '../../types'

function makeVariant(
  date: string,
  partySize: string,
  qty: number | null,
  available: boolean,
  price = '408.00',
  currencyCode = 'CAD',
): ProductVariant {
  return {
    id: `${date}-${partySize.replace(/\s/g, '')}`,
    title: `${date} / ${partySize}`,
    availableForSale: available,
    quantityAvailable: qty,
    price: { amount: price, currencyCode },
    selectedOptions: [
      { name: 'Departure', value: date },
      { name: 'Party Size', value: partySize },
    ],
  }
}

describe('parseDepartureDates', () => {
  describe('grouping', () => {
    it('groups variants by departure date', () => {
      const variants = [
        makeVariant('2026-08-05', '1 Person', 10, true),
        makeVariant('2026-08-05', '2 Persons', 10, true),
        makeVariant('2026-08-12', '1 Person', 10, true),
      ]
      const result = parseDepartureDates(variants)
      expect(result).toHaveLength(2)
      expect(result[0].date).toBe('2026-08-05')
      expect(result[0].variants).toHaveLength(2)
      expect(result[1].date).toBe('2026-08-12')
    })

    it('sorts dates ascending', () => {
      const variants = [
        makeVariant('2026-08-19', '2 Persons', 10, true),
        makeVariant('2026-08-05', '2 Persons', 10, true),
        makeVariant('2026-08-12', '2 Persons', 10, true),
      ]
      const result = parseDepartureDates(variants)
      expect(result.map(d => d.date)).toEqual(['2026-08-05', '2026-08-12', '2026-08-19'])
    })

    it('returns empty array when no variants have a Departure option', () => {
      const legacyVariant: ProductVariant = {
        id: 'v1',
        title: '2 Persons',
        availableForSale: true,
        quantityAvailable: 10,
        price: { amount: '488.00', currencyCode: 'CAD' },
        selectedOptions: [{ name: 'Party Size', value: '2 Persons' }],
      }
      expect(parseDepartureDates([legacyVariant])).toEqual([])
    })

    it('skips variants with invalid date format', () => {
      const bad: ProductVariant = {
        id: 'bad',
        title: 'not-a-date / 2 Persons',
        availableForSale: true,
        quantityAvailable: 5,
        price: { amount: '488.00', currencyCode: 'CAD' },
        selectedOptions: [
          { name: 'Departure', value: 'not-a-date' },
          { name: 'Party Size', value: '2 Persons' },
        ],
      }
      expect(parseDepartureDates([bad])).toEqual([])
    })
  })

  describe('status', () => {
    it('returns available when quantityAvailable > 5', () => {
      const result = parseDepartureDates([makeVariant('2026-08-05', '2 Persons', 20, true)])
      expect(result[0].status).toBe('available')
      expect(result[0].available).toBe(true)
    })

    it('returns limited when quantityAvailable is 1–5', () => {
      const result = parseDepartureDates([makeVariant('2026-08-05', '2 Persons', 3, true)])
      expect(result[0].status).toBe('limited')
      expect(result[0].available).toBe(true)
    })

    it('returns sold-out when no variant is availableForSale', () => {
      const result = parseDepartureDates([makeVariant('2026-08-05', '2 Persons', 0, false)])
      expect(result[0].status).toBe('sold-out')
      expect(result[0].available).toBe(false)
    })

    it('returns available when quantityAvailable is null and availableForSale is true', () => {
      const result = parseDepartureDates([makeVariant('2026-08-05', '2 Persons', null, true)])
      expect(result[0].status).toBe('available')
    })

    it('uses max qty across party-size variants to determine status', () => {
      const variants = [
        makeVariant('2026-08-05', '1 Person', 2, true),
        makeVariant('2026-08-05', '2 Persons', 20, true),
      ]
      const result = parseDepartureDates(variants)
      expect(result[0].status).toBe('available')
    })
  })

  describe('lowestPrice', () => {
    it('picks price from the highest party-size variant (cheapest per person)', () => {
      const variants = [
        makeVariant('2026-08-05', '1 Person', 10, true, '718.00'),
        makeVariant('2026-08-05', '2 Persons', 10, true, '488.00'),
        makeVariant('2026-08-05', '4 Persons', 10, true, '408.00'),
      ]
      const result = parseDepartureDates(variants)
      expect(result[0].lowestPrice.amount).toBe('408.00')
    })

    it('picks lowestPrice even when that variant is sold out (for strike-through display)', () => {
      const variants = [
        makeVariant('2026-08-05', '1 Person', 10, true, '718.00'),
        makeVariant('2026-08-05', '4 Persons', 0, false, '408.00'),
      ]
      const result = parseDepartureDates(variants)
      expect(result[0].lowestPrice.amount).toBe('408.00')
    })

    it('includes currencyCode in lowestPrice', () => {
      const result = parseDepartureDates([
        makeVariant('2026-08-05', '2 Persons', 10, true, '488.00', 'CAD'),
      ])
      expect(result[0].lowestPrice.currencyCode).toBe('CAD')
    })
  })
})
