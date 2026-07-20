const DEPARTURE_HEADING =
  /<h([1-6])\b[^>]*>\s*(?:Departure\s*Dates?|出发日期|出發日期|出发班期|出發班期)\s*<\/h\1>/i
const NEXT_HEADING = /<h[1-6]\b/i

export function extractDepartureSectionHtml(html: string) {
  const heading = DEPARTURE_HEADING.exec(html)
  if (!heading) return ''

  const contentStart = heading.index + heading[0].length
  const remainingHtml = html.slice(contentStart)
  const nextHeading = NEXT_HEADING.exec(remainingHtml)

  return (nextHeading ? remainingHtml.slice(0, nextHeading.index) : remainingHtml).trim()
}
