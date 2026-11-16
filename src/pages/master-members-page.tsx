import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { type Column, DataTable } from '@/components/data-table'
import { FormDialog } from '@/components/form-dialog'
import { PageHeader } from '@/components/page-header'
import { ShortcutButton } from '@/components/shortcut-button'
import { RowActions } from '@/components/row-actions'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  type MasterMember,
  useCreateMasterMember,
  useDeleteMasterMember,
  useMasterMember,
  useMasterMembers,
  useUpdateMasterMember,
} from '@/features/master-members/api'
import { useListParams } from '@/hooks/use-list-params'
import type { Id } from '@/lib/types'

const schema = z.object({
  nama: z.string().trim().min(1, 'Diharuskan untuk mengisi nama lengkap'),
  keterangan: z.string(),
})
type FormValues = z.infer<typeof schema>

export function MasterMembersPage() {
  const [params, setParams] = useListParams()
  const query = useMasterMembers(params)
  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<Id | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MasterMember | null>(null)
  const deleteMutation = useDeleteMasterMember()

  const columns: Column<MasterMember>[] = [
    { header: 'No', align: 'center', className: 'w-14 tabular-nums', mobile: 'hide', cell: (_, n) => n },
    { header: 'Nama', mobile: 'title', cell: (row) => <span className="font-medium">{row.nama || '-'}</span> },
    { header: 'Keterangan', cell: (row) => row.keterangan || '-', className: 'max-w-72 truncate' },
    { header: 'Tanggal Dibuat', align: 'center', cell: (row) => row.created_date || '-' },
    { header: 'Tanggal Diubah', align: 'center', cell: (row) => row.last_updated || '-' },
    {
      header: 'Aksi',
      align: 'center',
      mobile: 'actions',
      cell: (row) => (
        <RowActions
          label={row.nama ?? String(row.id)}
          onEdit={() => setEditId(row.id)}
          onDelete={() => setDeleteTarget(row)}
        />
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6 lg:min-h-0 lg:flex-1 lg:gap-5">
      <PageHeader
        title="Anggota"
        description="Data warga RT 7 yang terdaftar."
        search={params.search}
        onSearch={(search) => setParams({ search, page: 0 })}
      >
        <ShortcutButton shortcut="N" onClick={() => setCreateOpen(true)}>
          <PlusIcon aria-hidden /> Tambah anggota
        </ShortcutButton>
      </PageHeader>

      <title>Anggota · Arisan RT 7 Geluran</title>
      <DataTable
        label="Daftar anggota"
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

      {createOpen && <CreateDialog onClose={() => setCreateOpen(false)} />}
      {editId !== null && <EditDialog id={editId} onClose={() => setEditId(null)} />}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus data?"
        description={`Data anggota "${deleteTarget?.nama ?? deleteTarget?.id}" akan dihapus.`}
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

function CreateDialog({ onClose }: { onClose: () => void }) {
  const mutation = useCreateMasterMember()
  return (
    <FormDialog open onOpenChange={(open) => !open && onClose()} title="Tambah anggota" formId="master-member-form" pending={mutation.isPending}>
      <MemberForm
        defaultValues={{ nama: '', keterangan: '' }}
        onSubmit={(values) => mutation.mutate(values, { onSuccess: onClose })}
      />
    </FormDialog>
  )
}

function EditDialog({ id, onClose }: { id: Id; onClose: () => void }) {
  const detail = useMasterMember(id)
  const mutation = useUpdateMasterMember()

  return (
    <FormDialog open onOpenChange={(open) => !open && onClose()} title="Ubah data anggota" formId="master-member-form" pending={mutation.isPending}>
      {detail.data ? (
        <MemberForm
          defaultValues={{ nama: detail.data.nama ?? '', keterangan: detail.data.keterangan ?? '' }}
          onSubmit={(values) => mutation.mutate({ id, ...values }, { onSuccess: onClose })}
        />
      ) : detail.isError ? (
        <p className="text-sm text-destructive">Data tidak dapat dimuat.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8" />
          <Skeleton className="h-20" />
        </div>
      )}
    </FormDialog>
  )
}

function MemberForm({ defaultValues, onSubmit }: { defaultValues: FormValues; onSubmit: (values: FormValues) => void }) {
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues })

  return (
    <form id="master-member-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Controller
          name="nama"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="nama">Nama Lengkap</FieldLabel>
              <Input {...field} id="nama" autoFocus placeholder="Nama lengkap" aria-invalid={fieldState.invalid} />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          name="keterangan"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="keterangan">Keterangan (opsional)</FieldLabel>
              <Textarea {...field} id="keterangan" rows={3} placeholder="Masukkan keterangan" />
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  )
}
