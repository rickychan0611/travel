import Link from 'next/link'
import { useTranslations } from 'next-intl'

export function Footer({ locale }: { locale: string }) {
  const t  = useTranslations('nav')
  const tf = useTranslations('footer')

  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-2">
            <Link href={`/${locale}`} className="text-lg font-bold text-primary">
              GlobalTours
            </Link>
            <p className="text-sm text-muted-foreground">{tf('tagline')}</p>
          </div>

          {/* Explore */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Explore</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href={`/${locale}/tours`} className="hover:text-foreground transition-colors">
                  {t('tours')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href={`/${locale}/about`} className="hover:text-foreground transition-colors">
                  {t('about')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/login`} className="hover:text-foreground transition-colors">
                  {t('login')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/agent`} className="hover:text-foreground transition-colors">
                  {t('agentPortal')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} GlobalTours. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
