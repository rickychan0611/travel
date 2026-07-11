import { getTranslations } from 'next-intl/server'
import { Mail, BookOpen, TrendingUp, Users } from 'lucide-react'

const TIERS = ['1', '2', '3'] as const

const COMING_SOON_FEATURES = [
  { key: 'featureBookingHistory', icon: BookOpen },
  { key: 'featureCommission', icon: TrendingUp },
  { key: 'featureClientPortal', icon: Users },
] as const

export async function AgentDashboard({
  locale,
  displayName,
}: {
  locale: string
  displayName: string
}) {
  const t = await getTranslations({ locale, namespace: 'agent' })

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">{t('welcome', { name: displayName })}</p>
      </div>

      {/* Discount tiers */}
      <section>
        <h2 className="text-lg font-semibold mb-4">{t('discountTitle')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TIERS.map((n) => (
            <div key={n} className="rounded-xl border bg-card p-5 text-center">
              <p className="text-sm font-medium mb-1">{t(`tier${n}Label`)}</p>
              <p className="text-sm text-muted-foreground mb-3">{t(`tier${n}Range`)}</p>
              <p className="text-2xl font-bold text-primary">{t(`tier${n}Discount`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How to book */}
      <section>
        <h2 className="text-lg font-semibold mb-4">{t('howToBookTitle')}</h2>
        <ol className="space-y-3">
          {(['step1', 'step2', 'step3'] as const).map((step, i) => (
            <li key={step} className="flex gap-4 items-start">
              <span className="flex-shrink-0 size-7 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center">
                {i + 1}
              </span>
              <p className="text-sm pt-1">{t(step)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Account manager */}
      <section>
        <h2 className="text-lg font-semibold mb-4">{t('managerTitle')}</h2>
        <div className="rounded-xl border bg-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-full bg-muted">
            <Mail className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-sm">{t('managerContact')}</p>
            <a
              href={`mailto:${t('managerEmail')}`}
              className="text-sm text-primary underline-offset-2 hover:underline"
            >
              {t('managerEmail')}
            </a>
          </div>
        </div>
      </section>

      {/* Coming soon */}
      <section>
        <h2 className="text-lg font-semibold mb-4">{t('comingSoon')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {COMING_SOON_FEATURES.map(({ key, icon: Icon }) => (
            <div
              key={key}
              className="rounded-xl border border-dashed bg-muted/30 p-5 flex flex-col items-center text-center gap-2 opacity-60"
            >
              <Icon className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t(key)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
