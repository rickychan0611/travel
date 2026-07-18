'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import { ChevronRight } from 'lucide-react'
import { HOME_BANNERS, HOT_DESTINATIONS } from '@/data/home-mock'

const DESTINATION_HREF: Record<string, string> = {
  '洛杉矶': 'yellowstone', '美西国家公园': 'yellowstone', '纽约': 'new-york', '羚羊谷': 'yellowstone', '拉斯维加斯': 'yellowstone', '旧金山': 'yellowstone', '阿拉斯加': 'alaska', '黄石': 'yellowstone',
  '卡尔加里': 'calgary-rockies', '温哥华': 'calgary-rockies', '多伦多': 'new-york', '秘鲁': 'peru', '墨西哥': 'cancun', '尼亚加拉': 'new-york',
  '北欧峡湾': 'europe', '英国': 'europe', '冰岛': 'europe', '法瑞意': 'europe', '土耳其希腊': 'europe', '西葡': 'europe',
  '中国': 'china', '日本': 'china', '新西兰': 'china', '澳大利亚': 'china', '埃及': 'china', '东南亚': 'china',
}

export type ManagedHeroSlide = { id: string; title: string; categorySlug: string; imageUrl: string }
export type ManagedDestinationGroup = { id: string; title: string; links: Array<{ id: string; title: string; categorySlug: string }> }

export function HeroBanner({
  locale,
  managedSlides,
  managedDestinationGroups,
}: {
  locale: string
  managedSlides?: ManagedHeroSlide[]
  managedDestinationGroups?: ManagedDestinationGroup[]
}) {
  const slides = managedSlides ?? HOME_BANNERS.map((banner, bannerIndex) => ({ id: `${bannerIndex}`, title: banner.label, categorySlug: '', imageUrl: banner.src }))
  const groups = managedDestinationGroups ?? HOT_DESTINATIONS.map((group) => ({
    id: group.id,
    title: group.title,
    links: group.links.map((title) => ({ id: title, title, categorySlug: DESTINATION_HREF[title] || 'day-tours' })),
  }))
  const [index, setIndex] = useState(0)
  const [activeRegion, setActiveRegion] = useState(groups[0]?.id || '')
  const [paused, setPaused] = useState(false)
  const [pageVisible, setPageVisible] = useState(true)

  useEffect(() => {
    const onVisibility = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    if (slides.length < 2 || paused || !pageVisible || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % slides.length), 5000)
    return () => window.clearInterval(timer)
  }, [index, pageVisible, paused, slides.length])

  if (slides.length === 0) return null

  return (
    <section
      className="relative w-full overflow-hidden bg-[#1a1a1a]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false) }}
    >
      <div className="relative h-[390px] w-full">
        {slides.map((banner, slideIndex) => (
          <div key={banner.id} className={`absolute inset-0 transition-opacity duration-300 ${slideIndex === index ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
            {banner.categorySlug ? (
              <Link href={`/${locale}/${banner.categorySlug}` as Route} tabIndex={slideIndex === index ? 0 : -1} aria-label={banner.title}>
                <Image src={banner.imageUrl} alt={banner.title} fill className="object-cover" sizes="100vw" priority={slideIndex === 0} />
              </Link>
            ) : <Image src={banner.imageUrl} alt={banner.title} fill className="object-cover" sizes="100vw" priority={slideIndex === 0} />}
          </div>
        ))}

        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="relative mx-auto flex h-full max-w-[1200px]">
            <aside className="pointer-events-auto hidden h-full w-[230px] shrink-0 bg-white/95 backdrop-blur-sm md:block">
              <ul className="flex h-full flex-col">
                {groups.map((region) => (
                  <li key={region.id} className={`flex-1 border-b border-[#eee] transition-colors ${activeRegion === region.id ? 'bg-[#f5f9fc]' : 'hover:bg-[#fafafa]'}`} onMouseEnter={() => setActiveRegion(region.id)}>
                    <div className="flex h-full flex-col justify-center px-3 py-2">
                      <div className="mb-1 flex items-center gap-0.5 text-sm font-semibold text-[#303133]">
                        {region.title}<ChevronRight className="h-3.5 w-3.5 text-[#c0c4cc]" />
                      </div>
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                        {region.links.slice(0, 6).map((link) => (
                          <Link key={link.id} href={`/${locale}/${link.categorySlug}` as Route} className="cursor-pointer text-sm text-tff-blue hover:underline">{link.title}</Link>
                        ))}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </aside>

            <div className="pointer-events-auto absolute bottom-3 left-0 right-0 flex flex-wrap items-center justify-center gap-1.5 pl-[100px] md:left-[230px]">
              {slides.map((banner, slideIndex) => (
                <button key={banner.id} type="button" onClick={() => setIndex(slideIndex)} className={`cursor-pointer rounded-sm px-2.5 py-1.5 text-sm text-white transition ${slideIndex === index ? 'bg-black/85 font-medium' : 'bg-black/45 hover:bg-black/70'}`} aria-current={slideIndex === index ? 'true' : undefined}>
                  {banner.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto bg-white px-3 py-2 md:hidden">
        {groups.map((region) => (
          <Link key={region.id} href={`/${locale}/${region.links[0]?.categorySlug || 'tours'}` as Route} className="shrink-0 cursor-pointer rounded-full bg-[#f0f7fc] px-3 py-1 text-sm text-tff-blue">{region.title}</Link>
        ))}
      </div>
    </section>
  )
}
