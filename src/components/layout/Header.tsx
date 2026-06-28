import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Show, UserButton } from '@clerk/nextjs'
import { LocaleSwitcher } from './LocaleSwitcher'
import { CurrencySwitcher } from './CurrencySwitcher'
import { CartIcon } from './CartIcon'
import { MobileMenu } from './MobileMenu'
import { MobileMenuButton } from './MobileMenuButton'
import { Button } from '@/components/ui/button'
import { version } from '../../../package.json'

const buildTime = process.env.BUILD_TIME
  ? new Date(process.env.BUILD_TIME).toLocaleString('zh-CN', {
      timeZone: 'America/Vancouver',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  : ''

export function Header({ locale }: { locale: string }) {
  const t = useTranslations('nav')
  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Link href={`/${locale}`} className="text-xl font-bold text-primary">
              GlobalTours
            </Link>
            <span className="hidden md:flex flex-col leading-none text-[10px] text-muted-foreground/60 pt-0.5">
              <span>v{version}</span>
              <span>{buildTime}</span>
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href={`/${locale}/tours`} className="text-muted-foreground hover:text-foreground transition-colors">
              {t('tours')}
            </Link>
            <Link href={`/${locale}/about`} className="text-muted-foreground hover:text-foreground transition-colors">
              {t('about')}
            </Link>
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            <LocaleSwitcher />
            <CurrencySwitcher />
            <CartIcon locale={locale} />
            <Show when="signed-out">
              <Link href={`/${locale}/login`}>
                <Button variant="outline" size="sm">{t('login')}</Button>
              </Link>
            </Show>
            <Show when="signed-in">
              <Link href={`/${locale}/bookings`}>
                <Button size="sm" variant="ghost">{t('myBookings')}</Button>
              </Link>
              <Link href={`/${locale}/agent`}>
                <Button size="sm" variant="outline">{t('agentPortal')}</Button>
              </Link>
              <UserButton />
            </Show>
          </div>

          {/* Mobile actions */}
          <div className="flex md:hidden items-center gap-2">
            <CartIcon locale={locale} />
            <MobileMenuButton />
          </div>
        </div>
      </header>
      <MobileMenu locale={locale} />
    </>
  )
}
