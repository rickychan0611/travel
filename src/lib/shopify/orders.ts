export interface ShopifyMoney {
  amount: string
  currencyCode: string
}

export interface OrderLineItem {
  title: string
  variantTitle: string | null
  quantity: number
  originalTotalSet: { shopMoney: ShopifyMoney }
}

export interface Order {
  id: string
  name: string
  createdAt: string
  total: ShopifyMoney
  financialStatus: string
  fulfillmentStatus: string
  statusUrl: string
  lineItems: OrderLineItem[]
}

const ORDERS_BY_EMAIL_QUERY = `
  query GetOrdersByEmail($query: String!) {
    orders(first: 20, query: $query, sortKey: CREATED_AT, reverse: true) {
      edges {
        node {
          id
          name
          createdAt
          totalPriceSet { shopMoney { amount currencyCode } }
          financialStatus
          fulfillmentStatus
          statusUrl
          lineItems(first: 10) {
            edges {
              node {
                title
                variantTitle
                quantity
                originalTotalSet { shopMoney { amount currencyCode } }
              }
            }
          }
        }
      }
    }
  }
`

export async function getOrdersByEmail(email: string): Promise<Order[]> {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN
  if (!domain || !token) throw new Error('Shopify Admin env vars not configured')

  const res = await fetch(`https://${domain}/admin/api/2026-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({
      query: ORDERS_BY_EMAIL_QUERY,
      variables: { query: `email:${email}` },
    }),
    cache: 'no-store',
  })

  if (!res.ok) throw new Error(`Shopify Admin API ${res.status}`)

  const json = await res.json()
  if (json.errors) throw new Error(json.errors[0]?.message ?? 'Shopify Admin API error')

  type RawOrder = {
    id: string
    name: string
    createdAt: string
    totalPriceSet: { shopMoney: ShopifyMoney }
    financialStatus: string
    fulfillmentStatus: string
    statusUrl: string
    lineItems: { edges: Array<{ node: OrderLineItem }> }
  }

  return json.data.orders.edges.map((e: { node: RawOrder }) => ({
    id: e.node.id,
    name: e.node.name,
    createdAt: e.node.createdAt,
    total: e.node.totalPriceSet.shopMoney,
    financialStatus: e.node.financialStatus,
    fulfillmentStatus: e.node.fulfillmentStatus,
    statusUrl: e.node.statusUrl,
    lineItems: e.node.lineItems.edges.map((le: { node: OrderLineItem }) => le.node),
  }))
}
