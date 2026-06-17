'use client'
import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="container mx-auto flex flex-col items-center justify-center px-4 py-24 text-center">
      <div className="p-4 rounded-full bg-destructive/10 mb-6">
        <AlertCircle className="size-8 text-destructive" />
      </div>
      <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
      <p className="text-sm text-muted-foreground mb-8">
        An unexpected error occurred. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
