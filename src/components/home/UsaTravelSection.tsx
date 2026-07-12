'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Route } from 'next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { USA_TRAVEL, type DestinationProduct, type DestinationSection } from '@/data/home-mock'
import styles from './UsaTravelSection.module.css'

function formatPrice(price: number) {
  return price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)
}

function Price({
  price,
  originalPrice,
  size = 'md',
}: {
  price: number
  originalPrice?: number
  size?: 'sm' | 'md'
}) {
  return (
    <div className={`flex items-baseline gap-1.5 ${size === 'sm' ? 'text-sm' : ''}`}>
      {originalPrice != null && originalPrice > price ? (
        <span className="text-[#bfc3c8] line-through">${formatPrice(originalPrice)}</span>
      ) : null}
      <span className={`font-bold text-tff-orange ${size === 'sm' ? 'text-xl' : 'text-base'}`}>
        ${formatPrice(price)}
        <span className="text-sm font-normal">起</span>
      </span>
    </div>
  )
}

function FeaturedCard({
  product,
  locale,
}: {
  product: DestinationProduct
  locale: string
}) {
  return (
    <Link
      href={`/${locale}/tours` as Route}
      className="group relative col-span-1 h-[250px] overflow-hidden rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.18)] sm:col-span-2 lg:h-full"
    >
      <Image
        src={product.image}
        alt={product.title}
        fill
        className="object-cover transition duration-300 group-hover:scale-105"
        sizes="(max-width: 1024px) 100vw, 560px"
      />
      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 via-black/50 to-transparent px-3 pb-2.5 pt-14">
        <p className="line-clamp-2 text-base leading-snug text-white">{product.title}</p>
        <div className="mt-1 flex items-baseline gap-1.5">
          {product.originalPrice != null && product.originalPrice > product.price ? (
            <span className="text-base text-white/70 line-through">
              ${formatPrice(product.originalPrice)}
            </span>
          ) : null}
          <span className="text-xl font-bold text-tff-orange">
            ${formatPrice(product.price)}
            <span className="text-sm font-normal">起</span>
          </span>
        </div>
      </div>
    </Link>
  )
}

function SmallCard({
  product,
  locale,
}: {
  product: DestinationProduct
  locale: string
}) {
  return (
    <Link
      href={`/${locale}/tours` as Route}
      className={`${styles.smallCard} group flex h-full min-h-[250px] flex-col overflow-hidden rounded-sm bg-white transition hover:shadow-md lg:min-h-0`}
    >
      <div className={`${styles.smallImageWrap} relative h-[180px] shrink-0 overflow-hidden bg-[#f5f5f5] lg:h-[66%]`}>
        <Image
          src={product.image}
          alt={product.title}
          fill
          className="object-cover transition duration-300 group-hover:scale-105"
          sizes="(max-width: 1024px) 50vw, 220px"
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-2.5 pb-0 pt-3">
        <p className="line-clamp-2 text-base leading-7 text-[#202124] group-hover:text-tff-blue">
          {product.title}
        </p>
        <div className="mt-auto flex justify-start pb-0.5">
          <Price price={product.price} originalPrice={product.originalPrice} size="sm" />
        </div>
      </div>
    </Link>
  )
}

function HotSellPanel({
  title,
  items,
  locale,
}: {
  title: string
  items: Array<DestinationProduct & { rank: number }>
  locale: string
}) {
  const pageSize = 4
  const totalPages = Math.max(3, Math.ceil(items.length / pageSize))
  const [page, setPage] = useState(0)
  const start = page * pageSize
  const pageItems = items.slice(start, start + pageSize)
  const visibleItems = pageItems.length > 0 ? pageItems : items.slice(0, pageSize)

  return (
    <div className="flex min-h-0 flex-[1.95] flex-col bg-white">
      <h3 className="mb-3 shrink-0 text-base font-normal text-[#202124]">{title}热销榜</h3>
      <ul className="min-h-0 flex-1 space-y-5 overflow-hidden">
        {visibleItems.map((item) => (
          <li key={item.rank}>
            <Link
              href={`/${locale}/tours` as Route}
              className="flex gap-2.5 hover:opacity-90"
            >
              <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-sm">
                <Image src={item.image} alt="" fill className="object-cover" sizes="72px" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="line-clamp-2 text-sm leading-[1.45] text-[#111827]">{item.title}</p>
                <p className="mt-1.5 text-right text-lg font-semibold leading-none text-tff-orange">
                  ${formatPrice(item.price)}
                  <span className="text-sm font-normal">起</span>
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex shrink-0 items-center justify-center gap-2 text-sm text-[#909399]">
        <button
          type="button"
          className="rounded p-0.5 hover:bg-[#f5f5f5]"
          onClick={() => setPage((p) => (p - 1 + totalPages) % totalPages)}
          aria-label="上一页"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span>
          {page + 1} / {totalPages}
        </span>
        <button
          type="button"
          className="rounded p-0.5 hover:bg-[#f5f5f5]"
          onClick={() => setPage((p) => (p + 1) % totalPages)}
          aria-label="下一页"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function ReviewPanel({
  reviews,
}: {
  reviews: (typeof USA_TRAVEL.categories)[0]['reviews']
}) {
  const [index, setIndex] = useState(0)
  const total = Math.max(reviews.length, 1)
  const item = reviews[index] ?? reviews[0]

  if (!item) return null

  return (
    <div className="flex min-h-0 flex-1 flex-col border-t border-[#eeeeee] bg-white pt-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-base font-normal text-[#202124]">用户热评</h3>
      </div>
      <div className="flex items-start gap-3">
        <p className="line-clamp-2 flex-1 text-sm leading-[1.55] text-[#111827]">
          {item.productTitle}
        </p>
        <div className="shrink-0 border-l border-[#d9d9d9] pl-8 text-lg font-semibold leading-8 text-tff-orange">
          {item.rating}
          <span className="text-sm font-normal text-tff-orange">分</span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2.5">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#f0f0f0]">
          <Image src={item.avatar} alt="" fill className="object-cover" sizes="36px" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm text-[#202124]">{item.name}</p>
          <p className="text-sm text-[#8b9098]">{item.date}</p>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-[#303133]">{item.text}</p>
      <div className="mt-3 flex shrink-0 items-center justify-center gap-2 text-sm text-[#909399]">
        <button
          type="button"
          className="rounded p-0.5 hover:bg-[#f5f5f5]"
          onClick={() => setIndex((i) => (i - 1 + total) % total)}
          aria-label="上一评"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span>
          {index + 1} / {Math.max(total, 10)}
        </span>
        <button
          type="button"
          className="rounded p-0.5 hover:bg-[#f5f5f5]"
          onClick={() => setIndex((i) => (i + 1) % total)}
          aria-label="下一评"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function UsaTravelSection({
  locale,
  section = USA_TRAVEL,
}: {
  locale: string
  section?: DestinationSection
}) {
  const [activeId, setActiveId] = useState(section.categories[0].id)
  const selected =
    section.categories.find((c) => c.id === activeId) ?? section.categories[0]
  const active = selected.products.length > 0 ? selected : section.categories[0]
  const [featured, side, ...rest] = active.products

  return (
    <section className={`${styles.section}`}>
      <div className="mb-6 flex items-center justify-center">
        <div className="flex items-center gap-3 mt-10">
          <Image
            src={section.icon}
            alt=""
            width={52}
            height={52}
            className="h-[52px] w-[52px] object-contain"
          />
          <h2 className="text-[30px] font-bold leading-none tracking-normal text-[#202124]">
            {section.title}
          </h2>
        </div>
      </div>


      <div className="relative mb-5 flex flex-wrap items-center justify-center gap-y-2 pr-0 text-sm lg:pr-24">
        <div className="flex flex-wrap items-center justify-center gap-x-9 gap-y-2">
          {section.categories.map((cat) => {
            const isActive = cat.id === activeId
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveId(cat.id)}
                className={`whitespace-nowrap transition-colors ${isActive ? 'text-tff-blue' : 'text-[#555] hover:text-tff-blue'
                  }`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
        <Link
          href={`/${locale}${section.moreHref}` as Route}
          className="mt-1 shrink-0 whitespace-nowrap text-tff-blue hover:underline lg:absolute lg:right-0 lg:top-0 lg:mt-0"
        >
          查看更多 &gt;
        </Link>
      </div>

      <div className={`${styles.layout} grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,896px)_270px] lg:items-stretch lg:gap-[34px]`}>
        <div className={`${styles.mosaic} grid grid-cols-1 gap-6 sm:grid-cols-2 lg:h-[648px] lg:grid-cols-3 lg:grid-rows-[315px_307px] lg:gap-x-6 lg:gap-y-[26px]`}>
          {featured ? <FeaturedCard product={featured} locale={locale} /> : null}
          {side ? <SmallCard product={side} locale={locale} /> : null}
          {rest.map((product) => (
            <SmallCard key={product.title} product={product} locale={locale} />
          ))}
        </div>

        <aside className={`${styles.rail} flex min-h-[520px] flex-col lg:h-[648px] lg:min-h-0`}>
          <HotSellPanel title={active.label} items={active.hotRank} locale={locale} />
          <ReviewPanel reviews={active.reviews} />
        </aside>
      </div>
    </section>
  )
}
