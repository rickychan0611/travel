import type { CollectionProduct } from '@/lib/shopify/types'
import type { LocalizedText } from '@/data/tour-categories'

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
  label: LocalizedText
  href?: string
  hot?: boolean
  /** Flat hover tags (matches old Tours4fun header popovers) */
  links?: Array<{ label: LocalizedText; href: string }>
}

const navText = (en: string, zhCN: string, zhTW = zhCN): LocalizedText => ({ en, 'zh-CN': zhCN, 'zh-TW': zhTW })

export const MEGA_NAV: MegaNavItem[] = [
  { id: 'home', label: navText('Home', '首页', '首頁'), href: '/' },
  {
    id: 'americas',
    label: navText('Americas', '美洲旅游', '美洲旅遊'),
    href: '/americas',
    links: [
      { label: navText('New York', '纽约', '紐約'), href: '/new-york' },
      { label: navText('Yellowstone', '黄石公园', '黃石公園'), href: '/yellowstone' },
      { label: navText('Calgary & Rockies', '卡尔加里落基山', '卡爾加里落基山'), href: '/calgary-rockies' },
      { label: navText('Alaska', '阿拉斯加'), href: '/alaska' },
      { label: navText('Cancún', '坎昆'), href: '/cancun' },
      { label: navText('Peru', '秘鲁', '秘魯'), href: '/peru' },
    ],
  },
  {
    id: 'europe',
    label: navText('Europe', '欧洲旅游', '歐洲旅遊'),
    href: '/europe',
    links: [
      { label: navText('Europe', '欧洲精选', '歐洲精選'), href: '/europe' },
      { label: navText('Spain', '西班牙'), href: '/europe' },
      { label: navText('Greece', '希腊', '希臘'), href: '/europe' },
      { label: navText('Nordics & Iceland', '北欧 / 冰岛', '北歐 / 冰島'), href: '/europe' },
    ],
  },
  {
    id: 'asia_world',
    label: navText('Asia & World', '亚洲与世界', '亞洲與世界'),
    href: '/asia-world',
    links: [
      { label: navText('China', '中国', '中國'), href: '/china' },
      { label: navText('Europe', '欧洲', '歐洲'), href: '/europe' },
      { label: navText('Alaska', '阿拉斯加'), href: '/alaska' },
      { label: navText('Peru', '秘鲁', '秘魯'), href: '/peru' },
    ],
  },
  {
    id: 'day_tours',
    label: navText('One Day Tour', '一日游', '一日遊'),
    href: '/day-tours',
  },
]

export type HotDestinationRegion = {
  id: string
  title: string
  categorySlug: string
  badge: string
  links: string[]
}

export const HOT_DESTINATIONS: HotDestinationRegion[] = [
  {
    id: 'us',
    title: '美国旅游',
    categorySlug: 'united-states',
    badge: '夏季黄石5折',
    links: ['洛杉矶', '美西国家公园', '纽约', '羚羊谷', '拉斯维加斯', '旧金山', '阿拉斯加', '黄石'],
  },
  {
    id: 'canada',
    title: '加拿大&拉美',
    categorySlug: 'canada-latin-america',
    badge: '夏季班芙公园',
    links: ['卡尔加里', '温哥华', '多伦多', '秘鲁', '墨西哥', '尼亚加拉'],
  },
  {
    id: 'europe',
    title: '欧洲旅游',
    categorySlug: 'europe',
    badge: '精品小团9折起',
    links: ['北欧峡湾', '英国', '冰岛', '法瑞意', '土耳其希腊', '西葡'],
  },
  {
    id: 'asia',
    title: '亚非&澳新',
    categorySlug: 'asia-world',
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
  { id: 'private', title: '私家包团', subtitle: '点击查看', image: '/tff/tab-private.png', href: '/private-tours' },
  { id: 'local', title: '一日游短线', subtitle: '点击查看', image: '/tff/tab-play.png', href: '/day-tours' },
  { id: 'boutique', title: '白金尊享', subtitle: '点击查看', image: '/tff/tab-small.png', href: '/platinum-tours' },
  { id: 'cruise', title: '欧洲精选', subtitle: '点击查看', image: '/tff/tab-cruise.png', href: '/europe' },
]

export const SEASON_MUST_PLAY = [
  {
    title: '卡尔加里落基山',
    blurb: '班芙 · 贾斯珀 · 露易丝湖',
    image: '/tff/20250331013739000245945.jpg',
    href: '/calgary-rockies',
  },
  {
    title: '坎昆度假',
    blurb: '海岛 · 玛雅文化 · 全包酒店',
    image: '/tff/20260622011449217558482.jpg',
    href: '/cancun',
  },
  {
    title: '印加古国',
    blurb: '秘鲁马丘比丘深度游',
    image: '/tff/20260104055420439777289.png',
    href: '/peru',
  },
  {
    title: '中国入境',
    blurb: '你好中国 · 经典名城',
    image: '/tff/20260104055429833543159.png',
    href: '/china',
  },
  {
    title: '欧洲精选',
    blurb: '欧洲环线 · 希腊 · 西班牙',
    image: '/tff/20260612071803989129395.jpg',
    href: '/europe',
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

export type DestinationSection = {
  title: string
  icon: string
  moreHref: string
  categories: DestinationCategory[]
}

export const USA_TRAVEL: DestinationSection = {
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
  ],
}

const CANADA_REVIEWS: DestinationCategory['reviews'] = [
  {
    name: '陈女士',
    avatar: '/tff/avatar.png',
    rating: 5,
    text: '班夫和露易丝湖都太美了，导游讲解细致，行程安排很舒服。',
    date: '2026-06-28',
    productTitle: '<4天>【全年最夯折扣】住班夫镇+哥伦比亚冰原+三大名湖',
  },
  {
    name: 'TravelFan',
    avatar: '/tff/avatar.png',
    rating: 5,
    text: '落基山的景色令人难忘，住宿和交通都安排得很周到。',
    date: '2026-06-20',
    productTitle: '<5天>【品质团】班夫、贾斯珀、幽鹤三大国家公园',
  },
]

const EUROPE_REVIEWS: DestinationCategory['reviews'] = [
  {
    name: '王先生',
    avatar: '/tff/avatar.png',
    rating: 5,
    text: '英国和爱尔兰一路风景很棒，领队专业又细心。',
    date: '2026-06-26',
    productTitle: '<14天>【西北偏北】英国+爱尔兰两国游',
  },
  {
    name: 'Mia',
    avatar: '/tff/avatar.png',
    rating: 5,
    text: '小团体验很好，酒店和景点安排都很有品质。',
    date: '2026-06-18',
    productTitle: '<7天>【9人团】土耳其遗迹浪漫之旅',
  },
]

const WORLD_REVIEWS: DestinationCategory['reviews'] = [
  {
    name: 'Lily',
    avatar: '/tff/avatar.png',
    rating: 5,
    text: '江南行程轻松丰富，酒店和餐食都很满意。',
    date: '2026-06-25',
    productTitle: '上海+苏州+杭州+乌镇5日4晚跟团游',
  },
  {
    name: '周先生',
    avatar: '/tff/avatar.png',
    rating: 5,
    text: '张家界山水壮观，导游服务热情，体验很好。',
    date: '2026-06-16',
    productTitle: '<6天>【20人纯玩团】湖南湘西深度游',
  },
]

export const CANADA_LATAM_TRAVEL: DestinationSection = {
  title: '加拿大&拉美',
  icon: '/tff/20191101011005072753015.png',
  moreHref: '/tours?q=加拿大',
  categories: [
    {
      id: 'canada-west',
      label: '加西｜夏季热卖',
      href: '/tours?q=班夫',
      products: [
        { title: '<4天>【全年最夯折扣·买2送2/送1】住班夫镇+班夫国家公园+哥伦比亚冰原+三大名湖 | 落基山', image: '/tff/20260612100144316320617.jpg', price: 212.41, originalPrice: 237.66 },
        { title: '<5天>【品质团·落基山经典入门】住3晚公园内，班夫+贾斯珀+幽鹤三大公园五大名湖', image: '/tff/2026061209513871966970.jpg', price: 629.92, originalPrice: 679.92 },
        { title: '<5天>【24人团·入住冰原腹地木屋】三大国家公园+哥伦比亚冰原+七大名湖', image: '/tff/20250108030410693819286.jpg', price: 740.22, originalPrice: 799.92 },
        { title: '<6天>【深度落基山】班夫、贾斯珀、优鹤公园+冰原雪车+天空步道', image: '/tff/20260618040452944389538.jpg', price: 885.16, originalPrice: 935.16 },
        { title: '<4天>【温哥华出发】落基山经典线路，邂逅露易丝湖与梦莲湖', image: '/tff/0302w12000qghi8je71A4_C_750_420.jpg', price: 419.5 },
      ],
      hotRank: [
        { rank: 1, title: '<4天>【全年最夯折扣】班夫+哥伦比亚冰原+三大名湖', image: '/tff/20260612100144316320617.jpg', price: 212.41 },
        { rank: 2, title: '<5天>【品质团】三大公园五大名湖', image: '/tff/2026061209513871966970.jpg', price: 629.92 },
        { rank: 3, title: '<5天>【入住冰原腹地木屋】落基山深度游', image: '/tff/20250108030410693819286.jpg', price: 740.22 },
        { rank: 4, title: '<6天>【深度落基山】冰原雪车+天空步道', image: '/tff/20260618040452944389538.jpg', price: 885.16 },
      ],
      reviews: CANADA_REVIEWS,
    },
    { id: 'canada-east', label: '加东｜买2送1', href: '/tours?q=加拿大东部', products: [], hotRank: [], reviews: [] },
    { id: 'mexico', label: '墨西哥&坎昆', href: '/tours?q=墨西哥', products: [], hotRank: [], reviews: [] },
    { id: 'peru', label: '秘鲁', href: '/tours?q=秘鲁', products: [], hotRank: [], reviews: [] },
  ],
}

export const EUROPE_TRAVEL: DestinationSection = {
  title: '欧洲旅游',
  icon: '/tff/20191101010357241569963.png',
  moreHref: '/tours?q=欧洲',
  categories: [
    {
      id: 'europe-seasonal',
      label: '当季热卖',
      href: '/tours?q=欧洲',
      products: [
        { title: '<14天>【西北偏北 英国+爱尔兰两国游】苏格兰高地+都柏林+牛津剑桥+尼斯湖游船', image: '/tff/20260618040452944389538.jpg', price: 3615.1 },
        { title: '<7天>【9人团 土耳其遗迹浪漫】含三段内飞+世遗棉花堡+五钻酒店', image: '/tff/20260618054235569426158.jpg', price: 2256.25 },
        { title: '<7天>【铁发 轻享之旅】雅典+圣托里尼，6-15人精致中文小团', image: '/tff/0304w12000lxow6zg3547_C_750_420.jpg', price: 1961.25 },
        { title: '<12天>【纯净峡湾】北欧四国全景，纵览三大峡湾+弗洛姆小火车', image: '/tff/0303r12000qviyz1w35EB_C_750_420.jpg', price: 2169.89, originalPrice: 2284.09 },
        { title: '<9天>【精品小团】法国瑞士意大利深度游，浪漫名城一次看遍', image: '/tff/0302f12000n51bggw53E1_C_750_420.jpg', price: 1799 },
      ],
      hotRank: [
        { rank: 1, title: '<14天>【西北偏北】英国+爱尔兰两国游', image: '/tff/20260618040452944389538.jpg', price: 3615.1 },
        { rank: 2, title: '<7天>【9人团】土耳其遗迹浪漫', image: '/tff/20260618054235569426158.jpg', price: 2256.25 },
        { rank: 3, title: '<7天>【轻享之旅】希腊雅典+圣托里尼', image: '/tff/0304w12000lxow6zg3547_C_750_420.jpg', price: 1961.25 },
        { rank: 4, title: '<12天>【纯净峡湾】北欧四国全景', image: '/tff/0303r12000qviyz1w35EB_C_750_420.jpg', price: 2169.89 },
      ],
      reviews: EUROPE_REVIEWS,
    },
    { id: 'europe-loop', label: '欧洲循环游', href: '/tours?q=欧洲循环游', products: [], hotRank: [], reviews: [] },
    { id: 'fjords', label: '北欧｜峡湾&避暑', href: '/tours?q=北欧峡湾', products: [], hotRank: [], reviews: [] },
    { id: 'aegean', label: '希腊&土耳其', href: '/tours?q=希腊土耳其', products: [], hotRank: [], reviews: [] },
    { id: 'eastern-europe', label: '浪漫东欧', href: '/tours?q=东欧', products: [], hotRank: [], reviews: [] },
    { id: 'europe-small', label: '精品小团', href: '/tours?q=欧洲精品小团', products: [], hotRank: [], reviews: [] },
    { id: 'europe-private', label: '私家包团', href: '/tours?q=欧洲私家包团', products: [], hotRank: [], reviews: [] },
  ],
}

export const WORLD_TRAVEL: DestinationSection = {
  title: '花样世界',
  icon: '/tff/20191101011005072753015.png',
  moreHref: '/tours?q=中国入境',
  categories: [
    {
      id: 'china-inbound',
      label: '中国入境',
      href: '/tours?q=中国入境',
      products: [
        { title: '上海+苏州+杭州+乌镇5日4晚跟团游·16人团，西栅内+摇橹船+汉服+景交', image: '/tff/20230720033049641788112.jpg', price: 273.52, originalPrice: 310.82 },
        { title: '<6天>【20人纯玩团】湖南湘西·长沙+张家界玻璃桥+天门山+凤凰古城', image: '/tff/0305r12000lp47atq5BC0_C_750_420.jpg', price: 416.35, originalPrice: 462.61 },
        { title: '九寨沟+黄龙+峨眉山+乐山大佛5日4晚，携程5钻酒店+熊猫景区', image: '/tff/0302f12000n51bggw53E1_C_750_420.jpg', price: 257.54, originalPrice: 321.92 },
        { title: '西安4日3晚跟团游·暑假特惠，秦始皇兵马俑+陕西历史博物馆', image: '/tff/20260305070729701656868.jpg', price: 332.74 },
        { title: '北京故宫、长城、颐和园5日深度游，中文导游全程陪同', image: '/tff/20260703021815892716696887.jpg', price: 388 },
      ],
      hotRank: [
        { rank: 1, title: '上海+苏州+杭州+乌镇5日4晚跟团游', image: '/tff/20230720033049641788112.jpg', price: 273.52 },
        { rank: 2, title: '<6天>【20人纯玩团】湖南湘西深度游', image: '/tff/0305r12000lp47atq5BC0_C_750_420.jpg', price: 416.35 },
        { rank: 3, title: '九寨沟+黄龙+峨眉山+乐山大佛5日4晚', image: '/tff/0302f12000n51bggw53E1_C_750_420.jpg', price: 257.54 },
        { rank: 4, title: '西安4日3晚深度游', image: '/tff/20260305070729701656868.jpg', price: 332.74 },
      ],
      reviews: WORLD_REVIEWS,
    },
    { id: 'new-zealand', label: '纯净新西兰', href: '/tours?q=新西兰', products: [], hotRank: [], reviews: [] },
    { id: 'japan', label: '和风日本', href: '/tours?q=日本', products: [], hotRank: [], reviews: [] },
    { id: 'australia', label: '多彩澳洲', href: '/tours?q=澳大利亚', products: [], hotRank: [], reviews: [] },
    { id: 'sea', label: '风情东南亚', href: '/tours?q=东南亚', products: [], hotRank: [], reviews: [] },
    { id: 'middle-east-africa', label: '中东非旅游', href: '/tours?q=中东非', products: [], hotRank: [], reviews: [] },
  ],
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
    description: '一个不去一定会后悔，走了更会后悔的国家。南北双岛，送给自己的浪漫假期，体验100%纯净新西兰',
    image: '/tff/custom-new-zealand.jpeg',
  },
  {
    title: '西班牙｜冬日里的光影醉梦',
    description: '初识·马德里的慵与梦 心动·巴塞罗那光和影',
    image: '/tff/custom-spain.jpg',
  },
  {
    title: '商务定制｜专业不负信任',
    description: '随时准备解决各种突发问题，途风的定制师约等于哆啦A梦',
    image: '/tff/custom-business.jpg',
  },
]

export const CRUISE_ITEMS = [
  { title: '南北极探险邮轮', image: '/tff/cruise-polar.jpg' },
  { title: '暑期特价推荐', image: '/tff/cruise-summer-sale.jpg' },
  { title: '精选2025全球邮轮', image: '/tff/cruise-global-chinese.jpg' },
  { title: '畅游中国长江三峡', image: '/tff/cruise-yangtze.jpg' },
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
