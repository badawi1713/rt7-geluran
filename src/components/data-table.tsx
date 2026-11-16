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
}

interface DataTableProps<T> {
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
  } else if (error) {
    body = (
      <StateRow colSpan={columns.length}>
        <p className="text-destructive">{getErrorMessage(error)}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          Coba lagi
        </Button>
      </StateRow>
    )
  } else if (rows.length === 0) {
    body = (
      <StateRow colSpan={columns.length}>
        <p className="text-muted-foreground">
          {params.search ? `Tidak ada data yang cocok dengan "${params.search}".` : 'Belum ada data.'}
        </p>
      </StateRow>
    )
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
    <div className="overflow-hidden rounded-xl border bg-card">
      <div
        className={cn('overflow-x-auto transition-opacity', isFetching && !isLoading && 'opacity-60')}
        aria-busy={isFetching}
      >
        <Table className="whitespace-nowrap">
          <TableHeader className="bg-muted/50">
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
      <TablePagination total={total} params={params} onParamsChange={onParamsChange} />
    </div>
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

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-end sm:gap-6">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Baris per halaman</span>
        <Select
          value={String(params.size)}
          onValueChange={(value) => onParamsChange({ size: Number(value), page: 0 })}
        >
          <SelectTrigger size="sm" className="w-18" aria-label="Baris per halaman">
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
        <span className="tabular-nums">
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
    </div>
  )
}
