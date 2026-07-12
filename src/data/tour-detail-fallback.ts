export type TourDay = {
  day: number
  title: string
  meals: string
  hotel: string
  summary: string
  images: Array<{ src: string; title: string; description: string }>
}

export type TourMockVariant = {
  id: string
  availableForSale: boolean
  price: { amount: string; currencyCode: string }
  selectedOptions: Array<{ name: string; value: string }>
}

export type TourMockDeparture = {
  date: string
  available: boolean
  status: 'available' | 'limited' | 'sold-out'
  lowestPrice: { amount: string; currencyCode: string }
  variants: TourMockVariant[]
}

export type TourFallbackDetail = {
  handles: string[]
  title: string
  description: string
  purchaseCount: number
  productCode: string
  saleTag: string
  basePrice: number
  currencyCode: string
  originalPrice: number
  departureDates: TourMockDeparture[]
  routes: string[]
  breadcrumbs: string[]
  promos: string[]
  serviceBadges: string[]
  features: string[]
  departures: string
  endings: string
  language: string
  manager: {
    name: string
    avatar: string
    text: string
    bullets: string[]
  }
  gallery: Array<{ src: string; alt: string }>
  overview: Array<{ title: string; body: string }>
  intro: {
    promo: string
    notice: string
    image: string
  }
  days: TourDay[]
  freeItems: Array<[string, string, string]>
  feesIncluded: Array<[string, string, string]>
  feesExcluded: Array<[string, string]>
  bookingLimits: Array<[string, string]>
  bookingNotes: Array<[string, string]>
  terms: string[]
  penalty: Array<[string, string]>
  reviews: Array<{ name: string; date: string; tags: string[]; body: string }>
}

const tourAsset = (name: string) => `/tff/tour/${name}`
const mockDeparture = (date: string, price = 743.83, status: TourMockDeparture['status'] = 'available'): TourMockDeparture => ({
  date,
  available: status !== 'sold-out',
  status,
  lowestPrice: { amount: String(price), currencyCode: 'USD' },
  variants: [1, 2, 3, 4, 5, 6].map((partySize) => ({
    id: `mock-${date}-${partySize}`,
    availableForSale: status !== 'sold-out',
    price: { amount: String(price), currencyCode: 'USD' },
    selectedOptions: [
      { name: 'Departure', value: date },
      { name: 'Party Size', value: String(partySize) },
    ],
  })),
})

export const YELLOWSTONE_TOUR_DETAIL: TourFallbackDetail = {
  handles: ['grand-teton-yellowstone-3day-y3'],
  title: '<7天>【住拉斯五钻酒店·3城4公园+摄影圣地】·停留12-15大黄石景点+大峡谷全景+羚羊彩穴+马蹄湾+大提顿+布莱斯峡谷+拉斯维加斯+盐湖城+旧金山往返(木屋团)',
  description: '旧金山往返一站式美西自然长线，串联黄石、大提顿、大峡谷、羚羊彩穴、马蹄湾、布莱斯峡谷、拉斯维加斯与盐湖城。',
  purchaseCount: 6812,
  productCode: '720798',
  saleTag: '最高立减$600/房',
  basePrice: 743.83,
  currencyCode: 'USD',
  originalPrice: 894.33,
  departureDates: [
    mockDeparture('2026-07-17', 743.83, 'limited'),
    mockDeparture('2026-07-20'),
    mockDeparture('2026-07-23', 743.83, 'limited'),
    mockDeparture('2026-07-26'),
    mockDeparture('2026-07-27'),
    mockDeparture('2026-07-30'),
    mockDeparture('2026-08-03'),
    mockDeparture('2026-08-07'),
    mockDeparture('2026-08-10'),
    mockDeparture('2026-08-14'),
    mockDeparture('2026-08-17'),
    mockDeparture('2026-08-21'),
    mockDeparture('2026-08-24'),
    mockDeparture('2026-08-28'),
    mockDeparture('2026-09-04'),
    mockDeparture('2026-09-11'),
    mockDeparture('2026-09-18'),
    mockDeparture('2026-09-25'),
    mockDeparture('2026-10-02'),
    mockDeparture('2026-10-09'),
  ],
  routes: ['A | 黄石+羚羊谷+大峡谷+布莱斯｜住黄石小木屋', 'B | 黄石+羚羊谷+峡谷地+拱门+纪念碑谷｜住1晚拉斯五星酒店'],
  breadcrumbs: ['首页', '北美洲', '美国', '美西', '黄石国家公园', '一路向东系列', '涉及黄石、旧金山、一号公路'],
  promos: ['250周年庆返现狂欢', '最高立减$600/房'],
  serviceBadges: ['住黄石园内小木屋', '同一导游带团', '途风推荐'],
  features: ['黄石深度2日游'],
  departures: '旧金山、萨克拉门托、拉斯维加斯',
  endings: '旧金山、洛杉矶、拉斯维加斯',
  language: '中文+英文',
  manager: {
    name: 'Aimee',
    avatar: tourAsset('avatar.png'),
    text: '主打从旧金山往返的一站式美西自然长线，串联旧金山、拉斯维加斯、盐湖城三城，并覆盖黄石、大提顿、大峡谷、布莱斯峡谷、羚羊彩穴与马蹄湾，兼顾城市节点、国家公园与摄影圣地体验。',
    bullets: ['黄石木屋：提前31天以上预定有机会免费升级一晚住黄石木屋。', '深度游览：保证游览黄石12-15大景点，深度体验原生态。', '优质住宿：入住1晚五钻酒店，枫丹白露拉斯维加斯酒店。'],
  },
  gallery: [
    { src: tourAsset('20260318022500367869089.jpg'), alt: '黄石大棱镜温泉' },
    { src: tourAsset('10090d0000006vvf92C73_C_750_420.jpg'), alt: '拉斯维加斯五钻酒店' },
    { src: tourAsset('0EQ6u324x99wkcm1iCE70.jpg'), alt: '马蹄湾' },
    { src: tourAsset('0EQ70324x99wii9b04B3B.jpg'), alt: '黄石国家公园' },
    { src: tourAsset('0300p1200095ltxm5AEBE_C_750_420.jpg'), alt: '太浩湖' },
    { src: tourAsset('0300312000g2fadhh3F83_C_750_420.jpg'), alt: '加州州府大厦' },
    { src: tourAsset('0306s12000g2f9vcyF8DA_C_750_420.jpg'), alt: '皮瑞尼铁桥' },
    { src: tourAsset('0303612000g2f9hu18226_C_750_420.jpg'), alt: '肖肖尼瀑布' },
  ],
  overview: [
    { title: '团队服务', body: '最多55人团\n可能与其他旅行社客人同团游玩，可能中途换车换导游' },
    { title: '游玩', body: '24个景点/场馆\n部分景点不含门票\n0购物' },
    { title: '住宿', body: '含3晚钻级以上酒店，2晚3钻酒店，1晚3钻酒店' },
    { title: '餐食', body: '成人含2早餐，19次自理\n儿童含2早餐，19次自理' },
    { title: '签证', body: '签证材料及递交\n具体有关签证的问题可咨询客服' },
  ],
  intro: {
    promo: '【限时立减｜享额外立减250/房优惠】',
    notice: '下单时间：2026年6月15日00:00 - 2026年7月31日23:59（美东时间）。活动期间预订可享每房立减$250，多房预定建议分多笔下单。',
    image: tourAsset('20260703100905542559784661.png'),
  },
  days: [
    {
      day: 1,
      title: '旧金山 → 萨克拉门托 → 加州州府大厦（30分钟）→ 太浩湖（30分钟）→ 雷诺',
      meals: '早餐自理, 午餐自理, 晚餐自理',
      hotel: '马戏团里诺度假酒店 - 凯撒奖励计划目的地 或同等级酒店',
      summary: '请在预订页面选择您参团当天的集合点。途经加州州府大厦与太浩湖，夜宿雷诺。',
      images: [
        { src: tourAsset('0300312000g2fadhh3F83_C_750_420.jpg'), title: '加利福尼亚州议会大厦', description: '加州州政府所在地，外形仿造美国国会。' },
        { src: tourAsset('0300p1200095ltxm5AEBE_C_750_420.jpg'), title: '太浩湖', description: '北美著名高山湖泊，湖水澄澈。' },
      ],
    },
    {
      day: 2,
      title: '雷诺 → 皮瑞尼铁桥（30分钟）→ 肖肖尼瀑布（另付项目，30分钟）→ 波卡特洛',
      meals: '早餐自理, 午餐自理, 晚餐自理',
      hotel: '波卡特洛拉昆塔温德姆套房酒店 或同等级酒店',
      summary: '穿越内华达与爱达荷风光，欣赏峡谷桥梁与瀑布景观。',
      images: [
        { src: tourAsset('0306s12000g2f9vcyF8DA_C_750_420.jpg'), title: '皮瑞尼铁桥', description: '横跨蛇河峡谷的壮观桥梁。' },
        { src: tourAsset('0303612000g2f9hu18226_C_750_420.jpg'), title: '肖肖尼瀑布', description: '被誉为西部尼亚加拉。' },
      ],
    },
    {
      day: 3,
      title: '黄石国家公园深度游（另付项目，8小时，停留诺里斯间歇泉盆地、上瀑布、艺术家观景台、峡谷村、海顿山谷、泥火山等）',
      meals: '早餐自理, 午餐自理, 晚餐自理',
      hotel: '黄石周边酒店 或同等级酒店',
      summary: '全天游览黄石国家公园核心景点，体验间歇泉、峡谷、瀑布与野生动物区域。',
      images: [
        { src: tourAsset('0EQ70324x99wii9b04B3B.jpg'), title: '黄石国家公园', description: '世界第一座国家公园。' },
        { src: tourAsset('0EQ3g324x99wii9b2A38E.jpg'), title: '大棱镜温泉', description: '色彩斑斓的地热奇观。' },
      ],
    },
    {
      day: 4,
      title: '黄石国家公园（40分钟，停留西拇指间歇泉等）→ 大提顿国家公园（60分钟）→ 杰克逊 → 鹿角公园 → 盐湖城 → 圣殿广场（30分钟）→ 普沃',
      meals: '早餐自理, 午餐自理, 晚餐自理',
      hotel: '普罗沃万豪酒店&会议中心、盐湖城西谷市希尔顿安泊酒店 或同等级酒店',
      summary: '行程安排：黄石国家公园 → 大提顿国家公园 → 杰克逊 → 鹿角公园 → 盐湖城 → 圣殿广场 → 普沃。',
      images: [
        { src: tourAsset('100e0s000000hsc6b571A_C_750_420.jpg'), title: '黄石国家公园', description: '湖泊、喷泉与地热景观汇聚。' },
        { src: tourAsset('10010n000000eelo3C7A8_C_750_420.jpg'), title: '西拇指间歇泉盆地', description: '黄石湖畔的地热区。' },
        { src: tourAsset('100f0s000000i85v5224C_C_750_420.jpg'), title: '大蒂顿国家公园', description: '雄伟山峰与湖泊景观。' },
        { src: tourAsset('100j0s000000i7nlz5C75_C_750_420.jpg'), title: '杰克逊鹿角公园', description: '小镇标志性鹿角拱门。' },
        { src: tourAsset('CghzgFWwtMGALO7YACaH6qj6gjY588_C_750_420.jpg'), title: '圣殿广场', description: '盐湖城代表性建筑群。' },
      ],
    },
    {
      day: 5,
      title: '普沃 → 布莱斯峡谷国家公园（另付项目，45分钟）→ 下羚羊峡谷（自费，90分钟）→ 马蹄湾（另付项目，45分钟）→ 蒂巴',
      meals: '早餐自理, 午餐自理, 晚餐自理',
      hotel: '摩恩科皮传统套房酒店 或同等级酒店',
      summary: '峡谷摄影日，串联布莱斯、羚羊彩穴与马蹄湾。',
      images: [
        { src: tourAsset('CggYGVam55mAAGPcAA0buzxCxgE774_C_750_420.jpg'), title: '布莱斯峡谷', description: '橙红色岩柱森林。' },
        { src: tourAsset('0EQ6u324x99wkcm1iCE70.jpg'), title: '马蹄湾', description: '科罗拉多河切出的经典弯道。' },
      ],
    },
    {
      day: 6,
      title: '大峡谷国家公园 → 胡佛水坝 → 拉斯维加斯',
      meals: '早餐自理, 午餐自理, 晚餐自理',
      hotel: '拉斯维加斯枫丹白露酒店 或同等级酒店',
      summary: '游览大峡谷南缘与胡佛水坝，抵达拉斯维加斯入住高端酒店。',
      images: [
        { src: tourAsset('100j0s000000i7nmqE840_C_750_420.jpg'), title: '大峡谷国家公园', description: '世界自然奇观。' },
        { src: tourAsset('10090d0000006vvf92C73_C_750_420.jpg'), title: '拉斯维加斯酒店', description: '入住拉斯五星酒店。' },
      ],
    },
    {
      day: 7,
      title: '拉斯维加斯 → 洛杉矶 / 旧金山返程',
      meals: '早餐自理, 午餐自理, 晚餐自理',
      hotel: '温馨的家',
      summary: '结束难忘的美西国家公园深度之旅，返回指定城市。',
      images: [
        { src: tourAsset('100n0q000000g1cy8A72A_C_750_420.jpg'), title: '黄石回忆', description: '带着国家公园美景返程。' },
      ],
    },
  ],
  freeItems: [
    ['拉斯维加斯城市夜游', '$50.00/人', '费用包含：预订费+车导接送+导服费+门票费用（需门票的景点）。'],
    ['猛男秀 Thunder from Down【现付】', '$90.00/人', '秀票价格会有浮动，所有价格请以实际预定当天为准。'],
    ['【现付】大卫魔术秀', '$175.00/人', '秀票价格会有浮动，所有价格请以实际预定当天为准。'],
    ['南峡谷IMAX电影+午餐', '$32.00/人', '3岁以上同价，费用包含预订费、车导接送、导服费。'],
  ],
  feesIncluded: [
    ['住宿', '酒店标准2人/间，行程所列酒店住宿费用', '酒店标准2人/间，行程所列酒店住宿费用'],
    ['餐食', '成人包含2次：2早餐', '儿童包含2次：2早餐'],
    ['随团服务人员', '当地普通话英语双语导游服务', '当地普通话英语双语导游服务'],
    ['用车', '行程内所含项目用车费用，随团游览期间用车费用', '行程内所含项目用车费用，随团游览期间用车费用'],
    ['接送', '目的地拼车送服务', '目的地拼车送服务'],
  ],
  feesExcluded: [
    ['随团服务人员', '您的行程中不包含随团服务人员小费，请您根据当地情况予以支付。每位游客（含儿童）每天15美元(USD)'],
    ['门票及活动', '景区景点/场馆内收费参考：黄石国家公园门票、大蒂顿国家公园门票、布莱斯峡谷国家公园门票、下羚羊峡谷门票、马蹄湾门票等。'],
  ],
  bookingLimits: [
    ['年龄限制', '出于安全考虑，18岁以下未成年人需要至少一名成年旅客陪同'],
    ['其他限制', '如为多人出行，预订人/旅游者代表确认已征得其余全体出行人同意作为本次旅游签约代表。'],
  ],
  bookingNotes: [
    ['成团说明', '本产品最少成团人数1人，订单经途风旅行网以书面形式确认后均默认发团。'],
    ['拼团说明', '本产品为散客拼团，在承诺服务内容和标准不变的前提下，可能会与其他旅行社的客人合并用车，共同游玩。'],
    ['出团通知', '最晚在出行前1天您将收到出团通知书或服务人员确认电话，请保持电话畅通。'],
    ['单房差', '本产品可提供多人间，如您想多人入住1间房，请在预订时备注清楚。'],
  ],
  terms: ['请自行前往目的地，参加当地跟团游。', '订购必须经过一定的购买流程，我们会在1-2个工作日内通过电子邮件与您进行确认。', '请您尽快预订，因为价格可能在不同时间会有所不同。', '请在预订前仔细阅读取消和修改条例。', '请在预订前仔细阅读客户协议。', '请在预订前查询全球各国家（地区）入境签证信息。'],
  penalty: [
    ['行程前45-15日', '40%'],
    ['行程前14-8日', '60%'],
    ['行程前7-1日', '100%'],
    ['行程开始当日', '100%'],
  ],
  reviews: [
    { name: '快乐肥宅', date: '2026-07-11 21:46:51', tags: ['打call力荐', '导游很Nice', '风景如画'], body: '黄石公园深度的8小时过得太快了。诺里斯间歇泉盆地白烟缭绕，走在木栈道上脚底下热乎乎的。海顿山谷里真的有大批的野生动物，太惊喜了。' },
    { name: '姜屿', date: '2026-07-11 20:46:12', tags: ['风景如画', '安排合理'], body: '整体行程安排紧凑但顺畅，导游讲解清楚，住宿比预期好，黄石和大提顿都非常值得。' },
  ],
}

export function getTourFallback(handle: string) {
  return YELLOWSTONE_TOUR_DETAIL.handles.includes(handle) ? YELLOWSTONE_TOUR_DETAIL : YELLOWSTONE_TOUR_DETAIL
}
