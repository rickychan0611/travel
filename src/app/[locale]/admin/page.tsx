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
        title="Operations dashboard"
        description="Shopify is the live source for customer-facing tour content, variants, add-ons, and orders. Use this panel for safe product operations and cache refreshes."
        action={<AdminLinkButton href={`/${locale}/admin/products`}>Manage products</AdminLinkButton>}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <AdminStatCard label="Loaded products" value={products.length} note="Shopify tour products" />
        <AdminStatCard label="Active products" value={activeCount} note="Visible when published" />
        <AdminStatCard label="Bookable" value={bookableCount} note="Has date/rate variants" />
        <AdminStatCard label="Recent orders" value={orders.length} note="Latest Shopify orders" />
      </div>

      <div className="mt-6">
        <AdminPanel title="Shopify connection">
          {loadErrors.length > 0 ? (
            <div className="space-y-2 text-sm text-red-700">
              {loadErrors.map((error) => <p key={error}>{error}</p>)}
            </div>
          ) : (
            <p className="text-sm text-emerald-700">
              Connected to Shopify Admin API. Showing live product and order data from your store.
            </p>
          )}
        </AdminPanel>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <AdminPanel title="Next actions">
          <div className="space-y-3 text-sm text-slate-700">
            <p>Sync a small batch from ToursBMS, review warnings, then publish only the products ready for customers.</p>
            <p>Use Categories & Filters to spot missing city, country, price, or bookable facts before building advanced filters.</p>
            {user?.isOwner ? <AdminLinkButton href={`/${locale}/admin/sync`}>Open sync controls</AdminLinkButton> : null}
          </div>
        </AdminPanel>

        <AdminPanel title="Recent Shopify products">
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
            {products.length === 0 ? <p className="text-sm text-slate-600">No Shopify tour products found for tag:tour.</p> : null}
          </div>
        </AdminPanel>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">

        <AdminPanel title="Recent orders">
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
            {orders.length === 0 ? <p className="text-sm text-slate-600">No orders found yet.</p> : null}
          </div>
        </AdminPanel>
      </div>
    </>
  )
}
