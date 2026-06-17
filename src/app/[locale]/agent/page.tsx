import { Building2 } from 'lucide-react'

export default function AgentPortalPage() {
  return (
    <div className="container mx-auto flex flex-col items-center justify-center px-4 py-24 text-center">
      <div className="p-4 rounded-full bg-muted mb-6">
        <Building2 className="size-8 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-semibold mb-2">Agent Portal</h1>
      <p className="text-sm text-muted-foreground">
        The agent portal is under development. Please reach out to your account manager for wholesale pricing and booking tools.
      </p>
    </div>
  )
}
