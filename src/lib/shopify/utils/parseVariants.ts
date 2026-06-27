import type { ProductVariant } from '../types'

export interface DepartureDate {
  date: string
  status: 'available' | 'limited' | 'sold-out'
  available: boolean
  lowestPrice: { amount: string; currencyCode: string }
  variants: ProductVariant[]
}

function partyCount(variant: ProductVariant): number {
  const val = variant.selectedOptions.find(o => o.name === 'Party Size')?.value ?? '1'
  return parseInt(val) || 1
}

function getStatus(variants: ProductVariant[]): 'available' | 'limited' | 'sold-out' {
  const avail = variants.filter(v => v.availableForSale)
  if (avail.length === 0) return 'sold-out'
  // null quantityAvailable = inventory tracking disabled → treat as available
  if (avail.some(v => v.quantityAvailable === null)) return 'available'
  const maxQty = Math.max(...avail.map(v => v.quantityAvailable!))
  if (maxQty > 5) return 'available'
  if (maxQty >= 1) return 'limited'
  return 'sold-out'
}

function getLowestPrice(variants: ProductVariant[]): { amount: string; currencyCode: string } {
  // Highest party count = cheapest per-person price.
  // Use all variants (incl. sold-out) so price is available for strike-through display.
  const sorted = [...variants].sort((a, b) => partyCount(b) - partyCount(a))
  return sorted[0].price
}

export function parseDepartureDates(variants: ProductVariant[]): DepartureDate[] {
  const dateMap = new Map<string, ProductVariant[]>()

  for (const variant of variants) {
    const date =
      variant.selectedOptions.find(o => o.name === 'Departure')?.value ??
      variant.title.split(' / ')[0]?.trim()

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue

    if (!dateMap.has(date)) dateMap.set(date, [])
    dateMap.get(date)!.push(variant)
  }

  return Array.from(dateMap.entries())
    .map(([date, vars]) => {
      const status = getStatus(vars)
      return {
        date,
        status,
        available: status !== 'sold-out',
        lowestPrice: getLowestPrice(vars),
        variants: vars,
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}
