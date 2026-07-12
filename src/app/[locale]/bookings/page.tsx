import { currentUser } from '@clerk/nextjs/server'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { getOrdersByEmail } from '@/lib/shopify/orders'
import { UserBookingsPage } from '@/components/bookings/UserBookingsPage'
import type { Order } from '@/lib/shopify/orders'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'bookings' })
  return { title: t('title') }
}

export default async function BookingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'bookings' })
  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress

  let orders: Order[] = []
  let error: string | null = null

  if (email) {
    try {
      orders = await getOrdersByEmail(email)
    } catch {
      error = t('errorLoading')
    }
  }

  const userName =
    user?.fullName ||
    user?.username ||
    user?.firstName ||
    (locale.startsWith('zh') ? '途风用户' : 'TFF User')

  return (
    <UserBookingsPage
      locale={locale}
      orders={orders}
      error={error}
      userName={userName}
      avatarUrl={user?.imageUrl ?? null}
      labels={{
        editProfile: t('editProfile'),
        orders: t('navOrders'),
        membership: t('membership'),
        favorites: t('favorites'),
        notices: t('notices'),
        reviews: t('reviews'),
        settings: t('settings'),
        tabAll: t('tabAll'),
        tabPendingPayment: t('tabPendingPayment'),
        tabPendingTravel: t('tabPendingTravel'),
        tabPendingReview: t('tabPendingReview'),
        empty: t('empty'),
        emptyHint: t('emptyHint'),
        paid: t('paid'),
        pending: t('pending'),
        refunded: t('refunded'),
        partiallyRefunded: t('partiallyRefunded'),
        voided: t('voided'),
        errorLoading: t('errorLoading'),
        viewOrder: t('viewOrder'),
      }}
    />
  )
}
