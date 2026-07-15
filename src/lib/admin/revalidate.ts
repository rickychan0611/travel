import { revalidatePath, revalidateTag } from 'next/cache'
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
