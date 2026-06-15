import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('nav')
  return (
    <footer className="border-t mt-auto py-8 text-sm text-muted-foreground">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <span>© 2026 GlobalTours. All rights reserved.</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-foreground transition-colors">{t('about')}</a>
          <a href="#" className="hover:text-foreground transition-colors">{t('contact')}</a>
        </div>
      </div>
    </footer>
  )
}
