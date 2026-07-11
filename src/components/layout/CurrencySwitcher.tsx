'use client'
import { useUIStore } from '@/store/ui'

const CURRENCIES = [
  { code: 'USD', label: '$ 美元' },
  { code: 'CAD', label: 'C$ 加元' },
  { code: 'CNY', label: '¥ 人民币' },
  { code: 'EUR', label: '€ 欧元' },
  { code: 'AUD', label: 'A$ 澳元' },
  { code: 'HKD', label: 'HK$ 港币' },
]

export function CurrencySwitcher() {
  const { currency, setCurrency } = useUIStore()
  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value)}
      className="cursor-pointer appearance-none bg-transparent text-sm text-[#666] outline-none hover:text-tff-orange"
      aria-label="Currency"
    >
      {CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>{c.label}</option>
      ))}
    </select>
  )
}
