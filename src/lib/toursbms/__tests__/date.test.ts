import { describe, expect, it } from 'vitest'
import { isIsoCalendarDate, isoMonthFromDate } from '../date'

describe('ToursBMS calendar dates', () => {
  it.each(['2026-01-01', '2028-02-29', '2099-12-31'])('accepts %s', (value) => {
    expect(isIsoCalendarDate(value)).toBe(true)
    expect(isoMonthFromDate(value)).toBe(value.slice(0, 7))
  })

  it.each(['', 'Invalid', '2026', '2026-13-01', '2026-02-30', '2026-1-01', 'NaN-NaN-NaN'])('rejects %s', (value) => {
    expect(isIsoCalendarDate(value)).toBe(false)
    expect(isoMonthFromDate(value)).toBeNull()
  })
})
