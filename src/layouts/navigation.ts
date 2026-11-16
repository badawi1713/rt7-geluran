import { CalendarDaysIcon, FileTextIcon, ReceiptIcon, UsersIcon, UsersRoundIcon, type LucideIcon } from 'lucide-react'

export interface NavItem {
  title: string
  to: string
  icon: LucideIcon
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  { title: 'Master', items: [{ title: 'Anggota', to: '/master/anggota', icon: UsersIcon }] },
  {
    title: 'Arisan',
    items: [
      { title: 'Anggota Arisan', to: '/arisan/daftar-anggota', icon: UsersRoundIcon },
      { title: 'Pertemuan Arisan', to: '/arisan/daftar-pertemuan', icon: CalendarDaysIcon },
    ],
  },
  { title: 'Transaksi', items: [{ title: 'Arisan', to: '/transaksi/arisan', icon: ReceiptIcon }] },
  { title: 'Laporan', items: [{ title: 'Laporan Arisan', to: '/laporan/arisan', icon: FileTextIcon }] },
]
