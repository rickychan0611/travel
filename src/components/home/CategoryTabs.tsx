'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductCard } from './ProductCard'
import type { CollectionProduct } from '@/lib/shopify/types'

const TABS = [
  { id: 'hot_seasonal',  collection: 'hot-seasonal-west-us' },
  { id: 'day_trip',      collection: 'day-trips-new-york' },
  { id: 'world_event',   collection: 'world-cup-2026' },
  { id: 'premium',       collection: 'premium-small-groups' },
  { id: 'national_park', collection: 'yellowstone-national-park' },
  { id: 'themed',        collection: 'film-tv-tours-west' },
] as const

type TabId = typeof TABS[number]['id']

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
  const tc = useTranslations('common')
  const [products, setProducts] = useState<CollectionProduct[]>(initialData)
  const [loading, setLoading] = useState(false)
  const [activeCollection, setActiveCollection] = useState(initialCollection)

  const handleTabClick = async (collection: string) => {
    if (collection === activeCollection) return
    setActiveCollection(collection)
    setLoading(true)
    try {
      const res = await fetch(`/api/shopify/collections/${collection}`)
      const data = await res.json()
      setProducts(data.collection?.products?.nodes ?? [])
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue={TABS[0].id}>
        <TabsList
          variant="line"
          className="h-auto w-full justify-start flex-wrap gap-x-1 gap-y-1 bg-transparent p-0 border-b border-border rounded-none"
        >
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              onClick={() => handleTabClick(tab.collection)}
              className="px-4 py-2 text-sm font-medium rounded-none"
            >
              {t(tab.id as TabId)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[4/3] w-full rounded-xl" />
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {tc('error')}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} />
          ))}
        </div>
      )}
    </div>
  )
}
