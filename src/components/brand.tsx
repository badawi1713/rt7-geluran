import { cn } from '@/lib/utils'

/** The RT logo from the original app (red stripes forming a 7 around "RT"). */
export function BrandMark({ className }: { className?: string }) {
  return <img src="/logo.svg" alt="" width={32} height={32} className={cn('size-8 shrink-0', className)} />
}

/**
 * Identity motif: the logo's three stepped stripes, drawn small beside headings.
 * It ties every screen back to the RT 7 mark without repeating the full logo.
 */
export function Stripes({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn('inline-flex w-4 shrink-0 flex-col gap-[3px]', className)}>
      <span className="h-[3px] w-full rounded-full bg-brand" />
      <span className="h-[3px] w-3/4 rounded-full bg-brand" />
      <span className="h-[3px] w-1/2 rounded-full bg-brand" />
    </span>
  )
}
