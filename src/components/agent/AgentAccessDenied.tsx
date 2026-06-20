import { getTranslations } from 'next-intl/server'
import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export async function AgentAccessDenied({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'agent' })

  return (
    <div className="container mx-auto flex flex-col items-center justify-center px-4 py-24 text-center max-w-md">
      <div className="p-4 rounded-full bg-muted mb-6">
        <ShieldX className="size-8 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-semibold mb-3">{t('accessDeniedTitle')}</h1>
      <p className="text-sm text-muted-foreground mb-8">{t('accessDeniedDesc')}</p>
      <a href={`mailto:${t('managerEmail')}`}>
        <Button variant="outline">{t('contactManager')}</Button>
      </a>
    </div>
  )
}
