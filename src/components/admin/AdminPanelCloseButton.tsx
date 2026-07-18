'use client'

import { ChevronUp } from 'lucide-react'

export function AdminPanelCloseButton({ title }: { title: string }) {
  return (
    <button
      type="button"
      onClick={(event) => event.currentTarget.closest('details')?.removeAttribute('open')}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
    >
      <ChevronUp className="size-4" />
      Close {title}
    </button>
  )
}
