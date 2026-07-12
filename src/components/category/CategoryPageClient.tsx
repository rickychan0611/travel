'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CalendarDays, ChevronRight, ClipboardCheck, Coins, Headphones, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import type { CategoryData, CategoryProduct, CategoryProductType } from '@/data/category-ustours'

type SortKey = 'default' | 'salesAsc' | 'salesDesc' | 'durationAsc' | 'durationDesc' | 'priceAsc' | 'priceDesc'

const sortOptions: Array<{ key: SortKey; label: string }> = [
  { key: 'default', label: '综合排序' },
  { key: 'salesAsc', label: '销量由低到高' },
  { key: 'salesDesc', label: '销量由高到低' },
  { key: 'durationAsc', label: '行程天数由低到高' },
  { key: 'durationDesc', label: '行程天数由高到低' },
  { key: 'priceAsc', label: '价格由低到高' },
  { key: 'priceDesc', label: '价格由高到低' },
]

const guaranteeItems = [
  { title: '价格保障', lines: ['优价保证，买贵立赔'], Icon: Coins },
  { title: '消费透明', lines: ['费用透明，无隐藏项'], Icon: ClipboardCheck },
  { title: '旅行安全保障', lines: ['严选护航，安心抵达'], Icon: ShieldCheck },
  { title: '7x24小时服务', lines: ['全天24小时客服，多语言服务'], Icon: Headphones },
]

function price(value: number) {
  return value.toFixed(2)
}

function cnPageNumbers(current: number) {
  const base = [1, 2, 3, 4, 5, 6]
  if (current > 6 && current < 98) {
    return [1, '...', current, current + 1, '...', 98]
  }
  return [...base, '...', 98]
}

export function CategoryPageClient({ category }: { category: CategoryData }) {
  const [activeType, setActiveType] = useState<CategoryProductType | 'all'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('default')
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)

  const products = useMemo(() => {
    const selectedValues = Object.values(selectedFilters).filter((value) => value && value !== '全部')
    const filtered = category.products.filter((product) => {
      const typeMatch = activeType === 'all' || product.type === activeType
      const filterMatch = selectedValues.every((value) => {
        if (/^\d+天$/.test(value)) {
          return product.duration === Number.parseInt(value, 10)
        }
        return product.departure.includes(value) || product.destinations.some((destination) => destination.includes(value)) || product.badges.some((badge) => badge.includes(value))
      })
      return typeMatch && filterMatch
    })

    const sorted = [...filtered]
    if (sortKey === 'durationAsc') sorted.sort((a, b) => a.duration - b.duration)
    if (sortKey === 'durationDesc') sorted.sort((a, b) => b.duration - a.duration)
    if (sortKey === 'priceAsc') sorted.sort((a, b) => a.price - b.price)
    if (sortKey === 'priceDesc') sorted.sort((a, b) => b.price - a.price)
    if (sortKey === 'salesAsc') sorted.sort((a, b) => a.id.localeCompare(b.id))
    if (sortKey === 'salesDesc') sorted.sort((a, b) => b.id.localeCompare(a.id))
    return sorted
  }, [activeType, category.products, selectedFilters, sortKey])

  const visibleProducts = useMemo(() => {
    if (products.length === 0) return []
    const offset = (page - 1) % products.length
    return [...products.slice(offset), ...products.slice(0, offset)]
  }, [page, products])

  const updateFilter = (label: string, option: string) => {
    setSelectedFilters((current) => ({ ...current, [label]: option }))
    setPage(1)
  }

  return (
    <div className="bg-[#f2f2f2] text-[#222]">
      <div className="mx-auto max-w-[1200px] px-3 pb-10 pt-3">
        <nav className="mb-3 text-[13px] text-[#666]">
          {category.breadcrumb.map((crumb, index) => (
            <span key={crumb}>
              <span className={index === 0 ? 'font-bold text-[#333]' : ''}>{crumb}</span>
              {index < category.breadcrumb.length - 1 ? <span className="mx-2 text-[#aaa]">&gt;</span> : null}
            </span>
          ))}
        </nav>

        <div className="grid gap-4 lg:grid-cols-[1fr_205px] lg:items-start">
          <main className="min-w-0">
            <CategoryFilterPanel category={category} activeType={activeType} onTypeChange={setActiveType} selectedFilters={selectedFilters} onFilterChange={updateFilter} />
            <FeaturedStrip links={category.featuredLinks} />
            <CategoryResults category={category} products={visibleProducts} sortKey={sortKey} onSortChange={setSortKey} page={page} onPageChange={setPage} />
          </main>

          <CategoryRightRail category={category} />
        </div>

        <CategoryInfoSections category={category} />
      </div>
    </div>
  )
}

function CategoryFilterPanel({
  category,
  activeType,
  onTypeChange,
  selectedFilters,
  onFilterChange,
}: {
  category: CategoryData
  activeType: CategoryProductType | 'all'
  onTypeChange: (type: CategoryProductType | 'all') => void
  selectedFilters: Record<string, string>
  onFilterChange: (label: string, value: string) => void
}) {
  return (
    <section className="border-b-2 border-[#e5e5e5] bg-white">
      <div className="flex flex-wrap border-b border-[#eee]">
        {category.tabs.map((tab) => {
          const active = activeType === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTypeChange(tab.key)}
              className={`h-9 border-r border-[#eee] px-4 text-[14px] ${active ? 'bg-[#2389ee] text-white' : 'bg-white text-[#222] hover:text-[#2389ee]'}`}
            >
              {tab.label}({tab.count})
            </button>
          )
        })}
      </div>

      <div className="px-5 py-3">
        {category.filters.map((row) => (
          <div key={row.label} className="flex gap-3 py-2 text-[13px] leading-6">
            <div className="w-[58px] shrink-0 text-[#1683e9]">{row.label}</div>
            <div className="flex min-w-0 flex-1 flex-wrap gap-x-3 gap-y-1">
              {row.options.map((option) => {
                const active = (selectedFilters[row.label] ?? '全部') === option
                return (
                  <button
                    key={`${row.label}-${option}`}
                    type="button"
                    onClick={() => onFilterChange(row.label, option)}
                    className={active ? 'h-6 bg-[#2389ee] px-1.5 text-white' : 'h-6 text-[#222] hover:text-[#2389ee]'}
                  >
                    {option}
                  </button>
                )
              })}
              {row.label === '出发时间' ? (
                <span className="inline-flex items-center gap-2 text-[#666]">
                  <span className="inline-flex h-7 items-center gap-1 rounded border border-[#d7dce2] px-3 text-[#999]">
                    <CalendarDays className="h-3.5 w-3.5" />
                    请选择出发日期
                  </span>
                  <span>至</span>
                  <span className="inline-flex h-7 items-center rounded border border-[#d7dce2] px-3 text-[#999]">请选择出发日期</span>
                </span>
              ) : null}
              {row.options.length > 12 ? <button className="ml-auto text-[#1683e9]" type="button">更多</button> : null}
            </div>
          </div>
        ))}

        <button type="button" className="mx-auto mt-1 flex items-center gap-1 text-[13px] text-[#1683e9]">
          显示更多筛选项(参团类型、接送服务、增值服务、成团人数...)
          <ChevronRight className="h-3.5 w-3.5 rotate-90" />
        </button>
      </div>
    </section>
  )
}

function FeaturedStrip({ links }: { links: string[] }) {
  return (
    <section className="mt-3 flex overflow-hidden border-2 border-[#ffae00] bg-white text-[15px]">
      <div className="flex w-[110px] shrink-0 items-center justify-center gap-2 bg-[#ffae00] py-3 text-lg font-bold text-white">
        <span className="text-2xl">◇</span>
        精选
      </div>
      <div className="flex flex-1 flex-wrap items-center gap-x-10 gap-y-2 px-4 py-3 text-[#ff8a00]">
        {links.map((link) => (
          <Link key={link} href="#" className="hover:underline">☆{link}</Link>
        ))}
      </div>
    </section>
  )
}

function CategoryResults({
  category,
  products,
  sortKey,
  onSortChange,
  page,
  onPageChange,
}: {
  category: CategoryData
  products: CategoryProduct[]
  sortKey: SortKey
  onSortChange: (key: SortKey) => void
  page: number
  onPageChange: (page: number) => void
}) {
  return (
    <section className="mt-3">
      <div className="flex flex-wrap gap-2 bg-white px-3 py-2">
        {sortOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onSortChange(option.key)}
            className={`h-8 px-4 text-[13px] ${sortKey === option.key ? 'bg-[#2389ee] font-bold text-white' : 'text-[#666] hover:text-[#2389ee]'}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 bg-white px-3 py-2 text-[13px]">
        <span>人均价格(美元)</span>
        <span className="inline-flex h-7 w-[70px] items-center justify-center rounded border border-[#d7dce2] text-[#999]">$</span>
        <span>一</span>
        <span className="inline-flex h-7 w-[70px] items-center justify-center rounded border border-[#d7dce2] text-[#999]">$</span>
        <Pagination page={page} totalCount={category.totalCount} onPageChange={onPageChange} compact />
      </div>

      <div className="mt-2 space-y-2">
        {products.map((product) => (
          <CategoryProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="mt-4 flex justify-end bg-[#f2f2f2] py-2">
        <Pagination page={page} totalCount={category.totalCount} onPageChange={onPageChange} />
      </div>
    </section>
  )
}

function Pagination({
  page,
  totalCount,
  onPageChange,
  compact = false,
}: {
  page: number
  totalCount: number
  onPageChange: (page: number) => void
  compact?: boolean
}) {
  const totalPages = 98
  const pages = cnPageNumbers(page)
  return (
    <div className={`ml-auto flex flex-wrap items-center gap-2 text-[13px] ${compact ? '' : 'justify-end'}`}>
      {!compact ? <span>共 {totalCount} 条</span> : null}
      {!compact ? <select className="h-7 rounded border border-[#d7dce2] bg-white px-2"><option>20条/页</option></select> : null}
      <button type="button" className="h-7 w-7 rounded bg-[#eef1f5] text-[#bbb]" onClick={() => onPageChange(Math.max(page - 1, 1))}>‹</button>
      {pages.map((item, index) => (
        <button
          key={`${item}-${index}`}
          type="button"
          disabled={item === '...'}
          onClick={() => typeof item === 'number' && onPageChange(item)}
          className={`h-7 min-w-7 rounded px-2 ${item === page ? 'bg-[#2389ee] text-white' : item === '...' ? 'bg-[#eef1f5] text-[#555]' : 'bg-[#eef1f5] text-[#333]'}`}
        >
          {item}
        </button>
      ))}
      <button type="button" className="h-7 w-7 rounded bg-[#eef1f5] text-[#777]" onClick={() => onPageChange(Math.min(page + 1, totalPages))}>›</button>
      {!compact ? (
        <>
          <span className="ml-4">前往</span>
          <input className="h-7 w-14 rounded border border-[#d7dce2] bg-white text-center" value={page} onChange={(event) => onPageChange(Math.min(Math.max(Number(event.target.value) || 1, 1), totalPages))} />
          <span>页</span>
        </>
      ) : null}
    </div>
  )
}

function CategoryProductCard({ product }: { product: CategoryProduct }) {
  return (
    <article className={`grid overflow-hidden border-t-2 bg-white md:grid-cols-[380px_1fr] ${product.recommended ? 'border-[#ffae00]' : product.smallGroup ? 'border-[#2389ee]' : 'border-transparent'}`}>
      <div className="relative h-[220px] md:h-[268px]">
        <Image src={product.image} alt={product.title} fill sizes="380px" className="object-cover" />
        <div className="absolute left-3 top-3 rounded-full bg-gradient-to-r from-[#ff6600] to-[#ff3d4e] px-4 py-1.5 text-[16px] font-bold text-white">% {product.saleTag}</div>
        <div className="absolute bottom-2 left-3 text-[14px] text-white drop-shadow">产品编号： {product.code}</div>
      </div>

      <div className="flex min-w-0 flex-col px-7 py-5">
        <h2 className="line-clamp-2 text-[19px] font-normal leading-7 text-[#111]">
          {product.smallGroup ? <span className="mr-2 bg-[#ffe045] px-1.5 py-0.5 text-[14px] font-bold">小团</span> : null}
          {product.title}
        </h2>

        <div className="mt-3 flex flex-wrap gap-2">
          {product.badges.map((badge, index) => (
            <span key={badge} className={`rounded px-2 py-0.5 text-[12px] ${index < 2 ? 'bg-[#ff5b24] text-white' : 'border border-[#6fb2ff] bg-[#f6fbff] text-[#2389ee]'}`}>{badge}</span>
          ))}
        </div>

        <p className="mt-4 line-clamp-2 text-[13px] leading-6 text-[#666]">★ {product.description}</p>
        <div className="mt-2 flex gap-10 text-[13px] text-[#666]">
          <Link href="#" className="font-bold text-[#1683e9]">{product.departure}</Link>
          <span>{product.durationLabel}</span>
        </div>

        <div className="mt-auto border-t border-dashed border-[#d2d2d2] pt-4">
          <span className="mr-5 text-[24px] text-[#b9b9b9] line-through">${price(product.originalPrice)}</span>
          <span className="text-[32px] font-bold leading-none text-[#ff5b00]">${price(product.price)}</span>
          <span className="ml-1 text-[13px] text-[#666]">起</span>
          <Link href="#" className="ml-8 inline-flex h-8 items-center rounded bg-[#3498f5] px-6 text-[14px] font-bold text-white hover:bg-[#1c83e7]">查看详情</Link>
        </div>
      </div>
    </article>
  )
}

function CategoryRightRail({ category }: { category: CategoryData }) {
  return (
    <aside className="space-y-3">
      <section className="bg-white p-4">
        <h3 className="mb-3 text-[20px] font-bold">平台保障</h3>
        <div className="space-y-5">
          {guaranteeItems.map(({ title, lines, Icon }) => (
            <div key={title} className="flex gap-3">
              <Icon className="mt-1 h-7 w-7 shrink-0 text-[#0090f2]" strokeWidth={2.2} />
              <div>
                <h4 className="text-[16px] font-bold">{title}</h4>
                <p className="text-[12px] leading-5 text-[#666]">{lines[0]}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white p-7 text-center">
        <h3 className="text-[20px] leading-7">登录可轻松管理<br />订单&赚取积分</h3>
        <p className="mt-4 text-[13px] text-[#666]">还没账号吗？ <Link href="#" className="text-[#1683e9]">注册</Link></p>
        <button type="button" className="mt-5 h-10 w-[124px] rounded border border-[#333] bg-white text-[15px]">登录</button>
      </section>

      <section className="bg-white p-3">
        <h3 className="mb-3 text-[20px] text-[#1683e9]">美洲推荐目的地</h3>
        <div className="grid grid-cols-2 gap-x-5 gap-y-3 text-[13px] text-[#555]">
          {category.rightRail.destinations.map((destination) => <Link key={destination} href="#" className="hover:text-[#1683e9]">{destination}</Link>)}
        </div>
      </section>

      <section className="bg-white p-3">
        <h3 className="mb-3 text-[20px] text-[#1683e9]">热销旅游路线</h3>
        <div className="space-y-4">
          {category.rightRail.hotRoutes.map((route) => (
            <Link key={route.title} href="#" className="block">
              <div className="relative h-[124px] overflow-hidden">
                <Image src={route.image} alt={route.title} fill sizes="181px" className="object-cover" />
              </div>
              <p className="mt-2 line-clamp-2 text-[13px] leading-5">{route.title}</p>
              <p className="mt-1 text-[18px] font-bold text-[#ff5b00]">${price(route.price)}<span className="text-[12px] font-normal text-[#666]">起</span></p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white p-3">
        <h3 className="mb-3 text-[20px] text-[#1683e9]">定制包团服务</h3>
        <div className="grid grid-cols-2 gap-y-3 text-[13px] text-[#555]">
          {['量身定制', '专属行程', '独享优惠', '品质旅行'].map((item) => <span key={item}>{item}</span>)}
        </div>
        <button type="button" className="mx-auto mt-4 block h-8 rounded bg-[#3498f5] px-5 font-bold text-white">现在就去定制</button>
      </section>

      <section className="bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[20px] text-[#1683e9]">北美洲旅游攻略</h3>
          <Link href="#" className="text-[13px] text-[#1683e9]">更多&gt;</Link>
        </div>
        <div className="space-y-2 text-[13px] leading-5 text-[#555]">
          {category.rightRail.guideLinks.map((link) => <Link key={link} href="#" className="block hover:text-[#1683e9]">{link}</Link>)}
        </div>
      </section>

      <section className="bg-white p-3 text-center">
        <Image src="/tff/category/customer-service-qr-code.jpeg" alt="扫码享VIP一对一服务" width={176} height={176} className="mx-auto h-[176px] w-[176px] object-contain" />
        <p className="mt-1 text-[13px] font-bold text-[#1683e9]">扫码享VIP一对一服务</p>
      </section>
    </aside>
  )
}

function CategoryInfoSections({ category }: { category: CategoryData }) {
  return (
    <div className="mt-8 space-y-8">
      <section>
        <h2 className="mb-4 text-[24px] font-bold">{category.about.title}</h2>
        <div className="border border-[#d9d9d9] bg-white p-5 text-[14px] leading-7">{category.about.body}</div>
      </section>

      <section>
        <h2 className="mb-4 text-[24px] font-bold">{category.guide.title}</h2>
        <div className="grid min-h-[300px] border border-[#d9d9d9] bg-white md:grid-cols-[380px_1fr]">
          <ul className="border-r border-[#d9d9d9] p-5 text-[14px] leading-9 text-[#555]">
            {category.guide.topics.map((topic) => <li key={topic}>・ {topic}</li>)}
          </ul>
          <div className="max-h-[300px] overflow-y-auto p-5 text-[14px] leading-8">
            <h3 className="mb-3 text-[20px] font-bold">{category.guide.heading}</h3>
            {category.guide.paragraphs.map((paragraph) => <p key={paragraph} className="mb-5">{paragraph}</p>)}
            <h3 className="text-[20px] font-bold">北美洲旅游核心区域</h3>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-[24px] font-bold">北美洲的旅游季节</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {category.seasons.map((season) => (
            <article key={season.title} className="border border-[#d9d9d9] bg-white p-3">
              <h3 className={`px-5 py-5 text-[16px] font-bold ${season.theme}`}>{season.title}</h3>
              <p className="mt-4 min-h-[140px] text-[14px] leading-6">{season.body}</p>
              <Link href="#" className="block border-b border-[#ddd] pb-3 text-right text-[14px] text-[#1683e9]">查看更多⌄</Link>
              <div className="pt-3 text-[16px] font-bold leading-7">{season.months.map((month) => <p key={month}>{month}</p>)}</div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-[24px] font-bold">北美洲的游客评价</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {category.reviews.map((review) => (
            <article key={`${review.name}-${review.date}`} className="min-h-[250px] border border-[#d9d9d9] bg-white p-5">
              <div className="flex gap-2">
                <Image src="/tff/avatar.png" alt="" width={42} height={42} className="h-[42px] w-[42px] rounded-full" />
                <div>
                  <h3 className="font-bold">{review.name} <span className="ml-1 font-normal text-[#999]">{review.date}</span></h3>
                  <p className="text-[13px] text-[#1683e9]">5分/5分</p>
                </div>
              </div>
              <Link href="#" className="mt-3 block line-clamp-1 text-[14px] text-[#1683e9]">{review.tour}</Link>
              <p className="mt-4 text-[14px] leading-6">{review.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-[24px] font-bold">去北美洲的常见问题</h2>
        <div className="border border-[#d9d9d9] bg-white px-5">
          {category.faqs.map((faq) => (
            <Link key={faq} href="#" className="flex h-16 items-center justify-between border-b border-[#ddd] text-[15px] font-bold last:border-b-0">
              {faq}
              <ChevronRight className="h-6 w-6 text-[#ccc]" />
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-[24px] font-bold">北美洲旅行产品类型</h2>
        <div className="flex flex-wrap gap-5 border border-[#d9d9d9] bg-white p-5 text-[16px]">
          {category.productTypes.map((type) => <Link key={type} href="#" className="hover:text-[#1683e9]">{type}</Link>)}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-[24px] font-bold">北美洲的热门行程</h2>
        <div className="flex flex-wrap gap-4 border border-[#d9d9d9] bg-white p-5">
          {category.hotItineraries.map((item) => (
            <button key={item} type="button" className="h-10 border border-[#aaa] px-5 text-[16px] hover:border-[#1683e9] hover:text-[#1683e9]">
              {item}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
