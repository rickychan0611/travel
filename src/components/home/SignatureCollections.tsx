import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, MapPin } from 'lucide-react'
import { getLocalizedText } from '@/data/tour-categories'
import {
  SIGNATURE_COLLECTIONS,
  SIGNATURE_COLLECTIONS_TITLE,
  type SignatureRegion,
} from '@/data/signature-collections'
import { catalogKeywordHref } from '@/lib/catalog-keywords'

const SIGNATURE_COLUMNS = [
  ['north-america', 'asia'],
  ['south-america', 'europe', 'other'],
] as const

function RegionCard({
  locale,
  region,
  label,
}: {
  locale: string
  region: SignatureRegion
  label: (value: Parameters<typeof getLocalizedText>[0]) => string
}) {
  const regionName = label(region.name)
  const hasDestinationLists = region.countries.some((country) => country.destinations.length > 0)

  return (
    <article className="overflow-hidden rounded-2xl border border-[#e5eaf0] bg-white shadow-[0_8px_30px_rgba(15,43,72,0.06)]">
      <Link
        href={catalogKeywordHref(locale, regionName)}
        className="group relative block aspect-[417/120] overflow-hidden bg-[#eef5fa]"
        aria-label={regionName}
      >
        <Image
          src={region.image}
          alt=""
          fill
          sizes="(max-width: 767px) 100vw, 50vw"
          className="object-cover transition duration-300 group-hover:scale-[1.02]"
        />
      </Link>

      <div className="p-5">
        <Link
          href={catalogKeywordHref(locale, regionName)}
          className="group mb-5 inline-flex items-center gap-2 text-xl font-bold text-[#17324d] hover:text-tff-blue"
        >
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-[#eaf5ff] text-tff-blue">
            <MapPin className="size-4" />
          </span>
          {regionName}
          <ArrowUpRight className="size-4 opacity-50 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
        </Link>

        <div className={hasDestinationLists ? 'grid gap-5 sm:grid-cols-2' : 'grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3'}>
          {region.countries.map((item) => {
            const countryName = label(item.name)
            return (
              <div key={countryName}>
                <Link
                  href={catalogKeywordHref(locale, countryName)}
                  className="font-semibold text-[#34495e] hover:text-tff-blue hover:underline"
                >
                  {countryName}
                </Link>
                {item.destinations.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.destinations.map((destination) => {
                      const destinationName = label(destination)
                      return (
                        <Link
                          key={destinationName}
                          href={catalogKeywordHref(locale, destinationName)}
                          className="rounded-full border border-[#dce7f0] bg-[#f8fbfd] px-3 py-1.5 text-sm text-[#52677b] transition hover:border-[#8bc8f6] hover:bg-[#eef8ff] hover:text-tff-blue"
                        >
                          {destinationName}
                        </Link>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </article>
  )
}

export function SignatureCollections({ locale }: { locale: string }) {
  const label = (value: Parameters<typeof getLocalizedText>[0]) => getLocalizedText(value, locale)

  return (
    <section className="py-8 md:py-12" aria-labelledby="signature-collections-title">
      <div className="mb-7 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-tff-blue">Tours4fun</p>
        <h2 id="signature-collections-title" className="text-2xl font-bold text-[#202124] md:text-3xl">
          {label(SIGNATURE_COLLECTIONS_TITLE)}
        </h2>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
        {SIGNATURE_COLUMNS.map((column) => (
          <div key={column.join('-')} className="grid gap-4">
            {column.map((regionId) => {
              const region = SIGNATURE_COLLECTIONS.find((item) => item.id === regionId)
              return region ? <RegionCard key={region.id} locale={locale} region={region} label={label} /> : null
            })}
          </div>
        ))}
      </div>
    </section>
  )
}
