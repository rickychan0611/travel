'use client'

import { ArrowDown, ArrowUp, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { useActionState, useState } from 'react'
import type { AdminFormState } from '@/components/admin/AdminActionForm'

type HighlightDraft = {
  id: string
  clientKey: string
  text: string
}

const initialActionState: AdminFormState = { error: null, saved: false }

export function HighlightsEditor({
  action,
  locale,
  contentLocale,
  handle,
  productId,
  productCode,
  initialHighlights,
}: {
  action: (previousState: AdminFormState, formData: FormData) => Promise<AdminFormState>
  locale: string
  contentLocale: string
  handle: string
  productId: string
  productCode: string
  initialHighlights: Array<{ id: string; text: string }>
}) {
  const [rows, setRows] = useState<HighlightDraft[]>(() => initialHighlights.map((item) => ({
    id: item.id,
    clientKey: item.id.split('/').pop() || item.id,
    text: item.text,
  })))
  const [dirty, setDirty] = useState(false)

  async function submit(previousState: AdminFormState, formData: FormData) {
    const result = await action(previousState, formData)
    if (result.saved) {
      const savedRows = (result.data as { rows?: HighlightDraft[] } | undefined)?.rows
      if (savedRows) setRows(savedRows)
      setDirty(false)
    }
    return result
  }

  const [state, formAction, pending] = useActionState(submit, initialActionState)

  function updateRow(clientKey: string, value: string) {
    setRows((current) => current.map((row) => row.clientKey === clientKey ? { ...row, text: value } : row))
    setDirty(true)
  }

  function addRow() {
    const clientKey = `draft-${Date.now()}-${rows.length + 1}`
    setRows((current) => [...current, { id: '', clientKey, text: '' }])
    setDirty(true)
  }

  function removeRow(clientKey: string) {
    setRows((current) => current.filter((row) => row.clientKey !== clientKey))
    setDirty(true)
  }

  function moveRow(index: number, offset: number) {
    const nextIndex = index + offset
    if (nextIndex < 0 || nextIndex >= rows.length) return
    setRows((current) => {
      const next = [...current]
      const [row] = next.splice(index, 1)
      next.splice(nextIndex, 0, row)
      return next
    })
    setDirty(true)
  }

  return (
    <form action={formAction} id="highlights" className="space-y-3">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="contentLocale" value={contentLocale} />
      <input type="hidden" name="handle" value={handle} />
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="productCode" value={productCode} />
      <input type="hidden" name="highlights" value={JSON.stringify(rows)} />

      {rows.map((row, index) => (
        <div key={row.clientKey} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <span className="w-6 shrink-0 text-center text-xs font-semibold text-slate-500">{index + 1}</span>
          <input
            value={row.text}
            onChange={(event) => updateRow(row.clientKey, event.target.value)}
            placeholder="Highlight sentence"
            aria-label={`Highlight ${index + 1}`}
            className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950"
          />
          <button type="button" onClick={() => moveRow(index, -1)} disabled={index === 0} aria-label={`Move highlight ${index + 1} up`} className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 disabled:opacity-30"><ArrowUp className="size-4" /></button>
          <button type="button" onClick={() => moveRow(index, 1)} disabled={index === rows.length - 1} aria-label={`Move highlight ${index + 1} down`} className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 disabled:opacity-30"><ArrowDown className="size-4" /></button>
          <button type="button" onClick={() => removeRow(row.clientKey)} aria-label={`Remove highlight ${index + 1}`} className="inline-flex size-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-700 hover:bg-red-50"><Trash2 className="size-4" /></button>
        </div>
      ))}

      <button type="button" onClick={addRow} className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-400 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
        <Plus className="size-4" /> Add sentence
      </button>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-3">
        <button type="submit" disabled={pending || !dirty} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? 'Saving…' : 'Save highlights'}
        </button>
        {state.saved && !dirty ? <span role="status" className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700"><CheckCircle2 className="size-4" />{state.message || 'Saved'}</span> : null}
        {state.error ? <span role="alert" className="text-sm text-red-700">{state.error}</span> : null}
      </div>
    </form>
  )
}
