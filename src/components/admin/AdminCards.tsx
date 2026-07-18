import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { AdminPanelCloseButton } from './AdminPanelCloseButton'

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm text-slate-600">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function AdminStatCard({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-3 text-2xl font-semibold text-slate-950">{value}</div>
      {note ? <div className="mt-1 text-xs text-slate-600">{note}</div> : null}
    </div>
  )
}

export function AdminPanel({
  title,
  description,
  children,
  collapsible = false,
  defaultOpen = false,
}: {
  title?: string
  description?: string
  children: ReactNode
  collapsible?: boolean
  defaultOpen?: boolean
}) {
  if (collapsible && title) {
    return (
      <details open={defaultOpen} className="group rounded-lg border border-slate-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 marker:hidden [&::-webkit-details-marker]:hidden">
          <span className="min-w-0">
            <span className="block font-medium text-slate-950">{title}</span>
            {description ? <span className="mt-1 block text-sm text-slate-600">{description}</span> : null}
          </span>
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition group-open:rotate-180" aria-hidden="true">
            <ChevronDown className="size-4" />
          </span>
        </summary>
        <div className="border-t border-slate-200 p-4">
          {children}
          <div className="mt-5 flex justify-end border-t border-slate-200 pt-4">
            <AdminPanelCloseButton title={title} />
          </div>
        </div>
      </details>
    )
  }
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      {title ? (
        <header className="border-b border-slate-200 px-4 py-3">
          <h2 className="font-medium text-slate-950">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
        </header>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  )
}

export function AdminLinkButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-950 px-3 text-sm font-medium text-white transition hover:bg-slate-800"
    >
      {children}
    </a>
  )
}
