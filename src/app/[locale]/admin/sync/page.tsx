import { AdminPageHeader, AdminPanel } from '@/components/admin/AdminCards'
import { AdminSyncForm } from '@/components/admin/AdminSyncForm'
import { getAdminUser } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

export default async function AdminSyncPage() {
  const user = await getAdminUser()
  if (!user?.isOwner) {
    return (
      <AdminPanel title="Owner access required">
        <p className="text-sm text-slate-700">Sync can overwrite Shopify content and is restricted to owner accounts.</p>
      </AdminPanel>
    )
  }

  return (
    <>
      <AdminPageHeader
        title="ToursBMS sync"
        description="Import product IDs, extract localized JSON, dry-run payloads, or apply updates to Shopify. Manual edits are preserved unless the sync script is explicitly changed to overwrite them."
      />
      <AdminPanel title="Run sync job" description="For large batches, keep this page open. Production should later move this to a durable queue.">
        <AdminSyncForm />
      </AdminPanel>
    </>
  )
}
