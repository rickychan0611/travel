import { SignIn } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { safeRedirectPath } from '@/lib/auth/redirect'

export const metadata: Metadata = { title: 'Login' }

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; rest?: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale } = await params
  const query = await searchParams
  const redirectUrl = safeRedirectPath(query.redirect_url, `/${locale}`)

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <SignIn forceRedirectUrl={redirectUrl} fallbackRedirectUrl={redirectUrl} />
    </div>
  )
}
