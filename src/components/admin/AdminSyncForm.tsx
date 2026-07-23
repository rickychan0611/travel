'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

type SyncResult = {
  ok: boolean
  command?: string[]
  stdout?: string
  stderr?: string
  error?: string
}

export function AdminSyncForm() {
  const t = useTranslations('admin')
  const [ids, setIds] = useState('')
  const [mode, setMode] = useState<'dry-run' | 'extract-only' | 'apply'>('dry-run')
  const [publish, setPublish] = useState('Travel Website Development')
  const [locales, setLocales] = useState('en,zh-CN,zh-TW')
  const [overwrite, setOverwrite] = useState(false)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRunning(true)
    setResult(null)
    try {
      const response = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, mode, publish, locales, overwrite }),
      })
      setResult(await response.json())
    } catch (error) {
      setResult({ ok: false, error: error instanceof Error ? error.message : String(error) })
    } finally {
      setRunning(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="block">
        <span className="text-sm font-medium text-slate-800">{t('productIds')}</span>
        <textarea
          value={ids}
          onChange={(event) => setIds(event.target.value)}
          rows={8}
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-950 outline-none focus:border-slate-950"
          placeholder={'P00002834\nP00003545'}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="text-sm font-medium text-slate-800">{t('mode')}</span>
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value as 'dry-run' | 'extract-only' | 'apply')}
            className="mt-2 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950"
          >
            <option value="dry-run">{t('dryRun')}</option>
            <option value="extract-only">{t('extractOnly')}</option>
            <option value="apply">{t('applyShopify')}</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-800">{t('locales')}</span>
          <input
            value={locales}
            onChange={(event) => setLocales(event.target.value)}
            className="mt-2 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-800">{t('publishTarget')}</span>
          <input
            value={publish}
            onChange={(event) => setPublish(event.target.value)}
            className="mt-2 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950"
            placeholder={t('publishPlaceholder')}
          />
        </label>
      </div>

      <label className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        <input
          type="checkbox"
          checked={overwrite}
          onChange={(event) => setOverwrite(event.target.checked)}
          className="mt-0.5 size-4"
        />
        <span>
          {t('overwriteWarning')}
        </span>
      </label>

      <button
        type="submit"
        disabled={running}
        className="inline-flex h-10 items-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-60"
      >
        {running ? t('runningSync') : t('runSync')}
      </button>

      {result ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className={result.ok ? 'text-sm font-medium text-emerald-700' : 'text-sm font-medium text-rose-700'}>
            {result.ok ? t('completed') : t('failed')}
          </div>
          {result.command ? <pre className="mt-3 overflow-x-auto text-xs text-slate-600">{result.command.join(' ')}</pre> : null}
          {result.error ? <pre className="mt-3 whitespace-pre-wrap text-xs text-rose-700">{result.error}</pre> : null}
          {result.stdout ? <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap text-xs text-slate-800">{result.stdout}</pre> : null}
          {result.stderr ? <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap text-xs text-amber-800">{result.stderr}</pre> : null}
        </div>
      ) : null}
    </form>
  )
}
