import Image from 'next/image'
import { WHY_BOOK_ITEMS } from '@/data/home-mock'

export function WhyBook() {
  return (
    <section className="rounded-md bg-white p-4 shadow-sm ring-1 ring-[#e8e8e8] md:p-6">
      <h2 className="mb-5 text-center text-lg font-bold text-[#303133]">为什么选择途风</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {WHY_BOOK_ITEMS.map((item) => (
          <div key={item.title} className="flex flex-col items-center text-center">
            <Image src={item.icon} alt="" width={48} height={48} className="h-12 w-12 object-contain" />
            <p className="mt-2 text-sm font-semibold text-[#303133]">{item.title}</p>
            <p className="mt-0.5 text-sm text-[#909399]">{item.subtitle}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
