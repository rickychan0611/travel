'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Show, UserButton } from '@clerk/nextjs'
import type { Route } from 'next'
import { useUIStore } from '@/store/ui'
import { LocaleSwitcher } from './LocaleSwitcher'
import { CurrencySwitcher } from './CurrencySwitcher'
import { Button } from '@/components/ui/button'
import { MEGA_NAV } from '@/data/home-mock'

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
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!open}
      >
        <div className="flex flex-col gap-1 p-5 flex-1 overflow-y-auto">
          <Link href={`/${locale}` as Route} className="mb-3 block">
            <Image src="/tff/header-logo.png" alt="途风" width={110} height={28} className="h-7 w-auto" />
          </Link>

          <nav className="mb-4 flex flex-col gap-0.5">
            {MEGA_NAV.map((item) => {
              const href = item.href
                ? (`/${locale}${item.href === '/' ? '' : item.href}` as Route)
                : (`/${locale}/tours` as Route)
              return (
                <Link
                  key={item.id}
                  href={href}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[#303133] hover:bg-[#f5f5f5] hover:text-tff-blue"
                >
                  {item.label}
                  {item.hot ? (
                    <span className="rounded bg-tff-orange px-1 text-[10px] font-bold text-white">HOT</span>
                  ) : null}
                </Link>
              )
            })}
            <Link
              href={`/${locale}/about` as Route}
              className="rounded-md px-3 py-2 text-sm font-medium text-[#303133] hover:bg-[#f5f5f5] hover:text-tff-blue"
            >
              {t('about')}
            </Link>
          </nav>

          <div className="mb-4 h-px bg-[#e8e8e8]" />

          <div className="mb-6 flex items-center gap-3 px-1 text-[#606266]">
            <LocaleSwitcher />
            <CurrencySwitcher />
          </div>

          <div className="mt-auto flex flex-col gap-2">
            <Show when="signed-out">
              <Link href={`/${locale}/login` as Route} className="w-full">
                <Button variant="outline" className="w-full border-tff-blue text-tff-blue">
                  {t('login')}
                </Button>
              </Link>
            </Show>
            <Show when="signed-in">
              <Link href={`/${locale}/bookings` as Route} className="w-full">
                <Button variant="ghost" className="w-full">{t('myBookings')}</Button>
              </Link>
              <Link href={`/${locale}/agent` as Route} className="w-full">
                <Button variant="outline" className="w-full">{t('agentPortal')}</Button>
              </Link>
              <div className="flex items-center gap-3 px-1 pt-2">
                <UserButton />
              </div>
            </Show>
          </div>
        </div>
      </div>
    </>
  )
}
