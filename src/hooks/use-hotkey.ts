import { useEffect, useRef } from 'react'

export interface Hotkey {
  /** `KeyboardEvent.code`, e.g. 'KeyN' or 'Slash'. Using `code` keeps Alt+key working on macOS. */
  code: string
  alt?: boolean
}

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/** Page-level shortcut. Ignored while a dialog is open; plain keys are also ignored while typing. */
export function useHotkey(hotkey: Hotkey, handler: () => void, enabled = true) {
  const handlerRef = useRef(handler)
  useEffect(() => {
    handlerRef.current = handler
  })

  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== hotkey.code || event.altKey !== !!hotkey.alt) return
      if (event.ctrlKey || event.metaKey) return
      if (!hotkey.alt && isTyping(event.target)) return
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return
      event.preventDefault()
      handlerRef.current()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [hotkey.code, hotkey.alt, enabled])
}

export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
export const altLabel = isMac ? '⌥' : 'Alt'
