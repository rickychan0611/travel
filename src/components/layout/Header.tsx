'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { Route } from 'next'
import { Search } from 'lucide-react'
import { CartIcon } from './CartIcon'
import { MobileMenu } from './MobileMenu'
import { MobileMenuButton } from './MobileMenuButton'
import { MegaNav } from './MegaNav'
import { HOT_SEARCH_TAGS, PHONE_LINES } from '@/data/home-mock'

export function Header({ locale }: { locale: string }) {
  const th = useTranslations('home')
  const router = useRouter()
  const [query, setQuery] = useState('')

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    const path = q
      ? `/${locale}/tours?q=${encodeURIComponent(q)}`
      : `/${locale}/tours`
    router.push(path as Route)
  }

  return (
    <>
      <header className="relative z-50 w-full bg-white">
        {/* Main header row — matches old ToursForFun chrome */}
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-5 px-4 py-3">
          {/* Logo */}
          <Link href={`/${locale}` as Route} className="shrink-0">
            <Image
              src="/tff/header-logo.png"
              alt="Tours4fun 途风旅游"
              width={160}
              height={60}
              className="h-[60px] w-auto"
              priority
            />
          </Link>

          {/* Search + hot tags */}
          <div className="hidden w-[651px] min-w-0 md:block">
            <form onSubmit={onSearch} className="w-full max-w-[520px]">
              <div className="flex h-10 overflow-hidden rounded-sm border-2 border-[#ff8a00]">
                <div className="flex min-w-0 flex-1 items-center gap-2 bg-white px-3">
                  <Search className="h-4 w-4 shrink-0 text-[#c0c4cc]" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="目的地/景点/旅游/门票/签证等"
                    className="h-full min-w-0 flex-1 bg-transparent text-sm text-[#303133] outline-none placeholder:text-[#c0c4cc]"
                  />
                </div>
                <button
                  type="submit"
                  className="h-full shrink-0 bg-[#ff8a00] px-5 text-sm font-medium text-white hover:brightness-95"
                >
                  搜索
                </button>
              </div>
            </form>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-sm">
              <span className="text-[#666]">{th('hotRecommend')}</span>
              {HOT_SEARCH_TAGS.map((tag) => (
                <Link
                  key={tag}
                  href={`/${locale}/tours?q=${encodeURIComponent(tag)}` as Route}
                  className="text-tff-blue hover:underline"
                >
                  {tag}
                </Link>
              ))}
              <Link href={`/${locale}/tours` as Route} className="text-tff-blue hover:underline">
                {th('more')}
              </Link>
            </div>
          </div>

          {/* Mobile search */}
          <form onSubmit={onSearch} className="min-w-0 flex-1 md:hidden">
            <div className="flex h-9 overflow-hidden rounded-sm border-2 border-[#ff8a00]">
              <div className="flex min-w-0 flex-1 items-center gap-1.5 bg-white px-2">
                <Search className="h-3.5 w-3.5 shrink-0 text-[#c0c4cc]" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="目的地/景点/旅游..."
                  className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </div>
              <button type="submit" className="bg-[#ff8a00] px-3 text-sm text-white">
                搜索
              </button>
            </div>
          </form>

          {/* Phone lines — two columns, centered */}
          <div className="hidden shrink-0 text-center text-sm leading-[1.55] text-[#666] lg:block">
            <div className="mt-0.5 grid grid-flow-col grid-rows-3 gap-x-4">
              {PHONE_LINES.map((p) => (
                <p key={p.region}>
                  {p.region} {p.number}
                </p>
              ))}
            </div>
          </div>

          {/* Consultant bunny CTA */}
          <Link
            href={`/${locale}/about` as Route}
            className="hidden shrink-0 xl:block w-[80px]"
            aria-label="点我添加行程顾问"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- animated GIF */}
            <img
              src="/tff/ads.gif"
              alt="点我添加行程顾问"
              width={80}
              height={104}
              className="h-[104px] w-[80px] object-contain"
            />
          </Link>

          {/* Mobile actions */}
          <div className="flex items-center gap-2 md:hidden">
            <CartIcon locale={locale} />
            <MobileMenuButton />
          </div>
        </div>

        <MegaNav locale={locale} />
      </header>
      <MobileMenu locale={locale} />
    </>
  )
}
