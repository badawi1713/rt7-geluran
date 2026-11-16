import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Combobox } from '@/components/combobox'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { FormDialog } from '@/components/form-dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { type MeetingOption, useMeetingOptions } from '@/features/arisan-meetings/api'
import { useMemberOptions } from '@/features/master-members/api'
import { useCreateManualBill } from '@/features/transactions/api'
import type { NamedOption } from '@/lib/types'

const schema = z.object({
  anggota: z.custom<NamedOption | null>().refine((value) => value !== null, 'Diharuskan untuk memilih anggota arisan'),
  pertemuan: z.custom<MeetingOption | null>().refine((value) => value !== null, 'Diharuskan untuk memilih pertemuan arisan'),
  keterangan: z.string(),
})
type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

export function ManualBillDialog({ onClose }: { onClose: () => void }) {
  const members = useMemberOptions()
  const meetings = useMeetingOptions()
  const mutation = useCreateManualBill()
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null)

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { anggota: null, pertemuan: null, keterangan: '' },
  })

  const submit = () => {
    if (!pendingValues) return
    mutation.mutate(
      {
        anggota_id: pendingValues.anggota.id,
        pertemuan_id: pendingValues.pertemuan.id,
        keterangan: pendingValues.keterangan,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <>
      <FormDialog
        open
        onOpenChange={(open) => !open && onClose()}
        title="Tagihan Manual"
        description="Buat tagihan arisan untuk satu anggota pada pertemuan tertentu."
        formId="manual-bill-form"
        submitText="Proses"
        pending={mutation.isPending}
      >
        <form id="manual-bill-form" onSubmit={form.handleSubmit((values) => setPendingValues(values))} noValidate>
          <FieldGroup>
            <Controller
              name="anggota"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="anggota">Anggota Arisan</FieldLabel>
                  <Combobox
                    id="anggota"
                    value={field.value}
                    onChange={field.onChange}
                    options={members.data ?? []}
                    loading={members.isPending}
                    getKey={(option) => String(option.id)}
                    getLabel={(option) => option.name}
                    placeholder="Pilih anggota"
                    searchPlaceholder="Cari nama anggota…"
                    invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="pertemuan"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="pertemuan">Jadwal Pertemuan</FieldLabel>
                  <Combobox
                    id="pertemuan"
                    value={field.value}
                    onChange={field.onChange}
                    options={meetings.data ?? []}
                    loading={meetings.isPending}
                    getKey={(option) => String(option.id)}
                    getLabel={(option) => String(option.pertemuan_ke)}
                    placeholder="Pilih pertemuan"
                    searchPlaceholder="Cari pertemuan…"
                    invalid={fieldState.invalid}
                  />
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

      <ConfirmDialog
        open={pendingValues !== null}
        onOpenChange={(open) => !open && setPendingValues(null)}
        title="Proses tagihan manual?"
        description={`Tagihan arisan untuk ${pendingValues?.anggota.name ?? '-'} pada ${pendingValues?.pertemuan.pertemuan_ke ?? '-'} akan dibuat.`}
        confirmText="Proses"
        pending={mutation.isPending}
        onConfirm={submit}
      />
    </>
  )
}
