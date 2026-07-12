'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { Order } from '@/lib/shopify/orders'

type OrderTab = 'all' | 'pendingPayment' | 'pendingTravel' | 'pendingReview'

type Props = {
  locale: string
  orders: Order[]
  error: string | null
  userName: string
  avatarUrl: string | null
  labels: {
    editProfile: string
    orders: string
    membership: string
    favorites: string
    notices: string
    reviews: string
    settings: string
    tabAll: string
    tabPendingPayment: string
    tabPendingTravel: string
    tabPendingReview: string
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

const NAV_ITEMS = [
  { id: 'orders', icon: '/tff/user/orders.png', activeIcon: '/tff/user/orders-active.png', labelKey: 'orders' as const },
  { id: 'membership', icon: '/tff/user/members.png', labelKey: 'membership' as const },
  { id: 'favorites', icon: '/tff/user/collections.png', labelKey: 'favorites' as const },
  { id: 'notices', icon: '/tff/user/notices.png', labelKey: 'notices' as const },
  { id: 'reviews', icon: '/tff/user/judges.png', labelKey: 'reviews' as const },
  { id: 'settings', icon: '/tff/user/installs.png', labelKey: 'settings' as const, hasSubmenu: true },
] as const

const STATUS_COLORS: Record<string, string> = {
  PAID: 'bg-[#e8f8ef] text-[#1a9d5c]',
  PENDING: 'bg-[#fff4e5] text-[#d97706]',
  REFUNDED: 'bg-[#f3f3f3] text-[#666]',
  PARTIALLY_REFUNDED: 'bg-[#fff0e8] text-[#e85d04]',
  VOIDED: 'bg-[#fdecec] text-[#d32f2f]',
}

function matchesTab(order: Order, tab: OrderTab) {
  if (tab === 'all') return true
  if (tab === 'pendingPayment') return order.financialStatus === 'PENDING'
  if (tab === 'pendingTravel') {
    return order.financialStatus === 'PAID' && order.fulfillmentStatus !== 'FULFILLED'
  }
  if (tab === 'pendingReview') return order.fulfillmentStatus === 'FULFILLED'
  return true
}

export function UserBookingsPage({
  locale,
  orders,
  error,
  userName,
  avatarUrl,
  labels,
}: Props) {
  const [activeTab, setActiveTab] = useState<OrderTab>('all')
  const [activeNav] = useState('orders')

  const counts = useMemo(
    () => ({
      all: orders.length,
      pendingPayment: orders.filter((order) => matchesTab(order, 'pendingPayment')).length,
      pendingTravel: orders.filter((order) => matchesTab(order, 'pendingTravel')).length,
      pendingReview: orders.filter((order) => matchesTab(order, 'pendingReview')).length,
    }),
    [orders],
  )

  const filteredOrders = useMemo(
    () => orders.filter((order) => matchesTab(order, activeTab)),
    [orders, activeTab],
  )

  const statusLabels: Record<string, string> = {
    PAID: labels.paid,
    PENDING: labels.pending,
    REFUNDED: labels.refunded,
    PARTIALLY_REFUNDED: labels.partiallyRefunded,
    VOIDED: labels.voided,
  }

  const tabs: Array<{ id: OrderTab; label: string; count: number }> = [
    { id: 'all', label: labels.tabAll, count: counts.all },
    { id: 'pendingPayment', label: labels.tabPendingPayment, count: counts.pendingPayment },
    { id: 'pendingTravel', label: labels.tabPendingTravel, count: counts.pendingTravel },
    { id: 'pendingReview', label: labels.tabPendingReview, count: counts.pendingReview },
  ]

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
              <button
                type="button"
                className="inline-flex items-center gap-0.5 text-[14px] text-[#0090f2] hover:underline"
              >
                {labels.editProfile}
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <nav className="border-t border-[#f0f0f0] py-2.5">
              {NAV_ITEMS.map((item) => {
                const active = activeNav === item.id
                const label = labels[item.labelKey]
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`flex h-[52px] w-full items-center px-5 text-left text-[16px] font-bold ${
                      active ? 'bg-[#ecf5ff] text-[#0090f2]' : 'text-[#242424]'
                    }`}
                  >
                    <Image
                      src={active && 'activeIcon' in item && item.activeIcon ? item.activeIcon : item.icon}
                      alt=""
                      width={24}
                      height={24}
                      className="h-6 w-6"
                    />
                    <span className="ml-2.5 flex-1">{label}</span>
                    {'hasSubmenu' in item && item.hasSubmenu ? (
                      <ChevronDown className="h-4 w-4 text-[#999]" />
                    ) : null}
                  </button>
                )
              })}
            </nav>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="mb-2.5 flex h-[54px] items-center rounded-[6px] bg-white">
            {tabs.map((tab, index) => (
              <div key={tab.id} className="flex h-full flex-1 items-center">
                {index > 0 ? <div className="h-4 w-px bg-[#dcdfe6]" /> : null}
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative h-full flex-1 text-center text-[16px] font-bold ${
                    activeTab === tab.id ? 'text-[#0090f2]' : 'text-[#242424]'
                  }`}
                >
                  {tab.label}({tab.count})
                  {activeTab === tab.id ? (
                    <span className="absolute bottom-0 left-1/2 h-[3px] w-[108px] -translate-x-1/2 bg-[#0090f2]" />
                  ) : null}
                </button>
              </div>
            ))}
          </div>

          <div className="min-h-[602px] overflow-hidden rounded-[6px] bg-white">
            {error ? (
              <div className="flex min-h-[602px] items-center justify-center px-6 text-center text-[14px] text-[#d32f2f]">
                {error || labels.errorLoading}
              </div>
            ) : filteredOrders.length === 0 ? (
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
                {filteredOrders.map((order) => (
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
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-[13px] text-[#0090f2]">{labels.viewOrder}</p>
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
