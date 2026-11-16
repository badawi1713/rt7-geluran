import { type Column, DataTable } from '@/components/data-table'
import { PageHeader } from '@/components/page-header'
import { type ArisanReport, useArisanReports } from '@/features/reports/api'
import { useListParams } from '@/hooks/use-list-params'
import { rupiah } from '@/lib/format'

const count = (value?: number) => (value ?? 0).toLocaleString('id-ID')

const columns: Column<ArisanReport>[] = [
  { header: 'ID', align: 'center', className: 'tabular-nums text-muted-foreground', mobile: 'hide', cell: (row) => row.id },
  { header: 'Tanggal', align: 'center', mobile: 'title', cell: (row) => row.tanggal || '-' },
  { header: 'Pertemuan Ke', align: 'center', className: 'tabular-nums', cell: (row) => row.pertemuan_ke || '-' },
  { header: 'Dapat 1', cell: (row) => row.dapat_1 || '-' },
  { header: 'Dapat 2', cell: (row) => row.dapat_2 || '-' },
  { header: 'Lunas', align: 'center', className: 'tabular-nums text-success', cell: (row) => count(row.jumlah_lunas) },
  { header: 'Belum Lunas', align: 'center', className: 'tabular-nums text-destructive', cell: (row) => count(row.jumlah_belum_lunas) },
  { header: 'Jumlah Anggota', align: 'center', className: 'tabular-nums', cell: (row) => count(row.jumlah_anggota) },
  { header: 'Nominal Sudah Lunas', align: 'right', className: 'tabular-nums', cell: (row) => rupiah(row.nominal_lunas) },
  { header: 'Nominal Belum Lunas', align: 'right', className: 'tabular-nums', cell: (row) => rupiah(row.nominal_belum_lunas) },
  { header: 'Jumlah Nominal', align: 'right', className: 'tabular-nums font-semibold', cell: (row) => rupiah(row.jumlah_nominal) },
]

export function ReportsPage() {
  const [params, setParams] = useListParams()
  const query = useArisanReports(params)

  return (
    <div className="flex flex-col gap-6 lg:min-h-0 lg:flex-1 lg:gap-5">
      <PageHeader
        title="Laporan Arisan"
        description="Rekap pembayaran per pertemuan."
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
    </div>
  )
}
