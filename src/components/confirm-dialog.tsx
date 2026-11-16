import { useRef } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Spinner } from '@/components/ui/spinner'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: React.ReactNode
  confirmText: string
  pendingText?: string
  pending?: boolean
  destructive?: boolean
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  pendingText = 'Memproses…',
  pending,
  destructive,
  onConfirm,
}: ConfirmDialogProps) {
  const actionRef = useRef<HTMLButtonElement>(null)
  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <AlertDialogContent
        // Non-destructive: Enter confirms straight away. Destructive: focus stays on Batal.
        onOpenAutoFocus={(event) => {
          if (destructive) return
          event.preventDefault()
          actionRef.current?.focus()
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
          <AlertDialogAction
            ref={actionRef}
            variant={destructive ? 'destructive' : 'default'}
            disabled={pending}
            onClick={(event) => {
              // Keep the dialog open until the request settles.
              event.preventDefault()
              onConfirm()
            }}
          >
            {pending && <Spinner />}
            {pending ? pendingText : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
