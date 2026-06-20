'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Show, UserButton } from '@clerk/nextjs'
import type { Route } from 'next'
import { useUIStore } from '@/store/ui'
import { LocaleSwitcher } from './LocaleSwitcher'
import { CurrencySwitcher } from './CurrencySwitcher'
import { Button } from '@/components/ui/button'

export function MobileMenu({ locale }: { locale: string }) {
  const open = useUIStore((s) => s.mobileMenuOpen)
  const setOpen = useUIStore((s) => s.setMobileMenuOpen)
  const pathname = usePathname()
  const t = useTranslations('nav')

  useEffect(() => {
    setOpen(false)
  }, [pathname, setOpen])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Slide panel */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-background shadow-xl flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!open}
      >
        <div className="flex flex-col gap-1 p-6 flex-1 overflow-y-auto">
          {/* Nav links */}
          <nav className="flex flex-col gap-1 mb-6">
            <Link
              href={`/${locale}/tours` as Route}
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
            >
              {t('tours')}
            </Link>
            <Link
              href={`/${locale}/about` as Route}
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
            >
              {t('about')}
            </Link>
          </nav>

          <div className="h-px bg-border mb-4" />

          {/* Locale + currency */}
          <div className="flex items-center gap-3 mb-6">
            <LocaleSwitcher />
            <CurrencySwitcher />
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col gap-2 mt-auto">
            <Show when="signed-out">
              <Link href={`/${locale}/login` as Route} className="w-full">
                <Button variant="outline" className="w-full">{t('login')}</Button>
              </Link>
            </Show>
            <Show when="signed-in">
              <Link href={`/${locale}/bookings` as Route} className="w-full">
                <Button variant="ghost" className="w-full">{t('myBookings')}</Button>
              </Link>
              <Link href={`/${locale}/agent` as Route} className="w-full">
                <Button variant="outline" className="w-full">{t('agentPortal')}</Button>
              </Link>
              <div className="flex items-center gap-3 pt-2 px-1">
                <UserButton />
              </div>
            </Show>
          </div>
        </div>
      </div>
    </>
  )
}
