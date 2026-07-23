import { CacheRefreshForm } from '@/components/admin/CacheRefreshForm'
import { AdminPageHeader, AdminPanel } from '@/components/admin/AdminCards'
import { StorefrontRenderingToggle } from '@/components/admin/StorefrontRenderingToggle'
import { getAdminUser } from '@/lib/admin/auth'
import { getStorefrontSettings } from '@/lib/admin/storefront-settings'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'admin' })
  const user = await getAdminUser()
  if (!user?.isOwner) {
    return (
      <AdminPanel title={t('ownerRequired')}>
        <p className="text-sm text-slate-700">{t('settingsOwnerOnly')}</p>
      </AdminPanel>
    )
  }
  const storefrontSettings = await getStorefrontSettings()

  return (
    <>
      <AdminPageHeader
        title={t('settingsTitle')}
        description={t('settingsDesc')}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <AdminPanel title={t('storefrontRendering')} description={t('storefrontRenderingDesc')}>
          <StorefrontRenderingToggle initialEnabled={storefrontSettings.ssrEnabled} />
        </AdminPanel>
        <AdminPanel title={t('cacheRefresh')} description={t('cacheRefreshDesc')}>
          <CacheRefreshForm locale={locale} />
        </AdminPanel>
        <AdminPanel title={t('shopifyConnectionTitle')}>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">{t('storeDomain')}</dt>
              <dd className="font-mono text-slate-900">{process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || t('missing')}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t('adminApiVersion')}</dt>
              <dd className="font-mono text-slate-900">{process.env.SHOPIFY_ADMIN_API_VERSION || '2026-01'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t('adminToken')}</dt>
              <dd className="font-mono text-slate-900">{process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ? t('configured') : t('missing')}</dd>
            </div>
          </dl>
        </AdminPanel>
      </div>
    </>
  )
}
