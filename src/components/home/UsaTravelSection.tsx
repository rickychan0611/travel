'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Route } from 'next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { USA_TRAVEL, type DestinationProduct } from '@/data/home-mock'

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
        <span className="text-[#c0c4cc] line-through">${formatPrice(originalPrice)}</span>
      ) : null}
      <span className={`font-bold text-tff-orange ${size === 'sm' ? 'text-sm' : 'text-base'}`}>
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
      className="group relative col-span-1 h-full min-h-[200px] overflow-hidden rounded-md sm:col-span-2 lg:min-h-0"
    >
      <Image
        src={product.image}
        alt={product.title}
        fill
        className="object-cover transition duration-300 group-hover:scale-105"
        sizes="(max-width: 1024px) 100vw, 560px"
      />
      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/50 to-transparent px-3 pb-3 pt-12">
        <p className="line-clamp-2 text-sm leading-snug text-white">{product.title}</p>
        <div className="mt-2 flex items-baseline gap-1.5">
          {product.originalPrice != null && product.originalPrice > product.price ? (
            <span className="text-sm text-white/55 line-through">
              ${formatPrice(product.originalPrice)}
            </span>
          ) : null}
          <span className="text-base font-bold text-tff-orange">
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
      className="group flex h-full min-h-0 flex-col overflow-hidden rounded-md bg-white ring-1 ring-[#eee] transition hover:shadow-md"
    >
      <div className="relative min-h-[110px] flex-[1.35] overflow-hidden bg-[#f5f5f5]">
        <Image
          src={product.image}
          alt={product.title}
          fill
          className="object-cover transition duration-300 group-hover:scale-105"
          sizes="(max-width: 1024px) 50vw, 220px"
        />
      </div>
      <div className="flex shrink-0 flex-col gap-2 p-2.5">
        <p className="line-clamp-2 text-sm leading-snug text-[#303133] group-hover:text-tff-blue">
          {product.title}
        </p>
        <div className="flex justify-end">
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
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize) || 3)
  const [page, setPage] = useState(0)
  const pageItems = items.slice(0, pageSize)

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-md bg-white p-3 ring-1 ring-[#e8e8e8]">
      <h3 className="mb-3 shrink-0 text-sm font-bold text-[#303133]">{title}热销榜</h3>
      <ul className="min-h-0 flex-1 space-y-2.5 overflow-hidden">
        {pageItems.map((item) => (
          <li key={item.rank}>
            <Link
              href={`/${locale}/tours` as Route}
              className="flex gap-2.5 hover:opacity-90"
            >
              <div className="relative h-[58px] w-[58px] shrink-0 overflow-hidden rounded">
                <Image src={item.image} alt="" fill className="object-cover" sizes="58px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm leading-snug text-[#303133]">{item.title}</p>
                <p className="mt-1 text-sm font-semibold text-tff-orange">
                  ${formatPrice(item.price)}
                  <span className="font-normal">起</span>
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex shrink-0 items-center justify-center gap-2 text-sm text-[#909399]">
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
    <div className="flex min-h-0 flex-1 flex-col rounded-md bg-white p-3 ring-1 ring-[#e8e8e8]">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-[#303133]">用户热评</h3>
      </div>
      <p className="line-clamp-2 text-sm leading-snug text-[#303133]">{item.productTitle}</p>
      <div className="mt-1 flex justify-end text-sm font-semibold text-tff-orange">
        {item.rating}分
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[#f0f0f0]">
          <Image src={item.avatar} alt="" fill className="object-cover" sizes="36px" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm text-[#303133]">{item.name}</p>
          <p className="text-sm text-[#c0c4cc]">{item.date}</p>
        </div>
      </div>
      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-[#606266]">{item.text}</p>
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

export function UsaTravelSection({ locale }: { locale: string }) {
  const [activeId, setActiveId] = useState(USA_TRAVEL.categories[0].id)
  const selected =
    USA_TRAVEL.categories.find((c) => c.id === activeId) ?? USA_TRAVEL.categories[0]
  const active = selected.products.length > 0 ? selected : USA_TRAVEL.categories[0]
  const [featured, side, ...rest] = active.products

  return (
    <section className="rounded-md bg-white p-4 shadow-sm ring-1 ring-[#e8e8e8] md:p-5">
      <div className="mb-3 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Image
            src={USA_TRAVEL.icon}
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
          />
          <h2 className="text-2xl font-bold tracking-wide text-[#303133]">{USA_TRAVEL.title}</h2>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[#f0f0f0] pb-3 text-sm">
        {USA_TRAVEL.categories.map((cat) => {
          const isActive = cat.id === activeId
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveId(cat.id)}
              className={`transition-colors ${
                isActive ? 'font-semibold text-tff-blue' : 'text-[#606266] hover:text-tff-blue'
              }`}
            >
              {cat.label}
            </button>
          )
        })}
        <Link
          href={`/${locale}${USA_TRAVEL.moreHref}` as Route}
          className="ml-auto shrink-0 text-tff-blue hover:underline"
        >
          查看更多 &gt;
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-stretch">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:h-[480px] lg:grid-cols-3 lg:grid-rows-2">
          {featured ? <FeaturedCard product={featured} locale={locale} /> : null}
          {side ? <SmallCard product={side} locale={locale} /> : null}
          {rest.map((product) => (
            <SmallCard key={product.title} product={product} locale={locale} />
          ))}
        </div>

        <aside className="flex min-h-[420px] flex-col gap-3 lg:h-[480px] lg:min-h-0">
          <HotSellPanel title={active.label} items={active.hotRank} locale={locale} />
          <ReviewPanel reviews={active.reviews} />
        </aside>
      </div>
    </section>
  )
}
