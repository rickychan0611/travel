import { AdminPageHeader, AdminPanel, AdminStatCard } from '@/components/admin/AdminCards'
import { aggregateFilterFacts, listAdminProducts } from '@/lib/admin/shopify-admin'

export const dynamic = 'force-dynamic'

function CountList({ rows }: { rows: Array<{ label: string; count: number }> }) {
  return (
    <div className="divide-y divide-slate-200">
      {rows.slice(0, 20).map((row) => (
        <div key={row.label} className="flex items-center justify-between py-2 text-sm">
          <span className="text-slate-800">{row.label}</span>
          <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">{row.count}</span>
        </div>
      ))}
    </div>
  )
}

export default async function AdminCategoriesPage() {
  const products = await listAdminProducts({ first: 100 })
  const facts = aggregateFilterFacts(products)
  const missingCountry = products.filter((product) => !product.country).length
  const missingCity = products.filter((product) => !product.city).length

  return (
    <>
      <AdminPageHeader
        title="Categories & filters"
        description="These facts come from Shopify product metafields and tags. They are what the customer-facing category and filter UI should depend on."
      />
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <AdminStatCard label="Products scanned" value={products.length} />
        <AdminStatCard label="Missing country" value={missingCountry} />
        <AdminStatCard label="Missing city" value={missingCity} />
        <AdminStatCard label="Bookable products" value={products.filter((product) => product.bookable).length} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <AdminPanel title="Countries"><CountList rows={facts.countries} /></AdminPanel>
        <AdminPanel title="Cities"><CountList rows={facts.cities} /></AdminPanel>
        <AdminPanel title="Product types"><CountList rows={facts.productTypes} /></AdminPanel>
        <AdminPanel title="Booking state"><CountList rows={facts.statuses} /></AdminPanel>
      </div>
    </>
  )
}
