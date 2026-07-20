import { describe, expect, it } from 'vitest'
import { enrichProductLocations, locationReviewEntry } from './location-enrichment.mjs'

describe('location enrichment', () => {
  it('finds multilingual cities and their countries', () => {
    const json = enrichProductLocations({ product: { productCode: 'P1', title: '温哥华、班芙、卡尔加里之旅', destinations: [] } })
    expect(json.product.location.countries).toEqual(['Canada'])
    expect(json.product.location.cities).toEqual(['Vancouver', 'Calgary', 'Banff'])
    expect(json.product.location.confidence).toBe('high')
  })

  it('keeps all countries and cities for multi-country tours', () => {
    const json = enrichProductLocations({ product: { title: 'Tokyo, Paris and Madrid', destinations: [] } })
    expect(json.product.location.countries).toEqual(['Japan', 'France', 'Spain'])
    expect(json.product.location.cities).toEqual(['Tokyo', 'Paris', 'Madrid'])
    expect(json.product.location.isMultiCountry).toBe(true)
    expect(json.product.location.needsReview).toBe(false)
  })

  it('gives explicit ToursBMS values precedence', () => {
    const json = enrichProductLocations({ product: { title: 'Paris extension', destinations: [{ country: 'Canada', cityName: 'Montreal' }] } })
    expect(json.product.location.primaryCountry).toBe('Canada')
    expect(json.product.location.primaryCity).toBe('Montreal')
    expect(json.product.location.countries).toEqual(expect.arrayContaining(['Canada', 'France']))
  })

  it('flags unresolved locations without inventing values', () => {
    const json = enrichProductLocations({ product: { productCode: 'P2', title: 'Mystery tour', destinations: [] } })
    expect(json.product.location.primaryCountry).toBe('')
    expect(json.product.location.primaryCity).toBe('')
    expect(locationReviewEntry(json)?.reasons).toEqual(['country-unresolved', 'city-unresolved'])
  })
})
