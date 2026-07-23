import { StatusBar } from '@/components/layout/StatusBar'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { getLandingPageContent } from '@/lib/admin/homepage-admin'
import { DEFAULT_HEADER_LOGO_PATH } from '@/lib/homepage/types'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    notFound()
  }
  const [messages, landing] = await Promise.all([
    getMessages(),
    getLandingPageContent(locale).catch(() => null),
  ])
  const logoUrl = landing?.headerLogo?.url || DEFAULT_HEADER_LOGO_PATH
  return (
    <NextIntlClientProvider messages={messages}>
      <StatusBar locale={locale} />
      <Header locale={locale} logoUrl={logoUrl} hotlineLines={landing?.hotlineLines} />
      <main className="flex-1 bg-white">{children}</main>
      <Footer locale={locale} />
      {/* Floating contact sidebar is intentionally hidden. */}
    </NextIntlClientProvider>
  )
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}
