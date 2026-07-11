'use client'

import { useState } from 'react'
import { REVIEW_ITEMS } from '@/data/home-mock'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'

export function ReviewCarousel() {
  const [index, setIndex] = useState(0)
  const total = REVIEW_ITEMS.length
  const item = REVIEW_ITEMS[index]

  return (
    <div className="rounded-md bg-white p-4 ring-1 ring-[#e8e8e8]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#303133]">用户热评</h3>
        <div className="flex items-center gap-1 text-sm text-[#909399]">
          <button
            type="button"
            className="rounded p-0.5 hover:bg-[#f5f5f5]"
            onClick={() => setIndex((i) => (i - 1 + total) % total)}
            aria-label="Prev review"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span>
            {index + 1}/{total}
          </span>
          <button
            type="button"
            className="rounded p-0.5 hover:bg-[#f5f5f5]"
            onClick={() => setIndex((i) => (i + 1) % total)}
            aria-label="Next review"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-tff-blue text-sm font-semibold text-white">
          {item.avatar}
        </div>
        <div>
          <p className="text-sm font-medium text-[#303133]">{item.name}</p>
          <div className="flex gap-0.5">
            {Array.from({ length: item.rating }).map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-tff-gold text-tff-gold" />
            ))}
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[#606266]">{item.text}</p>
      <p className="mt-2 text-sm text-[#c0c4cc]">{item.date}</p>
    </div>
  )
}
