'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { Show } from '@clerk/nextjs'
import type { Route } from 'next'
import { ChevronDown } from 'lucide-react'
import { routing } from '@/i18n/routing'
import { CartIcon } from './CartIcon'
import { CurrencySwitcher } from './CurrencySwitcher'

const LOCALE_LABELS: Record<string, string> = {
  en: 'English',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
}

export function StatusBar({ locale }: { locale: string }) {
  const t = useTranslations('nav')
  const ts = useTranslations('statusBar')
  const currentLocale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  function switchLocale(next: string) {
    const segments = pathname.split('/')
    segments[1] = next
    router.push(segments.join('/') as Route)
  }

  return (
    <div className="hidden w-full border-b border-[#eee] bg-[#f7f7f7] text-xs text-[#999] md:block">
      <div className="mx-auto flex h-[32px] max-w-[1200px] items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Show when="signed-out">
            <Link href={`/${locale}/login` as Route} className="text-tff-orange hover:underline">
              {t('login')}
            </Link>
            <span className="text-[#ddd]">|</span>
            <Link href={`/${locale}/login` as Route} className="text-tff-orange hover:underline">
              {t('register')}
            </Link>
          </Show>
          <Show when="signed-in">
            <Link href={`/${locale}/bookings` as Route} className="text-tff-orange hover:underline">
              {t('myBookings')}
            </Link>
          </Show>
        </div>

        <div className="flex items-center gap-4 text-[#666]">
          <label className="relative inline-flex cursor-pointer items-center gap-0.5 hover:text-tff-orange">
            <span>{ts('language')}</span>
            <ChevronDown className="h-3 w-3" />
            <select
              value={currentLocale}
              onChange={(e) => switchLocale(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label={ts('languageAria')}
            >
              {routing.locales.map((l) => (
                <option key={l} value={l}>
                  {LOCALE_LABELS[l] ?? l}
                </option>
              ))}
            </select>
          </label>

          <CurrencySwitcher className="max-w-52 text-xs" />

          <div className="scale-90">
            <CartIcon locale={locale} />
          </div>
        </div>
      </div>
    </div>
  )
}
