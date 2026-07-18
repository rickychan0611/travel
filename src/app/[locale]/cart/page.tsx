'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useUser } from '@clerk/nextjs'
import { ShoppingCart, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  getCartItemAddonsTotal,
  getCartItemBaseTotal,
  getCartItemTotal,
  getCartTotal,
  useCartStore,
} from '@/store/cart'

export default function CartPage() {
  const params = useParams()
  const locale = params.locale as string
  const router = useRouter()
  const t = useTranslations('booking')
  const tc = useTranslations('common')
  const { isSignedIn, isLoaded, user } = useUser()

  const items = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)

  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const total = getCartTotal(items)

  const handleCheckout = async () => {
    if (!isSignedIn) return
    setCheckoutLoading(true)
    setCheckoutError(null)
    try {
      const buyerEmail = user?.primaryEmailAddress?.emailAddress
      const returnUrl = `${window.location.origin}/${locale}/order-confirmation`
      const res = await fetch('/api/shopify/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, buyerEmail, returnUrl }),
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
          {items.map((item) => {
            const baseTotal = getCartItemBaseTotal(item)
            const addonsTotal = getCartItemAddonsTotal(item)
            const itemTotal = getCartItemTotal(item)

            return (
            <div
              key={item.bookingId}
              className="flex items-start gap-4 rounded-xl border bg-card p-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm leading-snug">{item.productTitle}</p>
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span>{item.travelers.adults + item.travelers.seniors + item.travelers.children} travelers</span>
                  <span>·</span>
                  <span>{item.departureDate}</span>
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <p className="font-medium">
                    Base: {item.currencyCode} {baseTotal.toFixed(0)}
                  </p>
                  {item.addons.length > 0 ? (
                    <div className="rounded-md bg-muted/50 p-2 text-muted-foreground">
                      <p className="font-medium text-foreground">Selected add-ons</p>
                      <ul className="mt-1 space-y-1">
                        {item.addons.map((addon) => (
                          <li key={addon.id} className="flex justify-between gap-3">
                            <span>
                              {addon.name}
                              {addon.price > 0 ? ` x ${addon.quantity}` : ' (request only)'}
                            </span>
                            <span className="shrink-0">
                              {addon.price > 0
                                ? `${item.currencyCode} ${(addon.price * addon.quantity).toFixed(0)}`
                                : '--'}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {addonsTotal > 0 ? (
                        <p className="mt-1 text-right font-medium text-foreground">
                          Add-ons: {item.currencyCode} {addonsTotal.toFixed(0)}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  <p className="font-bold">
                    Item total: {item.currencyCode} {itemTotal.toFixed(0)}
                  </p>
                </div>
                {item.roomSummary.length > 0 ? <ul className="mt-2 text-xs text-muted-foreground">{item.roomSummary.map((room) => <li key={room}>{room}</li>)}</ul> : null}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeItem(item.bookingId)}
                aria-label="Remove item"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            )
          })}
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
            <p className="mt-2 text-center text-sm text-muted-foreground">
              You will be redirected to Shopify&apos;s secure checkout.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
