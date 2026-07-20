'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { MEGA_NAV } from '@/data/home-mock'
import { MapPin } from 'lucide-react'
import { getLocalizedText } from '@/data/tour-categories'
import { catalogKeywordHref } from '@/lib/catalog-keywords'

export function MegaNav({ locale }: { locale: string }) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <nav
      className="relative z-40 w-full bg-tff-blue"
      onMouseLeave={() => setOpenId(null)}
    >
      <div className="mx-auto flex h-11 max-w-full items-stretch overflow-x-auto overflow-y-visible xl:max-w-[1200px] xl:overflow-visible">
        {/* 热门目的地 — left trigger aligned with hero overlay */}
        <div className="relative hidden w-[230px] shrink-0 md:block">
          <div className="flex h-full w-full items-center justify-center gap-1.5 bg-[#1a6fb5] px-4 text-sm font-semibold text-white">
            <MapPin className="h-4 w-4" />
            热门目的地
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-stretch px-1">
          {MEGA_NAV.map((item) => {
            const label = getLocalizedText(item.label, locale)
            const href = item.id === 'home'
              ? (`/${locale}` as Route)
              : catalogKeywordHref(
                  locale,
                  label,
                  item.id === 'day_tours'
                    ? { days: 1 }
                    : item.id === 'asia_world'
                      ? { region: ['asia', 'other'] }
                      : undefined,
                )
            const hasMenu = Boolean(item.links?.length)

            return (
              <div
                key={item.id}
                className={`relative shrink-0 ${item.hot ? 'z-60' : 'z-10'}`}
                onMouseEnter={() => setOpenId(hasMenu ? item.id : null)}
              >
                <Link
                  href={href}
                  className={`relative flex h-11 cursor-pointer items-center px-3 text-sm font-medium text-white/95 transition-colors hover:bg-white/10 ${
                    openId === item.id ? 'bg-white/10' : ''
                  }`}
                >
                  {label}
                  {item.hot ? (
                    <span className="pointer-events-none absolute -top-1.5 right-0 z-60 rounded-sm bg-tff-orange px-1 py-px text-[9px] font-bold leading-none text-white shadow-sm">
                      HOT
                    </span>
                  ) : null}
                </Link>

                {hasMenu && openId === item.id ? (
                  <div className="absolute left-0 top-full z-50 min-w-[160px] rounded-b-md border border-[#e8e8e8] bg-white px-4 py-3 shadow-lg">
                    <ul className="flex flex-col gap-2.5">
                      {item.links!.map((link) => (
                        <li key={getLocalizedText(link.label, locale)}>
                          <Link
                            href={catalogKeywordHref(locale, getLocalizedText(link.label, locale))}
                            className="cursor-pointer whitespace-nowrap text-sm text-[#606266] hover:text-tff-blue"
                          >
                            {getLocalizedText(link.label, locale)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
