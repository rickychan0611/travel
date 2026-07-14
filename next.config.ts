import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  env: {
    BUILD_TIME: new Date().toISOString(),
  },
  typedRoutes: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.myshopify.com' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: '**.tripcdn.com' },
      { protocol: 'https', hostname: '**.c-ctrip.com' },
      { protocol: 'https', hostname: 'img.clerk.com' },
    ],
  },
}

export default withNextIntl(nextConfig)
