'use client'
import { useEffect } from 'react'
import { useCartStore } from '@/store/cart'

export function CartClearer() {
  const clearCart = useCartStore((s) => s.clearCart)
  useEffect(() => {
    clearCart()
  }, [clearCart])
  return null
}
