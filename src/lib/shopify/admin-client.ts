type GraphQlOptions = {
  variables?: Record<string, unknown>
  cache?: RequestCache
  next?: {
    revalidate?: number | false
    tags?: string[]
  }
}

export type ShopifyAdminGraphQlResponse<T> = {
  data?: T
  errors?: unknown
}

function adminApiVersion() {
  return process.env.SHOPIFY_ADMIN_API_VERSION || '2026-01'
}

export const shopifyAdminClient = {
  async request<T>(query: string, options: GraphQlOptions = {}): Promise<ShopifyAdminGraphQlResponse<T>> {
    const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
    const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN
    if (!domain || !token) throw new Error('Shopify Admin env vars not configured')

    const res = await fetch(`https://${domain}/admin/api/${adminApiVersion()}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({
        query,
        variables: options.variables ?? {},
      }),
      cache: options.cache ?? 'no-store',
      next: options.next,
    })

    if (!res.ok) throw new Error(`Shopify Admin API ${res.status}`)
    return res.json() as Promise<ShopifyAdminGraphQlResponse<T>>
  },
}
