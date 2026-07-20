import Link from 'next/link'
import { notFound } from 'next/navigation'
import { HelpCircle } from 'lucide-react'
import { AdminActionForm } from '@/components/admin/AdminActionForm'
import { AdminPageHeader, AdminPanel } from '@/components/admin/AdminCards'
import { ConfirmSubmitButton } from '@/components/admin/ConfirmSubmitButton'
import { DatePricingCalendar, type PriceTemplateVariant } from '@/components/admin/DatePricingCalendar'
import { HighlightsEditor } from '@/components/admin/HighlightsEditor'
import { ItineraryImagesEditor } from '@/components/admin/ItineraryImagesEditor'
import { ItineraryStopsEditor } from '@/components/admin/ItineraryStopsEditor'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import type { AdminMetaobject } from '@/lib/admin/shopify-admin'
import { getAdminProductByHandle } from '@/lib/admin/shopify-admin'
import {
  addImageAction,
  addItineraryDayAction,
  addCostSectionAction,
  addSimpleMetaobjectAction,
  archiveProductAction,
  deleteContentItemAction,
  deleteImageAction,
  deleteProductAction,
  saveContentAction,
  saveHighlightsAction,
  saveItineraryDayAction,
  saveOverview,
  saveSimpleMetaobjectAction,
  saveDeparturePricesAction,
  saveBulkDeparturePricesAction,
  saveRateTemplateAction,
} from './actions'

export const dynamic = 'force-dynamic'

const locales = [
  ['en', 'English'],
  ['zh-CN', '简体中文'],
  ['zh-TW', '繁體中文'],
] as const

function fieldValue(product: Awaited<ReturnType<typeof getAdminProductByHandle>>, key: string) {
  return product?.metafields[key]?.value ?? ''
}

function byLocale(items: AdminMetaobject[], locale: string) {
  return items
    .filter((item) => item.fields.locale === locale)
    .sort((a, b) => Number(a.fields.position || a.fields.day_number || 0) - Number(b.fields.position || b.fields.day_number || 0))
}

function currentContent(product: NonNullable<Awaited<ReturnType<typeof getAdminProductByHandle>>>, locale: string) {
  return product.content.find((item) => item.fields.locale === locale) ||
    product.content.find((item) => item.fields.locale === 'en') ||
    product.content[0] ||
    null
}

function HiddenContext({
  locale,
  contentLocale,
  handle,
  product,
}: {
  locale: string
  contentLocale: string
  handle: string
  product: NonNullable<Awaited<ReturnType<typeof getAdminProductByHandle>>>
}) {
  return (
    <>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="contentLocale" value={contentLocale} />
      <input type="hidden" name="handle" value={handle} />
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="productCode" value={product.productCode} />
    </>
  )
}

function TextInput({
  label,
  name,
  defaultValue,
  placeholder,
  help,
  type = 'text',
}: {
  label: string
  name: string
  defaultValue?: string
  placeholder?: string
  help?: string
  type?: string
}) {
  return (
    <label className="block">
      <FieldLabel label={label} help={help} />
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950"
      />
    </label>
  )
}

function SelectInput({
  label,
  name,
  defaultValue,
  help,
  options,
}: {
  label: string
  name: string
  defaultValue?: string
  help?: string
  options: Array<{ value: string; label: string }>
}) {
  return (
    <label className="block">
      <FieldLabel label={label} help={help} />
      <select name={name} defaultValue={defaultValue ?? ''} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  )
}

function FieldLabel({ label, help }: { label: string; help?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm text-slate-700">
      {label}
      {help ? (
        <span className="group/help relative inline-flex">
          <button
            type="button"
            aria-label={`${label} help`}
            className="inline-flex size-4 items-center justify-center rounded-full text-slate-400 hover:text-slate-950 focus:text-slate-950"
          >
            <HelpCircle className="size-3.5" />
          </button>
          <span className="pointer-events-none absolute left-1/2 top-5 z-20 hidden w-64 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-700 shadow-lg group-hover/help:block group-focus-within/help:block">
            {help}
          </span>
        </span>
      ) : null}
    </span>
  )
}

function TextArea({
  label,
  name,
  defaultValue,
  rows = 3,
}: {
  label: string
  name: string
  defaultValue?: string
  rows?: number
}) {
  return (
    <label className="block">
      <span className="text-sm text-slate-700">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
      />
    </label>
  )
}

function LocaleTabs({ locale, handle, contentLocale }: { locale: string; handle: string; contentLocale: string }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {locales.map(([value, label]) => (
        <Link
          key={value}
          href={`/${locale}/admin/products/${handle}?contentLocale=${value}`}
          className={`rounded-lg border px-3 py-2 text-sm ${
            contentLocale === value
              ? 'border-slate-950 bg-slate-950 text-white'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  )
}

export default async function AdminProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; handle: string }>
  searchParams: Promise<{ contentLocale?: string }>
}) {
  const { locale, handle } = await params
  const { contentLocale: requestedContentLocale } = await searchParams
  const contentLocale = locales.some(([value]) => value === requestedContentLocale) ? requestedContentLocale! : 'en'
  const product = await getAdminProductByHandle(handle)
  if (!product) notFound()

  const content = currentContent(product, contentLocale)
  const highlights = byLocale(product.highlights, contentLocale)
  const itineraryDays = byLocale(product.itineraryDays, contentLocale)
  const costSections = byLocale(product.costSections, contentLocale)
  const policies = byLocale(product.policyNotices, contentLocale)
  const pickupDropoffs = byLocale(product.pickupDropoffs, contentLocale)
  const addons = byLocale(product.addons, contentLocale)
  const variantGroups = Array.from(
    product.variants
      .slice()
      .sort((a, b) => `${a.date || '9999'}-${a.rateType}`.localeCompare(`${b.date || '9999'}-${b.rateType}`))
      .reduce((groups, variant) => {
        const date = variant.date || 'No date'
        groups.set(date, [...(groups.get(date) || []), variant])
        return groups
      }, new Map<string, typeof product.variants>()),
  ).map(([date, variants]) => ({ date, variants }))
  const pricingMode = (fieldValue(product, 'pricing_mode') || (product.variants.some((variant) => ['Single room', 'Double room', 'Triple room', 'Quad room'].includes(variant.rateType)) ? 'room_occupancy' : 'per_person')) as 'per_person' | 'room_occupancy'
  const allowedRateTypes = pricingMode === 'room_occupancy'
    ? new Set(['Single room', 'Double room', 'Triple room', 'Quad room'])
    : new Set(['Adult', 'Child', 'Senior'])
  const derivedTemplate = Array.from(new Map(product.variants.flatMap((variant): Array<[string, PriceTemplateVariant]> => {
    if (!allowedRateTypes.has(variant.rateType)) return []
    const travelerType = variant.travelerType
      ?? (variant.priceType === 2 ? 'child' : variant.priceType === 7 ? 'senior' : 'adult')
    const item = { rateType: variant.rateType, travelerType } as PriceTemplateVariant
    return [[`${item.rateType}:${item.travelerType}`, item]]
  })).values())
  let storedTemplate: PriceTemplateVariant[] = []
  try {
    const parsed = JSON.parse(fieldValue(product, 'rate_template') || '[]') as PriceTemplateVariant[]
    if (Array.isArray(parsed)) storedTemplate = parsed.filter((item) => allowedRateTypes.has(item.rateType) && ['adult', 'child', 'senior'].includes(item.travelerType))
  } catch { /* Use the variants already present on the product. */ }
  const initialTemplate = storedTemplate.length ? storedTemplate : derivedTemplate
  const calendarDepartures = variantGroups
    .filter((group) => /^\d{4}-\d{2}-\d{2}$/.test(group.date))
    .map((group) => {
      const departure = product.departures.find((item) => item.fields.date === group.date)
      return {
        date: group.date,
        status: departure?.fields.status || 'open',
        remainingStock: Number(departure?.fields.remaining_stock || 0),
        rates: group.variants.map((variant) => ({
          variantId: variant.id,
          rateType: variant.rateType as PriceTemplateVariant['rateType'],
          travelerType: variant.travelerType ?? (variant.priceType === 2 ? 'child' : variant.priceType === 7 ? 'senior' : 'adult'),
          price: variant.price,
          sku: variant.sku,
        })),
      }
    })

  return (
    <>
      <AdminPageHeader
        title={content?.fields.title || product.title}
        description={`Product code ${product.productCode || '-'} · ${product.variantCount} variants · ${product.bookable ? 'bookable' : 'content only'}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" href={`/${locale}/tours/${product.handle}`} target="_blank">
              View storefront
            </Link>
            {product.adminUrl ? <a className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white" href={product.adminUrl} target="_blank" rel="noreferrer">Open Shopify</a> : null}
          </div>
        }
      />

      <div className="space-y-4">
        <AdminPanel title="Overview" description="Operational settings. Customer-facing text is in the Content section below." collapsible defaultOpen>
          <AdminActionForm action={saveOverview} submitLabel="Save overview" className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="originalHandle" value={product.handle} />
            <input type="hidden" name="originalProductCode" value={product.productCode} />
            <input type="hidden" name="descriptionHtml" value={product.descriptionHtml} />
            <TextInput
              label="Internal title"
              name="title"
              defaultValue={product.title}
              help="Used inside Shopify/Admin lists. Customer-facing titles are edited in the Content section."
            />
            <TextInput
              label="Product code"
              name="productCode"
              defaultValue={product.productCode}
              help="Must be unique. Changing it updates the Shopify identity, code tag, linked content records, and current variant SKUs."
            />
            <TextInput
              label="URL handle"
              name="handle"
              defaultValue={product.handle}
              help="The last part of the tour page URL. Keep it short, lowercase, and stable after publishing."
            />
            <label className="block">
              <FieldLabel label="Status" help="Controls whether the Shopify product is active, draft, or archived. Draft/archived products should not be shown to customers." />
              <select name="status" defaultValue={product.status} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950">
                <option value="ACTIVE">ACTIVE</option>
                <option value="DRAFT">DRAFT</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </label>
            <TextInput
              label="Product type"
              name="productType"
              defaultValue={product.productType}
              help="A broad Shopify product grouping, such as Tour, Tour Add-on, or Package Tour."
            />
            <TextInput label="Country" name="country" defaultValue={fieldValue(product, 'country')} />
            <TextInput label="City" name="city" defaultValue={fieldValue(product, 'city') || product.city} />
            <TextInput
              label="Destinations"
              name="destinations"
              defaultValue={fieldValue(product, 'destinations')}
              help="Places included in this tour. These power destination filters and category pages."
            />
            <TextInput
              label="Labels"
              name="labels"
              defaultValue={fieldValue(product, 'labels')}
              help="Marketing/filter labels such as platinum, private, family, or local tour."
            />
            <TextInput label="Duration days" name="durationDays" defaultValue={fieldValue(product, 'duration_days')} />
            <TextInput label="Min price" name="minPrice" defaultValue={fieldValue(product, 'min_price') || product.minPrice} />
            <TextInput label="Max price" name="maxPrice" defaultValue={fieldValue(product, 'max_price') || product.maxPrice} />
            <TextInput
              label="Earliest departure"
              name="earliestDeparture"
              type="date"
              defaultValue={fieldValue(product, 'earliest_departure')}
              help="The first departure date customers should see in filters and availability summaries."
            />
            <TextInput
              label="Latest departure"
              name="latestDeparture"
              type="date"
              defaultValue={fieldValue(product, 'latest_departure')}
              help="The last departure date customers should see in filters and availability summaries."
            />
            <SelectInput
              label="Pricing mode"
              name="pricingMode"
              defaultValue={pricingMode}
              help="Per person uses Adult/Child/Senior rates. Room occupancy uses Single/Double/Triple/Quad plus child or senior rates. ToursBMS sync will overwrite this setting."
              options={[{ value: 'per_person', label: 'Per person' }, { value: 'room_occupancy', label: 'Room occupancy' }]}
            />
            <SelectInput
              label="Booking type"
              name="productTypeFact"
              defaultValue={fieldValue(product, 'product_type')}
              help="Controls how the storefront treats this tour in booking and filters."
              options={[
                { value: '', label: 'Not set' },
                { value: 'group-tour', label: 'Group tour' },
                { value: 'private', label: 'Private tour' },
                { value: 'day-tour', label: 'Day tour' },
                { value: 'content-only', label: 'Content only / inquiry' },
              ]}
            />
            <SelectInput
              label="Confirm method"
              name="confirmMethod"
              defaultValue={fieldValue(product, 'confirm_method')}
              help="How bookings are confirmed after a customer chooses this tour."
              options={[
                { value: '', label: 'Not set' },
                { value: 'instant', label: 'Instant confirmation' },
                { value: 'manual', label: 'Manual confirmation' },
                { value: 'request', label: 'Request only' },
              ]}
            />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="bookable" defaultChecked={product.bookable} className="size-4" />
              Bookable
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm text-slate-700">Tags</span>
              <textarea name="tags" defaultValue={product.tags.join(', ')} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-950" />
            </label>
          </AdminActionForm>
        </AdminPanel>

        <AdminPanel title="Content" description={contentLocale === 'en' ? 'English is the default storefront content and also updates the Shopify product title/description.' : 'Translation content is stored in Shopify content records.'} collapsible>
          <LocaleTabs locale={locale} handle={product.handle} contentLocale={contentLocale} />
          <AdminActionForm action={saveContentAction} submitLabel="Save content" className="space-y-4">
            <HiddenContext locale={locale} contentLocale={contentLocale} handle={product.handle} product={product} />
            <input type="hidden" name="metaobjectId" value={content?.id || ''} />
            <TextInput label="Tour title" name="title" defaultValue={content?.fields.title || product.title} />
            <TextInput label="Subtitle" name="subtitle" defaultValue={content?.fields.subtitle} />
            <RichTextEditor name="descriptionHtml" label="Highlights rich content" initialHtml={content?.fields.description_html || product.descriptionHtml} />
          </AdminActionForm>
        </AdminPanel>

        <AdminPanel title="Highlights" description="Add, edit, delete, and reorder customer-facing highlight sentences." collapsible>
          <HighlightsEditor
            action={saveHighlightsAction}
            locale={locale}
            contentLocale={contentLocale}
            handle={product.handle}
            productId={product.id}
            productCode={product.productCode}
            initialHighlights={highlights.map((item) => ({ id: item.id, text: item.fields.text || '' }))}
          />
        </AdminPanel>

        <AdminPanel title="Itinerary" description="Edit the tour day by day. Route/stops stay saved to Shopify itinerary-day records." collapsible>
          <div id="itinerary" className="space-y-4">
            {itineraryDays.map((day, index) => (
              <div key={day.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <AdminActionForm
                  action={saveItineraryDayAction}
                  submitLabel="Save day"
                  submitClassName="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
                >
                  <HiddenContext locale={locale} contentLocale={contentLocale} handle={product.handle} product={product} />
                  <input type="hidden" name="metaobjectId" value={day.id} />
                  <div className="grid gap-3 md:grid-cols-3">
                    <TextInput label="Day number" name="dayNumber" defaultValue={day.fields.day_number || String(index + 1)} />
                    <div className="md:col-span-2"><TextInput label="Hotel" name="hotel" defaultValue={day.fields.hotel} /></div>
                    <ItineraryStopsEditor initialStopsJson={day.fields.stops_json || '[]'} />
                    <ItineraryImagesEditor initialImagesJson={day.fields.images_json || '[]'} />
                    <RichTextEditor name="descriptionHtml" label="Day description" initialHtml={day.fields.description_html || ''} />
                  </div>
                </AdminActionForm>
                <div className="mt-3 flex items-center justify-end gap-3">
                  <form action={deleteContentItemAction}>
                    <HiddenContext locale={locale} contentLocale={contentLocale} handle={product.handle} product={product} />
                    <input type="hidden" name="referenceKey" value="itinerary_day" />
                    <input type="hidden" name="metaobjectId" value={day.id} />
                    <ConfirmSubmitButton className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50" message={`Delete day ${day.fields.day_number || ''}?`}>
                      Delete day
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </div>
            ))}
            <details className="rounded-lg border border-dashed border-slate-300 p-4">
              <summary className="inline-flex cursor-pointer rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white">
                Add itinerary day
              </summary>
              <form action={addItineraryDayAction} className="mt-4">
                <HiddenContext locale={locale} contentLocale={contentLocale} handle={product.handle} product={product} />
                <div className="grid gap-3 md:grid-cols-3">
                  <ItineraryStopsEditor initialStopsJson="[]" />
                  <ItineraryImagesEditor initialImagesJson="[]" />
                  <RichTextEditor name="descriptionHtml" label="Day description" initialHtml="" />
                </div>
                <button className="mt-3 rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white">Add itinerary day</button>
              </form>
            </details>
          </div>
        </AdminPanel>

        <div className="grid gap-4">
          <AdminPanel title="Cost sections" description="Includes, excludes, and other pricing notes." collapsible defaultOpen>
            <div className="space-y-3">
              {costSections.map((section) => (
                <div key={section.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <AdminActionForm
                    action={saveSimpleMetaobjectAction}
                    submitLabel="Save"
                    footerClassName="mt-2 flex flex-wrap items-center gap-3"
                    submitClassName="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
                  >
                    <HiddenContext locale={locale} contentLocale={contentLocale} handle={product.handle} product={product} />
                    <input type="hidden" name="metaobjectId" value={section.id} />
                    <SelectInput
                      label="Section"
                      name="field:section"
                      defaultValue={/^(?:exclude|excludes|excluded|not[\s_-]*included)$/i.test(section.fields.section.trim()) ? 'excludes' : 'includes'}
                      options={[{ value: 'includes', label: 'Includes' }, { value: 'excludes', label: 'Excludes' }]}
                    />
                    <RichTextEditor name="field:html" label="Content" initialHtml={section.fields.html || section.fields.text || ''} />
                  </AdminActionForm>
                  <form action={deleteContentItemAction} className="mt-2">
                    <HiddenContext locale={locale} contentLocale={contentLocale} handle={product.handle} product={product} />
                    <input type="hidden" name="referenceKey" value="cost_section" />
                    <input type="hidden" name="metaobjectId" value={section.id} />
                    <button className="text-xs text-red-700">Delete cost section</button>
                  </form>
                </div>
              ))}
              <AdminActionForm
                action={addCostSectionAction}
                submitLabel="Add cost section"
                pendingLabel="Adding…"
                className="rounded-lg border border-dashed border-slate-300 p-3"
                footerClassName="mt-2 flex flex-wrap items-center gap-3"
                submitClassName="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
              >
                <HiddenContext locale={locale} contentLocale={contentLocale} handle={product.handle} product={product} />
                <SelectInput label="New section" name="field:section" defaultValue="includes" options={[{ value: 'includes', label: 'Includes' }, { value: 'excludes', label: 'Excludes' }]} />
                <RichTextEditor name="field:html" label="Content" initialHtml="" />
              </AdminActionForm>
            </div>
          </AdminPanel>

          <AdminPanel title="Policies & notices" description="Staff-friendly policy rows." collapsible>
            <div className="space-y-3">
              {policies.map((policy) => (
                <div key={policy.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <AdminActionForm
                    action={saveSimpleMetaobjectAction}
                    submitLabel="Save"
                    footerClassName="mt-2 flex flex-wrap items-center gap-3"
                    submitClassName="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
                  >
                    <HiddenContext locale={locale} contentLocale={contentLocale} handle={product.handle} product={product} />
                    <input type="hidden" name="metaobjectId" value={policy.id} />
                    <TextInput label="Title" name="field:matter_name" defaultValue={policy.fields.matter_name || policy.fields.type_label} />
                    <RichTextEditor name="field:html" label="Content" initialHtml={policy.fields.html || policy.fields.text || ''} />
                    <input type="hidden" name="field:notice_type" value={policy.fields.notice_type || '0'} />
                    <input type="hidden" name="field:type_label" value={policy.fields.type_label || 'Notice'} />
                  </AdminActionForm>
                  <form action={deleteContentItemAction} className="mt-2">
                    <HiddenContext locale={locale} contentLocale={contentLocale} handle={product.handle} product={product} />
                    <input type="hidden" name="referenceKey" value="policy_notice" />
                    <input type="hidden" name="metaobjectId" value={policy.id} />
                    <button className="text-xs text-red-700">Delete notice</button>
                  </form>
                </div>
              ))}
              <form action={addSimpleMetaobjectAction} className="rounded-lg border border-dashed border-slate-300 p-3">
                <HiddenContext locale={locale} contentLocale={contentLocale} handle={product.handle} product={product} />
                <input type="hidden" name="type" value="tour_policy_notice" />
                <input type="hidden" name="referenceKey" value="policy_notice" />
                <input type="hidden" name="field:notice_type" value="0" />
                <input type="hidden" name="field:type_label" value="Notice" />
                <TextInput label="New notice title" name="field:matter_name" />
                <RichTextEditor name="field:html" label="Content" initialHtml="" />
                <button className="mt-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white">Add notice</button>
              </form>
            </div>
          </AdminPanel>
        </div>

        <div className="grid gap-4">
          <AdminPanel title="Pickup / dropoff" collapsible>
            <div className="space-y-3">
              {pickupDropoffs.map((point) => (
                <div key={point.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <AdminActionForm
                    action={saveSimpleMetaobjectAction}
                    submitLabel="Save"
                    footerClassName="mt-2 flex flex-wrap items-center gap-3"
                    submitClassName="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
                  >
                    <HiddenContext locale={locale} contentLocale={contentLocale} handle={product.handle} product={product} />
                    <input type="hidden" name="metaobjectId" value={point.id} />
                    <TextInput label="Kind" name="field:kind" defaultValue={point.fields.kind} />
                    <TextInput label="Name" name="field:name" defaultValue={point.fields.name} />
                    <TextInput label="Address" name="field:address" defaultValue={point.fields.address} />
                    <TextArea label="Description" name="field:description" defaultValue={point.fields.description} />
                    <input type="hidden" name="field:code" value={point.fields.code || ''} />
                    <input type="hidden" name="field:is_airport" value={point.fields.is_airport || 'false'} />
                  </AdminActionForm>
                  <form action={deleteContentItemAction} className="mt-2">
                    <HiddenContext locale={locale} contentLocale={contentLocale} handle={product.handle} product={product} />
                    <input type="hidden" name="referenceKey" value="pickup_dropoff" />
                    <input type="hidden" name="metaobjectId" value={point.id} />
                    <button className="text-xs text-red-700">Delete point</button>
                  </form>
                </div>
              ))}
              <form action={addSimpleMetaobjectAction} className="rounded-lg border border-dashed border-slate-300 p-3">
                <HiddenContext locale={locale} contentLocale={contentLocale} handle={product.handle} product={product} />
                <input type="hidden" name="type" value="tour_pickup_dropoff" />
                <input type="hidden" name="referenceKey" value="pickup_dropoff" />
                <TextInput label="Kind" name="field:kind" placeholder="pickup or dropoff" />
                <TextInput label="Name" name="field:name" />
                <TextInput label="Address" name="field:address" />
                <TextArea label="Description" name="field:description" />
                <button className="mt-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white">Add point</button>
              </form>
            </div>
          </AdminPanel>

          <AdminPanel title="Add-ons" collapsible>
            <div className="space-y-3">
              {addons.map((addon) => (
                <div key={addon.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <AdminActionForm
                    action={saveSimpleMetaobjectAction}
                    submitLabel="Save"
                    footerClassName="mt-2 flex flex-wrap items-center gap-3"
                    submitClassName="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
                  >
                    <HiddenContext locale={locale} contentLocale={contentLocale} handle={product.handle} product={product} />
                    <input type="hidden" name="metaobjectId" value={addon.id} />
                    <TextInput label="Name" name="field:name" defaultValue={addon.fields.name} />
                    <TextArea label="Description" name="field:description" defaultValue={addon.fields.description} />
                    <TextInput label="Amount" name="field:amount" defaultValue={addon.fields.amount} />
                    <TextInput label="Currency" name="field:currency" defaultValue={addon.fields.currency || product.currencyCode} />
                    <TextInput label="Applies to" name="field:people_type" defaultValue={addon.fields.people_type} />
                    <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                      <input type="hidden" name="field:chargeable" value="false" />
                      <input type="checkbox" name="field:chargeable" value="true" defaultChecked={addon.fields.chargeable === 'true'} />
                      Chargeable add-on
                    </label>
                    <input type="hidden" name="field:code" value={addon.fields.code || ''} />
                    <input type="hidden" name="field:shopify_variant_id" value={addon.fields.shopify_variant_id || ''} />
                  </AdminActionForm>
                  <form action={deleteContentItemAction} className="mt-2">
                    <HiddenContext locale={locale} contentLocale={contentLocale} handle={product.handle} product={product} />
                    <input type="hidden" name="referenceKey" value="addon" />
                    <input type="hidden" name="metaobjectId" value={addon.id} />
                    <button className="text-xs text-red-700">Delete add-on</button>
                  </form>
                </div>
              ))}
              <form action={addSimpleMetaobjectAction} className="rounded-lg border border-dashed border-slate-300 p-3">
                <HiddenContext locale={locale} contentLocale={contentLocale} handle={product.handle} product={product} />
                <input type="hidden" name="type" value="tour_addon" />
                <input type="hidden" name="referenceKey" value="addon" />
                <TextInput label="Name" name="field:name" />
                <TextArea label="Description" name="field:description" />
                <TextInput label="Amount" name="field:amount" defaultValue="0" />
                <TextInput label="Currency" name="field:currency" defaultValue={product.currencyCode} />
                <TextInput label="Applies to" name="field:people_type" defaultValue="All" />
                <input type="hidden" name="field:chargeable" value="false" />
                <button className="mt-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white">Add add-on</button>
              </form>
            </div>
          </AdminPanel>
        </div>

        <AdminPanel title="Images" collapsible>
          <div id="images" className="grid gap-4 md:grid-cols-3">
            {product.media.map((image) => (
              <div key={image.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt={image.altText} className="aspect-[4/3] w-full rounded-lg object-cover" />
                <div className="mt-2 text-xs text-slate-600">{image.altText || 'Product image'}</div>
                <form action={deleteImageAction} className="mt-2">
                  <HiddenContext locale={locale} contentLocale={contentLocale} handle={product.handle} product={product} />
                  <input type="hidden" name="mediaId" value={image.id} />
                  <button className="text-xs text-red-700">Delete image</button>
                </form>
              </div>
            ))}
            <form action={addImageAction} className="rounded-lg border border-dashed border-slate-300 p-3">
              <HiddenContext locale={locale} contentLocale={contentLocale} handle={product.handle} product={product} />
              <TextInput label="Image URL" name="sourceUrl" />
              <TextInput label="Alt text" name="alt" defaultValue={content?.fields.title || product.title} />
              <button className="mt-3 rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white">Add image</button>
            </form>
          </div>
        </AdminPanel>

        <AdminPanel title="Dates & prices" description="Set variants once, then price individual or multiple departure days from the calendar." collapsible defaultOpen>
          <div id="dates">
            <DatePricingCalendar
              locale={locale}
              handle={product.handle}
              productId={product.id}
              currency={product.currencyCode}
              pricingMode={pricingMode}
              initialTemplate={initialTemplate}
              departures={calendarDepartures}
              saveTemplateAction={saveRateTemplateAction}
              saveDateAction={saveDeparturePricesAction}
              saveBulkAction={saveBulkDeparturePricesAction}
            />
          </div>
        </AdminPanel>

        <AdminPanel title="Danger zone" description="Archive is safer than delete. Permanent delete removes the Shopify product." collapsible>
          <div className="flex flex-col gap-4 md:flex-row">
            <form action={archiveProductAction} className="rounded-lg border border-amber-300 bg-amber-50 p-4">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="handle" value={product.handle} />
              <input type="hidden" name="productId" value={product.id} />
              <button className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white">Archive product</button>
            </form>
            <form action={deleteProductAction} className="rounded-lg border border-red-300 bg-red-50 p-4">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="productId" value={product.id} />
              <TextInput label="Type DELETE to permanently delete" name="confirm" />
              <button className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white">Delete product</button>
            </form>
          </div>
        </AdminPanel>
      </div>
    </>
  )
}
