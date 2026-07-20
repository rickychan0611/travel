'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import type { Route } from 'next'
import type { CollectionProduct } from '@/lib/shopify/types'

export function ProductCard({
  product,
  locale,
  featured = false,
}: {
  product: CollectionProduct
  locale: string
  featured?: boolean
}) {
  const t = useTranslations('product')
  const image = product.images.nodes[0]
  const title = product.localizedTitle ?? product.title
  const place = product.localizedPlace ?? product.productType.replace(/-/g, ' ')
  const { amount, currencyCode } = product.priceRange.minVariantPrice
  const price = parseFloat(amount).toFixed(0)
  const href = `/${locale}/tours/${product.handle}` as Route
  const isMock = product.id.startsWith('mock-')
  const resolvedHref = isMock ? (`/${locale}/tours` as Route) : href

  if (featured) {
    return (
      <article className="group h-[350px] overflow-hidden rounded-md bg-[#202124] ring-1 ring-[#e8e8e8] transition hover:shadow-lg">
        <Link href={resolvedHref} className="relative block h-full cursor-pointer overflow-hidden">
          {image ? (
            <Image
              src={image.url}
              alt={image.altText ?? title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-white/60">No image</div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-[68%] bg-gradient-to-t from-black/30 via-black/15 to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <p className="mb-1 text-xs capitalize text-white/75">{place}</p>
            <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-white drop-shadow-sm">
              {title}
            </h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-sm text-white/75">{t('from')}</span>
              <span className="text-2xl font-bold text-white">
                {currencyCode === 'USD' ? '$' : `${currencyCode} `}
                {price}
              </span>
              <span className="text-sm text-white/75">{t('perPerson')}</span>
            </div>
          </div>
        </Link>
      </article>
    )
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-md bg-white ring-1 ring-[#e8e8e8] transition hover:shadow-md">
      <Link href={resolvedHref} className="relative block h-[230px] shrink-0 cursor-pointer bg-[#f5f5f5]">
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
