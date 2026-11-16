import { useState } from 'react'
import { type Column, DataTable } from '@/components/data-table'
import { PageHeader } from '@/components/page-header'
import { type ArisanReport, type PaymentStatus, useArisanReports } from '@/features/reports/api'
import { useListParams } from '@/hooks/use-list-params'
import { rupiah } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ReportStatusDialog } from './report-status-dialog'

const count = (value?: number) => (value ?? 0).toLocaleString('id-ID')

interface StatusTarget {
  report: ArisanReport
  status: PaymentStatus
  /** The count that was clicked. The dialog isn't opened by a Radix trigger, so it's told where focus goes back to. */
  trigger: HTMLElement
}

/** The paid/unpaid count, clickable to list who it is. Zero has nobody to list, so it stays plain text. */
function StatusCount({
  report,
  status,
  onOpen,
}: {
  report: ArisanReport
  status: PaymentStatus
  onOpen: (target: StatusTarget) => void
}) {
  const value = status === 'sudah' ? report.jumlah_lunas : report.jumlah_belum_lunas
  const tone = status === 'sudah' ? 'text-success' : 'text-destructive'
  if (!value) return <span className={cn('tabular-nums', tone)}>0</span>

  const label = status === 'sudah' ? 'sudah bayar' : 'belum bayar'
  return (
    <button
      type="button"
      onClick={(event) => onOpen({ report, status, trigger: event.currentTarget })}
      aria-label={`${count(value)} anggota ${label} di pertemuan ke-${report.pertemuan_ke ?? report.id}, lihat daftar`}
      className={cn(
        'min-w-10 rounded-md px-2 py-1 font-semibold tabular-nums underline decoration-dotted underline-offset-4 hover:bg-accent hover:decoration-solid focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        tone,
      )}
    >
      {count(value)}
    </button>
  )
}

export function ReportsPage() {
  const [params, setParams] = useListParams()
  const query = useArisanReports(params)
  const [target, setTarget] = useState<StatusTarget | null>(null)

  const columns: Column<ArisanReport>[] = [
    { header: 'ID', align: 'center', className: 'tabular-nums text-muted-foreground', mobile: 'hide', cell: (row) => row.id },
    { header: 'Tanggal', align: 'center', mobile: 'title', cell: (row) => row.tanggal || '-' },
    { header: 'Pertemuan Ke', align: 'center', className: 'tabular-nums', cell: (row) => row.pertemuan_ke || '-' },
    { header: 'Dapat 1', cell: (row) => row.dapat_1 || '-' },
    { header: 'Dapat 2', cell: (row) => row.dapat_2 || '-' },
    { header: 'Lunas', align: 'center', cell: (row) => <StatusCount report={row} status="sudah" onOpen={setTarget} /> },
    { header: 'Belum Lunas', align: 'center', cell: (row) => <StatusCount report={row} status="belum" onOpen={setTarget} /> },
    { header: 'Jumlah Anggota', align: 'center', className: 'tabular-nums', cell: (row) => count(row.jumlah_anggota) },
    { header: 'Nominal Sudah Lunas', align: 'right', className: 'tabular-nums', cell: (row) => rupiah(row.nominal_lunas) },
    { header: 'Nominal Belum Lunas', align: 'right', className: 'tabular-nums', cell: (row) => rupiah(row.nominal_belum_lunas) },
    { header: 'Jumlah Nominal', align: 'right', className: 'tabular-nums font-semibold', cell: (row) => rupiah(row.jumlah_nominal) },
  ]

  return (
    <div className="flex flex-col gap-6 lg:min-h-0 lg:flex-1 lg:gap-5">
      <PageHeader
        title="Laporan Arisan"
        description="Rekap pembayaran per pertemuan. Klik angka Lunas atau Belum Lunas untuk melihat daftar anggotanya."
        search={params.search}
        onSearch={(search) => setParams({ search, page: 0 })}
      />
      <title>Laporan Arisan · Arisan RT 7 Geluran</title>
      <DataTable
        label="Rekap arisan per pertemuan"
        columns={columns}
        rows={query.data?.rows ?? []}
        total={query.data?.total ?? 0}
        params={params}
        onParamsChange={setParams}
        getRowKey={(row) => row.id}
        isLoading={query.isPending}
        isFetching={query.isFetching}
        error={query.error}
        onRetry={() => query.refetch()}
      />

      {target && (
        <ReportStatusDialog
          report={target.report}
          status={target.status}
          returnFocusTo={target.trigger}
          onClose={() => setTarget(null)}
        />
      )}
    </div>
  )
}
