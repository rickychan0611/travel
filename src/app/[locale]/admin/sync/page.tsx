import { AdminPageHeader, AdminPanel } from '@/components/admin/AdminCards'
import { AdminSyncForm } from '@/components/admin/AdminSyncForm'
import { getAdminUser } from '@/lib/admin/auth'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export default async function AdminSyncPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'admin' })
  const user = await getAdminUser()
  if (!user?.isOwner) {
    return (
      <AdminPanel title={t('ownerRequired')}>
        <p className="text-sm text-slate-700">{t('syncOwnerOnly')}</p>
      </AdminPanel>
    )
  }

  return (
    <>
      <AdminPageHeader
        title={t('syncTitle')}
        description={t('syncDesc')}
      />
      <AdminPanel title={t('runSyncJob')} description={t('runSyncJobDesc')}>
        <AdminSyncForm />
      </AdminPanel>
    </>
  )
}
