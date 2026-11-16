export type Id = number | string

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface Paged<T> {
  content: T[]
  totalElements: number
}

export interface ListParams {
  page: number
  size: number
  search: string
}

/** Option shape returned by the `/list` endpoints used in selects. */
export interface NamedOption {
  id: Id
  name: string
}

export interface PagedResult<T> {
  rows: T[]
  total: number
}

/** `/list` endpoints return a bare array; also accept `{ data: [...] }` and treat anything else as empty. */
export function toArray<T>(body: unknown): T[] {
  if (Array.isArray(body)) return body as T[]
  if (body && typeof body === 'object' && Array.isArray((body as { data?: unknown }).data)) {
    return (body as { data: T[] }).data
  }
  return []
}

export function toQueryParams({ page, size, search }: ListParams) {
  return { pageNo: page, pageSize: size, sort: 'desc', sortBy: 'id', nama: search }
}

export function toPagedResult<T>(res: ApiResponse<Paged<T>> | undefined): PagedResult<T> {
  const content = res?.data?.content
  return { rows: Array.isArray(content) ? content : [], total: Number(res?.data?.totalElements) || 0 }
}
