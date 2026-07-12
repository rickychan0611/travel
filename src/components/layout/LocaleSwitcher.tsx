'use client'
import { useLocale } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import type { Route } from 'next'
import { routing } from '@/i18n/routing'

const LOCALE_LABELS: Record<string, string> = {
  'zh-CN': '简体中文',
  'en': 'English',
  'zh-TW': '繁體中文',
}

export function LocaleSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  function switchLocale(next: string) {
    const segments = pathname.split('/')
    segments[1] = next
    router.push(segments.join('/') as Route)
  }

  return (
    <select
      value={locale}
      onChange={(e) => switchLocale(e.target.value)}
      className="max-w-18 cursor-pointer appearance-none bg-transparent text-sm text-[#666] outline-none hover:text-tff-orange"
      aria-label="Language"
      title={LOCALE_LABELS[locale]}
    >
      {routing.locales.map((l) => (
        <option key={l} value={l}>{LOCALE_LABELS[l]}</option>
      ))}
    </select>
  )
}
