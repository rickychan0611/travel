import type { CollectionProduct } from '@/lib/shopify/types'

export const TFF_BLUE = '#0090f2'
export const TFF_ORANGE = '#fb5f10'
export const TFF_GOLD = '#f5a801'

export const HOT_SEARCH_TAGS = [
  '夏季阿拉斯加',
  '夏季黄石5折',
  '欧洲精品小团',
  '夏威夷',
  '新西兰',
  '班夫',
]

export const PHONE_LINES = [
  { region: '7x24小时服务热线', number: '' },
  { region: '(美国)', number: '866-638-6888' },
  { region: '(国际)', number: '1-626-389-8666' },
  { region: '(中国台湾)', number: '886-277039159' },
  { region: '(中国香港)', number: '852-30024111' },
  { region: '(中国大陆)', number: '023-81744260' },
]

export type MegaNavItem = {
  id: string
  label: string
  href?: string
  hot?: boolean
  /** Flat hover tags (matches old Tours4fun header popovers) */
  links?: Array<{ label: string; href: string }>
}

export const MEGA_NAV: MegaNavItem[] = [
  { id: 'home', label: '首页', href: '/' },
  {
    id: 'americas',
    label: '美洲旅游',
    href: '/tours?q=美洲',
    links: [
      { label: '北美洲', href: '/tours?q=北美洲' },
      { label: '南美洲', href: '/tours?q=南美洲' },
      { label: '加勒比海地区', href: '/tours?q=加勒比' },
      { label: '特价·北美周边游', href: '/tours?q=北美周边' },
    ],
  },
  {
    id: 'europe',
    label: '欧洲旅游',
    href: '/tours?q=欧洲',
    links: [
      { label: '多日游', href: '/tours?q=欧洲多日游' },
      { label: '欧洲循环游', href: '/tours?q=欧洲循环游' },
      { label: '精品小团', href: '/tours?q=欧洲精品小团' },
      { label: '一日游', href: '/tours?q=欧洲一日游' },
    ],
  },
  {
    id: 'anz',
    label: '澳新旅游',
    href: '/tours?q=澳新',
    links: [
      { label: '新西兰', href: '/tours?q=新西兰' },
      { label: '澳大利亚', href: '/tours?q=澳大利亚' },
    ],
  },
  {
    id: 'small_group',
    label: '省心小团',
    hot: true,
    href: '/tours?q=小团',
    links: [
      { label: '美国小团', href: '/tours?q=美国小团' },
      { label: '欧洲小团', href: '/tours?q=欧洲小团' },
      { label: '加拿大小团', href: '/tours?q=加拿大小团' },
      { label: '拉美小团', href: '/tours?q=拉美小团' },
      { label: '澳新小团', href: '/tours?q=澳新小团' },
      { label: '亚洲小团', href: '/tours?q=亚洲小团' },
    ],
  },
  { id: 'preferred', label: '途风优选', hot: true, href: '/tours?q=途风优选' },
  { id: 'custom', label: '定制旅行', href: '/about' },
  {
    id: 'cruise',
    label: '全球邮轮',
    href: '/tours?q=邮轮',
    links: [
      { label: '南北极邮轮', href: '/tours?q=南北极邮轮' },
      { label: '中文服务的邮轮', href: '/tours?q=中文邮轮' },
      { label: '欧洲内陆河轮', href: '/tours?q=欧洲内河游轮' },
      { label: '中国长江航线', href: '/tours?q=长江' },
      { label: '更多热门航线', href: '/tours?q=邮轮' },
    ],
  },
  { id: 'luxury', label: '高端度假', href: '/tours?q=高端度假' },
]

export type HotDestinationRegion = {
  id: string
  title: string
  badge: string
  links: string[]
}

export const HOT_DESTINATIONS: HotDestinationRegion[] = [
  {
    id: 'us',
    title: '美国旅游',
    badge: '夏季黄石5折',
    links: ['洛杉矶', '美西国家公园', '纽约', '羚羊谷', '拉斯维加斯', '旧金山', '阿拉斯加', '黄石'],
  },
  {
    id: 'canada',
    title: '加拿大&拉美',
    badge: '夏季班芙公园',
    links: ['卡尔加里', '温哥华', '多伦多', '秘鲁', '墨西哥', '尼亚加拉'],
  },
  {
    id: 'europe',
    title: '欧洲旅游',
    badge: '精品小团9折起',
    links: ['北欧峡湾', '英国', '冰岛', '法瑞意', '土耳其希腊', '西葡'],
  },
  {
    id: 'asia',
    title: '亚非&澳新',
    badge: '日本夏季8折起',
    links: ['中国', '日本', '新西兰', '澳大利亚', '埃及', '东南亚'],
  },
]

export const HOME_BANNERS = [
  { src: '/tff/20260703021815892716696887.jpg', alt: '四川九寨沟', label: '四川九寨沟专卖店' },
  { src: '/tff/2026052709301093627115.jpg', alt: '美国名城', label: '美国名城' },
  { src: '/tff/20260612074237256168449.jpg', alt: '美西国家公园', label: '美西国家公园' },
  { src: '/tff/20260612071803989129395.jpg', alt: '欧洲精品小团', label: '欧洲精品小团' },
  { src: '/tff/20260622011449217558482.jpg', alt: '澳新假期', label: '澳新假期' },
  { src: '/tff/20260702091241005449510011.jpg', alt: '世界杯专线', label: '世界杯专线' },
]

export const HOME_NAV_TILES = [
  { id: 'private', title: '私家包团', subtitle: '点击查看', image: '/tff/tab-private.png', href: '/tours' },
  { id: 'local', title: '当地玩乐', subtitle: '点击查看', image: '/tff/tab-play.png', href: '/tours' },
  { id: 'boutique', title: '精品小团', subtitle: '点击查看', image: '/tff/tab-small.png', href: '/tours' },
  { id: 'cruise', title: '全球邮轮', subtitle: '点击查看', image: '/tff/tab-cruise.png', href: '/tours' },
]

export const SEASON_MUST_PLAY = [
  {
    title: '北欧峡湾',
    blurb: '挪威峡湾 · 极光与午夜阳光',
    image: '/tff/20250331013739000245945.jpg',
  },
  {
    title: '玩转澳新',
    blurb: '南半球纯净自然假期',
    image: '/tff/20260104055410599778856.png',
  },
  {
    title: '印加古国',
    blurb: '秘鲁马丘比丘深度游',
    image: '/tff/20260104055420439777289.png',
  },
  {
    title: '中国入境',
    blurb: '你好中国 · 经典名城',
    image: '/tff/20260104055429833543159.png',
  },
  {
    title: '神秘东方',
    blurb: '日本 · 东南亚精选',
    image: '/tff/20231013032711409913215.jpg',
  },
]

export type DestinationProduct = {
  title: string
  image: string
  price: number
  originalPrice?: number
}

export type DestinationCategory = {
  id: string
  label: string
  href: string
  products: DestinationProduct[]
  hotRank: Array<DestinationProduct & { rank: number }>
  reviews: Array<{
    name: string
    avatar: string
    rating: number
    text: string
    date: string
    productTitle: string
  }>
}

export const USA_TRAVEL = {
  title: '美国旅游',
  icon: '/tff/usa-title-icon.png',
  moreHref: '/tours?q=美国',
  categories: [
    {
      id: 'yellowstone',
      label: '黄石公园｜5折起',
      href: '/tours?q=黄石',
      products: [
        {
          title:
            '<5天>【大团价格小团人数·12人团】买2送2/送1 黄石+大提顿15景·俯瞰大棱镜+大提顿峰全景+牛蹄湾+老忠实+牵牛花',
          image: '/tff/20250605104800045471942.jpg',
          price: 328.82,
          originalPrice: 353.82,
        },
        {
          title:
            '<5天>【13人团 | 保证2晚住园内价值$1000老忠实木屋】·3天2晚黄石&大提顿公园深度游+黄石湖自驾小艇',
          image: '/tff/20260306063508357241087.png',
          price: 1061.73,
          originalPrice: 1211.73,
        },
        {
          title:
            '<7天>【住拉斯五钻酒店 · 3城4公园+摄影圣地】·停留12-15大黄石景点+大峡谷全景+羚羊彩穴+马蹄湾',
          image: '/tff/20260318022500367869089.jpg',
          price: 743.83,
          originalPrice: 894.33,
        },
        {
          title:
            '<7天>【13人小团 | 国家公园与摄影环线｜3天2晚黄石15景】·三进黄石+4大国家公园2大网红摄影地',
          image: '/tff/0102c120008i7ptex646C_C_750_420.jpg',
          price: 785.33,
          originalPrice: 835.33,
        },
        {
          title:
            '<5天>【性价比优选｜三进黄石 、3天2晚黄石15大景点】·2晚入住西黄石酒店+2大国家公园',
          image: '/tff/0302w12000qghi8je71A4_C_750_420.jpg',
          price: 474,
        },
      ],
      hotRank: [
        {
          rank: 1,
          title: '<5天>【大团价格小团人数·12人团】买2送2/送1 黄石+大提顿15景',
          image: '/tff/20250605104800045471942.jpg',
          price: 328.82,
        },
        {
          rank: 2,
          title: '<5天>【13人团 | 保证2晚住园内价值$1000老忠实木屋】',
          image: '/tff/20260306063508357241087.png',
          price: 1061.73,
        },
        {
          rank: 3,
          title: '<7天>【住拉斯五钻酒店 · 3城4公园+摄影圣地】',
          image: '/tff/20260318022500367869089.jpg',
          price: 743.83,
        },
        {
          rank: 4,
          title: '<5天>【性价比优选｜三进黄石 、3天2晚黄石15大景点】',
          image: '/tff/0302w12000qghi8je71A4_C_750_420.jpg',
          price: 372.5,
        },
      ],
      reviews: [
        {
          name: 'Beauty9988',
          avatar: '/tff/avatar.png',
          rating: 5,
          text: '这几天感谢jack zhu 导游，玩的开心. 这几天是很开心的，值得',
          date: '2026-06-30',
          productTitle:
            '<5天>【13人团 | 保证2晚住园内价值$1000老忠实木屋】·3天2晚黄石&大提顿公园深度游',
        },
        {
          name: 'yachun666',
          avatar: '/tff/avatar.png',
          rating: 5,
          text: '这一程，真的很幸运——遇到了一群真诚又温暖的旅伴，导游也很专业。',
          date: '2026-06-22',
          productTitle: '<5天>【大团价格小团人数·12人团】买2送2/送1 黄石+大提顿15景',
        },
        {
          name: '王女士',
          avatar: '/tff/avatar.png',
          rating: 5,
          text: '导游非常专业，行程安排合理，黄石公园景色太美了！下次还会再来。',
          date: '2026-06-12',
          productTitle: '<7天>【住拉斯五钻酒店 · 3城4公园+摄影圣地】',
        },
      ],
    },
    {
      id: 'west-parks',
      label: '美西国家公园环线',
      href: '/tours?q=美西国家公园',
      products: [],
      hotRank: [],
      reviews: [],
    },
    {
      id: 'east',
      label: '美东名城与大瀑布',
      href: '/tours?q=美东',
      products: [],
      hotRank: [],
      reviews: [],
    },
    {
      id: 'vegas',
      label: '拉斯维加斯出发',
      href: '/tours?q=拉斯维加斯',
      products: [],
      hotRank: [],
      reviews: [],
    },
    {
      id: 'seattle',
      label: '西雅图',
      href: '/tours?q=西雅图',
      products: [],
      hotRank: [],
      reviews: [],
    },
    {
      id: 'hawaii',
      label: '夏威夷',
      href: '/tours?q=夏威夷',
      products: [],
      hotRank: [],
      reviews: [],
    },
    {
      id: 'florida',
      label: '慢玩佛州',
      href: '/tours?q=佛州',
      products: [],
      hotRank: [],
      reviews: [],
    },
  ] satisfies DestinationCategory[],
}

export const HOT_RANK_ITEMS = USA_TRAVEL.categories[0].hotRank

export const REVIEW_ITEMS = USA_TRAVEL.categories[0].reviews.map((r) => ({
  name: r.name,
  avatar: r.name.slice(0, 1),
  rating: r.rating,
  text: r.text,
  date: r.date,
}))

export const CUSTOM_STORIES = [
  {
    title: '许自己一个纯净的新西兰假期',
    image: '/tff/0303r12000qviyz1w35EB_C_750_420.jpg',
  },
  {
    title: '西班牙 | 冬日里的光影醉梦',
    image: '/tff/20260618040452944389538.jpg',
  },
  {
    title: '商务定制 | 专业不负信任',
    image: '/tff/20260612100144316320617.jpg',
  },
]

export const CRUISE_ITEMS = [
  { title: '南北极邮轮', image: '/tff/20260622011449217558482.jpg' },
  { title: '中文服务邮轮', image: '/tff/20260612071803989129395.jpg' },
  { title: '欧洲内河游轮', image: '/tff/20260612074237256168449.jpg' },
]

export const KNOW_US_NEWS = [
  { title: '途风亮相 Arival 360 峰会', type: 'media' as const },
  { title: '新西兰—四川交流酒会圆满举办', type: 'media' as const },
  { title: '部分航线临时调整公告', type: 'announce' as const },
  { title: '「你好中国」入境游产品上线', type: 'announce' as const },
]

export const WHY_BOOK_ITEMS = [
  { title: '品牌保障', subtitle: '大品牌 / 安心之选', icon: '/tff/brand-assurance.webp' },
  { title: '价格保障', subtitle: '优价保证 / 买贵立赔', icon: '/tff/price-guarantee.webp' },
  { title: '消费透明', subtitle: '费用透明 / 无隐藏项', icon: '/tff/transparent-clear-pricing.webp' },
  { title: '旅行安全保障', subtitle: '严选护航 / 安心抵达', icon: '/tff/customer-service.webp' },
  { title: '成团/行程保障', subtitle: '极端情况有保障', icon: '/tff/group-departure-itinerary-guarantee.webp' },
  { title: '行中体验保障', subtitle: '体验违约 / 途风先赔', icon: '/tff/in-trip-experience-guarantee.webp' },
]

export const TRUST_BADGES = [
  { label: '品牌保障', icon: '/tff/brand-assurance.webp' },
  { label: '价格保障', icon: '/tff/price-guarantee.webp' },
  { label: '消费透明', icon: '/tff/transparent-clear-pricing.webp' },
  { label: '7x24小时服务', icon: '/tff/customer-service.webp' },
  { label: '成团行程保障', icon: '/tff/group-departure-itinerary-guarantee.webp' },
  { label: '行中体验保障', icon: '/tff/in-trip-experience-guarantee.webp' },
  { label: '隐私与安全', icon: '/tff/privacy-data-security-commitment.webp' },
  { label: '安全加密支付', icon: '/tff/secure-encrypted-payment.webp' },
]

export const PARTNER_NAMES = [
  'Ctrip',
  'Trip.com',
  'Visa',
  'Mastercard',
  'Amex',
  'Alipay',
  'WeChat Pay',
  'PayPal',
]

export const FOOTER_COLUMNS = [
  {
    title: '关于途风',
    links: [
      { label: '关于我们', href: '/about' },
      { label: '专业团队', href: '/about' },
      { label: '联系我们', href: '/about' },
      { label: '隐私政策', href: '/about' },
      { label: '新闻中心', href: '/about' },
    ],
  },
  {
    title: '客户服务',
    links: [
      { label: '预订指南', href: '/tours' },
      { label: '服务中心', href: '/about' },
      { label: '常见问题', href: '/about' },
    ],
  },
  {
    title: '预订须知',
    links: [
      { label: '客户协议', href: '/about' },
      { label: '取消和修改条例', href: '/about' },
      { label: '全球入境签证信息', href: '/about' },
    ],
  },
  {
    title: '合作加盟',
    links: [
      { label: '商务合作', href: '/agent' },
      { label: '代理商入口', href: '/agent' },
    ],
  },
]

/** Mock products used when Shopify collection is empty */
export const MOCK_PRODUCTS: CollectionProduct[] = [
  {
    id: 'mock-1',
    handle: 'yellowstone-5d',
    title: '黄石公园5日游 · 夏季特惠5折起',
    tags: ['booking:instant'],
    productType: 'group-tour',
    priceRange: { minVariantPrice: { amount: '899.00', currencyCode: 'USD' } },
    images: { nodes: [{ url: '/tff/0302w12000qghi8je71A4_C_750_420.jpg', altText: '黄石' }] },
  },
  {
    id: 'mock-2',
    handle: 'west-coast-loop',
    title: '美西大环线9日游 · 国家公园精选',
    tags: [],
    productType: 'group-tour',
    priceRange: { minVariantPrice: { amount: '1299.00', currencyCode: 'USD' } },
    images: { nodes: [{ url: '/tff/0304w12000lxow6zg3547_C_750_420.jpg', altText: '美西' }] },
  },
  {
    id: 'mock-3',
    handle: 'nyc-day-trip',
    title: '纽约一日游 · 自由女神 & 时代广场',
    tags: ['booking:instant'],
    productType: 'day-trip',
    priceRange: { minVariantPrice: { amount: '99.00', currencyCode: 'USD' } },
    images: { nodes: [{ url: '/tff/0102c120008i7ptex646C_C_750_420.jpg', altText: '纽约' }] },
  },
  {
    id: 'mock-4',
    handle: 'vegas-grand-canyon',
    title: '拉斯维加斯出发 · 大峡谷一日游',
    tags: ['booking:instant'],
    productType: 'day-trip',
    priceRange: { minVariantPrice: { amount: '159.00', currencyCode: 'USD' } },
    images: { nodes: [{ url: '/tff/0305r12000lp47atq5BC0_C_750_420.jpg', altText: '大峡谷' }] },
  },
  {
    id: 'mock-5',
    handle: 'europe-boutique',
    title: '欧洲精品小团 · 法瑞意12日',
    tags: [],
    productType: 'small-group',
    priceRange: { minVariantPrice: { amount: '2899.00', currencyCode: 'USD' } },
    images: { nodes: [{ url: '/tff/0302f12000n51bggw53E1_C_750_420.jpg', altText: '欧洲' }] },
  },
  {
    id: 'mock-6',
    handle: 'nz-pure',
    title: '新西兰南北岛 · 纯净假期10日',
    tags: [],
    productType: 'group-tour',
    priceRange: { minVariantPrice: { amount: '2199.00', currencyCode: 'USD' } },
    images: { nodes: [{ url: '/tff/0303r12000qviyz1w35EB_C_750_420.jpg', altText: '新西兰' }] },
  },
  {
    id: 'mock-7',
    handle: 'alaska-summer',
    title: '夏季阿拉斯加 · 冰川邮轮组合',
    tags: ['booking:instant'],
    productType: 'group-tour',
    priceRange: { minVariantPrice: { amount: '1899.00', currencyCode: 'USD' } },
    images: { nodes: [{ url: '/tff/20260622011449217558482.jpg', altText: '阿拉斯加' }] },
  },
  {
    id: 'mock-8',
    handle: 'banff-summer',
    title: '班夫国家公园 · 落基山精华5日',
    tags: [],
    productType: 'group-tour',
    priceRange: { minVariantPrice: { amount: '799.00', currencyCode: 'USD' } },
    images: { nodes: [{ url: '/tff/20260618040452944389538.jpg', altText: '班夫' }] },
  },
]
