import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="p-4 rounded-full bg-muted mb-6">
        <MapPin className="size-8 text-muted-foreground" />
      </div>
      <h1 className="text-5xl font-bold mb-2">404</h1>
      <p className="text-lg font-medium mb-1">Page not found</p>
      <p className="text-sm text-muted-foreground mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link href="/">
        <Button>Back to Home</Button>
      </Link>
    </div>
  )
}
