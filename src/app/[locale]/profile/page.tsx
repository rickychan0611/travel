import { currentUser } from '@clerk/nextjs/server'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata, Route } from 'next'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft, CalendarDays, Link2, ReceiptText, WalletCards } from 'lucide-react'
import { CustomerProfileForm } from '@/components/bookings/CustomerProfileForm'
import { getOrdersByEmail, type Order } from '@/lib/shopify/orders'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'profile' })
  return { title: t('title') }
}

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'profile' })
  const user = await currentUser()
  if (!user) redirect(`/${locale}/login` as Route)

  const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? ''
  let orders: Order[] = []
  let shopifyUnavailable = false
  try {
    orders = await getOrdersByEmail(email)
  } catch (error) {
    console.error('[profile] Failed to load Shopify orders:', error)
    shopifyUnavailable = true
  }

  const firstName = user.firstName ?? ''
  const lastName = user.lastName ?? ''
  const displayName = user.fullName || email
  const currencies = [...new Set(orders.map((order) => order.total.currencyCode))]
  const totalSpent = currencies.length === 1
    ? orders.reduce((sum, order) => sum + Number(order.total.amount), 0)
    : null
  const formattedSpent = totalSpent !== null && currencies[0]
    ? new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencies[0],
      }).format(totalSpent)
    : '—'
  const joined = user.createdAt
    ? new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(user.createdAt))
    : '—'
  const phone = typeof user.privateMetadata.customerPhone === 'string' ? user.privateMetadata.customerPhone : ''

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

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-lg bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-7 flex items-center gap-4 border-b border-[#eee] pb-6">
              <Image
                src={user.imageUrl || '/tff/user/avatar.png'}
                alt={displayName}
                width={72}
                height={72}
                className="h-[72px] w-[72px] rounded-full object-cover"
              />
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-[#242424]">{t('title')}</h1>
                <p className="mt-1 truncate text-sm text-[#777]">{displayName}</p>
              </div>
            </div>

            <h2 className="mb-1 text-lg font-bold text-[#242424]">{t('personalInformation')}</h2>
            <p className="mb-6 text-sm leading-6 text-[#777]">{t('identityNote')}</p>
            <CustomerProfileForm
              locale={locale}
              firstName={firstName}
              lastName={lastName}
              email={email}
              phone={phone}
            />
          </section>

          <aside className="space-y-5">
            <section className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-[#242424]">{t('travelAccount')}</h2>
              <p className="mt-1 text-xs leading-5 text-[#888]">
                {shopifyUnavailable ? t('shopifyUnavailable') : t('linkedAccount')}
              </p>
              <dl className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-md bg-[#f6faff] p-3">
                  <ReceiptText className="mb-2 h-5 w-5 text-[#0090f2]" />
                  <dt className="text-xs text-[#777]">{t('totalOrders')}</dt>
                  <dd className="mt-1 text-xl font-bold text-[#242424]">{orders.length}</dd>
                </div>
                <div className="rounded-md bg-[#fff8f1] p-3">
                  <WalletCards className="mb-2 h-5 w-5 text-[#f59f00]" />
                  <dt className="text-xs text-[#777]">{t('totalSpent')}</dt>
                  <dd className="mt-1 truncate text-base font-bold text-[#242424]">{formattedSpent}</dd>
                </div>
              </dl>
              <div className="mt-4 flex items-start gap-3 border-t border-[#eee] pt-4">
                <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-[#0090f2]" />
                <div>
                  <p className="text-xs text-[#777]">{t('customerSince')}</p>
                  <p className="mt-0.5 text-sm font-medium text-[#333]">{joined}</p>
                </div>
              </div>
            </section>

            <section className="rounded-lg bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-[#0090f2]" />
                <h2 className="text-lg font-bold text-[#242424]">{t('dataConnection')}</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#666]">{t('dataConnectionText')}</p>
              <p className="mt-4 border-t border-[#eee] pt-4 text-xs leading-5 text-[#999]">{t('piiNotice')}</p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
