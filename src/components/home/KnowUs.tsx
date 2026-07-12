import Image from 'next/image'

const mediaItems = [
  {
    title: 'Tours4fun 途风旅游 受邀出席 Arival 360布里斯班峰会并发...',
    source: '途风网',
    date: '2026年6月25日',
    image: '/tff/know-us-media-arival.png',
  },
  {
    title: 'Tours4Fun 途风旅游 受邀出席【新西兰-四川交流酒会】',
    source: '途风网',
    date: '2026年5月25日',
    image: '/tff/know-us-media-newzealand.png',
  },
]

const announcements = [
  { title: '突发！12 条中日航线全取消，赴日航班取消...', date: '2025-11-25 09:37:15' },
  { title: '“你好中国” —— 黄河主题旅游海外推广季...', date: '2025-11-25 09:36:41' },
  { title: '途风旅游推出全新结伴服务啦！', date: '2023-08-02 16:48:57' },
  { title: '致广大途风客户的一封信', date: '2020-03-21 15:03:14' },
]

export function KnowUs() {
  return (
    <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-white pb-[200px] pt-[70px]">
      <div className="absolute inset-x-0 bottom-0 h-[500px]">
        <Image
          src="/tff/know-us-peaks.png"
          alt=""
          fill
          className="object-cover object-bottom"
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[330px] bg-white/10" />

      <div className="relative mx-auto max-w-[1200px] px-4">
        <div className="mb-10 text-center">
          <Image
            src="/tff/know-us-title.png"
            alt="认识途风 KNOW US"
            width={256}
            height={27}
            className="mx-auto h-[27px] w-auto"
          />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[392px_1fr_320px]">
          <div>
            <div className="mb-[26px] flex h-12 items-center justify-between border-b border-[#eee] px-4">
              <strong className="text-[20px] font-normal text-[#252525]">了解途风</strong>
              <span className="text-[14px] text-[#777]">我们的优势&gt;</span>
            </div>
            <div className="relative aspect-392/220 overflow-hidden bg-[#111]">
              <Image
                src="/tff/know-us-video-cover.jpg"
                alt="了解途风"
                fill
                className="object-cover"
                sizes="392px"
              />
            </div>
          </div>

          <div>
            <div className="mb-[26px] flex h-12 items-center justify-between border-b border-[#eee] px-4">
              <strong className="text-[20px] font-normal text-[#252525]">媒体报道</strong>
              <span className="text-[14px] text-[#777]">查看更多&gt;</span>
            </div>
            <div className="space-y-[30px]">
              {mediaItems.map((item) => (
                <article key={item.title} className="grid grid-cols-[170px_1fr] gap-3">
                  <div className="relative h-[94px] overflow-hidden bg-[#f4f4f4]">
                    <Image src={item.image} alt="" fill className="object-cover" sizes="170px" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-[16px] leading-6 text-[#252525]">{item.title}</h3>
                    <p className="mt-3 text-[14px] leading-5 text-[#777]">{item.source}</p>
                    <p className="text-[14px] leading-5 text-[#777]">{item.date}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-[26px] flex h-12 items-center justify-between border-b border-[#eee] px-4">
              <strong className="text-[20px] font-normal text-[#252525]">途风公告</strong>
              <span className="text-[14px] text-[#777]">查看更多&gt;</span>
            </div>
            <ul>
              {announcements.map((item) => (
                <li key={item.title} className="border-b border-[#eee] px-4 py-[9px]">
                  <p className="truncate text-[14px] leading-5 text-[#252525]">{item.title}</p>
                  <p className="mt-1 text-[14px] leading-5 text-[#252525]">{item.date}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
