'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { Route } from 'next'
import { ProductCard } from './ProductCard'
import { HotRank } from './HotRank'
import { ReviewCarousel } from './ReviewCarousel'
import { MOCK_PRODUCTS } from '@/data/home-mock'
import type { CollectionProduct } from '@/lib/shopify/types'

const TABS = [
  { id: 'hot_seasonal', collection: 'hot-seasonal-west-us' },
  { id: 'day_trip', collection: 'day-trips-new-york' },
  { id: 'world_event', collection: 'world-cup-2026' },
  { id: 'premium', collection: 'premium-small-groups' },
  { id: 'national_park', collection: 'yellowstone-national-park' },
  { id: 'themed', collection: 'film-tv-tours-west' },
] as const

type TabId = (typeof TABS)[number]['id']

function withFallback(products: CollectionProduct[]): CollectionProduct[] {
  return products.length > 0 ? products : MOCK_PRODUCTS
}

export function CategoryTabs({
  locale,
  initialData,
  initialCollection,
}: {
  locale: string
  initialData: CollectionProduct[]
  initialCollection: string
}) {
  const t = useTranslations('categories')
  const [products, setProducts] = useState<CollectionProduct[]>(() => withFallback(initialData))
  const [loading, setLoading] = useState(false)
  const [activeCollection, setActiveCollection] = useState(initialCollection)
  const [activeTab, setActiveTab] = useState<TabId>(
    TABS.find((tab) => tab.collection === initialCollection)?.id ?? TABS[0].id
  )

  const handleTabClick = async (tabId: TabId, collection: string) => {
    if (collection === activeCollection) return
    setActiveTab(tabId)
    setActiveCollection(collection)
    setLoading(true)
    try {
      const res = await fetch(`/api/shopify/collections/${collection}`)
      const data = await res.json()
      setProducts(withFallback(data.collection?.products?.nodes ?? []))
    } catch {
      setProducts(MOCK_PRODUCTS)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-md bg-white p-4 shadow-sm ring-1 ring-[#e8e8e8] md:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-lg font-bold text-[#303133]">美国旅游精选</h2>
        <Link href={`/${locale}/tours` as Route} className="text-sm text-tff-blue hover:underline">
          查看更多 &gt;
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-1 border-b border-[#e8e8e8]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabClick(tab.id, tab.collection)}
            className={`-mb-px px-3 py-2 text-sm transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-tff-blue font-semibold text-tff-blue'
                : 'text-[#606266] hover:text-tff-blue'
            }`}
          >
            {t(tab.id)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_240px]">
        <div>
          {loading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse overflow-hidden rounded-md ring-1 ring-[#eee]">
                  <div className="aspect-[4/3] bg-[#f0f0f0]" />
                  <div className="space-y-2 p-3">
                    <div className="h-3 w-3/4 rounded bg-[#f0f0f0]" />
                    <div className="h-3 w-1/2 rounded bg-[#f0f0f0]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {products.slice(0, 6).map((product) => (
                <ProductCard key={product.id} product={product} locale={locale} />
              ))}
            </div>
          )}
        </div>
        <aside className="space-y-3">
          <HotRank locale={locale} />
          <ReviewCarousel />
        </aside>
      </div>
    </section>
  )
}
