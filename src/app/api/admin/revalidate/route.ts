import { NextResponse } from 'next/server'
import { assertAdminUser } from '@/lib/admin/auth'
import { revalidateStorefrontCaches } from '@/lib/admin/revalidate'

export async function POST(request: Request) {
  try {
    await assertAdminUser()
    const body = await request.json().catch(() => ({}))
    revalidateStorefrontCaches(String(body.locale || ''), String(body.handle || '').trim() || undefined)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 401 })
  }
}
