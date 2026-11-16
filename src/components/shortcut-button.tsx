import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { altLabel, useHotkey } from '@/hooks/use-hotkey'

interface ShortcutButtonProps extends Omit<React.ComponentProps<typeof Button>, 'onClick'> {
  /** Letter for the Alt+letter shortcut, e.g. "N". */
  shortcut: string
  onClick: () => void
}

/** Button that also fires on Alt+<letter> and shows the shortcut. */
export function ShortcutButton({ shortcut, onClick, children, ...props }: ShortcutButtonProps) {
  const key = shortcut.toUpperCase()
  useHotkey({ code: `Key${key}`, alt: true }, onClick)

  return (
    <Button onClick={onClick} aria-keyshortcuts={`Alt+${key}`} {...props}>
      {children}
      <Kbd className="ml-1 hidden bg-current/15 text-current sm:inline-flex">
        {altLabel}
        {key}
      </Kbd>
    </Button>
  )
}
