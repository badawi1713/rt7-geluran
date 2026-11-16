import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

export interface ArisanMeeting {
  id: Id
  lokasi?: string
  /** DD-MM-YYYY */
  tanggal?: string
  pertemuan_ke?: number | string
  anggota_dapat_1?: string
  anggota_dapat_1_id?: Id
  anggota_dapat_2?: string
  anggota_dapat_2_id?: Id
  keterangan?: string
  deleted?: boolean
  last_updated?: string
  /** This endpoint sends camelCase for this field. */
  lastUpdated?: string | null
}

export interface MeetingOption {
  id: Id
  /** Full label from the server, e.g. "Pertemuan Ke 3 Lokasi Bapak Widodo". */
  pertemuan_ke: string
}

export interface CreateMeetingPayload {
  lokasi: string
  /** YYYY-MM-DD */
  tanggal: string
  pertemuan_ke: number
  keterangan: string
}

export interface UpdateMeetingPayload extends CreateMeetingPayload {
  id: Id
  /** Empty string when nobody has been drawn yet. */
  dapat1: Id | ''
  dapat2: Id | ''
}

export const arisanMeetingKeys = {
  all: ['arisan-meetings'] as const,
  list: (params: ListParams) => [...arisanMeetingKeys.all, 'list', params] as const,
  detail: (id: Id) => [...arisanMeetingKeys.all, 'detail', id] as const,
  options: () => [...arisanMeetingKeys.all, 'options'] as const,
}

export const arisanMeetingsApi = {
  list: async (params: ListParams) => {
    const res = await api.get<ApiResponse<Paged<ArisanMeeting>>>('/v1/api/arisan-pertemuan', {
      params: toQueryParams(params),
    })
    return toPagedResult(res.data)
  },
  detail: async (id: Id) => {
    const res = await api.get<ApiResponse<ArisanMeeting>>(`/v1/api/arisan-pertemuan/${id}`)
    return res.data.data
  },
  create: (payload: CreateMeetingPayload) => api.post('/v1/api/arisan-pertemuan', payload),
  update: (payload: UpdateMeetingPayload) => api.put('/v1/api/arisan-pertemuan', payload),
  remove: (id: Id) => api.delete(`/v1/api/arisan-pertemuan/${id}`),
  /** Meeting schedule as {id, pertemuan_ke}; used in the manual billing form. */
  options: async () => {
    const res = await api.get<unknown>('/v1/api/arisan-pertemuan/list')
    return toArray<MeetingOption>(res.data)
  },
}

export function useArisanMeetings(params: ListParams) {
  return useQuery({
    queryKey: arisanMeetingKeys.list(params),
    queryFn: () => arisanMeetingsApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useMeetingOptions(enabled = true) {
  return useQuery({
    queryKey: arisanMeetingKeys.options(),
    queryFn: arisanMeetingsApi.options,
    enabled,
  })
}

function useInvalidate() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: arisanMeetingKeys.all })
}

export function useCreateArisanMeeting() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: arisanMeetingsApi.create,
    onSuccess: invalidate,
    meta: { successMessage: 'Berhasil menambahkan data baru!' },
  })
}

export function useUpdateArisanMeeting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: arisanMeetingsApi.update,
    // Winners change each member's "dapat" status too.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: arisanMeetingKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['arisan-members'] }),
      ]),
    meta: { successMessage: 'Berhasil mengubah data!' },
  })
}

export function useDeleteArisanMeeting() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: arisanMeetingsApi.remove,
    onSuccess: invalidate,
    meta: { successMessage: 'Berhasil menghapus data!' },
  })
}
