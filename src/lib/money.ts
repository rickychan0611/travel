export function formatMoney(amount: string | number, currencyCode: string, locale?: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  }).format(typeof amount === 'number' ? amount : Number(amount))
}
