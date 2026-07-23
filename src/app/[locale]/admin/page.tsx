import { getTranslations } from 'next-intl/server'
import { AdminLinkButton, AdminPageHeader, AdminPanel, AdminStatCard } from '@/components/admin/AdminCards'
import { getAdminUser } from '@/lib/admin/auth'
import { listAdminOrders, listAdminProducts } from '@/lib/admin/shopify-admin'

export const dynamic = 'force-dynamic'

async function loadDashboardData<T>(loader: Promise<T>) {
  try {
    return { data: await loader, error: '' }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'admin' })
  const [user, productLoad, orderLoad] = await Promise.all([
    getAdminUser(),
    loadDashboardData(listAdminProducts({ first: 50 })),
    loadDashboardData(listAdminOrders({ first: 10 })),
  ])
  const products = productLoad.data ?? []
  const orders = orderLoad.data ?? []
  const activeCount = products.filter((product) => product.status === 'ACTIVE').length
  const bookableCount = products.filter((product) => product.bookable).length
  const loadErrors = [productLoad.error, orderLoad.error].filter(Boolean)

  return (
    <>
      <AdminPageHeader
        title={t('dashboardTitle')}
        description={t('dashboardDescription')}
        action={<AdminLinkButton href={`/${locale}/admin/products`}>{t('manageProducts')}</AdminLinkButton>}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <AdminStatCard label={t('statLoadedProducts')} value={products.length} note={t('statLoadedProductsNote')} />
        <AdminStatCard label={t('statActiveProducts')} value={activeCount} note={t('statActiveProductsNote')} />
        <AdminStatCard label={t('statBookable')} value={bookableCount} note={t('statBookableNote')} />
        <AdminStatCard label={t('statRecentOrders')} value={orders.length} note={t('statRecentOrdersNote')} />
      </div>

      <div className="mt-6">
        <AdminPanel title={t('shopifyConnectionTitle')}>
          {loadErrors.length > 0 ? (
            <div className="space-y-2 text-sm text-red-700">
              {loadErrors.map((error) => <p key={error}>{error}</p>)}
            </div>
          ) : (
            <p className="text-sm text-emerald-700">{t('shopifyConnected')}</p>
          )}
        </AdminPanel>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <AdminPanel title={t('nextActionsTitle')}>
          <div className="space-y-3 text-sm text-slate-700">
            <p>{t('nextActionsSync')}</p>
            <p>{t('nextActionsCategories')}</p>
            {user?.isOwner ? (
              <AdminLinkButton href={`/${locale}/admin/sync`}>{t('openSyncControls')}</AdminLinkButton>
            ) : null}
          </div>
        </AdminPanel>

        <AdminPanel title={t('recentProductsTitle')}>
          <div className="divide-y divide-slate-200">
            {products.slice(0, 6).map((product) => (
              <a key={product.id} href={`/${locale}/admin/products/${product.handle}`} className="flex items-center justify-between gap-4 py-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-slate-950">{product.title}</span>
                  <span className="font-mono text-xs text-slate-500">{product.productCode || product.handle}</span>
                </span>
                <span className="shrink-0 text-right text-slate-700">
                  {product.currencyCode} {product.minPrice}
                </span>
              </a>
            ))}
            {products.length === 0 ? <p className="text-sm text-slate-600">{t('noProducts')}</p> : null}
          </div>
        </AdminPanel>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <AdminPanel title={t('recentOrdersTitle')}>
          <div className="divide-y divide-slate-200">
            {orders.slice(0, 5).map((order) => (
              <a key={order.id} href={order.adminUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between py-3 text-sm">
                <span>
                  <span className="block font-medium text-slate-950">{order.name}</span>
                  <span className="text-slate-600">{order.customerName}</span>
                </span>
                <span className="text-right text-slate-700">
                  {order.currencyCode} {order.total}
                </span>
              </a>
            ))}
            {orders.length === 0 ? <p className="text-sm text-slate-600">{t('noOrders')}</p> : null}
          </div>
        </AdminPanel>
      </div>
    </>
  )
}
