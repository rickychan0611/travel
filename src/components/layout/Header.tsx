import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { LocaleSwitcher } from './LocaleSwitcher'
import { CurrencySwitcher } from './CurrencySwitcher'
import { Button } from '@/components/ui/button'

export function Header({ locale }: { locale: string }) {
  const t = useTranslations('nav')
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href={`/${locale}`} className="text-xl font-bold text-primary">
          GlobalTours
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href={`/${locale}/tours`} className="text-muted-foreground hover:text-foreground transition-colors">
            {t('tours')}
          </Link>
          <Link href={`/${locale}/about`} className="text-muted-foreground hover:text-foreground transition-colors">
            {t('about')}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <CurrencySwitcher />
          <Link href={`/${locale}/login`}>
            <Button variant="outline" size="sm">{t('login')}</Button>
          </Link>
          <Link href={`/${locale}/agent`}>
            <Button size="sm">{t('agentPortal')}</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
