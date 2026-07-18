import { NextRequest } from 'next/server'
import { assertAdminUser } from '@/lib/admin/auth'
import { listShopifyImages, uploadImageBufferToShopify } from '@/lib/admin/homepage-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const maxBytes = 10 * 1024 * 1024

export async function GET(request: NextRequest) {
  try {
    await assertAdminUser()
    const after = request.nextUrl.searchParams.get('after')
    return Response.json(await listShopifyImages(24, after))
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Could not load Shopify images' }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    await assertAdminUser()
    const formData = await request.formData()
    const file = formData.get('file')
    const alt = String(formData.get('alt') || '')
    if (!(file instanceof File)) throw new Error('Choose an image to upload')
    if (!acceptedTypes.has(file.type)) throw new Error('Use a JPEG, PNG, or WebP image')
    if (file.size > maxBytes) throw new Error('Images must be 10 MB or smaller')
    const image = await uploadImageBufferToShopify({ bytes: new Uint8Array(await file.arrayBuffer()), filename: file.name, mimeType: file.type, alt })
    return Response.json({ image })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Could not upload image' }, { status: 400 })
  }
}
