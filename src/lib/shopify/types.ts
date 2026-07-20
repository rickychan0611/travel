export interface ShopifyProduct {
  id: string
  handle: string
  title: string
  description: string
  tags: string[]
  productType: string
  vendor: string
  images: {
    nodes: Array<{ url: string; altText: string | null }>
  }
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: string }
  }
  metafields: Array<{ key: string; value: string; type: string } | null>
}

// Lighter type returned by COLLECTION_PRODUCTS_QUERY (no description/vendor/metafields)
export interface CollectionProduct {
  id: string
  productCode?: { value: string } | null
  handle: string
  title: string
  localizedTitle?: string
  localizedSubtitle?: string
  localizedPlace?: string
  tags: string[]
  productType: string
  searchAliases?: { value: string } | null
  filterFacets?: { value: string } | null
  durationDays?: { value: string } | null
  departureCity?: { value: string } | null
  returnCity?: { value: string } | null
  country?: { value: string } | null
  destinations?: { value: string } | null
  filterLabels?: { value: string } | null
  earliestDeparture?: { value: string } | null
  latestDeparture?: { value: string } | null
  availabilitySummary?: { value: string } | null
  filterProductType?: { value: string } | null
  confirmMethod?: { value: string } | null
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: string }
  }
  images: {
    nodes: Array<{ url: string; altText: string | null }>
  }
}

export interface ProductVariant {
  id: string
  title: string
  availableForSale: boolean
  quantityAvailable: number | null
  price: { amount: string; currencyCode: string }
  selectedOptions: Array<{ name: string; value: string }>
}

// Full product returned by PRODUCT_QUERY (used on PDP)
export interface TourProduct {
  id: string
  handle: string
  title: string
  description: string
  tags: string[]
  productType: string
  vendor: string
  images: { nodes: Array<{ url: string; altText: string | null }> }
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } }
  variants: { nodes: ProductVariant[] }
}

export interface ShopifyCollection {
  id: string
  handle: string
  title: string
  products: {
    nodes: CollectionProduct[]
  }
}
