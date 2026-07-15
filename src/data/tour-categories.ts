export type SupportedLocale = 'en' | 'zh-CN' | 'zh-TW'

export type LocalizedText = Record<SupportedLocale, string>

export type TourCategory = {
  slug: string
  title: LocalizedText
  description: LocalizedText
  queries: string[]
  heroImage: string
  tags: string[]
}

export type HomepageTourTab = {
  id: string
  label: LocalizedText
  href: string
  queries: string[]
}

export type HomepageTourSection = {
  id: string
  title: LocalizedText
  icon: string
  moreHref: string
  tabs: HomepageTourTab[]
}

export const CATEGORY_SLUGS = [
  'cancun',
  'new-york',
  'yellowstone',
  'calgary-rockies',
  'alaska',
  'europe',
  'china',
  'peru',
  'platinum-tours',
  'private-tours',
  'day-tours',
] as const

const t = (en: string, zhCN: string, zhTW = zhCN): LocalizedText => ({
  en,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
})

const tourTagQuery = (...tags: string[]) => ['tag:tour', ...tags.map((tag) => `tag:${tag}`)].join(' AND ')
const legacyTagQuery = (tag: string) => `tag:${tag}`

export const TOUR_CATEGORIES: Record<string, TourCategory> = {
  cancun: {
    slug: 'cancun',
    title: t('Cancun Tours', '坎昆旅游', '坎昆旅遊'),
    description: t(
      'Romantic Cancun vacations, Mayan culture, all-inclusive hotels, Xcaret, Xplor, and beach escapes.',
      '坎昆度假、玛雅文化、全包酒店、主题公园和海岛休闲线路。',
      '坎昆度假、瑪雅文化、全包酒店、主題公園和海島休閒線路。',
    ),
    queries: [tourTagQuery('dest-cancun'), legacyTagQuery('Mexico'), 'Cancun OR Cancún'],
    heroImage: '/tff/20260622011449217558482.jpg',
    tags: ['dest-cancun', 'region-latin-america'],
  },
  'new-york': {
    slug: 'new-york',
    title: t('New York Tours', '纽约旅游', '紐約旅遊'),
    description: t(
      'East Coast classics, New York departures, Boston, Washington DC, Niagara Falls, and short local trips.',
      '纽约出发、美东名城、波士顿、华盛顿特区、尼亚加拉瀑布和周边短线。',
      '紐約出發、美東名城、波士頓、華盛頓特區、尼亞加拉瀑布和周邊短線。',
    ),
    queries: [tourTagQuery('dest-new-york'), 'New York OR 纽约'],
    heroImage: '/tff/2026052709301093627115.jpg',
    tags: ['dest-new-york', 'region-north-america'],
  },
  yellowstone: {
    slug: 'yellowstone',
    title: t('Yellowstone Tours', '黄石公园旅游', '黃石公園旅遊'),
    description: t(
      'Yellowstone, Grand Teton, Salt Lake City, Las Vegas, and western national park routes.',
      '黄石、大提顿、盐湖城、拉斯维加斯和美西国家公园线路。',
      '黃石、大提頓、鹽湖城、拉斯維加斯和美西國家公園線路。',
    ),
    queries: [tourTagQuery('dest-yellowstone'), 'Yellowstone OR 黄石'],
    heroImage: '/tff/20260612074237256168449.jpg',
    tags: ['dest-yellowstone', 'dest-salt-lake-city', 'region-north-america'],
  },
  'calgary-rockies': {
    slug: 'calgary-rockies',
    title: t('Calgary & Rockies Tours', '卡尔加里落基山旅游', '卡爾加里落基山旅遊'),
    description: t(
      'Calgary, Banff, Jasper, Lake Louise, Columbia Icefield, and Canadian Rockies vacations.',
      '卡尔加里、班芙、贾斯珀、露易丝湖、哥伦比亚冰原和加拿大落基山线路。',
      '卡爾加里、班芙、賈斯珀、露易絲湖、哥倫比亞冰原和加拿大落基山線路。',
    ),
    queries: [tourTagQuery('dest-calgary'), 'Calgary OR Banff OR 卡尔加里 OR 班芙'],
    heroImage: '/tff/20250331013739000245945.jpg',
    tags: ['dest-calgary', 'region-north-america'],
  },
  alaska: {
    slug: 'alaska',
    title: t('Alaska Tours', '阿拉斯加旅游', '阿拉斯加旅遊'),
    description: t(
      'Anchorage, Fairbanks, midnight sun, aurora, glaciers, and Alaska seasonal adventures.',
      '安克雷奇、费尔班克斯、午夜阳光、极光、冰川和阿拉斯加季节限定线路。',
      '安克雷奇、費爾班克斯、午夜陽光、極光、冰川和阿拉斯加季節限定線路。',
    ),
    queries: [tourTagQuery('dest-alaska'), 'Alaska OR 阿拉斯加'],
    heroImage: '/tff/20250331013739000245945.jpg',
    tags: ['dest-alaska', 'region-north-america'],
  },
  europe: {
    slug: 'europe',
    title: t('Europe Tours', '欧洲旅游', '歐洲旅遊'),
    description: t(
      'Classic Europe loops, Spain, Greece, Switzerland, the UK, Iceland, Nordic routes, and polar trips.',
      '欧洲环线、西班牙、希腊、瑞士、英国、冰岛、北欧和极地线路。',
      '歐洲環線、西班牙、希臘、瑞士、英國、冰島、北歐和極地線路。',
    ),
    queries: [tourTagQuery('region-europe'), 'Europe OR 欧洲'],
    heroImage: '/tff/20260612071803989129395.jpg',
    tags: ['region-europe'],
  },
  china: {
    slug: 'china',
    title: t('China Tours', '中国旅游', '中國旅遊'),
    description: t(
      'China inbound tours, Beijing, Xi’an, Shanghai, classic cities, culture, and heritage routes.',
      '中国入境游、北京、西安、上海、经典名城、人文和历史线路。',
      '中國入境遊、北京、西安、上海、經典名城、人文和歷史線路。',
    ),
    queries: [tourTagQuery('dest-china'), 'China OR 中国'],
    heroImage: '/tff/20260703021815892716696887.jpg',
    tags: ['dest-china', 'region-asia'],
  },
  peru: {
    slug: 'peru',
    title: t('Peru Tours', '秘鲁旅游', '秘魯旅遊'),
    description: t(
      'Peru, Cusco, Machu Picchu, ancient civilizations, and Latin America culture tours.',
      '秘鲁、库斯科、马丘比丘、古文明探索和拉美文化线路。',
      '秘魯、庫斯科、馬丘比丘、古文明探索和拉美文化線路。',
    ),
    queries: [tourTagQuery('dest-peru'), 'Peru OR 秘鲁'],
    heroImage: '/tff/20260104055420439777289.png',
    tags: ['dest-peru', 'region-latin-america'],
  },
  'platinum-tours': {
    slug: 'platinum-tours',
    title: t('Platinum Tours', '白金尊享', '白金尊享'),
    description: t(
      'Premium escorted tours with upgraded hotels, curated routes, and more inclusive service.',
      '高端酒店、精选线路、更多包含服务的白金尊享产品。',
      '高端酒店、精選線路、更多包含服務的白金尊享產品。',
    ),
    queries: [tourTagQuery('type-platinum'), '白金尊享 OR Platinum'],
    heroImage: '/tff/20260622011449217558482.jpg',
    tags: ['type-platinum'],
  },
  'private-tours': {
    slug: 'private-tours',
    title: t('Private Tours', '私家包团', '私家包團'),
    description: t(
      'Private and custom group tours for families, companies, schools, and special-interest travel.',
      '适合家庭、企业、学校和主题出行的私家包团与定制线路。',
      '適合家庭、企業、學校和主題出行的私家包團與定制線路。',
    ),
    queries: [tourTagQuery('type-private'), '私家包团 OR Private'],
    heroImage: '/tff/tab-private.png',
    tags: ['type-private'],
  },
  'day-tours': {
    slug: 'day-tours',
    title: t('Day Tours', '一日游与短线', '一日遊與短線'),
    description: t(
      'Half-day, one-day, and two-day local tours for travelers who want compact itineraries.',
      '半日、一日和两日周边短线，适合轻松灵活安排行程。',
      '半日、一日和兩日周邊短線，適合輕鬆靈活安排行程。',
    ),
    queries: [tourTagQuery('duration-1-day'), '1 day OR 1日游 OR 一日游'],
    heroImage: '/tff/tab-play.png',
    tags: ['duration-1-day'],
  },
}

export const HOMEPAGE_TOUR_SECTIONS: HomepageTourSection[] = [
  {
    id: 'north-america',
    title: t('North America Tours', '北美热门线路', '北美熱門線路'),
    icon: '/tff/usa-title-icon.png',
    moreHref: '/new-york',
    tabs: [
      { id: 'new-york', label: t('New York', '纽约', '紐約'), href: '/new-york', queries: TOUR_CATEGORIES['new-york'].queries },
      { id: 'yellowstone', label: t('Yellowstone', '黄石公园', '黃石公園'), href: '/yellowstone', queries: TOUR_CATEGORIES.yellowstone.queries },
      { id: 'rockies', label: t('Calgary & Rockies', '卡尔加里落基山', '卡爾加里落基山'), href: '/calgary-rockies', queries: TOUR_CATEGORIES['calgary-rockies'].queries },
      { id: 'alaska', label: t('Alaska', '阿拉斯加', '阿拉斯加'), href: '/alaska', queries: TOUR_CATEGORIES.alaska.queries },
    ],
  },
  {
    id: 'latin-america',
    title: t('Latin America & Caribbean', '拉美与加勒比', '拉美與加勒比'),
    icon: '/tff/usa-title-icon.png',
    moreHref: '/cancun',
    tabs: [
      { id: 'cancun', label: t('Cancun', '坎昆', '坎昆'), href: '/cancun', queries: TOUR_CATEGORIES.cancun.queries },
      { id: 'peru', label: t('Peru', '秘鲁', '秘魯'), href: '/peru', queries: TOUR_CATEGORIES.peru.queries },
      { id: 'platinum', label: t('Platinum', '白金尊享', '白金尊享'), href: '/platinum-tours', queries: TOUR_CATEGORIES['platinum-tours'].queries },
    ],
  },
  {
    id: 'europe-world',
    title: t('Europe & World Tours', '欧洲与世界精选', '歐洲與世界精選'),
    icon: '/tff/usa-title-icon.png',
    moreHref: '/europe',
    tabs: [
      { id: 'europe', label: t('Europe', '欧洲', '歐洲'), href: '/europe', queries: TOUR_CATEGORIES.europe.queries },
      { id: 'china', label: t('China', '中国', '中國'), href: '/china', queries: TOUR_CATEGORIES.china.queries },
      { id: 'day-tours', label: t('Short Tours', '一日游与短线', '一日遊與短線'), href: '/day-tours', queries: TOUR_CATEGORIES['day-tours'].queries },
      { id: 'private', label: t('Private', '私家包团', '私家包團'), href: '/private-tours', queries: TOUR_CATEGORIES['private-tours'].queries },
    ],
  },
]

export function getLocalizedText(text: LocalizedText, locale: string) {
  return text[(locale as SupportedLocale) || 'zh-CN'] ?? text['zh-CN'] ?? text.en
}
