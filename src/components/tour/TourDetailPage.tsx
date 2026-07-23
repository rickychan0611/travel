'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import {
  Bus,
  Car,
  CheckCircle2,
  Info,
  MapPin,
  Plane,
  ShieldCheck,
  Ship,
  TrainFront,
} from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { ImageSlider } from '@/components/ui/ImageSlider'
import { findAdultRoomPrices, findChildPrice } from '@/lib/toursbms/map-product'
import { isIsoCalendarDate, isoMonthFromDate } from '@/lib/toursbms/date'
import { findPrice, perPersonTotal, resolveBookingPricingMode, roomTotal, travelerTotal, validateRoom } from '@/lib/toursbms/pricing'
import type {
  TourAddon,
  TourAvailabilityDay,
  TourDetailData,
  TourItineraryDay,
  TourPrice,
  RoomAssignment,
  TravelerCounts,
} from '@/lib/toursbms/types'

type Props = {
  locale: string
  tour: TourDetailData
}

type AddonSelection = {
  addon: TourAddon
  chargeable: boolean
  quantity: number
  subtotal: number
}

function money(amount: number | string, currency = 'USD', locale?: string) {
  const value = Number(amount)
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `$${value.toFixed(2)}`
  }
}

function monthsFromDates(dates: TourAvailabilityDay[]) {
  return Array.from(new Set(dates.map((date) => isoMonthFromDate(date.date)).filter((month): month is string => Boolean(month))))
}

function monthLabel(month: string) {
  const [year, mm] = month.split('-')
  return `${year}/${mm}`
}

function isRequestOnlyAddon(addon: TourAddon) {
  const text = `${addon.name} ${addon.description}`.toLowerCase()
  return (
    addon.amount <= 0 ||
    text.includes('contact operator') ||
    text.includes('quote') ||
    text.includes('first, second, third and fourth') ||
    text.includes('starting from the fifth') ||
    (text.includes('airport') && text.includes('first four'))
  )
}

function HtmlOrText({ html, text }: { html?: string; text?: string }) {
  if (html?.trim()) {
    return (
      <div
        className="tour-detail-richtext space-y-2 text-[14px] leading-7 text-[#333] [&_img]:my-4 [&_img]:max-h-[420px] [&_img]:w-full [&_img]:rounded [&_img]:object-cover [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-2 [&_ul]:space-y-1"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }
  if (text?.trim()) {
    return <p className="whitespace-pre-line text-[14px] leading-7 text-[#333]">{text}</p>
  }
  return null
}

export function TourDetailPage({ tour }: Props) {
  const t = useTranslations('tourDetail')
  const locale = useLocale()
  const addItem = useCartStore((state) => state.addItem)
  const departureDates = tour.availability
  const initialDate = departureDates.find((date) => date.available && isIsoCalendarDate(date.date))?.date ?? null
  const initialPrices = departureDates.find((date) => date.date === initialDate)?.prices ?? tour.basePrices
  const initialRoomPrices = findAdultRoomPrices(initialPrices)
  const initialRoomType = (initialRoomPrices.find((price) => price.priceType === 4)?.priceType
    ?? initialRoomPrices[0]?.priceType
    ?? 4) as RoomAssignment['priceType']
  const initialRoomAdults = Math.min(2, initialRoomType - 2)
  const [activeImage, setActiveImage] = useState(0)
  const [galleryModalOpen, setGalleryModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate)
  const [selectedPriceType, setSelectedPriceType] = useState<number | null>(null)
  const [adultCount, setAdultCount] = useState(2)
  const [childCount, setChildCount] = useState(0)
  const [seniorCount, setSeniorCount] = useState(0)
  const [rooms, setRooms] = useState<RoomAssignment[]>([
    { id: 'room-1', priceType: initialRoomType, adults: initialRoomAdults, seniors: 0, children: 0 },
  ])
  const [activeMonth, setActiveMonth] = useState(monthsFromDates(departureDates)[0] ?? '')
  const [activeSection, setActiveSection] = useState(tour.departureNotes ? 'departure' : 'itinerary')
  const [activeDay, setActiveDay] = useState(tour.itinerary.days[0]?.dayNumber ?? 1)
  const [showDayNav, setShowDayNav] = useState(false)
  const [added, setAdded] = useState(false)
  const [selectedAddonCodes, setSelectedAddonCodes] = useState<string[]>([])
  const [addonQuantities, setAddonQuantities] = useState<Record<string, number>>({})

  const gallery = tour.gallery
  const dateMap = useMemo(
    () => new Map(departureDates.filter((date) => isIsoCalendarDate(date.date)).map((date) => [date.date, date])),
    [departureDates],
  )
  const selectedDeparture = selectedDate ? dateMap.get(selectedDate) : undefined
  const currentPrices = selectedDeparture?.prices ?? tour.basePrices
  const roomPrices = useMemo(() => findAdultRoomPrices(currentPrices), [currentPrices])
  const childPrice = findChildPrice(currentPrices)
  const bookingPricingMode = resolveBookingPricingMode(tour.pricingMode, currentPrices)
  const selectedRoom =
    roomPrices.find((price) => price.priceType === selectedPriceType) ?? roomPrices[0] ?? null

  const selectDepartureDate = (date: string) => {
    const nextPrices = dateMap.get(date)?.prices ?? tour.basePrices
    const nextRoomPrices = findAdultRoomPrices(nextPrices)
    setSelectedDate(date)
    if (resolveBookingPricingMode(tour.pricingMode, nextPrices) !== 'room_occupancy' || nextRoomPrices.length === 0) return
    const availableTypes = new Set(nextRoomPrices.map((price) => price.priceType))
    const fallbackType = nextRoomPrices[0].priceType as RoomAssignment['priceType']
    setRooms((current) => current.map((room) => {
      const priceType = availableTypes.has(room.priceType) ? room.priceType : fallbackType
      const hasChildRate = Boolean(findPrice(nextPrices, priceType, 'child'))
      const children = hasChildRate ? Math.min(room.children, (room.adults + room.seniors) * 2) : 0
      return priceType === room.priceType && children === room.children ? room : { ...room, priceType, children }
    }))
  }

  const perPersonCounts: TravelerCounts = { adults: adultCount, seniors: seniorCount, children: childCount }
  const roomCounts = rooms.reduce<TravelerCounts>((sum, room) => ({
    adults: sum.adults + room.adults,
    seniors: sum.seniors + room.seniors,
    children: sum.children + room.children,
  }), { adults: 0, seniors: 0, children: 0 })
  const counts = bookingPricingMode === 'room_occupancy' ? roomCounts : perPersonCounts
  const totalTravelers = travelerTotal(counts)
  const baseTotal = bookingPricingMode === 'room_occupancy'
    ? rooms.reduce((sum, room) => sum + roomTotal(room, currentPrices), 0)
    : perPersonTotal(perPersonCounts, currentPrices)
  const addonSelections = useMemo<AddonSelection[]>(
    () =>
      tour.addons.map((addon) => {
        const chargeable = !isRequestOnlyAddon(addon)
        const quantity = Math.max(1, addonQuantities[addon.code] ?? 1)
        return {
          addon,
          chargeable,
          quantity,
          subtotal: chargeable ? addon.amount * quantity : 0,
        }
      }),
    [addonQuantities, tour.addons],
  )
  const selectedAddonCodeSet = useMemo(() => new Set(selectedAddonCodes), [selectedAddonCodes])
  const selectedAddons = addonSelections.filter(
    (selection) => selectedAddonCodeSet.has(selection.addon.code),
  )
  const addonsTotal = selectedAddons.reduce((sum, selection) => sum + selection.subtotal, 0)
  const total = baseTotal + addonsTotal
  const months = monthsFromDates(departureDates)
  const firstGallery = gallery[activeImage] ?? gallery[0]
  const roomErrors = bookingPricingMode === 'room_occupancy'
    ? rooms.map((room) => validateRoom(room, currentPrices)).filter(Boolean)
    : []
  const hasCapacity = !selectedDeparture?.remainingStock || totalTravelers <= selectedDeparture.remainingStock
  const perPersonValid = adultCount + seniorCount > 0
    && (!adultCount || Boolean(findPrice(currentPrices, 1)))
    && (!childCount || Boolean(findPrice(currentPrices, 2)))
  const hasCheckoutVariants = bookingPricingMode === 'room_occupancy'
    ? rooms.every((room) => Boolean(findPrice(currentPrices, room.priceType, 'adult')?.shopifyVariantId)
      && (!room.children || Boolean(findPrice(currentPrices, room.priceType, 'child')?.shopifyVariantId)))
    : [[adultCount, 1], [childCount, 2], [seniorCount, findPrice(currentPrices, 7) ? 7 : 1]]
      .every(([count, type]) => !count || Boolean(findPrice(currentPrices, type)?.shopifyVariantId))
  const canBook = Boolean(selectedDate && selectedDeparture?.available && hasCapacity
    && hasCheckoutVariants && (bookingPricingMode === 'room_occupancy' ? roomErrors.length === 0 : perPersonValid))
  const dash = t('emDash')

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const toggleAddon = (code: string) => {
    setSelectedAddonCodes((codes) =>
      codes.includes(code) ? codes.filter((selectedCode) => selectedCode !== code) : [...codes, code],
    )
  }

  const setAddonQuantity = (code: string, quantity: number) => {
    setAddonQuantities((current) => ({ ...current, [code]: Math.max(1, quantity) }))
  }

  useEffect(() => {
    const sectionIds = ['departure', 'itinerary', 'fees', 'pickup', 'notice']

    const updateActiveState = () => {
      const currentSection = sectionIds
        .map((id) => ({ id, top: document.getElementById(id)?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY }))
        .filter((section) => section.top <= 130)
        .sort((a, b) => b.top - a.top)[0]

      if (currentSection) setActiveSection(currentSection.id)

      const itinerary = document.getElementById('itinerary')
      if (itinerary) {
        const rect = itinerary.getBoundingClientRect()
        setShowDayNav(rect.top <= 120 && rect.bottom >= 260)
      }

      const currentDay = tour.itinerary.days
        .map((day) => ({
          day: day.dayNumber,
          top: document.getElementById(`day-${day.dayNumber}`)?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY,
        }))
        .filter((day) => day.top <= 180)
        .sort((a, b) => b.top - a.top)[0]

      if (currentDay) setActiveDay(currentDay.day)
    }

    updateActiveState()
    window.addEventListener('scroll', updateActiveState, { passive: true })
    window.addEventListener('resize', updateActiveState)
    return () => {
      window.removeEventListener('scroll', updateActiveState)
      window.removeEventListener('resize', updateActiveState)
    }
  }, [tour.itinerary.days])

  const handleAddToCart = () => {
    if (!canBook || !selectedDate) return
    const cartAddons = selectedAddons.map((selection) => ({
      id: selection.addon.code,
      name: selection.addon.name,
      price: selection.chargeable ? selection.addon.amount : 0,
      quantity: selection.quantity,
      variantId: selection.chargeable ? selection.addon.shopifyVariantId : undefined,
    }))

    const priceLines = bookingPricingMode === 'room_occupancy'
      ? rooms.flatMap((room, index) => {
          const occupancy = findPrice(currentPrices, room.priceType, 'adult')!
          const child = findPrice(currentPrices, room.priceType, 'child')
          const attributes = { Occupants: `${room.adults} adult, ${room.seniors} senior, ${room.children} child` }
          return [
            ...(room.adults ? [{ variantId: occupancy.shopifyVariantId!, label: occupancy.label, quantity: room.adults, unitPrice: occupancy.amount, roomNumber: index + 1, attributes }] : []),
            ...(room.seniors ? [{ variantId: occupancy.shopifyVariantId!, label: `${occupancy.label} Adult`, quantity: room.seniors, unitPrice: occupancy.amount, roomNumber: index + 1, attributes }] : []),
            ...(room.children && child ? [{ variantId: child.shopifyVariantId!, label: child.label, quantity: room.children, unitPrice: child.amount, roomNumber: index + 1, attributes }] : []),
          ]
        })
      : [
          { type: 1, count: adultCount }, { type: 7, count: seniorCount }, { type: 2, count: childCount },
        ].filter((row) => row.count > 0).map((row) => {
          const price = findPrice(currentPrices, row.type) ?? findPrice(currentPrices, 1)!
          return { variantId: price.shopifyVariantId!, label: price.label, quantity: row.count, unitPrice: price.amount }
        })

    addItem({
      bookingId: `${tour.productCode}-${selectedDate}-${Date.now()}`,
      productHandle: tour.handle,
      productTitle: tour.title,
      departureDate: selectedDate,
      pricingMode: bookingPricingMode,
      travelers: counts,
      roomSummary: bookingPricingMode === 'room_occupancy'
        ? rooms.map((room, index) => `Room ${index + 1}: ${room.adults} adult, ${room.seniors} senior, ${room.children} child`)
        : [],
      priceLines,
      currencyCode: tour.currency,
      pickupLocationId: tour.pickup[0]?.code ?? null,
      addons: cartAddons,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div className="bg-[#f2f2f2] text-[#111]">
      <div className="mx-auto max-w-[1200px] px-3 pb-10">
        <div className="my-3 bg-white px-2 py-1 text-[13px] text-[#333]">
          <span className="font-bold text-[#ff5b00]">{t('insuranceReminderLabel')}</span>
          {t('insuranceReminderBody')}
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-3 text-[13px] text-[#666]">
          {tour.categoryName ? <span className="font-bold text-[#333]">{tour.categoryName}</span> : null}
          <span className="text-[#999]">{t('productCode')} <b className="text-[#333]">{tour.productCode}</b></span>
          {tour.duration.label ? <span>{tour.duration.label}</span> : null}
        </div>

        <section className="tour-detail-hero-grid bg-white p-5">
          <div className="relative min-w-0">
            {gallery.length > 0 ? (
              <ImageSlider
                images={gallery}
                autoplayMs={5000}
                activeIndex={activeImage}
                onIndexChange={setActiveImage}
                onImageClick={() => setGalleryModalOpen(true)}
                paused={galleryModalOpen}
              />
            ) : (
              <div className="flex h-[320px] items-center justify-center bg-[#f5f5f5] text-[#999]">{t('noImages')}</div>
            )}

            <TourCalendar
              dateMap={dateMap}
              months={months}
              activeMonth={activeMonth}
              setActiveMonth={setActiveMonth}
              selectedDate={selectedDate}
              setSelectedDate={selectDepartureDate}
              currency={tour.currency}
            />
          </div>

          <aside className="min-w-0">
            <h1 className="text-[20px] font-bold leading-[1.55] lg:text-[24px]">{tour.title}</h1>
            {tour.subtitle ? <p className="mt-2 text-[14px] text-[#666]">{tour.subtitle}</p> : null}

            <div className="mt-3 border border-[#f1d59d] bg-[#fffaf0] p-4 text-[#ff5b00]">
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-sm text-[#999]">{t('from')}</p>
                  <p className="text-[32px] font-bold leading-none xl:text-[44px]">
                    {money(tour.fromPrice, tour.currency, locale)} <span className="text-sm">{t('perPerson')}</span>
                  </p>
                </div>
              </div>
            </div>

            {tour.highlights.length > 0 ? (
              <div className="mt-4">
                <p className="mb-2 text-[14px] text-[#777]">{t('highlights')}</p>
                <ul className="space-y-2 text-[14px] leading-6">
                  {tour.highlights.map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2cc66d]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {tour.transfers.length > 0 || tour.vehicles.length > 0 ? (
              <div className="mt-4 grid gap-3 text-[13px] sm:grid-cols-2">
                {tour.transfers.length > 0 ? (
                  <div>
                    <p className="mb-1 text-[#777]">{t('airportTransfer')}</p>
                    <div className="flex flex-wrap gap-2">
                      {tour.transfers.map((item) => (
                        <span key={item} className="rounded border border-[#6fb2ff] px-3 py-1 text-[#1683e9]">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {tour.vehicles.length > 0 ? (
                  <div>
                    <p className="mb-1 text-[#777]">{t('transportation')}</p>
                    <div className="flex flex-wrap gap-2">
                      {tour.vehicles.map((item) => (
                        <span key={item} className="rounded border border-[#ddd] px-3 py-1 text-[#555]">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-1 gap-y-4 border-y border-[#e5e5e5] py-4 text-[14px] sm:grid-cols-2">
              <Meta label={t('departure')} value={tour.startName || dash} />
              <Meta label={t('return')} value={tour.endName || dash} />
              <Meta
                label={t('duration')}
                value={
                  tour.duration.label ||
                  t('durationFallback', { days: tour.duration.days, nights: tour.duration.nights })
                }
              />
              <Meta label={t('product')} value={tour.productCode} />
            </div>

            {tour.destinations.length > 0 ? (
              <div className="mt-4 text-[14px]">
                <p className="mb-2 text-[#777]">{t('destinations')}</p>
                <p className="leading-7">{tour.destinations.join(' · ')}</p>
              </div>
            ) : null}

            <div className="mt-4 flex items-center gap-2 border-b border-[#e5e5e5] pb-4 text-sm">
              <ShieldCheck className="h-6 w-6 shrink-0" />
              <span>
                <b>{t('confirmation')}</b> {tour.constraints.confirmTypeLabel || t('confirmationStandard')}
                {tour.advanceDay > 0
                  ? ` · ${t('advanceBooking', { days: tour.advanceDay, time: tour.advanceTime || '12:00' })}`
                  : null}
              </span>
            </div>
          </aside>
        </section>

        <TourBookingForm
          availableDates={departureDates.filter((date) => date.available).map((date) => date.date)}
          tripDays={tour.duration.days || tour.itinerary.days.length}
          selectedDate={selectedDate}
          setSelectedDate={selectDepartureDate}
          roomPrices={roomPrices}
          selectedRoom={selectedRoom}
          setSelectedPriceType={setSelectedPriceType}
          adultCount={adultCount}
          setAdultCount={setAdultCount}
          childCount={childCount}
          setChildCount={setChildCount}
          seniorCount={seniorCount}
          setSeniorCount={setSeniorCount}
          pricingMode={bookingPricingMode}
          prices={currentPrices}
          rooms={rooms}
          setRooms={setRooms}
          remainingStock={selectedDeparture?.remainingStock ?? 0}
          bookingMessage={roomErrors[0] || (!hasCapacity ? 'This party exceeds the remaining departure capacity.' : !hasCheckoutVariants ? 'A required Shopify price is not linked.' : '')}
          childPrice={childPrice}
          childNote={tour.constraints.childNote}
          isChildAvailable={currentPrices.some((price) => price.travelerType === 'child' || price.priceType === 2)}
          addons={addonSelections}
          selectedAddonCodes={selectedAddonCodes}
          onToggleAddon={toggleAddon}
          onAddonQuantityChange={setAddonQuantity}
          currency={tour.currency}
          baseTotal={baseTotal}
          addonsTotal={addonsTotal}
          total={total}
          canBook={canBook}
          onAddToCart={handleAddToCart}
          added={added}
        />

        <TourStickyNav
          activeSection={activeSection}
          onJump={scrollTo}
          showDeparture={Boolean(tour.departureNotes)}
          canBook={canBook}
          onBook={handleAddToCart}
        />

        <main className="bg-white px-5 pb-10">
          {tour.departureNotes ? (
            <section id="departure" className="scroll-mt-20 border-t border-[#eee] py-10">
              <h2 className="mb-8 text-center text-[30px]">{t('departureDate')}</h2>
              <div className="rounded bg-[#f6f9fc] p-6">
                <HtmlOrText html={tour.departureNotes} />
              </div>
            </section>
          ) : null}

          <section id="itinerary" className="scroll-mt-20 py-8">
            <h2 className="mb-8 text-center text-[30px]">{t('itinerary')}</h2>

            <div className="grid gap-4 rounded bg-[#f6f9fc] p-6 md:grid-cols-3">
              <OverviewCard title={t('route')} body={`${tour.startName || dash} → ${tour.endName || dash}`} />
              <OverviewCard
                title={t('duration')}
                body={`${tour.duration.label || t('durationFallback', { days: tour.duration.days, nights: tour.duration.nights })}\n${t('dayPlan', { count: tour.itinerary.days.length })}`}
              />
              <OverviewCard
                title={t('services')}
                body={[...tour.transfers, ...tour.vehicles].filter(Boolean).join('\n') || dash}
              />
            </div>

            <div className="mt-4 bg-[#fffbe8] px-4 py-5 text-[14px] font-bold">
              {t('itineraryDisclaimer')}
            </div>

            <div className="relative mt-5">
              {showDayNav ? (
                <div className="fixed left-[max(12px,calc((100vw-1200px)/2-96px))] top-[180px] z-40 hidden w-[80px] rounded bg-white p-2 shadow-lg min-[1250px]:block">
                  {tour.itinerary.days.map((day) => (
                    <button
                      key={day.dayNumber}
                      type="button"
                      onClick={() => scrollTo(`day-${day.dayNumber}`)}
                      className={`mb-2 block h-10 w-full rounded ${activeDay === day.dayNumber ? 'bg-[#3498f5] text-white' : 'bg-[#f5f5f5] hover:bg-[#3498f5] hover:text-white'}`}
                    >
                      {t('dayLabel', { day: day.dayNumber })}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="space-y-8">
                {tour.itinerary.days.map((day) => (
                  <ItineraryDay key={day.dayNumber} day={day} />
                ))}
              </div>
            </div>
          </section>

          <TourFeesSection tour={tour} />
          <TourPickupSection tour={tour} />
          <TourNoticeSection tour={tour} />
        </main>

        <BookingSteps />
      </div>

      {galleryModalOpen && firstGallery ? (
        <div className="fixed inset-0 z-95 flex cursor-pointer items-center justify-center bg-black/90 p-6" onClick={() => setGalleryModalOpen(false)}>
          <button type="button" onClick={() => setGalleryModalOpen(false)} className="absolute right-6 top-4 text-4xl text-white">×</button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              setActiveImage((activeImage + gallery.length - 1) % gallery.length)
            }}
            className="absolute left-6 top-1/2 text-6xl text-white/80"
          >
            ‹
          </button>
          <div className="relative h-[82vh] w-[92vw] cursor-default" onClick={(event) => event.stopPropagation()}>
            <Image src={firstGallery.src} alt={firstGallery.alt} fill sizes="92vw" className="object-contain" />
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              setActiveImage((activeImage + 1) % gallery.length)
            }}
            className="absolute right-6 top-1/2 text-6xl text-white/80"
          >
            ›
          </button>
        </div>
      ) : null}
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <MapPin className="h-5 w-5 shrink-0 text-[#1683e9]" />
      <span className="text-[#777]">{label}</span>
      <b className="line-clamp-2">{value}</b>
    </div>
  )
}

function OverviewCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="text-[14px] leading-6">
      <h3 className="mb-2 text-[17px] font-bold">{title}</h3>
      <p className="whitespace-pre-line text-[#555]">{body}</p>
    </div>
  )
}

function TourCalendar({
  dateMap,
  months,
  activeMonth,
  setActiveMonth,
  selectedDate,
  setSelectedDate,
  currency,
}: {
  dateMap: Map<string, TourAvailabilityDay>
  months: string[]
  activeMonth: string
  setActiveMonth: (month: string) => void
  selectedDate: string | null
  setSelectedDate: (date: string) => void
  currency: string
}) {
  const t = useTranslations('tourDetail')
  const tc = useTranslations('calendar')
  const locale = useLocale()
  const weekdays = tc.raw('weekdays') as string[]

  if (!activeMonth) {
    return <div className="mt-4 border border-[#d9d9d9] p-4 text-[14px] text-[#999]">{t('noDepartureDates')}</div>
  }

  const monthMatch = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(activeMonth)
  if (!monthMatch) {
    return <div className="mt-4 border border-[#d9d9d9] p-4 text-[14px] text-[#999]">{t('noDepartureDates')}</div>
  }

  const year = Number(monthMatch[1])
  const month = Number(monthMatch[2]) - 1
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: Array<number | null> = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)]

  return (
    <div>
      <div className="mt-4 border border-[#d9d9d9]">
        <div className="bg-[#fffef2] p-3 text-[12px] leading-5 text-[#ff5b00]">
          <p>{t('calendarHintPrice')}</p>
          <p>{t('calendarHintSelect')}</p>
        </div>
        <div className="flex overflow-x-auto border-b">
          {months.map((monthValue) => (
              <button
                key={monthValue}
                type="button"
                onClick={() => setActiveMonth(monthValue)}
                className={`min-w-[92px] px-3 py-2 text-center ${activeMonth === monthValue ? 'border-b-2 border-[#1683e9]' : ''}`}
              >
                <b className={activeMonth === monthValue ? 'text-[#1683e9]' : ''}>{monthLabel(monthValue)}</b>
              </button>
          ))}
        </div>
        <div className="grid grid-cols-7 border-l border-t text-[12px]">
          {weekdays.map((day) => (
            <div key={day} className="border-b border-r py-2 text-center text-[#777]">{day}</div>
          ))}
          {cells.map((day, index) => {
            if (day === null) return <div key={`pad-${index}`} className="h-[72px] border-b border-r bg-[#fafafa]" />
            const date = `${activeMonth}-${String(day).padStart(2, '0')}`
            const departure = dateMap.get(date)
            const available = departure?.available
            return (
              <button
                key={date}
                type="button"
                disabled={!available}
                onClick={() => setSelectedDate(date)}
                className={`relative flex h-[72px] flex-col border-b border-r p-1 text-left ${selectedDate === date ? 'bg-[#fff1e8]' : available ? 'bg-white' : 'bg-[#fafafa] text-[#aaa]'}`}
              >
                <span className="absolute left-1 top-1 leading-none">{String(day).padStart(2, '0')}</span>
                {available && departure ? (
                  <span className="m-auto text-center text-[13px] leading-[17px] text-[#ff5b00]">
                    {money(departure.lowestPrice, currency, locale)}
                    <br />
                    <small className="text-[11px]">
                      {departure.status === 'limited' ? t('statusLimited') : t('statusOpen')}
                    </small>
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function formatTravelRange(startDate: string, tripDays: number, weekdays: string[]) {
  const start = new Date(`${startDate}T12:00:00`)
  const end = new Date(start)
  end.setDate(end.getDate() + Math.max(tripDays, 1) - 1)
  const pad = (value: number) => String(value).padStart(2, '0')
  const startLabel = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())} ${weekdays[start.getDay()]}`
  const endLabel = `${pad(end.getMonth() + 1)}-${pad(end.getDate())} ${weekdays[end.getDay()]}`
  return `${startLabel} → ${endLabel}`
}

function TourBookingForm(props: {
  availableDates: string[]
  tripDays: number
  selectedDate: string | null
  setSelectedDate: (date: string) => void
  roomPrices: TourPrice[]
  selectedRoom: TourPrice | null
  setSelectedPriceType: (priceType: number) => void
  adultCount: number
  setAdultCount: (value: number) => void
  childCount: number
  setChildCount: (value: number) => void
  seniorCount: number
  setSeniorCount: (value: number) => void
  pricingMode: TourDetailData['pricingMode']
  prices: TourPrice[]
  rooms: RoomAssignment[]
  setRooms: (rooms: RoomAssignment[]) => void
  remainingStock: number
  bookingMessage: string
  childPrice?: TourPrice
  childNote: string
  isChildAvailable: boolean
  addons: AddonSelection[]
  selectedAddonCodes: string[]
  onToggleAddon: (code: string) => void
  onAddonQuantityChange: (code: string, quantity: number) => void
  currency: string
  baseTotal: number
  addonsTotal: number
  total: number
  canBook: boolean
  onAddToCart: () => void
  added: boolean
}) {
  const t = useTranslations('tourDetail')
  const tc = useTranslations('calendar')
  const locale = useLocale()
  const weekdays = tc.raw('weekdays') as string[]
  const dash = t('emDash')

  return (
    <section className="mt-6 border-2 border-[#f5a400] bg-[#fffef2] p-4 md:p-5">
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr_240px]">
        <div className="space-y-4">
          <label className="block text-[14px]">
            <span className="mb-1 block font-bold">{t('departureDate')}</span>
            <select
              value={props.selectedDate ?? ''}
              onChange={(event) => props.setSelectedDate(event.target.value)}
              className="w-full rounded border border-[#ddd] bg-white px-3 py-2"
            >
              {props.availableDates.length === 0 ? <option value="">{t('noDates')}</option> : null}
              {props.availableDates.map((date) => (
                <option key={date} value={date}>
                  {formatTravelRange(date, props.tripDays, weekdays)}
                </option>
              ))}
            </select>
          </label>

          {props.pricingMode === 'room_occupancy' ? <div>
            <p className="mb-2 text-[14px] font-bold">{t('roomOccupancy')}</p>
            <div className="space-y-3">
              {props.rooms.map((room, index) => {
                const capacity = room.priceType - 2
                const adultOccupants = room.adults + room.seniors
                const adultRate = findPrice(props.prices, room.priceType, 'adult')
                const childRate = findPrice(props.prices, room.priceType, 'child')
                const update = (patch: Partial<RoomAssignment>) => props.setRooms(props.rooms.map((item) => item.id === room.id ? { ...item, ...patch } : item))
                return <div key={room.id} className="rounded border border-[#e5e5e5] bg-white p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <b>Room {index + 1}</b>
                    {props.rooms.length > 1 ? <button type="button" className="text-xs text-red-700" onClick={() => props.setRooms(props.rooms.filter((item) => item.id !== room.id))}>Remove room</button> : null}
                  </div>
                  <select value={room.priceType} onChange={(event) => update({ priceType: Number(event.target.value) as RoomAssignment['priceType'] })} className="mb-3 w-full rounded border px-3 py-2 text-sm">
                    {props.roomPrices.map((price) => <option key={price.priceType} value={price.priceType}>{price.label} · {money(price.amount, props.currency, locale)} per adult</option>)}
                  </select>
                  <div className="space-y-3">
                    <Counter label={t('adults')} hint={adultRate ? money(adultRate.amount, props.currency, locale) : undefined} value={room.adults} min={0} max={capacity - room.seniors} onChange={(adults) => update({ adults, children: Math.min(room.children, (adults + room.seniors) * 2) })} />
                    {findPrice(props.prices, 7) ? <Counter label="Seniors" hint={adultRate ? money(adultRate.amount, props.currency, locale) : undefined} value={room.seniors} min={0} max={capacity - room.adults} onChange={(seniors) => update({ seniors, children: Math.min(room.children, (room.adults + seniors) * 2) })} /> : null}
                    {childRate ? <Counter label={t('children')} hint={money(childRate.amount, props.currency, locale)} value={room.children} min={0} max={adultOccupants * 2} onChange={(children) => update({ children })} /> : null}
                  </div>
                  <p className="mt-2 text-xs text-[#777]">{adultOccupants} of {capacity} adults/seniors · {room.children} children · {money(roomTotal(room, props.prices), props.currency, locale)}</p>
                </div>
              })}
            </div>
            <button type="button" className="mt-3 rounded border bg-white px-3 py-2 text-sm font-bold" onClick={() => props.setRooms([...props.rooms, { id: `room-${Date.now()}`, priceType: (props.roomPrices[0]?.priceType ?? 4) as RoomAssignment['priceType'], adults: 1, seniors: 0, children: 0 }])}>+ Add another room</button>
          </div> : null}
        </div>

        {props.pricingMode === 'per_person' ? <div className="space-y-4">
          <Counter
            label={t('adults')}
            value={props.adultCount}
            min={0}
            onChange={props.setAdultCount}
            hint={findPrice(props.prices, 1) ? money(findPrice(props.prices, 1)?.amount ?? 0, props.currency, locale) : undefined}
          />
          {findPrice(props.prices, 7) ? <Counter label="Seniors" value={props.seniorCount} min={0} onChange={props.setSeniorCount} hint={money(findPrice(props.prices, 7)?.amount ?? 0, props.currency, locale)} /> : null}
          {props.isChildAvailable ? (
            <Counter
              label={t('children')}
              value={props.childCount}
              min={0}
              onChange={props.setChildCount}
              hint={
                props.childPrice
                  ? money(props.childPrice.amount, props.currency, locale)
                  : t('childRateUnavailable')
              }
            />
          ) : null}
          {props.childNote ? <p className="text-[12px] leading-5 text-[#777]">{props.childNote}</p> : null}
          {props.bookingMessage ? <p className="text-sm text-amber-700">{props.bookingMessage} Contact us for a manual quote.</p> : null}
        </div> : <div className="space-y-2 text-sm"><b>Booking summary</b><p>{props.rooms.length} room{props.rooms.length === 1 ? '' : 's'}</p>{props.remainingStock > 0 ? <p>{props.remainingStock} traveler spaces remaining</p> : null}{props.bookingMessage ? <p className="text-amber-700">{props.bookingMessage} Contact us for a manual quote.</p> : null}</div>}

        {props.addons.length > 0 ? (
          <div className="space-y-3 border-t border-[#f0d58a] pt-4 lg:col-span-2">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-[14px] font-bold">{t('optionalAddons')}</p>
                <p className="text-[12px] text-[#777]">{t('optionalAddonsHint')}</p>
              </div>
              {props.addonsTotal > 0 ? (
                <p className="text-[13px] font-bold text-[#ff5b00]">
                  {t('addonsSubtotal', { amount: money(props.addonsTotal, props.currency, locale) })}
                </p>
              ) : null}
            </div>
            <div className="grid max-h-[420px] gap-2 overflow-y-auto pr-1 md:grid-cols-2">
              {props.addons.map((selection) => {
                const selected = props.selectedAddonCodes.includes(selection.addon.code)
                const currency = selection.addon.currency || props.currency
                return (
                  <div
                    key={selection.addon.code}
                    className={`relative rounded border bg-white p-3 text-[13px] leading-5 ${
                      selected ? 'border-[#f5a400] shadow-sm' : 'border-[#e5e5e5]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <label className="flex min-w-0 cursor-pointer items-start gap-3 pr-2">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => props.onToggleAddon(selection.addon.code)}
                          className="mt-1 h-4 w-4 shrink-0 accent-[#f5a400]"
                        />
                        <span className="font-bold text-[#222]">{selection.addon.name}</span>
                      </label>
                      <div className="flex shrink-0 items-center rounded border border-[#ddd] bg-white" aria-label={`${selection.addon.name} quantity`}>
                        <button type="button" aria-label={`Decrease ${selection.addon.name} quantity`} disabled={selection.quantity <= 1} onClick={() => props.onAddonQuantityChange(selection.addon.code, selection.quantity - 1)} className="h-7 w-7 text-sm disabled:opacity-35">−</button>
                        <span className="min-w-7 text-center text-xs font-bold" aria-live="polite">{selection.quantity}</span>
                        <button type="button" aria-label={`Increase ${selection.addon.name} quantity`} onClick={() => props.onAddonQuantityChange(selection.addon.code, selection.quantity + 1)} className="h-7 w-7 text-sm">+</button>
                      </div>
                    </div>
                    <div className="ml-7 min-w-0">
                      <span className="mt-1 block text-[#666]">
                        {selection.chargeable ? (
                          <>
                            {money(selection.addon.amount, currency, locale)} × {selection.quantity}
                            {selected ? (
                              <b className="ml-1 text-[#ff5b00]">= {money(selection.subtotal, currency, locale)}</b>
                            ) : null}
                          </>
                        ) : (
                          <b className="text-[#777]">{t('requestOnly')}</b>
                        )}
                      </span>
                      {selection.addon.description ? (
                        <span className="mt-1 block text-[#777]">{selection.addon.description}</span>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}

        <div className="flex min-w-[200px] flex-col border-t border-[#f0d58a] pt-4 lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <div>
            <p className="text-[13px] text-[#777]">{t('estimatedTotal')}</p>
            <p className="text-[28px] font-bold text-[#ff5b00]">
              {props.canBook ? money(props.total, props.currency, locale) : dash}
            </p>
            {props.canBook ? (
              <div className="mt-2 space-y-1 text-[12px] text-[#777]">
                <p className="flex justify-between gap-3">
                  <span>{t('base')}</span>
                  <span>{money(props.baseTotal, props.currency, locale)}</span>
                </p>
                <p className="flex justify-between gap-3">
                  <span>{t('addons')}</span>
                  <span>{money(props.addonsTotal, props.currency, locale)}</span>
                </p>
              </div>
            ) : null}
            {!props.canBook ? (
              <p className="mt-2 text-[12px] text-[#999]">{t('selectDateAndRoom')}</p>
            ) : null}
          </div>
          <button
            type="button"
            disabled={!props.canBook}
            onClick={props.onAddToCart}
            className="mt-4 rounded bg-[#f5a400] px-8 py-3 font-bold text-white disabled:bg-[#f5d386]"
          >
            {props.added ? t('addedToCart') : t('bookNow')}
          </button>
          <p className="mt-3 flex items-start gap-1.5 text-[12px] leading-5 text-[#666]">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#f5a400]" aria-hidden />
            {t('finalPriceNote')}
          </p>
        </div>
      </div>
    </section>
  )
}

function Counter({
  label,
  value,
  min,
  onChange,
  hint,
  max,
}: {
  label: string
  value: number
  min: number
  onChange: (value: number) => void
  hint?: string
  max?: number
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-baseline gap-2 text-[14px]">
          <span className="font-bold">{label}</span>
          {hint ? <span className="whitespace-nowrap font-semibold text-[#ff5b00]">{hint}</span> : null}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-8 w-8 rounded border bg-white disabled:opacity-40"
            disabled={value <= min}
            onClick={() => onChange(Math.max(min, value - 1))}
          >
            −
          </button>
          <span className="w-8 text-center font-bold">{value}</span>
          <button
            type="button"
            className="h-8 w-8 rounded border bg-white disabled:opacity-40"
            disabled={max !== undefined && value >= Math.max(0, max)}
            onClick={() => onChange(value + 1)}
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}

function TourStickyNav({
  activeSection,
  onJump,
  showDeparture,
  canBook,
  onBook,
}: {
  activeSection: string
  onJump: (id: string) => void
  showDeparture: boolean
  canBook: boolean
  onBook: () => void
}) {
  const t = useTranslations('tourDetail')
  const items: Array<[string, string]> = [
    ...(showDeparture ? [['departure', t('navDeparture')] as [string, string]] : []),
    ['itinerary', t('navItinerary')],
    ['fees', t('navFees')],
    ['pickup', t('navPickup')],
    ['notice', t('navPolicies')],
  ]
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [isStuck, setIsStuck] = useState(false)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(([entry]) => {
      setIsStuck(!entry.isIntersecting)
    }, { threshold: 0 })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div ref={sentinelRef} className="mt-6 h-px w-full" aria-hidden />
      <nav className="sticky top-0 z-30 flex overflow-x-auto border-b bg-white px-5">
        {items.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => onJump(id)}
            className={`h-[60px] shrink-0 border-b-2 px-6 text-[16px] ${
              activeSection === id ? 'border-[#1683e9] text-[#1683e9]' : 'border-transparent hover:border-[#1683e9] hover:text-[#1683e9]'
            }`}
          >
            {label}
          </button>
        ))}
        {isStuck ? (
          <button
            type="button"
            onClick={onBook}
            disabled={!canBook}
            className="ml-auto my-3 hidden h-10 rounded bg-[#f5a400] px-12 font-bold text-white disabled:bg-[#f5d386] md:block"
          >
            {t('bookNow')}
          </button>
        ) : null}
      </nav>
    </>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="mb-4 border-l-4 border-[#1683e9] pl-3 text-[20px]">{children}</h3>
}

function VehicleIcon({ vehicle, className = 'h-4 w-4' }: { vehicle?: string; className?: string }) {
  const label = vehicle?.toLowerCase() ?? ''
  const Icon = label.includes('air') || label.includes('plane')
    ? Plane
    : label.includes('ship') || label.includes('cruise') || label.includes('boat')
      ? Ship
      : label.includes('train')
        ? TrainFront
        : label.includes('bus')
          ? Bus
          : Car

  return <Icon className={className} aria-hidden />
}

function itineraryStopName(stop: TourItineraryDay['stops'][number]) {
  return (stop.label || stop.place || '').trim()
}

function itineraryStopsText(day: TourItineraryDay) {
  return day.stops.map(itineraryStopName).filter(Boolean).join(' > ')
}

function ItineraryStopTitle({ day }: { day: TourItineraryDay }) {
  const t = useTranslations('tourDetail')
  const stops = day.stops.filter((stop) => itineraryStopName(stop))
  if (stops.length === 0) return null

  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 py-4 pr-4 leading-8">
      {stops.map((stop, index) => {
        const name = itineraryStopName(stop)
        return (
          <span key={`${name}-${index}`} className="inline-flex items-center gap-2">
            {index > 0 ? (
              <>
                <span className="text-[#9ab8d2]">&gt;</span>
                <span className="inline-flex items-center gap-1.5" title={stop.vehicle || t('transfer')}>
                  <VehicleIcon vehicle={stop.vehicle} className="h-5 w-5 text-[#1683e9]" />
                  <b>{name}</b>
                </span>
              </>
            ) : (
              <b>{name}</b>
            )}
          </span>
        )
      })}
    </span>
  )
}

function ItineraryDay({ day }: { day: TourItineraryDay }) {
  const t = useTranslations('tourDetail')
  const stopsTitle = itineraryStopsText(day)
  return (
    <article id={`day-${day.dayNumber}`} className="scroll-mt-24">
      <h3 className="flex bg-[#e5f5ff] text-[22px]">
        <span className="mr-6 flex w-[96px] shrink-0 items-center justify-center bg-[#73c6f7] py-4 font-bold text-white">
          {t('dayLabel', { day: day.dayNumber })}
        </span>
        {stopsTitle ? (
          <ItineraryStopTitle day={day} />
        ) : (
          <span className="py-4 pr-4 leading-8">{day.title}</span>
        )}
      </h3>
      <div className="mt-5 border-l-2 border-[#1683e9] pl-5 text-[15px] leading-8">
        {day.descriptionHtml || day.descriptionText ? (
          <div className="rounded bg-[#fafcff] p-4">
            <HtmlOrText html={day.descriptionHtml} text={day.descriptionText} />
          </div>
        ) : null}
        {day.images.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {day.images.map((image) => {
              const caption = image.caption || image.alt
              return (
                <figure key={image.src} className="overflow-hidden rounded bg-white shadow-sm">
                  <div className="relative aspect-[16/9]">
                    <Image
                      src={image.src}
                      alt={image.alt || image.caption || day.title}
                      fill
                      sizes="(min-width: 768px) 360px, 92vw"
                      className="object-cover"
                    />
                  </div>
                  {caption ? (
                    <figcaption className="px-3 py-2 text-[13px] leading-5 text-[#666]">
                      {caption}
                    </figcaption>
                  ) : null}
                </figure>
              )
            })}
          </div>
        ) : null}
        {day.hotel ? (
          <p>
            <b>{t('hotel')}</b>　{day.hotel}
            {day.regionName ? <span className="text-[#777]"> ({day.regionName})</span> : null}
          </p>
        ) : null}
      </div>
    </article>
  )
}

function TourFeesSection({ tour }: { tour: TourDetailData }) {
  const t = useTranslations('tourDetail')
  const locale = useLocale()
  const displayPrices = findAdultRoomPrices(tour.basePrices)
  const child = findChildPrice(tour.basePrices)
  const dash = t('emDash')

  return (
    <section id="fees" className="scroll-mt-20 py-10">
      <h2 className="mb-8 text-center text-[30px]">{t('fees')}</h2>

      {displayPrices.length > 0 ? (
        <div className="mb-6 rounded bg-[#f6f6f6] p-6">
          <h3 className="mb-6 flex items-center gap-2 text-[20px] font-bold">{t('packagePriceBase')}</h3>
          <div className="grid gap-6 text-center sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {displayPrices.map((price) => (
              <div key={price.priceType}>
                <p>{price.label}</p>
                <p className="text-[#ff5b00]">{money(price.amount, tour.currency, locale)} {t('perPersonShort')}</p>
              </div>
            ))}
            {child ? (
              <div>
                <p>{child.label}</p>
                <p className="text-[#ff5b00]">{money(child.amount, tour.currency, locale)} {t('perPersonShort')}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded border border-[#dfe7f2]">
        <table className="w-full min-w-[680px] table-fixed border-collapse">
          <thead className="bg-[#f6f9fc] text-left">
            <tr>
              <th scope="col" className="border-r border-[#dfe7f2] px-5 py-3 text-[16px] font-bold">
                {t('included')}
              </th>
              <th scope="col" className="px-5 py-3 text-[16px] font-bold">
                {t('extraExpense')}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-r border-t border-[#dfe7f2] p-5 align-top">
                <HtmlOrText html={tour.cost.includesHtml} text={tour.cost.includesText} />
              </td>
              <td className="border-t border-[#dfe7f2] p-5 align-top">
                <HtmlOrText html={tour.cost.excludesHtml} text={tour.cost.excludesText} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {tour.addons.length > 0 ? (
        <div className="mt-6">
          <SectionTitle>{t('optionalAddons')}</SectionTitle>
          <div className="rounded border border-[#dfe7f2] bg-[#fafcff] p-5 text-[14px] leading-7 text-[#555]">
            {t('optionalAddonsFeesNote')}
          </div>
          <div className="hidden">
            <table className="w-full border-collapse text-[14px]">
              <thead>
                <tr>
                  {[t('addonColItem'), t('addonColPrice'), t('addonColFor'), t('addonColNote')].map((column) => (
                    <th key={column} className="border border-[#dfe7f2] bg-[#fafcff] p-4 text-left text-[#666]">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tour.addons.map((addon) => (
                  <tr key={addon.code}>
                    <td className="border border-[#dfe7f2] p-4 leading-7">{addon.name}</td>
                    <td className="border border-[#dfe7f2] p-4 leading-7">
                      {money(addon.amount, addon.currency || tour.currency, locale)}
                    </td>
                    <td className="border border-[#dfe7f2] p-4 leading-7">{addon.peopleTypeLabel || dash}</td>
                    <td className="border border-[#dfe7f2] p-4 leading-7">{addon.description || dash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function TourPickupSection({ tour }: { tour: TourDetailData }) {
  const t = useTranslations('tourDetail')
  if (tour.pickup.length === 0 && tour.dropoff.length === 0) return null

  return (
    <section id="pickup" className="scroll-mt-20 py-10">
      <h2 className="mb-8 text-center text-[30px]">{t('pickupDropoff')}</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {tour.pickup.map((point) => (
          <PointCard key={`pick-${point.code}`} title={t('pickup')} point={point} />
        ))}
        {tour.dropoff.map((point) => (
          <PointCard key={`drop-${point.code}`} title={t('dropoff')} point={point} />
        ))}
      </div>
    </section>
  )
}

function PointCard({
  title,
  point,
}: {
  title: string
  point: TourDetailData['pickup'][number]
}) {
  const t = useTranslations('tourDetail')
  return (
    <div className="rounded border border-[#dfe7f2] p-5">
      <p className="mb-2 flex items-center gap-2 text-[16px] font-bold">
        <Plane className="h-5 w-5 text-[#1683e9]" />
        {title}
        {point.isAirport ? <span className="rounded bg-[#e8f4ff] px-2 py-0.5 text-[12px] font-normal text-[#1683e9]">{t('airport')}</span> : null}
      </p>
      <p className="text-[15px] font-bold">{point.name}</p>
      {point.address ? <p className="mt-1 text-[13px] text-[#777]">{point.address}</p> : null}
      {point.description ? <p className="mt-3 whitespace-pre-line text-[14px] leading-7 text-[#555]">{point.description}</p> : null}
    </div>
  )
}

function TourNoticeSection({ tour }: { tour: TourDetailData }) {
  const t = useTranslations('tourDetail')
  const notices = tour.notices.filter((notice) => notice.noticeType !== 0)

  return (
    <section id="notice" className="scroll-mt-20 py-10">
      <h2 className="mb-8 text-center text-[30px]">{t('bookingPolicies')}</h2>
      <div className="space-y-8">
        {notices.map((notice) => (
          <div key={`${notice.noticeType}-${notice.matterName}`}>
            <SectionTitle>{notice.typeLabel || notice.matterName}</SectionTitle>
            {notice.matterName && notice.matterName !== notice.typeLabel ? (
              <p className="mb-3 text-[14px] text-[#777]">{notice.matterName}</p>
            ) : null}
            <div className="rounded border border-[#dfe7f2] p-5">
              <HtmlOrText html={notice.html} text={notice.text} />
            </div>
          </div>
        ))}
        {notices.length === 0 ? <p className="text-[14px] text-[#999]">{t('noPolicies')}</p> : null}
      </div>
    </section>
  )
}

function BookingSteps() {
  const t = useTranslations('tourDetail')
  const steps = [
    { title: t('step1Title'), description: t('step1Desc') },
    { title: t('step2Title'), description: t('step2Desc') },
    { title: t('step3Title'), description: t('step3Desc') },
    { title: t('step4Title'), description: t('step4Desc') },
  ]

  return (
    <section className="mt-6 bg-white px-5 py-8">
      <h2 className="mb-6 text-center text-[24px]">{t('howBookingWorks')}</h2>
      <div className="grid gap-4 md:grid-cols-4">
        {steps.map((step, index) => (
          <div key={step.title} className="rounded bg-[#f6f9fc] p-4 text-[14px] leading-6">
            <p className="mb-2 text-[18px] font-bold text-[#1683e9]">{index + 1}. {step.title}</p>
            <p className="text-[#555]">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
