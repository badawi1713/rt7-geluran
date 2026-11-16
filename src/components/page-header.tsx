import { SearchIcon, XIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { Kbd } from '@/components/ui/kbd'
import { useHotkey } from '@/hooks/use-hotkey'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'

interface PageHeaderProps {
  title: string
  description?: string
  search: string
  onSearch: (value: string) => void
  children?: React.ReactNode
}

/** Title, a submit-to-search box and the page's action buttons. */
export function PageHeader({ title, description, search, onSearch, children }: PageHeaderProps) {
  const [draft, setDraft] = useState(search)
  // Keep the box in sync when the URL's search changes (back button, reset).
  const [syncedSearch, setSyncedSearch] = useState(search)
  if (search !== syncedSearch) {
    setSyncedSearch(search)
    setDraft(search)
  }
  const inputRef = useRef<HTMLInputElement>(null)
  useHotkey({ code: 'Slash' }, () => inputRef.current?.focus())

  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <form
          role="search"
          className="w-full sm:w-64"
          onSubmit={(event) => {
            event.preventDefault()
            onSearch(draft.trim())
          }}
        >
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              ref={inputRef}
              aria-keyshortcuts="/"
              onKeyDown={(event) => {
                if (event.key === 'Escape') event.currentTarget.blur()
              }}
              aria-label={`Cari ${title.toLowerCase()}`}
              placeholder="Cari nama, tekan Enter"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            {!draft && (
              <InputGroupAddon align="inline-end" className="hidden sm:flex">
                <Kbd>/</Kbd>
              </InputGroupAddon>
            )}
            {draft && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  aria-label="Hapus pencarian"
                  onClick={() => {
                    setDraft('')
                    onSearch('')
                  }}
                >
                  <XIcon />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>
        </form>
        {children && <div className="flex gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">{children}</div>}
      </div>
    </header>
  )
}

