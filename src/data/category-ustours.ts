export type CategoryProductType = 'multi-day' | 'day-trip' | 'ticket' | 'cruise' | 'must' | 'local' | 'hotel'

export type CategoryProduct = {
  id: string
  code: string
  title: string
  description: string
  image: string
  saleTag: string
  badges: string[]
  type: CategoryProductType
  duration: number
  durationLabel: string
  departure: string
  destinations: string[]
  originalPrice: number
  price: number
  recommended?: boolean
  smallGroup?: boolean
}

export type CategoryData = {
  slug: string
  title: string
  breadcrumb: string[]
  totalCount: number
  tabs: Array<{ key: CategoryProductType | 'all'; label: string; count: number }>
  filters: Array<{ label: string; options: string[] }>
  featuredLinks: string[]
  products: CategoryProduct[]
  rightRail: {
    destinations: string[]
    hotRoutes: Array<{ title: string; image: string; price: number }>
    guideLinks: string[]
  }
  about: {
    title: string
    body: string
  }
  guide: {
    title: string
    topics: string[]
    heading: string
    paragraphs: string[]
  }
  seasons: Array<{ title: string; theme: string; body: string; months: string[] }>
  reviews: Array<{ name: string; date: string; tour: string; body: string }>
  faqs: string[]
  productTypes: string[]
  hotItineraries: string[]
}

const categoryAsset = (name: string) => `/tff/category/${name}`

export const USTOURS_CATEGORY: CategoryData = {
  slug: 'ustours',
  title: '北美洲旅游',
  breadcrumb: ['首页', '北美洲旅游'],
  totalCount: 1951,
  tabs: [
    { key: 'all', label: '北美洲旅游', count: 1952 },
    { key: 'multi-day', label: '多日游', count: 1384 },
    { key: 'day-trip', label: '一日游', count: 340 },
    { key: 'ticket', label: '门票', count: 109 },
    { key: 'cruise', label: '邮轮', count: 60 },
    { key: 'must', label: '出行必备', count: 31 },
    { key: 'local', label: '当地体验', count: 27 },
    { key: 'hotel', label: '酒店套餐', count: 1 },
  ],
  filters: [
    {
      label: '出发城市',
      options: ['全部', '洛杉矶', '卡尔加里', '纽约', '温哥华', '拉斯维加斯', '多伦多', '旧金山', '西雅图', '坎昆', '费尔班克斯', '盐湖城', '墨西哥城', '班夫'],
    },
    {
      label: '结束城市',
      options: ['全部', '洛杉矶', '卡尔加里', '纽约', '拉斯维加斯', '温哥华', '班夫', '多伦多', '旧金山', '西雅图', '盐湖城', '坎昆', '波士顿', '檀香山'],
    },
    {
      label: '途经景点',
      options: ['全部', '马蹄湾', '羚羊丝湖', '班夫国家公园', '哥伦比亚冰川', '沛托湖', '弓湖', '黄石国家公园', '大提顿国家公园', '胡佛湖', '大棱镜温泉'],
    },
    {
      label: '出行天数',
      options: ['全部', '1天', '2天', '3天', '4天', '5天', '6天', '7天', '8天', '9天', '10天', '11天', '12天', '13天', '14天', '15天', '15天以上'],
    },
    {
      label: '出发时间',
      options: ['全部', '07月', '08月', '09月'],
    },
    {
      label: '优惠活动',
      options: ['全部', '限时折扣', '早鸟优惠', '买二送一/送一'],
    },
  ],
  featuredLinks: ['初玩美西必看：主题玩法揭秘', '落基山玩法：6大主题线路', '美东+加东：全场5折起'],
  products: [
    {
      id: 'p1',
      code: '7441',
      title: '<2天>【周日优惠加码｜全年最夯折扣】美东尼亚加拉大瀑布小环线·住布法罗酒店+日夜双景尼亚加拉大瀑布+沃特金斯峡谷+漩涡公园',
      description: '一句话亮点：2天高效玩透尼亚加拉瀑布，白天夜晚、地面水上多角度赏瀑，并串联沃特金斯峡谷、漩涡公园与康宁玻璃中心。',
      image: categoryAsset('c140bea29959e8d3b84175.jpg'),
      saleTag: '最高立减$149/人',
      badges: ['限时最高立减$149/人', '2人成团', '免费退改'],
      type: 'multi-day',
      duration: 2,
      durationLabel: '行程2天',
      departure: '纽约、泽西市、帕西帕尼出发',
      destinations: ['纽约', '尼亚加拉瀑布', '沃特金斯峡谷'],
      originalPrice: 164.14,
      price: 55.14,
      recommended: true,
    },
    {
      id: 'p2',
      code: '3044',
      title: '<6天>【周末优惠加码｜全年最夯折扣】美东五大名城+双景大瀑布+哈佛名校(纽约、波士顿、华盛顿、费城)JFK&LGA机场接机',
      description: '主打高性价比与经典全覆盖的美东循环线，不走回头路，一次串联纽约、波士顿、华盛顿、费城与尼亚加拉瀑布。',
      image: categoryAsset('f8877c5c5c6e0e70fbe538.jpg'),
      saleTag: '最高立减$218/人',
      badges: ['限时最高立减$218/人', '免费接送机', '机场接/送'],
      type: 'multi-day',
      duration: 6,
      durationLabel: '行程6天',
      departure: '纽约出发',
      destinations: ['纽约', '波士顿', '华盛顿', '费城'],
      originalPrice: 558,
      price: 340,
    },
    {
      id: 'p3',
      code: '720790',
      title: '<7天>【住拉斯五钻酒店·3城4公园+摄影圣地】停留12-15大黄石景点+大峡谷全景+羚羊彩穴+马蹄湾+大提顿',
      description: '从旧金山往返的一站式美西自然长线，串联旧金山、拉斯维加斯、盐湖城与国家公园摄影胜地。',
      image: categoryAsset('20200213090259342845314.jpg'),
      saleTag: '最高立减$600/房',
      badges: ['250周年庆返现狂欢', '最高立减$600/房', '住黄石园内小木屋', '同一导游带团'],
      type: 'multi-day',
      duration: 7,
      durationLabel: '行程7天',
      departure: '旧金山、萨克拉门托出发',
      destinations: ['旧金山', '黄石国家公园', '羚羊彩穴', '马蹄湾'],
      originalPrice: 894.33,
      price: 743.83,
    },
    {
      id: 'p4',
      code: '749379',
      title: '<5天>【大团价格小团人数·12人团】买2送2/送1 黄石十大提顿15景·俯瞰大棱镜+大提顿峰全景+牛蹄湾+老忠实',
      description: '小团出行，不做走马观花式旅行团。拒绝人挤人，充足时间打卡，只需大巴团价格就能体验小团出行的享受。',
      image: categoryAsset('20211014042927879961867.jpg'),
      saleTag: '买二送一/送一',
      badges: ['买二送一/送一', '最高立减$100/房', '天天出发', '同一导游带团', '黄石深度2日游'],
      type: 'multi-day',
      duration: 5,
      durationLabel: '行程5天',
      departure: '盐湖城出发',
      destinations: ['盐湖城', '黄石国家公园', '大提顿国家公园'],
      originalPrice: 353.82,
      price: 328.82,
      smallGroup: true,
    },
    {
      id: 'p5',
      code: '739407',
      title: '<4天>【全年最夯折扣·买2送2/送1】住1晚班夫镇+班夫国家公园+哥伦比亚冰原+3大名湖',
      description: '打卡班夫县拍照身价的湖泊，梦莲湖、露易丝湖、玛琳湖与弓湖一次式领略加拿大国家公园名湖风采。',
      image: categoryAsset('fb800629487bc3cee38931.jpg'),
      saleTag: '最高立减$100/房',
      badges: ['买二送一/送一', '最高立减$100/房', '保证成团', '立即确认', '免国家公园门票'],
      type: 'multi-day',
      duration: 4,
      durationLabel: '行程4天',
      departure: '温哥华出发',
      destinations: ['温哥华', '班夫国家公园', '露易丝湖'],
      originalPrice: 237.82,
      price: 212.57,
    },
    {
      id: 'p6',
      code: '720342',
      title: '<5天>【13人团｜保证2晚住园内价值$1000老忠实木屋】3天2晚黄石8大提顿公园深度游',
      description: '入住黄石公园核心景区老忠实木屋，充分体验黄石的位置好、设施全、两晚连住与高品质导游服务。',
      image: categoryAsset('2023082106083478980075.jpg'),
      saleTag: '尾单低价捡漏',
      badges: ['尾单低价捡漏', '最高立减$400/人', '途风优选', '保证成团'],
      type: 'multi-day',
      duration: 5,
      durationLabel: '行程5天',
      departure: '盐湖城出发',
      destinations: ['盐湖城', '黄石国家公园', '大提顿国家公园'],
      originalPrice: 1211.73,
      price: 1061.73,
      smallGroup: true,
    },
    {
      id: 'p7',
      code: '720429',
      title: '<5天>【品质团·住2晚公园内】2大国家公园(班夫+贾斯珀)+5大名湖+哥伦比亚冰川',
      description: '入住国家公园景区小镇，贾斯珀小镇+班夫小镇，沉浸式感受国家公园内的每一处风景。',
      image: categoryAsset('20260214062747189211882.jpg'),
      saleTag: '最高立减$200/房',
      badges: ['最高立减$200/房', '保证成团', '途风推荐'],
      type: 'multi-day',
      duration: 5,
      durationLabel: '行程5天',
      departure: '温哥华出发',
      destinations: ['温哥华', '班夫国家公园', '贾斯珀'],
      originalPrice: 434.45,
      price: 365.7,
    },
    {
      id: 'p8',
      code: '729267',
      title: '<8天>【13人小团｜2晚拉斯五星枫丹白露+3天2晚黄石15景】4大国家公园2大网红摄影地',
      description: '3天2晚黄石国家公园，保证游览15大景点，摄影奇观与世界七大地质摄影奇观之一的大峡谷深度串联。',
      image: categoryAsset('20260209095233322771010.jpg'),
      saleTag: '限时折扣8.5折',
      badges: ['限时折扣8.5折', '保证成团', '立即确认'],
      type: 'multi-day',
      duration: 8,
      durationLabel: '行程8天',
      departure: '洛杉矶、拉斯维加斯出发',
      destinations: ['洛杉矶', '拉斯维加斯', '黄石国家公园'],
      originalPrice: 923.92,
      price: 785.33,
      smallGroup: true,
    },
    {
      id: 'p9',
      code: '753945',
      title: '<3天>【CAD1升级瀑布一日游】魁北克城+渥太华+千岛湖+尼亚加拉瀑布',
      description: '加东经典城市与自然景观组合，体验法式古城、首都人文与尼亚加拉瀑布的震撼水雾。',
      image: categoryAsset('2a4a6e0637d1b74994e827.jpg'),
      saleTag: '最高立减$80/人',
      badges: ['买二送一/送一', 'CAD1升级瀑布一日游'],
      type: 'multi-day',
      duration: 3,
      durationLabel: '行程3天',
      departure: '多伦多出发',
      destinations: ['多伦多', '魁北克城', '尼亚加拉瀑布'],
      originalPrice: 1060.1,
      price: 932.89,
    },
    {
      id: 'p10',
      code: '105109',
      title: '<1天>尼亚加拉大瀑布深度一日游+雾中少女号游船+瀑布夜景',
      description: '适合时间有限的旅客，一天浓缩尼亚加拉核心景点，轻松打卡瀑布、游船与观景平台。',
      image: categoryAsset('ad4d0feb25f45bdeeaffce.jpg'),
      saleTag: '当日热门',
      badges: ['天天出发', '立即确认'],
      type: 'day-trip',
      duration: 1,
      durationLabel: '行程1天',
      departure: '纽约出发',
      destinations: ['纽约', '尼亚加拉瀑布'],
      originalPrice: 98,
      price: 68,
    },
  ],
  rightRail: {
    destinations: ['纽约', '洛杉矶', '旧金山', '拉斯维加斯', '华盛顿', '波士顿', '黄石国家公园', '尼亚加拉瀑布', '大峡谷', '加州环球影城', '17里湾湾', '费城', '罗德岛', '芝加哥', '迈阿密', '奥兰多', '西雅图', '罗德堡', '阿拉斯加', '温哥华', '落基山', '多伦多', '蒙特利尔', '欧胡岛', '珍珠港', '茂宜岛', '夏威夷大岛', '墨西哥'],
    hotRoutes: [
      { title: '<5天>【美加跨国 四大名城+大瀑布+千岛湖】纽约出发...', image: categoryAsset('20251104055024285732766.jpg'), price: 864.38 },
      { title: '<6天>【十年畅销】近满好评 美东五大名城+夜宿大瀑...', image: categoryAsset('20251112024857215656189.jpg'), price: 584.93 },
      { title: '<2天>【周日优惠加码】全年最夯折扣 美东尼亚加拉大...', image: categoryAsset('c140bea29959e8d3b84175.jpg'), price: 55.14 },
      { title: '<3天>【CAD1升级瀑布一日】魁北克城+渥太华...', image: categoryAsset('20250116080910802621751.jpg'), price: 212.57 },
    ],
    guideLinks: ['北极光团价格差异大怎么选？途风旅游教你看', '2026南加州【美国独立日】烟花秀活动盘', '黄刀镇极光团怎么选性价比最高？看途风旅游', '中国游客定制加拿大旅游路线怎么选？途风旅', '加拿大到四川旅行：机票航班+必去景点+旅', '立省$50！庆祝双节，加州30余座历史公', '洛杉矶重磅狂欢，2026世界杯官方球迷'],
  },
  about: {
    title: '关于北美洲',
    body: '北美洲像一座被时光轻轻敲醒的巨型宝匣，层层展开壮丽的地理纹理与多元的文化色彩。高耸入云的落基山脉在清冽空气中静守千年，峡谷与湖群仿佛大地刻下的诗行；雪线之上，阿拉斯加的冰川浮着冷冽光华，南端的墨西哥火山与热带雨林，则用炽热与生机回应北方的沉稳。城市是它的另一张面孔，纽约灯火像永不休眠的脉搏，在钢铁与玻璃间跳动；洛杉矶散发着阳光与影像工业交织的魅力；多伦多与温哥华以包容与自然共存，像风吹开的窗口，让世界在此汇聚。',
  },
  guide: {
    title: '北美洲旅行指南',
    topics: ['北美洲初印象', '北美洲旅游核心区域', '北美洲深度旅游体验', '北美洲主题旅行', '北美洲旅游实用指南'],
    heading: '北美洲初印象',
    paragraphs: [
      '北美洲，这片横跨北纬极寒到南纬温暖的大陆，以其壮阔的自然风光、多元的文化氛围和现代都市活力著称。无论是美国的摩天大楼、加拿大的原始冰川，还是墨西哥古老文明遗迹，北美洲都能满足你对旅行的各种幻想。',
      '这里既有世界闻名的城市景观，也有令人屏息的自然奇观，是文化探寻与户外冒险完美结合的旅行目的地。',
    ],
  },
  seasons: [
    { title: '2026/2027年 夏季', theme: 'bg-[#d5fbf1]', body: '夏季的北美是探险者的天堂。加拿大落基山脉和斑夫国家公园湖水湛蓝，徒步、露营、皮划艇一应俱全。', months: ['2026年7月', '2026年8月', '2027年6月'] },
    { title: '2026年 秋季', theme: 'bg-[#fff0d8]', body: '北美的秋天，是一场色彩盛宴。新英格兰地区的枫叶渐染红黄，沿海公路自驾与国家公园摄影都正当时。', months: ['2026年9月', '2026年10月', '2026年11月'] },
    { title: '2026/2027年 冬季', theme: 'bg-[#e1f6fb]', body: '冬天的北美，呈现出冰雪与节庆交织的奇妙景致。加拿大魁北克与班夫滑雪胜地吸引旅行者。', months: ['2026年12月', '2027年1月', '2027年2月'] },
    { title: '2027年 春季', theme: 'bg-[#fff1f4]', body: '春天的北美，如同一幅从冬日灰色中慢慢染上生机的画卷。华盛顿樱花与西海岸春光都值得期待。', months: ['2027年3月', '2027年4月', '2027年5月'] },
  ],
  reviews: [
    { name: 'Lilybell', date: '2026-06-25', tour: '<4天>【经典线路回归】名城名校瀑...', body: '导游Rex Lin，带团讲解的非常专业，仔细，然后带着我们沿路去介绍每个景点，非常满意服务！' },
    { name: '陶小平', date: '2026-06-23', tour: '<5天>【三进黄石盛景游】西雅图+密...', body: '入住的湖景木屋推开窗就是风景，体验加分。全程大巴接送，司机驾驶平稳，长途坐车也不觉得太累。' },
    { name: '匿名用户', date: '2026-06-23', tour: '<7天>【住拉斯五钻酒店·3城4公园+...', body: '这次黄石国家公园之旅让我收获满满，非常感谢导游认真负责的工作态度。每天都会提前告知集合时间。' },
    { name: '匿名用户', date: '2026-05-18', tour: '<4天>【夏季落基山深度游·乘坐冰原...', body: '导游Jun的服务很好，行程安排很好，驾驶很棒，玩一天很舒适。' },
  ],
  faqs: ['如何应对北美洲冬季极端降雪对交通出行的影响？', '在北美洲跨国旅行时，如何正确处理美国与加拿大之间的签证与边境通关？', '北美洲国家公园（如黄石、班夫）最佳游览时间与门票预约方式是什么？', '在北美洲城市间长途移动时，如何选择高效且经济的交通方式？'],
  productTypes: ['多日游', '一日游', '门票', '邮轮', '出行必备', '当地体验', '酒店套餐'],
  hotItineraries: ['出发城市', '行程天数', '途经景点'],
}

export const CATEGORY_DATA_BY_SLUG: Record<string, CategoryData> = {
  ustours: USTOURS_CATEGORY,
}
