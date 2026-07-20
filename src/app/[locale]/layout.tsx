import { StatusBar } from '@/components/layout/StatusBar'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'

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
  const messages = await getMessages()
  return (
    <NextIntlClientProvider messages={messages}>
      <StatusBar locale={locale} />
      <Header locale={locale} />
      <main className="flex-1 bg-white">{children}</main>
      <Footer locale={locale} />
      {/* Floating contact sidebar is intentionally hidden. */}
    </NextIntlClientProvider>
  )
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}
