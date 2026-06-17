import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | GlobalTours',
    default: 'GlobalTours',
  },
  description: 'Professional tour services for global travelers',
  openGraph: {
    siteName: 'GlobalTours',
    type: 'website',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  return (
    <html lang={locale}>
      <body className="flex min-h-screen flex-col">
        {children}
      </body>
    </html>
  )
}
