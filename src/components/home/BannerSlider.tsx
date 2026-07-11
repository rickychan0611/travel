'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { HOME_BANNERS } from '@/data/home-mock'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function BannerSlider() {
  const [index, setIndex] = useState(0)
  const total = HOME_BANNERS.length

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % total)
    }, 4500)
    return () => window.clearInterval(id)
  }, [total])

  function go(delta: number) {
    setIndex((i) => (i + delta + total) % total)
  }

  return (
    <div className="relative h-full min-h-[280px] overflow-hidden rounded-md bg-[#e8e8e8] md:min-h-[390px]">
      {HOME_BANNERS.map((banner, i) => (
        <div
          key={banner.src}
          className={`absolute inset-0 transition-opacity duration-500 ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={banner.src}
            alt={banner.alt}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 970px"
            priority={i === 0}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() => go(-1)}
        className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded bg-black/35 text-white hover:bg-black/50"
        aria-label="Previous"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded bg-black/35 text-white hover:bg-black/50"
        aria-label="Next"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute bottom-2 left-0 right-0 z-10 flex justify-center gap-1.5 px-2">
        {HOME_BANNERS.map((banner, i) => (
          <button
            key={banner.src}
            type="button"
            onClick={() => setIndex(i)}
            className={`h-10 w-14 overflow-hidden rounded border-2 transition ${
              i === index ? 'border-tff-blue' : 'border-transparent opacity-70 hover:opacity-100'
            }`}
          >
            <Image src={banner.src} alt="" width={56} height={40} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}
