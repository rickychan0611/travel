'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

export function StorefrontRenderingToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const t = useTranslations('admin')
  const [enabled, setEnabled] = useState(initialEnabled)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function change(nextEnabled: boolean) {
    const previous = enabled
    setEnabled(nextEnabled)
    setPending(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch('/api/admin/settings/rendering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssrEnabled: nextEnabled }),
      })
      const result = await response.json() as { ok?: boolean; error?: string }
      if (!response.ok || !result.ok) throw new Error(result.error || t('settingSaveFailed'))
      setMessage(nextEnabled ? t('ssrOn') : t('ssrOff'))
    } catch (caught) {
      setEnabled(previous)
      setError(caught instanceof Error ? caught.message : t('settingSaveFailed'))
    } finally {
      setPending(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div>
          <div className="font-medium text-slate-950">{t('serverRendering')}</div>
          <p className="mt-1 text-sm text-slate-600">
            {t('serverRenderingDesc')}
          </p>
        </div>
        <label className="inline-flex shrink-0 cursor-pointer items-center gap-3">
          <span className="text-sm font-semibold text-slate-700">{enabled ? t('on') : t('off')}</span>
          <input
            type="checkbox"
            checked={enabled}
            disabled={pending}
            onChange={(event) => void change(event.target.checked)}
            className="peer sr-only"
          />
          <span className="relative h-7 w-12 rounded-full bg-slate-300 transition peer-checked:bg-slate-950 peer-disabled:opacity-50 after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5" />
        </label>
      </div>
      {pending ? <p className="mt-3 text-sm text-slate-600">{t('saving')}</p> : null}
      {message ? <p role="status" className="mt-3 text-sm font-medium text-emerald-700">{message}</p> : null}
      {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}
    </div>
  )
}
