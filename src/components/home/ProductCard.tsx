'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Route } from 'next'
import type { CollectionProduct } from '@/lib/shopify/types'

export function ProductCard({
  product,
  locale,
}: {
  product: CollectionProduct
  locale: string
}) {
  const t = useTranslations('product')
  const image = product.images.nodes[0]
  const isInstant = product.tags.includes('booking:instant')
  const { amount, currencyCode } = product.priceRange.minVariantPrice
  const price = parseFloat(amount).toFixed(0)
  const href = `/${locale}/tours/${product.handle}` as Route

  return (
    <Card className="h-full flex flex-col">
      {/* Image */}
      <Link href={href} className="block shrink-0">
        <div className="relative aspect-[4/3] bg-muted rounded-t-xl overflow-hidden">
          {image ? (
            <Image
              src={image.url}
              alt={image.altText ?? product.title}
              fill
              className="object-cover transition-transform hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground/40 text-sm select-none">
              No image
            </div>
          )}
          <Badge
            variant={isInstant ? 'default' : 'secondary'}
            className="absolute top-2 right-2 text-[10px]"
          >
            {isInstant ? t('instant') : t('manual')}
          </Badge>
        </div>
      </Link>

      {/* Content */}
      <CardContent className="flex-1 pt-3 pb-2">
        <p className="text-xs text-muted-foreground mb-1 capitalize">
          {product.productType.replace(/-/g, ' ')}
        </p>
        <Link href={href}>
          <h3 className="font-medium text-sm leading-snug line-clamp-2 hover:text-primary transition-colors">
            {product.title}
          </h3>
        </Link>
      </CardContent>

      {/* Footer */}
      <CardFooter className="flex items-center justify-between gap-2">
        <div className="min-w-0 leading-tight">
          <span className="text-xs text-muted-foreground">{t('from')} </span>
          <span className="text-base font-bold text-primary">
            {currencyCode} {price}
          </span>
          <span className="text-xs text-muted-foreground">{t('perPerson')}</span>
        </div>
        <Link href={href} className="shrink-0">
          <Button size="sm" variant="outline">
            {t('bookNow')}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
