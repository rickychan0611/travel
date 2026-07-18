import { describe, expect, it } from 'vitest'
import { localizedHomepageTitle, normalizeShopifyProductId, parseProductIds } from '../types'

describe('homepage content helpers', () => {
  it('normalizes numeric and full Shopify product IDs', () => {
    expect(normalizeShopifyProductId('123')).toBe('gid://shopify/Product/123')
    expect(normalizeShopifyProductId('gid://shopify/Product/456')).toBe('gid://shopify/Product/456')
    expect(normalizeShopifyProductId('product-123')).toBe('')
  })

  it('parses, normalizes, orders, and deduplicates product IDs', () => {
    expect(parseProductIds('["123","gid://shopify/Product/456","123"]')).toEqual([
      'gid://shopify/Product/123',
      'gid://shopify/Product/456',
    ])
  })

  it('uses locale, English, then Simplified Chinese title fallback', () => {
    const fields = { title_en: 'English', title_zh_cn: '简体', title_zh_tw: '' }
    expect(localizedHomepageTitle(fields, 'zh-CN')).toBe('简体')
    expect(localizedHomepageTitle(fields, 'zh-TW')).toBe('English')
    expect(localizedHomepageTitle({ title_en: '', title_zh_cn: '简体' }, 'zh-TW')).toBe('简体')
  })
})
