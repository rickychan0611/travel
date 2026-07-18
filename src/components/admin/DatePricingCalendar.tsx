'use client'

import { CalendarDays, Check, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react'
import { useActionState, useCallback, useMemo, useState } from 'react'
import { AdminActionForm, type AdminFormState } from '@/components/admin/AdminActionForm'
import { ratesForPricingMode, type DatePriceRateLabel, type PricingMode } from '@/lib/toursbms/date-price-rates'

type TravelerType = 'adult' | 'child' | 'senior'

export type PriceTemplateVariant = {
  rateType: DatePriceRateLabel
  travelerType: TravelerType
}

export type CalendarRate = PriceTemplateVariant & {
  variantId?: string
  price: string
  sku: string
}

export type CalendarDeparture = {
  date: string
  status: string
  remainingStock: number
  rates: CalendarRate[]
}

type CalendarProps = {
  locale: string
  handle: string
  productId: string
  currency: string
  pricingMode: PricingMode
  initialTemplate: PriceTemplateVariant[]
  departures: CalendarDeparture[]
  saveTemplateAction: (previousState: AdminFormState, formData: FormData) => Promise<AdminFormState>
  saveDateAction: (previousState: AdminFormState, formData: FormData) => Promise<AdminFormState>
  saveBulkAction: (previousState: AdminFormState, formData: FormData) => Promise<AdminFormState>
}

const ROOM_LABELS = ['Single room', 'Double room', 'Triple room', 'Quad room'] as const
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function templateKey(rateType: string, travelerType: string) {
  return `${rateType}:${travelerType}`
}

function orderTemplate(template: PriceTemplateVariant[], pricingMode: PricingMode) {
  const rateOrder = pricingMode === 'room_occupancy'
    ? [...ROOM_LABELS]
    : ['Adult', 'Child', 'Senior']
  const travelerOrder: TravelerType[] = ['adult', 'child', 'senior']
  return template.slice().sort((a, b) => {
    const rateDifference = rateOrder.indexOf(a.rateType) - rateOrder.indexOf(b.rateType)
    return rateDifference || travelerOrder.indexOf(a.travelerType) - travelerOrder.indexOf(b.travelerType)
  })
}

function parseDateParts(date: string) {
  const [year, month] = date.split('-').map(Number)
  return Number.isFinite(year) && Number.isFinite(month) ? { year, month: month - 1 } : null
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function initialMonth(departures: CalendarDeparture[]) {
  const first = departures.map((departure) => departure.date).sort()[0]
  const parsed = first ? parseDateParts(first) : null
  const today = new Date()
  return parsed ?? { year: today.getFullYear(), month: today.getMonth() }
}

function formatMoney(value: string, currency: string) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return value
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(0)}`
  }
}

function VariantSetup({ pricingMode, setPricingMode, template, setTemplate, action, locale, handle, productId }: {
  pricingMode: PricingMode
  setPricingMode: (mode: PricingMode) => void
  template: PriceTemplateVariant[]
  setTemplate: (template: PriceTemplateVariant[]) => void
  action: CalendarProps['saveTemplateAction']
  locale: string
  handle: string
  productId: string
}) {
  const roomRows = ROOM_LABELS.filter((label) => template.some((item) => item.rateType === label))
  const allowedTravelerRates = ratesForPricingMode('per_person')

  function addRoom() {
    const room = ROOM_LABELS.find((label) => !roomRows.includes(label))
    if (room) setTemplate([...template, { rateType: room, travelerType: 'adult' }])
  }

  function changeRoom(previous: DatePriceRateLabel, next: DatePriceRateLabel) {
    setTemplate(template.map((item) => item.rateType === previous ? { ...item, rateType: next } : item))
  }

  function removeRoom(room: DatePriceRateLabel) {
    if (roomRows.length > 1) setTemplate(template.filter((item) => item.rateType !== room))
  }

  function toggleRoomChild(room: DatePriceRateLabel) {
    const childKey = templateKey(room, 'child')
    setTemplate(template.some((item) => templateKey(item.rateType, item.travelerType) === childKey)
      ? template.filter((item) => templateKey(item.rateType, item.travelerType) !== childKey)
      : [...template, { rateType: room, travelerType: 'child' }])
  }

  function toggleTraveler(rateType: DatePriceRateLabel, travelerType: TravelerType) {
    if (travelerType === 'adult') return
    const key = templateKey(rateType, travelerType)
    setTemplate(template.some((item) => templateKey(item.rateType, item.travelerType) === key)
      ? template.filter((item) => templateKey(item.rateType, item.travelerType) !== key)
      : [...template, { rateType, travelerType }])
  }

  return (
    <AdminActionForm
      action={action}
      submitLabel="Save variant setup"
      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
      footerClassName="mt-4 flex flex-wrap items-center justify-end gap-3"
    >
      <div className="mb-3">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Step 1</div>
        <h3 className="mt-1 font-semibold text-slate-950">Set price variants</h3>
        <p className="mt-1 text-sm text-slate-600">Configure the price inputs staff should complete for every departure day.</p>
      </div>

      <label className="mb-4 block max-w-sm text-sm font-medium text-slate-700">
        Pricing mode
        <select
          value={pricingMode}
          onChange={(event) => setPricingMode(event.target.value as PricingMode)}
          className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
        >
          <option value="per_person">Per person — no room required</option>
          <option value="room_occupancy">Room occupancy — add room types</option>
        </select>
      </label>

      {pricingMode === 'room_occupancy' ? (
        <div className="space-y-2">
          {roomRows.map((room) => {
            const childEnabled = template.some((item) => item.rateType === room && item.travelerType === 'child')
            return <div key={room} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-[minmax(180px,1fr)_auto_40px] sm:items-center">
              <label className="block text-sm font-medium text-slate-700">
                Room type
                <select value={room} onChange={(event) => changeRoom(room, event.target.value as DatePriceRateLabel)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
                  {ROOM_LABELS.map((label) => <option key={label} value={label} disabled={label !== room && roomRows.includes(label)}>{label}</option>)}
                </select>
              </label>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full bg-slate-900 px-3 py-1.5 font-medium text-white">Adult</span>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5">
                  <input type="checkbox" checked={childEnabled} onChange={() => toggleRoomChild(room)} /> Child
                </label>
              </div>
              <button type="button" aria-label={`Remove ${room}`} disabled={roomRows.length === 1} onClick={() => removeRoom(room)} className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 disabled:opacity-30"><Minus className="size-4" /></button>
            </div>
          })}
          <button type="button" onClick={addRoom} disabled={roomRows.length === ROOM_LABELS.length} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"><Plus className="size-4" /> Add room type</button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {allowedTravelerRates.map((rate) => {
            const travelerType = rate.priceType === 1 ? 'adult' : rate.priceType === 2 ? 'child' : 'senior'
            const checked = template.some((item) => item.rateType === rate.label && item.travelerType === travelerType)
            return <label key={rate.label} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${checked ? 'border-slate-900 bg-white font-semibold' : 'border-slate-300 text-slate-600'}`}>
              <input type="checkbox" checked={checked} disabled={travelerType === 'adult'} onChange={() => toggleTraveler(rate.label, travelerType)} /> {rate.label}
            </label>
          })}
        </div>
      )}

      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="handle" value={handle} />
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="pricingMode" value={pricingMode} />
      <input type="hidden" name="template" value={JSON.stringify(template)} />
    </AdminActionForm>
  )
}

function PriceEditor({ pricingMode, template, departure, dates, action, locale, handle, productId, bulk, overwriteCount, onSaved }: {
  pricingMode: PricingMode
  template: PriceTemplateVariant[]
  departure?: CalendarDeparture
  dates: string[]
  action: CalendarProps['saveDateAction']
  locale: string
  handle: string
  productId: string
  bulk: boolean
  overwriteCount: number
  onSaved: (departures: CalendarDeparture[]) => void
}) {
  const initialValues = Object.fromEntries((departure?.rates ?? []).map((rate) => [templateKey(rate.rateType, rate.travelerType), rate.price]))
  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const [dirty, setDirty] = useState(false)
  const findExisting = (rateType: string, travelerType: string) => departure?.rates.find((rate) => rate.rateType === rateType && rate.travelerType === travelerType)
  const submittedRates = pricingMode === 'room_occupancy'
    ? [...new Set(template.map((item) => item.rateType))].map((roomType) => {
        const adult = findExisting(roomType, 'adult')
        const child = findExisting(roomType, 'child')
        return {
          roomType,
          adult: { variantId: adult?.variantId, price: values[templateKey(roomType, 'adult')] ?? '', sku: adult?.sku ?? '' },
          child: template.some((item) => item.rateType === roomType && item.travelerType === 'child')
            ? { variantId: child?.variantId, price: values[templateKey(roomType, 'child')] ?? '', sku: child?.sku ?? '' }
            : { price: '', sku: '' },
        }
      })
    : template.map((item) => {
        const existing = findExisting(item.rateType, item.travelerType)
        return { variantId: existing?.variantId, rateType: item.rateType, price: values[templateKey(item.rateType, item.travelerType)] ?? '', sku: existing?.sku ?? '' }
      })

  async function submit(previousState: AdminFormState, formData: FormData) {
    const result = await action(previousState, formData)
    if (result.saved) {
      const savedDepartures = (result.data as { departures?: CalendarDeparture[] } | undefined)?.departures
      if (savedDepartures) onSaved(savedDepartures)
      setDirty(false)
    }
    return result
  }

  const [state, formAction, pending] = useActionState(submit, { error: null, saved: false })

  return (
    <form action={formAction} onChange={() => setDirty(true)} className="rounded-xl border-2 border-slate-900 bg-white p-4 shadow-sm">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="handle" value={handle} />
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="pricingMode" value={pricingMode} />
      {bulk ? <input type="hidden" name="dates" value={JSON.stringify(dates)} /> : <input type="hidden" name="date" value={dates[0]} />}
      <input type="hidden" name="rates" value={JSON.stringify(submittedRates)} />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{bulk ? 'Bulk pricing' : 'Selected day'}</div>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">{bulk ? `${dates.length} dates selected` : dates[0]}</h3>
        </div>
        {bulk && overwriteCount > 0 ? <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">This will overwrite {overwriteCount} priced date{overwriteCount === 1 ? '' : 's'}.</div> : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {template.map((item) => {
          const key = templateKey(item.rateType, item.travelerType)
          return <label key={key} className="block rounded-lg bg-slate-50 p-3">
            <span className="text-sm font-semibold text-slate-800">{item.rateType} · {item.travelerType[0].toUpperCase() + item.travelerType.slice(1)}</span>
            <input required inputMode="decimal" placeholder="0.00" value={values[key] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-950" />
          </label>
        })}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block"><span className="text-sm text-slate-700">Status</span><select name="status" defaultValue={departure?.status || 'open'} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="open">Open</option><option value="closed">Closed</option></select></label>
        <label className="block"><span className="text-sm text-slate-700">Traveler capacity (0 = unspecified)</span><input name="remainingStock" type="number" min="0" defaultValue={bulk ? 0 : departure?.remainingStock ?? 0} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" /></label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
        <button disabled={pending} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">
          {pending ? 'Saving…' : bulk ? `Apply prices to ${dates.length} dates` : 'Save day prices'}
        </button>
        {state.saved && !dirty ? <span role="status" className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700"><Check className="size-4" />{state.message || 'Saved'}</span> : null}
        {state.error ? <span role="alert" className="max-w-2xl text-sm text-red-700">{state.error}</span> : null}
      </div>
    </form>
  )
}

export function DatePricingCalendar(props: CalendarProps) {
  const defaultTemplate = (mode: PricingMode): PriceTemplateVariant[] => mode === 'room_occupancy'
    ? [{ rateType: 'Double room', travelerType: 'adult' }, { rateType: 'Double room', travelerType: 'child' }]
    : [{ rateType: 'Adult', travelerType: 'adult' }, { rateType: 'Child', travelerType: 'child' }]
  const [pricingMode, setPricingModeState] = useState<PricingMode>(props.pricingMode)
  const fallbackTemplate = defaultTemplate(pricingMode)
  const [template, setTemplate] = useState<PriceTemplateVariant[]>(props.initialTemplate.length ? props.initialTemplate : fallbackTemplate)
  const orderedTemplate = useMemo(() => orderTemplate(template, pricingMode), [pricingMode, template])
  const firstMonth = initialMonth(props.departures)
  const [visibleMonth, setVisibleMonth] = useState(firstMonth)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [departures, setDepartures] = useState(props.departures)
  const departureMap = useMemo(() => new Map(departures.map((departure) => [departure.date, departure])), [departures])
  const daysInMonth = new Date(visibleMonth.year, visibleMonth.month + 1, 0).getDate()
  const leadingDays = new Date(visibleMonth.year, visibleMonth.month, 1).getDay()
  const cells = [...Array(leadingDays).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)]
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(new Date(visibleMonth.year, visibleMonth.month, 1))

  function moveMonth(offset: number) {
    const next = new Date(visibleMonth.year, visibleMonth.month + offset, 1)
    setVisibleMonth({ year: next.getFullYear(), month: next.getMonth() })
  }

  function chooseDate(date: string) {
    if (!bulkMode) {
      setSelectedDate(date)
      return
    }
    setSelectedDates((current) => current.includes(date) ? current.filter((item) => item !== date) : [...current, date].sort())
  }

  function toggleBulkMode() {
    setBulkMode((current) => !current)
    setSelectedDates([])
    setSelectedDate(null)
  }

  function changePricingMode(mode: PricingMode) {
    if (mode === pricingMode) return
    setPricingModeState(mode)
    setTemplate(defaultTemplate(mode))
    setSelectedDate(null)
    setSelectedDates([])
  }

  const applySavedDepartures = useCallback((savedDepartures: CalendarDeparture[]) => {
    setDepartures((current) => {
      const next = new Map(current.map((departure) => [departure.date, departure]))
      for (const departure of savedDepartures) next.set(departure.date, departure)
      return [...next.values()].sort((a, b) => a.date.localeCompare(b.date))
    })
  }, [])

  const selectedDeparture = selectedDate ? departureMap.get(selectedDate) : undefined
  const overwriteCount = selectedDates.filter((date) => departureMap.has(date)).length

  return (
    <div className="space-y-5">
      <VariantSetup pricingMode={pricingMode} setPricingMode={changePricingMode} template={orderedTemplate} setTemplate={setTemplate} action={props.saveTemplateAction} locale={props.locale} handle={props.handle} productId={props.productId} />

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Step 2</div>
            <h3 className="mt-1 font-semibold text-slate-950">Set departure prices</h3>
          </div>
          <button type="button" onClick={toggleBulkMode} className={`rounded-lg px-4 py-2 text-sm font-semibold ${bulkMode ? 'bg-amber-100 text-amber-900' : 'bg-slate-950 text-white'}`}>{bulkMode ? 'Exit bulk edit' : 'Bulk edit'}</button>
        </div>

        {bulkMode ? <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">Select calendar days, then enter one set of prices below. {selectedDates.length} selected.</div> : null}

        <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-2 py-2">
          <button type="button" aria-label="Previous month" onClick={() => moveMonth(-1)} className="inline-flex size-10 items-center justify-center rounded-lg hover:bg-white"><ChevronLeft className="size-5" /></button>
          <div className="flex items-center gap-2 font-semibold text-slate-950"><CalendarDays className="size-4" /> {monthLabel}</div>
          <button type="button" aria-label="Next month" onClick={() => moveMonth(1)} className="inline-flex size-10 items-center justify-center rounded-lg hover:bg-white"><ChevronRight className="size-5" /></button>
        </div>

        <div className="mt-3 grid grid-cols-7 border-l border-t border-slate-200">
          {WEEKDAYS.map((day) => <div key={day} className="border-b border-r border-slate-200 bg-slate-50 px-1 py-2 text-center text-xs font-semibold text-slate-500">{day}</div>)}
          {cells.map((day, index) => {
            if (!day) return <div key={`empty-${index}`} className="min-h-24 border-b border-r border-slate-200 bg-slate-50/50" />
            const date = dateKey(visibleMonth.year, visibleMonth.month, day)
            const departure = departureMap.get(date)
            const selected = bulkMode ? selectedDates.includes(date) : selectedDate === date
            const summaryRates = (departure?.rates ?? []).filter((rate) => pricingMode === 'room_occupancy' ? rate.travelerType === 'adult' : true)
            return <button key={date} type="button" onClick={() => chooseDate(date)} className={`relative min-h-24 border-b border-r p-2 text-left transition hover:bg-blue-50 ${selected ? 'bg-blue-100 ring-2 ring-inset ring-blue-600' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">{day}</span>
                {bulkMode ? <span className={`inline-flex size-5 items-center justify-center rounded border ${selected ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-300 bg-white'}`}>{selected ? <Check className="size-3" /> : null}</span> : null}
              </div>
              {departure ? <div className="mt-2 space-y-1">
                {summaryRates.slice(0, 3).map((rate) => <div key={templateKey(rate.rateType, rate.travelerType)} className="truncate text-[11px] font-medium text-slate-700">{rate.rateType.replace(' room', '')} {formatMoney(rate.price, props.currency)}</div>)}
                {summaryRates.length > 3 ? <div className="text-[10px] text-slate-500">+{summaryRates.length - 3} more</div> : null}
                {departure.status === 'closed' ? <div className="text-[10px] font-semibold text-red-700">Closed</div> : null}
              </div> : !bulkMode ? <div className="mt-4 flex justify-center"><span className="inline-flex size-7 items-center justify-center rounded-full border border-dashed border-slate-400 text-slate-500"><Plus className="size-4" /></span></div> : null}
            </button>
          })}
        </div>
      </div>

      {!bulkMode && selectedDate ? <PriceEditor key={`single-${selectedDate}-${orderedTemplate.map((item) => templateKey(item.rateType, item.travelerType)).join('|')}`} pricingMode={pricingMode} template={orderedTemplate} departure={selectedDeparture} dates={[selectedDate]} action={props.saveDateAction} locale={props.locale} handle={props.handle} productId={props.productId} bulk={false} overwriteCount={0} onSaved={applySavedDepartures} /> : null}
      {bulkMode && selectedDates.length > 0 ? <PriceEditor key={`bulk-${selectedDates.join('|')}-${orderedTemplate.map((item) => templateKey(item.rateType, item.travelerType)).join('|')}`} pricingMode={pricingMode} template={orderedTemplate} dates={selectedDates} action={props.saveBulkAction} locale={props.locale} handle={props.handle} productId={props.productId} bulk overwriteCount={overwriteCount} onSaved={applySavedDepartures} /> : null}
    </div>
  )
}
