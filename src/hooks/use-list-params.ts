import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type { ListParams } from '@/lib/types'

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
export const DEFAULT_PAGE_SIZE = 100

/** Page, page size and search kept in the URL (`?page=2&size=25&q=budi`), page is 1-based there. */
export function useListParams() {
  const [searchParams, setSearchParams] = useSearchParams()

  const params = useMemo<ListParams>(() => {
    const page = Math.max(1, Number(searchParams.get('page')) || 1) - 1
    const size = Number(searchParams.get('size'))
    return {
      page,
      size: PAGE_SIZE_OPTIONS.includes(size) ? size : DEFAULT_PAGE_SIZE,
      search: searchParams.get('q') ?? '',
    }
  }, [searchParams])

  const update = useCallback(
    (next: Partial<ListParams>) => {
      setSearchParams((current) => {
        const merged = { ...params, ...next }
        const out = new URLSearchParams(current)
        const setOrDelete = (key: string, value: string, fallback: string) =>
          value === fallback ? out.delete(key) : out.set(key, value)
        setOrDelete('page', String(merged.page + 1), '1')
        setOrDelete('size', String(merged.size), String(DEFAULT_PAGE_SIZE))
        setOrDelete('q', merged.search, '')
        return out
      })
    },
    [params, setSearchParams],
  )

  return [params, update] as const
}
