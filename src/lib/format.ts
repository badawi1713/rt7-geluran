export function currencyFormat(value = 0) {
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(value)
}

export function rupiah(value?: number | null) {
  return `Rp${currencyFormat(value ?? 0)}`
}

/** Today as YYYY-MM-DD in local time, for `<input type="date">`. */
export function todayISO() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

/** The API returns meeting dates as DD-MM-YYYY; date inputs need YYYY-MM-DD. */
export function ddmmyyyyToISO(value?: string | null) {
  if (!value) return todayISO()
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value)
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value
}
