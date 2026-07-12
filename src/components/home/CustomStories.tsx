import Link from 'next/link'
import Image from 'next/image'
import type { Route } from 'next'
import { CUSTOM_STORIES } from '@/data/home-mock'

export function CustomStories({ locale }: { locale: string }) {
  return (
    <section className="bg-white px-4 pb-10 pt-[70px]">
      <div className="mx-auto text-center">
        <Image
          src="/tff/custom-title.png"
          alt="定制旅程 CUSTOMIZATION"
          width={338}
          height={28}
          className="mx-auto h-7 w-auto"
        />
      </div>

      <div className="mx-auto grid max-w-[1120px] grid-cols-1 justify-items-center gap-10 pt-8 md:grid-cols-3 md:gap-16 md:pt-0">
        {CUSTOM_STORIES.map((story, index) => (
          <Link
            key={story.title}
            href={`/${locale}/about` as Route}
            className="group flex w-[240px] flex-col items-center text-center text-[#252525] no-underline"
          >
            <div
              className={[
                'mb-10 mt-4 h-[184px] w-[148px] rounded bg-white p-1 pb-10 shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-transform duration-200 group-hover:rotate-[-15deg] md:mt-[50px]',
                index === 1 ? 'rotate-[-18deg]' : 'rotate-[-20deg]',
              ].join(' ')}
            >
              <div className="relative h-[140px] w-[140px] overflow-hidden">
                <Image
                  src={story.image}
                  alt={story.title}
                  fill
                  className="object-cover"
                  sizes="140px"
                />
              </div>
            </div>
            <h3 className="mb-5 text-[18px] font-normal leading-6 transition-[font-weight] group-hover:font-bold">
              {story.title}
            </h3>
            <p className="min-h-10 text-[14px] leading-5">{story.description}</p>
          </Link>
        ))}
      </div>

      <div className="flex justify-center pt-10">
        <Link
          href={`/${locale}/about` as Route}
          className="h-10 w-[120px] rounded border border-[#0090f2] bg-white text-center text-[16px] leading-10 text-[#0090f2] transition-colors hover:bg-[#0090f2] hover:text-white"
        >
          查看更多&gt;
        </Link>
      </div>
    </section>
  )
}
