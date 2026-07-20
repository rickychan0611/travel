import { promises as fs } from 'fs'
import path from 'path'
import { shopifyAdminClient } from '@/lib/shopify/admin-client'
import { SHOPIFY_CACHE_REVALIDATE_SECONDS, SHOPIFY_CACHE_TAGS } from '@/lib/shopify/cache'
import { deleteAdminMetaobject, updateAdminMetaobject, upsertAdminMetaobject } from '@/lib/admin/shopify-admin'
import {
  HOMEPAGE_METAOBJECT_TYPES,
  homepageTitles,
  localizedHomepageTitle,
  parseProductIds,
  type HomepageImage,
  type HomepageMetaobjectRecord,
  type LandingPageContent,
} from '@/lib/homepage/types'
import { fetchProductsByIds } from '@/lib/shopify/products'

type UserError = { field?: string[] | null; message: string }

type MetaobjectNode = {
  id: string
  handle: string
  type: string
  fields: Array<{
    key: string
    value: string | null
    reference?: {
      id: string
      image?: { url: string; width: number; height: number; altText?: string | null } | null
      alt?: string | null
    } | null
  }>
}

export type ShopifyFileImage = HomepageImage & { status: string }

const METAOBJECTS_QUERY = `#graphql
  query HomepageMetaobjects($type: String!) {
    metaobjects(type: $type, first: 250) {
      nodes {
        id handle type
        fields {
          key value
          reference {
            ... on MediaImage {
              id alt
              image { url width height altText }
            }
          }
        }
      }
    }
  }
`

const DEFINITION_QUERY = `#graphql
  query HomepageDefinition($type: String!) {
    metaobjectDefinitionByType(type: $type) { id type fieldDefinitions { key } }
  }
`

const DEFINITION_CREATE = `#graphql
  mutation HomepageDefinitionCreate($definition: MetaobjectDefinitionCreateInput!) {
    metaobjectDefinitionCreate(definition: $definition) {
      metaobjectDefinition { id type }
      userErrors { field message }
    }
  }
`

const DEFINITION_UPDATE = `#graphql
  mutation HomepageDefinitionUpdate($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
    metaobjectDefinitionUpdate(id: $id, definition: $definition) {
      metaobjectDefinition { id type }
      userErrors { field message }
    }
  }
`

const FILES_QUERY = `#graphql
  query HomepageFiles($first: Int!, $after: String) {
    files(first: $first, after: $after, query: "media_type:IMAGE", sortKey: CREATED_AT, reverse: true) {
      nodes {
        ... on MediaImage {
          id alt fileStatus
          image { url width height altText }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`

const STAGED_UPLOADS_CREATE = `#graphql
  mutation HomepageStagedUpload($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets { url resourceUrl parameters { name value } }
      userErrors { field message }
    }
  }
`

const FILE_CREATE = `#graphql
  mutation HomepageFileCreate($files: [FileCreateInput!]!) {
    fileCreate(files: $files) {
      files {
        ... on MediaImage {
          id alt fileStatus
          image { url width height altText }
        }
      }
      userErrors { field message }
    }
  }
`

const FILES_BY_IDS = `#graphql
  query HomepageFilesByIds($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on MediaImage {
        id alt fileStatus
        image { url width height altText }
      }
    }
  }
`

type DefinitionField = [key: string, name: string, type: string, referenceType?: string]
type Definition = { type: string; name: string; fields: DefinitionField[] }

export const HOMEPAGE_DEFINITIONS: Definition[] = [
  { type: HOMEPAGE_METAOBJECT_TYPES.config, name: 'Homepage Config', fields: [['initialized', 'Initialized', 'boolean'], ['schema_version', 'Schema version', 'number_integer']] },
  { type: HOMEPAGE_METAOBJECT_TYPES.hero, name: 'Homepage Hero Slide', fields: localizedFields([['image', 'Image', 'file_reference'], ['link_enabled', 'Link banner', 'boolean'], ['category_slug', 'Category slug', 'single_line_text_field'], ['position', 'Position', 'number_integer']]) },
  { type: HOMEPAGE_METAOBJECT_TYPES.destinationGroup, name: 'Homepage Destination Group', fields: localizedFields([['position', 'Position', 'number_integer']]) },
  { type: HOMEPAGE_METAOBJECT_TYPES.destinationLink, name: 'Homepage Destination Link', fields: localizedFields([['group', 'Destination group', 'metaobject_reference', HOMEPAGE_METAOBJECT_TYPES.destinationGroup], ['category_slug', 'Category slug', 'single_line_text_field'], ['position', 'Position', 'number_integer']]) },
  { type: HOMEPAGE_METAOBJECT_TYPES.season, name: 'Homepage Seasonal Item', fields: localizedFields([['image', 'Image', 'file_reference'], ['category_slug', 'Category slug', 'single_line_text_field'], ['position', 'Position', 'number_integer']]) },
  { type: HOMEPAGE_METAOBJECT_TYPES.tourSection, name: 'Homepage Tour Section', fields: localizedFields([['position', 'Position', 'number_integer']]) },
  { type: HOMEPAGE_METAOBJECT_TYPES.tourCategory, name: 'Homepage Tour Category', fields: localizedFields([['section', 'Tour section', 'metaobject_reference', HOMEPAGE_METAOBJECT_TYPES.tourSection], ['category_slug', 'Category slug', 'single_line_text_field'], ['position', 'Position', 'number_integer'], ['products', 'Products', 'list.product_reference']]) },
]

function localizedFields(extra: DefinitionField[]): DefinitionField[] {
  return [
    ['title_en', 'Title (English)', 'single_line_text_field'],
    ['title_zh_cn', 'Title (Simplified Chinese)', 'single_line_text_field'],
    ['title_zh_tw', 'Title (Traditional Chinese)', 'single_line_text_field'],
    ...extra,
  ]
}

export function buildHomepageDefinitionField(
  [key, name, type, referenceType]: DefinitionField,
  definitionIds: ReadonlyMap<string, string>,
) {
  const validations = type === 'file_reference'
    ? [{ name: 'file_type_options', value: '["Image"]' }]
    : type === 'list.product_reference'
      ? [{ name: 'list.max', value: '6' }]
      : type === 'metaobject_reference'
        ? [{ name: 'metaobject_definition_id', value: definitionIds.get(referenceType || '') || '' }]
      : undefined
  if (type === 'metaobject_reference' && !validations?.[0]?.value) {
    throw new Error(`Homepage definition ${key} is missing its target metaobject definition`)
  }
  return { key, name, type, ...(validations ? { validations } : {}) }
}

function errorsOf(payload: unknown): UserError[] {
  if (!payload || typeof payload !== 'object') return []
  for (const value of Object.values(payload)) {
    if (value && typeof value === 'object' && Array.isArray((value as { userErrors?: unknown }).userErrors)) {
      return (value as { userErrors: UserError[] }).userErrors
    }
  }
  return []
}

function assertErrors(payload: unknown, operation: string) {
  const errors = errorsOf(payload)
  if (errors.length) throw new Error(`${operation}: ${errors.map((error) => error.message).join('; ')}`)
}

async function adminRequest<T>(query: string, variables: Record<string, unknown>, operation: string, cached = false) {
  const response = await shopifyAdminClient.request<T>(query, {
    variables,
    cache: cached ? 'force-cache' : 'no-store',
    ...(cached ? { next: { revalidate: SHOPIFY_CACHE_REVALIDATE_SECONDS, tags: [SHOPIFY_CACHE_TAGS.homepage] } } : {}),
  })
  if (response.errors) throw new Error(`${operation}: ${JSON.stringify(response.errors)}`)
  if (!response.data) throw new Error(`${operation}: Shopify returned no data`)
  assertErrors(response.data, operation)
  return response.data
}

function recordOf(node: MetaobjectNode): HomepageMetaobjectRecord {
  const fields: Record<string, string> = {}
  const images: Record<string, HomepageImage> = {}
  for (const field of node.fields) {
    fields[field.key] = field.value ?? ''
    const image = field.reference?.image
    if (field.reference?.id && image?.url) {
      images[field.key] = {
        id: field.reference.id,
        url: image.url,
        altText: image.altText || field.reference.alt || '',
        width: image.width,
        height: image.height,
      }
    }
  }
  return { id: node.id, handle: node.handle, type: node.type, fields, images }
}

export async function listHomepageMetaobjects(type: string, cached = false) {
  const data = await adminRequest<{ metaobjects?: { nodes?: MetaobjectNode[] } }>(METAOBJECTS_QUERY, { type }, `Load ${type}`, cached)
  return (data.metaobjects?.nodes ?? []).map(recordOf)
}

export async function loadHomepageRecords(cached = false) {
  const entries = await Promise.all(Object.values(HOMEPAGE_METAOBJECT_TYPES).map((type) => listHomepageMetaobjects(type, cached)))
  return entries.flat()
}

function order(record: HomepageMetaobjectRecord) {
  return Number(record.fields.position || 0)
}

export async function getLandingPageContent(locale: string, cached = true): Promise<LandingPageContent> {
  const records = await loadHomepageRecords(cached)
  const initialized = records.some((record) => record.type === HOMEPAGE_METAOBJECT_TYPES.config && record.fields.initialized === 'true')
  if (!initialized) return { initialized: false, heroSlides: [], destinationGroups: [], seasonItems: [], tourSections: [] }

  const heroSlides = records.filter((record) => record.type === HOMEPAGE_METAOBJECT_TYPES.hero).sort((a, b) => order(a) - order(b)).map((record) => ({
    id: record.id, title: localizedHomepageTitle(record.fields, locale), titles: homepageTitles(record.fields), categorySlug: record.fields.category_slug || '', linkEnabled: record.fields.link_enabled ? record.fields.link_enabled === 'true' : Boolean(record.fields.category_slug), position: order(record), image: record.images.image || null,
  }))
  const destinationLinks = records.filter((record) => record.type === HOMEPAGE_METAOBJECT_TYPES.destinationLink).map((record) => ({
    id: record.id, title: localizedHomepageTitle(record.fields, locale), titles: homepageTitles(record.fields), categorySlug: record.fields.category_slug || '', position: order(record), groupId: record.fields.group || '',
  }))
  const destinationGroups = records.filter((record) => record.type === HOMEPAGE_METAOBJECT_TYPES.destinationGroup).sort((a, b) => order(a) - order(b)).map((record) => ({
    id: record.id, title: localizedHomepageTitle(record.fields, locale), titles: homepageTitles(record.fields), position: order(record), links: destinationLinks.filter((link) => link.groupId === record.id).sort((a, b) => a.position - b.position),
  }))
  const seasonItems = records.filter((record) => record.type === HOMEPAGE_METAOBJECT_TYPES.season).sort((a, b) => order(a) - order(b)).map((record) => ({
    id: record.id, title: localizedHomepageTitle(record.fields, locale), titles: homepageTitles(record.fields), categorySlug: record.fields.category_slug || '', position: order(record), image: record.images.image || null,
  }))

  const rawCategories = records.filter((record) => record.type === HOMEPAGE_METAOBJECT_TYPES.tourCategory).sort((a, b) => order(a) - order(b))
  const allProductIds = [...new Set(rawCategories.flatMap((record) => parseProductIds(record.fields.products || '[]')))]
  const products = await fetchProductsByIds(allProductIds, locale)
  const productsById = new Map(products.map((product) => [product.id, product]))
  const categories = rawCategories.map((record) => {
    const productIds = parseProductIds(record.fields.products || '[]').slice(0, 6)
    const categoryProducts = productIds.flatMap((id) => productsById.get(id) ? [productsById.get(id)!] : [])
    const productsByCategoryId = new Map(categoryProducts.map((product) => [product.id, product]))
    return {
      id: record.id,
      title: localizedHomepageTitle(record.fields, locale),
      titles: homepageTitles(record.fields),
      categorySlug: record.fields.category_slug || '',
      position: order(record),
      sectionId: record.fields.section || '',
      productIds,
      productCodes: productIds.map((id) => productsByCategoryId.get(id)?.productCode?.value || id),
      products: categoryProducts,
      unavailableProductIds: productIds.filter((id) => !productsById.has(id)),
    }
  })
  const tourSections = records.filter((record) => record.type === HOMEPAGE_METAOBJECT_TYPES.tourSection).sort((a, b) => order(a) - order(b)).map((record) => ({
    id: record.id,
    title: localizedHomepageTitle(record.fields, locale),
    titles: homepageTitles(record.fields),
    position: order(record),
    categories: categories.filter((category) => category.sectionId === record.id),
  }))

  return { initialized, heroSlides, destinationGroups, seasonItems, tourSections }
}

export async function ensureHomepageDefinitions() {
  const definitionIds = new Map<string, string>()
  for (const definition of HOMEPAGE_DEFINITIONS) {
    const current = await adminRequest<{ metaobjectDefinitionByType?: { id: string; fieldDefinitions: Array<{ key: string }> } | null }>(DEFINITION_QUERY, { type: definition.type }, `Check ${definition.type}`)
    if (!current.metaobjectDefinitionByType) {
      const created = await adminRequest<{ metaobjectDefinitionCreate?: { metaobjectDefinition?: { id: string; type: string } | null } }>(DEFINITION_CREATE, {
        definition: {
          type: definition.type,
          name: definition.name,
          fieldDefinitions: definition.fields.map((field) => buildHomepageDefinitionField(field, definitionIds)),
          access: { storefront: 'PUBLIC_READ' },
        },
      }, `Create ${definition.type}`)
      const createdId = created.metaobjectDefinitionCreate?.metaobjectDefinition?.id
      if (!createdId) throw new Error(`Create ${definition.type}: Shopify returned no definition`)
      definitionIds.set(definition.type, createdId)
      continue
    }
    definitionIds.set(definition.type, current.metaobjectDefinitionByType.id)
    const existing = new Set(current.metaobjectDefinitionByType.fieldDefinitions.map((field) => field.key))
    const missing = definition.fields.filter(([key]) => !existing.has(key))
    if (missing.length) {
      await adminRequest(DEFINITION_UPDATE, {
        id: current.metaobjectDefinitionByType.id,
        definition: { fieldDefinitions: missing.map((field) => ({ create: buildHomepageDefinitionField(field, definitionIds) })) },
      }, `Update ${definition.type}`)
    }
  }
}

export async function saveHomepageMetaobject(type: string, id: string, handle: string, fields: Record<string, string>) {
  if (id) {
    await updateAdminMetaobject(id, fields)
    return id
  }
  return (await upsertAdminMetaobject(type, handle, fields)).id
}

export async function removeHomepageMetaobject(id: string) {
  await deleteAdminMetaobject(id)
}

function fileNode(node: { id: string; alt?: string | null; fileStatus?: string; image?: { url: string; width: number; height: number; altText?: string | null } | null } | null): ShopifyFileImage | null {
  if (!node?.id || !node.image?.url) return null
  return { id: node.id, url: node.image.url, width: node.image.width, height: node.image.height, altText: node.image.altText || node.alt || '', status: node.fileStatus || 'READY' }
}

export async function listShopifyImages(first = 24, after?: string | null) {
  const data = await adminRequest<{ files?: { nodes?: Array<Parameters<typeof fileNode>[0]>; pageInfo?: { hasNextPage: boolean; endCursor: string | null } } }>(FILES_QUERY, { first, after: after || null }, 'List Shopify images')
  return { images: (data.files?.nodes ?? []).flatMap((node) => fileNode(node) ? [fileNode(node)!] : []), pageInfo: data.files?.pageInfo || { hasNextPage: false, endCursor: null } }
}

export async function getShopifyImages(ids: string[]) {
  if (!ids.length) return []
  const data = await adminRequest<{ nodes?: Array<Parameters<typeof fileNode>[0]> }>(FILES_BY_IDS, { ids }, 'Load Shopify images')
  return (data.nodes ?? []).flatMap((node) => fileNode(node) ? [fileNode(node)!] : [])
}

async function waitForShopifyImage(id: string) {
  const attempts = 30
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const data = await adminRequest<{ nodes?: Array<Parameters<typeof fileNode>[0]> }>(FILES_BY_IDS, { ids: [id] }, 'Process Shopify image')
    const node = data.nodes?.[0] ?? null
    if (node?.fileStatus === 'FAILED') throw new Error('Create Shopify image: Shopify could not process the uploaded file')
    const image = fileNode(node)
    if (image?.status === 'READY') return image
    if (attempt < attempts - 1) await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error('Create Shopify image: Shopify is still processing the file. Please upload it again in a moment.')
}

export async function uploadImageBufferToShopify(input: { bytes: Uint8Array; filename: string; mimeType: string; alt: string }) {
  const staged = await adminRequest<{ stagedUploadsCreate?: { stagedTargets?: Array<{ url: string; resourceUrl: string; parameters: Array<{ name: string; value: string }> }> } }>(STAGED_UPLOADS_CREATE, {
    input: [{ filename: input.filename, mimeType: input.mimeType, resource: 'IMAGE', httpMethod: 'POST' }],
  }, 'Prepare image upload')
  const target = staged.stagedUploadsCreate?.stagedTargets?.[0]
  if (!target) throw new Error('Prepare image upload: Shopify returned no upload target')

  const body = new FormData()
  for (const parameter of target.parameters) body.append(parameter.name, parameter.value)
  body.append('file', new Blob([Uint8Array.from(input.bytes).buffer], { type: input.mimeType }), input.filename)
  const uploaded = await fetch(target.url, { method: 'POST', body })
  if (!uploaded.ok) throw new Error(`Upload image: storage returned ${uploaded.status}`)

  const created = await adminRequest<{ fileCreate?: { files?: Array<Parameters<typeof fileNode>[0]> } }>(FILE_CREATE, {
    files: [{ originalSource: target.resourceUrl, contentType: 'IMAGE', alt: input.alt }],
  }, 'Create Shopify image')
  const node = created.fileCreate?.files?.[0]
  if (!node?.id) throw new Error('Create Shopify image: no file returned')
  const image = fileNode(node)
  return image?.status === 'READY' ? image : waitForShopifyImage(node.id)
}

export async function uploadPublicHomepageImage(relativePath: string, alt: string) {
  const absolute = path.join(process.cwd(), 'public', relativePath.replace(/^\/+/, ''))
  const bytes = await fs.readFile(absolute)
  const extension = path.extname(relativePath).toLowerCase()
  const isWebp = bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP'
  const mimeType = isWebp ? 'image/webp' : extension === '.png' ? 'image/png' : extension === '.webp' ? 'image/webp' : 'image/jpeg'
  const filename = isWebp ? `${path.basename(relativePath, extension)}.webp` : path.basename(relativePath)
  return uploadImageBufferToShopify({ bytes, filename, mimeType, alt })
}
