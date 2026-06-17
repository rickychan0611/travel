import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { shopifyClient } from '@/lib/shopify/client'
import { ALL_PRODUCTS_QUERY } from '@/lib/shopify/queries/product'
import { ToursFilter } from '@/components/tours/ToursFilter'
import type { CollectionProduct } from '@/lib/shopify/types'

const TOUR_TYPES = new Set(['group-tour', 'day-trip', 'small-group'])

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  return {
    title: t('toursTitle'),
    description: t('toursDesc'),
  }
}

export default async function ToursPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('tours')

  let products: CollectionProduct[] = []
  try {
    const { data } = await shopifyClient.request(ALL_PRODUCTS_QUERY, {
      variables: { first: 50 },
    })
    const all = (data as { products: { nodes: CollectionProduct[] } } | null)?.products?.nodes ?? []
    products = all.filter((p) => TOUR_TYPES.has(p.productType))
  } catch {
    products = []
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </div>
      <ToursFilter products={products} locale={locale} />
    </div>
  )
}
