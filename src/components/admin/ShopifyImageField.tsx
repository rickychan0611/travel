'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import type { HomepageImage } from '@/lib/homepage/types'

type FileImage = HomepageImage & { status?: string }

export function ShopifyImageField({
  name = 'imageId',
  label,
  recommendedSize,
  initialImage,
}: {
  name?: string
  label: string
  recommendedSize: string
  initialImage?: HomepageImage | null
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [selected, setSelected] = useState<FileImage | null>(initialImage || null)
  const [images, setImages] = useState<FileImage[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const expected = recommendedSize.match(/(\d+)\s*×\s*(\d+)/)
  const dimensionsDiffer = Boolean(selected?.width && expected && (selected.width !== Number(expected[1]) || selected.height !== Number(expected[2])))

  async function loadImages(after?: string | null) {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/admin/shopify/images${after ? `?after=${encodeURIComponent(after)}` : ''}`)
      const result = await response.json() as { images?: FileImage[]; pageInfo?: { hasNextPage: boolean; endCursor: string | null }; error?: string }
      if (!response.ok) throw new Error(result.error || 'Could not load Shopify images')
      setImages((current) => after ? [...current, ...(result.images || [])] : (result.images || []))
      setCursor(result.pageInfo?.endCursor || null)
      setHasMore(Boolean(result.pageInfo?.hasNextPage))
      setPickerOpen(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load Shopify images')
    } finally {
      setLoading(false)
    }
  }

  async function upload(file: File) {
    setUploading(true)
    setError('')
    setMessage('')
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('alt', label)
      const response = await fetch('/api/admin/shopify/images', { method: 'POST', body })
      const result = await response.json() as { image?: FileImage; error?: string }
      if (!response.ok || !result.image) throw new Error(result.error || 'Could not upload image')
      setSelected(result.image)
      setImages((current) => [result.image!, ...current.filter((image) => image.id !== result.image!.id)])
      setPickerOpen(false)
      setMessage('Uploaded and selected. Save this item to publish it.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not upload image')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <input type="hidden" name={name} value={selected?.id || ''} />
      <div className="flex flex-wrap items-start gap-4">
        <div className="relative h-28 w-44 shrink-0 overflow-hidden rounded-md bg-slate-100">
          {selected?.url ? <Image src={selected.url} alt={selected.altText || label} fill className="object-cover" sizes="176px" /> : <span className="flex h-full items-center justify-center text-xs text-slate-500">No image selected</span>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-slate-900">{label}</div>
          <div className="mt-1 text-xs text-slate-500">Recommended: {recommendedSize} · JPEG, PNG, or WebP · maximum 10 MB</div>
          {selected?.width ? <div className="mt-1 text-xs text-slate-500">Selected: {selected.width} × {selected.height}px</div> : null}
          {dimensionsDiffer ? <div className="mt-1 text-xs font-medium text-amber-700">This image does not match the recommended dimensions and will be cropped to fit.</div> : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="cursor-pointer rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white">
              {uploading ? 'Uploading…' : 'Upload image'}
              <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file) }} />
            </label>
            <button type="button" disabled={loading} onClick={() => void loadImages()} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50">
              {loading ? 'Loading…' : 'Choose from Shopify'}
            </button>
            {message ? <span role="status" className="text-xs font-medium text-emerald-700">{message}</span> : null}
          </div>
          {error ? <p role="alert" className="mt-2 text-xs text-red-700">{error}</p> : null}
        </div>
      </div>

      {pickerOpen ? (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium">Shopify Files</span>
            <button type="button" onClick={() => setPickerOpen(false)} className="text-xs text-slate-600">Close</button>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
            {images.map((image) => (
              <button key={image.id} type="button" onClick={() => { setSelected(image); setPickerOpen(false); setMessage('Shopify image selected') }} className={`relative aspect-square overflow-hidden rounded-md border-2 ${selected?.id === image.id ? 'border-slate-950' : 'border-transparent'}`}>
                <Image src={image.url} alt={image.altText || 'Shopify image'} fill className="object-cover" sizes="120px" />
              </button>
            ))}
          </div>
          {hasMore ? <button type="button" disabled={loading} onClick={() => void loadImages(cursor)} className="mt-3 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold">{loading ? 'Loading…' : 'Load more'}</button> : null}
        </div>
      ) : null}
    </div>
  )
}
