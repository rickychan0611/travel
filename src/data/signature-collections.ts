import type { LocalizedText } from '@/data/tour-categories'

export type SignatureCountry = {
  name: LocalizedText
  destinations: LocalizedText[]
}

export type SignatureRegion = {
  id: string
  name: LocalizedText
  image: string
  countries: SignatureCountry[]
}

const t = (en: string, zhCN: string, zhTW = zhCN): LocalizedText => ({ en, 'zh-CN': zhCN, 'zh-TW': zhTW })
const country = (name: LocalizedText, destinations: LocalizedText[] = []): SignatureCountry => ({ name, destinations })

export const SIGNATURE_COLLECTIONS_TITLE = t('Explore Our Signature Collections', '探索我们的精选目的地', '探索我們的精選目的地')

export const SIGNATURE_COLLECTIONS: SignatureRegion[] = [
  {
    id: 'north-america',
    name: t('North America', '北美洲'),
    image: '/tff/signature-collections/north-america.avif',
    countries: [
      country(t('United States', '美国', '美國'), [
        t('Boston', '波士顿', '波士頓'), t('New York', '纽约', '紐約'), t('Buffalo', '水牛城'),
        t('Washington D.C.', '华盛顿特区', '華盛頓特區'), t('Orlando', '奥兰多', '奧蘭多'), t('Miami', '迈阿密', '邁阿密'),
        t('Chicago', '芝加哥'), t('Denver', '丹佛'), t('Salt Lake City', '盐湖城', '鹽湖城'),
        t('Phoenix', '凤凰城', '鳳凰城'), t('Los Angeles', '洛杉矶', '洛杉磯'), t('Las Vegas', '拉斯维加斯', '拉斯維加斯'),
        t('San Francisco', '旧金山', '舊金山'), t('Portland (OR)', '波特兰（俄勒冈州）', '波特蘭（俄勒岡州）'),
        t('Seattle', '西雅图', '西雅圖'), t('Anchorage', '安克雷奇'), t('Fairbanks', '费尔班克斯', '費爾班克斯'),
        t('Honolulu', '火奴鲁鲁', '檀香山'),
      ]),
      country(t('Canada', '加拿大'), [
        t('Toronto', '多伦多', '多倫多'), t('Calgary', '卡尔加里', '卡爾加里'), t('Vancouver', '温哥华', '溫哥華'),
        t('Whitehorse', '白马市', '白馬市'), t('Yellowknife', '黄刀镇', '黃刀鎮'),
      ]),
      country(t('Mexico', '墨西哥'), [t('Mexico City', '墨西哥城'), t('Cancún', '坎昆')]),
      country(t('Costa Rica', '哥斯达黎加', '哥斯達黎加'), [t('San José', '圣何塞', '聖荷西')]),
    ],
  },
  {
    id: 'asia',
    name: t('Asia', '亚洲', '亞洲'),
    image: '/tff/signature-collections/asia.png',
    countries: [
      country(t('China', '中国', '中國')), country(t('Japan', '日本')), country(t('Thailand', '泰国', '泰國')),
      country(t('Vietnam', '越南')), country(t('Maldives', '马尔代夫', '馬爾地夫')), country(t('Singapore', '新加坡')),
      country(t('Malaysia', '马来西亚', '馬來西亞')), country(t('Korea', '韩国', '韓國')), country(t('Turkey', '土耳其')),
      country(t('United Arab Emirates', '阿拉伯联合酋长国', '阿拉伯聯合大公國')),
    ],
  },
  {
    id: 'south-america',
    name: t('South America', '南美洲'),
    image: '/tff/signature-collections/south-america.avif',
    countries: [
      country(t('Peru', '秘鲁', '秘魯')), country(t('Bolivia', '玻利维亚', '玻利維亞')), country(t('Chile', '智利')),
      country(t('Argentina', '阿根廷')), country(t('Brazil', '巴西')), country(t('Colombia', '哥伦比亚', '哥倫比亞')),
      country(t('Ecuador', '厄瓜多尔', '厄瓜多爾')),
    ],
  },
  {
    id: 'europe',
    name: t('Europe', '欧洲', '歐洲'),
    image: '/tff/signature-collections/europe.avif',
    countries: [
      country(t('France', '法国', '法國')), country(t('Italy', '意大利', '義大利')), country(t('Switzerland', '瑞士')),
      country(t('Spain', '西班牙')), country(t('United Kingdom', '英国', '英國')), country(t('Germany', '德国', '德國')),
      country(t('Austria', '奥地利', '奧地利')), country(t('Czech Republic', '捷克')), country(t('Netherlands', '荷兰', '荷蘭')),
      country(t('Portugal', '葡萄牙')), country(t('Hungary', '匈牙利')), country(t('Belgium', '比利时', '比利時')),
      country(t('Greece', '希腊', '希臘')), country(t('Iceland', '冰岛', '冰島')), country(t('Denmark', '丹麦', '丹麥')),
      country(t('Finland', '芬兰', '芬蘭')),
    ],
  },
  {
    id: 'other',
    name: t('Other', '其他'),
    image: '/tff/signature-collections/other.avif',
    countries: [
      country(t('Morocco', '摩洛哥')), country(t('Egypt', '埃及')), country(t('Kenya', '肯尼亚', '肯亞')),
      country(t('Australia', '澳大利亚', '澳大利亞')),
    ],
  },
]
