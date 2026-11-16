import { ChevronsUpDownIcon, HomeIcon, LogOutIcon } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Kbd } from '@/components/ui/kbd'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAuth } from '@/features/auth/auth-provider'
import { isMac } from '@/hooks/use-hotkey'
import { BrandMark } from '@/components/brand'
import { ThemeToggle } from '@/components/theme-toggle'
import { navGroups } from './navigation'

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function NavButton({ to, icon: Icon, title }: { to: string; icon: React.ComponentType; title: string }) {
  const { pathname } = useLocation()
  const { setOpenMobile } = useSidebar()
  return (
    <SidebarMenuButton asChild isActive={pathname.startsWith(to)} tooltip={title}>
      <NavLink to={to} onClick={() => setOpenMobile(false)}>
        <Icon />
        <span>{title}</span>
      </NavLink>
    </SidebarMenuButton>
  )
}

function AppSidebar() {
  const { user, signOut } = useAuth()
  const name = user?.displayName ?? 'Pengguna'

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/beranda">
                <BrandMark />
                <span className="grid leading-tight">
                  <span className="truncate font-semibold">RT 7 Geluran</span>
                  <span className="truncate text-xs text-muted-foreground">Taman, Sidoarjo</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <NavButton to="/beranda" icon={HomeIcon} title="Beranda" />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {navGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <NavButton to={item.to} icon={item.icon} title={item.title} />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">{initials(name)}</AvatarFallback>
                  </Avatar>
                  <span className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-medium">{name}</span>
                    {user?.role[0] && (
                      <span className="truncate text-xs text-muted-foreground capitalize">{user.role[0]}</span>
                    )}
                  </span>
                  <ChevronsUpDownIcon className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-(--radix-dropdown-menu-trigger-width) min-w-48">
                <DropdownMenuLabel className="font-normal">
                  <span className="block font-medium">{name}</span>
                  {user?.email && <span className="block text-xs text-muted-foreground">{user.email}</span>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={signOut}>
                  <LogOutIcon aria-hidden /> Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

export function AppLayout() {
  return (
    <SidebarProvider>
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-background px-3 py-2 text-sm font-medium shadow focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Lewati ke konten
      </a>
      <AppSidebar />
      <SidebarInset className="min-w-0 lg:h-svh lg:overflow-hidden">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background px-2 pt-[env(safe-area-inset-top)] sm:px-4">
          <SidebarTrigger aria-label="Buka atau tutup menu" className="size-10" />
          <Separator orientation="vertical" className="hidden h-4 md:block" />
          <Link to="/beranda" className="flex items-center gap-2 rounded-md px-1 md:hidden">
            <BrandMark className="size-6" />
            <span className="font-semibold">RT 7 Geluran</span>
          </Link>
          <span className="hidden text-sm text-muted-foreground md:inline">Arisan RT 7 Geluran</span>
          <span className="ml-auto hidden items-center gap-1.5 text-xs text-muted-foreground lg:flex">
            <Kbd>/</Kbd> cari
            <Kbd className="ml-2">{isMac ? '⌘' : 'Ctrl'}B</Kbd> menu
          </span>
          <ThemeToggle className="ml-auto size-10 lg:ml-2" />
        </header>
        <div
          id="main-content"
          tabIndex={-1}
          className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pt-5 pb-[calc(2rem+env(safe-area-inset-bottom))] outline-none sm:px-6 lg:min-h-0 lg:overflow-y-auto lg:py-6"
        >
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
