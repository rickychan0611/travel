import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ToursFilter } from '@/components/tours/ToursFilter'
import { fetchProductsByQuery, localizeCollectionProducts, textSearchQuery } from '@/lib/shopify/products'

export const revalidate = 1800

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
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { locale } = await params
  const { q } = await searchParams
  const t = await getTranslations('tours')
  const initialQuery = q ?? ''
  const products = await localizeCollectionProducts(
    await fetchProductsByQuery({
      query: textSearchQuery(initialQuery),
      first: 100,
      max: 100,
    }),
    locale,
  )

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </div>
      <ToursFilter key={initialQuery} products={products} locale={locale} initialQuery={initialQuery} />
    </div>
  )
}
