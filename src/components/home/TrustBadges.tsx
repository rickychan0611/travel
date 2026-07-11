import Image from 'next/image'
import { TRUST_BADGES } from '@/data/home-mock'

export function TrustBadges() {
  return (
    <section className="rounded-md bg-white px-4 py-5 shadow-sm ring-1 ring-[#e8e8e8]">
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 md:gap-x-8">
        {TRUST_BADGES.map((badge) => (
          <div key={badge.label} className="flex items-center gap-2">
            <Image src={badge.icon} alt="" width={36} height={36} className="h-9 w-9 object-contain" />
            <span className="text-sm text-[#606266]">{badge.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
