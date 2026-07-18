import { CacheRefreshForm } from '@/components/admin/CacheRefreshForm'
import { AdminPageHeader, AdminPanel } from '@/components/admin/AdminCards'
import { StorefrontRenderingToggle } from '@/components/admin/StorefrontRenderingToggle'
import { getAdminUser } from '@/lib/admin/auth'
import { getStorefrontSettings } from '@/lib/admin/storefront-settings'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await getAdminUser()
  if (!user?.isOwner) {
    return (
      <AdminPanel title="Owner access required">
        <p className="text-sm text-slate-700">Settings are restricted to owner accounts.</p>
      </AdminPanel>
    )
  }
  const storefrontSettings = await getStorefrontSettings()

  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="Operational controls for cache refresh and Shopify connection health."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <AdminPanel title="Storefront rendering" description="Control whether Shopify storefront data is cached. SSR is enabled by default during local development.">
          <StorefrontRenderingToggle initialEnabled={storefrontSettings.ssrEnabled} />
        </AdminPanel>
        <AdminPanel title="Cache refresh" description="Refresh Shopify product lists, tour pages, category pages, and product cards.">
          <CacheRefreshForm locale={locale} />
        </AdminPanel>
        <AdminPanel title="Shopify connection">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Store domain</dt>
              <dd className="font-mono text-slate-900">{process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || 'Missing'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Admin API version</dt>
              <dd className="font-mono text-slate-900">{process.env.SHOPIFY_ADMIN_API_VERSION || '2026-01'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Admin token</dt>
              <dd className="font-mono text-slate-900">{process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ? 'Configured' : 'Missing'}</dd>
            </div>
          </dl>
        </AdminPanel>
      </div>
    </>
  )
}
