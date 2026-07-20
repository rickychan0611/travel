const ISO_CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

export function isIsoCalendarDate(value: string) {
  const match = ISO_CALENDAR_DATE.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))

  return month >= 1
    && month <= 12
    && day >= 1
    && date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
}

export function isoMonthFromDate(value: string) {
  return isIsoCalendarDate(value) ? value.slice(0, 7) : null
}
