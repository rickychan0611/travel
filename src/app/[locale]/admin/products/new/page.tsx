import { AdminLinkButton, AdminPageHeader, AdminPanel } from '@/components/admin/AdminCards'
import { createProductAction } from '../actions'

export default async function NewAdminProductPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <>
      <AdminPageHeader
        title="Create new tour"
        description="Start a blank Shopify tour product. You can add content, dates, images, and add-ons after creation."
        action={<AdminLinkButton href={`/${locale}/admin/products`}>Back to products</AdminLinkButton>}
      />

      <div className="max-w-2xl">
        <AdminPanel>
          <form action={createProductAction} className="space-y-4">
            <input type="hidden" name="locale" value={locale} />
            <label className="block">
              <span className="text-sm text-slate-700">Tour title</span>
              <input name="title" required className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950" />
            </label>
            <label className="block">
              <span className="text-sm text-slate-700">Product code</span>
              <input name="productCode" placeholder="Optional" className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-sm text-slate-950" />
            </label>
            <label className="block">
              <span className="text-sm text-slate-700">URL handle</span>
              <input name="handle" placeholder="Optional" className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-sm text-slate-950" />
            </label>
            <label className="block">
              <span className="text-sm text-slate-700">Product type</span>
              <input name="productType" defaultValue="Tour" className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950" />
            </label>
            <button className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Create product</button>
          </form>
        </AdminPanel>
      </div>
    </>
  )
}
