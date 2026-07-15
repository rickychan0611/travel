import { readFileSync } from 'fs'
import { readFile } from 'fs/promises'
import { resolve } from 'path'
import { shopifyAdminClient } from '@/lib/shopify/admin-client'

type GraphQlError = { message?: string }
type UserError = { field?: string[] | null; message: string }

type ShopifyEdge<T> = { node: T }
type ShopifyConnection<T> = {
  nodes?: T[]
  edges?: Array<ShopifyEdge<T>>
  pageInfo?: { hasNextPage: boolean; endCursor: string | null }
}

export type AdminMetafield = {
  namespace: string
  key: string
  value: string
  type: string
}

export type AdminProductListItem = {
  id: string
  numericId: string
  title: string
  handle: string
  status: string
  productType: string
  tags: string[]
  variantCount: number
  minPrice: string
  maxPrice: string
  currencyCode: string
  productCode: string
  city: string
  country: string
  bookable: boolean
  lastSyncedAt: string
  publicationName: string
  updatedAt: string
}

export type AdminMetaobject = {
  id: string
  handle: string
  type: string
  fields: Record<string, string>
}

export type AdminVariant = {
  id: string
  title: string
  sku: string
  price: string
  inventoryQuantity: number | null
  date: string
  rateType: string
}

export type AdminProductDetail = AdminProductListItem & {
  descriptionHtml: string
  vendor: string
  media: Array<{ id: string; url: string; altText: string }>
  metafields: Record<string, AdminMetafield>
  content: AdminMetaobject[]
  highlights: AdminMetaobject[]
  itineraryDays: AdminMetaobject[]
  costSections: AdminMetaobject[]
  policyNotices: AdminMetaobject[]
  pickupDropoffs: AdminMetaobject[]
  addons: AdminMetaobject[]
  departures: AdminMetaobject[]
  variants: AdminVariant[]
  adminUrl: string
}

export type AdminOrderListItem = {
  id: string
  numericId: string
  name: string
  createdAt: string
  email: string
  customerName: string
  financialStatus: string
  fulfillmentStatus: string
  total: string
  currencyCode: string
  lineItems: Array<{
    title: string
    variantTitle: string | null
    quantity: number
    customAttributes: Array<{ key: string; value: string }>
  }>
  adminUrl: string
}

const PRODUCT_FRAGMENT = `#graphql
  fragment AdminProductFields on Product {
    id
    legacyResourceId
    title
    handle
    status
    productType
    vendor
    tags
    updatedAt
    descriptionHtml
    priceRangeV2 {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
    media(first: 20) {
      nodes {
        ... on MediaImage {
          id
          image { url altText }
        }
      }
    }
    variants(first: 250) {
      nodes {
        id
        title
        sku
        price
        inventoryQuantity
        selectedOptions { name value }
        departureDate: metafield(namespace: "toursbms", key: "departure_date") { value }
      }
    }
    metafields(first: 100, namespace: "toursbms") {
      nodes { namespace key value type }
    }
    contentRefs: metafield(namespace: "toursbms", key: "content") {
      references(first: 30) { nodes { ...AdminMetaobjectFields } }
    }
    highlightRefs: metafield(namespace: "toursbms", key: "highlight") {
      references(first: 250) { nodes { ...AdminMetaobjectFields } }
    }
    itineraryDayRefs: metafield(namespace: "toursbms", key: "itinerary_day") {
      references(first: 250) { nodes { ...AdminMetaobjectFields } }
    }
    costSectionRefs: metafield(namespace: "toursbms", key: "cost_section") {
      references(first: 250) { nodes { ...AdminMetaobjectFields } }
    }
    policyNoticeRefs: metafield(namespace: "toursbms", key: "policy_notice") {
      references(first: 250) { nodes { ...AdminMetaobjectFields } }
    }
    pickupDropoffRefs: metafield(namespace: "toursbms", key: "pickup_dropoff") {
      references(first: 250) { nodes { ...AdminMetaobjectFields } }
    }
    addonRefs: metafield(namespace: "toursbms", key: "addon") {
      references(first: 250) { nodes { ...AdminMetaobjectFields } }
    }
    departureRefs: metafield(namespace: "toursbms", key: "departure") {
      references(first: 250) { nodes { ...AdminMetaobjectFields } }
    }
  }

  fragment AdminMetaobjectFields on Metaobject {
    id
    handle
    type
    fields { key value type }
  }
`

const PRODUCTS_QUERY = `#graphql
  query AdminProducts($first: Int!, $after: String, $query: String) {
    products(first: $first, after: $after, query: $query, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        id
        legacyResourceId
        title
        handle
        status
        productType
        vendor
        tags
        updatedAt
        variantsCount { count }
        priceRangeV2 {
          minVariantPrice { amount currencyCode }
          maxVariantPrice { amount currencyCode }
        }
        metafields(first: 40, namespace: "toursbms") {
          nodes { namespace key value type }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`

const PRODUCT_BY_HANDLE_QUERY = `#graphql
  ${PRODUCT_FRAGMENT}
  query AdminProductByHandle($query: String!) {
    products(first: 1, query: $query) {
      nodes { ...AdminProductFields }
    }
  }
`

const PRODUCT_SET_MUTATION = `#graphql
  mutation AdminProductSet($identifier: ProductSetIdentifiers, $input: ProductSetInput!, $synchronous: Boolean!) {
    productSet(identifier: $identifier, input: $input, synchronous: $synchronous) {
      product { id handle title status }
      productSetOperation { userErrors { field message } }
      userErrors { field message }
    }
  }
`

const PRODUCT_DELETE_MUTATION = `#graphql
  mutation AdminProductDelete($input: ProductDeleteInput!, $synchronous: Boolean!) {
    productDelete(input: $input, synchronous: $synchronous) {
      deletedProductId
      userErrors { field message }
    }
  }
`

const METAFIELDS_SET_MUTATION = `#graphql
  mutation AdminMetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { id namespace key value }
      userErrors { field message }
    }
  }
`

const METAOBJECT_UPSERT_MUTATION = `#graphql
  mutation AdminMetaobjectUpsert($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
    metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
      metaobject {
        id
        handle
        type
        fields { key value type }
      }
      userErrors { field message }
    }
  }
`

const METAOBJECT_UPDATE_MUTATION = `#graphql
  mutation AdminMetaobjectUpdate($id: ID!, $metaobject: MetaobjectUpdateInput!) {
    metaobjectUpdate(id: $id, metaobject: $metaobject) {
      metaobject { id handle }
      userErrors { field message }
    }
  }
`

const METAOBJECT_DELETE_MUTATION = `#graphql
  mutation AdminMetaobjectDelete($id: ID!) {
    metaobjectDelete(id: $id) {
      deletedId
      userErrors { field message }
    }
  }
`

const VARIANTS_BULK_UPDATE_MUTATION = `#graphql
  mutation AdminVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants { id price }
      userErrors { field message }
    }
  }
`

const VARIANTS_BULK_CREATE_MUTATION = `#graphql
  mutation AdminVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkCreate(productId: $productId, variants: $variants) {
      productVariants { id title price }
      userErrors { field message }
    }
  }
`

const VARIANTS_BULK_DELETE_MUTATION = `#graphql
  mutation AdminVariantsBulkDelete($productId: ID!, $variantsIds: [ID!]!) {
    productVariantsBulkDelete(productId: $productId, variantsIds: $variantsIds) {
      product { id }
      userErrors { field message }
    }
  }
`

const PRODUCT_CREATE_MEDIA_MUTATION = `#graphql
  mutation AdminProductCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
    productCreateMedia(productId: $productId, media: $media) {
      media {
        id
        ... on MediaImage { image { url altText } }
      }
      mediaUserErrors { field message }
      userErrors { field message }
    }
  }
`

const FILE_DELETE_MUTATION = `#graphql
  mutation AdminFileDelete($fileIds: [ID!]!) {
    fileDelete(fileIds: $fileIds) {
      deletedFileIds
      userErrors { field message }
    }
  }
`

const ORDERS_QUERY = `#graphql
  query AdminOrders($first: Int!, $query: String) {
    orders(first: $first, query: $query, sortKey: CREATED_AT, reverse: true) {
      nodes {
        id
        legacyResourceId
        name
        createdAt
        email
        displayFinancialStatus
        displayFulfillmentStatus
        currentTotalPriceSet { shopMoney { amount currencyCode } }
        customer { displayName email }
        lineItems(first: 20) {
          nodes {
            title
            variantTitle
            quantity
            customAttributes { key value }
          }
        }
      }
    }
  }
`

function assertGraphQl<T>(payload: { data?: T; errors?: unknown }, label: string): T {
  if (payload.errors) {
    const errors = Array.isArray(payload.errors) ? payload.errors as GraphQlError[] : []
    throw new Error(`${label}: ${errors.map((error) => error.message).filter(Boolean).join('; ') || JSON.stringify(payload.errors)}`)
  }
  if (!payload.data) throw new Error(`${label}: Shopify returned no data`)
  return payload.data
}

function assertUserErrors(errors: UserError[] | undefined, label: string) {
  if (errors?.length) throw new Error(`${label}: ${errors.map((error) => error.message).join('; ')}`)
}

function gidNumber(id: string) {
  return id.split('/').pop() ?? id
}

function metafieldsByKey(product: RawProduct) {
  return Object.fromEntries((product.metafields?.nodes ?? []).map((field) => [field.key, field]))
}

function metafieldValue(product: RawProduct, key: string) {
  return metafieldsByKey(product)[key]?.value ?? ''
}

function booleanValue(value: string) {
  return value === 'true' || value === '1'
}

function optionValue(variant: RawVariant, name: string) {
  return variant.selectedOptions.find((option) => option.name === name)?.value ?? ''
}

function metaobjects(connection?: RawMetaobjectConnection | null): AdminMetaobject[] {
  return (connection?.references?.nodes ?? []).map((node) => ({
    id: node.id,
    handle: node.handle,
    type: node.type,
    fields: Object.fromEntries(node.fields.map((field) => [field.key, field.value ?? ''])),
  }))
}

function shopifyAdminProductUrl(productNumericId: string) {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ?? ''
  const shop = domain.replace('.myshopify.com', '')
  return shop ? `https://admin.shopify.com/store/${shop}/products/${productNumericId}` : ''
}

function shopifyAdminOrderUrl(orderNumericId: string) {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ?? ''
  const shop = domain.replace('.myshopify.com', '')
  return shop ? `https://admin.shopify.com/store/${shop}/orders/${orderNumericId}` : ''
}

function mapProduct(product: RawProduct): AdminProductDetail {
  const metafields = metafieldsByKey(product)
  const minPrice = product.priceRangeV2?.minVariantPrice?.amount ?? '0.00'
  const maxPrice = product.priceRangeV2?.maxVariantPrice?.amount ?? minPrice
  const currencyCode = product.priceRangeV2?.minVariantPrice?.currencyCode ?? 'USD'
  const numericId = product.legacyResourceId || gidNumber(product.id)
  const variants = product.variants?.nodes ?? []
  const variantCount = product.variantsCount?.count ?? variants.length
  const publicationName = readManifestSync(product)?.publication?.name ?? ''

  return {
    id: product.id,
    numericId,
    title: product.title,
    handle: product.handle,
    status: product.status,
    productType: product.productType,
    vendor: product.vendor,
    tags: product.tags ?? [],
    variantCount,
    minPrice,
    maxPrice,
    currencyCode,
    productCode: metafieldValue(product, 'product_code'),
    city: metafieldValue(product, 'city') || metafieldValue(product, 'departure_city'),
    country: metafieldValue(product, 'country'),
    bookable: booleanValue(metafieldValue(product, 'bookable') || (variantCount > 0 ? 'true' : 'false')),
    lastSyncedAt: metafieldValue(product, 'last_synced_at') || metafieldValue(product, 'last_extracted_at'),
    publicationName,
    updatedAt: product.updatedAt,
    descriptionHtml: product.descriptionHtml ?? '',
    media: (product.media?.nodes ?? []).flatMap((node) =>
      node.image?.url ? [{ id: node.id, url: node.image.url, altText: node.image.altText ?? '' }] : [],
    ),
    metafields,
    content: metaobjects(product.contentRefs),
    highlights: metaobjects(product.highlightRefs),
    itineraryDays: metaobjects(product.itineraryDayRefs),
    costSections: metaobjects(product.costSectionRefs),
    policyNotices: metaobjects(product.policyNoticeRefs),
    pickupDropoffs: metaobjects(product.pickupDropoffRefs),
    addons: metaobjects(product.addonRefs),
    departures: metaobjects(product.departureRefs),
    variants: variants.map((variant) => ({
      id: variant.id,
      title: variant.title,
      sku: variant.sku ?? '',
      price: variant.price,
      inventoryQuantity: variant.inventoryQuantity,
      date: variant.departureDate?.value || optionValue(variant, 'Departure Date'),
      rateType: optionValue(variant, 'Rate Type') || variant.title,
    })),
    adminUrl: shopifyAdminProductUrl(numericId),
  }
}

export async function listAdminProducts(options: { q?: string; first?: number } = {}) {
  const search = options.q?.trim()
  const shopifyQuery = search ? `tag:tour AND ${search}` : 'tag:tour'
  const data = assertGraphQl<ProductsResponse>(
    await shopifyAdminClient.request(PRODUCTS_QUERY, {
      variables: { first: options.first ?? 50, after: null, query: shopifyQuery },
      cache: 'no-store',
    }),
    'Load admin products',
  )
  return (data.products?.nodes ?? []).map(mapProduct)
}

export async function getAdminProductByHandle(handle: string) {
  const data = assertGraphQl<ProductsResponse>(
    await shopifyAdminClient.request(PRODUCT_BY_HANDLE_QUERY, {
      variables: { query: `handle:${handle}` },
      cache: 'no-store',
    }),
    'Load admin product detail',
  )
  const product = data.products?.nodes?.[0]
  return product ? mapProduct(product) : null
}

export async function updateAdminProductBasic(input: {
  productId: string
  handle: string
  title: string
  status: string
  productType: string
  tags: string[]
  descriptionHtml?: string
}) {
  const data = assertGraphQl<ProductSetResponse>(
    await shopifyAdminClient.request(PRODUCT_SET_MUTATION, {
      variables: {
        identifier: { id: input.productId },
        input: {
          title: input.title,
          handle: input.handle,
          status: input.status,
          productType: input.productType,
          tags: input.tags,
          descriptionHtml: input.descriptionHtml,
        },
        synchronous: true,
      },
    }),
    'Update product',
  )
  assertUserErrors(data.productSet?.userErrors, 'Update product')
  assertUserErrors(data.productSet?.productSetOperation?.userErrors, 'Update product operation')
}

export async function createAdminProduct(input: {
  title: string
  handle: string
  productCode: string
  productType: string
  status?: string
}) {
  const tags = ['tour', 'toursbms', input.productCode ? `code:${input.productCode}` : 'manual-product'].filter(Boolean)
  const data = assertGraphQl<ProductSetResponse & { productSet?: ProductSetResponse['productSet'] & { product?: { id: string; handle: string } } }>(
    await shopifyAdminClient.request(PRODUCT_SET_MUTATION, {
      variables: {
        identifier: { handle: input.handle },
        input: {
          title: input.title,
          handle: input.handle,
          status: input.status ?? 'DRAFT',
          vendor: 'ToursBMS',
          productType: input.productType || 'Tour',
          tags,
          descriptionHtml: '',
          metafields: [
            { namespace: 'toursbms', key: 'product_code', type: 'single_line_text_field', value: input.productCode },
            { namespace: 'toursbms', key: 'bookable', type: 'boolean', value: 'false' },
            { namespace: 'toursbms', key: 'last_synced_at', type: 'date_time', value: new Date().toISOString() },
          ].filter((field) => field.value !== ''),
        },
        synchronous: true,
      },
    }),
    'Create product',
  )
  assertUserErrors(data.productSet?.userErrors, 'Create product')
  assertUserErrors(data.productSet?.productSetOperation?.userErrors, 'Create product operation')
  return data.productSet?.product
}

export async function archiveAdminProduct(productId: string) {
  const data = assertGraphQl<ProductSetResponse>(
    await shopifyAdminClient.request(PRODUCT_SET_MUTATION, {
      variables: {
        identifier: { id: productId },
        input: { status: 'ARCHIVED' },
        synchronous: true,
      },
    }),
    'Archive product',
  )
  assertUserErrors(data.productSet?.userErrors, 'Archive product')
  assertUserErrors(data.productSet?.productSetOperation?.userErrors, 'Archive product operation')
}

export async function deleteAdminProduct(productId: string) {
  const data = assertGraphQl<ProductDeleteResponse>(
    await shopifyAdminClient.request(PRODUCT_DELETE_MUTATION, {
      variables: { input: { id: productId }, synchronous: true },
    }),
    'Delete product',
  )
  assertUserErrors(data.productDelete?.userErrors, 'Delete product')
}

export async function updateProductFilterMetafields(productId: string, fields: Record<string, string | boolean | number>) {
  const metafields = Object.entries(fields).map(([key, value]) => ({
    ownerId: productId,
    namespace: 'toursbms',
    key,
    type: metafieldType(key),
    value: stringifyMetafieldValue(key, value),
  }))
  const data = assertGraphQl<MetafieldsSetResponse>(
    await shopifyAdminClient.request(METAFIELDS_SET_MUTATION, { variables: { metafields } }),
    'Update filter facts',
  )
  assertUserErrors(data.metafieldsSet?.userErrors, 'Update filter facts')
}

export async function upsertAdminMetaobject(type: string, handle: string, fields: Record<string, string | number | boolean>) {
  const data = assertGraphQl<MetaobjectUpsertResponse>(
    await shopifyAdminClient.request(METAOBJECT_UPSERT_MUTATION, {
      variables: {
        handle: { type, handle },
        metaobject: {
          fields: Object.entries(fields)
            .filter(([, value]) => value !== undefined && value !== null)
            .map(([key, value]) => ({ key, value: String(value) })),
        },
      },
    }),
    'Save content item',
  )
  assertUserErrors(data.metaobjectUpsert?.userErrors, 'Save content item')
  const node = data.metaobjectUpsert?.metaobject
  if (!node) throw new Error('Save content item: no metaobject returned')
  return {
    id: node.id,
    handle: node.handle,
    type: node.type,
    fields: Object.fromEntries(node.fields.map((field) => [field.key, field.value ?? ''])),
  }
}

export async function updateAdminMetaobject(id: string, fields: Record<string, string>) {
  const data = assertGraphQl<MetaobjectUpdateResponse>(
    await shopifyAdminClient.request(METAOBJECT_UPDATE_MUTATION, {
      variables: {
        id,
        metaobject: { fields: Object.entries(fields).map(([key, value]) => ({ key, value })) },
      },
    }),
    'Update metaobject',
  )
  assertUserErrors(data.metaobjectUpdate?.userErrors, 'Update metaobject')
}

export async function deleteAdminMetaobject(id: string) {
  const data = assertGraphQl<MetaobjectDeleteResponse>(
    await shopifyAdminClient.request(METAOBJECT_DELETE_MUTATION, { variables: { id } }),
    'Delete content item',
  )
  assertUserErrors(data.metaobjectDelete?.userErrors, 'Delete content item')
}

export async function setProductReferenceIds(productId: string, key: string, ids: string[]) {
  const data = assertGraphQl<MetafieldsSetResponse>(
    await shopifyAdminClient.request(METAFIELDS_SET_MUTATION, {
      variables: {
        metafields: [{
          ownerId: productId,
          namespace: 'toursbms',
          key,
          type: 'list.metaobject_reference',
          value: JSON.stringify(ids),
        }],
      },
    }),
    `Set ${key} references`,
  )
  assertUserErrors(data.metafieldsSet?.userErrors, `Set ${key} references`)
}

export async function updateVariantPrice(productId: string, variantId: string, price: string) {
  const data = assertGraphQl<VariantsBulkUpdateResponse>(
    await shopifyAdminClient.request(VARIANTS_BULK_UPDATE_MUTATION, {
      variables: { productId, variants: [{ id: variantId, price }] },
    }),
    'Update variant price',
  )
  assertUserErrors(data.productVariantsBulkUpdate?.userErrors, 'Update variant price')
}

export async function createDatePriceVariant(input: {
  productId: string
  date: string
  rateType: string
  price: string
  priceType?: string
  sku?: string
}) {
  const data = assertGraphQl<VariantsBulkCreateResponse>(
    await shopifyAdminClient.request(VARIANTS_BULK_CREATE_MUTATION, {
      variables: {
        productId: input.productId,
        variants: [{
          price: input.price,
          sku: input.sku || undefined,
          inventoryPolicy: 'CONTINUE',
          optionValues: [
            { optionName: 'Departure Date', name: input.date },
            { optionName: 'Rate Type', name: input.rateType },
          ],
          metafields: [
            { namespace: 'toursbms', key: 'departure_date', type: 'single_line_text_field', value: input.date },
            { namespace: 'toursbms', key: 'price_type', type: 'number_integer', value: input.priceType || '0' },
          ],
        }],
      },
    }),
    'Create date price',
  )
  assertUserErrors(data.productVariantsBulkCreate?.userErrors, 'Create date price')
}

export async function deleteDatePriceVariant(productId: string, variantId: string) {
  const data = assertGraphQl<VariantsBulkDeleteResponse>(
    await shopifyAdminClient.request(VARIANTS_BULK_DELETE_MUTATION, {
      variables: { productId, variantsIds: [variantId] },
    }),
    'Delete date price',
  )
  assertUserErrors(data.productVariantsBulkDelete?.userErrors, 'Delete date price')
}

export async function addProductImage(productId: string, sourceUrl: string, alt: string) {
  const data = assertGraphQl<ProductCreateMediaResponse>(
    await shopifyAdminClient.request(PRODUCT_CREATE_MEDIA_MUTATION, {
      variables: {
        productId,
        media: [{ originalSource: sourceUrl, alt, mediaContentType: 'IMAGE' }],
      },
    }),
    'Add product image',
  )
  assertUserErrors(data.productCreateMedia?.userErrors, 'Add product image')
  assertUserErrors(data.productCreateMedia?.mediaUserErrors, 'Add product image')
  const media = data.productCreateMedia?.media?.[0]
  return {
    id: media?.id || '',
    url: media?.image?.url || sourceUrl,
    altText: media?.image?.altText || alt,
  }
}

export async function deleteProductImage(mediaId: string) {
  const data = assertGraphQl<FileDeleteResponse>(
    await shopifyAdminClient.request(FILE_DELETE_MUTATION, { variables: { fileIds: [mediaId] } }),
    'Delete product image',
  )
  assertUserErrors(data.fileDelete?.userErrors, 'Delete product image')
}

export async function listAdminOrders(options: { q?: string; first?: number } = {}) {
  const data = assertGraphQl<OrdersResponse>(
    await shopifyAdminClient.request(ORDERS_QUERY, {
      variables: { first: options.first ?? 50, query: options.q?.trim() || null },
      cache: 'no-store',
    }),
    'Load admin orders',
  )

  return (data.orders?.nodes ?? []).map((order): AdminOrderListItem => {
    const numericId = order.legacyResourceId || gidNumber(order.id)
    return {
      id: order.id,
      numericId,
      name: order.name,
      createdAt: order.createdAt,
      email: order.email ?? order.customer?.email ?? '',
      customerName: order.customer?.displayName ?? order.email ?? 'Guest',
      financialStatus: order.displayFinancialStatus,
      fulfillmentStatus: order.displayFulfillmentStatus,
      total: order.currentTotalPriceSet.shopMoney.amount,
      currencyCode: order.currentTotalPriceSet.shopMoney.currencyCode,
      lineItems: order.lineItems.nodes,
      adminUrl: shopifyAdminOrderUrl(numericId),
    }
  })
}

export function aggregateFilterFacts(products: AdminProductListItem[]) {
  const counts = {
    countries: new Map<string, number>(),
    cities: new Map<string, number>(),
    productTypes: new Map<string, number>(),
    statuses: new Map<string, number>(),
  }
  for (const product of products) {
    increment(counts.countries, product.country || 'Missing country')
    increment(counts.cities, product.city || 'Missing city')
    increment(counts.productTypes, product.productType || 'Tour')
    increment(counts.statuses, product.bookable ? 'Bookable' : 'Content only')
  }
  return {
    countries: toCountRows(counts.countries),
    cities: toCountRows(counts.cities),
    productTypes: toCountRows(counts.productTypes),
    statuses: toCountRows(counts.statuses),
  }
}

function increment(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1)
}

function toCountRows(map: Map<string, number>) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }))
}

function metafieldType(key: string) {
  if (['duration_days'].includes(key)) return 'number_integer'
  if (['min_price', 'max_price'].includes(key)) return 'number_decimal'
  if (['bookable'].includes(key)) return 'boolean'
  if (['destinations', 'labels'].includes(key)) return 'json'
  if (['earliest_departure', 'latest_departure'].includes(key)) return 'date'
  if (['last_synced_at'].includes(key)) return 'date_time'
  return 'single_line_text_field'
}

function stringifyMetafieldValue(key: string, value: string | boolean | number) {
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (metafieldType(key) === 'json') {
    const text = String(value || '').trim()
    if (!text) return '[]'
    if (text.startsWith('[')) return text
    return JSON.stringify(text.split(',').map((item) => item.trim()).filter(Boolean))
  }
  return String(value)
}

function readManifestSync(product: RawProduct): { publication?: { name?: string } } | null {
  const code = metafieldValue(product, 'product_code')
  if (!code) return null
  try {
    return JSON.parse(readFileSync(resolve('data', 'shopify-sync', `${code}.json`), 'utf8'))
  } catch {
    return null
  }
}

export async function readSyncManifest(productCode: string) {
  try {
    return JSON.parse(await readFile(resolve('data', 'shopify-sync', `${productCode}.json`), 'utf8')) as unknown
  } catch {
    return null
  }
}

type RawMoney = { amount: string; currencyCode: string }
type RawVariant = {
  id: string
  title: string
  sku: string | null
  price: string
  inventoryQuantity: number | null
  selectedOptions: Array<{ name: string; value: string }>
  departureDate?: { value: string } | null
}
type RawMetaobject = {
  id: string
  handle: string
  type: string
  fields: Array<{ key: string; value: string | null; type: string }>
}
type RawMetaobjectConnection = { references?: { nodes: RawMetaobject[] } | null }
type RawProduct = {
  id: string
  legacyResourceId?: string
  title: string
  handle: string
  status: string
  productType: string
  vendor: string
  tags: string[]
  updatedAt: string
  descriptionHtml: string
  priceRangeV2?: { minVariantPrice: RawMoney; maxVariantPrice: RawMoney } | null
  media?: { nodes: Array<{ id: string; image?: { url: string; altText: string | null } | null }> } | null
  variants?: { nodes: RawVariant[] } | null
  variantsCount?: { count: number } | null
  metafields?: { nodes: AdminMetafield[] } | null
  contentRefs?: RawMetaobjectConnection | null
  highlightRefs?: RawMetaobjectConnection | null
  itineraryDayRefs?: RawMetaobjectConnection | null
  costSectionRefs?: RawMetaobjectConnection | null
  policyNoticeRefs?: RawMetaobjectConnection | null
  pickupDropoffRefs?: RawMetaobjectConnection | null
  addonRefs?: RawMetaobjectConnection | null
  departureRefs?: RawMetaobjectConnection | null
}
type ProductsResponse = { products?: ShopifyConnection<RawProduct> }
type ProductSetResponse = {
  productSet?: {
    product?: { id: string; handle: string }
    userErrors?: UserError[]
    productSetOperation?: { userErrors?: UserError[] }
  }
}
type ProductDeleteResponse = { productDelete?: { userErrors?: UserError[]; deletedProductId?: string } }
type MetafieldsSetResponse = { metafieldsSet?: { userErrors?: UserError[] } }
type MetaobjectUpsertResponse = {
  metaobjectUpsert?: {
    metaobject?: RawMetaobject
    userErrors?: UserError[]
  }
}
type MetaobjectUpdateResponse = { metaobjectUpdate?: { userErrors?: UserError[] } }
type MetaobjectDeleteResponse = { metaobjectDelete?: { userErrors?: UserError[] } }
type VariantsBulkUpdateResponse = { productVariantsBulkUpdate?: { userErrors?: UserError[] } }
type VariantsBulkCreateResponse = { productVariantsBulkCreate?: { userErrors?: UserError[] } }
type VariantsBulkDeleteResponse = { productVariantsBulkDelete?: { userErrors?: UserError[] } }
type ProductCreateMediaResponse = {
  productCreateMedia?: {
    media?: Array<{ id: string; image?: { url: string; altText: string | null } | null }>
    userErrors?: UserError[]
    mediaUserErrors?: UserError[]
  }
}
type FileDeleteResponse = { fileDelete?: { userErrors?: UserError[] } }
type OrdersResponse = {
  orders?: {
    nodes: Array<{
      id: string
      legacyResourceId?: string
      name: string
      createdAt: string
      email: string | null
      displayFinancialStatus: string
      displayFulfillmentStatus: string
      currentTotalPriceSet: { shopMoney: RawMoney }
      customer?: { displayName: string; email: string } | null
      lineItems: {
        nodes: Array<{
          title: string
          variantTitle: string | null
          quantity: number
          customAttributes: Array<{ key: string; value: string }>
        }>
      }
    }>
  }
}
