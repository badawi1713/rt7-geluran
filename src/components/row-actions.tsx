import { PencilIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface RowActionsProps {
  label: string
  /** Leave out for rows that can only be deleted. */
  onEdit?: () => void
  onDelete: () => void
  disabled?: boolean
}

export function RowActions({ label, onEdit, onDelete, disabled }: RowActionsProps) {
  return (
    <div className="flex justify-center gap-1">
      {onEdit && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`Edit ${label}`} onClick={onEdit} disabled={disabled}>
              <PencilIcon aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit</TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Hapus ${label}`}
            onClick={onDelete}
            disabled={disabled}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2Icon aria-hidden />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Hapus</TooltipContent>
      </Tooltip>
    </div>
  )
}
