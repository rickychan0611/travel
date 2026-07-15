import type { CollectionProduct } from '@/lib/shopify/types'

export type TourFilterKey = 'all' | 'group-tour' | 'day-trip' | 'small-group'

export function matchesTourFilter(
  product: CollectionProduct,
  active: TourFilterKey,
  searchQuery: string,
) {
  const matchesType = active === 'all' || product.productType === active || product.tags.includes(`type-${active}`)
  const query = searchQuery.trim().toLowerCase()
  if (!matchesType) return false
  if (!query) return true

  const haystack = [
    product.localizedTitle,
    product.localizedSubtitle,
    product.localizedPlace,
    product.title,
    product.handle,
    product.productType,
    ...product.tags,
  ].filter(Boolean).join(' ').toLowerCase()

  return haystack.includes(query)
}

export function filterTourProducts(
  products: CollectionProduct[],
  active: TourFilterKey,
  searchQuery: string,
) {
  return products.filter((product) => matchesTourFilter(product, active, searchQuery))
}
