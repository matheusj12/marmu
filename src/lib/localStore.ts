/**
 * localStorage-based persistence layer for local dev (no Supabase).
 * API mirrors the Supabase client patterns used in services.
 */

const VERSION = 'v1'

function key(collection: string) {
  return `marmu:${VERSION}:${collection}`
}

export function lsGet<T>(collection: string): T[] {
  try {
    const raw = localStorage.getItem(key(collection))
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

export function lsSet<T>(collection: string, items: T[]): void {
  localStorage.setItem(key(collection), JSON.stringify(items))
}

export function lsInsert<T extends { id?: string; created_at?: string }>(
  collection: string,
  item: Omit<T, 'id' | 'created_at'>,
): T {
  const items = lsGet<T>(collection)
  const newItem = {
    ...item,
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    created_at: new Date().toISOString(),
  } as T
  lsSet(collection, [newItem, ...items])
  return newItem
}

export function lsUpdate<T extends { id: string }>(
  collection: string,
  id: string,
  patch: Partial<T>,
): T | null {
  const items = lsGet<T>(collection)
  let updated: T | null = null
  const next = items.map((item) => {
    if (item.id === id) {
      updated = { ...item, ...patch }
      return updated
    }
    return item
  })
  if (updated) lsSet(collection, next)
  return updated
}

export function lsDelete(collection: string, id: string): void {
  const items = lsGet<{ id: string }>(collection)
  lsSet(collection, items.filter((item) => item.id !== id))
}

export function lsFindById<T extends { id: string }>(
  collection: string,
  id: string,
): T | null {
  return lsGet<T>(collection).find((item) => item.id === id) ?? null
}

export function lsClear(collection: string): void {
  localStorage.removeItem(key(collection))
}
