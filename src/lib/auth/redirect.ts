import { routing } from '@/i18n/routing'

export function localeFromPathname(pathname: string) {
  const segment = pathname.split('/').filter(Boolean)[0]
  if (segment && routing.locales.includes(segment as (typeof routing.locales)[number])) {
    return segment
  }
  return routing.defaultLocale
}

/** Only allow same-origin relative paths (blocks open redirects). */
export function safeRedirectPath(value: string | string[] | undefined, fallback: string) {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) {
    return fallback
  }
  return raw
}

export function loginPath(locale: string, returnPath?: string) {
  const path = `/${locale}/login`
  if (!returnPath) return path
  const redirect = safeRedirectPath(returnPath, `/${locale}`)
  return `${path}?redirect_url=${encodeURIComponent(redirect)}`
}
