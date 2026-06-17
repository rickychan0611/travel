import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { shopifyClient } from '@/lib/shopify/client'
import { PRODUCT_QUERY } from '@/lib/shopify/queries/product'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TourBookingPanel } from '@/components/tour/TourBookingPanel'
import type { TourProduct } from '@/lib/shopify/types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>
}): Promise<Metadata> {
  const { handle } = await params
  try {
    const { data } = await shopifyClient.request(PRODUCT_QUERY, { variables: { handle } })
    const product = (data as { product: TourProduct | null })?.product
    if (!product) return {}
    const image = product.images.nodes[0]
    const desc = product.description?.slice(0, 160) || undefined
    return {
      title: product.title,
      description: desc,
      openGraph: {
        title: product.title,
        description: desc,
        images: image ? [{ url: image.url, alt: image.altText ?? product.title }] : [],
      },
    }
  } catch {
    return {}
  }
}

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>
}) {
  const { locale, handle } = await params
  const t = await getTranslations('product')
  const tc = await getTranslations('common')

  const { data } = await shopifyClient.request(PRODUCT_QUERY, {
    variables: { handle },
  })

  const product = (data as { product: TourProduct | null })?.product
  if (!product) notFound()

  const image = product.images.nodes[0]
  const displayTags = product.tags.filter(
    (tag) => !tag.startsWith('booking:') && !tag.startsWith('tour-code:')
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back link */}
      <Link href={`/${locale}/tours`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
        ← {tc('back')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-muted rounded-xl overflow-hidden">
          {image ? (
            <Image
              src={image.url}
              alt={image.altText ?? product.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground/40 select-none">
              <span className="text-4xl">🗺️</span>
              <span className="text-sm capitalize">
                {product.productType.replace(/-/g, ' ')}
              </span>
            </div>
          )}
        </div>

        {/* Details + booking */}
        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground capitalize mb-1">
              {product.productType.replace(/-/g, ' ')}
            </p>
            <h1 className="text-2xl font-bold leading-snug">{product.title}</h1>
          </div>

          {/* Tags */}
          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {displayTags.slice(0, 8).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag.replace(/.*:/, '')}
                </Badge>
              ))}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Booking panel */}
          <TourBookingPanel
            productHandle={product.handle}
            productTitle={product.title}
            variants={product.variants.nodes}
            tags={product.tags}
          />
        </div>
      </div>
    </div>
  )
}
