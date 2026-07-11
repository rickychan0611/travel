import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | 途风 ToursForFun',
    default: '途风 ToursForFun',
  },
  description: '途风（携程旗下）全球旅游度假预订平台',
  openGraph: {
    siteName: '途风 ToursForFun',
    type: 'website',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  return (
    <ClerkProvider>
      <html lang={locale}>
        <body className="flex min-h-screen flex-col">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
