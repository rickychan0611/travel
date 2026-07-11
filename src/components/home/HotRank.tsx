import Link from 'next/link'
import type { Route } from 'next'
import { HOT_RANK_ITEMS } from '@/data/home-mock'

export function HotRank({ locale }: { locale: string }) {
  return (
    <div className="rounded-md bg-white p-4 ring-1 ring-[#e8e8e8]">
      <h3 className="mb-3 text-sm font-bold text-[#303133]">黄石公园｜5折起热销榜</h3>
      <ol className="space-y-2.5">
        {HOT_RANK_ITEMS.map((item) => (
          <li key={item.rank}>
            <Link
              href={`/${locale}/tours` as Route}
              className="flex items-start gap-2 text-sm hover:text-tff-blue"
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-bold text-white ${
                  item.rank <= 3 ? 'bg-tff-orange' : 'bg-[#c0c4cc]'
                }`}
              >
                {item.rank}
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 leading-snug text-[#303133]">{item.title}</span>
                <span className="mt-0.5 block text-tff-orange font-semibold">
                  ${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}
                  <span className="text-sm font-normal text-[#909399]"> 起</span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
