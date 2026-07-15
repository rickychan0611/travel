import { execFile } from 'child_process'
import { promisify } from 'util'
import { NextResponse } from 'next/server'
import { assertOwnerUser } from '@/lib/admin/auth'
import { revalidateStorefrontCaches } from '@/lib/admin/revalidate'

const execFileAsync = promisify(execFile)

function parseIds(input: unknown) {
  return String(input ?? '')
    .split(/[\s,]+/)
    .map((item) => item.trim().toUpperCase())
    .filter((item) => /^P\d{8}$/.test(item))
}

export async function POST(request: Request) {
  try {
    await assertOwnerUser()
    const body = await request.json()
    const ids = [...new Set(parseIds(body.ids))]
    if (ids.length === 0) return NextResponse.json({ ok: false, error: 'No valid ToursBMS product IDs provided.' }, { status: 400 })

    const mode = body.mode === 'apply' || body.mode === 'extract-only' ? body.mode : 'dry-run'
    const locales = String(body.locales || 'en,zh-CN,zh-TW')
    const publish = String(body.publish || '').trim()
    const args = [
      'scripts/sync-toursbms-shopify.mjs',
      '--ids',
      ids.join(','),
      '--locales',
      locales,
      '--status',
      mode === 'apply' ? 'ACTIVE' : 'DRAFT',
    ]

    if (mode === 'apply') {
      args.push('--apply')
      if (body.overwrite === true) args.push('--overwrite-from-toursbms')
      if (publish) args.push('--publish', publish)
    } else {
      args.push('--dry-run')
      if (mode === 'extract-only') args.push('--skip-upload')
    }

    const result = await execFileAsync(process.execPath, args, {
      cwd: process.cwd(),
      timeout: 30 * 60 * 1000,
      maxBuffer: 1024 * 1024 * 20,
    })

    if (mode === 'apply') revalidateStorefrontCaches()

    return NextResponse.json({
      ok: true,
      command: [process.execPath, ...args],
      stdout: result.stdout,
      stderr: result.stderr,
    })
  } catch (error) {
    const commandError = error as { stdout?: string; stderr?: string; message?: string }
    return NextResponse.json({
      ok: false,
      error: commandError.message ?? String(error),
      stdout: commandError.stdout,
      stderr: commandError.stderr,
    }, { status: 500 })
  }
}
