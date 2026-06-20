import { SignIn } from '@clerk/nextjs'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Login' }

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string; rest?: string[] }>
}) {
  const { locale } = await params
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <SignIn fallbackRedirectUrl={`/${locale}`} />
    </div>
  )
}
