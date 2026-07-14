import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TourDetailPage } from '@/components/tour/TourDetailPage'
import { getToursBmsProductByHandle } from '@/lib/toursbms/load-product'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>
}): Promise<Metadata> {
  const { locale, handle } = await params
  const tour = await getToursBmsProductByHandle(handle, locale)
  if (!tour) return { title: 'Tour not found' }

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
  const tour = await getToursBmsProductByHandle(handle, locale)
  if (!tour) notFound()

  return <TourDetailPage locale={locale} tour={tour} />
}
