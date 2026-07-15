import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CategoryPageClient } from '@/components/category/CategoryPageClient'
import { PartnerBanner } from '@/components/home/PartnerBanner'
import { CATEGORY_SLUGS, TOUR_CATEGORIES, getLocalizedText } from '@/data/tour-categories'
import { routing } from '@/i18n/routing'
import { fetchProductsByQueries, localizeCollectionProducts } from '@/lib/shopify/products'

export const revalidate = 1800

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const category = TOUR_CATEGORIES[slug]

  if (!category) return {}

  return {
    title: `${getLocalizedText(category.title, locale)} | Tours`,
    description: getLocalizedText(category.description, locale),
  }
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    CATEGORY_SLUGS.map((slug) => ({
      locale,
      slug,
    })),
  )
}

export default async function CategorySlugPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const category = TOUR_CATEGORIES[slug]

  if (!category) notFound()

  const products = await localizeCollectionProducts(
    await fetchProductsByQueries(category.queries, 48, 48),
    locale,
  )

  return (
    <>
      <CategoryPageClient category={category} products={products} locale={locale} />
      <PartnerBanner />
    </>
  )
}
