'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/cart'
import type { ProductVariant } from '@/lib/shopify/types'

type Props = {
  productHandle: string
  productTitle: string
  variants: ProductVariant[]
  selectedDate: string | null
  tags: string[]
}

export function TourBookingPanel({
  productHandle,
  productTitle,
  variants,
  selectedDate,
  tags,
}: Props) {
  const t = useTranslations('product')
  const tb = useTranslations('booking')
  const tc = useTranslations('calendar')
  const addItem = useCartStore(s => s.addItem)

  const [selectedVariantId, setSelectedVariantId] = useState('')
  const [added, setAdded] = useState(false)

  const isInstant = tags.includes('booking:instant')
  const activeVariantId = selectedVariantId || variants[0]?.id || ''
  const selectedVariant = variants.find(v => v.id === activeVariantId) ?? variants[0]

  function handleAddToCart() {
    if (!selectedVariant || !selectedDate) return
    const partySizeRaw =
      selectedVariant.selectedOptions.find(o => o.name === 'Party Size')?.value ?? '1'
    addItem({
      bookingId: `${productHandle}-${selectedDate}-${Date.now()}`,
      productHandle,
      productTitle,
      departureDate: selectedDate,
      pricingMode: 'per_person',
      travelers: { adults: parseInt(partySizeRaw), seniors: 0, children: 0 },
      roomSummary: [],
      priceLines: [{ variantId: selectedVariant.id, label: selectedVariant.title, quantity: parseInt(partySizeRaw), unitPrice: parseFloat(selectedVariant.price.amount) }],
      currencyCode: selectedVariant.price.currencyCode,
      pickupLocationId: null,
      addons: [],
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  // No date selected or no variants for this date yet
  if (!selectedDate || variants.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Badge variant={isInstant ? 'default' : 'secondary'}>
            {isInstant ? t('instant') : t('manual')}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground text-center py-8">
          {tc('selectDatePrompt')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-xl border bg-card p-5">
      {/* Confirmation badge + selected date */}
      <div className="flex items-center gap-2">
        <Badge variant={isInstant ? 'default' : 'secondary'}>
          {isInstant ? t('instant') : t('manual')}
        </Badge>
        <span className="text-sm text-muted-foreground">{selectedDate}</span>
      </div>

      {/* Party size selector */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{tb('selectPartySize')}</label>
        <select
          value={activeVariantId}
          onChange={e => setSelectedVariantId(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {variants.map(v => {
            const partyLabel =
              v.selectedOptions.find(o => o.name === 'Party Size')?.value ?? v.title
            return (
              <option key={v.id} value={v.id} disabled={!v.availableForSale}>
                {partyLabel} — {v.price.currencyCode}{' '}
                {parseFloat(v.price.amount).toFixed(0)}
                {t('perPerson')}
              </option>
            )
          })}
        </select>
      </div>

      {/* Price display */}
      {selectedVariant && (
        <div className="flex items-baseline gap-1 pt-1">
          <span className="text-sm text-muted-foreground">{t('from')}</span>
          <span className="text-2xl font-bold text-primary">
            {selectedVariant.price.currencyCode}{' '}
            {parseFloat(selectedVariant.price.amount).toFixed(0)}
          </span>
          <span className="text-sm text-muted-foreground">{t('perPerson')}</span>
        </div>
      )}

      {/* Book Now CTA */}
      <Button className="w-full" disabled={added} onClick={handleAddToCart}>
        {added ? '✓ Added to cart' : t('bookNow')}
      </Button>
    </div>
  )
}
