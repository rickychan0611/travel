import { currentUser } from '@clerk/nextjs/server'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { Metadata, Route } from 'next'
import { getTranslations } from 'next-intl/server'
import {
  ArrowLeft,
  CalendarDays,
  CircleHelp,
  CreditCard,
  Mail,
  Phone,
  ReceiptText,
} from 'lucide-react'
import { getCustomerOrderDetail, type ShopifyMoney } from '@/lib/shopify/orders'

export async function generateMetadata({ params }: { params: Promise<{ locale: string; orderId: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'orderDetails' })
  return { title: t('title') }
}

function money(locale: string, value: ShopifyMoney) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: value.currencyCode,
  }).format(Number(value.amount))
}

const STATUS_STYLES: Record<string, string> = {
  PAID: 'bg-[#e8f8ef] text-[#168a50]',
  AUTHORIZED: 'bg-[#edf6ff] text-[#0075c4]',
  PENDING: 'bg-[#fff4e5] text-[#b86700]',
  PARTIALLY_PAID: 'bg-[#fff4e5] text-[#b86700]',
  REFUNDED: 'bg-[#f1f1f1] text-[#666]',
  PARTIALLY_REFUNDED: 'bg-[#fff0e8] text-[#c84e00]',
  VOIDED: 'bg-[#fdecec] text-[#bd2d2d]',
  FULFILLED: 'bg-[#e8f8ef] text-[#168a50]',
  UNFULFILLED: 'bg-[#edf6ff] text-[#0075c4]',
  PARTIALLY_FULFILLED: 'bg-[#fff4e5] text-[#b86700]',
  IN_PROGRESS: 'bg-[#edf6ff] text-[#0075c4]',
  ON_HOLD: 'bg-[#fff4e5] text-[#b86700]',
  SCHEDULED: 'bg-[#edf6ff] text-[#0075c4]',
}

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>
}) {
  const { locale, orderId } = await params
  const t = await getTranslations({ locale, namespace: 'orderDetails' })
  const user = await currentUser()
  if (!user) redirect(`/${locale}/login` as Route)

  const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? ''
  const customerName = user.fullName || user.username || email
  const profilePhone = user.primaryPhoneNumber?.phoneNumber
    || (typeof user.privateMetadata.customerPhone === 'string' ? user.privateMetadata.customerPhone : '')
  let order: Awaited<ReturnType<typeof getCustomerOrderDetail>> = null
  let loadError = false
  try {
    order = await getCustomerOrderDetail(orderId, email)
  } catch (error) {
    console.error('[order-details] Failed to load Shopify order:', error)
    loadError = true
  }

  if (!loadError && !order) notFound()
  if (loadError) {
    return (
      <div className="bg-[#f2f2f2] px-4 py-20">
        <div className="mx-auto max-w-xl rounded-lg bg-white p-8 text-center shadow-sm">
          <CircleHelp className="mx-auto h-10 w-10 text-[#f59f00]" />
          <h1 className="mt-4 text-xl font-bold text-[#242424]">{t('loadErrorTitle')}</h1>
          <p className="mt-2 text-sm leading-6 text-[#777]">{t('loadError')}</p>
          <Link href={`/${locale}/bookings` as Route} className="mt-6 inline-flex text-sm font-bold text-[#0090f2] hover:underline">
            {t('backToOrders')}
          </Link>
        </div>
      </div>
    )
  }

  if (!order) notFound()

  const financialStatus = order.financialStatus.toUpperCase().replaceAll(' ', '_')
  const fulfillmentStatus = order.fulfillmentStatus.toUpperCase().replaceAll(' ', '_')
  const statusLabel = (status: string) => {
    const key = `status.${status}` as Parameters<typeof t>[0]
    return t.has(key) ? t(key) : status.replaceAll('_', ' ')
  }
  const placedAt = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(order.processedAt || order.createdAt))

  return (
    <div className="bg-[#f2f2f2] px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-[1080px]">
        <Link
          href={`/${locale}/bookings` as Route}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#007fd6] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToOrders')}
        </Link>

        <header className="mb-5 rounded-lg bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-[#777]">{t('orderNumber')}</p>
              <h1 className="mt-1 text-2xl font-bold text-[#242424]">{order.name}</h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-[#777]">
                <CalendarDays className="h-4 w-4" />
                {t('placedOn', { date: placedAt })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${STATUS_STYLES[financialStatus] ?? 'bg-[#f1f1f1] text-[#555]'}`}>
                {t('payment')}: {statusLabel(financialStatus)}
              </span>
              <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${STATUS_STYLES[fulfillmentStatus] ?? 'bg-[#f1f1f1] text-[#555]'}`}>
                {t('tripStatus')}: {statusLabel(fulfillmentStatus)}
              </span>
            </div>
          </div>
          {order.cancelledAt ? (
            <div className="mt-5 rounded-md border border-[#f2caca] bg-[#fff5f5] px-4 py-3 text-sm text-[#a92b2b]">
              {t('cancelledNotice')}
            </div>
          ) : null}
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
          <section className="rounded-lg bg-white p-5 shadow-sm sm:p-7">
            <h2 className="flex items-center gap-2 text-lg font-bold text-[#242424]">
              <ReceiptText className="h-5 w-5 text-[#0090f2]" />
              {t('bookingDetails')}
            </h2>
            <div className="mt-5 divide-y divide-[#eee]">
              {order.lineItems.map((item) => {
                const attributes = item.customAttributes.filter((attribute) => !attribute.key.startsWith('_') && attribute.value)
                const title = item.productHandle ? (
                  <Link href={`/${locale}/tours/${item.productHandle}` as Route} className="font-bold text-[#242424] hover:text-[#0090f2] hover:underline">
                    {item.title}
                  </Link>
                ) : <p className="font-bold text-[#242424]">{item.title}</p>

                return (
                  <article key={item.id} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                    {item.image ? (
                      <Image
                        src={item.image.url}
                        alt={item.image.altText || item.title}
                        width={112}
                        height={84}
                        className="h-[84px] w-[112px] shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-[84px] w-[112px] shrink-0 items-center justify-center rounded-md bg-[#f3f3f3] text-xs text-[#999]">
                        {t('tour')}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      {title}
                      {item.variantTitle ? <p className="mt-1 text-sm text-[#666]">{item.variantTitle}</p> : null}
                      {attributes.length ? (
                        <dl className="mt-3 grid gap-x-5 gap-y-1 text-sm sm:grid-cols-2">
                          {attributes.map((attribute) => (
                            <div key={`${item.id}-${attribute.key}`} className="flex gap-1">
                              <dt className="shrink-0 text-[#888]">{attribute.key}:</dt>
                              <dd className="text-[#444]">{attribute.value}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : null}
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="text-[#777]">{t('quantity')}: {item.currentQuantity || item.quantity}</span>
                        <span className="font-bold text-[#242424]">{money(locale, item.total)}</span>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-[#242424]">{t('priceSummary')}</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-[#777]">{t('subtotal')}</dt><dd>{money(locale, order.subtotal)}</dd></div>
                {Number(order.discounts.amount) > 0 ? (
                  <div className="flex justify-between gap-3 text-[#168a50]"><dt>{t('discounts')}</dt><dd>−{money(locale, order.discounts)}</dd></div>
                ) : null}
                <div className="flex justify-between gap-3"><dt className="text-[#777]">{t('taxes')}</dt><dd>{money(locale, order.taxes)}</dd></div>
                <div className="flex justify-between gap-3 border-t border-[#eee] pt-3 text-base font-bold"><dt>{t('total')}</dt><dd>{money(locale, order.total)}</dd></div>
                {Number(order.refunded.amount) > 0 ? (
                  <div className="flex justify-between gap-3 text-[#c84e00]"><dt>{t('refunded')}</dt><dd>{money(locale, order.refunded)}</dd></div>
                ) : null}
              </dl>
              {order.paymentGatewayNames.length ? (
                <div className="mt-4 flex items-start gap-2 border-t border-[#eee] pt-4 text-sm text-[#666]">
                  <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-[#0090f2]" />
                  <span>{t('paymentMethod')}: {order.paymentGatewayNames.join(', ')}</span>
                </div>
              ) : null}
            </section>

            <section className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-[#242424]">{t('contactInformation')}</h2>
              <div className="mt-4 space-y-3 text-sm text-[#555]">
                <p className="font-medium text-[#333]">{customerName}</p>
                <p className="flex items-start gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#0090f2]" /><span className="break-all">{order.email}</span></p>
                {profilePhone ? <p className="flex items-start gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#0090f2]" />{profilePhone}</p> : null}
              </div>
            </section>

            <section className="rounded-lg border border-[#cfe8fb] bg-[#f5fbff] p-5">
              <h2 className="flex items-center gap-2 font-bold text-[#242424]"><CircleHelp className="h-5 w-5 text-[#0090f2]" />{t('needHelp')}</h2>
              <p className="mt-2 text-sm leading-6 text-[#666]">{t('needHelpText', { order: order.name })}</p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
