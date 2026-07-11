'use client'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Search } from 'lucide-react'
import { ProductCard } from '@/components/home/ProductCard'
import { Button } from '@/components/ui/button'
import type { CollectionProduct } from '@/lib/shopify/types'

type FilterKey = 'all' | 'group-tour' | 'day-trip' | 'small-group'

const FILTERS: Array<{ key: FilterKey; labelKey: string }> = [
  { key: 'all',         labelKey: 'filterAll' },
  { key: 'group-tour',  labelKey: 'filterGroupTour' },
  { key: 'day-trip',    labelKey: 'filterDayTrip' },
  { key: 'small-group', labelKey: 'filterSmallGroup' },
]

export function ToursFilter({
  products,
  locale,
  initialQuery = '',
}: {
  products: CollectionProduct[]
  locale: string
  initialQuery?: string
}) {
  const t  = useTranslations('tours')
  const th = useTranslations('home')

  const [active, setActive]           = useState<FilterKey>('all')
  const [inputValue, setInputValue]   = useState(initialQuery)
  const [searchQuery, setSearchQuery] = useState(initialQuery.trim().toLowerCase())

  useEffect(() => {
    setInputValue(initialQuery)
    setSearchQuery(initialQuery.trim().toLowerCase())
  }, [initialQuery])

  // Debounce: update searchQuery 200 ms after the user stops typing
  useEffect(() => {
    const id = setTimeout(() => setSearchQuery(inputValue.trim().toLowerCase()), 200)
    return () => clearTimeout(id)
  }, [inputValue])

  const filtered = products.filter((p) => {
    const matchesType  = active === 'all' || p.productType === active
    const matchesQuery = searchQuery === '' || p.title.toLowerCase().includes(searchQuery)
    return matchesType && matchesQuery
  })

  return (
    <div>
      {/* Search input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={th('searchPlaceholder')}
          className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {FILTERS.map(({ key, labelKey }) => (
          <Button
            key={key}
            variant={active === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActive(key)}
          >
            {t(labelKey)}
          </Button>
        ))}
        <span className="ml-auto text-sm text-muted-foreground">
          {t('results', { count: filtered.length })}
        </span>
      </div>

      {/* Grid or empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground">{t('noResults')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} />
          ))}
        </div>
      )}
    </div>
  )
}
