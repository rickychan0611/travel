import type { Route } from 'next'
import { productFacets } from './shopify/product-filters'
import type { CollectionProduct } from './shopify/types'
import { SIGNATURE_COLLECTIONS } from '../data/signature-collections'

const PRESENTATION_SUFFIXES = [
  'popular routes',
  'signature collections',
  'collections',
  'collection',
  'tours',
  'tour',
  'travel',
  '热门线路',
  '熱門線路',
  '精选',
  '精選',
  '旅游',
  '旅遊',
]

export function decodeCatalogKeyword(value: string) {
  try {
    return decodeURIComponent(value).trim()
  } catch {
    return value.trim()
  }
}

export function normalizeCatalogKeyword(value: string) {
  let normalized = decodeCatalogKeyword(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[_/\\|·]+/g, ' ')
    .replace(/[^a-z0-9\u3400-\u9fff]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  let previous = ''
  while (normalized && normalized !== previous) {
    previous = normalized
    for (const suffix of PRESENTATION_SUFFIXES) {
      const normalizedSuffix = normalizeCatalogKeywordPart(suffix)
      if (normalized === normalizedSuffix) break
      if (normalized.endsWith(` ${normalizedSuffix}`)) {
        normalized = normalized.slice(0, -(normalizedSuffix.length + 1)).trim()
        break
      }
      if (normalized.endsWith(normalizedSuffix) && /[\u3400-\u9fff]/.test(normalizedSuffix)) {
        normalized = normalized.slice(0, -normalizedSuffix.length).trim()
        break
      }
    }
  }

  return normalized
}

function normalizeCatalogKeywordPart(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\u3400-\u9fff]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

type CatalogKeywordParam = string | number | boolean

export function catalogKeywordHref(
  locale: string,
  keyword: string,
  params?: Record<string, CatalogKeywordParam | CatalogKeywordParam[] | undefined>,
): Route {
  const cleanLocale = locale.replace(/^\/+|\/+$/g, '')
  const cleanKeyword = decodeCatalogKeyword(keyword)
  const path = `/${cleanLocale}/${encodeURIComponent(cleanKeyword || 'Tours')}`
  const searchParams = new URLSearchParams()

  for (const [key, rawValue] of Object.entries(params ?? {})) {
    const values = Array.isArray(rawValue) ? rawValue : [rawValue]
    for (const value of values) {
      if (value !== undefined) searchParams.append(key, String(value))
    }
  }

  const query = searchParams.toString()
  return `${path}${query ? `?${query}` : ''}` as Route
}

type KeywordGroup = { triggers: string[]; matches: string[] }

const keywordGroup = (triggers: string[], matches: string[]): KeywordGroup => ({
  triggers: triggers.map(normalizeCatalogKeyword),
  matches: matches.map(normalizeCatalogKeyword),
})

const CORE_KEYWORD_GROUPS: KeywordGroup[] = [
  keywordGroup(
    ['americas', 'americas tours', '美洲', '美洲旅游', '美洲旅遊'],
    ['americas', 'north america', 'latin america', 'united states', 'canada', 'mexico', 'costa rica', 'peru', 'bolivia', 'chile', 'argentina', 'brazil', 'colombia', 'ecuador', '美国', '美國', '加拿大', '墨西哥', '秘鲁', '秘魯', '南美洲', '拉丁美洲'],
  ),
  keywordGroup(
    ['north america', 'north america tours', '北美', '北美热门线路', '北美熱門線路', 'united-states', 'united states tours', '美国旅游', '美國旅遊'],
    ['north america', 'united states', 'canada', 'mexico', 'costa rica', '美国', '美國', '加拿大', '墨西哥', '哥斯达黎加', '哥斯達黎加'],
  ),
  keywordGroup(
    ['canada-latin-america', 'canada and latin america', '加拿大与拉美', '加拿大與拉美', '加拿大&拉美'],
    ['canada', 'latin america', 'mexico', 'costa rica', 'peru', 'bolivia', 'chile', 'argentina', 'brazil', 'colombia', 'ecuador', '加拿大', '拉丁美洲', '墨西哥', '秘鲁', '秘魯'],
  ),
  keywordGroup(
    ['asia-world', 'asia and world', 'asia africa and oceania', '亚洲与世界', '亞洲與世界', '亚非与澳新', '亞非與澳新', '亚非&澳新', '亞非&澳新'],
    ['asia', 'china', 'japan', 'thailand', 'vietnam', 'maldives', 'singapore', 'malaysia', 'korea', 'turkey', 'united arab emirates', 'africa', 'morocco', 'egypt', 'kenya', 'oceania', 'australia', 'new zealand', '亚洲', '亞洲', '中国', '中國', '日本', '非洲', '澳大利亚', '澳大利亞', '新西兰', '紐西蘭'],
  ),
  keywordGroup(
    ['south america', 'south america tours', '南美洲'],
    ['south america', 'latin america', 'peru', 'bolivia', 'chile', 'argentina', 'brazil', 'colombia', 'ecuador', '南美洲', '拉丁美洲', '秘鲁', '秘魯'],
  ),
  keywordGroup(
    ['europe', 'europe tours', 'europe-world', 'europe and world', '欧洲', '歐洲', '欧洲旅游', '歐洲旅遊', '欧洲与世界精选', '歐洲與世界精選'],
    ['europe', 'france', 'italy', 'switzerland', 'spain', 'united kingdom', 'germany', 'austria', 'czech republic', 'netherlands', 'portugal', 'hungary', 'belgium', 'greece', 'iceland', 'denmark', 'finland', '欧洲', '歐洲'],
  ),
  keywordGroup(
    ['other', 'other destinations', '其他'],
    ['africa', 'morocco', 'egypt', 'kenya', 'oceania', 'australia', '非洲', '摩洛哥', '埃及', '肯尼亚', '肯亞', '澳大利亚', '澳大利亞'],
  ),
  keywordGroup(['china', 'china tours', '中国', '中國', '中国入境', '中國入境'], ['china', '中国', '中國', 'beijing', '北京', 'shanghai', '上海', 'xian', '西安']),
  keywordGroup(['latin america and caribbean', 'latin america & caribbean', '拉美与加勒比', '拉美與加勒比'], ['latin america', 'caribbean', 'mexico', 'costa rica', 'peru', 'bolivia', 'chile', 'argentina', 'brazil', 'colombia', 'ecuador', '拉丁美洲', '加勒比', '墨西哥', '秘鲁', '秘魯']),
  keywordGroup(['cancun vacation', '坎昆度假'], ['cancun', '坎昆']),
  keywordGroup(['inca empire', '印加古国', '印加古國'], ['peru', 'machu picchu', 'inca', '秘鲁', '秘魯', '马丘比丘', '馬丘比丘']),
  keywordGroup(['portland or', 'portland oregon', '波特兰 俄勒冈州', '波特蘭 俄勒岡州'], ['portland', 'oregon', '波特兰', '波特蘭', '俄勒冈', '俄勒岡']),
  keywordGroup(['washington d c', 'washington dc', '华盛顿特区', '華盛頓特區'], ['washington d c', 'washington dc', 'washington', '华盛顿', '華盛頓']),
  keywordGroup(['platinum-tours', 'platinum', '白金尊享'], ['platinum', 'type platinum', '白金尊享']),
  keywordGroup(['private-tours', 'private tours', 'private', '私家包团', '私家包團'], ['private', 'type private', '私家包团', '私家包團']),
  keywordGroup(['day-tours', 'day tours', 'day & short tours', 'short tours', '一日游与短线', '一日遊與短線', '一日游', '一日遊'], ['one day', 'day trip', 'duration 1 day', '1 day', '一日游', '一日遊', '短线', '短線']),
  keywordGroup(['calgary-rockies', 'calgary and rockies', '卡尔加里落基山', '卡爾加里落基山'], ['calgary', 'rockies', 'banff', '卡尔加里', '卡爾加里', '落基', '班芙']),
]

const SIGNATURE_KEYWORD_GROUPS = SIGNATURE_COLLECTIONS.flatMap((region) => [
  region.name,
  ...region.countries.flatMap((item) => [item.name, ...item.destinations]),
]).map((text) => {
  const equivalents = [...new Set(Object.values(text))]
  return keywordGroup(equivalents, equivalents)
})

const KEYWORD_GROUPS: KeywordGroup[] = [...CORE_KEYWORD_GROUPS, ...SIGNATURE_KEYWORD_GROUPS]

function parseJsonStrings(value?: string | null) {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

export function productCatalogAliases(product: CollectionProduct) {
  const facets = productFacets(product)
  return [
    ...parseJsonStrings(product.searchAliases?.value),
    product.productCode?.value,
    product.title,
    product.localizedTitle,
    product.localizedSubtitle,
    product.localizedPlace,
    product.handle,
    product.productType,
    product.country?.value,
    product.departureCity?.value,
    product.returnCity?.value,
    ...product.tags,
    ...facets.productTypes,
    ...facets.departureCountries,
    ...facets.departureCities,
    ...facets.returnCities,
    ...facets.destinations,
    ...facets.labels,
    ...facets.tourFormats,
    ...(facets.durationDays ? [`duration ${facets.durationDays} day`, `${facets.durationDays} day`] : []),
  ].filter((value): value is string => Boolean(value && String(value).trim()))
}

export function catalogKeywordTerms(keyword: string) {
  const normalized = normalizeCatalogKeyword(keyword)
  const group = KEYWORD_GROUPS.find((item) => item.triggers.includes(normalized))
  return [...new Set(group?.matches.length ? group.matches : [normalized])].filter(Boolean)
}

export function productMatchesCatalogKeyword(product: CollectionProduct, keyword: string) {
  const terms = catalogKeywordTerms(keyword)
  if (terms.length === 0) return true
  const aliases = productCatalogAliases(product).map(normalizeCatalogKeyword).filter(Boolean)
  return terms.some((term) => aliases.some((alias) => alias === term || alias.includes(term)))
}

export function matchCatalogProducts(products: CollectionProduct[], keyword: string) {
  return products.filter((product) => productMatchesCatalogKeyword(product, keyword))
}
