import { SearchIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { type Column, DataTable, type SortState } from '@/components/data-table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import {
  type ArisanReport,
  type PaymentStatus,
  type ReportStatusMember,
  useReportStatus,
} from '@/features/reports/api'
import { DEFAULT_PAGE_SIZE } from '@/hooks/use-list-params'
import type { ListParams } from '@/lib/types'

const titles: Record<PaymentStatus, string> = {
  sudah: 'Daftar Arisan Sudah Bayar',
  belum: 'Daftar Arisan Belum Bayar',
}

const columns: Column<ReportStatusMember>[] = [
  { header: 'No', align: 'center', className: 'w-14 tabular-nums', mobile: 'hide', cell: (_, n) => n },
  { header: 'Nama', sortKey: 'name', mobile: 'title', cell: (row) => <span className="font-medium">{row.name || '-'}</span> },
  { header: 'Keterangan', sortKey: 'keterangan', className: 'whitespace-normal', cell: (row) => row.keterangan || '-' },
]

const collator = new Intl.Collator('id', { sensitivity: 'base', numeric: true })

interface ReportStatusDialogProps {
  report: ArisanReport
  status: PaymentStatus
  onClose: () => void
  /** The control that opened the dialog; focus returns there on close. */
  returnFocusTo?: HTMLElement | null
}

/** Who has (or hasn't) paid for one meeting. The server sends the whole list; search, sort and paging happen here. */
export function ReportStatusDialog({ report, status, onClose, returnFocusTo }: ReportStatusDialogProps) {
  const query = useReportStatus({ reportId: report.id, status })
  const [params, setParams] = useState<ListParams>({ page: 0, size: DEFAULT_PAGE_SIZE, search: '' })
  const [sort, setSort] = useState<SortState>({ key: 'name', direction: 'asc' })

  const filtered = useMemo(() => {
    const keyword = params.search.trim().toLowerCase()
    const key = sort.key as 'name' | 'keterangan'
    const matches = (query.data ?? []).filter((member) => member.name?.toLowerCase().includes(keyword))
    return matches.sort((a, b) => {
      const order = collator.compare(a[key] ?? '', b[key] ?? '')
      return sort.direction === 'asc' ? order : -order
    })
  }, [query.data, params.search, sort])

  const rows = filtered.slice(params.page * params.size, (params.page + 1) * params.size)
  const meeting = report.pertemuan_ke ? `Pertemuan ke-${report.pertemuan_ke}` : `Laporan ${report.id}`

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="flex h-[min(52rem,calc(100dvh-2rem))] flex-col gap-4 sm:max-w-3xl"
        onCloseAutoFocus={(event) => {
          if (!returnFocusTo?.isConnected) return
          event.preventDefault()
          returnFocusTo.focus()
        }}
      >
        <DialogHeader>
          <DialogTitle>{titles[status]}</DialogTitle>
          <DialogDescription>
            {meeting}
            {report.tanggal ? `, ${report.tanggal}` : ''}.
            {query.data && ` ${query.data.length} anggota.`}
          </DialogDescription>
        </DialogHeader>

        <InputGroup className="sm:max-w-72">
          <InputGroupAddon>
            <SearchIcon aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            autoFocus
            type="search"
            aria-label="Cari nama anggota"
            placeholder="Cari nama"
            value={params.search}
            onChange={(event) => setParams((prev) => ({ ...prev, search: event.target.value, page: 0 }))}
          />
        </InputGroup>

        <div className="flex min-h-0 flex-1 flex-col [&>section]:min-h-0 [&>section]:flex-1">
          <DataTable
            label={titles[status]}
            columns={columns}
            rows={rows}
            total={filtered.length}
            params={params}
            onParamsChange={(next) => setParams((prev) => ({ ...prev, ...next }))}
            getRowKey={(row) => row.id}
            isLoading={query.isPending}
            error={query.error}
            onRetry={() => query.refetch()}
            sort={sort}
            onSortChange={(key) =>
              setSort((prev) => ({
                key,
                direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
              }))
            }
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
