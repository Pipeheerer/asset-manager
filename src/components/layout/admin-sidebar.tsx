'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/app/providers'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Tags, 
  Building2, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  FileText,
  Shield,
  Wrench,
  ClipboardList,
  AlertCircle
} from 'lucide-react'

interface AdminSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

interface NavItem {
  name: string
  href: string
  icon: any
  description: string
  adminOnly?: boolean
  badgeKey?: 'requests' | 'issues'
}

const navigation: NavItem[] = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: LayoutDashboard,
    description: 'Overview and analytics'
  },
  { 
    name: 'Assets', 
    href: '/dashboard/assets', 
    icon: Package,
    description: 'Manage all assets'
  },
  { 
    name: 'Users', 
    href: '/dashboard/users', 
    icon: Users, 
    adminOnly: true,
    description: 'User management'
  },
  { 
    name: 'Categories', 
    href: '/dashboard/categories', 
    icon: Tags, 
    adminOnly: true,
    description: 'Asset categories'
  },
  { 
    name: 'Departments', 
    href: '/dashboard/departments', 
    icon: Building2, 
    adminOnly: true,
    description: 'Department management'
  },
  { 
    name: 'Maintenance', 
    href: '/dashboard/maintenance', 
    icon: Wrench, 
    adminOnly: true,
    description: 'Asset maintenance'
  },
  { 
    name: 'Requests', 
    href: '/dashboard/admin/requests', 
    icon: ClipboardList, 
    adminOnly: true,
    description: 'Manage user requests',
    badgeKey: 'requests'
  },
  { 
    name: 'Issues', 
    href: '/dashboard/admin/issues', 
    icon: AlertCircle, 
    adminOnly: true,
    description: 'Manage issue reports',
    badgeKey: 'issues'
  },
  { 
    name: 'Reports', 
    href: '/dashboard/reports', 
    icon: BarChart3, 
    adminOnly: true,
    description: 'Analytics & reports'
  },
  { 
    name: 'Activity Log', 
    href: '/dashboard/activity', 
    icon: FileText, 
    adminOnly: true,
    description: 'Audit trail'
  },
]

const bottomNavigation: NavItem[] = [
  { 
    name: 'Settings', 
    href: '/dashboard/settings', 
    icon: Settings,
    description: 'App settings'
  },
]

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const pathname = usePathname()
  const { user, role, signOut } = useAuth()
  const [pendingCounts, setPendingCounts] = useState({ requests: 0, issues: 0 })

  // Fetch pending requests and issues counts
  const fetchPendingCounts = useCallback(async () => {
    if (role !== 'admin') return
    
    try {
      const [requestsResult, issuesResult] = await Promise.all([
        supabase
          .from('asset_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('issue_reports')
          .select('*', { count: 'exact', head: true })
          .in('status', ['open', 'in_progress'])
      ])
      
      setPendingCounts({
        requests: requestsResult.count || 0,
        issues: issuesResult.count || 0
      })
    } catch (error) {
      console.error('Error fetching pending counts:', error)
    }
  }, [role])

  useEffect(() => {
    fetchPendingCounts()
    
    // Set up real-time subscriptions
    const requestsChannel = supabase
      .channel('sidebar-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'asset_requests' }, fetchPendingCounts)
      .subscribe()
    
    const issuesChannel = supabase
      .channel('sidebar-issues')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issue_reports' }, fetchPendingCounts)
      .subscribe()
    
    // Polling fallback every 60 seconds
    const pollInterval = setInterval(fetchPendingCounts, 60000)
    
    return () => {
      supabase.removeChannel(requestsChannel)
      supabase.removeChannel(issuesChannel)
      clearInterval(pollInterval)
    }
  }, [fetchPendingCounts])

  const filteredNavigation = navigation.filter(item => 
    !item.adminOnly || role === 'admin'
  )

  const NavItem = ({ item }: { item: typeof navigation[0] }) => {
    const isActive = pathname === item.href || 
      (item.href !== '/dashboard' && pathname.startsWith(item.href))
    
    // Get badge count for this item
    const badgeCount = item.badgeKey ? pendingCounts[item.badgeKey] : 0
    
    const content = (
      <Link
        href={item.href}
        className={cn(
          "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          "hover:bg-white/10 hover:text-white",
          isActive 
            ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25" 
            : "text-gray-300",
          collapsed && "justify-center px-2"
        )}
      >
        <div className="relative">
          <item.icon className={cn(
            "shrink-0 transition-transform duration-200",
            collapsed ? "h-5 w-5" : "h-5 w-5",
            isActive && "scale-110"
          )} />
          {collapsed && badgeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center text-[10px] font-bold bg-orange-500 text-white rounded-full">
              {badgeCount > 9 ? '9+' : badgeCount}
            </span>
          )}
        </div>
        {!collapsed && (
          <>
            <span className="truncate flex-1">{item.name}</span>
            {badgeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-xs font-medium text-white">
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            )}
          </>
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
            {badgeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-xs font-medium text-white">
                {badgeCount}
              </span>
            )}
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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">Asset Manager</span>
                <span className="text-xs text-gray-400 capitalize">{role || 'User'}</span>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
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
                Main Menu
              </span>
            )}
            {filteredNavigation.map((item) => (
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
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-900/50">
              <Shield className="h-4 w-4 text-purple-300" />
            </div>
            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-white">
                  {user?.email?.split('@')[0]}
                </p>
                <p className="text-xs capitalize text-gray-400">{role}</p>
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
