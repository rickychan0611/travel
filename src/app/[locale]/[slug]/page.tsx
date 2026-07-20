import type { Metadata } from 'next'
import { CategoryPageClient } from '@/components/category/CategoryPageClient'
import { PartnerBanner } from '@/components/home/PartnerBanner'
import { CATEGORY_SLUGS, TOUR_CATEGORIES, getLocalizedText, type LocalizedText, type TourCategory } from '@/data/tour-categories'
import { routing } from '@/i18n/routing'
import { fetchTourProducts, localizeCollectionProducts } from '@/lib/shopify/products'
import { buildProductFilterOptions, filterProducts, parseProductFilterState, PRODUCT_FILTER_PAGE_SIZE } from '@/lib/shopify/product-filters'
import { decodeCatalogKeyword, matchCatalogProducts } from '@/lib/catalog-keywords'

export const revalidate = 1800

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const keyword = decodeCatalogKeyword(slug)
  const category = categoryForKeyword(keyword)

  return {
    title: `${getLocalizedText(category.title, locale)} | Tours`,
    description: getLocalizedText(category.description, locale),
  }
}

function genericDescription(keyword: string): LocalizedText {
  return {
    en: `Browse Shopify tours related to ${keyword} and refine the results with the available filters.`,
    'zh-CN': `浏览与“${keyword}”相关的 Shopify 旅游产品，并使用筛选条件缩小结果范围。`,
    'zh-TW': `瀏覽與「${keyword}」相關的 Shopify 旅遊產品，並使用篩選條件縮小結果範圍。`,
  }
}

function categoryForKeyword(keyword: string): TourCategory {
  const legacy = TOUR_CATEGORIES[keyword.toLocaleLowerCase()]
  if (legacy) return legacy
  const title: LocalizedText = { en: keyword, 'zh-CN': keyword, 'zh-TW': keyword }
  return {
    slug: keyword,
    title,
    description: genericDescription(keyword),
    queries: [],
    heroImage: '/tff/20260612074237256168449.jpg',
    tags: [],
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
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale, slug } = await params
  const keyword = decodeCatalogKeyword(slug)
  const filters = parseProductFilterState(await searchParams)
  const category = categoryForKeyword(keyword)

  const categoryProducts = matchCatalogProducts(await fetchTourProducts(5000), keyword)
  const filteredProducts = filterProducts(categoryProducts, filters)
  const total = filteredProducts.length
  const totalPages = Math.max(1, Math.ceil(total / PRODUCT_FILTER_PAGE_SIZE))
  const currentPage = Math.min(filters.page, totalPages)
  const pageStart = (currentPage - 1) * PRODUCT_FILTER_PAGE_SIZE
  const products = await localizeCollectionProducts(filteredProducts.slice(pageStart, pageStart + PRODUCT_FILTER_PAGE_SIZE), locale)

  return (
    <>
      <CategoryPageClient keyword={keyword} category={category} products={products} locale={locale} filters={{ ...filters, page: currentPage }} filterOptions={buildProductFilterOptions(categoryProducts)} total={total} totalPages={totalPages} currentPage={currentPage} />
      <PartnerBanner />
    </>
  )
}
