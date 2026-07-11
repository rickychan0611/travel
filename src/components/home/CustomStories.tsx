import Link from 'next/link'
import Image from 'next/image'
import type { Route } from 'next'
import { CUSTOM_STORIES } from '@/data/home-mock'

export function CustomStories({ locale }: { locale: string }) {
  return (
    <section className="rounded-md bg-white p-4 shadow-sm ring-1 ring-[#e8e8e8] md:p-5">
      <div className="mb-4 flex items-center gap-3">
        <Image src="/tff/custom-title.png" alt="" width={120} height={28} className="h-7 w-auto" />
        <h2 className="sr-only">定制旅行</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {CUSTOM_STORIES.map((story) => (
          <Link
            key={story.title}
            href={`/${locale}/about` as Route}
            className="group relative aspect-[16/9] overflow-hidden rounded-md"
          >
            <Image
              src={story.image}
              alt={story.title}
              fill
              className="object-cover transition group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
            <p className="absolute bottom-3 left-3 right-3 text-sm font-semibold text-white md:text-base">
              {story.title}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
