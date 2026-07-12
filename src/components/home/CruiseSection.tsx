import Link from 'next/link'
import Image from 'next/image'
import type { Route } from 'next'
import { CRUISE_ITEMS } from '@/data/home-mock'

export function CruiseSection({ locale }: { locale: string }) {
  return (
    <section className="bg-white px-0 pb-0 pt-[70px]">
      <div className="text-center">
        <Image
          src="/tff/cruise-title.png"
          alt="全球邮轮 GLOBAL CRUISE LINE"
          width={382}
          height={27}
          className="mx-auto h-[27px] w-auto"
        />
      </div>

      <div className="grid grid-cols-1 justify-items-center gap-6 pt-10 sm:grid-cols-2 lg:grid-cols-4">
        {CRUISE_ITEMS.map((item) => (
          <Link
            key={item.title}
            href={`/${locale}/tours?q=${encodeURIComponent(item.title)}` as Route}
            className="group block w-full max-w-[282px] overflow-hidden"
            aria-label={item.title}
          >
            <div className="relative aspect-141/200 w-full">
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                sizes="(max-width: 640px) 282px, (max-width: 1024px) 50vw, 282px"
              />
            </div>
          </Link>
        ))}
      </div>

      <div className="flex justify-center pt-10">
        <Link
          href={`/${locale}/tours?q=${encodeURIComponent('邮轮')}` as Route}
          className="h-10 w-[120px] rounded border border-[#0090f2] bg-white text-center text-[16px] leading-10 text-[#0090f2] transition-colors hover:bg-[#0090f2] hover:text-white"
        >
          查看更多&gt;
        </Link>
      </div>
    </section>
  )
}
