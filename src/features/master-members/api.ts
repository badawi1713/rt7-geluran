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

export interface MasterMember {
  id: Id
  nama?: string
  keterangan?: string
  created_date?: string
  last_updated?: string
}

export interface MasterMemberPayload {
  id?: Id
  nama: string
  keterangan: string
}

/** Lightweight result of `/v1/api/Anggota/list-search/{keyword}`. */
export interface MemberSearchResult {
  id: Id
  nama: string
}

export const masterMemberKeys = {
  all: ['master-members'] as const,
  list: (params: ListParams) => [...masterMemberKeys.all, 'list', params] as const,
  detail: (id: Id) => [...masterMemberKeys.all, 'detail', id] as const,
  options: () => [...masterMemberKeys.all, 'options'] as const,
  search: (keyword: string) => [...masterMemberKeys.all, 'search', keyword] as const,
}

export const masterMembersApi = {
  list: async (params: ListParams) => {
    const res = await api.get<ApiResponse<Paged<MasterMember>>>('/v1/api/Anggota', {
      params: toQueryParams(params),
    })
    return toPagedResult(res.data)
  },
  detail: async (id: Id) => {
    const res = await api.get<ApiResponse<MasterMember>>(`/v1/api/Anggota/${id}`)
    return res.data.data
  },
  create: (payload: MasterMemberPayload) => api.post('/v1/api/Anggota', payload),
  update: (payload: MasterMemberPayload & { id: Id }) =>
    api.put(`/v1/api/Anggota/${payload.id}`, payload),
  remove: (id: Id) => api.delete(`/v1/api/Anggota/${id}`),
  /** All members as {id, name}; used in the arisan member and manual billing forms. */
  options: async () => {
    const res = await api.get<unknown>('/v1/api/Anggota/list')
    return toArray<NamedOption>(res.data)
  },
  search: async (keyword: string) => {
    const res = await api.get<unknown>(
      `/v1/api/Anggota/list-search/${encodeURIComponent(keyword)}`,
    )
    return toArray<MemberSearchResult>(res.data)
  },
}

export function useMasterMembers(params: ListParams) {
  return useQuery({
    queryKey: masterMemberKeys.list(params),
    queryFn: () => masterMembersApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useMasterMember(id: Id | null) {
  return useQuery({
    queryKey: masterMemberKeys.detail(id ?? ''),
    queryFn: () => masterMembersApi.detail(id!),
    enabled: id !== null,
  })
}

export function useMemberOptions(enabled = true) {
  return useQuery({
    queryKey: masterMemberKeys.options(),
    queryFn: masterMembersApi.options,
    enabled,
  })
}

export function useMemberSearch(keyword: string) {
  return useQuery({
    queryKey: masterMemberKeys.search(keyword),
    queryFn: () => masterMembersApi.search(keyword),
    enabled: keyword.length >= 3,
  })
}

function useInvalidateMembers() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: masterMemberKeys.all })
}

export function useCreateMasterMember() {
  const invalidate = useInvalidateMembers()
  return useMutation({
    mutationFn: masterMembersApi.create,
    onSuccess: invalidate,
    meta: { successMessage: 'Berhasil menambahkan data baru!' },
  })
}

export function useUpdateMasterMember() {
  const invalidate = useInvalidateMembers()
  return useMutation({
    mutationFn: masterMembersApi.update,
    onSuccess: invalidate,
    meta: { successMessage: 'Berhasil mengubah data!' },
  })
}

export function useDeleteMasterMember() {
  const invalidate = useInvalidateMembers()
  return useMutation({
    mutationFn: masterMembersApi.remove,
    onSuccess: invalidate,
    meta: { successMessage: 'Berhasil menghapus data!' },
  })
}
