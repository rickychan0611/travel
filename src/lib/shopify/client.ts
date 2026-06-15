import { createStorefrontApiClient } from '@shopify/storefront-api-client'

if (!process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN) {
  throw new Error('NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN is not set')
}
if (!process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
  throw new Error('SHOPIFY_STOREFRONT_ACCESS_TOKEN is not set')
}

export const shopifyClient = createStorefrontApiClient({
  storeDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
  apiVersion: '2026-01',
  publicAccessToken: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
})
