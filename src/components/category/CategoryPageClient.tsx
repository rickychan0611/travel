'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { ChevronDown, ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react'
import { ProductCard } from '@/components/home/ProductCard'
import { getLocalizedText, type TourCategory } from '@/data/tour-categories'
import {
  activeProductFilterCount,
  productFilterSearchParams,
  type ProductFilterOption,
  type ProductFilterOptions,
  type ProductFilterState,
} from '@/lib/shopify/product-filters'
import type { CollectionProduct } from '@/lib/shopify/types'
import { catalogKeywordHref } from '@/lib/catalog-keywords'
import { cn } from '@/lib/utils'

type Copy = {
  home: string
  search: string
  searchPlaceholder: string
  region: string
  productType: string
  departureCountry: string
  departureCity: string
  returnCity: string
  destination: string
  label: string
  travelDays: string
  price: string
  departureDate: string
  transfer: string
  tourFormat: string
  confirm: string
  apply: string
  clear: string
  filters: string
  tours: string
  noResults: string
  previous: string
  next: string
  recommended: string
  priceAsc: string
  priceDesc: string
  title: string
  min: string
  max: string
}

const COPY: Record<'en' | 'zh-CN' | 'zh-TW', Copy> = {
  en: {
    home: 'Home', search: 'Search', searchPlaceholder: 'Product name, code, departure city, or destination', region: 'Region', productType: 'Product type', departureCountry: 'Departure country', departureCity: 'Departure city', returnCity: 'Return city', destination: 'Destination', label: 'Product label', travelDays: 'Travel days', price: 'Price range', departureDate: 'Departure date', transfer: 'Airport service', tourFormat: 'Tour format', confirm: 'Confirm method', apply: 'Apply filters', clear: 'Clear', filters: 'Filters', tours: 'tours', noResults: 'No Shopify products match these filters.', previous: 'Previous', next: 'Next', recommended: 'Recommended', priceAsc: 'Price: low to high', priceDesc: 'Price: high to low', title: 'Title A–Z', min: 'Minimum', max: 'Maximum',
  },
  'zh-CN': {
    home: '首页', search: '搜索', searchPlaceholder: '产品名称、团号、出发城市或目的地', region: '地区', productType: '产品分类', departureCountry: '出发国家', departureCity: '出发城市', returnCity: '返回城市', destination: '目的地', label: '产品标签', travelDays: '行程天数', price: '价格范围', departureDate: '出发日期', transfer: '机场接送', tourFormat: '产品类型', confirm: '确认方式', apply: '应用筛选', clear: '清除', filters: '筛选', tours: '个产品', noResults: '没有符合筛选条件的 Shopify 产品。', previous: '上一页', next: '下一页', recommended: '推荐排序', priceAsc: '价格由低到高', priceDesc: '价格由高到低', title: '标题排序', min: '最小', max: '最大',
  },
  'zh-TW': {
    home: '首頁', search: '搜尋', searchPlaceholder: '產品名稱、團號、出發城市或目的地', region: '地區', productType: '產品分類', departureCountry: '出發國家', departureCity: '出發城市', returnCity: '返回城市', destination: '目的地', label: '產品標籤', travelDays: '行程天數', price: '價格範圍', departureDate: '出發日期', transfer: '機場接送', tourFormat: '產品類型', confirm: '確認方式', apply: '套用篩選', clear: '清除', filters: '篩選', tours: '個產品', noResults: '沒有符合篩選條件的 Shopify 產品。', previous: '上一頁', next: '下一頁', recommended: '推薦排序', priceAsc: '價格由低到高', priceDesc: '價格由高到低', title: '標題排序', min: '最小', max: '最大',
  },
}

function localeCopy(locale: string) {
  return COPY[locale as keyof typeof COPY] || COPY.en
}

function FacetRow({ label, name, options, selected }: { label: string; name: string; options: ProductFilterOption[]; selected: string[] }) {
  if (options.length === 0) return null
  const selectedSet = new Set(selected)
  return (
    <div className="grid gap-2 border-t border-[#edf0f3] py-3 md:grid-cols-[150px_1fr]">
      <span className="text-sm font-medium text-[#303133]">{label}</span>
      <div className="flex max-h-28 flex-wrap gap-x-5 gap-y-2 overflow-y-auto pr-2">
        {options.map((option) => (
          <label key={option.value} className="flex cursor-pointer items-center gap-1.5 text-sm text-[#4b5563] hover:text-tff-blue">
            <input type="checkbox" name={name} value={option.value} defaultChecked={selectedSet.has(option.value)} className="h-4 w-4 accent-[#168df0]" />
            <span>{option.label}</span>
            <span className="text-xs text-[#a0a7b0]">({option.count})</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function FilterForm({ path, filters, options, copy }: { path: string; filters: ProductFilterState; options: ProductFilterOptions; copy: Copy }) {
  const activeCount = activeProductFilterCount(filters)
  const [facetsOpen, setFacetsOpen] = useState(activeCount > 0)

  return (
    <form action={path} method="get" className="rounded-md border border-[#e1e5ea] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#909399]" />
          <input name="q" type="search" defaultValue={filters.q} placeholder={copy.searchPlaceholder} className="h-11 w-full rounded border border-[#d7dce2] pl-9 pr-3 text-sm outline-none focus:border-tff-blue" />
        </label>
        <select name="sort" defaultValue={filters.sort} className="h-11 rounded border border-[#d7dce2] bg-white px-3 text-sm outline-none focus:border-tff-blue">
          <option value="recommended">{copy.recommended}</option>
          <option value="price-asc">{copy.priceAsc}</option>
          <option value="price-desc">{copy.priceDesc}</option>
          <option value="title">{copy.title}</option>
        </select>
        <button type="submit" className="h-11 cursor-pointer rounded bg-[#168df0] px-7 text-sm font-semibold text-white hover:bg-[#087edc]">{copy.search}</button>
      </div>

      <button
        type="button"
        onClick={() => setFacetsOpen((open) => !open)}
        aria-expanded={facetsOpen}
        className="mt-4 flex w-full cursor-pointer items-center justify-between rounded border border-[#edf0f3] bg-[#f8fafc] px-3 py-2.5 text-sm font-semibold text-[#303133] hover:bg-[#f1f5f9]"
      >
        <span className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#168df0]" />
          {copy.filters}
          {activeCount > 0 ? (
            <span className="rounded-full bg-[#168df0] px-2 py-0.5 text-xs font-medium text-white">{activeCount}</span>
          ) : null}
        </span>
        <ChevronDown className={cn('h-4 w-4 text-[#909399] transition-transform', facetsOpen && 'rotate-180')} />
      </button>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          facetsOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <FacetRow label={copy.region} name="region" options={options.regions} selected={filters.regions} />
          <FacetRow label={copy.productType} name="productType" options={options.productTypes} selected={filters.productTypes} />
          <FacetRow label={copy.departureCountry} name="departureCountry" options={options.departureCountries} selected={filters.departureCountries} />
          <FacetRow label={copy.departureCity} name="departureCity" options={options.departureCities} selected={filters.departureCities} />
          <FacetRow label={copy.returnCity} name="returnCity" options={options.returnCities} selected={filters.returnCities} />
          <FacetRow label={copy.destination} name="destination" options={options.destinations} selected={filters.destinations} />
          <FacetRow label={copy.label} name="label" options={options.labels} selected={filters.labels} />
          <FacetRow label={copy.travelDays} name="days" options={options.days} selected={filters.days.map(String)} />

          <div className="grid gap-2 border-t border-[#edf0f3] py-3 md:grid-cols-[150px_1fr]">
            <span className="text-sm font-medium text-[#303133]">{copy.travelDays}</span>
            <div className="flex flex-wrap items-center gap-2">
              <input name="minDays" type="number" min="1" defaultValue={filters.minDays} placeholder={copy.min} className="h-9 w-28 rounded border border-[#d7dce2] px-3 text-sm" />
              <span className="text-[#909399]">–</span>
              <input name="maxDays" type="number" min="1" defaultValue={filters.maxDays} placeholder={copy.max} className="h-9 w-28 rounded border border-[#d7dce2] px-3 text-sm" />
            </div>
          </div>

          <div className="grid gap-2 border-t border-[#edf0f3] py-3 md:grid-cols-[150px_1fr]">
            <span className="text-sm font-medium text-[#303133]">{copy.price}</span>
            <div className="flex flex-wrap items-center gap-2">
              <input name="minPrice" type="number" min="0" step="0.01" defaultValue={filters.minPrice} placeholder={copy.min} className="h-9 w-32 rounded border border-[#d7dce2] px-3 text-sm" />
              <span className="text-[#909399]">–</span>
              <input name="maxPrice" type="number" min="0" step="0.01" defaultValue={filters.maxPrice} placeholder={copy.max} className="h-9 w-32 rounded border border-[#d7dce2] px-3 text-sm" />
            </div>
          </div>

          <div className="grid gap-2 border-t border-[#edf0f3] py-3 md:grid-cols-[150px_1fr]">
            <span className="text-sm font-medium text-[#303133]">{copy.departureDate}</span>
            <div className="flex flex-wrap items-center gap-2">
              <input name="departureFrom" type="date" defaultValue={filters.departureFrom} className="h-9 rounded border border-[#d7dce2] px-3 text-sm" />
              <span className="text-[#909399]">–</span>
              <input name="departureTo" type="date" defaultValue={filters.departureTo} className="h-9 rounded border border-[#d7dce2] px-3 text-sm" />
            </div>
          </div>

          <FacetRow label={copy.transfer} name="transfer" options={options.transfers} selected={filters.transfers} />
          <FacetRow label={copy.tourFormat} name="tourFormat" options={options.tourFormats} selected={filters.tourFormats} />
          <FacetRow label={copy.confirm} name="confirm" options={options.confirmMethods} selected={filters.confirmMethods} />

          <div className="flex items-center justify-end gap-3 border-t border-[#edf0f3] pt-4">
            <Link href={path as Route} className="cursor-pointer text-sm text-[#606266] hover:text-tff-blue">{copy.clear}</Link>
            <button type="submit" className="cursor-pointer rounded bg-[#168df0] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#087edc]">{copy.apply}</button>
          </div>
        </div>
      </div>
    </form>
  )
}

export function CategoryPageClient({ keyword, category, products, locale, filters, filterOptions, total, totalPages, currentPage }: { keyword: string; category: TourCategory; products: CollectionProduct[]; locale: string; filters: ProductFilterState; filterOptions: ProductFilterOptions; total: number; totalPages: number; currentPage: number }) {
  const title = getLocalizedText(category.title, locale)
  const description = getLocalizedText(category.description, locale)
  const copy = localeCopy(locale)
  const path = catalogKeywordHref(locale, keyword)
  const pageHref = (page: number) => {
    const query = productFilterSearchParams(filters, { page })
    return `${path}${query ? `?${query}` : ''}` as Route
  }

  return (
    <main className="bg-[#f5f7fa]">
      <section className="relative overflow-hidden bg-[#10253f] text-white">
        <div className="absolute inset-0 bg-cover bg-center opacity-45" style={{ backgroundImage: `url(${category.heroImage})` }} />
        <div className="relative mx-auto max-w-[1200px] px-4 py-12 md:py-16">
          <nav className="mb-4 text-sm text-white/75"><Link href={`/${locale}` as Route} className="hover:text-white">{copy.home}</Link><span className="mx-2">/</span><span>{title}</span></nav>
          <h1 className="max-w-3xl text-3xl font-bold md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/85">{description}</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-6">
        <FilterForm path={path} filters={filters} options={filterOptions} copy={copy} />

        <div className="my-5 flex items-center justify-between rounded-md border border-[#e5e7eb] bg-white px-4 py-3 text-sm text-[#606266]">
          <span>{total} {copy.tours}</span>
          {totalPages > 1 ? <span>{currentPage} / {totalPages}</span> : null}
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => <ProductCard key={product.id} product={product} locale={locale} />)}
          </div>
        ) : (
          <div className="flex min-h-[260px] items-center justify-center rounded-md border border-dashed border-[#d7dce2] bg-white text-center text-sm text-[#909399]">{copy.noResults}</div>
        )}

        {totalPages > 1 ? (
          <nav className="mt-7 flex items-center justify-center gap-2" aria-label="Pagination">
            {currentPage > 1 ? <Link href={pageHref(currentPage - 1)} className="flex items-center gap-1 rounded border bg-white px-3 py-2 text-sm hover:border-tff-blue hover:text-tff-blue"><ChevronLeft className="h-4 w-4" />{copy.previous}</Link> : null}
            {Array.from({ length: Math.min(7, totalPages) }, (_, index) => {
              const start = Math.max(1, Math.min(currentPage - 3, totalPages - 6))
              const page = start + index
              return <Link key={page} href={pageHref(page)} aria-current={page === currentPage ? 'page' : undefined} className={`rounded border px-3 py-2 text-sm ${page === currentPage ? 'border-[#168df0] bg-[#168df0] text-white' : 'bg-white hover:border-tff-blue hover:text-tff-blue'}`}>{page}</Link>
            })}
            {currentPage < totalPages ? <Link href={pageHref(currentPage + 1)} className="flex items-center gap-1 rounded border bg-white px-3 py-2 text-sm hover:border-tff-blue hover:text-tff-blue">{copy.next}<ChevronRight className="h-4 w-4" /></Link> : null}
          </nav>
        ) : null}
      </section>
    </main>
  )
}
