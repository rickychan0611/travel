import Link from 'next/link'
import { AdminLinkButton, AdminPageHeader, AdminPanel } from '@/components/admin/AdminCards'
import { listAdminProducts } from '@/lib/admin/shopify-admin'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export default async function AdminProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'admin' })
  const { q } = await searchParams
  const products = await listAdminProducts({ q, first: 100 })

  return (
    <>
      <AdminPageHeader
        title={t('productsTitle')}
        description={t('productsDesc')}
        action={<AdminLinkButton href={`/${locale}/admin/products/new`}>{t('createTour')}</AdminLinkButton>}
      />

      <div className="mb-4">
        <AdminPanel title={t('productList')}>
        <form className="mb-4 flex gap-2">
          <input
            name="q"
            defaultValue={q ?? ''}
            className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950"
            placeholder={t('productSearchPlaceholder')}
          />
          <button className="rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white">{t('search')}</button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="py-3 pr-4">{t('product')}</th>
                <th className="py-3 pr-4">{t('status')}</th>
                <th className="py-3 pr-4">{t('bookable')}</th>
                <th className="py-3 pr-4">{t('variants')}</th>
                <th className="py-3 pr-4">{t('minPrice')}</th>
                <th className="py-3 pr-4">{t('city')}</th>
                <th className="py-3 pr-4">{t('lastSynced')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {products.map((product) => (
                <tr key={product.id} className="align-top">
                  <td className="py-3 pr-4">
                    <Link className="font-medium text-blue-700 hover:text-blue-900" href={`/${locale}/admin/products/${product.handle}`}>
                      {product.title}
                    </Link>
                    <div className="mt-1 font-mono text-xs text-slate-500">{product.productCode || product.handle}</div>
                  </td>
                  <td className="py-3 pr-4 text-slate-700">{product.status}</td>
                  <td className="py-3 pr-4">
                    <span className={product.bookable ? 'text-emerald-700' : 'text-amber-700'}>
                      {product.bookable ? t('bookable') : t('contentOnly')}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-slate-700">{product.variantCount}</td>
                  <td className="py-3 pr-4 text-slate-700">{product.currencyCode} {product.minPrice}</td>
                  <td className="py-3 pr-4 text-slate-700">{product.city || '-'}</td>
                  <td className="py-3 pr-4 text-slate-600">{product.lastSyncedAt ? new Date(product.lastSyncedAt).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </AdminPanel>
      </div>
    </>
  )
}
