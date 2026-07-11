'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import { HOME_BANNERS, HOT_DESTINATIONS } from '@/data/home-mock'
import { ChevronRight } from 'lucide-react'

export function HeroBanner({ locale }: { locale: string }) {
  const [index, setIndex] = useState(0)
  const [activeRegion, setActiveRegion] = useState(HOT_DESTINATIONS[0].id)

  return (
    <section className="relative w-full overflow-hidden bg-[#1a1a1a]">
      {/* Full-bleed slides — manual only, no autoplay */}
      <div className="relative h-[390px] w-full">
        {HOME_BANNERS.map((banner, i) => (
          <div
            key={banner.src}
            className={`absolute inset-0 transition-opacity duration-300 ${
              i === index ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <Image
              src={banner.src}
              alt={banner.alt}
              fill
              className="object-cover"
              sizes="100vw"
              priority={i === 0}
            />
          </div>
        ))}

        {/* Content rail: overlay destinations + black slide buttons */}
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="relative mx-auto flex h-full max-w-[1200px]">
            {/* Left destination panel overlaid on banner */}
            <aside className="pointer-events-auto hidden h-full w-[230px] shrink-0 bg-white/95 backdrop-blur-sm md:block">
              <ul className="flex h-full flex-col">
                {HOT_DESTINATIONS.map((region) => {
                  const isActive = activeRegion === region.id
                  return (
                    <li
                      key={region.id}
                      className={`flex-1 border-b border-[#eee] transition-colors ${
                        isActive ? 'bg-[#f5f9fc]' : 'hover:bg-[#fafafa]'
                      }`}
                      onMouseEnter={() => setActiveRegion(region.id)}
                    >
                      <div className="flex h-full flex-col justify-center px-3 py-2">
                        <div className="mb-1 flex items-center justify-between gap-1">
                          <span className="flex items-center gap-0.5 text-sm font-semibold text-[#303133]">
                            {region.title}
                            <ChevronRight className="h-3.5 w-3.5 text-[#c0c4cc]" />
                          </span>
                          <span className="shrink-0 rounded-sm bg-tff-orange px-1.5 py-0.5 text-[10px] leading-none text-white">
                            {region.badge}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                          {region.links.slice(0, 6).map((link) => (
                            <Link
                              key={link}
                              href={`/${locale}/tours?q=${encodeURIComponent(link)}` as Route}
                              className="text-sm text-tff-blue hover:underline"
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

            {/* Black text buttons — bottom of banner, click to change slide */}
            <div className="pointer-events-auto absolute bottom-3 left-0 right-0 flex flex-wrap items-center justify-center gap-1.5 pl-[100px] pr-0 md:left-[230px]">
              {HOME_BANNERS.map((banner, i) => (
                <button
                  key={banner.src}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`cursor-pointer rounded-sm px-2.5 py-1.5 text-sm text-white transition ${
                    i === index
                      ? 'bg-black/85 font-medium'
                      : 'bg-black/45 hover:bg-black/70'
                  }`}
                >
                  {banner.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile destination strip */}
      <div className="flex gap-2 overflow-x-auto bg-white px-3 py-2 md:hidden">
        {HOT_DESTINATIONS.map((region) => (
          <Link
            key={region.id}
            href={`/${locale}/tours?q=${encodeURIComponent(region.title)}` as Route}
            className="shrink-0 rounded-full bg-[#f0f7fc] px-3 py-1 text-sm text-tff-blue"
          >
            {region.title}
          </Link>
        ))}
      </div>
    </section>
  )
}
