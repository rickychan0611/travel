import { shopifyReadRequest } from './client'
import { shopifyAdminClient } from './admin-client'
import { SHOPIFY_CACHE_REVALIDATE_SECONDS, SHOPIFY_CACHE_TAGS } from './cache'
import { ALL_PRODUCTS_QUERY } from './queries/product'
import type { CollectionProduct } from './types'
import { isStorefrontSsrEnabled } from '@/lib/admin/storefront-settings'

type ProductsResponse = {
  products?: {
    nodes?: CollectionProduct[]
    pageInfo?: {
      hasNextPage: boolean
      endCursor: string | null
    }
  }
}

type ProductCardMetaobject = {
  fields: Array<{ key: string; value: string | null }>
}

type ProductCardLocalizationNode = {
  id: string
  productType?: string
  departureCity?: { value: string } | null
  returnCity?: { value: string } | null
  contentRefs?: {
    references?: {
      nodes?: ProductCardMetaobject[]
    } | null
  } | null
}

type ProductCardLocalizationResponse = {
  nodes?: Array<ProductCardLocalizationNode | null>
}

const PRODUCT_CARD_LOCALIZATION_QUERY = `#graphql
  query ProductCardLocalization($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        productType
        departureCity: metafield(namespace: "toursbms", key: "departure_city") {
          value
        }
        returnCity: metafield(namespace: "toursbms", key: "return_city") {
          value
        }
        contentRefs: metafield(namespace: "toursbms", key: "content") {
          references(first: 20) {
            nodes {
              ... on Metaobject {
                fields {
                  key
                  value
                }
              }
            }
          }
        }
      }
    }
  }
`

export type FetchProductsOptions = {
  query?: string
  first?: number
  max?: number
}

export function escapeShopifySearchValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

export function textSearchQuery(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return 'tag:tour'
  return `tag:tour AND "${escapeShopifySearchValue(trimmed)}"`
}

function fieldsOf(metaobject: ProductCardMetaobject) {
  return Object.fromEntries(metaobject.fields.map((field) => [field.key, field.value ?? '']))
}

function localizedFields(metaobjects: ProductCardMetaobject[], locale: string) {
  const fieldSets = metaobjects.map(fieldsOf)
  const exact = fieldSets.find((fields) => fields.locale === locale)
  if (exact) return exact
  const english = fieldSets.find((fields) => fields.locale === 'en')
  return english ?? fieldSets[0] ?? {}
}

function normalizedPlace(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function placeLabel(value: string, locale: string) {
  const normalized = normalizedPlace(value)
  const isTraditional = locale === 'zh-TW'
  const isChinese = locale.startsWith('zh')

  if (normalized.includes('cancun')) return isChinese ? '坎昆' : 'Cancun'
  if (normalized.includes('new york')) return isChinese ? (isTraditional ? '紐約' : '纽约') : 'New York'
  if (normalized.includes('calgary')) return isChinese ? (isTraditional ? '卡爾加里' : '卡尔加里') : 'Calgary'
  if (normalized.includes('banff')) return isChinese ? '班夫' : 'Banff'
  if (normalized.includes('yellowstone')) return isChinese ? (isTraditional ? '黃石公園' : '黄石公园') : 'Yellowstone'
  if (normalized.includes('alaska')) return isChinese ? '阿拉斯加' : 'Alaska'
  if (normalized.includes('vancouver')) return isChinese ? (isTraditional ? '溫哥華' : '温哥华') : 'Vancouver'
  if (normalized.includes('toronto')) return isChinese ? (isTraditional ? '多倫多' : '多伦多') : 'Toronto'
  if (normalized.includes('los angeles')) return isChinese ? '洛杉矶' : 'Los Angeles'
  if (normalized.includes('san francisco')) return isChinese ? (isTraditional ? '舊金山' : '旧金山') : 'San Francisco'
  if (normalized.includes('washington')) return isChinese ? (isTraditional ? '華盛頓' : '华盛顿') : 'Washington DC'
  if (normalized.includes('europe')) return isChinese ? (isTraditional ? '歐洲' : '欧洲') : 'Europe'
  if (normalized.includes('china')) return isChinese ? (isTraditional ? '中國' : '中国') : 'China'
  if (normalized.includes('peru')) return isChinese ? (isTraditional ? '秘魯' : '秘鲁') : 'Peru'
  if (normalized.includes('mexico')) return isChinese ? '墨西哥' : 'Mexico'

  return value.replace(/-/g, ' ')
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size))
  return chunks
}

export async function fetchProductsByQuery({
  query = 'tag:tour',
  first = 24,
  max = first,
}: FetchProductsOptions = {}): Promise<CollectionProduct[]> {
  const products: CollectionProduct[] = []
  let after: string | null = null

  while (products.length < max) {
    const pageSize = Math.min(first, max - products.length)
    const { data } = await shopifyReadRequest<ProductsResponse>(ALL_PRODUCTS_QUERY, {
      variables: { first: pageSize, after, query },
      tags: [SHOPIFY_CACHE_TAGS.products],
    })
    const result = data as ProductsResponse | null
    const nodes = result?.products?.nodes ?? []
    products.push(...nodes)

    const pageInfo = result?.products?.pageInfo
    if (!pageInfo?.hasNextPage || !pageInfo.endCursor || nodes.length === 0) break
    after = pageInfo.endCursor
  }

  return products
}

export async function fetchProductsByQueries(queries: string[], first = 24, max = first) {
  const byId = new Map<string, CollectionProduct>()

  for (const query of queries) {
    const products = await fetchProductsByQuery({ query, first, max })
    for (const product of products) byId.set(product.id, product)
    if (byId.size >= max) break
  }

  return [...byId.values()].slice(0, max)
}

const PRODUCTS_BY_IDS_QUERY = `#graphql
  query HomepageProductsByIds($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        productCode: metafield(namespace: "toursbms", key: "product_code") { value }
        handle
        title
        tags
        productType
        priceRange { minVariantPrice { amount currencyCode } }
        images(first: 1) { nodes { url altText } }
      }
    }
  }
`

export async function fetchProductsByIds(ids: string[], locale: string) {
  if (ids.length === 0) return []
  const { data, errors } = await shopifyReadRequest<{ nodes?: Array<CollectionProduct | null> }>(PRODUCTS_BY_IDS_QUERY, {
    variables: { ids },
    tags: [SHOPIFY_CACHE_TAGS.products, SHOPIFY_CACHE_TAGS.productCards, SHOPIFY_CACHE_TAGS.homepage],
  })
  if (errors) throw new Error(`Could not load homepage products: ${JSON.stringify(errors)}`)
  const byId = new Map((data?.nodes ?? []).filter((node): node is CollectionProduct => Boolean(node?.id)).map((node) => [node.id, node]))
  const ordered = ids.flatMap((id) => byId.get(id) ? [byId.get(id)!] : [])
  return localizeCollectionProducts(ordered, locale)
}

export async function fetchTourProducts(first = 100) {
  return fetchProductsByQuery({ query: 'tag:tour', first: Math.min(first, 100), max: first })
}

export async function localizeCollectionProducts(products: CollectionProduct[], locale: string) {
  const ids = products.map((product) => product.id).filter(Boolean)
  if (ids.length === 0) return products

  try {
    const ssrEnabled = await isStorefrontSsrEnabled()
    const byId = new Map<string, ProductCardLocalizationNode>()

    for (const idChunk of chunk(ids, 50)) {
      const { data, errors } = await shopifyAdminClient.request<ProductCardLocalizationResponse>(
        PRODUCT_CARD_LOCALIZATION_QUERY,
        {
          variables: { ids: idChunk },
          cache: ssrEnabled ? 'no-store' : 'force-cache',
          ...(ssrEnabled ? {} : {
            next: {
              revalidate: SHOPIFY_CACHE_REVALIDATE_SECONDS,
              tags: [SHOPIFY_CACHE_TAGS.products, SHOPIFY_CACHE_TAGS.productCards],
            },
          }),
        },
      )
      if (errors) throw new Error(JSON.stringify(errors))

      for (const node of data?.nodes ?? []) {
        if (node?.id) byId.set(node.id, node)
      }
    }

    return products.map((product) => {
      const meta = byId.get(product.id)
      const contentNodes = meta?.contentRefs?.references?.nodes ?? []
      const content = localizedFields(contentNodes, locale)
      const placeSource = meta?.departureCity?.value || meta?.productType || product.productType

      return {
        ...product,
        localizedTitle: content.title || product.title,
        localizedSubtitle: content.subtitle || undefined,
        localizedPlace: placeSource ? placeLabel(placeSource, locale) : undefined,
      }
    })
  } catch (error) {
    console.warn('Could not localize Shopify product cards:', error)
    return products
  }
}
