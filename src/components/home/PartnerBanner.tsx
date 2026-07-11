import { PARTNER_NAMES } from '@/data/home-mock'

export function PartnerBanner() {
  return (
    <section className="rounded-md bg-white p-4 shadow-sm ring-1 ring-[#e8e8e8] md:p-5">
      <h2 className="mb-4 text-center text-lg font-bold text-[#303133]">合作伙伴</h2>
      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
        {PARTNER_NAMES.map((name) => (
          <div
            key={name}
            className="flex h-12 min-w-[100px] items-center justify-center rounded border border-[#eee] bg-[#fafafa] px-4 text-sm font-medium text-[#909399]"
          >
            {name}
          </div>
        ))}
      </div>
    </section>
  )
}
