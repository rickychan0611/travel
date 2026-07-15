import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { HeroBanner } from '@/components/home/HeroBanner'
import { HomeNavTiles } from '@/components/home/HomeNavTiles'
import { SeasonMustPlay } from '@/components/home/SeasonMustPlay'
import { UsaTravelSection } from '@/components/home/UsaTravelSection'
import { CustomStories } from '@/components/home/CustomStories'
import { KnowUs } from '@/components/home/KnowUs'
import { PartnerBanner } from '@/components/home/PartnerBanner'
import { HOMEPAGE_TOUR_SECTIONS } from '@/data/tour-categories'
import { fetchProductsByQueries, localizeCollectionProducts } from '@/lib/shopify/products'

export const revalidate = 1800

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  return {
    title: t('homeTitle'),
    description: t('homeDesc'),
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const tourSections = await Promise.all(
    HOMEPAGE_TOUR_SECTIONS.map(async (section) => ({
      ...section,
      tabs: await Promise.all(
        section.tabs.map(async (tab) => ({
          ...tab,
          products: await localizeCollectionProducts(
            await fetchProductsByQueries(tab.queries, 6, 6),
            locale,
          ),
        })),
      ),
    })),
  )

  return (
    <>
      <HeroBanner locale={locale} />

      <div className="mx-auto max-w-[1200px] space-y-4 px-4 py-4 md:space-y-5 md:py-5">
        <HomeNavTiles locale={locale} />
        <SeasonMustPlay locale={locale} />
        {tourSections.map((section) => (
          <UsaTravelSection key={section.id} locale={locale} section={section} />
        ))}
        <CustomStories locale={locale} />
        <KnowUs />
        <PartnerBanner />
      </div>
    </>
  )
}
