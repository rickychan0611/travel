'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useUser } from '@clerk/nextjs'
import { ShoppingCart, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '@/store/cart'

export default function CartPage() {
  const params = useParams()
  const locale = params.locale as string
  const router = useRouter()
  const t = useTranslations('booking')
  const tc = useTranslations('common')
  const { isSignedIn, isLoaded } = useUser()

  const items = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)

  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const total = items.reduce((sum, item) => sum + item.pricePerPerson * item.partySize, 0)

  const handleCheckout = async () => {
    if (!isSignedIn) return
    setCheckoutLoading(true)
    setCheckoutError(null)
    try {
      const res = await fetch('/api/shopify/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCheckoutError(data.error ?? 'Checkout failed. Please try again.')
        return
      }
      window.location.href = data.checkoutUrl
    } catch {
      setCheckoutError('Network error. Please check your connection and try again.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center px-4 py-24 text-center">
        <ShoppingCart className="size-12 text-muted-foreground/40 mb-4" />
        <h1 className="text-xl font-semibold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse our tours and add something you love.
        </p>
        <Link href={`/${locale}`} className="mt-6">
          <Button>Browse Tours</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{t('summary')}</h1>
          <Link href={`/${locale}`} className="text-sm text-muted-foreground hover:text-foreground">
            ← {tc('back')}
          </Link>
        </div>

        {/* Cart items */}
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.variantId}
              className="flex items-start gap-4 rounded-xl border bg-card p-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm leading-snug">{item.productTitle}</p>
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{item.partySize} person{item.partySize > 1 ? 's' : ''}</span>
                  <span>·</span>
                  <span>{item.departureDate}</span>
                </div>
                <p className="mt-2 text-sm font-bold">
                  {item.currencyCode} {(item.pricePerPerson * item.partySize).toFixed(0)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeItem(item.variantId)}
                aria-label="Remove item"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        <Separator className="my-6" />

        {/* Total */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-base font-semibold">{t('total')}</span>
          <span className="text-2xl font-bold">{items[0]?.currencyCode ?? 'CAD'} {total.toFixed(0)}</span>
        </div>

        {/* Error */}
        {checkoutError && (
          <p className="mb-4 text-sm text-destructive text-center">{checkoutError}</p>
        )}

        {/* Checkout CTA — shows login prompt when unauthenticated */}
        {isLoaded && !isSignedIn ? (
          <div className="space-y-3">
            <p className="text-sm text-center text-muted-foreground">
              请登录后继续结账
            </p>
            <Button
              className="w-full"
              size="lg"
              onClick={() => router.push(`/${locale}/login` as never)}
            >
              登录 / 注册
            </Button>
          </div>
        ) : (
          <>
            <Button
              className="w-full"
              size="lg"
              disabled={checkoutLoading || !isLoaded}
              onClick={handleCheckout}
            >
              {checkoutLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Processing…
                </>
              ) : (
                'Proceed to Checkout'
              )}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              You will be redirected to Shopify&apos;s secure checkout.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
