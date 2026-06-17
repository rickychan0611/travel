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
  tags: string[]
}

export function TourBookingPanel({ productHandle, productTitle, variants, tags }: Props) {
  const t = useTranslations('product')
  const tb = useTranslations('booking')
  const addItem = useCartStore((s) => s.addItem)

  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id ?? '')
  const [departureDate, setDepartureDate] = useState('')
  const [added, setAdded] = useState(false)

  const isInstant = tags.includes('booking:instant')
  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? variants[0]
  const today = new Date().toISOString().split('T')[0]

  const handleAddToCart = () => {
    if (!selectedVariant || !departureDate) return
    const partySizeRaw = selectedVariant.selectedOptions.find((o) => o.name === 'Party Size')?.value ?? '1'
    addItem({
      variantId: selectedVariant.id,
      productHandle,
      productTitle,
      departureDate,
      partySize: parseInt(partySizeRaw),
      pricePerPerson: parseFloat(selectedVariant.price.amount),
      currencyCode: selectedVariant.price.currencyCode,
      quantity: 1,
      pickupLocationId: null,
      addons: [],
      lineItemProperties: {},
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="space-y-4 rounded-xl border bg-card p-5">
      {/* Confirmation type */}
      <div className="flex items-center gap-2">
        <Badge variant={isInstant ? 'default' : 'secondary'}>
          {isInstant ? t('instant') : t('manual')}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {isInstant ? t('bookingType') : t('bookingType')}
        </span>
      </div>

      {/* Party size */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{tb('selectPartySize')}</label>
        <select
          value={selectedVariantId}
          onChange={(e) => setSelectedVariantId(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {variants.map((v) => (
            <option key={v.id} value={v.id} disabled={!v.availableForSale}>
              {v.title} — {v.price.currencyCode} {parseFloat(v.price.amount).toFixed(0)}
              {t('perPerson')}
            </option>
          ))}
        </select>
      </div>

      {/* Departure date */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{tb('selectDate')}</label>
        <input
          type="date"
          value={departureDate}
          min={today}
          onChange={(e) => setDepartureDate(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Price */}
      {selectedVariant && (
        <div className="flex items-baseline gap-1 pt-1">
          <span className="text-xs text-muted-foreground">{t('from')}</span>
          <span className="text-2xl font-bold text-primary">
            {selectedVariant.price.currencyCode}{' '}
            {parseFloat(selectedVariant.price.amount).toFixed(0)}
          </span>
          <span className="text-xs text-muted-foreground">{t('perPerson')}</span>
        </div>
      )}

      {/* CTA */}
      <Button
        className="w-full"
        disabled={!departureDate || added}
        onClick={handleAddToCart}
      >
        {added ? '✓ Added to cart' : t('bookNow')}
      </Button>
    </div>
  )
}
