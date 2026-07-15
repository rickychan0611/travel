'use server'

import { redirect } from 'next/navigation'
import { assertAdminUser } from '@/lib/admin/auth'
import { createAdminProduct } from '@/lib/admin/shopify-admin'

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

export async function createProductAction(formData: FormData) {
  await assertAdminUser()
  const locale = text(formData, 'locale')
  const title = text(formData, 'title')
  const productCode = text(formData, 'productCode').toUpperCase()
  if (!title) throw new Error('Title is required')
  const handle = slugify(text(formData, 'handle') || `${productCode} ${title}`)
  const product = await createAdminProduct({
    title,
    handle,
    productCode,
    productType: text(formData, 'productType') || 'Tour',
  })
  redirect(`/${locale}/admin/products/${product?.handle || handle}`)
}
