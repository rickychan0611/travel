'use client'

import { useState } from 'react'

export function CacheRefreshForm({ locale }: { locale: string }) {
  const [handle, setHandle] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setMessage('')
    const response = await fetch('/api/admin/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale, handle }),
    })
    const json = await response.json()
    setPending(false)
    setMessage(json.ok ? 'Cache refresh queued.' : json.error || 'Cache refresh failed.')
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="text-sm text-slate-700">Optional product handle</span>
        <input
          value={handle}
          onChange={(event) => setHandle(event.target.value)}
          className="mt-2 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950"
          placeholder="p00002834-dream-vacation..."
        />
      </label>
      <button className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white" disabled={pending}>
        {pending ? 'Refreshing...' : 'Refresh storefront cache'}
      </button>
      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
    </form>
  )
}
