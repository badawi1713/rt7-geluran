import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  type ApiResponse,
  type Id,
  type ListParams,
  type NamedOption,
  type Paged,
  toArray,
  toPagedResult,
  toQueryParams,
} from '@/lib/types'

export interface ArisanMember {
  id: Id
  anggota_name?: string
  /** "Sudah dapat" | "Belum dapat" */
  dapat?: string
  keterangan?: string
  created_date?: string
  last_updated?: string
  /** This endpoint sends camelCase for this field. */
  lastUpdated?: string | null
}

export interface CreateArisanMemberPayload {
  anggota_id: Id
  jumlah_lot: number
  keterangan: string
}

export interface UpdateArisanMemberPayload {
  id: Id
  name: string
  keterangan: string
}

export const arisanMemberKeys = {
  all: ['arisan-members'] as const,
  list: (params: ListParams) => [...arisanMemberKeys.all, 'list', params] as const,
  detail: (id: Id) => [...arisanMemberKeys.all, 'detail', id] as const,
  options: () => [...arisanMemberKeys.all, 'options'] as const,
}

export const arisanMembersApi = {
  list: async (params: ListParams) => {
    const res = await api.get<ApiResponse<Paged<ArisanMember>>>('/v1/api/arisan-anggota', {
      params: toQueryParams(params),
    })
    return toPagedResult(res.data)
  },
  detail: async (id: Id) => {
    const res = await api.get<ApiResponse<ArisanMember>>(`/v1/api/arisan-anggota/${id}`)
    return res.data.data
  },
  create: (payload: CreateArisanMemberPayload) => api.post('/v1/api/arisan-anggota', payload),
  update: (payload: UpdateArisanMemberPayload) => api.put('/v1/api/arisan-anggota', payload),
  remove: (id: Id) => api.delete(`/v1/api/arisan-anggota/${id}`),
  /** Arisan participants as {id, name}; used for the "Dapat 1/2" pickers. */
  options: async () => {
    const res = await api.get<unknown>('/v1/api/arisan-anggota/list')
    return toArray<NamedOption>(res.data)
  },
}

export function useArisanMembers(params: ListParams) {
  return useQuery({
    queryKey: arisanMemberKeys.list(params),
    queryFn: () => arisanMembersApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useArisanMember(id: Id | null) {
  return useQuery({
    queryKey: arisanMemberKeys.detail(id ?? ''),
    queryFn: () => arisanMembersApi.detail(id!),
    enabled: id !== null,
  })
}

export function useArisanMemberOptions(enabled = true) {
  return useQuery({
    queryKey: arisanMemberKeys.options(),
    queryFn: arisanMembersApi.options,
    enabled,
  })
}

function useInvalidate() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: arisanMemberKeys.all })
}

export function useCreateArisanMember() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: arisanMembersApi.create,
    onSuccess: invalidate,
    meta: { successMessage: 'Berhasil menambahkan data baru!' },
  })
}

export function useUpdateArisanMember() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: arisanMembersApi.update,
    onSuccess: invalidate,
    meta: { successMessage: 'Berhasil mengubah data!' },
  })
}

export function useDeleteArisanMember() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: arisanMembersApi.remove,
    onSuccess: invalidate,
    meta: { successMessage: 'Berhasil menghapus data!' },
  })
}
