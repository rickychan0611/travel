'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

export function CacheRefreshForm({ locale }: { locale: string }) {
  const t = useTranslations('admin')
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
    setMessage(json.ok ? t('cacheQueued') : json.error || t('cacheFailed'))
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="text-sm text-slate-700">{t('optionalHandle')}</span>
        <input
          value={handle}
          onChange={(event) => setHandle(event.target.value)}
          className="mt-2 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950"
          placeholder="p00002834-dream-vacation..."
        />
      </label>
      <button className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white" disabled={pending}>
        {pending ? t('refreshing') : t('refreshCache')}
      </button>
      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
    </form>
  )
}
