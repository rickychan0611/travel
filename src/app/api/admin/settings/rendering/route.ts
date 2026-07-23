import { revalidatePath, revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import { assertOwnerUser } from '@/lib/admin/auth'
import { revalidateStorefrontCaches } from '@/lib/admin/revalidate'
import {
  setStorefrontSsrEnabled,
  STOREFRONT_SETTINGS_CACHE_TAG,
} from '@/lib/admin/storefront-settings'

export async function POST(request: Request) {
  try {
    await assertOwnerUser()
    const body = await request.json().catch(() => ({})) as { ssrEnabled?: unknown }
    if (typeof body.ssrEnabled !== 'boolean') {
      return NextResponse.json({ ok: false, error: 'SSR setting must be on or off.' }, { status: 400 })
    }

    const settings = await setStorefrontSsrEnabled(body.ssrEnabled)
    revalidateTag(STOREFRONT_SETTINGS_CACHE_TAG, { expire: 0 })
    revalidateStorefrontCaches()
    revalidatePath('/', 'layout')
    return NextResponse.json({ ok: true, ...settings })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'The rendering setting could not be saved.',
    }, { status: 401 })
  }
}
