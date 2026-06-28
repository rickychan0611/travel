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
          displayFinancialStatus
          displayFulfillmentStatus
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
    displayFinancialStatus: string
    displayFulfillmentStatus: string
    lineItems: { edges: Array<{ node: OrderLineItem }> }
  }

  return json.data.orders.edges.map((e: { node: RawOrder }) => ({
    id: e.node.id,
    name: e.node.name,
    createdAt: e.node.createdAt,
    total: e.node.totalPriceSet.shopMoney,
    financialStatus: e.node.displayFinancialStatus,
    fulfillmentStatus: e.node.displayFulfillmentStatus,
    lineItems: e.node.lineItems.edges.map((le: { node: OrderLineItem }) => le.node),
  }))
}

// ── Single-order fetch (for order confirmation page) ───────────────────────

export interface ConfirmationLineItem {
  title: string
  variantTitle: string | null
  quantity: number
  unitPrice: ShopifyMoney
  customAttributes: Array<{ key: string; value: string }>
}

export interface ConfirmationOrder {
  id: string
  name: string          // e.g. "#1042" — Shopify's display name
  email: string
  orderNumber: number   // mapped from Admin API field "number"
  financialStatus: string  // mapped from displayFinancialStatus
  total: ShopifyMoney
  lineItems: ConfirmationLineItem[]
}

const ORDER_BY_ID_QUERY = `
  query GetOrderById($id: ID!) {
    order(id: $id) {
      id
      name
      email
      number
      displayFinancialStatus
      totalPriceSet { shopMoney { amount currencyCode } }
      lineItems(first: 10) {
        nodes {
          title
          variantTitle
          quantity
          originalUnitPriceSet { shopMoney { amount currencyCode } }
          customAttributes { key value }
        }
      }
    }
  }
`

type RawConfirmationLineItem = {
  title: string
  variantTitle: string | null
  quantity: number
  originalUnitPriceSet: { shopMoney: ShopifyMoney }
  customAttributes: Array<{ key: string; value: string }>
}

type RawConfirmationOrder = {
  id: string
  name: string
  email: string
  number: number
  displayFinancialStatus: string
  totalPriceSet: { shopMoney: ShopifyMoney }
  lineItems: { nodes: RawConfirmationLineItem[] }
}

/**
 * Fetch a single Shopify order via Admin GraphQL API.
 * Accepts a numeric ID ("5678901234567") or GID ("gid://shopify/Order/...").
 * Returns null if the order does not exist.
 */
export async function getOrderById(id: string): Promise<ConfirmationOrder | null> {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN
  if (!domain || !token) throw new Error('Shopify Admin env vars not configured')

  const gid = id.startsWith('gid://') ? id : `gid://shopify/Order/${id}`

  const res = await fetch(`https://${domain}/admin/api/2026-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({ query: ORDER_BY_ID_QUERY, variables: { id: gid } }),
    cache: 'no-store',
  })

  if (!res.ok) throw new Error(`Shopify Admin API ${res.status}`)

  const json = await res.json() as {
    data: { order: RawConfirmationOrder | null }
    errors?: Array<{ message: string }>
  }
  if (json.errors) throw new Error(json.errors[0]?.message ?? 'Shopify Admin API error')

  const o = json.data.order
  if (!o) return null

  return {
    id: o.id,
    name: o.name,
    email: o.email,
    orderNumber: o.number,
    financialStatus: o.displayFinancialStatus,
    total: o.totalPriceSet.shopMoney,
    lineItems: o.lineItems.nodes.map((n) => ({
      title: n.title,
      variantTitle: n.variantTitle,
      quantity: n.quantity,
      unitPrice: n.originalUnitPriceSet.shopMoney,
      customAttributes: n.customAttributes,
    })),
  }
}
