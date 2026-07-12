'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CalendarDays, CheckCircle2, ChevronDown, Download, Info, MapPin, Printer, RefreshCw, ShieldCheck, Users } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import type { TourFallbackDetail, TourDay, TourMockDeparture, TourMockVariant } from '@/data/tour-detail-fallback'
import { ImageSlider } from '@/components/ui/ImageSlider'

type Props = {
  locale: string
  fallback: TourFallbackDetail
}

type ItineraryMode = 'graphic' | 'calendar'

function money(amount: number | string) {
  return Number(amount).toFixed(2)
}

function partyCount(variant: TourMockVariant) {
  const value = variant.selectedOptions.find((option) => option.name === 'Party Size')?.value ?? '1'
  return Number.parseInt(value, 10) || 1
}

function monthsFromDates(dates: TourMockDeparture[]) {
  const months = Array.from(new Set(dates.map((date) => date.date.slice(0, 7)))).slice(0, 4)
  return months.length > 0 ? months : ['2026-07', '2026-08', '2026-09', '2026-10']
}

function monthLabel(month: string) {
  const [year, mm] = month.split('-')
  return `${year}年${mm}月`
}

export function TourDetailPage({ locale, fallback }: Props) {
  const addItem = useCartStore((state) => state.addItem)
  const departureDates = fallback.departureDates
  const [activeImage, setActiveImage] = useState(0)
  const [galleryModalOpen, setGalleryModalOpen] = useState(false)
  const [selectedRoute] = useState(fallback.routes[0])
  const [selectedDate, setSelectedDate] = useState<string | null>(departureDates.find((date) => date.available)?.date ?? null)
  const [adultCount, setAdultCount] = useState(2)
  const [childCount, setChildCount] = useState(0)
  const [activeMonth, setActiveMonth] = useState(monthsFromDates(departureDates)[0])
  const [itineraryMode, setItineraryMode] = useState<ItineraryMode>('graphic')
  const [modalImage, setModalImage] = useState<TourDay['images'][number] | null>(null)
  const [activeSection, setActiveSection] = useState('intro')
  const [activeDay, setActiveDay] = useState(1)
  const [showDayNav, setShowDayNav] = useState(false)
  const [added, setAdded] = useState(false)

  const gallery = fallback.gallery
  const displayPrice = fallback.basePrice
  const dateMap = useMemo(() => new Map(departureDates.map((date) => [date.date, date])), [departureDates])
  const selectedDeparture = selectedDate ? dateMap.get(selectedDate) : undefined
  const totalTravelers = adultCount + childCount
  const selectedVariant = selectedDeparture?.variants.find((variant) => variant.availableForSale && partyCount(variant) === totalTravelers)
  const total = selectedVariant ? Number(selectedVariant.price.amount) * totalTravelers : 0
  const months = monthsFromDates(departureDates)
  const firstGallery = gallery[activeImage] ?? fallback.gallery[0]

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    const sectionIds = ['intro', 'itinerary', 'fees', 'notice', 'reviews']

    const updateActiveState = () => {
      const currentSection = sectionIds
        .map((id) => ({ id, top: document.getElementById(id)?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY }))
        .filter((section) => section.top <= 130)
        .sort((a, b) => b.top - a.top)[0]

      if (currentSection) setActiveSection(currentSection.id)

      const itinerary = document.getElementById('itinerary')
      if (itinerary) {
        const rect = itinerary.getBoundingClientRect()
        setShowDayNav(itineraryMode === 'graphic' && rect.top <= 120 && rect.bottom >= 260)
      }

      const currentDay = fallback.days
        .map((day) => ({ day: day.day, top: document.getElementById(`day-${day.day}`)?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY }))
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
  }, [fallback.days, itineraryMode])

  const handleAddToCart = () => {
    if (!selectedDate || !selectedVariant) return
    addItem({
      variantId: selectedVariant.id,
      productHandle: fallback.handles[0],
      productTitle: fallback.title,
      departureDate: selectedDate,
      partySize: totalTravelers,
      pricePerPerson: Number(selectedVariant.price.amount),
      currencyCode: selectedVariant.price.currencyCode,
      quantity: 1,
      pickupLocationId: null,
      addons: [],
      lineItemProperties: {
        Adults: String(adultCount),
        Children: String(childCount),
        Route: selectedRoute,
        'Related Line': selectedRoute,
      },
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div className="bg-[#f2f2f2] text-[#111]">
      <div className="mx-auto max-w-[1200px] px-3 pb-10">
        <div className="my-3 bg-white px-2 py-1 text-[13px] text-[#333]">
          <span className="font-bold text-[#ff5b00]">旅游出行报名重要提醒：</span>
          尊敬的途风贵宾，为了更全面地保障您的人身安全，平台强烈建议您出游时购买旅游意外保险、取消险及其它保险。
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2 text-[13px] text-[#666]">
          {fallback.breadcrumbs.map((item, index) => (
            <span key={`${item}-${index}`} className="flex items-center gap-2">
              <span className={index === 0 ? 'font-bold text-[#333]' : ''}>{item}</span>
              {index < fallback.breadcrumbs.length - 1 ? <span className="text-[#bbb]">&gt;</span> : null}
            </span>
          ))}
          <span className="ml-auto text-[#999]">购买人数 <b className="text-[#ff5b00]">{fallback.purchaseCount}</b></span>
          <span>♡ 收藏</span>
          <span>● 分享</span>
          <span className="text-[#ff5b00]">邀请有礼</span>
        </div>

        <section className="tour-detail-hero-grid bg-white p-5">
          <div className="relative">
            <ImageSlider
              images={gallery}
              autoplayMs={5000} 
              activeIndex={activeImage}
              onIndexChange={setActiveImage}
              onImageClick={() => setGalleryModalOpen(true)}
              paused={galleryModalOpen}
              overlay={
                fallback.saleTag ? (
                  <span className="absolute left-4 top-4 rounded-full bg-linear-to-r from-[#ff6500] to-[#ff3045] px-4 py-2 text-[17px] font-bold text-white">
                    % {fallback.saleTag}
                  </span>
                ) : null
              }
            />

            <TourCalendar departureDates={departureDates} dateMap={dateMap} months={months} activeMonth={activeMonth} setActiveMonth={setActiveMonth} selectedDate={selectedDate} setSelectedDate={setSelectedDate} fallbackPrice={displayPrice} />

          </div>

          <aside className="min-w-0">
            <h1 className="text-[20px] font-bold leading-[1.55] lg:text-[24px]">{fallback.title}</h1>
            <div className="mt-3 border border-[#f1d59d] bg-[#fffaf0] p-4 text-[#ff5b00]">
              <div className="flex items-end gap-4">
                <div className="hidden h-[60px] w-[60px] items-center justify-center rounded-full border-2 border-[#ff5b00] text-3xl font-bold xl:flex">特</div>
                <div>
                  <p className="text-sm text-[#999]">原价：<span className="line-through">${money(fallback.originalPrice)}</span></p>
                  <p className="text-[32px] font-bold leading-none xl:text-[44px]">${money(displayPrice)} <span className="text-sm">起</span></p>
                </div>
                <Link href="#" className="pb-2 text-sm text-[#777] underline">起价说明</Link>
              </div>
            </div>

            <InfoRow label="优惠活动" items={fallback.promos} orange />
            <InfoRow label="服务保障" items={fallback.serviceBadges} check />
            <InfoRow label="产品特色" items={fallback.features} blue />

            <div className="mt-4 grid grid-cols-2 gap-y-4 border-y border-[#e5e5e5] py-4 text-[14px]">
              <Meta label="出发地" value={fallback.departures} />
              <Meta label="结束地" value={fallback.endings} />
              <Meta label="服务语言" value={fallback.language} />
              <Meta label="产品编号" value={fallback.productCode} />
            </div>

            <div className="mt-5 flex gap-4 border-b border-[#e5e5e5] pb-5">
              <Image src={fallback.manager.avatar} alt={fallback.manager.name} width={80} height={80} className="h-20 w-20 rounded-full object-cover" />
              <div className="text-[14px] leading-7">
                <h3 className="mb-1 text-[18px]">产品经理推荐</h3>
                <p><b className="text-red-600">【一句话亮点】</b>{fallback.manager.text}</p>
                {fallback.manager.bullets.map((bullet) => <p key={bullet} className="text-[#777]">★ {bullet}</p>)}
                <button type="button" className="mt-1 text-[#1683e9]">查看更多 <ChevronDown className="inline h-4 w-4" /></button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-b border-[#e5e5e5] pb-4">
              <span className="font-bold">专属行程顾问1V1服务</span>
              <button type="button" className="rounded bg-[#3498f5] px-5 py-2 font-bold text-white">立即咨询</button>
            </div>
            <div className="mt-4 flex items-center gap-2 border-b border-[#e5e5e5] pb-4 text-sm font-bold">
              <ShieldCheck className="h-6 w-6" />
              平台保障 <span className="font-normal">价格保障·消费透明·行程保障·安全保障·7x24小时服务</span>
            </div>
          </aside>
        </section>

        <OldTourBookingForm
          availableDates={departureDates.filter((date) => date.available).map((date) => date.date)}
          tripDays={fallback.days.length}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          setAdultCount={setAdultCount}
          setChildCount={setChildCount}
          selectedVariant={selectedVariant}
          totalTravelers={totalTravelers}
          total={total}
          onAddToCart={handleAddToCart}
          added={added}
        />

        <OldTourStickyNav activeSection={activeSection} onJump={scrollTo} selectedVariant={selectedVariant} onBook={handleAddToCart} />

        <main className="bg-white px-5 pb-10">
          <section id="intro" className="scroll-mt-20 border-t border-[#eee] py-10">
            <div className="mx-auto max-w-[1040px] rounded bg-[#f6f9fc] p-10 text-[15px] leading-7">
              <p className="font-bold text-red-600">{fallback.intro.promo}</p>
              <p className="mt-4 whitespace-pre-line">{fallback.intro.notice}</p>
              <div className="relative mt-8 h-[120px] max-w-[760px] overflow-hidden">
                <Image src={fallback.intro.image} alt="产品介绍" fill sizes="760px" className="object-cover opacity-80" />
                <div className="absolute inset-0 flex items-center justify-center bg-white/30 text-3xl font-bold text-white">美国国家公园2026年外国游客政府收费新规</div>
              </div>
              <button type="button" className="mt-2 block text-[#1683e9]">查看更多⌄</button>
            </div>
          </section>

          <section id="itinerary" className="scroll-mt-20 py-8">
            <h2 className="mb-8 text-center text-[30px]">行程介绍</h2>
            <SectionTitle>产品概要</SectionTitle>
            <div className="grid gap-8 rounded bg-[#f6f9fc] p-6 md:grid-cols-3">
              {fallback.overview.map((item) => (
                <div key={item.title} className="text-[14px] leading-6">
                  <h3 className="mb-2 flex items-center gap-2 text-[17px] font-bold"><Users className="h-6 w-6 rounded-full bg-[#2196f3] p-1 text-white" />{item.title}</h3>
                  <p className="whitespace-pre-line">{item.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <SectionTitle>行程详情</SectionTitle>
              <div className="flex gap-4 text-[14px] text-[#1683e9]">
                <button type="button">查看地图</button>
                <button type="button"><Download className="inline h-4 w-4" /> 下载行程</button>
                <button type="button"><Printer className="inline h-4 w-4" /> 打印行程</button>
              </div>
            </div>

            <div className="mt-4 bg-[#fffbe8] px-4 py-5 text-[14px] font-bold">请注意，行程的先后顺序，可能会根据您的出发时间等有所调整，请以参团当天导游的安排为准。</div>
            <div className="mt-4 space-y-3 text-[14px] text-[#555]">
              <p>行程时间均为当地时间。</p>
              <p>酒店钻级基于酒店综合信息由Trip.com、Booking.com等平台评定，仅供参考。</p>
              <p>景点图片仅供参考。</p>
            </div>

            <div className="mt-4 flex border-b border-[#d9e7f7]">
              <button type="button" onClick={() => setItineraryMode('graphic')} className={`px-1 py-2 text-[16px] ${itineraryMode === 'graphic' ? 'border-b-2 border-[#1683e9] text-[#1683e9]' : ''}`}>图文模式</button>
              <button type="button" onClick={() => setItineraryMode('calendar')} className={`ml-10 px-1 py-2 text-[16px] ${itineraryMode === 'calendar' ? 'border-b-2 border-[#1683e9] text-[#1683e9]' : ''}`}>日历模式 <CalendarDays className="inline h-4 w-4" /></button>
              <button type="button" className="ml-auto text-[#1683e9]">展开全部⌄</button>
            </div>

            {itineraryMode === 'graphic' ? (
              <div className="relative mt-5">
                {showDayNav ? (
                  <div className="fixed left-[max(12px,calc((100vw-1200px)/2-96px))] top-[180px] z-40 hidden w-[80px] rounded bg-white p-2 shadow-lg min-[1250px]:block">
                    {fallback.days.map((day) => (
                      <button
                        key={day.day}
                        type="button"
                        onClick={() => scrollTo(`day-${day.day}`)}
                        className={`mb-2 block h-10 w-full rounded ${activeDay === day.day ? 'bg-[#3498f5] text-white' : 'bg-[#f5f5f5] hover:bg-[#3498f5] hover:text-white'}`}
                      >
                        D{day.day}
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="space-y-8">
                  {fallback.days.map((day) => <ItineraryDay key={day.day} day={day} onImageClick={setModalImage} />)}
                </div>
              </div>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {fallback.days.map((day) => (
                  <div key={day.day} className="rounded border border-[#d9e7f7] p-4">
                    <h3 className="mb-2 font-bold text-[#1683e9]">D{day.day}</h3>
                    <p className="text-[15px] leading-7">{day.title}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <TourFeesSection fallback={fallback} />
          <TourNoticeSection fallback={fallback} />
          <TourReviewsSection fallback={fallback} />
        </main>

        <BookingSteps />
      </div>

      {galleryModalOpen ? (
        <div className="fixed inset-0 z-95 flex items-center justify-center bg-black/90 p-6" onClick={() => setGalleryModalOpen(false)}>
          <button type="button" onClick={() => setGalleryModalOpen(false)} className="absolute right-6 top-4 text-4xl text-white">×</button>
          <button type="button" onClick={(event) => { event.stopPropagation(); setActiveImage((activeImage + gallery.length - 1) % gallery.length) }} className="absolute left-6 top-1/2 text-6xl text-white/80">‹</button>
          <div className="relative h-[82vh] w-[92vw]" onClick={(event) => event.stopPropagation()}>
            <Image src={firstGallery.src} alt={firstGallery.alt} fill sizes="92vw" className="object-contain" />
          </div>
          <button type="button" onClick={(event) => { event.stopPropagation(); setActiveImage((activeImage + 1) % gallery.length) }} className="absolute right-6 top-1/2 text-6xl text-white/80">›</button>
        </div>
      ) : null}

      {modalImage ? (
        <div className="fixed inset-0 z-90 flex items-center justify-center bg-black/55 p-8" onClick={() => setModalImage(null)}>
          <div className="max-h-[86vh] w-full max-w-[1200px] bg-white p-6" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setModalImage(null)} className="float-right text-2xl text-[#999]">×</button>
            <h3 className="text-xl font-bold">{modalImage.title} <span className="text-sm font-normal text-[#ff8a00]">★ 4.7</span></h3>
            <p className="mt-4 text-[14px] leading-7">{modalImage.description}</p>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
              <div className="relative h-[480px]">
                <Image src={modalImage.src} alt={modalImage.title} fill sizes="760px" className="object-cover" />
              </div>
              <div className="max-h-[480px] overflow-y-auto border p-4">
                <h4 className="mb-4 text-lg font-bold">用户点评</h4>
                {fallback.reviews.map((review) => (
                  <div key={`${review.name}-${review.date}`} className="mb-5 border-b pb-4 text-[14px] leading-6">
                    <p className="text-[#1683e9]">{review.name}</p>
                    <p>{review.body}</p>
                    <p className="mt-2 text-[#aaa]">{review.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function InfoRow({ label, items, orange, check, blue }: { label: string; items: string[]; orange?: boolean; check?: boolean; blue?: boolean }) {
  return (
    <div className="mt-4 flex gap-4 text-[14px]">
      <span className="shrink-0">{label}</span>
      <div className="flex flex-wrap gap-3">
        {items.map((item) => (
          <span key={item} className={`${orange ? 'rounded bg-[#ff5b0b] px-3 py-1 text-white' : ''}${blue ? 'rounded border border-[#6fb2ff] px-3 py-1 text-[#1683e9]' : ''}`}>
            {check ? <CheckCircle2 className="mr-1 inline h-5 w-5 text-[#2cc66d]" /> : null}
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <MapPin className="h-5 w-5 shrink-0 text-[#1683e9]" />
      <span className="text-[#777]">{label}</span>
      <b className="line-clamp-1">{value}</b>
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
  fallbackPrice,
}: {
  departureDates: TourMockDeparture[]
  dateMap: Map<string, TourMockDeparture>
  months: string[]
  activeMonth: string
  setActiveMonth: (month: string) => void
  selectedDate: string | null
  setSelectedDate: (date: string) => void
  fallbackPrice: number
}) {
  const [year, monthRaw] = activeMonth.split('-').map(Number)
  const month = monthRaw - 1
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: Array<number | null> = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)]
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

  return (
    <div>
      <div className="mt-4 border border-[#d9d9d9]">
        <div className="bg-[#fffef2] p-3 text-[12px] leading-5 text-[#ff5b00]">
          <p>以下价格为1成人起价</p>
          <p>儿童报价的年龄指周岁，如生日为1月1日，时间到次年1月1日时视为一岁，以出行日期为准</p>
        </div>
        <div className="flex overflow-x-auto border-b">
          {months.map((monthValue) => {
            const lowest = departureDates.find((date) => date.date.startsWith(monthValue))?.lowestPrice.amount ?? fallbackPrice
            return (
              <button key={monthValue} type="button" onClick={() => setActiveMonth(monthValue)} className={`min-w-[92px] px-3 py-2 text-center ${activeMonth === monthValue ? 'border-b-2 border-[#1683e9]' : ''}`}>
                <b className={activeMonth === monthValue ? 'text-[#1683e9]' : ''}>{monthLabel(monthValue)}</b>
                <p className="text-[12px] text-[#ff5b00]">${money(lowest)} 起</p>
              </button>
            )
          })}
        </div>
        <div className="grid grid-cols-7 border-l border-t text-[12px]">
          {weekdays.map((day) => <div key={day} className="border-b border-r py-2 text-center text-[#777]">{day}</div>)}
          {cells.map((day, index) => {
            if (day === null) return <div key={`pad-${index}`} className="h-[72px] border-b border-r bg-[#fafafa]" />
            const date = `${activeMonth}-${String(day).padStart(2, '0')}`
            const departure = dateMap.get(date)
            const available = departure?.available
            return (
              <button key={date} type="button" disabled={!available} onClick={() => setSelectedDate(date)} className={`relative flex h-[72px] flex-col border-b border-r p-1 text-left ${selectedDate === date ? 'bg-[#fff1e8]' : available ? 'bg-white' : 'bg-[#fafafa] text-[#aaa]'}`}>
                <span className="absolute left-1 top-1 leading-none">{String(day).padStart(2, '0')}</span>
                {available ? (
                  <span className="m-auto text-center text-base leading-[17px] text-[#ff5b00]">
                    ${money(departure.lowestPrice.amount)}
                    <br />
                    <small className="text-[12px]">{departure.status === 'limited' ? '余位紧张' : '可订'}</small>
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

const WEEKDAY_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function formatTravelRange(startDate: string, tripDays: number) {
  const start = new Date(`${startDate}T12:00:00`)
  const end = new Date(start)
  end.setDate(end.getDate() + Math.max(tripDays, 1) - 1)
  const pad = (value: number) => String(value).padStart(2, '0')
  const startLabel = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())} ${WEEKDAY_CN[start.getDay()]}`
  const endLabel = `${pad(end.getMonth() + 1)}-${pad(end.getDate())} ${WEEKDAY_CN[end.getDay()]}`
  return `${startLabel} 至 ${endLabel}`
}

type BookingRoom = { adults: number; children: number }

const MAX_PER_ROOM = 4

function OldTourBookingForm(props: {
  availableDates: string[]
  tripDays: number
  selectedDate: string | null
  setSelectedDate: (date: string) => void
  setAdultCount: (count: number) => void
  setChildCount: (count: number) => void
  selectedVariant: TourMockVariant | undefined
  totalTravelers: number
  total: number
  onAddToCart: () => void
  added: boolean
}) {
  const [rooms, setRooms] = useState<BookingRoom[]>([{ adults: 2, children: 0 }])
  const [serviceType, setServiceType] = useState('')

  useEffect(() => {
    props.setAdultCount(rooms.reduce((sum, room) => sum + room.adults, 0))
    props.setChildCount(rooms.reduce((sum, room) => sum + room.children, 0))
  }, [rooms, props.setAdultCount, props.setChildCount])

  const updateRoom = (index: number, patch: Partial<BookingRoom>) => {
    setRooms((current) =>
      current.map((room, roomIndex) => {
        if (roomIndex !== index) return room
        const next = { ...room, ...patch }
        const maxChildren = Math.max(0, MAX_PER_ROOM - next.adults)
        next.children = Math.min(next.children, maxChildren)
        next.adults = Math.min(Math.max(next.adults, 1), MAX_PER_ROOM - next.children)
        return next
      }),
    )
  }

  const removeRoom = (index: number) => {
    setRooms((current) => {
      if (current.length <= 1) return current
      const next = current.filter((_, roomIndex) => roomIndex !== index)
      const nextAdults = next.reduce((sum, room) => sum + room.adults, 0)
      if (nextAdults >= 2) return next
      return next.map((room, roomIndex) => (roomIndex === 0 ? { ...room, adults: Math.max(room.adults, 2) } : room))
    })
  }

  const addRoom = () => {
    setRooms((current) => [...current, { adults: 1, children: 0 }])
  }

  return (
    <section className="mt-6 border-2 border-[#f5a400] bg-[#fffef2] p-4 md:p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4">
          <label className="block max-w-[520px]">
            <span className="mb-2 block text-[15px] font-bold text-[#333]">出行时间</span>
            <div className="relative">
              <select
                value={props.selectedDate ?? ''}
                onChange={(event) => props.setSelectedDate(event.target.value)}
                className="h-10 w-full appearance-none rounded border border-[#d7dce2] bg-white py-2 pl-3 pr-10 text-[14px] text-[#333]"
              >
                {props.availableDates.map((date) => (
                  <option key={date} value={date}>
                    {formatTravelRange(date, props.tripDays)}
                  </option>
                ))}
              </select>
              <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888]" aria-hidden />
            </div>
          </label>

          <div>
            <p className="mb-3 text-[15px] font-bold text-[#333]">
              <span className="text-[#f5a400]">*</span> 酒店房间
              <span className="ml-1 font-normal text-[#999]">| 最少 <span className="text-[#f5a400]">2</span> 人起订</span>
            </p>
            <div className="space-y-2.5">
              {rooms.map((room, index) => {
                const maxAdults = MAX_PER_ROOM - room.children
                const maxChildren = MAX_PER_ROOM - room.adults
                return (
                  <div key={`room-${index}`} className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[14px]">
                    <span className="text-[#333]">房间{index + 1}：成人</span>
                    <select
                      value={room.adults}
                      onChange={(event) => updateRoom(index, { adults: Number(event.target.value) })}
                      className="h-8 w-14 rounded border border-[#d7dce2] bg-white px-1.5 text-center"
                    >
                      {Array.from({ length: maxAdults }, (_, i) => i + 1).map((count) => (
                        <option key={count} value={count}>{count}</option>
                      ))}
                    </select>
                    <span className="text-[#333]">儿童</span>
                    <select
                      value={room.children}
                      onChange={(event) => updateRoom(index, { children: Number(event.target.value) })}
                      className="h-8 w-14 rounded border border-[#d7dce2] bg-white px-1.5 text-center"
                    >
                      {Array.from({ length: maxChildren + 1 }, (_, i) => i).map((count) => (
                        <option key={count} value={count}>{count}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeRoom(index)}
                      disabled={rooms.length <= 1}
                      className="text-[#1683e9] disabled:cursor-not-allowed disabled:text-[#bbb]"
                    >
                      移除
                    </button>
                    {index === rooms.length - 1 ? (
                      <button type="button" onClick={addRoom} className="text-[#1683e9]">
                        添加一间房间
                      </button>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>

          <label className="block max-w-[520px]">
            <span className="mb-2 block text-[15px] font-bold text-[#333]">
              <span className="text-[#f5a400]">*</span> 增值服务
              <span className="ml-1 font-normal text-[#999]">| 请选择包团出行人数</span>
            </span>
            <select
              value={serviceType}
              onChange={(event) => setServiceType(event.target.value)}
              className="h-10 w-full rounded border border-[#91c9f0] bg-white px-3 text-[14px] text-[#666]"
            >
              <option value="">请选择服务类型</option>
              <option value="none">不需要增值服务</option>
              <option value="private-2-5">包团出行（2-5人）</option>
              <option value="private-6-9">包团出行（6-9人）</option>
              <option value="private-10">包团出行（10人及以上）</option>
            </select>
          </label>
        </div>

        <div className="flex flex-col border-[#d9d9d9] lg:border-l lg:border-dashed lg:pl-5">
          <button
            type="button"
            disabled={!props.selectedVariant}
            onClick={props.onAddToCart}
            className="ml-auto h-11 w-full max-w-[180px] rounded bg-[#f5a400] text-[16px] font-bold text-white disabled:cursor-not-allowed disabled:bg-[#f5d386] lg:w-[160px]"
          >
            {props.added ? '已加入购物车' : '立即预订'}
          </button>

          <div className="flex flex-1 flex-col items-center justify-center py-6 text-center lg:py-2">
            <div className="flex items-center gap-2">
              <span className="text-[32px] font-bold leading-none text-[#f5a400] md:text-[36px]">
                {props.selectedVariant ? `$${money(props.total)}` : `--`}
              </span>
              <button type="button" aria-label="刷新价格" className="text-[#f5a400]">
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
            {!props.selectedVariant ? (
              <p className="mt-2 text-[12px] text-[#999]">暂无{props.totalTravelers}人价格</p>
            ) : null}
            <p className="mt-3 flex items-start gap-1.5 text-left text-[12px] leading-5 text-[#666]">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#f5a400]" aria-hidden />
              请以我们与您确认的最终价格为准
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function OldTourStickyNav({ activeSection, onJump, selectedVariant, onBook }: { activeSection: string; onJump: (id: string) => void; selectedVariant?: TourMockVariant; onBook: () => void }) {
  const items = [['intro', '产品介绍'], ['itinerary', '行程介绍'], ['fees', '费用说明'], ['notice', '预订须知'], ['reviews', '产品评论']]
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
          <button type="button" onClick={onBook} disabled={!selectedVariant} className="ml-auto my-3 hidden h-10 rounded bg-[#f5a400] px-12 font-bold text-white disabled:bg-[#f5d386] md:block">立即预订</button>
        ) : null}
      </nav>
    </>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="mb-4 border-l-4 border-[#1683e9] pl-3 text-[20px]">{children}</h3>
}

function ItineraryDay({ day, onImageClick }: { day: TourDay; onImageClick: (image: TourDay['images'][number]) => void }) {
  return (
    <article id={`day-${day.day}`} className="scroll-mt-24">
      <h3 className="flex bg-[#e5f5ff] text-[22px]">
        <span className="mr-6 flex w-[96px] items-center justify-center bg-[#73c6f7] py-4 font-bold text-white">D{day.day}</span>
        <span className="py-4 leading-8">{day.title}</span>
      </h3>
      <div className="mt-5 border-l-2 border-[#1683e9] pl-5 text-[15px] leading-8">
        <p><b>餐食</b>　{day.meals}</p>
        <p><b>酒店</b>　{day.hotel}</p>
        <p><b>概述</b>　{day.summary}</p>
        <button type="button" className="mx-auto my-4 block text-[#1683e9]">查看详细行程⌄</button>
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
          {day.images.map((image) => (
            <button key={image.title} type="button" onClick={() => onImageClick(image)} className="group relative h-[130px] overflow-hidden text-left">
              <Image src={image.src} alt={image.title} fill sizes="220px" className="object-cover transition group-hover:scale-105" />
              <span className="absolute bottom-0 left-0 right-0 bg-black/55 px-3 py-2 text-white">{image.title}</span>
            </button>
          ))}
        </div>
      </div>
    </article>
  )
}

function DataTable({ rows, columns }: { rows: string[][]; columns: string[] }) {
  return (
    <table className="w-full border-collapse text-[14px]">
      <thead>
        <tr>{columns.map((column) => <th key={column} className="border border-[#dfe7f2] bg-[#fafcff] p-4 text-left text-[#666]">{column}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <td key={cellIndex} className="border border-[#dfe7f2] p-4 leading-7">{cell}</td>)}</tr>
        ))}
      </tbody>
    </table>
  )
}

function TourFeesSection({ fallback }: { fallback: TourFallbackDetail }) {
  return (
    <section id="fees" className="scroll-mt-20 py-10">
      <h2 className="mb-8 text-center text-[30px]">费用说明</h2>
      <div className="mb-6 rounded bg-[#f6f6f6] p-6">
        <h3 className="mb-6 flex items-center gap-2 text-[20px] font-bold">$ 团费价格</h3>
        <div className="grid gap-6 text-center md:grid-cols-4">
          {['双人一间', '三人一间', '四人一间', '单人一间'].map((label, index) => <div key={label}><p>{label}</p><p className="text-[#ff5b00]">${money([861.08, 812.87, 743.83, 1191.77][index])} /人起</p><p className="text-[#bbb] line-through">${money([1086.08, 996.20, 894.33, 1591.77][index])}/人起</p></div>)}
        </div>
      </div>
      <SectionTitle>费用包含</SectionTitle>
      <DataTable columns={['类型', '成人【12周岁及以上】', '儿童【2-12周岁(不含)】']} rows={fallback.feesIncluded} />
      <div className="mt-6"><SectionTitle>自理费用</SectionTitle><DataTable columns={['类型', '说明']} rows={fallback.feesExcluded} /></div>
      <div className="mt-6"><SectionTitle>自费项目</SectionTitle><DataTable columns={['项目', '价格', '备注']} rows={fallback.freeItems} /></div>
    </section>
  )
}

function TourNoticeSection({ fallback }: { fallback: TourFallbackDetail }) {
  return (
    <section id="notice" className="scroll-mt-20 py-10">
      <h2 className="mb-8 text-center text-[30px]">预订须知</h2>
      <SectionTitle>预订限制</SectionTitle>
      <DataTable columns={['类型', '说明']} rows={fallback.bookingLimits} />
      <div className="mt-6"><SectionTitle>订前须知</SectionTitle><DataTable columns={['类型', '说明']} rows={fallback.bookingNotes} /></div>
      <div className="mt-6 border-t pt-6">
        <SectionTitle>订购条例</SectionTitle>
        <ol className="space-y-4 text-[15px] leading-7">{fallback.terms.map((term, index) => <li key={term}>{index + 1}. {term}</li>)}</ol>
      </div>
      <div className="mt-8">
        <SectionTitle>违约条款</SectionTitle>
        <p className="mb-4 font-bold text-[#ff5b00]">旅游者违约：在行程前解除合同时，必要的费用扣除标准为：</p>
        <DataTable columns={['行程前', '违约金']} rows={fallback.penalty} />
      </div>
      <div className="mt-8 border-t pt-6">
        <SectionTitle>补充条款</SectionTitle>
        <p className="font-bold text-red-600">【黄石小木屋特殊政策】出发前30天内，黄石小木屋预定一经确认，不可以更改姓名、增减人数或房间数。</p>
      </div>
    </section>
  )
}

function TourReviewsSection({ fallback }: { fallback: TourFallbackDetail }) {
  return (
    <section id="reviews" className="scroll-mt-20 border-t py-10">
      <h2 className="mb-8 text-center text-[30px]">产品评论</h2>
      <div className="mb-8 grid gap-8 md:grid-cols-[220px_1fr]">
        <div className="border-r border-dashed text-center">
          <span className="text-[48px] font-bold text-[#1683e9]">4.9</span><span className="text-[28px] text-[#aaa]">/5.0</span>
          <p>总体分数</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {['客服态度', '酒店舒适度', '导游满意度', '行程安排合理'].map((label, index) => <div key={label}><p className="flex justify-between"><span>{label}</span><b className="text-[#1683e9]">{index === 1 ? '4.8' : '4.9'}</b></p><div className="h-2 rounded-full bg-[#e8f2ff]"><div className="h-2 w-[96%] rounded-full bg-[#3498f5]" /></div></div>)}
        </div>
      </div>
      <div className="mb-5 flex gap-8 bg-[#f3f3f3] p-4 text-[14px]"><span className="text-[#1683e9]">● 所有</span><span>○ 最新</span><span>○ 带图</span></div>
      {fallback.reviews.map((review) => (
        <article key={`${review.name}-${review.date}`} className="border-b py-6">
          <div className="flex items-start gap-4">
            <Image src="/tff/avatar.png" alt="" width={54} height={54} className="h-[54px] w-[54px] rounded-full" />
            <div className="flex-1">
              <p><span className="text-[#1683e9]">{review.name}</span>　<span className="text-[#1683e9]">5分/5分</span><span className="float-right">{review.date}</span></p>
              <div className="mt-4 flex flex-wrap gap-2">{review.tags.map((tag) => <span key={tag} className="rounded border border-[#b8dcff] bg-[#f0f8ff] px-3 py-1 text-[#1683e9]">{tag}</span>)}</div>
              <p className="mt-5 rounded bg-[#f6f6f6] p-4 leading-7">{review.body}</p>
              <p className="mt-3 text-right text-[#1683e9]">👍 有用(0)</p>
            </div>
          </div>
        </article>
      ))}
      <div className="mt-6 flex justify-end gap-4 text-[14px]"><span>共 322 条</span><button className="rounded bg-[#3498f5] px-3 py-1 text-white">1</button><button>2</button><button>3</button><button>4</button><button>5</button><span>...</span><button>33</button></div>
    </section>
  )
}

function BookingSteps() {
  const steps = [
    {
      title: '选择产品',
      icon: '/tff/booking-steps/step-1.png',
      description: '选择心仪产品，在详情页选择出行时间、出行人数等预订信息后点击 “立即预订” 。',
    },
    {
      title: '填写订单',
      icon: '/tff/booking-steps/step-2.png',
      description: '核对行程信息，正确填写联系人、旅客等信息，确认预订条款后 “去支付” 。',
    },
    {
      title: '支付',
      icon: '/tff/booking-steps/step-3.png',
      description: '选择适合您的付款方式，点击“下一步”按钮， “提交支付” 。',
    },
    {
      title: '收到电子票',
      icon: '/tff/booking-steps/step-4.png',
      description: '途风确认产品资源安排妥当行程后会向您发送【电子票】。',
    },
    {
      title: '快乐出游',
      icon: '/tff/booking-steps/step-5.png',
      description: '出发前打印您的电子票，并于出团当日携带好电子票以及其他有效证件参团。',
    },
    {
      title: '点评分享',
      icon: '/tff/booking-steps/step-6.png',
      description: '游玩归来发表行程点评分享您的美好旅程！还可获得积分/返现。',
    },
  ]
  return (
    <section className="mt-6 bg-white px-5 py-8">
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6">
        {steps.map((step) => (
          <div key={step.title} className="text-center">
            <div className="relative mx-auto h-[96px] w-[96px]">
              <Image src={step.icon} alt={step.title} width={96} height={96} className="h-[96px] w-[96px] object-contain" />
            </div>
            <h3 className="mt-4 text-[20px]">{step.title}</h3>
            <p className="mt-3 text-left text-[14px] leading-6">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
