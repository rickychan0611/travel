import { Lock } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="container mx-auto flex flex-col items-center justify-center px-4 py-24 text-center">
      <div className="p-4 rounded-full bg-muted mb-6">
        <Lock className="size-8 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-semibold mb-2">Member Login</h1>
      <p className="text-sm text-muted-foreground">
        Online account login is coming soon. Please contact your travel consultant to manage bookings.
      </p>
    </div>
  )
}
