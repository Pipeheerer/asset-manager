'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/app/providers'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { 
  LayoutDashboard, 
  Package, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  PlusCircle,
  AlertCircle,
  ClipboardList,
  User
} from 'lucide-react'

interface UserSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: LayoutDashboard,
    description: 'Your overview'
  },
  { 
    name: 'Assets', 
    href: '/dashboard/my-assets', 
    icon: Package,
    description: 'Assets assigned to you'
  },
  { 
    name: 'Request Asset', 
    href: '/dashboard/requests', 
    icon: PlusCircle,
    description: 'Request new assets'
  },
  { 
    name: 'Report Issue', 
    href: '/dashboard/issues', 
    icon: AlertCircle,
    description: 'Report problems'
  },
]

const bottomNavigation = [
  { 
    name: 'My Profile', 
    href: '/dashboard/profile', 
    icon: User,
    description: 'Your profile settings'
  },
]

export function UserSidebar({ collapsed, onToggle }: UserSidebarProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const NavItem = ({ item }: { item: typeof navigation[0] }) => {
    const isActive = pathname === item.href || 
      (item.href !== '/dashboard' && pathname.startsWith(item.href))
    
    const content = (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          "hover:bg-white/10 hover:text-white",
          isActive 
            ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/25" 
            : "text-gray-300",
          collapsed && "justify-center px-2"
        )}
      >
        <item.icon className={cn(
          "shrink-0 transition-transform duration-200",
          collapsed ? "h-5 w-5" : "h-5 w-5",
          isActive && "scale-110"
        )} />
        {!collapsed && (
          <span className="truncate">{item.name}</span>
        )}
      </Link>
    )

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            <span>{item.name}</span>
            <span className="text-xs text-muted-foreground">{item.description}</span>
          </TooltipContent>
        </Tooltip>
      )
    }

    return content
  }

  return (
    <TooltipProvider>
      <aside className={cn(
        "flex h-screen flex-col border-r border-gray-800 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}>
        {/* Logo Section */}
        <div className={cn(
          "flex h-16 items-center border-b border-gray-800 px-4",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">Asset Manager</span>
                <span className="text-xs text-gray-400">Employee Portal</span>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
              <Shield className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn(
            "absolute -right-3 top-20 z-50 h-6 w-6 rounded-full border border-gray-700 bg-gray-800 text-gray-400 shadow-md hover:bg-gray-700 hover:text-white",
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>

        {/* Main Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {!collapsed && (
              <span className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Quick Access
              </span>
            )}
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </nav>
        </ScrollArea>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 p-3">
          <nav className="flex flex-col gap-1">
            {bottomNavigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </nav>

          {/* User Profile */}
          <div className={cn(
            "mt-3 flex items-center gap-3 rounded-lg bg-gray-800/50 p-2",
            collapsed && "justify-center"
          )}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-sm font-medium text-white">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-white">
                  {user?.email?.split('@')[0]}
                </p>
                <p className="text-xs text-gray-400">Employee</p>
              </div>
            )}
          </div>

          {/* Sign Out Button */}
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={signOut}
                  className="mt-2 w-full text-gray-400 hover:bg-red-500/10 hover:text-red-400"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="mt-2 w-full justify-start text-gray-400 hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
