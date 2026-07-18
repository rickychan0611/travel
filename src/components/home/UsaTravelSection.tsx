'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import { ProductCard } from '@/components/home/ProductCard'
import type { HomepageTourSection } from '@/data/tour-categories'
import { getLocalizedText } from '@/data/tour-categories'
import type { CollectionProduct } from '@/lib/shopify/types'
import styles from './UsaTravelSection.module.css'

export type HomepageTourSectionData = Omit<HomepageTourSection, 'tabs'> & {
  tabs: Array<HomepageTourSection['tabs'][number] & { products: CollectionProduct[] }>
}

export function UsaTravelSection({
  locale,
  section,
}: {
  locale: string
  section: HomepageTourSectionData
}) {
  const [activeId, setActiveId] = useState(section.tabs[0]?.id ?? '')
  const active = section.tabs.find((tab) => tab.id === activeId) ?? section.tabs[0]
  const products = active?.products.slice(0, 6) ?? []

  if (!active) return null

  return (
    <section className={styles.section}>
      <div className="mb-6 flex items-center justify-center">
        <div className="mt-10 flex items-center gap-3">
          <Image
            src={section.icon}
            alt=""
            width={52}
            height={52}
            className="h-[52px] w-[52px] object-contain"
          />
          <h2 className="text-[30px] font-bold leading-none tracking-normal text-[#202124]">
            {getLocalizedText(section.title, locale)}
          </h2>
        </div>
      </div>

      <div className="relative mb-5 flex flex-wrap items-center justify-center gap-y-2 pr-0 text-sm lg:pr-24">
        <div className="flex flex-wrap items-center justify-center gap-x-9 gap-y-2">
          {section.tabs.map((tab) => {
            const isActive = tab.id === active.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveId(tab.id)}
                className={`cursor-pointer whitespace-nowrap transition-colors ${
                  isActive ? 'text-tff-blue' : 'text-[#555] hover:text-tff-blue'
                }`}
              >
                {getLocalizedText(tab.label, locale)}
              </button>
            )
          })}
        </div>
        <Link
          href={`/${locale}${active.href || section.moreHref}` as Route}
          className="mt-1 shrink-0 cursor-pointer whitespace-nowrap text-tff-blue hover:underline lg:absolute lg:right-0 lg:top-0 lg:mt-0"
        >
          {locale === 'en' ? 'View more' : '查看更多'} &gt;
        </Link>
      </div>

      {products.length > 0 ? (
        <div className={styles.mosaic}>
          {products.map((product, index) => (
            <div
              key={product.id}
              className={index === 0 || index === 5 ? styles.featured : undefined}
            >
              <ProductCard product={product} locale={locale} featured={index === 0 || index === 5} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[220px] items-center justify-center rounded-md border border-dashed border-[#d7dce2] bg-white text-sm text-[#909399]">
          {locale === 'en' ? 'No synced Shopify products in this category yet.' : '该分类暂无已同步的 Shopify 产品。'}
        </div>
      )}
    </section>
  )
}
