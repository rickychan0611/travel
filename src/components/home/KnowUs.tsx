import Image from 'next/image'
import { KNOW_US_NEWS } from '@/data/home-mock'

export function KnowUs() {
  const media = KNOW_US_NEWS.filter((n) => n.type === 'media')
  const announce = KNOW_US_NEWS.filter((n) => n.type === 'announce')

  return (
    <section className="rounded-md bg-white p-4 shadow-sm ring-1 ring-[#e8e8e8] md:p-5">
      <div className="mb-4 flex items-center gap-3">
        <Image src="/tff/know-us-title.png" alt="" width={120} height={28} className="h-7 w-auto" />
        <h2 className="sr-only">了解途风</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="relative aspect-video overflow-hidden rounded-md bg-[#111]">
          <Image src="/tff/know-us.png" alt="了解途风" fill className="object-cover opacity-80" sizes="33vw" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-[#303133]">
              品牌视频
            </span>
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-bold text-[#303133]">媒体报道</h3>
          <ul className="space-y-2">
            {media.map((n) => (
              <li key={n.title} className="border-b border-[#f0f0f0] pb-2 text-sm text-[#606266] hover:text-tff-blue">
                {n.title}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-bold text-[#303133]">途风公告</h3>
          <ul className="space-y-2">
            {announce.map((n) => (
              <li key={n.title} className="border-b border-[#f0f0f0] pb-2 text-sm text-[#606266] hover:text-tff-blue">
                {n.title}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
