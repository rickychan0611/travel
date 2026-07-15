'use client'

import { useMemo, useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'

type RawImage = string | {
  src?: string
  url?: string
  image?: string
  alt?: string
  caption?: string
  sourceUrl?: string
  shopifyMediaId?: string
}

type ImageRow = {
  id: string
  src: string
  caption: string
  sourceUrl: string
  shopifyMediaId: string
}

function parseImages(value: string): ImageRow[] {
  try {
    const parsed = JSON.parse(value) as RawImage[]
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item, index) => {
      if (typeof item === 'string') {
        const src = item.trim()
        return src ? [{ id: `image-${index}`, src, caption: '', sourceUrl: src, shopifyMediaId: '' }] : []
      }

      const src = (item.src || item.url || item.image || '').trim()
      if (!src) return []
      return [{
        id: `image-${index}`,
        src,
        caption: (item.caption || item.alt || '').trim(),
        sourceUrl: (item.sourceUrl || src).trim(),
        shopifyMediaId: (item.shopifyMediaId || '').trim(),
      }]
    })
  } catch {
    return []
  }
}

function buildImages(rows: ImageRow[]) {
  return rows
    .map((row) => ({
      src: row.src.trim(),
      alt: row.caption.trim(),
      caption: row.caption.trim(),
      sourceUrl: row.sourceUrl.trim() || row.src.trim(),
      shopifyMediaId: row.shopifyMediaId.trim(),
    }))
    .filter((row) => row.src)
}

export function ItineraryImagesEditor({ initialImagesJson }: { initialImagesJson?: string }) {
  const [rows, setRows] = useState<ImageRow[]>(() => parseImages(initialImagesJson || '[]'))
  const imagesJson = useMemo(() => JSON.stringify(buildImages(rows)), [rows])

  function addImage() {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `image-${rows.length + 1}`
    setRows((current) => [...current, { id, src: '', caption: '', sourceUrl: '', shopifyMediaId: '' }])
  }

  function updateRow(id: string, patch: Partial<ImageRow>) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row))
  }

  function deleteImage(id: string) {
    setRows((current) => current.filter((row) => row.id !== id))
  }

  return (
    <div className="md:col-span-3">
      <input type="hidden" name="imagesJson" value={imagesJson} />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-800">Itinerary images</p>
          <p className="text-xs text-slate-500">Images are uploaded to Shopify on save when they are not already Shopify-hosted.</p>
        </div>
        <button
          type="button"
          onClick={addImage}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          <ImagePlus className="size-4" />
          Add image
        </button>
      </div>

      {rows.length > 0 ? (
        <div className="mt-3 space-y-3">
          {rows.map((row, index) => (
            <div key={row.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="grid gap-3 md:grid-cols-[160px_1fr]">
                <div
                  className="aspect-video overflow-hidden rounded-lg border border-slate-200 bg-slate-100 bg-cover bg-center"
                  style={row.src ? { backgroundImage: `url("${row.src.replace(/"/g, '%22')}")` } : undefined}
                  aria-label={`Itinerary image ${index + 1} preview`}
                />
                <div className="grid gap-3">
                  <label className="block">
                    <span className="text-sm text-slate-700">Image URL</span>
                    <input
                      value={row.src}
                      onChange={(event) => updateRow(row.id, {
                        src: event.target.value,
                        sourceUrl: event.target.value,
                        shopifyMediaId: '',
                      })}
                      placeholder="https://..."
                      className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-slate-700">Caption</span>
                    <input
                      value={row.caption}
                      onChange={(event) => updateRow(row.id, { caption: event.target.value })}
                      placeholder="Short caption shown under this image"
                      className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950"
                    />
                  </label>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                      {row.shopifyMediaId ? 'Shopify image saved' : 'Will upload to Shopify when saved'}
                    </p>
                    <button
                      type="button"
                      onClick={() => deleteImage(row.id)}
                      className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
          No itinerary images yet.
        </div>
      )}
    </div>
  )
}
