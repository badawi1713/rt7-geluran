import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  type ApiResponse,
  type Id,
  type ListParams,
  type Paged,
  toArray,
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

export type PaymentStatus = 'sudah' | 'belum'

/** A member in the paid/unpaid breakdown of one report row. */
export interface ReportStatusMember {
  id: Id
  name?: string
  keterangan?: string
}

export const reportKeys = {
  all: ['arisan-reports'] as const,
  list: (params: ListParams) => [...reportKeys.all, 'list', params] as const,
  status: (reportId: Id, status: PaymentStatus) => [...reportKeys.all, 'status', reportId, status] as const,
}

export const reportsApi = {
  list: async (params: ListParams) => {
    const res = await api.get<ApiResponse<Paged<ArisanReport>>>('/v1/api/arisan-report', {
      params: toQueryParams(params),
    })
    return toPagedResult(res.data)
  },
  /** The server answers with a bare array. */
  statusList: async (reportId: Id, status: PaymentStatus) => {
    const res = await api.get<unknown>(`/v1/api/arisan-report/${status}-bayar/${reportId}`)
    return toArray<ReportStatusMember>(res.data)
  },
}

export function useArisanReports(params: ListParams) {
  return useQuery({
    queryKey: reportKeys.list(params),
    queryFn: () => reportsApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useReportStatus(target: { reportId: Id; status: PaymentStatus } | null) {
  return useQuery({
    queryKey: reportKeys.status(target?.reportId ?? '', target?.status ?? 'sudah'),
    queryFn: () => reportsApi.statusList(target!.reportId, target!.status),
    enabled: target !== null,
  })
}
