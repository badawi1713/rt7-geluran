import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  type ApiResponse,
  type Id,
  type ListParams,
  type Paged,
  toPagedResult,
  toQueryParams,
} from '@/lib/types'

export interface ArisanReport {
  id: Id
  tanggal?: string
  pertemuan_ke?: number | string
  dapat_1?: string
  dapat_2?: string
  jumlah_lunas?: number
  jumlah_belum_lunas?: number
  jumlah_anggota?: number
  nominal_lunas?: number
  nominal_belum_lunas?: number
  jumlah_nominal?: number
}

export const reportKeys = {
  all: ['arisan-reports'] as const,
  list: (params: ListParams) => [...reportKeys.all, 'list', params] as const,
}

export const reportsApi = {
  list: async (params: ListParams) => {
    const res = await api.get<ApiResponse<Paged<ArisanReport>>>('/v1/api/arisan-report', {
      params: toQueryParams(params),
    })
    return toPagedResult(res.data)
  },
}

export function useArisanReports(params: ListParams) {
  return useQuery({
    queryKey: reportKeys.list(params),
    queryFn: () => reportsApi.list(params),
    placeholderData: keepPreviousData,
  })
}
