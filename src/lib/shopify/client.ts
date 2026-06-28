import { createStorefrontApiClient } from '@shopify/storefront-api-client'

if (!process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN) {
  throw new Error('NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN is not set')
}
if (!process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
  throw new Error('SHOPIFY_STOREFRONT_ACCESS_TOKEN is not set')
}

const _client = createStorefrontApiClient({
  storeDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
  apiVersion: '2026-01',
  privateAccessToken: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
})

// Plain (unfrozen) wrapper so vi.spyOn can replace request in tests.
// _client is Object.freeze()'d by the Shopify SDK so properties are read-only.
export const shopifyClient = {
  request: _client.request.bind(_client),
}
