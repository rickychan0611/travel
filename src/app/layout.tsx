import { getLocale } from 'next-intl/server'
import './globals.css'

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
