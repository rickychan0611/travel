#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { dirname, resolve } from 'path'
import { spawnSync } from 'child_process'
import {
  DEFAULT_LOCALES,
  LOCALE_TO_TOURSBMS_LANG,
  METAOBJECT_DEFINITIONS,
  buildAddonVariantMetafields,
  buildAddonProductPayload,
  buildDryRunPayload,
  buildManifestSkeleton,
  buildMetaobjectEntries,
  buildProductPayload,
  buildProductImages,
  buildTourVariantMetafields,
  buildTourVariants,
  getProductCode,
  getProductHandle,
  moneyValue,
  nonShippableInventoryItemInput,
} from './lib/toursbms-shopify-sync.mjs'

const DEFAULT_API_VERSION = '2026-01'
const SHOPIFY_VARIANT_LIMIT = 2048

function usage() {
  console.log(`Usage:
  node scripts/sync-toursbms-shopify.mjs --ids P00002834,P00003545 [options]
  node scripts/sync-toursbms-shopify.mjs --ids ids.txt --locales en,zh-CN,zh-TW --apply --publish headless

Options:
  --ids <list|file>       Comma-separated product codes or a file containing codes.
  --locales <list>        Locales to extract/sync. Defaults to en,zh-CN,zh-TW.
  --currency <code>       Currency for ToursBMS extraction. Defaults to USD.
  --start <YYYY-MM-DD>    Availability extraction start date.
  --end <YYYY-MM-DD>      Availability extraction end date.
  --out-dir <path>        Extracted JSON directory. Defaults to data/toursbms-products.
  --skip-extract          Use existing JSON files.
  --skip-upload           Extract and build payloads only.
  --dry-run               Do not write Shopify. Default unless --apply is provided.
  --apply                 Write to Shopify Admin API.
  --publish <handle>      Publish to publication whose name/handle includes this value, e.g. headless.
  --list-publications     Print available Shopify publication names/IDs and exit.
  --status <status>       Shopify product status. Defaults to DRAFT, or ACTIVE when publishing.
  --overwrite-from-toursbms
                         Replace editable Shopify product/content fields from ToursBMS. Defaults to preserving them on reruns.
  --help                  Show this help.
`)
}

function parseArgs(argv) {
  const args = {
    ids: [],
    locales: DEFAULT_LOCALES,
    currency: 'USD',
    start: null,
    end: null,
    outDir: 'data/toursbms-products',
    skipExtract: false,
    skipUpload: false,
    apply: false,
    dryRun: true,
    publish: null,
    listPublications: false,
    status: null,
    overwriteFromToursbms: false,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--help' || arg === '-h') args.help = true
    else if (arg === '--ids') args.ids = parseIds(argv[++i])
    else if (arg === '--locales') args.locales = splitList(argv[++i])
    else if (arg === '--currency') args.currency = String(argv[++i] || '').toUpperCase()
    else if (arg === '--start') args.start = argv[++i]
    else if (arg === '--end') args.end = argv[++i]
    else if (arg === '--out-dir') args.outDir = argv[++i]
    else if (arg === '--skip-extract') args.skipExtract = true
    else if (arg === '--skip-upload') args.skipUpload = true
    else if (arg === '--dry-run') {
      args.dryRun = true
      args.apply = false
    } else if (arg === '--apply') {
      args.apply = true
      args.dryRun = false
    } else if (arg === '--publish') args.publish = argv[++i]
    else if (arg === '--list-publications') args.listPublications = true
    else if (arg === '--status') args.status = String(argv[++i] || '').toUpperCase()
    else if (arg === '--overwrite-from-toursbms') args.overwriteFromToursbms = true
    else if (!arg.startsWith('--')) args.ids.push(...parseIds(arg))
    else throw new Error(`Unknown option: ${arg}`)
  }

  args.ids = [...new Set(args.ids.map((id) => id.trim().toUpperCase()).filter(Boolean))]
  args.locales = [...new Set(args.locales)]
  if (!args.help && !args.listPublications && args.ids.length === 0) throw new Error('Missing --ids P00002834')
  if (!args.status) args.status = args.publish ? 'ACTIVE' : 'DRAFT'
  return args
}

function splitList(value = '') {
  return String(value).split(',').map((item) => item.trim()).filter(Boolean)
}

function parseIds(value = '') {
  const input = String(value).trim()
  if (!input) return []
  const filePath = resolve(input)
  if (!input.includes(',') && existsSync(filePath)) {
    return readFileSync(filePath, 'utf8')
      .split(/[\s,]+/)
      .map((item) => item.trim())
      .filter((item) => item && !item.startsWith('#'))
  }
  return splitList(input)
}

function loadEnv() {
  const env = { ...process.env }
  for (const file of ['.env.local', '.env']) {
    const filePath = resolve(file)
    if (!existsSync(filePath)) continue
    for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const index = trimmed.indexOf('=')
      if (index === -1) continue
      const key = trimmed.slice(0, index).trim()
      const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '')
      if (!(key in env)) env[key] = value
    }
  }
  return env
}

function extractionPath(outDir, productCode, locale) {
  return resolve(outDir, productCode, `${locale}.json`)
}

function compatibilityPath(outDir, productCode) {
  return resolve(outDir, `${productCode}.json`)
}

function syncManifestPath(productCode) {
  return resolve('data', 'shopify-sync', `${productCode}.json`)
}

async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'))
  } catch {
    return fallback
  }
}

async function writeJson(filePath, value) {
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function extractProduct(productCode, locale, args) {
  const lang = LOCALE_TO_TOURSBMS_LANG[locale]
  if (!lang) throw new Error(`No ToursBMS language mapping for locale ${locale}`)

  const out = extractionPath(args.outDir, productCode, locale)
  const command = [
    'scripts/product-extract.mjs',
    productCode,
    '--lang',
    String(lang),
    '--currency',
    args.currency,
    '--out',
    out,
  ]
  if (args.start) command.push('--start', args.start)
  if (args.end) command.push('--end', args.end)

  console.log(`Extracting ${productCode} ${locale} -> ${out}`)
  const result = spawnSync(process.execPath, command, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  if (result.status !== 0) {
    throw new Error(`ToursBMS extraction failed for ${productCode} ${locale}`)
  }
  return out
}

async function loadLocalizedJson(productCode, args) {
  const jsonByLocale = {}
  for (const locale of args.locales) {
    const filePath = extractionPath(args.outDir, productCode, locale)
    let json = await readJson(filePath)
    if (!json && locale === 'en') {
      json = await readJson(compatibilityPath(args.outDir, productCode))
    }
    if (!json) throw new Error(`Missing extracted JSON: ${filePath}`)
    jsonByLocale[locale] = json
  }
  return jsonByLocale
}

function assertShopifyEnv(env, apply) {
  if (!apply) return
  const missing = ['NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN', 'SHOPIFY_ADMIN_ACCESS_TOKEN'].filter((key) => !env[key])
  if (missing.length > 0) throw new Error(`Missing ${missing.join(', ')} in .env.local or environment`)
}

class ShopifyAdminClient {
  constructor(env) {
    this.domain = env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
    this.token = env.SHOPIFY_ADMIN_ACCESS_TOKEN
    this.apiVersion = env.SHOPIFY_ADMIN_API_VERSION || DEFAULT_API_VERSION
    this.endpoint = `https://${this.domain}/admin/api/${this.apiVersion}/graphql.json`
  }

  async request(query, variables = {}) {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this.token,
      },
      body: JSON.stringify({ query, variables }),
    })
    const text = await response.text()
    let json
    try {
      json = JSON.parse(text)
    } catch {
      throw new Error(`Shopify returned non-JSON ${response.status}: ${text.slice(0, 500)}`)
    }
    if (!response.ok || json.errors) {
      throw new Error(`Shopify GraphQL error ${response.status}: ${JSON.stringify(json.errors || json)}`)
    }
    return json.data
  }
}

function userErrorsOf(payload) {
  if (!payload || typeof payload !== 'object') return []
  return Object.values(payload).flatMap((value) => [
    ...(Array.isArray(value?.userErrors) ? value.userErrors : []),
    ...(Array.isArray(value?.mediaUserErrors) ? value.mediaUserErrors : []),
  ])
}

function assertNoUserErrors(payload, label) {
  const errors = userErrorsOf(payload)
  if (errors.length > 0) throw new Error(`${label}: ${errors.map((error) => error.message).join('; ')}`)
}

const PRODUCT_SET_MUTATION = `#graphql
mutation ProductSet($identifier: ProductSetIdentifiers, $input: ProductSetInput!, $synchronous: Boolean!) {
  productSet(identifier: $identifier, input: $input, synchronous: $synchronous) {
    product {
      id
      handle
      media(first: 250) {
        nodes {
          id
          alt
        }
      }
    }
    productSetOperation {
      id
      status
      userErrors { code field message }
    }
    userErrors { code field message }
  }
}`

const PRODUCT_VARIANTS_QUERY = `#graphql
query ProductVariants($id: ID!, $after: String) {
  product(id: $id) {
    variants(first: 250, after: $after) {
      nodes {
        id
        sku
        selectedOptions { name value }
        inventoryItem {
          id
          requiresShipping
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}`

const INVENTORY_ITEM_UPDATE_MUTATION = `#graphql
mutation InventoryItemUpdate($id: ID!, $input: InventoryItemInput!) {
  inventoryItemUpdate(id: $id, input: $input) {
    inventoryItem { id requiresShipping }
    userErrors { field message }
  }
}`

const EXISTING_PRODUCT_QUERY = `#graphql
query ExistingProduct($id: ID!) {
  product(id: $id) {
    id
    title
    handle
    descriptionHtml
    vendor
    productType
    tags
    status
  }
}`

const METAFIELDS_SET_MUTATION = `#graphql
mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) {
    metafields { id namespace key value }
    userErrors { code field message }
  }
}`

const METAFIELD_DEFINITION_QUERY = `#graphql
query MetafieldDefinition($identifier: MetafieldDefinitionIdentifierInput!) {
  metafieldDefinition(identifier: $identifier) {
    id
    namespace
    key
    ownerType
  }
}`

const METAFIELD_DEFINITION_CREATE = `#graphql
mutation MetafieldDefinitionCreate($definition: MetafieldDefinitionInput!) {
  metafieldDefinitionCreate(definition: $definition) {
    createdDefinition {
      id
      namespace
      key
      ownerType
    }
    userErrors { code field message }
  }
}`

const METAOBJECT_DEFINITION_QUERY = `#graphql
query MetaobjectDefinition($type: String!) {
  metaobjectDefinitionByType(type: $type) {
    id
    type
    fieldDefinitions { key }
  }
}`

const METAOBJECT_DEFINITION_UPDATE = `#graphql
mutation MetaobjectDefinitionUpdate($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
  metaobjectDefinitionUpdate(id: $id, definition: $definition) {
    metaobjectDefinition { id type fieldDefinitions { key } }
    userErrors { code field message }
  }
}`

const METAOBJECT_DEFINITION_CREATE = `#graphql
mutation MetaobjectDefinitionCreate($definition: MetaobjectDefinitionCreateInput!) {
  metaobjectDefinitionCreate(definition: $definition) {
    metaobjectDefinition { id type }
    userErrors { code field message }
  }
}`

const METAOBJECT_UPSERT = `#graphql
mutation MetaobjectUpsert($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
  metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
    metaobject { id handle type }
    userErrors { code field message }
  }
}`

const PUBLICATIONS_QUERY = `#graphql
query Publications {
  publications(first: 50) {
    nodes { id name }
  }
}`

const PUBLISH_MUTATION = `#graphql
mutation PublishablePublish($id: ID!, $input: [PublicationInput!]!) {
  publishablePublish(id: $id, input: $input) {
    publishable { ... on Product { id } }
    userErrors { field message }
  }
}`

const FILE_CREATE_MUTATION = `#graphql
mutation FileCreate($files: [FileCreateInput!]!) {
  fileCreate(files: $files) {
    files {
      id
      alt
      fileStatus
      ... on MediaImage { image { url } }
    }
    userErrors { code field message }
  }
}`

const PRODUCT_CREATE_MEDIA_MUTATION = `#graphql
mutation ProductCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
  productCreateMedia(productId: $productId, media: $media) {
    media {
      id
      alt
      mediaContentType
      status
      ... on MediaImage { image { url } }
    }
    mediaUserErrors { code field message }
    product { id }
  }
}`

function toProductSetInput(payload, variants) {
  const departureDates = [...new Set(variants.map((variant) => variant.date))]
  const rateTypes = [...new Set(variants.map((variant) => variant.label))]
  const input = {
    title: payload.title,
    handle: payload.handle,
    descriptionHtml: payload.descriptionHtml,
    vendor: payload.vendor,
    productType: payload.productType,
    tags: payload.tags,
    status: payload.status,
    metafields: payload.metafields,
  }

  if (variants.length === 0) return input

  return {
    ...input,
    productOptions: [
      { name: 'Departure Date', position: 1, values: departureDates.map((name) => ({ name })) },
      { name: 'Rate Type', position: 2, values: rateTypes.map((name) => ({ name })) },
    ],
    variants: variants.map((variant) => ({
      sku: variant.sku,
      price: variant.price,
      inventoryPolicy: variant.inventoryPolicy,
      inventoryItem: nonShippableInventoryItemInput(),
      optionValues: [
        { optionName: 'Departure Date', name: variant.date },
        { optionName: 'Rate Type', name: variant.label },
      ],
    })),
  }
}

function toAddonProductSetInput(payload) {
  const variants = payload.variants.length > 0
    ? payload.variants
    : [{ name: 'No chargeable add-ons', price: '0.00', sku: `${payload.handle}-NONE`.toUpperCase(), code: 'NONE' }]
  const nameCounts = variants.reduce((counts, addon) => {
    const name = addon.name || addon.code
    counts.set(name, (counts.get(name) || 0) + 1)
    return counts
  }, new Map())
  const variantsWithOptionNames = variants.map((addon) => {
    const name = addon.name || addon.code
    const optionName = nameCounts.get(name) > 1 ? `${name} (${addon.code})` : name
    return { ...addon, optionName }
  })
  return {
    title: payload.title,
    handle: payload.handle,
    descriptionHtml: payload.descriptionHtml,
    vendor: payload.vendor,
    productType: payload.productType,
    tags: payload.tags,
    status: payload.status,
    productOptions: [
      { name: 'Add-on', position: 1, values: variantsWithOptionNames.map((addon) => ({ name: addon.optionName })) },
    ],
    variants: variantsWithOptionNames.map((addon) => ({
      sku: addon.sku,
      price: moneyValue(addon.price),
      inventoryPolicy: 'CONTINUE',
      inventoryItem: nonShippableInventoryItemInput(),
      optionValues: [{ optionName: 'Add-on', name: addon.optionName }],
    })),
    metafields: [
      { namespace: 'toursbms', key: 'hidden_addon_product', type: 'boolean', value: 'true' },
    ],
  }
}

async function productSet(client, input, label) {
  const data = await client.request(PRODUCT_SET_MUTATION, {
    identifier: { handle: input.handle },
    input,
    synchronous: true,
  })
  assertNoUserErrors(data, label)
  const operationErrors = data.productSet?.productSetOperation?.userErrors || []
  if (operationErrors.length > 0) {
    throw new Error(`${label}: ${operationErrors.map((error) => error.message).join('; ')}`)
  }
  const product = data.productSet?.product
  if (!product?.id) throw new Error(`${label}: no product returned`)
  return product
}

async function fetchAllProductVariants(client, productId) {
  const variants = []
  let after = null

  do {
    const data = await client.request(PRODUCT_VARIANTS_QUERY, { id: productId, after })
    const connection = data.product?.variants
    variants.push(...(connection?.nodes || []))
    after = connection?.pageInfo?.hasNextPage ? connection.pageInfo.endCursor : null
  } while (after)

  return variants
}

async function setSyncedVariantMetafields(client, desiredVariants, syncedVariants, buildMetafields, label) {
  const syncedBySku = new Map(syncedVariants.map((variant) => [variant.sku, variant]))
  const metafields = desiredVariants.flatMap((variant) => {
    const synced = syncedBySku.get(variant.sku)
    return synced?.id ? buildMetafields(synced.id, variant) : []
  })

  for (let i = 0; i < metafields.length; i += 25) {
    const data = await client.request(METAFIELDS_SET_MUTATION, { metafields: metafields.slice(i, i + 25) })
    assertNoUserErrors(data, label)
  }
}

async function ensureVariantsDoNotRequireShipping(client, variants, label) {
  for (const variant of variants) {
    if (!variant.inventoryItem?.id || variant.inventoryItem.requiresShipping === false) continue
    const data = await client.request(INVENTORY_ITEM_UPDATE_MUTATION, {
      id: variant.inventoryItem.id,
      input: nonShippableInventoryItemInput(),
    })
    assertNoUserErrors(data, label)
  }
}

async function fetchExistingProduct(client, productId) {
  if (!productId) return null
  const data = await client.request(EXISTING_PRODUCT_QUERY, { id: productId })
  return data.product || null
}

function preserveEditableProductFields(payload, existingProduct, status) {
  if (!existingProduct?.id) return payload
  return {
    ...payload,
    title: existingProduct.title || payload.title,
    handle: existingProduct.handle || payload.handle,
    descriptionHtml: existingProduct.descriptionHtml || payload.descriptionHtml,
    vendor: existingProduct.vendor || payload.vendor,
    productType: existingProduct.productType || payload.productType,
    tags: Array.isArray(existingProduct.tags) && existingProduct.tags.length > 0
      ? [...new Set([...existingProduct.tags, ...payload.tags.filter((tag) => tag.startsWith('code:') || tag.startsWith('group:') || tag === 'tour' || tag === 'toursbms')])]
      : payload.tags,
    status,
  }
}

async function ensureMetaobjectDefinitions(client) {
  const result = {}
  for (const definition of METAOBJECT_DEFINITIONS) {
    const existing = await client.request(METAOBJECT_DEFINITION_QUERY, { type: definition.type })
    if (existing.metaobjectDefinitionByType?.id) {
      const existingDefinition = existing.metaobjectDefinitionByType
      const existingKeys = new Set((existingDefinition.fieldDefinitions || []).map((field) => field.key))
      const missingFields = definition.fields.filter(([key]) => !existingKeys.has(key))
      if (missingFields.length > 0) {
        const updated = await client.request(METAOBJECT_DEFINITION_UPDATE, {
          id: existingDefinition.id,
          definition: { fieldDefinitions: missingFields.map(([key, name, type]) => ({ create: { key, name, type } })) },
        })
        assertNoUserErrors(updated, `Update metaobject definition ${definition.type}`)
      }
      result[definition.type] = existingDefinition.id
      continue
    }

    const createInput = {
      type: definition.type,
      name: definition.name,
      fieldDefinitions: definition.fields.map(([key, name, type]) => ({ key, name, type })),
      access: { storefront: 'PUBLIC_READ' },
      capabilities: { publishable: { enabled: true }, translatable: { enabled: true } },
    }
    const created = await client.request(METAOBJECT_DEFINITION_CREATE, { definition: createInput })
    assertNoUserErrors(created, `Create metaobject definition ${definition.type}`)
    result[definition.type] = created.metaobjectDefinitionCreate?.metaobjectDefinition?.id
  }
  return result
}

async function ensureProductReferenceMetafieldDefinitions(client, metaobjectDefinitionIds) {
  const result = {}

  for (const [metaobjectType, metaobjectDefinitionId] of Object.entries(metaobjectDefinitionIds)) {
    if (!metaobjectDefinitionId) continue

    const key = metaobjectType.replace(/^tour_/, '')
    const existing = await client.request(METAFIELD_DEFINITION_QUERY, {
      identifier: {
        ownerType: 'PRODUCT',
        namespace: 'toursbms',
        key,
      },
    })

    if (existing.metafieldDefinition?.id) {
      result[key] = existing.metafieldDefinition.id
      continue
    }

    const created = await client.request(METAFIELD_DEFINITION_CREATE, {
      definition: {
        name: `ToursBMS ${key.replace(/_/g, ' ')}`,
        namespace: 'toursbms',
        key,
        type: 'list.metaobject_reference',
        ownerType: 'PRODUCT',
        validations: [
          {
            name: 'metaobject_definition_id',
            value: metaobjectDefinitionId,
          },
        ],
      },
    })
    assertNoUserErrors(created, `Create product metafield definition toursbms.${key}`)
    result[key] = created.metafieldDefinitionCreate?.createdDefinition?.id
  }

  return result
}

async function upsertMetaobjects(client, entries) {
  const idsByType = {}
  for (const entry of entries) {
    const data = await client.request(METAOBJECT_UPSERT, {
      handle: { type: entry.type, handle: entry.handle },
      metaobject: { fields: entry.fields },
    })
    assertNoUserErrors(data, `Upsert metaobject ${entry.type}/${entry.handle}`)
    const metaobject = data.metaobjectUpsert?.metaobject
    if (metaobject?.id) {
      idsByType[entry.type] ||= []
      idsByType[entry.type].push({ id: metaobject.id, handle: entry.handle })
    }
  }
  return idsByType
}

async function setProductReferences(client, productId, metaobjects) {
  const metafields = METAOBJECT_DEFINITIONS.map(({ type }) => {
    const rows = metaobjects[type] || []
    return {
      ownerId: productId,
      namespace: 'toursbms',
      key: type.replace(/^tour_/, ''),
      type: 'list.metaobject_reference',
      value: JSON.stringify(rows.map((row) => row.id)),
    }
  })
  for (let i = 0; i < metafields.length; i += 25) {
    const chunk = metafields.slice(i, i + 25)
    const data = await client.request(METAFIELDS_SET_MUTATION, { metafields: chunk })
    assertNoUserErrors(data, 'Set product metaobject references')
  }
}

async function attachProductMedia(client, productId, images) {
  if (images.length === 0) return []
  try {
    const data = await client.request(PRODUCT_CREATE_MEDIA_MUTATION, {
      productId,
      media: images.map((image) => ({
        originalSource: image.sourceUrl,
        alt: image.alt,
        mediaContentType: 'IMAGE',
      })),
    })
    assertNoUserErrors(data, 'Attach product media')
    const media = data.productCreateMedia?.media || []
    return images.map((image, index) => ({
      ...image,
      shopifyMediaId: media[index]?.id || image.shopifyMediaId || null,
    }))
  } catch (error) {
    const data = await client.request(FILE_CREATE_MUTATION, {
      files: images.map((image) => ({
        originalSource: image.sourceUrl,
        alt: image.alt,
        contentType: 'IMAGE',
      })),
    })
    assertNoUserErrors(data, `Create image files after media attach failed: ${error instanceof Error ? error.message : String(error)}`)
    const files = data.fileCreate?.files || []
    return images.map((image, index) => ({
      ...image,
      shopifyFileId: files[index]?.id || image.shopifyFileId || null,
      shopifyMediaId: image.shopifyMediaId || null,
    }))
  }
}

async function publishProduct(client, productId, publishNeedle) {
  if (!publishNeedle) return null
  const publications = await client.request(PUBLICATIONS_QUERY)
  const needle = publishNeedle.toLowerCase()
  const nodes = publications.publications?.nodes || []
  const publication = nodes.find((item) =>
    `${item.id}`.toLowerCase() === needle ||
    `${item.name}`.toLowerCase().includes(needle),
  )
  if (!publication) {
    const available = nodes.length > 0
      ? nodes.map((item) => `${item.name} (${item.id})`).join(', ')
      : 'none returned by Shopify'
    throw new Error(`Could not find Shopify publication matching "${publishNeedle}". Available publications: ${available}`)
  }

  const data = await client.request(PUBLISH_MUTATION, {
    id: productId,
    input: [{ publicationId: publication.id }],
  })
  assertNoUserErrors(data, 'Publish product')
  return publication
}

async function listPublications(client) {
  const publications = await client.request(PUBLICATIONS_QUERY)
  const nodes = publications.publications?.nodes || []
  if (nodes.length === 0) {
    console.log('No Shopify publications returned for this store/token.')
    return
  }
  console.log('Shopify publications:')
  for (const publication of nodes) {
    console.log(`- ${publication.name}: ${publication.id}`)
  }
}

function mergeVariantIds(manifest, variants) {
  const variantsBySku = new Map((variants || []).map((variant) => [variant.sku, variant]))
  manifest.variants = manifest.variants.map((variant) => ({
    ...variant,
    shopifyVariantId: variantsBySku.get(variant.sku)?.id || variant.shopifyVariantId || null,
  }))
}

function mergeAddonVariantIds(manifest, addonVariants) {
  const variantsBySku = new Map((addonVariants || []).map((variant) => [variant.sku, variant]))
  manifest.addons = manifest.addons.map((addon) => ({
    ...addon,
    shopifyVariantId: variantsBySku.get(addon.sku)?.id || addon.shopifyVariantId || null,
  }))
}

async function syncOneProduct(client, jsonByLocale, existingManifest, args) {
  const baseJson = jsonByLocale.en || Object.values(jsonByLocale)[0]
  let productPayload = buildProductPayload(baseJson, args.status)
  const variants = buildTourVariants(baseJson)
  if (variants.length > SHOPIFY_VARIANT_LIMIT) {
    throw new Error(`${getProductCode(baseJson)} has ${variants.length} date/rate variants, above Shopify limit ${SHOPIFY_VARIANT_LIMIT}`)
  }

  const manifest = buildManifestSkeleton({ jsonByLocale, existingManifest, status: args.status })
  const preservingManualEdits = !args.overwriteFromToursbms && Boolean(existingManifest?.shopifyProductId)
  if (preservingManualEdits) {
    const existingProduct = await fetchExistingProduct(client, existingManifest.shopifyProductId)
    productPayload = preserveEditableProductFields(productPayload, existingProduct, args.status)
    manifest.warnings ||= []
    manifest.warnings.push('Preserved existing Shopify editable product/content fields. Use --overwrite-from-toursbms to replace them from ToursBMS.')
  }
  const definitionIds = await ensureMetaobjectDefinitions(client)
  const productReferenceDefinitionIds = await ensureProductReferenceMetafieldDefinitions(client, definitionIds)
  const product = await productSet(client, toProductSetInput(productPayload, variants), `Sync product ${productPayload.handle}`)
  manifest.shopifyProductId = product.id
  const syncedVariants = await fetchAllProductVariants(client, product.id)
  await ensureVariantsDoNotRequireShipping(client, syncedVariants, `Disable shipping ${productPayload.handle}`)
  await setSyncedVariantMetafields(client, variants, syncedVariants, buildTourVariantMetafields, `Set variant metafields ${productPayload.handle}`)
  mergeVariantIds(manifest, syncedVariants)

  const addonPayload = buildAddonProductPayload(baseJson, manifest.addons, 'ACTIVE')
  const addonProduct = await productSet(client, toAddonProductSetInput(addonPayload), `Sync add-ons ${addonPayload.handle}`)
  manifest.shopifyAddonProductId = addonProduct.id
  const syncedAddonVariants = await fetchAllProductVariants(client, addonProduct.id)
  await ensureVariantsDoNotRequireShipping(client, syncedAddonVariants, `Disable shipping ${addonPayload.handle}`)
  await setSyncedVariantMetafields(client, addonPayload.variants, syncedAddonVariants, buildAddonVariantMetafields, `Set add-on variant metafields ${addonPayload.handle}`)
  mergeAddonVariantIds(manifest, syncedAddonVariants)

  const images = buildProductImages(baseJson, manifest.images || [])
  manifest.images = await attachProductMedia(client, product.id, images)

  if (preservingManualEdits && existingManifest?.metaobjects) {
    const departureEntries = buildMetaobjectEntries(jsonByLocale, manifest).filter((entry) => entry.type === 'tour_departure')
    const departureMetaobjects = await upsertMetaobjects(client, departureEntries)
    manifest.metaobjects = { ...existingManifest.metaobjects, tour_departure: departureMetaobjects.tour_departure || [] }
    manifest.metaobjectDefinitions = definitionIds
    manifest.productReferenceMetafieldDefinitions = productReferenceDefinitionIds
    await setProductReferences(client, product.id, manifest.metaobjects)
  } else {
    const entries = buildMetaobjectEntries(jsonByLocale, manifest)
    const metaobjects = await upsertMetaobjects(client, entries)
    manifest.metaobjects = metaobjects
    manifest.metaobjectDefinitions = definitionIds
    manifest.productReferenceMetafieldDefinitions = productReferenceDefinitionIds
    await setProductReferences(client, product.id, metaobjects)
  }

  const publication = await publishProduct(client, product.id, args.publish)
  manifest.publication = publication ? { id: publication.id, name: publication.name } : null
  manifest.syncedAt = new Date().toISOString()
  return manifest
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    usage()
    return
  }

  const env = loadEnv()
  assertShopifyEnv(env, (args.apply && !args.skipUpload) || args.listPublications)

  if (args.listPublications) {
    const client = new ShopifyAdminClient(env)
    await listPublications(client)
    return
  }

  console.log(`ToursBMS -> Shopify sync (${args.apply ? 'apply' : 'dry-run'})`)
  console.log(`Products: ${args.ids.join(', ')}`)
  console.log(`Locales: ${args.locales.join(', ')}`)

  const client = args.apply && !args.skipUpload ? new ShopifyAdminClient(env) : null

  for (const productCode of args.ids) {
    if (!args.skipExtract) {
      for (const locale of args.locales) extractProduct(productCode, locale, args)

      const enPath = extractionPath(args.outDir, productCode, 'en')
      if (existsSync(enPath)) {
        await mkdir(dirname(compatibilityPath(args.outDir, productCode)), { recursive: true })
        await writeFile(compatibilityPath(args.outDir, productCode), await readFile(enPath, 'utf8'), 'utf8')
      }
    }

    const jsonByLocale = await loadLocalizedJson(productCode, args)
    const baseJson = jsonByLocale.en || Object.values(jsonByLocale)[0]
    const actualProductCode = getProductCode(baseJson) || productCode
    const manifestPath = syncManifestPath(actualProductCode)
    const existingManifest = await readJson(manifestPath, {})
    const dryRunPayload = buildDryRunPayload(jsonByLocale, existingManifest, args.status)

    const variantCount = dryRunPayload.variants.length
    const addonCount = dryRunPayload.addonProduct.variants.length
    const imageCount = dryRunPayload.images.length
    console.log(`\n${actualProductCode} (${getProductHandle(baseJson)})`)
    console.log(`  Variants: ${variantCount}`)
    console.log(`  Chargeable add-on variants: ${addonCount}`)
    console.log(`  Gallery images: ${imageCount}`)
    console.log(`  Metaobject entries: ${dryRunPayload.metaobjects.length}`)

    if (variantCount > SHOPIFY_VARIANT_LIMIT) {
      throw new Error(`${actualProductCode} has ${variantCount} variants, above Shopify limit ${SHOPIFY_VARIANT_LIMIT}`)
    }

    if (!args.apply || args.skipUpload) {
      const dryRunPath = resolve('data', 'shopify-sync', `${actualProductCode}.dry-run.json`)
      await writeJson(dryRunPath, dryRunPayload)
      console.log(`  Wrote dry-run payload: ${dryRunPath}`)
      continue
    }

    const manifest = await syncOneProduct(client, jsonByLocale, existingManifest, args)
    await writeJson(manifestPath, manifest)
    console.log(`  Synced Shopify product: ${manifest.shopifyProductId}`)
    console.log(`  Wrote manifest: ${manifestPath}`)
  }
}

main().catch((error) => {
  console.error(error.stack || error.message)
  process.exit(1)
})
