import {
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

export function PartnerBanner() {
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

        {/* Partner logos are intentionally hidden. */}
      </div>
    </section>
  )
}
