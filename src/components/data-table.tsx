import { useId } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PAGE_SIZE_OPTIONS } from '@/hooks/use-list-params'
import { getErrorMessage } from '@/lib/api'
import type { ListParams } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface Column<T> {
  header: string
  cell: (row: T, rowNumber: number) => React.ReactNode
  align?: 'left' | 'center' | 'right'
  className?: string
  /**
   * Phone layout (below md), where each row becomes a card:
   * 'title' heads the card, 'badge' sits beside the title, 'actions' goes to the card footer,
   * 'hide' is left out (e.g. the row number), anything else is a label/value line.
   */
  mobile?: 'title' | 'badge' | 'actions' | 'hide'
}

interface DataTableProps<T> {
  /** Names what the rows are, for screen readers ("Daftar anggota"). */
  label: string
  columns: Column<T>[]
  rows: T[]
  total: number
  params: ListParams
  onParamsChange: (next: Partial<ListParams>) => void
  getRowKey: (row: T) => React.Key
  isLoading: boolean
  isFetching?: boolean
  error: unknown
  onRetry: () => void
}

const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' }

export function DataTable<T>({
  label,
  columns,
  rows,
  total,
  params,
  onParamsChange,
  getRowKey,
  isLoading,
  isFetching,
  error,
  onRetry,
}: DataTableProps<T>) {
  const offset = params.page * params.size
  const refreshing = isFetching && !isLoading

  let state: React.ReactNode = null
  if (error && !isLoading) {
    state = (
      <>
        <p className="text-destructive">{getErrorMessage(error)}</p>
        <Button variant="outline" className="mt-3" onClick={onRetry}>
          Coba lagi
        </Button>
      </>
    )
  } else if (!isLoading && rows.length === 0) {
    state = (
      <p className="text-muted-foreground">
        {params.search ? `Tidak ada data yang cocok dengan "${params.search}".` : 'Belum ada data.'}
      </p>
    )
  }

  let body: React.ReactNode
  if (isLoading) {
    body = Array.from({ length: 5 }, (_, i) => (
      <TableRow key={i}>
        {columns.map((column) => (
          <TableCell key={column.header}>
            <Skeleton className="h-4 w-full max-w-32" />
          </TableCell>
        ))}
      </TableRow>
    ))
  } else if (state) {
    body = <StateRow colSpan={columns.length}>{state}</StateRow>
  } else {
    body = rows.map((row, index) => (
      <TableRow key={getRowKey(row)}>
        {columns.map((column) => (
          <TableCell
            key={column.header}
            className={cn(alignClass[column.align ?? 'left'], column.className)}
          >
            {column.cell(row, offset + index + 1)}
          </TableCell>
        ))}
      </TableRow>
    ))
  }

  return (
    <section aria-label={label} aria-busy={isLoading || isFetching} className="flex min-w-0 flex-col gap-3">
      {/* Phones: one card per row, no sideways scrolling. */}
      <div className={cn('md:hidden', refreshing && 'opacity-60')}>
        {isLoading ? (
          <ul className="flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <li key={i} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </li>
            ))}
          </ul>
        ) : state ? (
          <div className="rounded-xl border bg-card px-4 py-10 text-center">{state}</div>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((row, index) => (
              <li key={getRowKey(row)}>
                <RowCard row={row} rowNumber={offset + index + 1} columns={columns} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Tablet and up: the full table. */}
      <div className="hidden min-w-0 overflow-hidden rounded-xl border bg-card md:block">
        <div className={cn('overflow-x-auto transition-opacity', refreshing && 'opacity-60')}>
          <Table className="whitespace-nowrap">
            <TableHeader className="bg-muted/60">
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column.header}
                    className={cn('h-11 font-semibold', alignClass[column.align ?? 'left'])}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>{body}</TableBody>
          </Table>
        </div>
      </div>

      <TablePagination total={total} params={params} onParamsChange={onParamsChange} />
    </section>
  )
}

function RowCard<T>({ row, rowNumber, columns }: { row: T; rowNumber: number; columns: Column<T>[] }) {
  const pick = (kind: Column<T>['mobile']) => columns.filter((column) => column.mobile === kind)
  const fields = columns.filter((column) => !column.mobile)
  const [title] = pick('title')
  const badges = pick('badge')
  const actions = pick('actions')

  return (
    <article className="rounded-xl border bg-card p-4">
      {(title || badges.length > 0) && (
        <header className="flex items-start justify-between gap-3">
          {title && <h3 className="min-w-0 font-semibold break-words">{title.cell(row, rowNumber)}</h3>}
          {badges.map((column) => (
            <div key={column.header} className="shrink-0">
              {column.cell(row, rowNumber)}
            </div>
          ))}
        </header>
      )}
      {fields.length > 0 && (
        <dl className="mt-3 grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-3 gap-y-1.5 text-sm">
          {fields.map((column) => (
            <div key={column.header} className="contents">
              <dt className="text-muted-foreground">{column.header}</dt>
              <dd className="min-w-0 break-words tabular-nums">{column.cell(row, rowNumber)}</dd>
            </div>
          ))}
        </dl>
      )}
      {actions.length > 0 && (
        <footer className="mt-3 flex justify-end border-t pt-2">
          {actions.map((column) => (
            <div key={column.header}>{column.cell(row, rowNumber)}</div>
          ))}
        </footer>
      )}
    </article>
  )
}

function StateRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="py-12 text-center whitespace-normal">
        {children}
      </TableCell>
    </TableRow>
  )
}

function TablePagination({
  total,
  params,
  onParamsChange,
}: Pick<DataTableProps<unknown>, 'total' | 'params' | 'onParamsChange'>) {
  const lastPage = Math.max(0, Math.ceil(total / params.size) - 1)
  const from = total === 0 ? 0 : params.page * params.size + 1
  const to = Math.min(total, (params.page + 1) * params.size)
  const goTo = (page: number) => onParamsChange({ page })
  const sizeLabelId = useId()

  return (
    <nav
      aria-label="Halaman data"
      className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-end sm:gap-6"
    >
      <div className="flex items-center justify-between gap-2 sm:justify-start">
        <span id={sizeLabelId} className="text-muted-foreground">
          Baris per halaman
        </span>
        <Select
          value={String(params.size)}
          onValueChange={(value) => onParamsChange({ size: Number(value), page: 0 })}
        >
          <SelectTrigger size="sm" className="w-18" aria-labelledby={sizeLabelId}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="tabular-nums" aria-live="polite">
          {from}–{to} dari {total}
        </span>
        <div className="flex gap-1">
          <Button variant="outline" size="icon-sm" aria-label="Halaman pertama" disabled={params.page === 0} onClick={() => goTo(0)}>
            <ChevronsLeftIcon />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Halaman sebelumnya" disabled={params.page === 0} onClick={() => goTo(params.page - 1)}>
            <ChevronLeftIcon />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Halaman berikutnya" disabled={params.page >= lastPage} onClick={() => goTo(params.page + 1)}>
            <ChevronRightIcon />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Halaman terakhir" disabled={params.page >= lastPage} onClick={() => goTo(lastPage)}>
            <ChevronsRightIcon />
          </Button>
        </div>
      </div>
    </nav>
  )
}
