const PLACE_DEFINITIONS = [
  { country: 'United States', cities: {
    'New York': ['new york', 'new york city', 'nyc', '纽约', '紐約'],
    'Los Angeles': ['los angeles', '洛杉矶', '洛杉磯'],
    'Las Vegas': ['las vegas', '拉斯维加斯', '拉斯維加斯'],
    'San Francisco': ['san francisco', '旧金山', '舊金山', '三藩市'],
    'Salt Lake City': ['salt lake city', '盐湖城', '鹽湖城'],
    'Seattle': ['seattle', '西雅图', '西雅圖'],
    'Washington': ['washington dc', 'washington, dc', '华盛顿', '華盛頓'],
    'Boston': ['boston', '波士顿', '波士頓'],
    'Chicago': ['chicago', '芝加哥'],
    'Orlando': ['orlando', '奥兰多', '奧蘭多'],
    'Miami': ['miami', '迈阿密', '邁阿密'],
    'Honolulu': ['honolulu', '檀香山', '火奴鲁鲁', '火奴魯魯'],
    'Anchorage': ['anchorage', '安克雷奇'],
    'Denver': ['denver', '丹佛'],
    'Page': ['page, az', 'page arizona', '佩吉'],
  }, aliases: ['united states', 'united states of america', 'usa', 'u.s.a.', '美国', '美國'] },
  { country: 'Canada', cities: {
    'Vancouver': ['vancouver', '温哥华', '溫哥華'], 'Toronto': ['toronto', '多伦多', '多倫多'],
    'Calgary': ['calgary', '卡尔加里', '卡爾加里'], 'Banff': ['banff', '班芙'],
    'Montreal': ['montreal', '蒙特利尔', '蒙特利爾'], 'Quebec City': ['quebec city', '魁北克市'],
    'Victoria': ['victoria bc', 'victoria, bc', '维多利亚', '維多利亞'], 'Ottawa': ['ottawa', '渥太华', '渥太華'],
  }, aliases: ['canada', '加拿大'] },
  { country: 'Mexico', cities: {
    'Cancun': ['cancun', 'cancún', '坎昆'], 'Mexico City': ['mexico city', '墨西哥城'],
    'Tulum': ['tulum', '图卢姆', '圖盧姆'], 'Playa del Carmen': ['playa del carmen', '卡门海滩', '卡門海灘'],
  }, aliases: ['mexico', 'méxico', '墨西哥'] },
  { country: 'China', cities: {
    'Beijing': ['beijing', '北京'], 'Shanghai': ['shanghai', '上海'], 'Xi\'an': ["xi'an", 'xian', '西安'],
    'Guangzhou': ['guangzhou', '广州', '廣州'], 'Shenzhen': ['shenzhen', '深圳'], 'Chengdu': ['chengdu', '成都'],
    'Hong Kong': ['hong kong', '香港'], 'Macau': ['macau', 'macao', '澳门', '澳門'],
  }, aliases: ['china', '中国', '中國'] },
  { country: 'Japan', cities: { 'Tokyo': ['tokyo', '东京', '東京'], 'Osaka': ['osaka', '大阪'], 'Kyoto': ['kyoto', '京都'], 'Sapporo': ['sapporo', '札幌'] }, aliases: ['japan', '日本'] },
  { country: 'South Korea', cities: { 'Seoul': ['seoul', '首尔', '首爾'], 'Busan': ['busan', '釜山'] }, aliases: ['south korea', 'korea', '韩国', '韓國'] },
  { country: 'Peru', cities: { 'Lima': ['lima', '利马', '利馬'], 'Cusco': ['cusco', 'cuzco', '库斯科', '庫斯科'] }, aliases: ['peru', 'perú', '秘鲁', '秘魯'] },
  { country: 'United Kingdom', cities: { 'London': ['london', '伦敦', '倫敦'], 'Edinburgh': ['edinburgh', '爱丁堡', '愛丁堡'] }, aliases: ['united kingdom', 'great britain', 'uk', '英国', '英國'] },
  { country: 'France', cities: { 'Paris': ['paris', '巴黎'], 'Nice': ['nice france', 'nice, france', '尼斯'] }, aliases: ['france', '法国', '法國'] },
  { country: 'Italy', cities: { 'Rome': ['rome', '罗马', '羅馬'], 'Venice': ['venice', '威尼斯'], 'Florence': ['florence', '佛罗伦萨', '佛羅倫斯'] }, aliases: ['italy', '意大利', '義大利'] },
  { country: 'Spain', cities: { 'Madrid': ['madrid', '马德里', '馬德里'], 'Barcelona': ['barcelona', '巴塞罗那', '巴塞隆納'] }, aliases: ['spain', '西班牙'] },
  { country: 'Switzerland', cities: { 'Zurich': ['zurich', 'zürich', '苏黎世', '蘇黎世'], 'Geneva': ['geneva', '日内瓦', '日內瓦'], 'Lucerne': ['lucerne', 'luzern', '卢塞恩', '琉森'] }, aliases: ['switzerland', '瑞士'] },
  { country: 'Iceland', cities: { 'Reykjavik': ['reykjavik', 'reykjavík', '雷克雅未克'] }, aliases: ['iceland', '冰岛', '冰島'] },
  { country: 'Greece', cities: { 'Athens': ['athens', '雅典'], 'Santorini': ['santorini', '圣托里尼', '聖托里尼'] }, aliases: ['greece', '希腊', '希臘'] },
  { country: 'Australia', cities: { 'Sydney': ['sydney', '悉尼', '雪梨'], 'Melbourne': ['melbourne', '墨尔本', '墨爾本'], 'Brisbane': ['brisbane', '布里斯班'] }, aliases: ['australia', '澳大利亚', '澳大利亞', '澳洲'] },
  { country: 'New Zealand', cities: { 'Auckland': ['auckland', '奥克兰', '奧克蘭'], 'Queenstown': ['queenstown', '皇后镇', '皇后鎮'] }, aliases: ['new zealand', '新西兰', '紐西蘭'] },
  { country: 'Singapore', cities: { 'Singapore': ['singapore', '新加坡'] }, aliases: ['singapore', '新加坡'] },
  { country: 'Thailand', cities: { 'Bangkok': ['bangkok', '曼谷'], 'Chiang Mai': ['chiang mai', '清迈', '清邁'], 'Phuket': ['phuket', '普吉'] }, aliases: ['thailand', '泰国', '泰國'] },
  { country: 'United Arab Emirates', cities: { 'Dubai': ['dubai', '迪拜', '杜拜'], 'Abu Dhabi': ['abu dhabi', '阿布扎比', '阿布達比'] }, aliases: ['united arab emirates', 'uae', '阿联酋', '阿聯酋'] },
]

const CONFIDENCE_RANK = { low: 1, medium: 2, high: 3 }
const AMBIGUOUS_CITIES = new Set(['Auckland', 'London', 'Washington', 'Victoria', 'Page', 'Rome', 'Nice'])
const matchCache = new Map()

function normalize(value) {
  return String(value || '').normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim()
}

function containsAlias(text, alias) {
  const needle = normalize(alias)
  if (!needle) return false
  if (/^[a-z0-9 .,'-]+$/i.test(needle)) {
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(text)
  }
  return text.includes(needle)
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function explicitDestinationEvidence(product) {
  const evidence = []
  for (const destination of product.destinations || []) {
    const country = destination.country || destination.countryName || destination.raw?.countryName
    const city = destination.city || destination.cityName || destination.raw?.cityName
    if (country) evidence.push({ kind: 'country', value: country, source: 'destination.explicit', confidence: 'high' })
    if (city) evidence.push({ kind: 'city', value: city, country, source: 'destination.explicit', confidence: 'high' })
  }
  return evidence
}

function selectedEvidence(json) {
  const product = json.product || {}
  const strong = [product.title, product.subtitle, product.start?.regionName, product.end?.regionName,
    ...(product.destinations || []).flatMap((item) => [item.spotName, item.scenic, item.scenicName, item.province, item.provinceName, item.cityName, item.country]),
  ]
  const medium = [
    json.itinerary?.travelName,
    ...(json.itinerary?.days || []).flatMap((day) => [day.section, day.todayLocation, ...(day.sectionStops || []).map((stop) => stop.label || stop.place)]),
    ...(json.pickup_dropoff?.pickup || []).flatMap((point) => [point.name, point.address]),
    ...(json.pickup_dropoff?.dropoff || []).flatMap((point) => [point.name, point.address]),
  ]
  return { strong: normalize(strong.filter(Boolean).join(' | ')), medium: normalize(medium.filter(Boolean).join(' | ')) }
}

function dictionaryMatches(json) {
  const cacheKey = JSON.stringify([json.product?.title, json.product?.start?.regionName, json.product?.end?.regionName, json.product?.destinations, json.itinerary?.travelName])
  if (matchCache.has(cacheKey)) return structuredClone(matchCache.get(cacheKey))
  const text = selectedEvidence(json)
  const matches = []
  for (const definition of PLACE_DEFINITIONS) {
    for (const [city, aliases] of Object.entries(definition.cities)) {
      const strongAlias = aliases.find((alias) => containsAlias(text.strong, alias))
      const mediumAlias = aliases.find((alias) => containsAlias(text.medium, alias))
      if (strongAlias || mediumAlias) matches.push({ kind: 'city', value: city, country: definition.country, source: strongAlias ? 'structured-place' : 'itinerary-place', matched: strongAlias || mediumAlias, confidence: strongAlias ? 'high' : 'medium' })
    }
    const strongCountry = definition.aliases.find((alias) => containsAlias(text.strong, alias))
    if (strongCountry) matches.push({ kind: 'country', value: definition.country, source: 'structured-place', matched: strongCountry, confidence: 'high' })
  }
  const supportedCountries = new Set(matches.filter((item) => item.kind === 'country' || (item.kind === 'city' && !AMBIGUOUS_CITIES.has(item.value))).map((item) => item.country || item.value))
  const safeMatches = matches.filter((item) => item.kind !== 'city' || !AMBIGUOUS_CITIES.has(item.value) || supportedCountries.has(item.country))
  matchCache.set(cacheKey, safeMatches)
  return structuredClone(safeMatches)
}

function bestConfidence(evidence) {
  return evidence.reduce((best, item) => CONFIDENCE_RANK[item.confidence] > CONFIDENCE_RANK[best] ? item.confidence : best, 'low')
}

export function enrichProductLocations(json) {
  const product = json.product || (json.product = {})
  const evidence = [...explicitDestinationEvidence(product), ...dictionaryMatches(json)]
  for (const cityEvidence of evidence.filter((item) => item.kind === 'city' && item.country)) {
    evidence.push({ kind: 'country', value: cityEvidence.country, source: cityEvidence.source, matched: cityEvidence.matched, confidence: cityEvidence.confidence })
  }
  const countries = unique(evidence.filter((item) => item.kind === 'country').map((item) => item.value))
  const cities = unique(evidence.filter((item) => item.kind === 'city').map((item) => item.value))
  const explicitCountries = evidence.filter((item) => item.kind === 'country' && item.source === 'destination.explicit').map((item) => item.value)
  const explicitCities = evidence.filter((item) => item.kind === 'city' && item.source === 'destination.explicit').map((item) => item.value)
  const startText = normalize(product.start?.regionName)
  const titleText = normalize(product.title)
  const cityEvidence = evidence.filter((item) => item.kind === 'city')
  const startCity = cityEvidence.find((item) => containsAlias(startText, item.matched || item.value))
  const titleCity = [...cityEvidence].sort((a, b) => {
    const aIndex = titleText.indexOf(normalize(a.matched || a.value))
    const bIndex = titleText.indexOf(normalize(b.matched || b.value))
    return (aIndex < 0 ? Number.MAX_SAFE_INTEGER : aIndex) - (bIndex < 0 ? Number.MAX_SAFE_INTEGER : bIndex)
  }).find((item) => titleText.includes(normalize(item.matched || item.value)))
  const primaryCityEvidence = startCity || titleCity || cityEvidence[0]
  const primaryCity = explicitCities[0] || primaryCityEvidence?.value || ''
  const primaryCountry = explicitCountries[0] || primaryCityEvidence?.country || countries[0] || ''
  const reasons = []
  if (countries.length === 0) reasons.push('country-unresolved')
  if (cities.length === 0) reasons.push('city-unresolved')
  if (cities.length > 1 && !primaryCity) reasons.push('primary-city-ambiguous')
  const confidence = evidence.length ? bestConfidence(evidence) : 'low'
  product.location = {
    countries, cities, primaryCountry, primaryCity, confidence,
    evidence: evidence.map(({ kind, value, country, source, matched, confidence: itemConfidence }) => ({ kind, value, ...(country ? { country } : {}), source, ...(matched ? { matched } : {}), confidence: itemConfidence })),
    isMultiCountry: countries.length > 1,
    isMultiCity: cities.length > 1,
    needsReview: reasons.length > 0,
    reviewReasons: reasons,
  }
  return json
}

export function locationReviewEntry(json, file = '') {
  const location = json.product?.location
  if (!location?.needsReview) return null
  return { productCode: json.product?.productCode || '', title: json.product?.title || '', file, countries: location.countries, cities: location.cities, reasons: location.reviewReasons }
}
