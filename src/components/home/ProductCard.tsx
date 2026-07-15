'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import type { Route } from 'next'
import type { CollectionProduct } from '@/lib/shopify/types'

export function ProductCard({
  product,
  locale,
}: {
  product: CollectionProduct
  locale: string
}) {
  const t = useTranslations('product')
  const image = product.images.nodes[0]
  const isInstant = product.tags.includes('booking:instant')
  const title = product.localizedTitle ?? product.title
  const place = product.localizedPlace ?? product.productType.replace(/-/g, ' ')
  const { amount, currencyCode } = product.priceRange.minVariantPrice
  const price = parseFloat(amount).toFixed(0)
  const href = `/${locale}/tours/${product.handle}` as Route
  const isMock = product.id.startsWith('mock-')
  const resolvedHref = isMock ? (`/${locale}/tours` as Route) : href

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-md bg-white ring-1 ring-[#e8e8e8] transition hover:shadow-md">
      <Link href={resolvedHref} className="relative block aspect-4/3 shrink-0 cursor-pointer bg-[#f5f5f5]">
        {image ? (
          <Image
            src={image.url}
            alt={image.altText ?? title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[#c0c4cc]">No image</div>
        )}
        <span
          className={`absolute left-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-medium text-white ${
            isInstant ? 'bg-tff-blue' : 'bg-[#909399]'
          }`}
        >
          {isInstant ? t('instant') : t('manual')}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <p className="mb-1 text-[11px] capitalize text-[#909399]">
          {place}
        </p>
        <Link href={resolvedHref} className="cursor-pointer">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-[#303133] transition-colors group-hover:text-tff-blue">
            {title}
          </h3>
        </Link>
        <div className="mt-auto pt-3">
          <span className="text-sm text-[#909399]">{t('from')} </span>
          <span className="text-lg font-bold text-tff-orange">
            {currencyCode === 'USD' ? '$' : `${currencyCode} `}
            {price}
          </span>
          <span className="text-sm text-[#909399]">{t('perPerson')}</span>
        </div>
      </div>
    </article>
  )
}
