import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Combobox } from '@/components/combobox'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { type Column, DataTable } from '@/components/data-table'
import { FormDialog } from '@/components/form-dialog'
import { PageHeader } from '@/components/page-header'
import { ShortcutButton } from '@/components/shortcut-button'
import { RowActions } from '@/components/row-actions'
import { StatusBadge } from '@/components/status-badge'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  type ArisanMember,
  useArisanMember,
  useArisanMembers,
  useCreateArisanMember,
  useDeleteArisanMember,
  useUpdateArisanMember,
} from '@/features/arisan-members/api'
import { useMemberOptions } from '@/features/master-members/api'
import { useListParams } from '@/hooks/use-list-params'
import type { Id, NamedOption } from '@/lib/types'

export function ArisanMembersPage() {
  const [params, setParams] = useListParams()
  const query = useArisanMembers(params)
  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<Id | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ArisanMember | null>(null)
  const deleteMutation = useDeleteArisanMember()

  const columns: Column<ArisanMember>[] = [
    { header: 'No', align: 'center', className: 'w-14 tabular-nums', mobile: 'hide', cell: (_, n) => n },
    { header: 'Nama', mobile: 'title', cell: (row) => <span className="font-medium">{row.anggota_name || '-'}</span> },
    { header: 'Dapat Arisan', mobile: 'badge', cell: (row) => <StatusBadge status={row.dapat} /> },
    { header: 'Keterangan', cell: (row) => row.keterangan || '-', className: 'max-w-72 truncate' },
    { header: 'Tanggal Dibuat', align: 'center', cell: (row) => row.created_date || '-' },
    { header: 'Tanggal Diubah', align: 'center', cell: (row) => row.last_updated || row.lastUpdated || '-' },
    {
      header: 'Aksi',
      align: 'center',
      mobile: 'actions',
      cell: (row) => (
        <RowActions
          label={row.anggota_name ?? String(row.id)}
          onEdit={() => setEditId(row.id)}
          onDelete={() => setDeleteTarget(row)}
        />
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Anggota Arisan"
        description="Peserta arisan beserta status sudah atau belum dapat."
        search={params.search}
        onSearch={(search) => setParams({ search, page: 0 })}
      >
        <ShortcutButton shortcut="N" onClick={() => setCreateOpen(true)}>
          <PlusIcon aria-hidden /> Tambah peserta
        </ShortcutButton>
      </PageHeader>

      <title>Anggota Arisan · Arisan RT 7 Geluran</title>
      <DataTable
        label="Daftar peserta arisan"
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
        description={`"${deleteTarget?.anggota_name ?? deleteTarget?.id}" akan dihapus dari daftar anggota arisan.`}
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

const createSchema = z.object({
  anggota: z.custom<NamedOption | null>().refine((value) => value !== null, 'Diharuskan untuk memilih anggota'),
  jumlah_lot: z
    .string()
    .min(1, 'Diharuskan untuk mengisi jumlah lot')
    .refine((value) => Number.isInteger(Number(value)), 'Diharuskan untuk mengisi dalam format angka')
    .refine((value) => Number(value) >= 1, 'Jumlah lot minimum adalah 1'),
  keterangan: z.string(),
})
type CreateInput = z.input<typeof createSchema>
type CreateValues = z.output<typeof createSchema>

function CreateDialog({ onClose }: { onClose: () => void }) {
  const members = useMemberOptions()
  const mutation = useCreateArisanMember()
  const form = useForm<CreateInput, unknown, CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { anggota: null, jumlah_lot: '', keterangan: '' },
  })

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate(
      { anggota_id: values.anggota.id, jumlah_lot: Number(values.jumlah_lot), keterangan: values.keterangan },
      { onSuccess: onClose },
    )
  })

  return (
    <FormDialog open onOpenChange={(open) => !open && onClose()} title="Tambah peserta arisan" formId="arisan-member-form" pending={mutation.isPending}>
      <form id="arisan-member-form" onSubmit={onSubmit} noValidate>
        <FieldGroup>
          <Controller
            name="anggota"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="anggota">Anggota</FieldLabel>
                <Combobox
                  id="anggota"
                  value={field.value ?? null}
                  onChange={field.onChange}
                  options={members.data ?? []}
                  loading={members.isPending}
                  getKey={(option) => String(option.id)}
                  getLabel={(option) => `${option.id} - ${option.name}`}
                  placeholder="Pilih daftar anggota"
                  searchPlaceholder="Cari nama anggota…"
                  invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            name="jumlah_lot"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="jumlah_lot">Jumlah Lot</FieldLabel>
                <Input {...field} id="jumlah_lot" type="number" inputMode="numeric" min={1} placeholder="1" aria-invalid={fieldState.invalid} />
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
    </FormDialog>
  )
}

const editSchema = z.object({
  nama: z.string().trim().min(1, 'Diharuskan untuk mengisi nama anggota.'),
  keterangan: z.string(),
})
type EditValues = z.infer<typeof editSchema>

function EditDialog({ id, onClose }: { id: Id; onClose: () => void }) {
  const detail = useArisanMember(id)
  const mutation = useUpdateArisanMember()

  return (
    <FormDialog open onOpenChange={(open) => !open && onClose()} title="Ubah data peserta" formId="arisan-member-edit-form" pending={mutation.isPending}>
      {detail.data ? (
        <EditForm
          defaultValues={{ nama: detail.data.anggota_name ?? '', keterangan: detail.data.keterangan ?? '' }}
          onSubmit={(values) =>
            mutation.mutate({ id, name: values.nama, keterangan: values.keterangan }, { onSuccess: onClose })
          }
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

function EditForm({ defaultValues, onSubmit }: { defaultValues: EditValues; onSubmit: (values: EditValues) => void }) {
  const form = useForm<EditValues>({ resolver: zodResolver(editSchema), defaultValues })
  return (
    <form id="arisan-member-edit-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Controller
          name="nama"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="nama">Nama Anggota</FieldLabel>
              <Input {...field} id="nama" autoFocus aria-invalid={fieldState.invalid} />
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
