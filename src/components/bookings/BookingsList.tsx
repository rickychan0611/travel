import { getTranslations } from 'next-intl/server'
import type { Order } from '@/lib/shopify/orders'

const FINANCIAL_STATUS_COLORS: Record<string, string> = {
  PAID: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  REFUNDED: 'bg-gray-100 text-gray-600',
  PARTIALLY_REFUNDED: 'bg-orange-100 text-orange-700',
  VOIDED: 'bg-red-100 text-red-700',
}

export async function BookingsList({
  orders,
  error,
  locale,
}: {
  orders: Order[]
  error: string | null
  locale: string
}) {
  const t = await getTranslations({ locale, namespace: 'bookings' })

  const statusLabels: Record<string, string> = {
    PAID: t('paid'),
    PENDING: t('pending'),
    REFUNDED: t('refunded'),
    PARTIALLY_REFUNDED: t('partiallyRefunded'),
    VOIDED: t('voided'),
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium mb-2">{t('empty')}</p>
        <p className="text-sm text-muted-foreground">{t('emptyHint')}</p>
      </div>
    )
  }

  return (
    <ul className="space-y-4">
      {orders.map((order) => (
        <li key={order.id} className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <p className="font-semibold text-sm">{order.name}</p>
              <p className="text-xs text-muted-foreground">
                {new Intl.DateTimeFormat(locale, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                }).format(new Date(order.createdAt))}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-sm">
                {new Intl.NumberFormat(locale, {
                  style: 'currency',
                  currency: order.total.currencyCode,
                }).format(parseFloat(order.total.amount))}
              </p>
              <span
                className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  FINANCIAL_STATUS_COLORS[order.financialStatus] ?? 'bg-gray-100 text-gray-600'
                }`}
              >
                {statusLabels[order.financialStatus] ?? order.financialStatus}
              </span>
            </div>
          </div>

          <ul className="space-y-1 mb-4">
            {order.lineItems.map((item, i) => (
              <li key={i} className="text-sm text-muted-foreground">
                {item.title}
                {item.variantTitle && ` · ${item.variantTitle}`}
                {item.quantity > 1 && ` ×${item.quantity}`}
              </li>
            ))}
          </ul>

          <a
            href={order.statusUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            {t('viewOrder')} →
          </a>
        </li>
      ))}
    </ul>
  )
}
