'use server'

import { clerkClient, currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { routing } from '@/i18n/routing'

export type ProfileActionState = {
  status: 'idle' | 'success' | 'error'
  code?: 'missingName' | 'invalidPhone' | 'saveFailed'
}

export async function updateCustomerProfile(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await currentUser()
  if (!user) return { status: 'error', code: 'saveFailed' }

  const firstName = String(formData.get('firstName') ?? '').trim().slice(0, 80)
  const lastName = String(formData.get('lastName') ?? '').trim().slice(0, 80)
  const phone = String(formData.get('phone') ?? '').trim().slice(0, 30)
  const requestedLocale = String(formData.get('locale') ?? '')
  const locale = routing.locales.includes(requestedLocale as (typeof routing.locales)[number])
    ? requestedLocale
    : routing.defaultLocale

  if (!firstName && !lastName) return { status: 'error', code: 'missingName' }
  if (phone && !/^[+()\-\s.\d]{7,30}$/.test(phone)) {
    return { status: 'error', code: 'invalidPhone' }
  }

  try {
    const client = await clerkClient()
    await client.users.updateUser(user.id, { firstName, lastName })
    await client.users.updateUserMetadata(user.id, {
      privateMetadata: { customerPhone: phone },
    })
    revalidatePath(`/${locale}/profile`)
    revalidatePath(`/${locale}/bookings`)
    return { status: 'success' }
  } catch (error) {
    console.error('[profile] Failed to update customer profile:', error)
    return { status: 'error', code: 'saveFailed' }
  }
}
