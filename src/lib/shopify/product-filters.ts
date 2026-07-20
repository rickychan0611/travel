import type { CollectionProduct } from './types'

export const PRODUCT_FILTER_PAGE_SIZE = 24

export type ProductSort = 'recommended' | 'price-asc' | 'price-desc' | 'title'

export type ProductFilterState = {
  q: string
  regions: string[]
  productTypes: string[]
  departureCountries: string[]
  departureCities: string[]
  returnCities: string[]
  destinations: string[]
  labels: string[]
  days: number[]
  minDays?: number
  maxDays?: number
  minPrice?: number
  maxPrice?: number
  departureFrom: string
  departureTo: string
  transfers: string[]
  tourFormats: string[]
  confirmMethods: string[]
  sort: ProductSort
  page: number
}

export type TourFilterFacets = {
  regions: string[]
  productTypes: string[]
  departureCountries: string[]
  departureCities: string[]
  returnCities: string[]
  destinations: string[]
  labels: string[]
  durationDays: number | null
  departureDates: string[]
  transfers: string[]
  tourFormats: string[]
  confirmMethods: string[]
}

export type ProductFilterOption = { value: string; label: string; count: number }

export type ProductFilterOptions = {
  regions: ProductFilterOption[]
  productTypes: ProductFilterOption[]
  departureCountries: ProductFilterOption[]
  departureCities: ProductFilterOption[]
  returnCities: ProductFilterOption[]
  destinations: ProductFilterOption[]
  labels: ProductFilterOption[]
  days: ProductFilterOption[]
  transfers: ProductFilterOption[]
  tourFormats: ProductFilterOption[]
  confirmMethods: ProductFilterOption[]
}

type SearchParams = Record<string, string | string[] | undefined>

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const SORTS = new Set<ProductSort>(['recommended', 'price-asc', 'price-desc', 'title'])

function arrayParam(params: SearchParams, key: string) {
  const value = params[key]
  const values = Array.isArray(value) ? value : value ? [value] : []
  return [...new Set(values.flatMap((item) => item.split(',')).map((item) => item.trim()).filter(Boolean))]
}

function stringParam(params: SearchParams, key: string) {
  const value = params[key]
  return String(Array.isArray(value) ? value[0] ?? '' : value ?? '').trim()
}

function positiveNumber(value: string, integer = false) {
  if (!value) return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return undefined
  return integer ? Math.floor(parsed) : parsed
}

export function parseProductFilterState(params: SearchParams): ProductFilterState {
  const sortValue = stringParam(params, 'sort') as ProductSort
  return {
    q: stringParam(params, 'q').slice(0, 200),
    regions: arrayParam(params, 'region'),
    productTypes: arrayParam(params, 'productType'),
    departureCountries: arrayParam(params, 'departureCountry'),
    departureCities: arrayParam(params, 'departureCity'),
    returnCities: arrayParam(params, 'returnCity'),
    destinations: arrayParam(params, 'destination'),
    labels: arrayParam(params, 'label'),
    days: arrayParam(params, 'days').map((value) => positiveNumber(value, true)).filter((value): value is number => value !== undefined && value > 0),
    minDays: positiveNumber(stringParam(params, 'minDays'), true),
    maxDays: positiveNumber(stringParam(params, 'maxDays'), true),
    minPrice: positiveNumber(stringParam(params, 'minPrice')),
    maxPrice: positiveNumber(stringParam(params, 'maxPrice')),
    departureFrom: ISO_DATE.test(stringParam(params, 'departureFrom')) ? stringParam(params, 'departureFrom') : '',
    departureTo: ISO_DATE.test(stringParam(params, 'departureTo')) ? stringParam(params, 'departureTo') : '',
    transfers: arrayParam(params, 'transfer'),
    tourFormats: arrayParam(params, 'tourFormat'),
    confirmMethods: arrayParam(params, 'confirm'),
    sort: SORTS.has(sortValue) ? sortValue : 'recommended',
    page: Math.max(1, positiveNumber(stringParam(params, 'page'), true) ?? 1),
  }
}

export function facetValue(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\u3400-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function uniqueStrings(values: unknown[]) {
  return [...new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean))]
}

function parseJson<T>(value: string | undefined | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function tagLabels(product: CollectionProduct) {
  return product.tags
    .filter((tag) => tag.toLowerCase().startsWith('filter-label-'))
    .map((tag) => tag.slice('filter-label-'.length).replace(/-/g, ' '))
}

function inferredDurationDays(product: CollectionProduct) {
  const aliases = parseJson<string[]>(product.searchAliases?.value, [])
  const candidates = [product.title, product.localizedTitle, ...aliases]

  for (const candidate of candidates) {
    if (!candidate) continue
    if (/\bone[\s-]+day\b/i.test(candidate)) return 1

    const numericMatch = candidate.match(/\b(\d{1,3})\s*(?:-|\s)?days?\b/i)
    const chineseMatch = candidate.match(/(?:^|\D)(\d{1,3})\s*(?:日|天)(?:游|遊)?/)
    const value = Number(numericMatch?.[1] ?? chineseMatch?.[1] ?? 0)
    if (Number.isInteger(value) && value > 0 && value <= 365) return value
  }

  return null
}

function includesRegionTerm(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()))
}

function productRegions(product: CollectionProduct, stored: Partial<TourFilterFacets>) {
  const regions = new Set<string>()
  const candidates = [...(stored.regions ?? []), ...product.tags.filter((tag) => tag.toLowerCase().startsWith('region-'))]

  for (const candidate of candidates) {
    const value = facetValue(candidate).replace(/^region-/, '')
    if (['north-america', 'canada'].includes(value)) regions.add('North America')
    else if (value === 'latin-america') regions.add('South America')
    else if (value === 'europe') regions.add('Europe')
    else if (['asia', 'middle-east'].includes(value)) regions.add('Asia')
    else if (['africa', 'oceania', 'other'].includes(value)) regions.add('Other')
  }

  const aliases = parseJson<string[]>(product.searchAliases?.value, [])
  const destinations = parseJson<string[]>(product.destinations?.value, [])
  const searchText = uniqueStrings([
    product.title,
    product.localizedTitle,
    product.country?.value,
    ...aliases,
    ...destinations,
    ...(stored.departureCountries ?? []),
    ...(stored.destinations ?? []),
  ]).join(' ').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()

  if (includesRegionTerm(searchText, ['asia', 'china', 'japan', 'thailand', 'vietnam', 'maldives', 'singapore', 'malaysia', 'korea', 'turkey', 'united arab emirates', 'middle east', '亚洲', '亞洲', '中国', '中國', '日本', '泰国', '泰國', '越南', '马尔代夫', '馬爾地夫', '新加坡', '马来西亚', '馬來西亞', '韩国', '韓國', '土耳其', '阿拉伯联合酋长国', '阿拉伯聯合大公國'])) regions.add('Asia')
  if (includesRegionTerm(searchText, ['africa', 'morocco', 'egypt', 'kenya', 'oceania', 'australia', 'new zealand', '非洲', '摩洛哥', '埃及', '肯尼亚', '肯亞', '大洋洲', '澳大利亚', '澳大利亞', '新西兰', '紐西蘭'])) regions.add('Other')

  return [...regions]
}

export function productFacets(product: CollectionProduct): TourFilterFacets {
  const stored = parseJson<Partial<TourFilterFacets>>(product.filterFacets?.value, {})
  const destinations = parseJson<string[]>(product.destinations?.value, [])
  const summary = parseJson<{ departureDates?: string[] }>(product.availabilitySummary?.value, {})
  const storedDurationDays = Number(stored.durationDays ?? product.durationDays?.value ?? 0)
  const durationDays = Number.isFinite(storedDurationDays) && storedDurationDays > 0
    ? storedDurationDays
    : inferredDurationDays(product)

  return {
    regions: productRegions(product, stored),
    productTypes: uniqueStrings(stored.productTypes?.length ? stored.productTypes : [product.productType]),
    departureCountries: uniqueStrings(stored.departureCountries?.length ? stored.departureCountries : [product.country?.value]),
    departureCities: uniqueStrings(stored.departureCities?.length ? stored.departureCities : [product.departureCity?.value]),
    returnCities: uniqueStrings(stored.returnCities?.length ? stored.returnCities : [product.returnCity?.value]),
    destinations: uniqueStrings(stored.destinations?.length ? stored.destinations : destinations),
    labels: uniqueStrings([...(stored.labels ?? []), ...tagLabels(product)]),
    durationDays,
    departureDates: uniqueStrings(stored.departureDates?.length ? stored.departureDates : summary.departureDates ?? [product.earliestDeparture?.value, product.latestDeparture?.value]).filter((date) => ISO_DATE.test(date)).sort(),
    transfers: uniqueStrings(stored.transfers ?? []),
    tourFormats: uniqueStrings(stored.tourFormats?.length ? stored.tourFormats : [product.filterProductType?.value]),
    confirmMethods: uniqueStrings(stored.confirmMethods?.length ? stored.confirmMethods : [product.confirmMethod?.value]),
  }
}

function matchesAny(values: string[], selected: string[]) {
  if (selected.length === 0) return true
  const available = new Set(values.map(facetValue))
  return selected.some((value) => available.has(value))
}

function productPrice(product: CollectionProduct) {
  return Number(product.priceRange.minVariantPrice.amount || 0)
}

export function filterProducts(products: CollectionProduct[], state: ProductFilterState) {
  const keyword = state.q.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
  const filtered = products.filter((product) => {
    const facets = productFacets(product)
    const price = productPrice(product)
    const days = facets.durationDays
    const aliases = parseJson<string[]>(product.searchAliases?.value, [])
    const searchable = [
      product.productCode?.value,
      product.title,
      product.localizedTitle,
      product.localizedSubtitle,
      product.localizedPlace,
      product.handle,
      product.productType,
      ...product.tags,
      ...aliases,
      ...facets.productTypes,
      ...facets.departureCountries,
      ...facets.departureCities,
      ...facets.returnCities,
      ...facets.destinations,
      ...facets.labels,
    ].filter(Boolean).join(' ').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()

    if (keyword && !searchable.includes(keyword)) return false
    if (!matchesAny(facets.regions, state.regions)) return false
    if (!matchesAny(facets.productTypes, state.productTypes)) return false
    if (!matchesAny(facets.departureCountries, state.departureCountries)) return false
    if (!matchesAny(facets.departureCities, state.departureCities)) return false
    if (!matchesAny(facets.returnCities, state.returnCities)) return false
    if (!matchesAny(facets.destinations, state.destinations)) return false
    if (!matchesAny(facets.labels, state.labels)) return false
    if (!matchesAny(facets.transfers, state.transfers)) return false
    if (!matchesAny(facets.tourFormats, state.tourFormats)) return false
    if (!matchesAny(facets.confirmMethods, state.confirmMethods)) return false
    if (state.days.length > 0 && (days === null || !state.days.includes(days))) return false
    if (state.minDays !== undefined && (days === null || days < state.minDays)) return false
    if (state.maxDays !== undefined && (days === null || days > state.maxDays)) return false
    if (state.minPrice !== undefined && price < state.minPrice) return false
    if (state.maxPrice !== undefined && price > state.maxPrice) return false
    if (state.departureFrom || state.departureTo) {
      const hasDate = facets.departureDates.some((date) => (!state.departureFrom || date >= state.departureFrom) && (!state.departureTo || date <= state.departureTo))
      if (!hasDate) return false
    }
    return true
  })

  return filtered.sort((a, b) => {
    if (state.sort === 'price-asc') return productPrice(a) - productPrice(b)
    if (state.sort === 'price-desc') return productPrice(b) - productPrice(a)
    if (state.sort === 'title') return (a.localizedTitle || a.title).localeCompare(b.localizedTitle || b.title)
    return 0
  })
}

function options(values: string[][]): ProductFilterOption[] {
  const counts = new Map<string, { label: string; count: number }>()
  for (const productValues of values) {
    const seen = new Set<string>()
    for (const label of productValues) {
      const value = facetValue(label)
      if (!value || seen.has(value)) continue
      seen.add(value)
      const current = counts.get(value)
      counts.set(value, { label: current?.label || label, count: (current?.count || 0) + 1 })
    }
  }
  return [...counts.entries()].map(([value, item]) => ({ value, ...item })).sort((a, b) => a.label.localeCompare(b.label))
}

export function buildProductFilterOptions(products: CollectionProduct[]): ProductFilterOptions {
  const facets = products.map(productFacets)
  return {
    regions: options(facets.map((item) => item.regions)),
    productTypes: options(facets.map((item) => item.productTypes)),
    departureCountries: options(facets.map((item) => item.departureCountries)),
    departureCities: options(facets.map((item) => item.departureCities)),
    returnCities: options(facets.map((item) => item.returnCities)),
    destinations: options(facets.map((item) => item.destinations)),
    labels: options(facets.map((item) => item.labels)),
    days: options(facets.map((item) => item.durationDays ? [String(item.durationDays)] : [])),
    transfers: options(facets.map((item) => item.transfers)),
    tourFormats: options(facets.map((item) => item.tourFormats)),
    confirmMethods: options(facets.map((item) => item.confirmMethods)),
  }
}

export function productFilterSearchParams(state: ProductFilterState, overrides: Partial<ProductFilterState> = {}) {
  const next = { ...state, ...overrides }
  const params = new URLSearchParams()
  const addMany = (key: string, values: Array<string | number>) => values.forEach((value) => params.append(key, String(value)))
  if (next.q) params.set('q', next.q)
  addMany('region', next.regions)
  addMany('productType', next.productTypes)
  addMany('departureCountry', next.departureCountries)
  addMany('departureCity', next.departureCities)
  addMany('returnCity', next.returnCities)
  addMany('destination', next.destinations)
  addMany('label', next.labels)
  addMany('days', next.days)
  if (next.minDays !== undefined) params.set('minDays', String(next.minDays))
  if (next.maxDays !== undefined) params.set('maxDays', String(next.maxDays))
  if (next.minPrice !== undefined) params.set('minPrice', String(next.minPrice))
  if (next.maxPrice !== undefined) params.set('maxPrice', String(next.maxPrice))
  if (next.departureFrom) params.set('departureFrom', next.departureFrom)
  if (next.departureTo) params.set('departureTo', next.departureTo)
  addMany('transfer', next.transfers)
  addMany('tourFormat', next.tourFormats)
  addMany('confirm', next.confirmMethods)
  if (next.sort !== 'recommended') params.set('sort', next.sort)
  if (next.page > 1) params.set('page', String(next.page))
  return params.toString()
}

export function activeProductFilterCount(state: ProductFilterState) {
  return [state.q, ...state.regions, ...state.productTypes, ...state.departureCountries, ...state.departureCities, ...state.returnCities, ...state.destinations, ...state.labels, ...state.days, state.minDays, state.maxDays, state.minPrice, state.maxPrice, state.departureFrom, state.departureTo, ...state.transfers, ...state.tourFormats, ...state.confirmMethods].filter((value) => value !== '' && value !== undefined).length
}
