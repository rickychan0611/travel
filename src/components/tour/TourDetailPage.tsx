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
import type {
  TourAddon,
  TourAvailabilityDay,
  TourDetailData,
  TourItineraryDay,
  TourPrice,
} from '@/lib/toursbms/types'

type Props = {
  locale: string
  tour: TourDetailData
}

type AddonSelection = {
  addon: TourAddon
  chargeable: boolean
  disabled: boolean
  quantity: number
  subtotal: number
  quantityLabel: string
}

type TourDetailTranslator = ReturnType<typeof useTranslations<'tourDetail'>>

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
  const months = Array.from(new Set(dates.map((date) => date.date.slice(0, 7))))
  return months.length > 0 ? months : []
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

function getAddonTravelerQuantity(addon: TourAddon, adultCount: number, childCount: number) {
  const label = addon.peopleTypeLabel.toLowerCase()
  if (label.includes('adult')) return adultCount
  if (label.includes('child')) return childCount
  return adultCount + childCount
}

function getAddonQuantityLabel(
  addon: TourAddon,
  quantity: number,
  t: TourDetailTranslator,
) {
  const label = addon.peopleTypeLabel.toLowerCase()
  if (label.includes('adult')) return t('adultCount', { count: quantity })
  if (label.includes('child')) return t('childCount', { count: quantity })
  return t('travelerCount', { count: quantity })
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
  const [activeImage, setActiveImage] = useState(0)
  const [galleryModalOpen, setGalleryModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(
    departureDates.find((date) => date.available)?.date ?? null,
  )
  const [selectedPriceType, setSelectedPriceType] = useState<number | null>(null)
  const [adultCount, setAdultCount] = useState(2)
  const [childCount, setChildCount] = useState(0)
  const [activeMonth, setActiveMonth] = useState(monthsFromDates(departureDates)[0] ?? '')
  const [activeSection, setActiveSection] = useState('intro')
  const [activeDay, setActiveDay] = useState(tour.itinerary.days[0]?.dayNumber ?? 1)
  const [showDayNav, setShowDayNav] = useState(false)
  const [added, setAdded] = useState(false)
  const [selectedAddonCodes, setSelectedAddonCodes] = useState<string[]>([])

  const gallery = tour.gallery
  const dateMap = useMemo(() => new Map(departureDates.map((date) => [date.date, date])), [departureDates])
  const selectedDeparture = selectedDate ? dateMap.get(selectedDate) : undefined
  const roomPrices = findAdultRoomPrices(selectedDeparture?.prices ?? tour.basePrices)
  const childPrice = findChildPrice(selectedDeparture?.prices ?? tour.basePrices)
  const selectedRoom =
    roomPrices.find((price) => price.priceType === selectedPriceType) ?? roomPrices[0] ?? null

  const totalTravelers = adultCount + childCount
  const adultTotal = selectedRoom ? selectedRoom.amount * adultCount : 0
  const childTotal = childPrice ? childPrice.amount * childCount : 0
  const baseTotal = adultTotal + childTotal
  const addonSelections = useMemo<AddonSelection[]>(
    () =>
      tour.addons.map((addon) => {
        const chargeable = !isRequestOnlyAddon(addon)
        const quantity = chargeable ? getAddonTravelerQuantity(addon, adultCount, childCount) : 1
        return {
          addon,
          chargeable,
          disabled: chargeable && quantity <= 0,
          quantity,
          subtotal: chargeable ? addon.amount * quantity : 0,
          quantityLabel: chargeable ? getAddonQuantityLabel(addon, quantity, t) : t('requestOnly'),
        }
      }),
    [adultCount, childCount, t, tour.addons],
  )
  const selectedAddonCodeSet = useMemo(() => new Set(selectedAddonCodes), [selectedAddonCodes])
  const selectedAddons = addonSelections.filter(
    (selection) => !selection.disabled && selectedAddonCodeSet.has(selection.addon.code),
  )
  const addonsTotal = selectedAddons.reduce((sum, selection) => sum + selection.subtotal, 0)
  const total = baseTotal + addonsTotal
  const months = monthsFromDates(departureDates)
  const firstGallery = gallery[activeImage] ?? gallery[0]
  const canBook = Boolean(selectedDate && selectedDeparture?.available && selectedRoom && adultCount > 0)
  const dash = t('emDash')

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const toggleAddon = (code: string) => {
    setSelectedAddonCodes((codes) =>
      codes.includes(code) ? codes.filter((selectedCode) => selectedCode !== code) : [...codes, code],
    )
  }

  useEffect(() => {
    const sectionIds = ['intro', 'itinerary', 'fees', 'pickup', 'notice']

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
    if (!canBook || !selectedDate || !selectedRoom) return
    const cartAddons = selectedAddons.map((selection) => ({
      id: selection.addon.code,
      name: selection.addon.name,
      price: selection.chargeable ? selection.addon.amount : 0,
      quantity: selection.chargeable ? selection.quantity : 1,
      variantId: selection.chargeable ? selection.addon.shopifyVariantId : undefined,
    }))

    addItem({
      variantId: selectedRoom.shopifyVariantId || `${tour.productCode}-${selectedDate}-${selectedRoom.priceType}`,
      productHandle: tour.handle,
      productTitle: tour.title,
      departureDate: selectedDate,
      partySize: totalTravelers,
      pricePerPerson: selectedRoom.amount,
      currencyCode: tour.currency,
      quantity: 1,
      pickupLocationId: tour.pickup[0]?.code ?? null,
      addons: cartAddons,
      lineItemProperties: {
        Adults: String(adultCount),
        Children: String(childCount),
        'Room Type': selectedRoom.label,
        'Price Type': String(selectedRoom.priceType),
        'Child Unit Price': childPrice ? String(childPrice.amount) : '0',
        'Adult Subtotal': String(adultTotal),
        'Child Subtotal': String(childTotal),
        'Base Total': String(baseTotal),
        'Add-ons Total': String(addonsTotal),
        'Selected Add-ons': selectedAddons.map((selection) => selection.addon.name).join(', '),
        Total: String(total),
      },
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
              departureDates={departureDates}
              dateMap={dateMap}
              months={months}
              activeMonth={activeMonth}
              setActiveMonth={setActiveMonth}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              currency={tour.currency}
              fallbackPrice={tour.fromPrice}
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

            {tour.departureNotes ? (
              <div className="mt-4 rounded bg-[#fffbe8] p-3 text-[13px] leading-6 text-[#666]">
                <p className="mb-1 font-bold text-[#ff5b00]">{t('departureNotes')}</p>
                <p className="whitespace-pre-line">{tour.departureNotes}</p>
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
          setSelectedDate={setSelectedDate}
          roomPrices={roomPrices}
          selectedRoom={selectedRoom}
          setSelectedPriceType={setSelectedPriceType}
          adultCount={adultCount}
          setAdultCount={setAdultCount}
          childCount={childCount}
          setChildCount={setChildCount}
          childPrice={childPrice}
          childNote={tour.constraints.childNote}
          isChildAvailable={tour.constraints.isChildAvailable}
          addons={addonSelections}
          selectedAddonCodes={selectedAddonCodes}
          onToggleAddon={toggleAddon}
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
          canBook={canBook}
          onBook={handleAddToCart}
        />

        <main className="bg-white px-5 pb-10">
          <section id="intro" className="scroll-mt-20 border-t border-[#eee] py-10">
            <SectionTitle>{t('productHighlights')}</SectionTitle>
            {tour.highlightsHtml || tour.highlights.length > 0 ? (
              <div className="rounded bg-[#f6f9fc] p-6">
                <HtmlOrText html={tour.highlightsHtml} text={tour.highlights.map((h) => `• ${h}`).join('\n')} />
              </div>
            ) : (
              <p className="text-[14px] text-[#999]">{t('noHighlights')}</p>
            )}
            {tour.itinerary.travelName ? (
              <p className="mt-4 text-[15px] text-[#555]">{tour.itinerary.travelName}</p>
            ) : null}
          </section>

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
  departureDates,
  dateMap,
  months,
  activeMonth,
  setActiveMonth,
  selectedDate,
  setSelectedDate,
  currency,
  fallbackPrice,
}: {
  departureDates: TourAvailabilityDay[]
  dateMap: Map<string, TourAvailabilityDay>
  months: string[]
  activeMonth: string
  setActiveMonth: (month: string) => void
  selectedDate: string | null
  setSelectedDate: (date: string) => void
  currency: string
  fallbackPrice: number
}) {
  const t = useTranslations('tourDetail')
  const tc = useTranslations('calendar')
  const locale = useLocale()
  const weekdays = tc.raw('weekdays') as string[]

  if (!activeMonth) {
    return <div className="mt-4 border border-[#d9d9d9] p-4 text-[14px] text-[#999]">{t('noDepartureDates')}</div>
  }

  const [year, monthRaw] = activeMonth.split('-').map(Number)
  const month = monthRaw - 1
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
          {months.map((monthValue) => {
            const monthDays = departureDates.filter((date) => date.date.startsWith(monthValue) && date.available)
            const lowest = monthDays.length > 0
              ? Math.min(...monthDays.map((date) => date.lowestPrice))
              : fallbackPrice
            return (
              <button
                key={monthValue}
                type="button"
                onClick={() => setActiveMonth(monthValue)}
                className={`min-w-[92px] px-3 py-2 text-center ${activeMonth === monthValue ? 'border-b-2 border-[#1683e9]' : ''}`}
              >
                <b className={activeMonth === monthValue ? 'text-[#1683e9]' : ''}>{monthLabel(monthValue)}</b>
                <p className="text-[12px] text-[#ff5b00]">{money(lowest, currency, locale)}</p>
              </button>
            )
          })}
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
  childPrice?: TourPrice
  childNote: string
  isChildAvailable: boolean
  addons: AddonSelection[]
  selectedAddonCodes: string[]
  onToggleAddon: (code: string) => void
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

          <div>
            <p className="mb-2 text-[14px] font-bold">{t('roomOccupancy')}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {props.roomPrices.map((price) => {
                const active = props.selectedRoom?.priceType === price.priceType
                return (
                  <button
                    key={price.priceType}
                    type="button"
                    onClick={() => props.setSelectedPriceType(price.priceType)}
                    className={`rounded border px-3 py-3 text-left ${active ? 'border-[#f5a400] bg-white shadow-sm' : 'border-[#e5e5e5] bg-white/70'}`}
                  >
                    <p className="text-[14px] font-bold">{price.label}</p>
                    <p className="text-[#ff5b00]">{money(price.amount, props.currency, locale)}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Counter
            label={t('adults')}
            value={props.adultCount}
            min={1}
            onChange={props.setAdultCount}
            hint={props.selectedRoom ? `${money(props.selectedRoom.amount, props.currency, locale)} × ${props.adultCount}` : undefined}
          />
          {props.isChildAvailable ? (
            <Counter
              label={t('children')}
              value={props.childCount}
              min={0}
              onChange={props.setChildCount}
              hint={
                props.childPrice
                  ? `${money(props.childPrice.amount, props.currency, locale)} × ${props.childCount}`
                  : t('childRateUnavailable')
              }
            />
          ) : null}
          {props.childNote ? <p className="text-[12px] leading-5 text-[#777]">{props.childNote}</p> : null}
        </div>

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
                const selected = !selection.disabled && props.selectedAddonCodes.includes(selection.addon.code)
                const currency = selection.addon.currency || props.currency
                return (
                  <label
                    key={selection.addon.code}
                    className={`flex cursor-pointer gap-3 rounded border bg-white p-3 text-[13px] leading-5 ${
                      selected ? 'border-[#f5a400] shadow-sm' : 'border-[#e5e5e5]'
                    } ${selection.disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={selection.disabled}
                      onChange={() => props.onToggleAddon(selection.addon.code)}
                      className="mt-1 h-4 w-4 accent-[#f5a400]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-[#222]">{selection.addon.name}</span>
                      <span className="mt-1 block text-[#666]">
                        {selection.chargeable ? (
                          <>
                            {money(selection.addon.amount, currency, locale)} x {selection.quantityLabel}
                            {selection.subtotal > 0 ? (
                              <b className="ml-1 text-[#ff5b00]">= {money(selection.subtotal, currency, locale)}</b>
                            ) : null}
                          </>
                        ) : (
                          <b className="text-[#777]">{t('requestOnly')}</b>
                        )}
                      </span>
                      {selection.disabled ? (
                        <span className="mt-1 block text-[#999]">{t('addonNeedTravelers')}</span>
                      ) : null}
                      {selection.addon.description ? (
                        <span className="mt-1 block text-[#777]">{selection.addon.description}</span>
                      ) : null}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        ) : null}

        <div className="flex min-w-[200px] flex-col justify-between border-t border-[#f0d58a] pt-4 lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
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
}: {
  label: string
  value: number
  min: number
  onChange: (value: number) => void
  hint?: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[14px] font-bold">{label}</span>
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
            className="h-8 w-8 rounded border bg-white"
            onClick={() => onChange(value + 1)}
          >
            +
          </button>
        </div>
      </div>
      {hint ? <p className="mt-1 text-[12px] text-[#999]">{hint}</p> : null}
    </div>
  )
}

function TourStickyNav({
  activeSection,
  onJump,
  canBook,
  onBook,
}: {
  activeSection: string
  onJump: (id: string) => void
  canBook: boolean
  onBook: () => void
}) {
  const t = useTranslations('tourDetail')
  const items = [
    ['intro', t('navHighlights')],
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

      <SectionTitle>{t('included')}</SectionTitle>
      <div className="rounded border border-[#dfe7f2] p-5">
        <HtmlOrText html={tour.cost.includesHtml} text={tour.cost.includesText} />
      </div>

      <div className="mt-6">
        <SectionTitle>{t('notIncluded')}</SectionTitle>
        <div className="rounded border border-[#dfe7f2] p-5">
          <HtmlOrText html={tour.cost.excludesHtml} text={tour.cost.excludesText} />
        </div>
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
