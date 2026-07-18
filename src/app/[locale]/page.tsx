import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { HeroBanner } from '@/components/home/HeroBanner'
import { HomeNavTiles } from '@/components/home/HomeNavTiles'
import { SeasonMustPlay } from '@/components/home/SeasonMustPlay'
import { UsaTravelSection, type HomepageTourSectionData } from '@/components/home/UsaTravelSection'
import { CustomStories } from '@/components/home/CustomStories'
import { KnowUs } from '@/components/home/KnowUs'
import { PartnerBanner } from '@/components/home/PartnerBanner'
import { HOMEPAGE_TOUR_SECTIONS } from '@/data/tour-categories'
import { fetchProductsByQueries, localizeCollectionProducts } from '@/lib/shopify/products'
import { getLandingPageContent } from '@/lib/admin/homepage-admin'
import type { LocalizedText } from '@/data/tour-categories'

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
  const managed = await getLandingPageContent(locale)
  const localized = (value: string): LocalizedText => ({ en: value, 'zh-CN': value, 'zh-TW': value })
  const tourSections: HomepageTourSectionData[] = managed.initialized
    ? managed.tourSections.filter((section) => section.categories.length > 0).map((section) => ({
        id: section.id,
        title: localized(section.title),
        icon: '/tff/usa-title-icon.png',
        moreHref: `/${section.categories[0]?.categorySlug || 'tours'}`,
        tabs: section.categories.map((category) => ({
          id: category.id,
          label: localized(category.title),
          href: `/${category.categorySlug}`,
          queries: [],
          products: category.products,
        })),
      }))
    : await Promise.all(
        HOMEPAGE_TOUR_SECTIONS.map(async (section) => ({
          ...section,
          tabs: await Promise.all(
            section.tabs.map(async (tab) => ({
              ...tab,
              products: await localizeCollectionProducts(await fetchProductsByQueries(tab.queries, 6, 6), locale),
            })),
          ),
        })),
      )

  return (
    <>
      <HeroBanner
        locale={locale}
        managedSlides={managed.initialized ? managed.heroSlides.flatMap((slide) => slide.image ? [{ id: slide.id, title: slide.title, categorySlug: slide.categorySlug, imageUrl: slide.image.url }] : []) : undefined}
        managedDestinationGroups={managed.initialized ? managed.destinationGroups.map((group) => ({ id: group.id, title: group.title, links: group.links.map((link) => ({ id: link.id, title: link.title, categorySlug: link.categorySlug })) })) : undefined}
      />

      <div className="mx-auto max-w-[1200px] space-y-4 px-4 py-4 md:space-y-5 md:py-5">
        <HomeNavTiles locale={locale} />
        <SeasonMustPlay locale={locale} managedItems={managed.initialized ? managed.seasonItems.flatMap((item) => item.image ? [{ id: item.id, title: item.title, categorySlug: item.categorySlug, imageUrl: item.image.url }] : []) : undefined} />
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
