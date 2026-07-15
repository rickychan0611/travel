import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { AdminShell } from '@/components/admin/AdminShell'
import { getAdminUser } from '@/lib/admin/auth'

export const metadata: Metadata = {
  title: 'Admin | Tours',
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await getAdminUser()

  if (!user) {
    return (
      <section className="min-h-[60vh] bg-white px-4 py-16 text-slate-950">
        <div className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold">Admin access required</h1>
          <p className="mt-3 text-slate-600">
            Your account needs Clerk public metadata role <code className="text-slate-950">owner</code> or{' '}
            <code className="text-slate-950">staff</code> to open this panel.
          </p>
        </div>
      </section>
    )
  }

  return <AdminShell locale={locale} user={user}>{children}</AdminShell>
}
