export const DATE_PRICE_RATES = [
  { label: 'Adult', priceType: 1 },
  { label: 'Child', priceType: 2 },
  { label: 'Single room', priceType: 3 },
  { label: 'Double room', priceType: 4 },
  { label: 'Triple room', priceType: 5 },
  { label: 'Quad room', priceType: 6 },
  { label: 'Senior', priceType: 7 },
] as const

export type PricingMode = 'per_person' | 'room_occupancy'

export type DatePriceRateLabel = (typeof DATE_PRICE_RATES)[number]['label']

export function getDatePriceRate(label: string) {
  return DATE_PRICE_RATES.find((rate) => rate.label === label)
}

export function ratesForPricingMode(mode: PricingMode) {
  return DATE_PRICE_RATES.filter((rate) => mode === 'per_person'
    ? [1, 2, 7].includes(rate.priceType)
    : [3, 4, 5, 6].includes(rate.priceType))
}
