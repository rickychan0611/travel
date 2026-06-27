'use client'

import { useState, useMemo } from 'react'
import type { DepartureDate } from '@/lib/shopify/utils/parseVariants'
import { DepartureCalendar } from './DepartureCalendar'
import { TourBookingPanel } from './TourBookingPanel'

interface Props {
  departureDates: DepartureDate[]
  productHandle: string
  productTitle: string
  tags: string[]
}

export function TourDetailClient({ departureDates, productHandle, productTitle, tags }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const selectedDayVariants = useMemo(() => {
    if (!selectedDate) return []
    return departureDates.find(d => d.date === selectedDate)?.variants ?? []
  }, [selectedDate, departureDates])

  return (
    <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6">
      <DepartureCalendar
        departureDates={departureDates}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />
      {/* key forces remount on date change, resetting selectedVariantId in the panel */}
      <TourBookingPanel
        key={selectedDate ?? 'none'}
        productHandle={productHandle}
        productTitle={productTitle}
        variants={selectedDayVariants}
        selectedDate={selectedDate}
        tags={tags}
      />
    </div>
  )
}
