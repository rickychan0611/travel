import { describe, expect, it } from 'vitest'

import { extractDepartureSectionHtml } from '../rich-content'

describe('extractDepartureSectionHtml', () => {
  it('extracts departure content without adjacent sections', () => {
    const html = [
      '<h2>Highlights</h2><ul><li>Great tour</li></ul>',
      '<h2>Departure Date</h2><p>June: 06/01, 06/15</p><p>Minimum two guests.</p>',
      '<h2>Cost Includes</h2><p>Hotel</p>',
    ].join('')

    expect(extractDepartureSectionHtml(html)).toBe(
      '<p>June: 06/01, 06/15</p><p>Minimum two guests.</p>',
    )
  })

  it('recognizes localized departure headings', () => {
    expect(extractDepartureSectionHtml('<h3>出发日期</h3><p>6月：06/01</p>')).toBe(
      '<p>6月：06/01</p>',
    )
  })

  it('returns an empty string when there is no departure heading', () => {
    expect(extractDepartureSectionHtml('<h2>Highlights</h2><p>Great tour</p>')).toBe('')
  })
})
