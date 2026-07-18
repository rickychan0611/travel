'use server'

import { refresh } from 'next/cache'
import type { AdminFormState } from '@/components/admin/AdminActionForm'
import { assertAdminUser, assertOwnerUser } from '@/lib/admin/auth'
import {
  ensureHomepageDefinitions,
  getLandingPageContent,
  listHomepageMetaobjects,
  removeHomepageMetaobject,
  saveHomepageMetaobject,
  uploadPublicHomepageImage,
} from '@/lib/admin/homepage-admin'
import { expireHomepageCaches } from '@/lib/admin/revalidate'
import { HOMEPAGE_METAOBJECT_TYPES, normalizeShopifyProductId } from '@/lib/homepage/types'
import { moveHomepageItem, sortHomepageItems, type HomepageOrderDirection } from '@/lib/homepage/order'
import { HOME_BANNERS, HOT_DESTINATIONS, SEASON_MUST_PLAY } from '@/data/home-mock'
import { CATEGORY_SLUGS, HOMEPAGE_TOUR_SECTIONS } from '@/data/tour-categories'
import { fetchProductsByQueries } from '@/lib/shopify/products'
import { resolveAdminProductCodes } from '@/lib/admin/shopify-admin'

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

function saved(message: string): AdminFormState {
  return { error: null, saved: true, message }
}

function failed(error: unknown, fallback: string): AdminFormState {
  return { error: error instanceof Error ? error.message : fallback, saved: false }
}

function safeHandle(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100) || `item-${Date.now()}`
}

const categorySlugs = new Set<string>(CATEGORY_SLUGS)

function parentFieldForType(type: string) {
  if (type === HOMEPAGE_METAOBJECT_TYPES.destinationLink) return 'group'
  if (type === HOMEPAGE_METAOBJECT_TYPES.tourCategory) return 'section'
  return ''
}

async function scopedHomepageRecords(type: string, parentId = '') {
  const records = await listHomepageMetaobjects(type)
  const parentField = parentFieldForType(type)
  return parentField ? records.filter((record) => record.fields[parentField] === parentId) : records
}

function orderedHomepageRecords<T extends { id: string; fields: Record<string, string> }>(records: T[]) {
  return sortHomepageItems(records.map((record) => ({
    record,
    id: record.id,
    position: Number(record.fields.position || 0),
  })))
}

async function writeUniquePositions(type: string, records: Awaited<ReturnType<typeof scopedHomepageRecords>>) {
  const ordered = orderedHomepageRecords(records)
  for (const [index, item] of ordered.entries()) {
    const position = String(index + 1)
    if (item.record.fields.position !== position) {
      await saveHomepageMetaobject(type, item.id, '', { position })
    }
  }
}

function finishHomepageMutation() {
  expireHomepageCaches()
  refresh()
}

const destinationCategories: Record<string, string> = {
  '洛杉矶': 'yellowstone', '美西国家公园': 'yellowstone', '纽约': 'new-york', '羚羊谷': 'yellowstone', '拉斯维加斯': 'yellowstone', '旧金山': 'yellowstone', '阿拉斯加': 'alaska', '黄石': 'yellowstone',
  '卡尔加里': 'calgary-rockies', '温哥华': 'calgary-rockies', '多伦多': 'new-york', '秘鲁': 'peru', '墨西哥': 'cancun', '尼亚加拉': 'new-york',
  '北欧峡湾': 'europe', '英国': 'europe', '冰岛': 'europe', '法瑞意': 'europe', '土耳其希腊': 'europe', '西葡': 'europe',
  '中国': 'china', '日本': 'china', '新西兰': 'china', '澳大利亚': 'china', '埃及': 'china', '东南亚': 'china',
}

export async function initializeLandingPageAction(
  _previousState: AdminFormState,
  _formData: FormData,
): Promise<AdminFormState> {
  void _previousState
  void _formData
  await assertOwnerUser()
  try {
    await ensureHomepageDefinitions()
    const current = await getLandingPageContent('en', false)
    if (current.initialized) return saved('Landing page was already initialized')

    const imagePaths = [...new Set([...HOME_BANNERS.map((item) => item.src), ...SEASON_MUST_PLAY.map((item) => item.image)])]
    const imageIds = new Map<string, string>()
    for (const imagePath of imagePaths) {
      const title = HOME_BANNERS.find((item) => item.src === imagePath)?.label || SEASON_MUST_PLAY.find((item) => item.image === imagePath)?.title || 'Homepage image'
      const uploaded = await uploadPublicHomepageImage(imagePath, title)
      imageIds.set(imagePath, uploaded.id)
    }

    for (const [index, banner] of HOME_BANNERS.entries()) {
      await saveHomepageMetaobject(HOMEPAGE_METAOBJECT_TYPES.hero, '', `imported-hero-${index + 1}`, {
        title_en: banner.label,
        title_zh_cn: banner.label,
        title_zh_tw: banner.label,
        image: imageIds.get(banner.src) || '',
        category_slug: '',
        position: String(index + 1),
      })
    }

    for (const [groupIndex, group] of HOT_DESTINATIONS.entries()) {
      const groupId = await saveHomepageMetaobject(HOMEPAGE_METAOBJECT_TYPES.destinationGroup, '', `imported-destination-group-${groupIndex + 1}`, {
        title_en: group.title,
        title_zh_cn: group.title,
        title_zh_tw: group.title,
        position: String(groupIndex + 1),
      })
      for (const [linkIndex, title] of group.links.entries()) {
        await saveHomepageMetaobject(HOMEPAGE_METAOBJECT_TYPES.destinationLink, '', `imported-destination-${groupIndex + 1}-${linkIndex + 1}`, {
          title_en: title,
          title_zh_cn: title,
          title_zh_tw: title,
          group: groupId,
          category_slug: destinationCategories[title] || 'day-tours',
          position: String(linkIndex + 1),
        })
      }
    }

    for (const [index, item] of SEASON_MUST_PLAY.entries()) {
      await saveHomepageMetaobject(HOMEPAGE_METAOBJECT_TYPES.season, '', `imported-season-${index + 1}`, {
        title_en: item.title,
        title_zh_cn: item.title,
        title_zh_tw: item.title,
        image: imageIds.get(item.image) || '',
        category_slug: item.href.replace(/^\//, ''),
        position: String(index + 1),
      })
    }

    for (const [sectionIndex, section] of HOMEPAGE_TOUR_SECTIONS.entries()) {
      const sectionId = await saveHomepageMetaobject(HOMEPAGE_METAOBJECT_TYPES.tourSection, '', `imported-tour-section-${sectionIndex + 1}`, {
        title_en: section.title.en,
        title_zh_cn: section.title['zh-CN'],
        title_zh_tw: section.title['zh-TW'],
        position: String(sectionIndex + 1),
      })
      for (const [categoryIndex, category] of section.tabs.entries()) {
        const products = await fetchProductsByQueries(category.queries, 6, 6)
        await saveHomepageMetaobject(HOMEPAGE_METAOBJECT_TYPES.tourCategory, '', `imported-tour-category-${sectionIndex + 1}-${categoryIndex + 1}`, {
          title_en: category.label.en,
          title_zh_cn: category.label['zh-CN'],
          title_zh_tw: category.label['zh-TW'],
          section: sectionId,
          category_slug: category.href.replace(/^\//, ''),
          position: String(categoryIndex + 1),
          products: JSON.stringify(products.map((product) => product.id)),
        })
      }
    }

    await saveHomepageMetaobject(HOMEPAGE_METAOBJECT_TYPES.config, '', 'main', { initialized: 'true', schema_version: '1' })
    finishHomepageMutation()
    return saved('Current landing page imported into Shopify')
  } catch (error) {
    return failed(error, 'The landing page could not be initialized.')
  }
}

const editableTypes = new Set<string>([
  HOMEPAGE_METAOBJECT_TYPES.hero,
  HOMEPAGE_METAOBJECT_TYPES.destinationGroup,
  HOMEPAGE_METAOBJECT_TYPES.destinationLink,
  HOMEPAGE_METAOBJECT_TYPES.season,
  HOMEPAGE_METAOBJECT_TYPES.tourSection,
  HOMEPAGE_METAOBJECT_TYPES.tourCategory,
])

export async function saveLandingItemAction(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdminUser()
  try {
    if (text(formData, '_intent') === 'delete') return deleteLandingItem(formData)

    const type = text(formData, 'type')
    const id = text(formData, 'id')
    if (!editableTypes.has(type)) throw new Error('Unsupported landing page item')
    const categorySlug = text(formData, 'categorySlug')
    if (categorySlug && !categorySlugs.has(categorySlug)) throw new Error('Choose a working category page')
    if (!id && type === HOMEPAGE_METAOBJECT_TYPES.hero && !categorySlug) throw new Error('New hero slides require a linked category')

    const parentId = text(formData, 'parentId')
    const siblings = await scopedHomepageRecords(type, parentId)
    const orderedSiblings = orderedHomepageRecords(siblings)
    const existingIndex = orderedSiblings.findIndex((item) => item.id === id)
    if (id && existingIndex < 0) throw new Error('This landing page item no longer exists')
    const position = id ? existingIndex + 1 : orderedSiblings.length + 1
    const fields: Record<string, string> = {
      title_en: text(formData, 'titleEn'),
      title_zh_cn: text(formData, 'titleZhCn'),
      title_zh_tw: text(formData, 'titleZhTw'),
      position: String(position),
    }
    if (!fields.title_en && !fields.title_zh_cn && !fields.title_zh_tw) throw new Error('Enter at least one title')
    if (type === HOMEPAGE_METAOBJECT_TYPES.hero || type === HOMEPAGE_METAOBJECT_TYPES.season) {
      const image = text(formData, 'imageId')
      if (!image) throw new Error('Choose or upload an image')
      fields.image = image
      fields.category_slug = categorySlug
    }
    if (type === HOMEPAGE_METAOBJECT_TYPES.destinationLink) {
      fields.group = parentId
      fields.category_slug = categorySlug
      if (!fields.group) throw new Error('Destination group is required')
    }
    if (type === HOMEPAGE_METAOBJECT_TYPES.tourCategory) {
      fields.section = parentId
      fields.category_slug = categorySlug
      if (!fields.section) throw new Error('Tour section is required')
      const rawProducts = text(formData, 'productCodes').split(/[\s,]+/).filter(Boolean)
      const productCodes = rawProducts
        .filter((value) => !normalizeShopifyProductId(value))
        .map((value) => value.toUpperCase())
      const resolvedCodes = await resolveAdminProductCodes(productCodes)
      const missingCodes = [...new Set(productCodes)].filter((code) => !resolvedCodes.has(code))
      if (missingCodes.length > 0) throw new Error(`Product code${missingCodes.length === 1 ? '' : 's'} not found: ${missingCodes.join(', ')}`)
      const productIds = [...new Set(rawProducts.map((value) =>
        normalizeShopifyProductId(value) || resolvedCodes.get(value.toUpperCase()) || '',
      ).filter(Boolean))]
      if (productIds.length > 6) throw new Error('A category can contain at most six products')
      fields.products = JSON.stringify(productIds)
    }

    const handle = `${safeHandle(type.replace(/^homepage_/, ''))}-${Date.now()}`
    await saveHomepageMetaobject(type, id, handle, fields)
    await writeUniquePositions(type, await scopedHomepageRecords(type, parentId))
    finishHomepageMutation()
    return saved(id ? 'Saved' : 'Added')
  } catch (error) {
    return failed(error, 'This landing page item could not be saved.')
  }
}

async function deleteLandingItem(formData: FormData): Promise<AdminFormState> {
  try {
    const id = text(formData, 'id')
    const type = text(formData, 'type')
    if (!id || !editableTypes.has(type)) throw new Error('Unsupported landing page item')
    if (type === HOMEPAGE_METAOBJECT_TYPES.destinationGroup) throw new Error('The four destination groups cannot be deleted')
    const records = await listHomepageMetaobjects(type)
    const record = records.find((item) => item.id === id)
    if (!record) throw new Error('This landing page item no longer exists')
    const parentField = parentFieldForType(type)
    const parentId = parentField ? record.fields[parentField] || '' : ''
    if (type === HOMEPAGE_METAOBJECT_TYPES.hero) {
      if (records.length <= 1) throw new Error('The final hero slide cannot be deleted')
    }
    if (type === HOMEPAGE_METAOBJECT_TYPES.tourSection) {
      const categories = await listHomepageMetaobjects(HOMEPAGE_METAOBJECT_TYPES.tourCategory)
      for (const category of categories.filter((item) => item.fields.section === id)) await removeHomepageMetaobject(category.id)
    }
    if (type === HOMEPAGE_METAOBJECT_TYPES.destinationGroup) {
      const links = await listHomepageMetaobjects(HOMEPAGE_METAOBJECT_TYPES.destinationLink)
      for (const link of links.filter((item) => item.fields.group === id)) await removeHomepageMetaobject(link.id)
    }
    await removeHomepageMetaobject(id)
    await writeUniquePositions(type, await scopedHomepageRecords(type, parentId))
    finishHomepageMutation()
    return saved('Deleted')
  } catch (error) {
    return failed(error, 'This landing page item could not be deleted.')
  }
}

export async function deleteLandingItemAction(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  void _previousState
  await assertAdminUser()
  return deleteLandingItem(formData)
}

export async function reorderLandingItemAction(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  void _previousState
  await assertAdminUser()
  try {
    const type = text(formData, 'type')
    const id = text(formData, 'id')
    const parentId = text(formData, 'parentId')
    const direction = text(formData, 'direction') as HomepageOrderDirection
    if (!editableTypes.has(type) || !id || !['up', 'down'].includes(direction)) throw new Error('Unsupported reorder request')

    const records = await scopedHomepageRecords(type, parentId)
    const ordered = orderedHomepageRecords(records)
    if (!ordered.some((item) => item.id === id)) throw new Error('This landing page item no longer exists')
    const moved = moveHomepageItem(ordered, id, direction)

    for (const [index, item] of moved.entries()) {
      const position = String(index + 1)
      if (item.record.fields.position !== position) {
        await saveHomepageMetaobject(type, item.id, '', { position })
      }
    }

    const oldIndex = ordered.findIndex((item) => item.id === id)
    const newIndex = moved.findIndex((item) => item.id === id)
    finishHomepageMutation()
    return saved(oldIndex === newIndex ? `Already ${direction === 'up' ? 'first' : 'last'}` : 'Position updated')
  } catch (error) {
    return failed(error, 'This landing page item could not be moved.')
  }
}
