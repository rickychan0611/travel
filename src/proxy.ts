import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const handleI18n = createIntlMiddleware(routing)
const isProtectedRoute = createRouteMatcher([
  '/(.+)/agent(.*)',
  '/agent(.*)',
  '/(.+)/bookings(.*)',
  '/bookings(.*)',
])

export const proxy = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
  return handleI18n(req)
})

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
