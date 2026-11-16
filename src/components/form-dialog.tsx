import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'

interface FormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  formId: string
  pending?: boolean
  submitText?: string
  pendingText?: string
  children: React.ReactNode
}

/** Dialog with a form body; the submit button targets the form by id. */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  formId,
  pending,
  submitText = 'Simpan',
  pendingText = 'Menyimpan…',
  children,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Tutup
          </Button>
          <Button type="submit" form={formId} disabled={pending}>
            {pending && <Spinner />}
            {pending ? pendingText : submitText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
