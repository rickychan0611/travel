import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import { localeFromPathname, loginPath } from './lib/auth/redirect'
import { routing } from './i18n/routing'

const handleI18n = createIntlMiddleware(routing)
const isProtectedRoute = createRouteMatcher([
  '/(.+)/agent(.*)',
  '/agent(.*)',
  '/(.+)/bookings(.*)',
  '/bookings(.*)',
  '/(.+)/profile(.*)',
  '/profile(.*)',
  '/(.+)/admin(.*)',
  '/admin(.*)',
])

export const proxy = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const { userId } = await auth()
    if (!userId) {
      const locale = localeFromPathname(req.nextUrl.pathname)
      const returnPath = `${req.nextUrl.pathname}${req.nextUrl.search}`
      return NextResponse.redirect(new URL(loginPath(locale, returnPath), req.url))
    }
  }
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  return handleI18n(req)
})

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
    '/api/admin/:path*',
  ],
}
