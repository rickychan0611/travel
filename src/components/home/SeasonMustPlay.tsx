'use client'

import { type MouseEvent, type PointerEvent, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SEASON_MUST_PLAY } from '@/data/home-mock'
import { catalogKeywordHref } from '@/lib/catalog-keywords'

export type ManagedSeasonItem = { id: string; title: string; imageUrl: string }

export function SeasonMustPlay({ locale, managedItems }: { locale: string; managedItems?: ManagedSeasonItem[] }) {
  const items = managedItems ?? SEASON_MUST_PLAY.map((item) => ({ id: item.title, title: item.title, imageUrl: item.image }))
  const rowRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ active: false, pointerId: -1, startX: 0, scrollLeft: 0 })
  const didDragRef = useRef(false)

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || window.matchMedia('(min-width: 768px)').matches || !rowRef.current) {
      dragRef.current.active = false
      didDragRef.current = false
      return
    }
    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: rowRef.current.scrollLeft,
    }
    didDragRef.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag.active || event.pointerId !== drag.pointerId || !rowRef.current) return

    const distance = event.clientX - drag.startX
    if (Math.abs(distance) > 4) didDragRef.current = true
    rowRef.current.scrollLeft = drag.scrollLeft - distance
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag.active || event.pointerId !== drag.pointerId) return
    drag.active = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    window.setTimeout(() => { didDragRef.current = false }, 0)
  }

  const preventClickAfterDrag = (event: MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia('(min-width: 768px)').matches) {
      didDragRef.current = false
      return
    }
    if (!didDragRef.current) return
    event.preventDefault()
    event.stopPropagation()
  }

  if (items.length === 0) return null
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Image src="/tff/popular.png" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
        <h2 className="text-lg font-bold text-[#303133]">当季必玩</h2>
      </div>
      <div
        ref={rowRef}
        className="flex cursor-grab snap-x snap-mandatory gap-3 overflow-x-auto select-none active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:cursor-auto md:grid-cols-3 md:justify-items-center md:overflow-visible md:select-auto lg:grid-cols-5"
        onClickCapture={preventClickAfterDrag}
        onDragStart={(event) => event.preventDefault()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {items.map((card) => (
          <Link
            key={card.id}
            href={catalogKeywordHref(locale, card.title)}
            className="group relative h-[200px] w-[220px] shrink-0 snap-start cursor-pointer overflow-hidden rounded-md"
          >
            <Image
              src={card.imageUrl}
              alt={card.title}
              width={220}
              height={200}
              className="h-full w-full object-cover transition group-hover:scale-105"
              sizes="220px"
            />
            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 via-black/40 to-transparent px-3 pb-3 pt-10">
              <p className="text-sm font-semibold text-white md:text-base">{card.title}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
