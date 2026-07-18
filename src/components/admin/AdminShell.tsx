import { SignOutButton } from '@clerk/nextjs'
import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  Boxes,
  CalendarSync,
  ClipboardList,
  Gauge,
  ListFilter,
  LogOut,
  PanelsTopLeft,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import type { AdminUser } from '@/lib/admin/auth'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Dashboard', href: '', icon: Gauge, ownerOnly: false },
  { label: 'Products', href: '/products', icon: Boxes, ownerOnly: false },
  { label: 'Landing Page', href: '/landing-page', icon: PanelsTopLeft, ownerOnly: false },
  { label: 'Sync', href: '/sync', icon: CalendarSync, ownerOnly: true },
  { label: 'Categories & Filters', href: '/categories', icon: ListFilter, ownerOnly: false },
  { label: 'Orders', href: '/orders', icon: ClipboardList, ownerOnly: false },
  { label: 'Settings', href: '/settings', icon: Settings, ownerOnly: true },
]

export function AdminShell({
  locale,
  user,
  children,
}: {
  locale: string
  user: AdminUser
  children: ReactNode
}) {
  return (
    <section className="min-h-[calc(100vh-180px)] bg-white text-slate-950">
      <div className="mx-auto flex max-w-[1440px] gap-0">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-slate-200 bg-white px-4 py-6 lg:block">
          <Link href={`/${locale}/admin`} className="mb-8 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-slate-950 text-white">
              <ShieldCheck className="size-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold uppercase tracking-[0.18em] text-slate-950">Admin</span>
              <span className="block text-xs text-slate-500">Shopify tour operations</span>
            </span>
          </Link>

          <nav className="space-y-1">
            {navItems.map((item) => {
              if (item.ownerOnly && !user.isOwner) return null
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={`/${locale}/admin${item.href}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="absolute bottom-6 left-4 right-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            <div className="font-medium text-slate-950">{user.displayName}</div>
            <div>{user.email}</div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="inline-flex rounded bg-slate-950 px-2 py-1 text-white">{user.role}</div>
              <SignOutButton redirectUrl={`/${locale}`}>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                >
                  <LogOut className="size-3.5" />
                  Log out
                </button>
              </SignOutButton>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
            <div className="flex items-center justify-between">
              <Link href={`/${locale}/admin`} className="font-semibold">Admin</Link>
              <div className="flex items-center gap-2">
                <span className="rounded bg-slate-950 px-2 py-1 text-xs text-white">{user.role}</span>
                <SignOutButton redirectUrl={`/${locale}`}>
                  <button
                    type="button"
                    aria-label="Log out"
                    title="Log out"
                    className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                  >
                    <LogOut className="size-4" />
                  </button>
                </SignOutButton>
              </div>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {navItems.map((item) => {
                if (item.ownerOnly && !user.isOwner) return null
                return (
                  <Link
                    key={item.href}
                    href={`/${locale}/admin${item.href}`}
                    className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700"
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>

          <main className={cn('min-h-screen px-4 py-6 sm:px-6 lg:px-8')}>{children}</main>
        </div>
      </div>
    </section>
  )
}
