import { shopifyAdminClient } from '@/lib/shopify/admin-client'

export type StorefrontSettings = {
  ssrEnabled: boolean
}

export const STOREFRONT_SETTINGS_CACHE_TAG = 'shopify-storefront-settings'
const SETTINGS_NAMESPACE = 'toursbms'
const SSR_ENABLED_KEY = 'storefront_ssr_enabled'

const defaults: StorefrontSettings = {
  ssrEnabled: process.env.NODE_ENV === 'development',
}

const STOREFRONT_SETTINGS_QUERY = `#graphql
  query StorefrontSettings {
    shop {
      id
      setting: metafield(namespace: "${SETTINGS_NAMESPACE}", key: "${SSR_ENABLED_KEY}") {
        value
      }
    }
  }
`

const STOREFRONT_SETTINGS_MUTATION = `#graphql
  mutation SaveStorefrontSettings($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { id value }
      userErrors { field message code }
    }
  }
`

type SettingsQueryResponse = {
  shop?: {
    id: string
    setting?: { value: string } | null
  }
}

type SettingsMutationResponse = {
  metafieldsSet?: {
    metafields?: Array<{ id: string; value: string }>
    userErrors?: Array<{ field?: string[]; message: string; code?: string }>
  }
}

export async function getStorefrontSettings(): Promise<StorefrontSettings> {
  try {
    const { data, errors } = await shopifyAdminClient.request<SettingsQueryResponse>(
      STOREFRONT_SETTINGS_QUERY,
      {
        cache: 'force-cache',
        next: { revalidate: 60, tags: [STOREFRONT_SETTINGS_CACHE_TAG] },
      },
    )
    if (errors || !data?.shop) return defaults

    const value = data.shop.setting?.value
    return {
      ssrEnabled: value === 'true' ? true : value === 'false' ? false : defaults.ssrEnabled,
    }
  } catch {
    return defaults
  }
}

export async function isStorefrontSsrEnabled() {
  return (await getStorefrontSettings()).ssrEnabled
}

export async function setStorefrontSsrEnabled(ssrEnabled: boolean) {
  const { data: shopData, errors: shopErrors } =
    await shopifyAdminClient.request<SettingsQueryResponse>(STOREFRONT_SETTINGS_QUERY)
  if (shopErrors || !shopData?.shop?.id) {
    throw new Error('Could not load the Shopify shop for this setting.')
  }

  const { data, errors } = await shopifyAdminClient.request<SettingsMutationResponse>(
    STOREFRONT_SETTINGS_MUTATION,
    {
      variables: {
        metafields: [{
          ownerId: shopData.shop.id,
          namespace: SETTINGS_NAMESPACE,
          key: SSR_ENABLED_KEY,
          type: 'boolean',
          value: String(ssrEnabled),
        }],
      },
      cache: 'no-store',
    },
  )

  if (errors) throw new Error('Shopify rejected the storefront setting.')
  const userErrors = data?.metafieldsSet?.userErrors ?? []
  if (userErrors.length > 0) throw new Error(userErrors[0].message)
  if (!data?.metafieldsSet?.metafields?.[0]) {
    throw new Error('Shopify did not save the storefront setting.')
  }

  return { ssrEnabled }
}
