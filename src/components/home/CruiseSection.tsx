import Link from 'next/link'
import Image from 'next/image'
import type { Route } from 'next'
import { CRUISE_ITEMS } from '@/data/home-mock'

export function CruiseSection({ locale }: { locale: string }) {
  return (
    <section className="rounded-md bg-white p-4 shadow-sm ring-1 ring-[#e8e8e8] md:p-5">
      <div className="mb-4 flex items-center gap-3">
        <Image src="/tff/cruise-title.png" alt="" width={120} height={28} className="h-7 w-auto" />
        <h2 className="sr-only">全球邮轮</h2>
        <Link href={`/${locale}/tours` as Route} className="ml-auto text-sm text-tff-blue hover:underline">
          查看更多 &gt;
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {CRUISE_ITEMS.map((item) => (
          <Link
            key={item.title}
            href={`/${locale}/tours?q=${encodeURIComponent(item.title)}` as Route}
            className="group overflow-hidden rounded-md ring-1 ring-[#eee]"
          >
            <div className="relative aspect-[16/9]">
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover transition group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <p className="p-3 text-sm font-semibold text-[#303133] group-hover:text-tff-blue">{item.title}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
