import { AdminPageHeader, AdminPanel } from '@/components/admin/AdminCards'
import { listAdminOrders } from '@/lib/admin/shopify-admin'

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const orders = await listAdminOrders({ q, first: 50 })

  return (
    <>
      <AdminPageHeader
        title="Orders"
        description="Read-only Shopify order visibility for tour operations. Payment capture, refunds, and compliance remain in Shopify Checkout/Admin."
      />
      <AdminPanel>
        <form className="mb-4 flex gap-2">
          <input
            name="q"
            defaultValue={q ?? ''}
            className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950"
            placeholder="Search Shopify orders, email, customer..."
          />
          <button className="rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white">Search</button>
        </form>
        <div className="space-y-3">
          {orders.map((order) => (
            <a key={order.id} href={order.adminUrl} target="_blank" rel="noreferrer" className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-400">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-base font-semibold text-slate-950">{order.name}</div>
                  <div className="text-sm text-slate-600">{order.customerName} · {order.email}</div>
                </div>
                <div className="text-sm text-slate-700 md:text-right">
                  <div>{order.currencyCode} {order.total}</div>
                  <div className="text-xs text-slate-500">{order.financialStatus} / {order.fulfillmentStatus}</div>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {order.lineItems.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="text-sm text-slate-700">
                    {item.quantity} x {item.title}{item.variantTitle ? ` / ${item.variantTitle}` : ''}
                    {item.customAttributes.length > 0 ? (
                      <div className="mt-1 grid gap-1 font-mono text-xs text-slate-500 sm:grid-cols-2">
                        {item.customAttributes.map((attr) => <span key={attr.key}>{attr.key}: {attr.value}</span>)}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </a>
          ))}
          {orders.length === 0 ? <p className="text-sm text-slate-600">No orders found.</p> : null}
        </div>
      </AdminPanel>
    </>
  )
}
