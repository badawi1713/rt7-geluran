import { useEffect } from 'react'
import { Link, Navigate, Outlet, createBrowserRouter, useLocation, useRouteError } from 'react-router'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/features/auth/auth-provider'
import { AppLayout } from '@/layouts/app-layout'
import { ArisanMeetingsPage } from '@/pages/arisan-meetings-page'
import { ArisanMembersPage } from '@/pages/arisan-members-page'
import { HomePage } from '@/pages/home-page'
import { MasterMembersPage } from '@/pages/master-members-page'
import { ReportsPage } from '@/pages/reports-page'
import { SignInPage } from '@/pages/sign-in-page'
import { TransactionsPage } from '@/pages/transactions/transactions-page'

function FullScreenLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center gap-2 text-sm text-muted-foreground">
      <Spinner /> Memeriksa sesi…
    </div>
  )
}

/** Guests (including anyone whose token just expired) are sent to sign-in, remembering where they were. */
function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'checking') return <FullScreenLoader />
  if (status === 'guest') {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname + location.search }} />
  }
  return <Outlet />
}

function SignOutRoute() {
  const { status, signOut } = useAuth()
  useEffect(() => {
    if (status === 'authenticated') signOut()
  }, [status, signOut])
  return status === 'authenticated' ? <FullScreenLoader /> : <Navigate to="/sign-in" replace />
}

function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-semibold tracking-tight">404</p>
      <p className="text-muted-foreground">Halaman yang dicari tidak ditemukan.</p>
      <Button asChild variant="outline">
        <Link to="/beranda">Kembali ke beranda</Link>
      </Button>
    </div>
  )
}

function RouteError() {
  const error = useRouteError()
  if (import.meta.env.DEV) console.error(error)
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-2xl font-semibold tracking-tight">Terjadi kesalahan</p>
      <p className="max-w-md text-muted-foreground">
        Halaman ini gagal ditampilkan. Coba muat ulang; jika masih terjadi, hubungi pengurus.
      </p>
      <div className="flex gap-2">
        <Button onClick={() => window.location.reload()}>Muat ulang</Button>
        <Button asChild variant="outline">
          <Link to="/beranda">Ke beranda</Link>
        </Button>
      </div>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    children: [
      { path: '/sign-in', element: <SignInPage /> },
      { path: '/sign-out', element: <SignOutRoute /> },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { index: true, element: <Navigate to="/beranda" replace /> },
              { path: 'beranda', element: <HomePage /> },
              { path: 'master/anggota', element: <MasterMembersPage /> },
              { path: 'arisan/daftar-anggota', element: <ArisanMembersPage /> },
              { path: 'arisan/daftar-pertemuan', element: <ArisanMeetingsPage /> },
              { path: 'transaksi/arisan', element: <TransactionsPage /> },
              { path: 'laporan/arisan', element: <ReportsPage /> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
])
