import { currentUser } from '@clerk/nextjs/server'

export type AdminRole = 'owner' | 'staff'

// Temporary local/admin-build bypass while Clerk access is unavailable.
// Set this back to false and restore the admin proxy matcher before production.
const ADMIN_AUTH_DISABLED = true

export type AdminUser = {
  id: string
  role: AdminRole
  isOwner: boolean
  displayName: string
  email: string
}

function roleFromMetadata(value: unknown): AdminRole | null {
  return value === 'owner' || value === 'staff' ? value : null
}

export async function getAdminUser(): Promise<AdminUser | null> {
  if (ADMIN_AUTH_DISABLED) {
    return {
      id: 'local-admin',
      role: 'owner',
      isOwner: true,
      displayName: 'Local Admin',
      email: 'local-admin@example.com',
    }
  }

  const user = await currentUser()
  const role = roleFromMetadata(user?.publicMetadata?.role)
  if (!user || !role) return null

  const email = user.emailAddresses[0]?.emailAddress ?? ''
  return {
    id: user.id,
    role,
    isOwner: role === 'owner',
    displayName: user.firstName || email.split('@')[0] || 'Admin',
    email,
  }
}

export async function assertAdminUser() {
  const user = await getAdminUser()
  if (!user) throw new Error('Unauthorized admin request')
  return user
}

export async function assertOwnerUser() {
  const user = await assertAdminUser()
  if (!user.isOwner) throw new Error('Owner role required')
  return user
}
