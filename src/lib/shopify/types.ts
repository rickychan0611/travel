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

export interface ShopifyCollection {
  id: string
  handle: string
  title: string
  products: {
    nodes: ShopifyProduct[]
  }
}
