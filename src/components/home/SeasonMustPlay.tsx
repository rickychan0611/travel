import Link from 'next/link'
import Image from 'next/image'
import type { Route } from 'next'
import { SEASON_MUST_PLAY } from '@/data/home-mock'

export type ManagedSeasonItem = { id: string; title: string; categorySlug: string; imageUrl: string }

export function SeasonMustPlay({ locale, managedItems }: { locale: string; managedItems?: ManagedSeasonItem[] }) {
  const items = managedItems ?? SEASON_MUST_PLAY.map((item) => ({ id: item.title, title: item.title, categorySlug: item.href.replace(/^\//, ''), imageUrl: item.image }))
  if (items.length === 0) return null
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Image src="/tff/popular.png" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
        <h2 className="text-lg font-bold text-[#303133]">当季必玩</h2>
      </div>
      <div className="grid grid-cols-2 justify-items-center gap-3 md:grid-cols-3 lg:grid-cols-5">
        {items.map((card) => (
          <Link
            key={card.id}
            href={`/${locale}/${card.categorySlug}` as Route}
            className="group relative h-[200px] w-[220px] cursor-pointer overflow-hidden rounded-md"
          >
            <Image
              src={card.imageUrl}
              alt={card.title}
              width={220}
              height={200}
              className="h-full w-full object-cover transition group-hover:scale-105"
              sizes="220px"
            />
            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 via-black/40 to-transparent px-3 pb-3 pt-10">
              <p className="text-sm font-semibold text-white md:text-base">{card.title}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
