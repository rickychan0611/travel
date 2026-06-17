'use client'
import { Menu, X } from 'lucide-react'
import { useUIStore } from '@/store/ui'

export function MobileMenuButton() {
  const open = useUIStore((s) => s.mobileMenuOpen)
  const setOpen = useUIStore((s) => s.setMobileMenuOpen)

  return (
    <button
      onClick={() => setOpen(!open)}
      className="p-2 text-muted-foreground hover:text-foreground transition-colors"
      aria-label={open ? 'Close menu' : 'Open menu'}
    >
      {open ? <X className="size-5" /> : <Menu className="size-5" />}
    </button>
  )
}
