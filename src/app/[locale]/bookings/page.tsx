import { currentUser } from '@clerk/nextjs/server'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { getOrdersByEmail } from '@/lib/shopify/orders'
import { BookingsList } from '@/components/bookings/BookingsList'
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

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-8">{t('title')}</h1>
      <BookingsList orders={orders} error={error} locale={locale} />
    </div>
  )
}
