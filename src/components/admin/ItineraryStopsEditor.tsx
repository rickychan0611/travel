'use client'

import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

type RawStop = {
  type?: string
  label?: string
  place?: string
  name?: string
  vehicle?: string
  vehicleCode?: string
}

type StopRow = {
  id: string
  name: string
  transportToNext: string
}

const transportOptions = [
  '',
  'Vehicle',
  'Bus',
  'Train',
  'Airplane',
  'Cruise',
  'Ferry',
  'Ship',
  'Walk',
]

const vehicleCodeLabels: Record<string, string> = {
  '0': 'Others',
  '1': 'Vehicle',
  '2': 'Train',
  '3': 'Airplane',
  '4': 'Cruise',
  '5': 'Bus',
}

function vehicleLabel(stop: RawStop) {
  const raw = (stop.vehicle || stop.vehicleCode || '').trim()
  return vehicleCodeLabels[raw] || raw
}

function parseStops(value: string): StopRow[] {
  try {
    const parsed = JSON.parse(value) as RawStop[]
    if (!Array.isArray(parsed)) return emptyRows()

    const rows: StopRow[] = []
    let lastWasTransfer = false
    for (const item of parsed) {
      if (!item) continue
      const name = (item.label || item.place || item.name || '').trim()
      if (item.type === 'transfer') {
        if (rows.length > 0) {
          rows[rows.length - 1] = {
            ...rows[rows.length - 1],
            transportToNext: vehicleLabel(item),
          }
        }
        if (name) rows.push({ id: `stop-${rows.length}`, name, transportToNext: '' })
        lastWasTransfer = true
        continue
      }

      if (name && (!lastWasTransfer || rows[rows.length - 1]?.name !== name)) {
        rows.push({ id: `stop-${rows.length}`, name, transportToNext: '' })
      }
      lastWasTransfer = false
    }

    return rows.length > 0 ? rows : emptyRows()
  } catch {
    return emptyRows()
  }
}

function emptyRows(): StopRow[] {
  return [{ id: 'stop-0', name: '', transportToNext: '' }]
}

function buildStops(rows: StopRow[]) {
  const cleaned = rows
    .map((row) => ({ name: row.name.trim(), transportToNext: row.transportToNext.trim() }))
    .filter((row) => row.name)

  if (cleaned.length === 0) return []

  return cleaned.reduce<Array<Record<string, string>>>((stops, row, index) => {
    if (index === 0) {
      stops.push({ type: 'place', label: row.name })
      return stops
    }

    const previous = cleaned[index - 1]
    stops.push({
      type: 'transfer',
      label: row.name,
      place: row.name,
      ...(previous.transportToNext ? { vehicle: previous.transportToNext } : {}),
    })
    return stops
  }, [])
}

function stopTitle(rows: StopRow[]) {
  return rows.map((row) => row.name.trim()).filter(Boolean).join(' > ')
}

export function ItineraryStopsEditor({ initialStopsJson }: { initialStopsJson?: string }) {
  const [rows, setRows] = useState<StopRow[]>(() => parseStops(initialStopsJson || '[]'))
  const stopsJson = useMemo(() => JSON.stringify(buildStops(rows)), [rows])
  const title = useMemo(() => stopTitle(rows), [rows])

  function updateRow(id: string, patch: Partial<StopRow>) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row))
  }

  function addStop() {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `stop-${rows.length + 1}`
    setRows((current) => [...current, { id, name: '', transportToNext: '' }])
  }

  function deleteStop(id: string) {
    setRows((current) => {
      const next = current.filter((row) => row.id !== id)
      return next.length > 0 ? next : emptyRows()
    })
  }

  return (
    <div className="md:col-span-3">
      <input type="hidden" name="stopsJson" value={stopsJson} />
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="route" value={title} />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-800">Stops</p>
          <p className="text-xs text-slate-500">These stops become the day title on the storefront.</p>
        </div>
        <button
          type="button"
          onClick={addStop}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          <Plus className="size-4" />
          Add stop
        </button>
      </div>
      <div className="mt-3 space-y-3">
        {rows.map((row, index) => {
          const isLast = index === rows.length - 1
          const optionValues = transportOptions.includes(row.transportToNext)
            ? transportOptions
            : [...transportOptions, row.transportToNext]

          return (
            <div key={row.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex flex-wrap items-end gap-3">
                <label className="min-w-[220px] flex-1">
                  <span className="text-sm text-slate-700">Stop {index + 1} name</span>
                  <input
                    value={row.name}
                    onChange={(event) => updateRow(row.id, { name: event.target.value })}
                    placeholder="Cancun"
                    className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950"
                  />
                </label>
                {!isLast ? (
                  <label className="min-w-[190px] flex-1">
                    <span className="text-sm text-slate-700">Transportation to next stop</span>
                    <select
                      value={row.transportToNext}
                      onChange={(event) => updateRow(row.id, { transportToNext: event.target.value })}
                      className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950"
                    >
                      {optionValues.map((option) => (
                        <option key={option || 'none'} value={option}>
                          {option || 'Select type'}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <button
                  type="button"
                  onClick={() => deleteStop(row.id)}
                  className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="size-4" />
                  Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>
      {title ? (
        <p className="mt-2 text-xs text-slate-500">
          Storefront title: <span className="font-medium text-slate-700">{title}</span>
        </p>
      ) : null}
    </div>
  )
}
