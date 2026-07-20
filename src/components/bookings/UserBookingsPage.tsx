import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import { ChevronRight } from 'lucide-react'
import type { Order } from '@/lib/shopify/orders'

type Props = {
  locale: string
  orders: Order[]
  error: string | null
  userName: string
  avatarUrl: string | null
  labels: {
    editProfile: string
    empty: string
    emptyHint: string
    paid: string
    pending: string
    refunded: string
    partiallyRefunded: string
    voided: string
    errorLoading: string
    viewOrder: string
  }
}

const STATUS_COLORS: Record<string, string> = {
  PAID: 'bg-[#e8f8ef] text-[#1a9d5c]',
  PENDING: 'bg-[#fff4e5] text-[#d97706]',
  REFUNDED: 'bg-[#f3f3f3] text-[#666]',
  PARTIALLY_REFUNDED: 'bg-[#fff0e8] text-[#e85d04]',
  VOIDED: 'bg-[#fdecec] text-[#d32f2f]',
}

export function UserBookingsPage({
  locale,
  orders,
  error,
  userName,
  avatarUrl,
  labels,
}: Props) {
  const statusLabels: Record<string, string> = {
    PAID: labels.paid,
    PENDING: labels.pending,
    REFUNDED: labels.refunded,
    PARTIALLY_REFUNDED: labels.partiallyRefunded,
    VOIDED: labels.voided,
  }

  return (
    <div className="bg-[#f2f2f2] pb-10 pt-5">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 px-3 lg:flex-row lg:gap-5">
        <aside className="w-full shrink-0 lg:w-[274px]">
          <div className="overflow-hidden rounded-[6px] bg-white">
            <div className="px-5 pb-4 pt-10 text-center">
              <div className="relative mx-auto h-[86px] w-[86px]">
                <Image
                  src={avatarUrl || '/tff/user/avatar.png'}
                  alt={userName}
                  width={86}
                  height={86}
                  className="h-[86px] w-[86px] rounded-full object-cover"
                />
                <Image
                  src="/tff/user/mine-member.png"
                  alt=""
                  width={36}
                  height={36}
                  className="absolute bottom-0 right-0 h-9 w-9"
                />
              </div>
              <h2 className="mt-2.5 truncate text-[16px] font-bold leading-[30px] text-[#242424]">{userName}</h2>
              <Link
                href={`/${locale}/profile` as Route}
                className="inline-flex items-center gap-0.5 text-[14px] text-[#0090f2] hover:underline"
              >
                {labels.editProfile}
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="min-h-[602px] overflow-hidden rounded-[6px] bg-white">
            {error ? (
              <div className="flex min-h-[602px] items-center justify-center px-6 text-center text-[14px] text-[#d32f2f]">
                {error || labels.errorLoading}
              </div>
            ) : orders.length === 0 ? (
              <div className="flex min-h-[602px] flex-col items-center justify-center px-6 text-center">
                <Image
                  src="/tff/user/order-empty.png"
                  alt=""
                  width={282}
                  height={281}
                  className="h-[281px] w-[282px] object-contain"
                />
                <h3 className="text-[16px] font-extrabold text-[#212121]">{labels.empty}</h3>
                <p className="mt-2.5 text-[14px] font-medium text-[#ababab]">{labels.emptyHint}</p>
              </div>
            ) : (
              <ul className="divide-y divide-[#eee] p-5">
                {orders.map((order) => (
                  <li key={order.id} className="py-5 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[15px] font-bold text-[#242424]">{order.name}</p>
                        <p className="mt-1 text-[13px] text-[#999]">
                          {new Intl.DateTimeFormat(locale, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          }).format(new Date(order.createdAt))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[15px] font-bold text-[#242424]">
                          {new Intl.NumberFormat(locale, {
                            style: 'currency',
                            currency: order.total.currencyCode,
                          }).format(parseFloat(order.total.amount))}
                        </p>
                        <span
                          className={`mt-1 inline-block rounded px-2 py-0.5 text-[12px] font-medium ${
                            STATUS_COLORS[order.financialStatus] ?? 'bg-[#f3f3f3] text-[#666]'
                          }`}
                        >
                          {statusLabels[order.financialStatus] ?? order.financialStatus}
                        </span>
                      </div>
                    </div>
                    <ul className="mt-3 space-y-1">
                      {order.lineItems.map((item, index) => (
                        <li key={`${order.id}-${index}`} className="text-[13px] text-[#666]">
                          {item.title}
                          {item.variantTitle ? ` · ${item.variantTitle}` : ''}
                          {item.quantity > 1 ? ` ×${item.quantity}` : ''}
                          {item.customAttributes?.filter((attr) => ['Room', 'Occupants', 'Departure Date'].includes(attr.key)).map((attr) => ` · ${attr.key}: ${attr.value}`).join('')}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/${locale}/bookings/${order.id.split('/').pop() ?? order.id}` as Route}
                      className="mt-3 inline-flex text-[13px] font-medium text-[#0090f2] hover:underline"
                    >
                      {labels.viewOrder}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
