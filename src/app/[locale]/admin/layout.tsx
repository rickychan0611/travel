import type { Metadata } from 'next'
import type { Route } from 'next'
import type { ReactNode } from 'react'
import { auth } from '@clerk/nextjs/server'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { AdminShell } from '@/components/admin/AdminShell'
import { getAdminUser } from '@/lib/admin/auth'
import { loginPath } from '@/lib/auth/redirect'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'admin' })
  return { title: t('metaTitle') }
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const { userId } = await auth()

  if (!userId) {
    redirect(loginPath(locale, `/${locale}/admin/products`) as Route)
  }

  const user = await getAdminUser()
  const t = await getTranslations({ locale, namespace: 'admin' })

  if (!user) {
    return (
      <section className="min-h-[60vh] bg-white px-4 py-16 text-slate-950">
        <div className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold">{t('accessRequiredTitle')}</h1>
          <p className="mt-3 text-slate-600">
            {t.rich('accessRequiredDesc', {
              owner: (chunks) => <code className="text-slate-950">{chunks}</code>,
              staff: (chunks) => <code className="text-slate-950">{chunks}</code>,
            })}
          </p>
        </div>
      </section>
    )
  }

  return <AdminShell locale={locale} user={user}>{children}</AdminShell>
}
