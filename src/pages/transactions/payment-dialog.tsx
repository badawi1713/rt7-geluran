import { useEffect, useMemo, useRef, useState } from 'react'
import { Kbd } from '@/components/ui/kbd'
import { toast } from 'sonner'
import { Combobox } from '@/components/combobox'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { type MemberSearchResult, useMemberSearch } from '@/features/master-members/api'
import { type UnpaidBill, usePayBills, useUnpaidBills } from '@/features/transactions/api'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { rupiah } from '@/lib/format'
import type { Id } from '@/lib/types'

const MIN_SEARCH = 3
const NO_BILLS: UnpaidBill[] = []

function billLabel(bill: UnpaidBill) {
  return `${bill.nama ?? '-'} - ${bill.pertemuan_ke ?? '-'} (${bill.periode ?? '-'}) - ${rupiah(bill.nominal)}`
}

export function PaymentDialog({ onClose }: { onClose: () => void }) {
  const [searchText, setSearchText] = useState('')
  const keyword = useDebouncedValue(searchText.trim(), 500)
  const search = useMemberSearch(keyword)

  const [member, setMember] = useState<MemberSearchResult | null>(null)
  const bills = useUnpaidBills(member?.id ?? null)
  // Every bill starts ticked, as in the original; track the ones the user unticks.
  const [unchecked, setUnchecked] = useState<Set<Id>>(new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)
  const pay = usePayBills()
  const searchRef = useRef<HTMLButtonElement>(null)

  const billList = bills.data ?? NO_BILLS
  const selected = useMemo(() => billList.filter((bill) => !unchecked.has(bill.id)), [billList, unchecked])
  const total = selected.reduce((sum, bill) => sum + (bill.nominal ?? 0), 0)
  const allChecked = billList.length > 0 && selected.length === billList.length

  const selectMember = (next: MemberSearchResult | null) => {
    setMember(next)
    setUnchecked(new Set())
  }

  const toggle = (id: Id, checked: boolean) =>
    setUnchecked((current) => {
      const next = new Set(current)
      if (checked) next.delete(id)
      else next.add(id)
      return next
    })

  const requestPayment = () => {
    if (billList.length === 0) return toast.error('Silakan cari dan pilih anggota terlebih dahulu.')
    if (selected.length === 0) return toast.error('Silakan centang minimal 1 dari daftar pembayaran.')
    setConfirmOpen(true)
  }

  const confirmPayment = () =>
    pay.mutate(
      { id: selected.map((bill) => bill.id) },
      {
        onSuccess: () => {
          // Stay open so the next member can be paid straight away.
          setConfirmOpen(false)
          selectMember(null)
          setTimeout(() => searchRef.current?.focus(), 300)
        },
      },
    )

  // Keyboard flow: pick a member with Enter, focus lands on the bill list, Space toggles, Enter pays.
  const listRef = useRef<HTMLDivElement>(null)
  const hasBills = billList.length > 0
  useEffect(() => {
    if (!member || !hasBills) return
    // Wait for the combobox popover to finish returning focus to its trigger.
    const timer = setTimeout(() => document.getElementById('bill-all')?.focus(), 50)
    return () => clearTimeout(timer)
  }, [member, hasBills])

  const onListKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      requestPayment()
      return
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    const boxes = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[role="checkbox"]') ?? [])
    const index = boxes.indexOf(document.activeElement as HTMLElement)
    if (index === -1) return
    event.preventDefault()
    if (event.key === 'ArrowDown') boxes[Math.min(index + 1, boxes.length - 1)]?.focus()
    else if (index === 0) searchRef.current?.focus()
    else boxes[index - 1]?.focus()
  }

  const searchHint =
    searchText.trim().length < MIN_SEARCH
      ? `Ketik minimal ${MIN_SEARCH} karakter untuk mencari anggota.`
      : 'Anggota tidak ditemukan.'

  return (
    <Dialog open onOpenChange={(open) => !open && !pay.isPending && onClose()}>
      <DialogContent className="flex max-h-[90dvh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bayar Arisan</DialogTitle>
          <DialogDescription>
            Cari anggota, centang tagihan yang dibayar, lalu tekan Bayar.
            <span className="hidden md:inline">
              {' '}Keyboard: <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> pindah, <Kbd>Spasi</Kbd> centang, <Kbd>Enter</Kbd> bayar, <Kbd>Esc</Kbd> tutup.
            </span>
          </DialogDescription>
        </DialogHeader>

        <Field>
          <FieldLabel htmlFor="search-member">Cari data anggota</FieldLabel>
          <Combobox
            id="search-member"
            triggerRef={searchRef}
            value={member}
            onChange={selectMember}
            options={keyword.length >= MIN_SEARCH ? (search.data ?? []) : []}
            loading={search.isFetching}
            getKey={(option) => String(option.id)}
            getLabel={(option) => option.nama}
            placeholder="Pilih anggota"
            searchPlaceholder="Ketik nama anggota…"
            emptyText={searchHint}
            onSearchChange={setSearchText}
          />
          <FieldDescription>Minimal {MIN_SEARCH} karakter.</FieldDescription>
        </Field>

        <Separator />

        <div ref={listRef} className="-mx-1 min-h-32 flex-1 overflow-y-auto px-1 py-1" onKeyDown={onListKeyDown}>
          {!member ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Belum ada tagihan. Cari dan pilih anggota terlebih dahulu.
            </p>
          ) : bills.isPending ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          ) : billList.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {member.nama} tidak memiliki tagihan yang belum dibayar.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex min-h-10 items-center gap-3">
                <Checkbox
                  id="bill-all"
                  checked={allChecked ? true : selected.length > 0 ? 'indeterminate' : false}
                  onCheckedChange={(checked) =>
                    setUnchecked(checked === true ? new Set() : new Set(billList.map((bill) => bill.id)))
                  }
                />
                <Label htmlFor="bill-all" className="flex-1 self-stretch font-semibold">
                  Pilih semua ({billList.length})
                </Label>
              </div>
              <ul className="ml-7 flex flex-col">
                {billList.map((bill) => (
                  <li key={bill.id} className="flex min-h-10 items-center gap-3">
                    <Checkbox
                      id={`bill-${bill.id}`}
                      checked={!unchecked.has(bill.id)}
                      onCheckedChange={(checked) => toggle(bill.id, checked === true)}
                    />
                    <Label htmlFor={`bill-${bill.id}`} className="flex-1 self-stretch font-normal tabular-nums">
                      {billLabel(bill)}
                    </Label>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-baseline justify-between gap-2 text-sm sm:justify-start">
            Total: <span className="text-base font-semibold tabular-nums">{rupiah(total)}</span>
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button variant="outline" onClick={onClose} disabled={pay.isPending}>
              Tutup
            </Button>
            <Button onClick={requestPayment} disabled={pay.isPending}>
              Bayar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Bayar arisan?"
        description={`${selected.length} tagihan atas nama ${member?.nama ?? '-'} sebesar ${rupiah(total)} akan ditandai lunas.`}
        confirmText="Bayar"
        pending={pay.isPending}
        onConfirm={confirmPayment}
      />
    </Dialog>
  )
}

