import type { CollectionProduct } from '@/lib/shopify/types'

export const HOMEPAGE_METAOBJECT_TYPES = {
  config: 'homepage_config',
  hero: 'homepage_hero_slide',
  destinationGroup: 'homepage_destination_group',
  destinationLink: 'homepage_destination_link',
  season: 'homepage_season_item',
  tourSection: 'homepage_tour_section',
  tourCategory: 'homepage_tour_category',
} as const

export type HomepageImage = {
  id: string
  url: string
  altText: string
  width: number
  height: number
}

export type HomepageHeroSlide = {
  id: string
  title: string
  titles: Record<string, string>
  categorySlug: string
  linkEnabled: boolean
  position: number
  image: HomepageImage | null
}

export type HomepageDestinationLink = {
  id: string
  title: string
  titles: Record<string, string>
  categorySlug: string
  position: number
  groupId: string
}

export type HomepageDestinationGroup = {
  id: string
  title: string
  titles: Record<string, string>
  position: number
  links: HomepageDestinationLink[]
}

export type HomepageSeasonItem = {
  id: string
  title: string
  titles: Record<string, string>
  categorySlug: string
  position: number
  image: HomepageImage | null
}

export type HomepageTourCategory = {
  id: string
  title: string
  titles: Record<string, string>
  categorySlug: string
  position: number
  sectionId: string
  productIds: string[]
  productCodes: string[]
  products: CollectionProduct[]
  unavailableProductIds: string[]
}

export type HomepageTourSection = {
  id: string
  title: string
  titles: Record<string, string>
  position: number
  categories: HomepageTourCategory[]
}

export type LandingPageContent = {
  initialized: boolean
  heroSlides: HomepageHeroSlide[]
  destinationGroups: HomepageDestinationGroup[]
  seasonItems: HomepageSeasonItem[]
  tourSections: HomepageTourSection[]
}

export type HomepageMetaobjectRecord = {
  id: string
  handle: string
  type: string
  fields: Record<string, string>
  images: Record<string, HomepageImage>
}

export function normalizeShopifyProductId(value: string) {
  const trimmed = value.trim()
  if (/^\d+$/.test(trimmed)) return `gid://shopify/Product/${trimmed}`
  if (/^gid:\/\/shopify\/Product\/\d+$/.test(trimmed)) return trimmed
  return ''
}

export function parseProductIds(value: string) {
  let values: unknown = value
  try {
    values = JSON.parse(value)
  } catch {
    values = value.split(/[\s,]+/)
  }
  if (!Array.isArray(values)) return []
  return [...new Set(values.map((item) => normalizeShopifyProductId(String(item))).filter(Boolean))]
}

export function localizedHomepageTitle(fields: Record<string, string>, locale: string) {
  const localeKey = locale === 'zh-TW' ? 'title_zh_tw' : locale === 'zh-CN' ? 'title_zh_cn' : 'title_en'
  return fields[localeKey] || fields.title_en || fields.title_zh_cn || ''
}

export function homepageTitles(fields: Record<string, string>) {
  return {
    en: fields.title_en || '',
    'zh-CN': fields.title_zh_cn || '',
    'zh-TW': fields.title_zh_tw || '',
  }
}
