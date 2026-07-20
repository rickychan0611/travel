'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { Save } from 'lucide-react'
import {
  type ProfileActionState,
  updateCustomerProfile,
} from '@/app/[locale]/profile/actions'

type Props = {
  locale: string
  firstName: string
  lastName: string
  email: string
  phone: string
}

export function CustomerProfileForm({ locale, firstName, lastName, email, phone }: Props) {
  const t = useTranslations('profile')
  const initialState: ProfileActionState = { status: 'idle' }
  const [state, action, pending] = useActionState(updateCustomerProfile, initialState)

  const message = state.status === 'success'
    ? t('saveSuccess')
    : state.code === 'missingName'
      ? t('missingName')
      : state.code === 'invalidPhone'
        ? t('invalidPhone')
        : state.status === 'error'
          ? t('saveError')
          : ''

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="locale" value={locale} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium text-[#333]">
          <span>{t('firstName')}</span>
          <input
            name="firstName"
            defaultValue={firstName}
            maxLength={80}
            autoComplete="given-name"
            className="h-11 w-full rounded-md border border-[#d9d9d9] px-3 outline-none transition focus:border-[#0090f2] focus:ring-2 focus:ring-[#0090f2]/15"
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium text-[#333]">
          <span>{t('lastName')}</span>
          <input
            name="lastName"
            defaultValue={lastName}
            maxLength={80}
            autoComplete="family-name"
            className="h-11 w-full rounded-md border border-[#d9d9d9] px-3 outline-none transition focus:border-[#0090f2] focus:ring-2 focus:ring-[#0090f2]/15"
          />
        </label>
      </div>

      <label className="block space-y-1.5 text-sm font-medium text-[#333]">
        <span>{t('email')}</span>
        <input
          value={email}
          readOnly
          autoComplete="email"
          className="h-11 w-full cursor-not-allowed rounded-md border border-[#e5e5e5] bg-[#f7f7f7] px-3 text-[#777]"
        />
        <span className="block text-xs font-normal text-[#888]">{t('emailHint')}</span>
      </label>

      <label className="block space-y-1.5 text-sm font-medium text-[#333]">
        <span>{t('phone')}</span>
        <input
          name="phone"
          defaultValue={phone}
          maxLength={30}
          autoComplete="tel"
          placeholder={t('phonePlaceholder')}
          className="h-11 w-full rounded-md border border-[#d9d9d9] px-3 outline-none transition focus:border-[#0090f2] focus:ring-2 focus:ring-[#0090f2]/15"
        />
        <span className="block text-xs font-normal text-[#888]">{t('phoneHint')}</span>
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#0090f2] px-6 text-sm font-bold text-white transition hover:bg-[#007fd6] disabled:cursor-wait disabled:opacity-65"
        >
          <Save className="h-4 w-4" />
          {pending ? t('saving') : t('save')}
        </button>
        {message ? (
          <p
            role="status"
            className={`text-sm ${state.status === 'success' ? 'text-[#168a50]' : 'text-[#c73535]'}`}
          >
            {message}
          </p>
        ) : null}
      </div>
    </form>
  )
}
