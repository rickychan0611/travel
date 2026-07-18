import { revalidatePath, revalidateTag, updateTag } from 'next/cache'
import { SHOPIFY_CACHE_TAGS } from '@/lib/shopify/cache'

export function revalidateStorefrontCaches(locale?: string, handle?: string) {
  revalidateTag(SHOPIFY_CACHE_TAGS.products, 'max')
  revalidateTag(SHOPIFY_CACHE_TAGS.productCards, 'max')
  revalidateTag(SHOPIFY_CACHE_TAGS.tourProducts, 'max')

  if (locale) {
    revalidatePath(`/${locale}`)
    revalidatePath(`/${locale}/tours`)
    if (handle) revalidatePath(`/${locale}/tours/${handle}`)
  }
}

/** Immediate read-after-write invalidation. Call only from a Server Action. */
export function expireStorefrontCaches(locale?: string, handle?: string) {
  updateTag(SHOPIFY_CACHE_TAGS.products)
  updateTag(SHOPIFY_CACHE_TAGS.productCards)
  updateTag(SHOPIFY_CACHE_TAGS.tourProducts)

  if (locale) {
    revalidatePath(`/${locale}`)
    revalidatePath(`/${locale}/tours`)
    if (handle) revalidatePath(`/${locale}/tours/${handle}`)
  }
}

export function expireHomepageCaches() {
  updateTag(SHOPIFY_CACHE_TAGS.homepage)
  for (const locale of ['en', 'zh-CN', 'zh-TW']) revalidatePath(`/${locale}`)
  revalidatePath('/[locale]/admin/landing-page', 'page')
}
