import type { Route } from 'next'
import { redirect } from 'next/navigation'

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  redirect(`/${locale}/admin/products` as Route)
}
