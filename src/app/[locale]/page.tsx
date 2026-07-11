import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { HeroBanner } from '@/components/home/HeroBanner'
import { HomeNavTiles } from '@/components/home/HomeNavTiles'
import { SeasonMustPlay } from '@/components/home/SeasonMustPlay'
import { UsaTravelSection } from '@/components/home/UsaTravelSection'
import { CustomStories } from '@/components/home/CustomStories'
import { CruiseSection } from '@/components/home/CruiseSection'
import { KnowUs } from '@/components/home/KnowUs'
import { WhyBook } from '@/components/home/WhyBook'
import { TrustBadges } from '@/components/home/TrustBadges'
import { PartnerBanner } from '@/components/home/PartnerBanner'

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

  return (
    <>
      <HeroBanner locale={locale} />

      <div className="mx-auto max-w-[1200px] space-y-4 px-4 py-4 md:space-y-5 md:py-5">
        <HomeNavTiles locale={locale} />
        <SeasonMustPlay locale={locale} />
        <UsaTravelSection locale={locale} />
        <CustomStories locale={locale} />
        <CruiseSection locale={locale} />
        <KnowUs />
        <WhyBook />
        <TrustBadges />
        <PartnerBanner />
      </div>
    </>
  )
}
