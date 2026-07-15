'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { Search, SlidersHorizontal } from 'lucide-react'
import { ProductCard } from '@/components/home/ProductCard'
import { getLocalizedText, type TourCategory } from '@/data/tour-categories'
import type { CollectionProduct } from '@/lib/shopify/types'

type SortKey = 'default' | 'priceAsc' | 'priceDesc' | 'titleAsc'

const sortLabels: Record<SortKey, { en: string; zh: string }> = {
  default: { en: 'Recommended', zh: '推荐排序' },
  priceAsc: { en: 'Price: low to high', zh: '价格由低到高' },
  priceDesc: { en: 'Price: high to low', zh: '价格由高到低' },
  titleAsc: { en: 'Title A-Z', zh: '标题排序' },
}

function productPrice(product: CollectionProduct) {
  return Number(product.priceRange.minVariantPrice.amount || 0)
}

function searchableText(product: CollectionProduct) {
  return [
    product.localizedTitle,
    product.localizedSubtitle,
    product.localizedPlace,
    product.title,
    product.handle,
    product.productType,
    ...product.tags,
  ].filter(Boolean).join(' ').toLowerCase()
}

function productTitle(product: CollectionProduct) {
  return product.localizedTitle ?? product.title
}

export function CategoryPageClient({
  category,
  products,
  locale,
}: {
  category: TourCategory
  products: CollectionProduct[]
  locale: string
}) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('default')
  const title = getLocalizedText(category.title, locale)
  const description = getLocalizedText(category.description, locale)
  const isEnglish = locale === 'en'

  const filteredProducts = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filtered = needle
      ? products.filter((product) => searchableText(product).includes(needle))
      : products

    const sorted = [...filtered]
    if (sortKey === 'priceAsc') sorted.sort((a, b) => productPrice(a) - productPrice(b))
    if (sortKey === 'priceDesc') sorted.sort((a, b) => productPrice(b) - productPrice(a))
    if (sortKey === 'titleAsc') sorted.sort((a, b) => productTitle(a).localeCompare(productTitle(b)))
    return sorted
  }, [products, query, sortKey])

  return (
    <main className="bg-[#f5f7fa]">
      <section className="relative overflow-hidden bg-[#10253f] text-white">
        <div className="absolute inset-0 bg-cover bg-center opacity-45" style={{ backgroundImage: `url(${category.heroImage})` }} />
        <div className="relative mx-auto max-w-[1200px] px-4 py-12 md:py-16">
          <nav className="mb-4 text-sm text-white/75">
            <Link href={`/${locale}` as Route} className="cursor-pointer hover:text-white">
              {isEnglish ? 'Home' : '首页'}
            </Link>
            <span className="mx-2">/</span>
            <span>{title}</span>
          </nav>
          <h1 className="max-w-3xl text-3xl font-bold tracking-normal md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/85">{description}</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-6">
        <div className="mb-5 flex flex-col gap-3 rounded-md border border-[#e5e7eb] bg-white p-4 md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#909399]" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={isEnglish ? 'Filter within this category' : '在此分类中筛选'}
              className="h-10 w-full rounded border border-[#d7dce2] pl-9 pr-3 text-sm outline-none focus:border-tff-blue"
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-[#909399]" />
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              className="h-10 cursor-pointer rounded border border-[#d7dce2] bg-white px-3 text-sm outline-none focus:border-tff-blue"
            >
              {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {isEnglish ? sortLabels[key].en : sortLabels[key].zh}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm text-[#606266]">
            {isEnglish ? `${filteredProducts.length} tours` : `${filteredProducts.length} 个产品`}
          </p>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[260px] items-center justify-center rounded-md border border-dashed border-[#d7dce2] bg-white text-center text-sm text-[#909399]">
            {isEnglish ? 'No synced Shopify products match this category yet.' : '暂无符合此分类的已同步 Shopify 产品。'}
          </div>
        )}
      </section>
    </main>
  )
}
