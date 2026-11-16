import { BanknoteIcon, FilePlusIcon } from 'lucide-react'
import { useState } from 'react'
import { type Column, DataTable } from '@/components/data-table'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { PageHeader } from '@/components/page-header'
import { RowActions } from '@/components/row-actions'
import { ShortcutButton } from '@/components/shortcut-button'
import { StatusBadge } from '@/components/status-badge'
import { type ArisanTransaction, useDeleteTransaction, useTransactions } from '@/features/transactions/api'
import { useListParams } from '@/hooks/use-list-params'
import { rupiah } from '@/lib/format'
import { ManualBillDialog } from './manual-bill-dialog'
import { PaymentDialog } from './payment-dialog'

export function TransactionsPage() {
  const [params, setParams] = useListParams()
  const query = useTransactions(params)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ArisanTransaction | null>(null)
  const deleteMutation = useDeleteTransaction()

  const columns: Column<ArisanTransaction>[] = [
    { header: 'ID', align: 'center', className: 'tabular-nums text-muted-foreground', cell: (row) => row.id },
    { header: 'Nama', mobile: 'title', cell: (row) => <span className="font-medium">{row.anggota_nama || '-'}</span> },
    { header: 'Nominal', align: 'right', className: 'tabular-nums', cell: (row) => rupiah(row.nominal) },
    { header: 'Lunas', mobile: 'badge', cell: (row) => <StatusBadge status={row.lunas} /> },
    { header: 'Keterangan', cell: (row) => row.keterangan || '-', className: 'max-w-64 truncate' },
    { header: 'Lokasi', cell: (row) => row.pertemuan_lokasi || '-' },
    { header: 'Pertemuan Ke', align: 'center', className: 'tabular-nums', cell: (row) => row.pertemuan_ke || '-' },
    { header: 'Tanggal Bayar', align: 'center', cell: (row) => row.tanggal_bayar || '-' },
    { header: 'Diubah Oleh', cell: (row) => row.updated_who || '-' },
    {
      header: 'Aksi',
      align: 'center',
      mobile: 'actions',
      cell: (row) => (
        <RowActions label={`transaksi ${row.id} ${row.anggota_nama ?? ''}`.trim()} onDelete={() => setDeleteTarget(row)} />
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6 lg:min-h-0 lg:flex-1 lg:gap-5">
      <PageHeader
        title="Transaksi Arisan"
        description="Tagihan dan pembayaran arisan setiap anggota."
        search={params.search}
        onSearch={(search) => setParams({ search, page: 0 })}
      >
        <ShortcutButton shortcut="B" onClick={() => setPaymentOpen(true)}>
          <BanknoteIcon aria-hidden /> Bayar arisan
        </ShortcutButton>
        <ShortcutButton shortcut="M" variant="outline" onClick={() => setManualOpen(true)}>
          <FilePlusIcon aria-hidden /> Tagihan manual
        </ShortcutButton>
      </PageHeader>

      <title>Transaksi Arisan · Arisan RT 7 Geluran</title>
      <DataTable
        label="Daftar transaksi arisan"
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

      {paymentOpen && <PaymentDialog onClose={() => setPaymentOpen(false)} />}
      {manualOpen && <ManualBillDialog onClose={() => setManualOpen(false)} />}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus transaksi?"
        description={`Transaksi ID ${deleteTarget?.id}${deleteTarget?.anggota_nama ? ` atas nama ${deleteTarget.anggota_nama}` : ''} akan dihapus. Laporan arisan ikut berubah.`}
        confirmText="Hapus"
        pendingText="Menghapus…"
        destructive
        pending={deleteMutation.isPending}
        onConfirm={() =>
          deleteTarget && deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })
        }
      />
    </div>
  )
}
