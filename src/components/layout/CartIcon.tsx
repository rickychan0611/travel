'use client'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/store/cart'

export function CartIcon({ locale }: { locale: string }) {
  const items = useCartStore((s) => s.items)
  const count = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <Link
      href={`/${locale}/cart`}
      className="relative inline-flex items-center p-1 text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Cart"
    >
      <ShoppingCart className="size-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground leading-none">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}
