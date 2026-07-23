import { AdminLinkButton, AdminPageHeader, AdminPanel } from '@/components/admin/AdminCards'
import { createProductAction } from '../actions'
import { getTranslations } from 'next-intl/server'

export default async function NewAdminProductPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'admin' })

  return (
    <>
      <AdminPageHeader
        title={t('createTourTitle')}
        description={t('createTourDesc')}
        action={<AdminLinkButton href={`/${locale}/admin/products`}>{t('backToProducts')}</AdminLinkButton>}
      />

      <div className="max-w-2xl">
        <AdminPanel>
          <form action={createProductAction} className="space-y-4">
            <input type="hidden" name="locale" value={locale} />
            <label className="block">
              <span className="text-sm text-slate-700">{t('tourTitle')}</span>
              <input name="title" required className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950" />
            </label>
            <label className="block">
              <span className="text-sm text-slate-700">{t('productCode')}</span>
              <input name="productCode" placeholder={t('optional')} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-sm text-slate-950" />
            </label>
            <label className="block">
              <span className="text-sm text-slate-700">{t('urlHandle')}</span>
              <input name="handle" placeholder={t('optional')} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-sm text-slate-950" />
            </label>
            <label className="block">
              <span className="text-sm text-slate-700">{t('productType')}</span>
              <input name="productType" defaultValue="Tour" className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950" />
            </label>
            <button className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">{t('createProduct')}</button>
          </form>
        </AdminPanel>
      </div>
    </>
  )
}
