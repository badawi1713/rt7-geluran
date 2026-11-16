import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

interface ComboboxProps<T> {
  id?: string
  triggerRef?: React.Ref<HTMLButtonElement>
  value: T | null
  onChange: (value: T | null) => void
  options: T[]
  getKey: (option: T) => string
  getLabel: (option: T) => string
  placeholder: string
  searchPlaceholder?: string
  emptyText?: string
  loading?: boolean
  invalid?: boolean
  clearable?: boolean
  /** Server-side search: called with the typed text, and local filtering is turned off. */
  onSearchChange?: (text: string) => void
}

export function Combobox<T>({
  id,
  triggerRef,
  value,
  onChange,
  options,
  getKey,
  getLabel,
  placeholder,
  searchPlaceholder = 'Cari…',
  emptyText = 'Tidak ada data.',
  loading,
  invalid,
  clearable,
  onSearchChange,
}: ComboboxProps<T>) {
  const [open, setOpen] = useState(false)
  const selectedKey = value ? getKey(value) : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              setOpen(true)
            }
          }}
          className={cn(
            'w-full justify-between font-normal aria-invalid:border-destructive',
            !value && 'text-muted-foreground',
          )}
        >
          <span className="truncate">{value ? getLabel(value) : placeholder}</span>
          <ChevronsUpDownIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command shouldFilter={!onSearchChange}>
          <CommandInput placeholder={searchPlaceholder} onValueChange={onSearchChange} />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Spinner /> Memuat data
              </div>
            ) : (
              <CommandEmpty>{emptyText}</CommandEmpty>
            )}
            {!loading && (
              <CommandGroup>
                {clearable && value && (
                  <CommandItem
                    value="__clear__"
                    onSelect={() => {
                      onChange(null)
                      setOpen(false)
                    }}
                    className="text-muted-foreground"
                  >
                    Kosongkan pilihan
                  </CommandItem>
                )}
                {options.map((option) => {
                  const key = getKey(option)
                  return (
                    <CommandItem
                      key={key}
                      // cmdk filters on `value`; include the label so typing a name matches.
                      value={`${getLabel(option)} ${key}`}
                      onSelect={() => {
                        onChange(option)
                        setOpen(false)
                      }}
                    >
                      <span className="truncate">{getLabel(option)}</span>
                      <CheckIcon className={cn('ml-auto', key === selectedKey ? 'opacity-100' : 'opacity-0')} />
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
