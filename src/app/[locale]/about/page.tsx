import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Globe, Users, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  return {
    title: t('aboutTitle'),
    description: t('aboutDesc'),
  }
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('about')

  const features = [
    { icon: Users, title: t('feature1Title'), desc: t('feature1Desc') },
    { icon: Zap,   title: t('feature2Title'), desc: t('feature2Desc') },
    { icon: Globe, title: t('feature3Title'), desc: t('feature3Desc') },
  ]

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero */}
      <div className="max-w-2xl mx-auto text-center mb-16">
        <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
        <p className="text-muted-foreground leading-relaxed">{t('mission')}</p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {features.map(({ icon: Icon, title, desc }) => (
          <Card key={title}>
            <CardContent className="pt-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Icon className="size-6 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center">
        <Link href={`/${locale}/tours`}>
          <Button size="lg">{t('ctaButton')}</Button>
        </Link>
      </div>
    </div>
  )
}
