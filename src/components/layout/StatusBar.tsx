'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTranslations, useLocale } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { Show } from '@clerk/nextjs'
import type { Route } from 'next'
import { ChevronDown, Smartphone } from 'lucide-react'
import { routing } from '@/i18n/routing'
import { useUIStore } from '@/store/ui'
import { CartIcon } from './CartIcon'

const CURRENCIES = [
  { code: 'USD', label: '$ 美元' },
  { code: 'CAD', label: 'C$ 加元' },
  { code: 'CNY', label: '¥ 人民币' },
  { code: 'EUR', label: '€ 欧元' },
  { code: 'AUD', label: 'A$ 澳元' },
  { code: 'HKD', label: 'HK$ 港币' },
]

export function StatusBar({ locale }: { locale: string }) {
  const t = useTranslations('nav')
  const th = useTranslations('home')
  const currentLocale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const { currency, setCurrency } = useUIStore()
  const currencyLabel = CURRENCIES.find((c) => c.code === currency)?.label ?? '$ 美元'

  function switchLocale(next: string) {
    const segments = pathname.split('/')
    segments[1] = next
    router.push(segments.join('/') as Route)
  }

  return (
    <div className="hidden w-full border-b border-[#eee] bg-[#f7f7f7] text-xs text-[#999] md:block">
      <div className="mx-auto flex h-[32px] max-w-[1200px] items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span>{th('welcome')}</span>
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
          <Link
            href={`/${locale}/about` as Route}
            className="inline-flex items-center gap-1 text-tff-orange hover:opacity-80"
          >
            <Image src="/tff/invite-orange.png" alt="" width={14} height={14} className="h-3.5 w-3.5" />
            {th('invite')}
          </Link>

          <label className="relative inline-flex cursor-pointer items-center gap-0.5 hover:text-tff-orange">
            <span>语言</span>
            <ChevronDown className="h-3 w-3" />
            <select
              value={currentLocale}
              onChange={(e) => switchLocale(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Language"
            >
              {routing.locales.map((l) => (
                <option key={l} value={l}>
                  {l === 'zh-CN' ? '简体中文' : l === 'zh-TW' ? '繁體中文' : 'English'}
                </option>
              ))}
            </select>
          </label>

          <label className="relative inline-flex cursor-pointer items-center gap-0.5 hover:text-tff-orange">
            <span>{currencyLabel}</span>
            <ChevronDown className="h-3 w-3" />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Currency"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="inline-flex items-center gap-1 text-tff-orange hover:opacity-80"
            aria-label="APP"
          >
            <Smartphone className="h-3.5 w-3.5" />
            APP
          </button>

          <div className="scale-90">
            <CartIcon locale={locale} />
          </div>
        </div>
      </div>
    </div>
  )
}
