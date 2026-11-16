import { Badge } from '@/components/ui/badge'

/** Green for "Sudah dapat"/"Sudah bayar", red for "Belum …", neutral when the API sends nothing. */
export function StatusBadge({ status }: { status?: string | null }) {
  const text = status?.trim()
  if (!text) return <Badge variant="outline">Tidak ada status</Badge>

  const lower = text.toLowerCase()
  if (lower.startsWith('sudah')) {
    return <Badge className="bg-success/15 text-success">{text}</Badge>
  }
  if (lower.startsWith('belum')) {
    return <Badge variant="destructive">{text}</Badge>
  }
  return <Badge variant="secondary">{text}</Badge>
}
