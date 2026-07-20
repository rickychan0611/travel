import { shopifyAdminClient, type ShopifyAdminGraphQlResponse } from './admin-client'

export interface ShopifyMoney {
  amount: string
  currencyCode: string
}

export interface OrderLineItem {
  title: string
  variantTitle: string | null
  quantity: number
  originalTotalSet: { shopMoney: ShopifyMoney }
  customAttributes: Array<{ key: string; value: string }>
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

export interface OrderDetailLineItem extends ConfirmationLineItem {
  id: string
  sku: string | null
  currentQuantity: number
  total: ShopifyMoney
  image: { url: string; altText: string | null } | null
  productHandle: string | null
}

export interface CustomerOrderDetail {
  id: string
  numericId: string
  name: string
  createdAt: string
  processedAt: string
  cancelledAt: string | null
  cancelReason: string | null
  email: string
  financialStatus: string
  fulfillmentStatus: string
  subtotal: ShopifyMoney
  discounts: ShopifyMoney
  taxes: ShopifyMoney
  total: ShopifyMoney
  refunded: ShopifyMoney
  paymentGatewayNames: string[]
  lineItems: OrderDetailLineItem[]
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
                customAttributes { key value }
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

const CUSTOMER_ORDER_DETAIL_QUERY = `
  query GetCustomerOrderDetail($id: ID!) {
    order(id: $id) {
      id
      legacyResourceId
      name
      createdAt
      processedAt
      cancelledAt
      cancelReason
      displayFinancialStatus
      displayFulfillmentStatus
      paymentGatewayNames
      currentSubtotalPriceSet { shopMoney { amount currencyCode } }
      currentTotalDiscountsSet { shopMoney { amount currencyCode } }
      currentTotalTaxSet { shopMoney { amount currencyCode } }
      currentTotalPriceSet { shopMoney { amount currencyCode } }
      totalRefundedSet { shopMoney { amount currencyCode } }
      lineItems(first: 50) {
        nodes {
          id
          title
          variantTitle
          sku
          quantity
          currentQuantity
          originalUnitPriceSet { shopMoney { amount currencyCode } }
          discountedTotalSet { shopMoney { amount currencyCode } }
          customAttributes { key value }
          image { url altText }
          product { handle }
        }
      }
    }
  }
`

type RawCustomerOrderDetail = {
  id: string
  legacyResourceId: string
  name: string
  createdAt: string
  processedAt: string
  cancelledAt: string | null
  cancelReason: string | null
  displayFinancialStatus: string
  displayFulfillmentStatus: string
  paymentGatewayNames: string[]
  currentSubtotalPriceSet: { shopMoney: ShopifyMoney }
  currentTotalDiscountsSet: { shopMoney: ShopifyMoney }
  currentTotalTaxSet: { shopMoney: ShopifyMoney }
  currentTotalPriceSet: { shopMoney: ShopifyMoney }
  totalRefundedSet: { shopMoney: ShopifyMoney }
  lineItems: {
    nodes: Array<{
      id: string
      title: string
      variantTitle: string | null
      sku: string | null
      quantity: number
      currentQuantity: number
      originalUnitPriceSet: { shopMoney: ShopifyMoney }
      discountedTotalSet: { shopMoney: ShopifyMoney }
      customAttributes: Array<{ key: string; value: string }>
      image: { url: string; altText: string | null } | null
      product: { handle: string } | null
    }>
  }
}

const CUSTOMER_ORDER_IDS_QUERY = `
  query GetCustomerOrderIds($query: String!, $after: String) {
    orders(first: 250, after: $after, query: $query, sortKey: CREATED_AT, reverse: true) {
      nodes { id }
      pageInfo { hasNextPage endCursor }
    }
  }
`

type CustomerOrderIdsResponse = {
  orders: {
    nodes: Array<{ id: string }>
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
  }
}

async function customerOwnsOrder(numericId: string, authenticatedEmail: string) {
  const escapedEmail = authenticatedEmail.trim().replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  let after: string | null = null

  do {
    const response: ShopifyAdminGraphQlResponse<CustomerOrderIdsResponse> = await shopifyAdminClient.request<CustomerOrderIdsResponse>(CUSTOMER_ORDER_IDS_QUERY, {
      variables: { query: `email:"${escapedEmail}"`, after },
      cache: 'no-store',
    })
    if (response.errors) {
      const message = Array.isArray(response.errors)
        ? response.errors.map((error: unknown) => (error as { message?: string }).message).filter(Boolean).join('; ')
        : JSON.stringify(response.errors)
      throw new Error(message || 'Shopify Admin API error')
    }

    const orderConnection: CustomerOrderIdsResponse['orders'] | undefined = response.data?.orders
    if (!orderConnection) return false
    if (orderConnection.nodes.some((order: { id: string }) => order.id === `gid://shopify/Order/${numericId}`)) return true
    after = orderConnection.pageInfo.hasNextPage ? orderConnection.pageInfo.endCursor : null
  } while (after)

  return false
}

/**
 * Loads one order and returns it only when it belongs to the authenticated email.
 * This ownership check is required even though the route is protected by Clerk.
 */
export async function getCustomerOrderDetail(id: string, authenticatedEmail: string): Promise<CustomerOrderDetail | null> {
  const numericId = id.startsWith('gid://') ? id.split('/').pop() ?? '' : id.trim()
  if (!/^\d+$/.test(numericId) || !authenticatedEmail.trim()) return null
  if (!await customerOwnsOrder(numericId, authenticatedEmail)) return null

  const response = await shopifyAdminClient.request<{ order: RawCustomerOrderDetail | null }>(
    CUSTOMER_ORDER_DETAIL_QUERY,
    {
      variables: { id: `gid://shopify/Order/${numericId}` },
      cache: 'no-store',
    },
  )

  if (response.errors) {
    const message = Array.isArray(response.errors)
      ? response.errors.map((error) => (error as { message?: string }).message).filter(Boolean).join('; ')
      : JSON.stringify(response.errors)
    throw new Error(message || 'Shopify Admin API error')
  }

  const order = response.data?.order
  if (!order) return null

  return {
    id: order.id,
    numericId: order.legacyResourceId || numericId,
    name: order.name,
    createdAt: order.createdAt,
    processedAt: order.processedAt,
    cancelledAt: order.cancelledAt,
    cancelReason: order.cancelReason,
    email: authenticatedEmail.trim().toLowerCase(),
    financialStatus: order.displayFinancialStatus,
    fulfillmentStatus: order.displayFulfillmentStatus,
    subtotal: order.currentSubtotalPriceSet.shopMoney,
    discounts: order.currentTotalDiscountsSet.shopMoney,
    taxes: order.currentTotalTaxSet.shopMoney,
    total: order.currentTotalPriceSet.shopMoney,
    refunded: order.totalRefundedSet.shopMoney,
    paymentGatewayNames: order.paymentGatewayNames ?? [],
    lineItems: order.lineItems.nodes.map((item) => ({
      id: item.id,
      title: item.title,
      variantTitle: item.variantTitle,
      sku: item.sku,
      quantity: item.quantity,
      currentQuantity: item.currentQuantity,
      unitPrice: item.originalUnitPriceSet.shopMoney,
      total: item.discountedTotalSet.shopMoney,
      customAttributes: item.customAttributes,
      image: item.image,
      productHandle: item.product?.handle ?? null,
    })),
  }
}
