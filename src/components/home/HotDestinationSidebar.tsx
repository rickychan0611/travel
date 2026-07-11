'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { HOT_DESTINATIONS } from '@/data/home-mock'

export function HotDestinationSidebar({ locale }: { locale: string }) {
  const [active, setActive] = useState(HOT_DESTINATIONS[0].id)

  return (
    <aside className="hidden h-[390px] w-[230px] shrink-0 overflow-hidden rounded-md border border-[#e8e8e8] bg-white md:block">
      <div className="border-b border-[#e8e8e8] bg-[#fafafa] px-3 py-2 text-sm font-semibold text-[#303133]">
        热门目的地
      </div>
      <ul className="h-[calc(100%-37px)] overflow-y-auto">
        {HOT_DESTINATIONS.map((region) => {
          const isActive = active === region.id
          return (
            <li
              key={region.id}
              className={`border-b border-[#f0f0f0] transition-colors ${
                isActive ? 'border-l-[3px] border-l-tff-blue bg-[#f9f9f9]' : 'border-l-[3px] border-l-transparent'
              }`}
              onMouseEnter={() => setActive(region.id)}
            >
              <div className="px-3 py-2.5">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-[#303133]">{region.title}</span>
                  <span className="shrink-0 rounded-sm bg-tff-orange/10 px-1.5 py-0.5 text-[10px] text-tff-orange">
                    {region.badge}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  {region.links.map((link) => (
                    <Link
                      key={link}
                      href={`/${locale}/tours?q=${encodeURIComponent(link)}` as Route}
                      className="text-sm text-[#606266] hover:text-tff-blue"
                    >
                      {link}
                    </Link>
                  ))}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
