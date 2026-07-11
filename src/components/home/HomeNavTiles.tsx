import Link from 'next/link'
import type { Route } from 'next'
import { HOME_NAV_TILES } from '@/data/home-mock'

const TILE_TITLE_COLOR: Record<string, string> = {
  private: 'text-[#0f456b]',
  local: 'text-[#371761]',
  boutique: 'text-[#530904]',
  cruise: 'text-[#056ddc]',
}

export function HomeNavTiles({ locale }: { locale: string }) {
  return (
    <section className="mx-auto grid max-w-[1200px] grid-cols-2 gap-3 md:grid-cols-4 md:gap-5 mt-4">
      {HOME_NAV_TILES.map((tile) => (
        <Link
          key={tile.id}
          href={`/${locale}${tile.href}` as Route}
          className="relative block h-[96px] overflow-hidden rounded-lg transition hover:brightness-[0.98]"
        >
          <div
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${tile.image})` }}
            aria-hidden
          />
          <div className="absolute left-8 top-1/2 z-10 flex -translate-y-1/2 flex-col tracking-[2px] px-4">
            <strong className={` px-4 text-xl font-bold ${TILE_TITLE_COLOR[tile.id] ?? 'text-[#303133]'}`}>
              {tile.title}
            </strong>
            <span className="mt-1.5 inline-flex h-6 w-[74px] items-center justify-center rounded bg-[#209bf51a] text-xs text-[#0090f2]">
              {tile.subtitle}
            </span>
          </div>
        </Link>
      ))}
    </section>
  )
}
