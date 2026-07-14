#!/usr/bin/env node

import { mkdir, writeFile } from 'fs/promises'
import { dirname, resolve } from 'path'

const PRODUCT_PAGE_HOST = 'https://uvbookings.toursbms.com'
const SOA_BASE = 'https://online.ctrip.com/restapi/soa2'
const DEFAULT_DOMAIN_KEY = 'uvbookings'
const DEFAULT_LANG = 3

const LANG_PATH = {
  1: 'cn',
  2: 'zh',
  3: 'en',
}

const PRICE_TYPE_LABELS = {
  1: 'Adult',
  2: 'Child',
  3: 'Single room',
  4: 'Double room',
  5: 'Triple room',
  6: 'Quad room',
  7: 'Senior',
  8: 'Other',
  9: 'Infant',
  10: 'Student',
}

const PEOPLE_TYPE_LABELS = {
  0: 'All',
  1: 'Adult',
  2: 'Child',
}

const VEHICLE_LABELS = {
  0: 'Others',
  1: 'Vehicle',
  2: 'Train',
  3: 'Airplane',
  4: 'Cruise',
  5: 'Bus',
}

const TRANSFER_LABELS = {
  1: 'Airport pick-up',
  2: 'Airport drop-off',
}

const NOTICE_TYPE_LABELS = {
  0: 'Cost description',
  1: 'Know Before You Book',
  2: 'Travel tips',
  3: 'Cancellation Policy',
  4: 'Visa instructions',
}

function usage() {
  console.log(`Usage:
  node scripts/extract-toursbms-product.mjs <PRODUCT_CODE> [options]

Options:
  --lang <number>       ToursBMS language code. Defaults to 3 (English).
  --currency <code>     Currency number, e.g. USD or CAD. Defaults to USD if available.
  --start <YYYY-MM-DD>  Availability start date. Defaults to today.
  --end <YYYY-MM-DD>    Availability end date. Defaults to Dec 31 next year.
  --out <path>          Output file. Defaults to data/toursbms-products/<PRODUCT_CODE>.json.
  --help                Show this help.
`)
}

function parseArgs(argv) {
  const args = {
    lang: DEFAULT_LANG,
    currency: 'USD',
    start: null,
    end: null,
    out: null,
  }

  const positional = []
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--help' || arg === '-h') {
      args.help = true
    } else if (arg === '--lang') {
      args.lang = Number(argv[++i])
    } else if (arg === '--currency') {
      args.currency = String(argv[++i] || '').toUpperCase()
    } else if (arg === '--start') {
      args.start = argv[++i]
    } else if (arg === '--end') {
      args.end = argv[++i]
    } else if (arg === '--out') {
      args.out = argv[++i]
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown option: ${arg}`)
    } else {
      positional.push(arg)
    }
  }

  args.productCode = positional[0]
  if (!args.help && !args.productCode) {
    throw new Error('Missing product code, e.g. P00002834')
  }

  return args
}

function pad2(value) {
  return String(value).padStart(2, '0')
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function defaultEndDate(now = new Date()) {
  return `${now.getFullYear() + 1}-12-31`
}

function assertDate(value, name) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${name} must be YYYY-MM-DD, got ${value}`)
  }
}

function htmlToText(html = '') {
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

function decodeBase64Json(value) {
  if (!value || typeof value !== 'string') return null
  try {
    return JSON.parse(Buffer.from(value, 'base64').toString('utf8'))
  } catch {
    return null
  }
}

function decodeJsonContent(value) {
  if (!value || typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed)
    } catch {
      return null
    }
  }

  return decodeBase64Json(trimmed)
}

function decodeNestedJsonContent(value) {
  if (Array.isArray(value)) return value.map(decodeNestedJsonContent)
  if (!value || typeof value !== 'object') return value

  const decoded = {}
  for (const [key, child] of Object.entries(value)) {
    decoded[key] = decodeNestedJsonContent(child)
    if (key === 'jsonContent' && typeof child === 'string') {
      const nested = decodeJsonContent(child)
      if (nested) decoded.decodedJson = decodeNestedJsonContent(nested)
    }
  }
  return decoded
}

function parseInitialState(html) {
  const marker = 'window.__INITIAL_STATE__ = '
  const start = html.indexOf(marker)
  if (start === -1) {
    throw new Error('Could not find window.__INITIAL_STATE__ on product page')
  }

  let index = start + marker.length
  let depth = 0
  let inString = false
  let escaped = false
  let quote = ''
  const jsonStart = index

  for (; index < html.length; index += 1) {
    const char = html[index]
    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === quote) inString = false
      continue
    }

    if (char === '"' || char === "'") {
      inString = true
      quote = char
      continue
    }

    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) {
        return JSON.parse(html.slice(jsonStart, index + 1))
      }
    }
  }

  throw new Error('Could not parse window.__INITIAL_STATE__ JSON')
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options)
  const text = await response.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`Expected JSON from ${url}, got HTTP ${response.status}: ${text.slice(0, 300)}`)
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}: ${JSON.stringify(json).slice(0, 500)}`)
  }
  return json
}

function responseCode(json) {
  return json?.responseResult?.code ?? json?.ResponseStatus?.Ack
}

function responseMessage(json) {
  return json?.responseResult?.msg ?? json?.responseResult?.msgCode ?? ''
}

function assertApiSuccess(name, json) {
  const code = responseCode(json)
  if (code !== 200 && code !== 'Success') {
    throw new Error(`${name} failed with code ${code}: ${responseMessage(json)}`)
  }
}

async function postSoa(path, body, context, options = {}) {
  const url = `${SOA_BASE}/${path}`
  const requestUser = {
    branchcode: context.branchCode,
    upBranchCode: context.branchCode,
    userCode: 'U000000',
    userName: 'GUEST',
    systemCode: 0,
  }
  if (options.omitToken !== true) {
    requestUser.tokenCode = context.tokenCode
  }

  const requestBody = {
    requestUser,
    ...body,
  }
  if (options.omitToken !== true) {
    requestBody.tokenCode = context.tokenCode
  }

  const headers = {
    'Content-Type': 'application/json',
    branchcode: context.branchCode,
    languageCode: String(context.lang),
    'X-Requested-With': 'XMLHttpRequest',
  }
  if (options.omitToken !== true) {
    headers.tokenCode = context.tokenCode
  }

  const json = await fetchJson(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  })

  if (options.allowMissing !== true) {
    assertApiSuccess(path, json)
  }
  return json
}

async function fetchProductPage(productCode, lang) {
  const langPath = LANG_PATH[lang] || 'en'
  const url = `${PRODUCT_PAGE_HOST}/${langPath}/product/detail?productCode=${encodeURIComponent(productCode)}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Could not fetch product page ${url}: HTTP ${response.status}`)
  }
  return { url, html: await response.text() }
}

async function fetchBranchFallback(domainKey, lang) {
  const domain = Buffer.from(domainKey, 'utf8').toString('base64')
  const json = await fetchJson(`${SOA_BASE}/18554/GetWebSiteBranch.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      languageCode: String(lang),
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify({ domain }),
  })
  assertApiSuccess('GetWebSiteBranch', json)
  return json.responseData
}

async function discoverContext(productCode, lang) {
  const page = await fetchProductPage(productCode, lang)
  const initialState = parseInitialState(page.html)
  let branchInfo = initialState.branchInfo

  if (!branchInfo?.branchCode || !branchInfo?.tokenCode) {
    branchInfo = await fetchBranchFallback(DEFAULT_DOMAIN_KEY, lang)
  }

  if (!branchInfo?.branchCode || !branchInfo?.tokenCode) {
    throw new Error('Missing branchCode or tokenCode from ToursBMS context')
  }

  return {
    pageUrl: page.url,
    initialState,
    branchInfo,
    branchCode: branchInfo.branchCode,
    tokenCode: branchInfo.tokenCode,
    lang,
  }
}

function findCurrency(currencies, requestedCurrency, branchInfo) {
  const currencyList = Array.isArray(currencies) ? currencies : []
  const byNum = currencyList.find((item) => item.currencyNum === requestedCurrency)
  const usd = currencyList.find((item) => item.currencyNum === 'USD')
  const defaultCurrency = currencyList.find((item) => item.currencyIsDefault === 1)
  const branchCurrency = branchInfo?.currencyInfo
  return byNum || usd || defaultCurrency || branchCurrency || currencyList[0] || { currencyNum: requestedCurrency, currencySymbol: '$' }
}

function normalizeDestinations(destinations = []) {
  return destinations.map((item) => ({
    country: item.countryName || '',
    province: item.provinceName || '',
    scenic: item.scenicName || '',
    spotCode: item.scenicSpotCode || '',
    spotName: item.scenicSpotName || '',
    raw: item,
  }))
}

function normalizeCarpoints(points = []) {
  return points.map((point) => ({
    code: point.carpointCode || '',
    viewCode: point.carpointViewCode || '',
    name: point.carpointName || '',
    address: point.aggregationAddr || '',
    description: point.aggregationDesc || '',
    descriptionText: htmlToText(point.aggregationDesc || ''),
    isAirport: point.isAirport === 1,
    raw: point,
  }))
}

function normalizeBasePrices(group = null) {
  return (group?.groupPrice || []).map((price) => ({
    priceType: price.priceType,
    label: PRICE_TYPE_LABELS[price.priceType] || `Price type ${price.priceType}`,
    amount: Number(price.groupPrice),
    rewardPrice: Number(price.rewardPrice || 0),
    markup: Number(price.markup || 0),
    raw: price,
  }))
}

function normalizeAvailability(groups = []) {
  return groups.map((group) => ({
    date: String(group.groupDate || '').slice(0, 10),
    groupDate: group.groupDate,
    currency: group.currencyNum,
    stockType: group.stockType,
    stockStatus: group.stockStatus,
    groupStock: group.groupStock,
    groupSaleStock: group.groupSaleStock,
    remainingStock: Number(group.groupStock || 0) - Number(group.groupSaleStock || 0),
    isGroupRoom: group.isGroupRoom === 1,
    isExceedStock: group.isExceedStock === 1,
    prices: normalizeBasePrices(group),
    otherCurrencyGroupPriceInfo: group.otherCurrencyGroupPriceInfo || [],
  }))
}

function normalizeItinerary(travelInfoList = []) {
  const languageBlock = travelInfoList[0] || {}
  return (languageBlock.dayList || [])
    .slice()
    .sort((a, b) => Number(a.dayNumber || 0) - Number(b.dayNumber || 0))
    .map((day) => ({
      dayNumber: day.dayNumber,
      section: day.section || '',
      sectionStops: parseSection(day.section || ''),
      todayLocation: decodeBase64Json(day.todayLocation) || day.todayLocation || '',
      distributionFactor: day.distributionFactor,
      isFreeTravel: day.isFreeTravel,
      optionalProductList: day.optionalProductList || [],
      content: (day.content || []).map((item) => ({
        contentMode: item.contentMode,
        contentType: item.contentType,
        sortNumber: item.sortNumber,
        relatedId: item.relatedId,
        relatedDay: item.relatedDay,
        relatedName: item.relatedName,
        decodedJson: decodeNestedJsonContent(decodeJsonContent(item.jsonContent)),
        rawJsonContent: item.jsonContent,
        raw: item,
      })),
      raw: day,
    }))
}

function parseSection(section) {
  if (!section) return []
  return section.split('|||').map((part, index) => {
    if (index === 0) return { type: 'place', label: part }
    const [vehicle, place] = part.split('+++')
    return {
      type: 'transfer',
      vehicleCode: vehicle || '',
      vehicle: VEHICLE_LABELS[vehicle] || vehicle || '',
      place: place || '',
    }
  })
}

function normalizeNotice(noticeInfo = []) {
  return noticeInfo.map((notice) => ({
    matterCode: notice.matterCode,
    noticeType: notice.noticeType,
    typeLabel: NOTICE_TYPE_LABELS[notice.noticeType] || `Notice type ${notice.noticeType}`,
    matterName: notice.matterName || '',
    html: {
      primary: notice.vluesTip1 || '',
      secondary: notice.vluesTip2 || '',
    },
    text: {
      primary: htmlToText(notice.vluesTip1 || ''),
      secondary: htmlToText(notice.vluesTip2 || ''),
    },
    raw: notice,
  }))
}

function normalizeAddons(addons = []) {
  return addons.map((addon) => ({
    code: addon.promoteCode,
    rewardCode: addon.rewardCode,
    name: addon.promoteName || '',
    description: addon.promoteDesc || '',
    descriptionText: htmlToText(addon.promoteDesc || ''),
    promoteType: addon.promoteType,
    pricingType: addon.pricingType,
    peopleType: addon.peopleType,
    peopleTypeLabel: PEOPLE_TYPE_LABELS[addon.peopleType] || `People type ${addon.peopleType}`,
    amount: Number(addon.promoteMoney || 0),
    currency: addon.promoteGroup?.[0]?.currencyNum || '',
    prices: normalizeBasePrices(addon.promoteGroup?.[0] || null),
    group: addon.promoteGroup || [],
    clauses: addon.listPromoteClause || [],
    raw: addon,
  }))
}

function buildBodyHtml({ main, travelDetail }) {
  const notices = travelDetail.productNotice?.noticeInfo || []
  const costNotice = notices.find((notice) => notice.noticeType === 0)
  const policyNotices = notices.filter((notice) => notice.noticeType !== 0)
  const sections = []

  if (main.productSpecial) {
    sections.push(`<h2>Highlights</h2>\n${main.productSpecial}`)
  }
  if (main.departureDate) {
    sections.push(`<h2>Departure Date</h2>\n<p>${String(main.departureDate).replace(/\n/g, '<br>')}</p>`)
  }
  if (costNotice?.vluesTip1 || costNotice?.vluesTip2) {
    sections.push(`<h2>Cost Includes</h2>\n${costNotice.vluesTip1 || ''}\n<h2>Cost Excludes</h2>\n${costNotice.vluesTip2 || ''}`)
  }
  if (policyNotices.length > 0) {
    sections.push(
      policyNotices
        .map((notice) => `<h2>${NOTICE_TYPE_LABELS[notice.noticeType] || notice.matterName}</h2>\n${notice.vluesTip1 || ''}`)
        .join('\n'),
    )
  }

  return sections.join('\n\n')
}

function normalizeShopify({ productCode, basic, travelDetail, firstAvailability, currency }) {
  const main = basic.productMain || {}
  const title = main.productName || productCode
  const destinations = normalizeDestinations(basic.productDestination || [])
  const tags = [
    'ToursBMS',
    main.productTypeName,
    `${main.tripDay || ''} days`.trim(),
    ...destinations.map((item) => item.spotName).filter(Boolean),
  ].filter(Boolean)

  const prices = normalizeBasePrices(firstAvailability)
  return {
    title,
    handle: slugify(`${productCode}-${title}`),
    vendor: 'Jupiter Legend Corporation',
    productType: main.productTypeName || 'Tour',
    tags,
    status: main.productStatus === 200 ? 'active_candidate' : 'draft_candidate',
    bodyHtml: buildBodyHtml({ main, travelDetail }),
    options: ['Package price type'],
    variants: prices.map((price) => ({
      option1: price.label,
      sku: `${productCode}-${String(price.label).toUpperCase().replace(/[^A-Z0-9]+/g, '-')}`,
      price: price.amount.toFixed(2),
      currency: currency.currencyNum || 'USD',
      inventoryPolicy: 'continue',
    })),
    metafields: {
      toursbms_product_code: productCode,
      toursbms_group_no: main.groupNo || '',
      toursbms_view_code: main.productViewCode || '',
      duration_days: main.tripDay || null,
      duration_nights: main.nightDay || null,
    },
  }
}

async function extractProduct(args) {
  const now = new Date()
  const start = args.start || formatDate(now)
  const end = args.end || defaultEndDate(now)
  assertDate(start, '--start')
  assertDate(end, '--end')

  const context = await discoverContext(args.productCode, args.lang)

  const [currencyJson, languageJson, basicJson] = await Promise.all([
    postSoa('18554/getListWebSiteCurrency.json', { branchCode: context.branchCode }, context),
    postSoa('17113/getlanguagepackage', { language: args.lang, module: 'L-GFWZ', quality: 'private' }, context),
    postSoa('17626/getProductBasic.json', { mainLanguage: args.lang, productCode: args.productCode }, context),
  ])

  const basic = basicJson.responseData
  const currencies = currencyJson.responseData || []
  const currency = findCurrency(currencies, args.currency, context.branchInfo)

  const [travelJson, groupsJson, addonsJson] = await Promise.all([
    postSoa(
      '17626/getProductTravelDetail.json',
      { productLanguage: args.lang, productCode: args.productCode },
      context,
      { omitToken: true },
    ),
    postSoa(
      '17626/getProductGroup.json',
      {
        startTime: `${start} 00:00:00`,
        endTime: `${end} 23:59:59`,
        productCode: args.productCode,
        currencyCode: currency.currencyCode,
        stockStatus: 200,
        productClassify: basic?.productMain?.productClassify ?? 0,
      },
      context,
    ),
    postSoa(
      '17626/getProductPromote.json',
      {
        productCode: args.productCode,
        groupDate: start,
        gradeCode: '',
        currencyCode: currency.currencyCode,
        productLanguage: args.lang,
      },
      context,
      { allowMissing: true },
    ),
  ])

  assertApiSuccess('getProductPromote', addonsJson)

  const travelDetail = travelJson.responseData || {}
  const groups = groupsJson.responseData || []
  const firstAvailability = groups[0] || null
  const main = basic.productMain || {}
  const notices = normalizeNotice(travelDetail.productNotice?.noticeInfo || [])
  const costNotice = notices.find((notice) => notice.noticeType === 0)

  return {
    extractedAt: new Date().toISOString(),
    product: {
      productCode: args.productCode,
      productViewCode: main.productViewCode || '',
      groupNo: main.groupNo || '',
      title: main.productName || '',
      subtitle: main.subtitleName || '',
      categoryCode: main.productType || '',
      categoryName: main.productTypeName || '',
      productClass: main.productClass,
      productForm: main.productForm,
      duration: {
        days: main.tripDay,
        nights: main.nightDay,
        label: `${main.tripDay || 0} days / ${main.nightDay || 0} nights`,
      },
      start: basic.productPointStart || null,
      end: basic.productPointEnd || null,
      destinations: normalizeDestinations(basic.productDestination || []),
      vehicleCodes: String(main.productVehicle || '').split('|').filter(Boolean),
      vehicles: String(main.productVehicle || '')
        .split('|')
        .filter(Boolean)
        .map((code) => VEHICLE_LABELS[code] || code),
      transferCodes: String(main.productTransfer || '').split('|').filter(Boolean),
      transfers: String(main.productTransfer || '')
        .split('|')
        .filter(Boolean)
        .map((code) => TRANSFER_LABELS[code] || code),
      status: main.productStatus,
      releaseTime: basic.releaseTime || '',
      changeTime: basic.changeTime || main.datachangelasttime || '',
      dataVersion: main.dataVersion,
      raw: main,
    },
    media: {
      images: basic.productImageUrl || [],
      imageObjects: basic.productImageList || [],
      rawProductImg: basic.productImg || [],
    },
    highlights: {
      html: main.productSpecial || '',
      text: htmlToText(main.productSpecial || ''),
      salesNoteHtml: main.salesNote || '',
      salesNoteText: htmlToText(main.salesNote || ''),
    },
    departure: {
      html: String(main.departureDate || '').replace(/\n/g, '<br>'),
      text: main.departureDate || '',
      advanceDay: travelDetail.productNotice?.advanceDay ?? main.advanceDay,
      advanceTime: travelDetail.productNotice?.advanceTime ?? main.advanceTime,
      availabilityStart: start,
      availabilityEnd: end,
    },
    pricing: {
      requestedCurrency: args.currency,
      defaultCurrency: currency,
      supportedCurrencies: currencies,
      firstAvailableDate: firstAvailability?.groupDate || null,
      basePrices: normalizeBasePrices(firstAvailability),
      availability: normalizeAvailability(groups),
    },
    itinerary: {
      productDay: travelDetail.productTravel?.productDay,
      productNight: travelDetail.productTravel?.productNight,
      travelName: travelDetail.productTravel?.travelName || '',
      days: normalizeItinerary(travelDetail.productTravel?.productTravelInfoList || []),
      raw: travelDetail.productTravel || null,
    },
    cost: {
      includesHtml: costNotice?.html.primary || '',
      includesText: costNotice?.text.primary || '',
      excludesHtml: costNotice?.html.secondary || '',
      excludesText: costNotice?.text.secondary || '',
      productCostIsDay: travelDetail.productCost?.productCostIsDay,
      costInfo: travelDetail.productCost?.list || [],
    },
    policy_notice: {
      notices,
      damagesInfo: travelDetail.productNotice?.damagesInfo || [],
    },
    pickup_dropoff: {
      pickup: normalizeCarpoints(basic.productCarpointUpper || []),
      dropoff: normalizeCarpoints(basic.productCarpointDown || []),
      teamPickup: normalizeCarpoints(basic.teamCarpointUpper || []),
      teamDropoff: normalizeCarpoints(basic.teamCarpointDown || []),
    },
    constraints: {
      confirmType: basic.productConstraint?.confirmType,
      confirmTypeLabel: basic.productConstraint?.confirmType === 1 ? 'Confirm manually' : 'Confirm systematically',
      isAgeLimited: basic.productConstraint?.isAge === 1,
      needsIdNumber: basic.productConstraint?.isNumber === 1,
      isChildAvailable: basic.productConstraint?.isChild === 1,
      childAge: basic.productConstraint?.childAge || '',
      childHeight: basic.productConstraint?.childHeight || '',
      childNote: basic.productConstraint?.childNote || '',
      infantNote: basic.productConstraint?.infantNote || '',
      seniorNote: basic.productConstraint?.seniorNote || '',
      raw: basic.productConstraint || null,
    },
    addons: normalizeAddons(addonsJson.responseData || []),
    shopify_mapping: normalizeShopify({
      productCode: args.productCode,
      basic,
      travelDetail,
      firstAvailability,
      currency,
    }),
    source: {
      productPageUrl: context.pageUrl,
      branchCode: context.branchCode,
      branchName: context.branchInfo.branchName || '',
      language: args.lang,
      languagePackage: languageJson.responseData || {},
      endpoints: {
        productBasic: `${SOA_BASE}/17626/getProductBasic.json`,
        productTravelDetail: `${SOA_BASE}/17626/getProductTravelDetail.json`,
        productGroup: `${SOA_BASE}/17626/getProductGroup.json`,
        productPromote: `${SOA_BASE}/17626/getProductPromote.json`,
        currencies: `${SOA_BASE}/18554/getListWebSiteCurrency.json`,
      },
      raw: {
        branchInfo: context.branchInfo,
        basic,
        travelDetail,
        groups,
        addons: addonsJson.responseData || [],
      },
    },
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    usage()
    return
  }

  const outputPath = resolve(args.out || `data/toursbms-products/${args.productCode}.json`)
  const normalized = await extractProduct(args)
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8')

  console.log(`Wrote ${outputPath}`)
  console.log(`Product: ${normalized.product.title}`)
  console.log(`Base prices: ${normalized.pricing.basePrices.map((price) => `${price.label} ${price.amount}`).join(', ')}`)
}

main().catch((error) => {
  console.error(error.stack || error.message)
  process.exit(1)
})
