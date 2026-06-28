'use client'

import { useState, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { DepartureDate } from '@/lib/shopify/utils/parseVariants'

interface Props {
  departureDates: DepartureDate[]
  selectedDate: string | null
  onDateSelect: (date: string | null) => void
}

function getInitialMonth(departureDates: DepartureDate[]): { year: number; month: number } {
  const todayStr = new Date().toISOString().split('T')[0]
  const next = departureDates.find(d => d.date >= todayStr && d.available)
  if (next) {
    const [y, m] = next.date.split('-').map(Number)
    return { year: y, month: m - 1 } // month is 0-indexed
  }
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() }
}

export function DepartureCalendar({ departureDates, selectedDate, onDateSelect }: Props) {
  const t = useTranslations('calendar')
  const locale = useLocale()

  const [currentMonth, setCurrentMonth] = useState(() => getInitialMonth(departureDates))

  const todayStr = new Date().toISOString().split('T')[0]
  const now = new Date()

  const dateMap = useMemo(
    () => new Map(departureDates.map(d => [d.date, d])),
    [departureDates],
  )

  // Calendar grid cells: null = empty padding slot, number = day of month
  const cells = useMemo(() => {
    const { year, month } = currentMonth
    const firstDow = new Date(year, month, 1).getDay() // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const result: Array<number | null> = []
    for (let i = 0; i < firstDow; i++) result.push(null)
    for (let d = 1; d <= daysInMonth; d++) result.push(d)
    return result
  }, [currentMonth])

  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(currentMonth.year, currentMonth.month))

  // Disable back-navigation at the current calendar month
  const isPrevDisabled =
    currentMonth.year === now.getFullYear() && currentMonth.month === now.getMonth()

  function prevMonth() {
    setCurrentMonth(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 },
    )
  }

  function nextMonth() {
    setCurrentMonth(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 },
    )
  }

  function toDateStr(day: number): string {
    const { year, month } = currentMonth
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const weekdays = t.raw('weekdays') as string[]
  const hasAnyDeparture = cells.some(day => day !== null && dateMap.has(toDateStr(day)))

  return (
    <div className="rounded-xl border bg-card p-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          disabled={isPrevDisabled}
          aria-label="Previous month"
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
        >
          ←
        </button>
        <span className="text-sm font-medium">{monthLabel}</span>
        <button
          onClick={nextMonth}
          aria-label="Next month"
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted transition-colors text-sm"
        >
          →
        </button>
      </div>

      {/* Weekday header row */}
      <div className="grid grid-cols-7 mb-1">
        {weekdays.map((day: string) => (
          <div
            key={day}
            className="text-center text-[11px] text-muted-foreground py-1 font-medium"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (day === null) return <div key={`pad-${i}`} />

          const dateStr = toDateStr(day)
          const isPast = dateStr < todayStr
          const departure = dateMap.get(dateStr)
          const isSelected = dateStr === selectedDate

          // No departure or past date: non-interactive placeholder
          if (!departure || isPast) {
            return (
              <div
                key={dateStr}
                className="flex items-center justify-center h-12 rounded text-[11px] text-muted-foreground/40"
              >
                {day}
              </div>
            )
          }

          const isSoldOut = departure.status === 'sold-out'
          const isLimited = departure.status === 'limited'
          const price = `${departure.lowestPrice.currencyCode} ${parseFloat(departure.lowestPrice.amount).toFixed(0)}`

          return (
            <button
              key={dateStr}
              disabled={isSoldOut}
              onClick={() => onDateSelect(isSelected ? null : dateStr)}
              className={cn(
                'flex flex-col items-center justify-center h-12 rounded text-[11px] transition-colors',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : isSoldOut
                    ? 'cursor-not-allowed text-muted-foreground'
                    : isLimited
                      ? 'hover:bg-muted cursor-pointer border border-amber-500'
                      : 'hover:bg-muted cursor-pointer',
              )}
            >
              <span className="font-medium text-xs leading-tight">{day}</span>
              <span
                className={cn(
                  'text-[10px] leading-tight',
                  isSelected && 'text-primary-foreground',
                  !isSelected && isSoldOut && 'line-through text-muted-foreground/60',
                  !isSelected && isLimited && 'text-amber-600',
                  !isSelected && !isSoldOut && !isLimited && 'text-primary',
                )}
              >
                {price}
              </span>
              {isLimited && !isSelected && (
                <span className="text-[9px] text-amber-600 leading-none">
                  {t('limited')}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Empty-month message */}
      {!hasAnyDeparture && (
        <p className="text-center text-sm text-muted-foreground py-6">
          {t('noDateThisMonth')}
        </p>
      )}
    </div>
  )
}
