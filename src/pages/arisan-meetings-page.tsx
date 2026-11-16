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
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  type ArisanMeeting,
  useArisanMeetings,
  useCreateArisanMeeting,
  useDeleteArisanMeeting,
  useUpdateArisanMeeting,
} from '@/features/arisan-meetings/api'
import { useArisanMemberOptions } from '@/features/arisan-members/api'
import { useListParams } from '@/hooks/use-list-params'
import { ddmmyyyyToISO, todayISO } from '@/lib/format'
import type { NamedOption } from '@/lib/types'

export function ArisanMeetingsPage() {
  const [params, setParams] = useListParams()
  const query = useArisanMeetings(params)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ArisanMeeting | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ArisanMeeting | null>(null)
  const deleteMutation = useDeleteArisanMeeting()

  const columns: Column<ArisanMeeting>[] = [
    { header: 'No', align: 'center', className: 'w-14 tabular-nums', mobile: 'hide', cell: (_, n) => n },
    { header: 'Lokasi', mobile: 'title', cell: (row) => <span className="font-medium">{row.lokasi || '-'}</span> },
    { header: 'Tanggal', align: 'center', cell: (row) => row.tanggal || '-' },
    { header: 'Pertemuan Ke', align: 'center', className: 'tabular-nums', cell: (row) => row.pertemuan_ke || '-' },
    { header: 'Anggota Dapat 1', cell: (row) => row.anggota_dapat_1 || '-' },
    { header: 'Anggota Dapat 2', cell: (row) => row.anggota_dapat_2 || '-' },
    { header: 'Keterangan', cell: (row) => row.keterangan || '-', className: 'max-w-72 truncate' },
    { header: 'Tanggal Diubah', align: 'center', cell: (row) => row.last_updated || row.lastUpdated || '-' },
    {
      header: 'Aksi',
      align: 'center',
      mobile: 'actions',
      cell: (row) => (
        <RowActions
          label={`pertemuan ke-${row.pertemuan_ke ?? row.id}`}
          onEdit={() => setEditTarget(row)}
          onDelete={() => setDeleteTarget(row)}
        />
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6 lg:min-h-0 lg:flex-1 lg:gap-5">
      <PageHeader
        title="Pertemuan Arisan"
        description="Jadwal, lokasi dan pemenang tiap pertemuan."
        search={params.search}
        onSearch={(search) => setParams({ search, page: 0 })}
      >
        <ShortcutButton shortcut="N" onClick={() => setCreateOpen(true)}>
          <PlusIcon aria-hidden /> Tambah pertemuan
        </ShortcutButton>
      </PageHeader>

      <title>Pertemuan Arisan · Arisan RT 7 Geluran</title>
      <DataTable
        label="Daftar pertemuan arisan"
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

      {createOpen && <MeetingDialog onClose={() => setCreateOpen(false)} />}
      {editTarget && <MeetingDialog meeting={editTarget} onClose={() => setEditTarget(null)} />}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus data?"
        description={`Pertemuan ke-${deleteTarget?.pertemuan_ke ?? '?'} di ${deleteTarget?.lokasi ?? '-'} akan dihapus.`}
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

const schema = z.object({
  lokasi: z.string().trim().min(1, 'Diharuskan untuk mengisi lokasi arisan'),
  tanggal: z.iso.date('Format tanggal salah'),
  pertemuan_ke: z
    .string()
    .min(1, 'Diharuskan untuk mengisi nilai pertemuan ke berapa?')
    .refine((value) => Number.isInteger(Number(value)), 'Diharuskan untuk mengisi dalam format angka')
    .refine((value) => Number(value) >= 1, 'Nilai pertemuan minimal 1'),
  keterangan: z.string(),
  dapat1: z.custom<NamedOption | null>(),
  dapat2: z.custom<NamedOption | null>(),
})
type FormValues = z.infer<typeof schema>

function toFormValues(meeting?: ArisanMeeting): FormValues {
  if (!meeting) {
    return { lokasi: '', tanggal: todayISO(), pertemuan_ke: '', keterangan: '', dapat1: null, dapat2: null }
  }
  const winner = (id?: NamedOption['id'], name?: string) => (id ? { id, name: name ?? String(id) } : null)
  return {
    lokasi: meeting.lokasi ?? '',
    tanggal: ddmmyyyyToISO(meeting.tanggal),
    pertemuan_ke: meeting.pertemuan_ke ? String(meeting.pertemuan_ke) : '',
    keterangan: meeting.keterangan ?? '',
    dapat1: winner(meeting.anggota_dapat_1_id, meeting.anggota_dapat_1),
    dapat2: winner(meeting.anggota_dapat_2_id, meeting.anggota_dapat_2),
  }
}

/** Create when `meeting` is absent; edit (with winner pickers) when present. */
function MeetingDialog({ meeting, onClose }: { meeting?: ArisanMeeting; onClose: () => void }) {
  const isEdit = !!meeting
  const createMutation = useCreateArisanMeeting()
  const updateMutation = useUpdateArisanMeeting()
  const members = useArisanMemberOptions(isEdit)
  const pending = createMutation.isPending || updateMutation.isPending

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toFormValues(meeting) })

  const onSubmit = form.handleSubmit((values) => {
    const base = {
      lokasi: values.lokasi,
      tanggal: values.tanggal,
      pertemuan_ke: Number(values.pertemuan_ke),
      keterangan: values.keterangan,
    }
    if (meeting) {
      updateMutation.mutate(
        { ...base, id: meeting.id, dapat1: values.dapat1?.id ?? '', dapat2: values.dapat2?.id ?? '' },
        { onSuccess: onClose },
      )
    } else {
      createMutation.mutate(base, { onSuccess: onClose })
    }
  })

  const winnerField = (name: 'dapat1' | 'dapat2', label: string) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field }) => (
        <Field>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Combobox
            id={name}
            value={field.value}
            onChange={field.onChange}
            options={members.data ?? []}
            loading={members.isPending}
            getKey={(option) => String(option.id)}
            getLabel={(option) => option.name}
            placeholder="Belum ada"
            searchPlaceholder="Cari anggota arisan…"
            clearable
          />
        </Field>
      )}
    />
  )

  return (
    <FormDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={isEdit ? 'Ubah pertemuan' : 'Tambah pertemuan'}
      formId="meeting-form"
      pending={pending}
    >
      <form id="meeting-form" onSubmit={onSubmit} noValidate>
        <FieldGroup>
          <Controller
            name="lokasi"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="lokasi">Lokasi Arisan</FieldLabel>
                <Input {...field} id="lokasi" autoFocus placeholder="Rumah Bu …" aria-invalid={fieldState.invalid} />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="tanggal"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="tanggal">Tanggal Arisan</FieldLabel>
                  <Input {...field} id="tanggal" type="date" aria-invalid={fieldState.invalid} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="pertemuan_ke"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="pertemuan_ke">Pertemuan Ke-</FieldLabel>
                  <Input {...field} id="pertemuan_ke" type="number" inputMode="numeric" min={1} aria-invalid={fieldState.invalid} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </div>
          {isEdit && (
            <div className="grid gap-4 sm:grid-cols-2">
              {winnerField('dapat1', 'Dapat 1')}
              {winnerField('dapat2', 'Dapat 2')}
            </div>
          )}
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
