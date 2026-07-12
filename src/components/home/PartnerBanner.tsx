'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Coins,
  Crown,
  FileCheck2,
  Headphones,
  LockKeyhole,
  ShieldCheck,
  ThumbsUp,
  Users,
} from 'lucide-react'

const benefits = [
  { title: '品牌保障', lines: ['大品牌', '安心之选'], Icon: Crown },
  { title: '价格保障', lines: ['优价保证', '买贵立赔'], Icon: Coins },
  { title: '消费透明', lines: ['费用透明', '无隐藏项'], Icon: ClipboardCheck },
  { title: '旅行安全保障', lines: ['严选护航', '安心抵达'], Icon: FileCheck2 },
  { title: '成团/行程保障', lines: ['极端情况有保障', '损失我们担'], Icon: Users },
  { title: '行中体验保障', lines: ['体验违约', '途风先赔'], Icon: ThumbsUp },
  { title: '7x24小时服务', lines: ['全天24小时客服', '多语言服务'], Icon: Headphones },
  { title: '隐私与安全承诺', lines: ['数据加密', '安全隔离'], Icon: ShieldCheck },
  { title: '安全加密支付', lines: ['全流程加密', '安全锁支付'], Icon: LockKeyhole },
]

const partnerLogos = [
  { name: 'Ctrip', src: '/tff/partner-ctrip.jpg', width: 100, height: 57 },
  { name: 'China Merchants Bank', src: '/tff/partner-cmb.jpg', width: 122, height: 57 },
  { name: 'Discover Los Angeles', src: '/tff/partner-losangeles.jpg', width: 158, height: 57 },
  { name: 'ICBC', src: '/tff/partner-icbc.jpg', width: 174, height: 57 },
  { name: 'ToursForFun Card', src: '/tff/partner-card.jpg', width: 132, height: 57 },
  { name: 'Mastercard', src: '/tff/partner-mastercard.png', width: 119, height: 27 },
  { name: 'NTA', src: '/tff/partner-nta.jpg', width: 104, height: 57 },
  { name: 'Qyer', src: '/tff/partner-qyer.jpg', width: 97, height: 57 },
  { name: 'PayPal', src: '/tff/partner-paypal.jpg', width: 101, height: 57 },
  { name: 'Tenpay', src: '/tff/partner-tenpay.jpg', width: 98, height: 57 },
  { name: 'GoDaddy Verified & Secured', src: '/tff/partner-godaddy.jpg', width: 221, height: 57 },
  { name: 'China UnionPay', src: '/tff/partner-unionpay.png', width: 121, height: 57 },
  { name: 'USI Affinity', src: '/tff/partner-usi.jpg', width: 61, height: 57 },
  { name: 'Vancouver Tourism', src: '/tff/partner-vancouver.jpg', width: 70, height: 57 },
]

const LOGO_SLOT_WIDTH = 150
const DESKTOP_VISIBLE_LOGOS = 7

export function PartnerBanner() {
  const [logoIndex, setLogoIndex] = useState(0)
  const maxIndex = Math.max(partnerLogos.length - DESKTOP_VISIBLE_LOGOS, 0)

  const showPrevious = () => {
    setLogoIndex((current) => (current <= 0 ? maxIndex : current - 1))
  }

  const showNext = () => {
    setLogoIndex((current) => (current >= maxIndex ? 0 : current + 1))
  }

  return (
    <section className="relative left-1/2 w-screen -translate-x-1/2 bg-white pb-4 pt-4">
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="grid grid-cols-2 gap-y-5 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9">
          {benefits.map(({ title, lines, Icon }) => (
            <div key={title} className="flex flex-col items-center text-center">
              <Icon className="h-7 w-7 text-[#0090f2]" strokeWidth={2.2} />
              <h3 className="mt-2 text-[16px] font-bold leading-5 text-[#252525]">{title}</h3>
              <p className="mt-1 text-[12px] leading-5 text-[#666]">
                {lines[0]}
                <br />
                {lines[1]}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 px-8 md:px-10">
          <h2 className="text-[20px] font-normal leading-7 text-[#252525]">合作伙伴</h2>
          <div className="mt-4 flex h-[57px] items-center gap-3">
            <button
              type="button"
              aria-label="上一组合作伙伴"
              onClick={showPrevious}
              className="flex h-10 w-8 shrink-0 items-center justify-center text-[#aaa] transition-colors hover:text-[#252525]"
            >
              <ChevronLeft className="h-8 w-8" strokeWidth={1.8} />
            </button>

            <div className="min-w-0 flex-1 overflow-hidden">
              <div
                className="flex items-center transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${logoIndex * LOGO_SLOT_WIDTH}px)` }}
              >
                {partnerLogos.map((logo) => (
                  <div
                    key={logo.name}
                    className="flex h-[57px] shrink-0 items-center justify-center"
                    style={{ width: LOGO_SLOT_WIDTH }}
                  >
                    <Image
                      src={logo.src}
                      alt={logo.name}
                      width={logo.width}
                      height={logo.height}
                      className="h-auto max-h-[34px] w-auto max-w-[130px] object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              aria-label="下一组合作伙伴"
              onClick={showNext}
              className="flex h-10 w-8 shrink-0 items-center justify-center text-[#252525] transition-colors hover:text-[#0090f2]"
            >
              <ChevronRight className="h-8 w-8" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
