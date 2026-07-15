import { createStorefrontApiClient } from '@shopify/storefront-api-client'
import { SHOPIFY_CACHE_REVALIDATE_SECONDS, SHOPIFY_CACHE_TAGS } from './cache'

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

export async function shopifyReadRequest<T>(
  query: string,
  {
    variables,
    tags = [SHOPIFY_CACHE_TAGS.products],
    revalidate = SHOPIFY_CACHE_REVALIDATE_SECONDS,
  }: {
    variables?: Record<string, unknown>
    tags?: string[]
    revalidate?: number
  } = {},
): Promise<{ data?: T; errors?: unknown }> {
  const headers = new Headers()
  for (const [key, value] of Object.entries(_client.config.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item)
    } else {
      headers.set(key, value)
    }
  }

  const response = await fetch(_client.config.apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables: variables ?? {} }),
    cache: 'force-cache',
    next: { revalidate, tags },
  })

  if (!response.ok) throw new Error(`Shopify Storefront API ${response.status}`)
  return response.json() as Promise<{ data?: T; errors?: unknown }>
}
