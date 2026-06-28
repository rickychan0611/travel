import { currentUser } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getOrderById, getOrdersByEmail, type ConfirmationOrder } from '@/lib/shopify/orders'
import { CartClearer } from './CartClearer'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'orderConfirmation' })
  return { title: t('title') }
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PAID: 'default',
  AUTHORIZED: 'secondary',
  PENDING: 'secondary',
  PARTIALLY_PAID: 'secondary',
  REFUNDED: 'destructive',
  PARTIALLY_REFUNDED: 'destructive',
  VOIDED: 'outline',
}

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ order_id?: string }>
}) {
  const { locale } = await params
  const { order_id } = await searchParams
  const t = await getTranslations({ locale, namespace: 'orderConfirmation' })

  const user = await currentUser()
  if (!user) {
    redirect(`/${locale}/login` as never)
  }
  const userEmail = user.emailAddresses[0]?.emailAddress ?? ''

  let order: ConfirmationOrder | null = null
  let apiError = false

  try {
    if (order_id) {
      order = await getOrderById(order_id)
      if (order && order.email.toLowerCase() !== userEmail.toLowerCase()) {
        order = null
      }
    } else {
      const recentOrders = await getOrdersByEmail(userEmail)
      const latest = recentOrders[0]
      if (latest) {
        order = await getOrderById(latest.id)
      }
    }
  } catch (err) {
    console.error('[order-confirmation] Admin API error:', err)
    apiError = true
  }

  if (apiError || !order) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-24 text-center">
        <CartClearer />
        <CheckCircle className="size-12 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
        <p className="text-muted-foreground mb-8">
          {apiError
            ? 'Your order was placed successfully. Order details will be available shortly.'
            : 'Your order is being processed and will appear here soon.'}
        </p>
        <Link href={`/${locale}/bookings`}>
          <Button>{t('myBookings')}</Button>
        </Link>
      </div>
    )
  }

  const normalizedStatus = order.financialStatus.toUpperCase().replace(/ /g, '_')
  const statusLabels: Record<string, string> = {
    PAID: t('status.paid'),
    AUTHORIZED: t('status.pending'),
    PENDING: t('status.pending'),
    PARTIALLY_PAID: t('status.pending'),
    REFUNDED: t('status.refunded'),
    PARTIALLY_REFUNDED: t('status.refunded'),
    VOIDED: t('status.other'),
  }
  const statusLabel = statusLabels[normalizedStatus] ?? t('status.other')

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <CartClearer />
      {/* Success header */}
      <div className="flex flex-col items-center text-center mb-8">
        <CheckCircle className="size-12 text-green-500 mb-3" />
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('orderNumber')} {order.name}
        </p>
      </div>

      {/* Trip summary card */}
      <div className="rounded-xl border bg-card p-6 space-y-5 mb-4">
        <h2 className="font-semibold">{t('itinerarySummary')}</h2>
        {order.lineItems.map((item, i) => {
          const departureDate = item.customAttributes.find((a) => a.key === 'Departure Date')?.value
          const unitAmount = parseFloat(item.unitPrice.amount)
          const subtotal = (unitAmount * item.quantity).toFixed(2)
          return (
            <div key={i} className="text-sm space-y-1">
              <p className="font-medium">{item.title}</p>
              {departureDate && (
                <p className="text-muted-foreground">
                  {t('departureDate')}：{departureDate}
                </p>
              )}
              {item.variantTitle && (
                <p className="text-muted-foreground">
                  {t('partySize')}：{item.variantTitle}
                </p>
              )}
              <p className="text-muted-foreground">
                {t('pricePerPerson')}：{item.unitPrice.currencyCode}{' '}
                {unitAmount.toFixed(0)} × {item.quantity}
              </p>
              <p className="font-medium">
                {t('subtotal')}：{item.unitPrice.currencyCode} {subtotal}
              </p>
            </div>
          )
        })}
        <Separator />
        <div className="flex justify-between font-bold">
          <span>{t('total')}</span>
          <span>
            {order.total.currencyCode} {parseFloat(order.total.amount).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Status + email card */}
      <div className="rounded-xl border bg-card p-6 space-y-3 mb-8">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">{t('orderStatus')}</span>
          <Badge variant={STATUS_VARIANTS[normalizedStatus] ?? 'outline'}>
            {statusLabel}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('emailSentTo')}{' '}
          <span className="text-foreground">{order.email}</span>
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href={`/${locale}/tours`} className="flex-1">
          <Button variant="outline" className="w-full">
            {t('continueBrowsing')}
          </Button>
        </Link>
        <Link href={`/${locale}/bookings`} className="flex-1">
          <Button className="w-full">{t('myBookings')}</Button>
        </Link>
      </div>
    </div>
  )
}
