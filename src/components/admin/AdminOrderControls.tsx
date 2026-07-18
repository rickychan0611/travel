'use client'

import { ArrowDown, ArrowUp, CheckCircle2 } from 'lucide-react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import type { AdminFormState } from './AdminActionForm'

const initialState: AdminFormState = { error: null, saved: false }

function MoveButtons({ position, total }: { position: number; total: number }) {
  const { pending, data } = useFormStatus()
  const activeDirection = String(data?.get('direction') || '')
  const buttonClass = 'inline-flex h-8 items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <>
      <button name="direction" value="up" type="submit" disabled={pending || position <= 1} className={buttonClass}>
        <ArrowUp className="size-3.5" />
        {pending && activeDirection === 'up' ? 'Moving…' : 'Move up'}
      </button>
      <button name="direction" value="down" type="submit" disabled={pending || position >= total} className={buttonClass}>
        <ArrowDown className="size-3.5" />
        {pending && activeDirection === 'down' ? 'Moving…' : 'Move down'}
      </button>
    </>
  )
}

export function AdminOrderControls({
  action,
  type,
  id,
  parentId,
  position,
  total,
}: {
  action: (previousState: AdminFormState, formData: FormData) => Promise<AdminFormState>
  type: string
  id: string
  parentId?: string
  position: number
  total: number
}) {
  const [state, formAction] = useActionState(action, initialState)

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="id" value={id} />
      {parentId ? <input type="hidden" name="parentId" value={parentId} /> : null}
      <span className="mr-1 text-xs font-medium text-slate-500">Position {position} of {total}</span>
      <MoveButtons position={position} total={total} />
      {state.saved ? (
        <span role="status" aria-live="polite" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="size-3.5" /> {state.message || 'Moved'}
        </span>
      ) : null}
      {state.error ? <span role="alert" className="text-xs text-red-700">{state.error}</span> : null}
    </form>
  )
}
