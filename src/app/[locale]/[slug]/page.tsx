import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CategoryPageClient } from '@/components/category/CategoryPageClient'
import { PartnerBanner } from '@/components/home/PartnerBanner'
import { CATEGORY_DATA_BY_SLUG } from '@/data/category-ustours'
import { routing } from '@/i18n/routing'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const category = CATEGORY_DATA_BY_SLUG[slug]

  if (!category) {
    return {}
  }

  return {
    title: `${category.title} | 途风旅游`,
    description: `${category.title}筛选、热销线路、旅行指南和游客评价。`,
  }
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    Object.keys(CATEGORY_DATA_BY_SLUG).map((slug) => ({
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
  const { slug } = await params
  const category = CATEGORY_DATA_BY_SLUG[slug]

  if (!category) {
    notFound()
  }

  return (
    <>
      <CategoryPageClient category={category} />
      <PartnerBanner />
    </>
  )
}
