export type HomepageOrderDirection = 'up' | 'down'

export type HomepageOrderedItem = {
  id: string
  position: number
}

export function sortHomepageItems<T extends HomepageOrderedItem>(items: T[]) {
  return [...items].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
}

export function moveHomepageItem<T extends HomepageOrderedItem>(
  items: T[],
  id: string,
  direction: HomepageOrderDirection,
) {
  const ordered = sortHomepageItems(items)
  const currentIndex = ordered.findIndex((item) => item.id === id)
  if (currentIndex < 0) return ordered

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
  if (targetIndex < 0 || targetIndex >= ordered.length) return ordered

  const current = ordered[currentIndex]
  ordered[currentIndex] = ordered[targetIndex]
  ordered[targetIndex] = current
  return ordered
}
