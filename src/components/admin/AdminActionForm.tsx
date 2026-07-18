'use client'

import { CheckCircle2 } from 'lucide-react'
import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import type { ReactNode } from 'react'

export type AdminFormState = {
  error: string | null
  saved: boolean
  message?: string
  data?: unknown
}

const initialState: AdminFormState = { error: null, saved: false }

function SubmitButton({ label, pendingLabel, className, intent = 'save' }: { label: string; pendingLabel?: string; className?: string; intent?: 'save' | 'delete' }) {
  const { pending, data } = useFormStatus()
  const activeIntent = String(data?.get('_intent') || 'save')

  return (
    <button
      type="submit"
      name="_intent"
      value={intent}
      formNoValidate={intent === 'delete'}
      disabled={pending}
      className={className || 'rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-wait disabled:opacity-60'}
    >
      {pending && activeIntent === intent ? (pendingLabel || 'Saving…') : label}
    </button>
  )
}

export function AdminActionForm({
  action,
  children,
  className,
  footerClassName,
  submitClassName,
  submitLabel,
  pendingLabel,
  confirmMessage,
  deleteLabel,
  deleteConfirmMessage,
}: {
  action: (previousState: AdminFormState, formData: FormData) => Promise<AdminFormState>
  children: ReactNode
  className?: string
  footerClassName?: string
  submitClassName?: string
  submitLabel: string
  pendingLabel?: string
  confirmMessage?: string
  deleteLabel?: string
  deleteConfirmMessage?: string
}) {
  const [dirty, setDirty] = useState(false)

  async function submit(previousState: AdminFormState, formData: FormData) {
    const result = await action(previousState, formData)
    if (result.saved) setDirty(false)
    return result
  }

  const [state, formAction] = useActionState(submit, initialState)

  return (
    <form
      action={formAction}
      className={className}
      onChange={() => setDirty(true)}
      onSubmit={(event) => {
        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
        const isDelete = submitter?.value === 'delete'
        const message = isDelete ? deleteConfirmMessage : confirmMessage
        if (message && !window.confirm(message)) event.preventDefault()
      }}
    >
      {children}
      <div className={footerClassName || 'flex flex-wrap items-center gap-3 md:col-span-2'}>
        <SubmitButton label={submitLabel} pendingLabel={pendingLabel} className={submitClassName} />
        {deleteLabel ? (
          <SubmitButton
            intent="delete"
            label={deleteLabel}
            pendingLabel="Deleting…"
            className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 disabled:cursor-wait disabled:opacity-50"
          />
        ) : null}
        {state.saved && !dirty ? (
          <p role="status" aria-live="polite" className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="size-4" />
            {state.message || 'Saved'}
          </p>
        ) : null}
        {state.error ? (
          <p role="alert" aria-live="polite" className="max-w-3xl text-sm leading-6 text-red-700">
            {state.error}
          </p>
        ) : null}
      </div>
    </form>
  )
}
