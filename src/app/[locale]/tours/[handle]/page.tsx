import type { Metadata } from 'next'
import { TourDetailPage } from '@/components/tour/TourDetailPage'
import { getTourFallback } from '@/data/tour-detail-fallback'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>
}): Promise<Metadata> {
  const { handle } = await params
  const tour = getTourFallback(handle)
  const image = tour.gallery[0]

  return {
    title: tour.title,
    description: tour.description,
    openGraph: {
      title: tour.title,
      description: tour.description,
      images: image ? [{ url: image.src, alt: image.alt }] : [],
    },
  }
}

export default async function TourDetailRoute({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>
}) {
  const { locale, handle } = await params
  const fallback = getTourFallback(handle)

  return <TourDetailPage locale={locale} fallback={fallback} />
}
