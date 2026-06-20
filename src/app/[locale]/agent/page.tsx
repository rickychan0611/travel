import { currentUser } from '@clerk/nextjs/server'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { AgentDashboard } from '@/components/agent/AgentDashboard'
import { AgentAccessDenied } from '@/components/agent/AgentAccessDenied'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'agent' })
  return { title: t('title') }
}

export default async function AgentPortalPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await currentUser()
  const isAgent = user?.publicMetadata?.role === 'agent'
  const displayName =
    user?.firstName ?? user?.emailAddresses[0]?.emailAddress?.split('@')[0] ?? ''

  if (!isAgent) {
    return <AgentAccessDenied locale={locale} />
  }

  return <AgentDashboard locale={locale} displayName={displayName} />
}
