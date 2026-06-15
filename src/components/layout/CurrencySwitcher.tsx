'use client'
import { useUIStore } from '@/store/ui'

const CURRENCIES = ['USD', 'CAD', 'CNY', 'EUR', 'AUD', 'HKD']

export function CurrencySwitcher() {
  const { currency, setCurrency } = useUIStore()
  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value)}
      className="text-sm bg-transparent border border-border rounded px-2 py-1"
    >
      {CURRENCIES.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  )
}
