import { CloudIcon, MoonIcon, SunIcon } from 'lucide-react'
import { Link } from 'react-router'
import { useAuth } from '@/features/auth/auth-provider'
import { navGroups } from '@/layouts/navigation'

function greeting(hour: number) {
  if (hour >= 3 && hour < 12) return { text: 'Selamat Pagi', Icon: SunIcon }
  if (hour >= 12 && hour < 15) return { text: 'Selamat Siang', Icon: CloudIcon }
  if (hour >= 15 && hour < 19) return { text: 'Selamat Sore', Icon: CloudIcon }
  return { text: 'Selamat Malam', Icon: MoonIcon }
}

export function HomePage() {
  const { user } = useAuth()
  const { text, Icon } = greeting(new Date().getHours())

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-2xl bg-primary px-6 py-10 text-primary-foreground sm:px-10 sm:py-14">
        <p className="flex items-center gap-2 text-lg font-medium opacity-90">
          {text} <Icon className="size-5" aria-hidden />
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-5xl">{user?.displayName}</h1>
        <p className="mt-4 max-w-xl opacity-85">
          Terima kasih sudah mengunjungi situs dashboard RT 7 Geluran, Sidoarjo.
        </p>
      </section>

      <section aria-labelledby="shortcuts" className="flex flex-col gap-3">
        <h2 id="shortcuts" className="text-sm font-medium text-muted-foreground">
          Menu
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {navGroups.flatMap((group) =>
            group.items.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <item.icon className="size-4" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-medium">{item.title}</span>
                    <span className="block text-xs text-muted-foreground">{group.title}</span>
                  </span>
                </Link>
              </li>
            )),
          )}
        </ul>
      </section>
    </div>
  )
}
