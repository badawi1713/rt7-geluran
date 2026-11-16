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

export interface ArisanTransaction {
  id: Id
  anggota_nama?: string
  nominal?: number
  /** "Sudah bayar" | "Belum bayar" */
  lunas?: string
  keterangan?: string
  pertemuan_lokasi?: string
  pertemuan_ke?: number | string
  tanggal_bayar?: string
  updated_who?: string
}

/** An unpaid bill returned by the inquiry endpoint. */
export interface UnpaidBill {
  id: Id
  nama?: string
  pertemuan_ke?: number | string
  periode?: string
  nominal?: number
}

export interface PaymentPayload {
  id: Id[]
}

export interface ManualBillPayload {
  pertemuan_id: Id
  anggota_id: Id
  keterangan: string
}

export const transactionKeys = {
  all: ['arisan-transactions'] as const,
  list: (params: ListParams) => [...transactionKeys.all, 'list', params] as const,
  unpaid: (memberId: Id) => [...transactionKeys.all, 'unpaid', memberId] as const,
}

export const transactionsApi = {
  list: async (params: ListParams) => {
    const res = await api.get<ApiResponse<Paged<ArisanTransaction>>>('/v1/api/arisan-transaksi', {
      params: toQueryParams(params),
    })
    return toPagedResult(res.data)
  },
  unpaidBills: async (memberId: Id) => {
    const res = await api.get<ApiResponse<{ list?: UnpaidBill[] }>>(
      `/v1/api/arisan-transaksi/inquiry/${memberId}`,
    )
    return toArray<UnpaidBill>(res.data?.data?.list)
  },
  pay: (payload: PaymentPayload) => api.post('/v1/api/arisan-transaksi/payment', payload),
  createManualBill: (payload: ManualBillPayload) => api.post('/v1/api/arisan-transaksi', payload),
}

export function useTransactions(params: ListParams) {
  return useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: () => transactionsApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useUnpaidBills(memberId: Id | null) {
  return useQuery({
    queryKey: transactionKeys.unpaid(memberId ?? ''),
    queryFn: () => transactionsApi.unpaidBills(memberId!),
    enabled: memberId !== null,
    staleTime: 0,
  })
}

/** Payments and new bills change the transaction list and the arisan report totals. */
function useInvalidateMoney() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['arisan-reports'] }),
    ])
}

export function usePayBills() {
  const invalidate = useInvalidateMoney()
  return useMutation({
    mutationFn: transactionsApi.pay,
    onSuccess: invalidate,
    meta: { successMessage: 'Berhasil melakukan pembayaran!' },
  })
}

export function useCreateManualBill() {
  const invalidate = useInvalidateMoney()
  return useMutation({
    mutationFn: transactionsApi.createManualBill,
    onSuccess: invalidate,
    meta: { successMessage: 'Berhasil memproses tagihan manual!' },
  })
}
