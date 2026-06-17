import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { shopifyClient } from '@/lib/shopify/client'
import { COLLECTION_PRODUCTS_QUERY } from '@/lib/shopify/queries/product'
import { CategoryTabs } from '@/components/home/CategoryTabs'
import type { CollectionProduct } from '@/lib/shopify/types'

const INITIAL_COLLECTION = 'hot-seasonal-west-us'

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
  const t = await getTranslations('home')

  let initialProducts: CollectionProduct[] = []
  try {
    const { data } = await shopifyClient.request(COLLECTION_PRODUCTS_QUERY, {
      variables: { handle: INITIAL_COLLECTION, first: 20 },
    })
    initialProducts = (data as any)?.collection?.products?.nodes ?? []
  } catch {
    initialProducts = []
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {t('heroTitle')}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            {t('heroSubtitle')}
          </p>
        </div>
      </section>

      {/* Category tabs + product grid */}
      <section className="container mx-auto px-4 py-10">
        <CategoryTabs
          locale={locale}
          initialData={initialProducts}
          initialCollection={INITIAL_COLLECTION}
        />
      </section>
    </>
  )
}
