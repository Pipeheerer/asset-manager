'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Bell, 
  Menu, 
  Moon, 
  Sun, 
  User,
  LogOut,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  Wrench
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

interface UserNotification {
  id: string
  type: 'request_approved' | 'request_denied' | 'issue_resolved' | 'issue_in_progress'
  title: string
  message: string
  created_at: string
  read: boolean
  link?: string
}

interface UserHeaderProps {
  onMenuClick: () => void
}

export function UserHeader({ onMenuClick }: UserHeaderProps) {
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [notifications, setNotifications] = useState<UserNotification[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch user-specific notifications (request/issue updates)
  useEffect(() => {
    if (!user) return

    const fetchNotifications = async () => {
      try {
        // Fetch recently updated requests (approved/denied)
        const { data: requests } = await supabase
          .from('asset_requests')
          .select('id, title, status, updated_at')
          .eq('user_id', user.id)
          .in('status', ['approved', 'denied'])
          .order('updated_at', { ascending: false })
          .limit(5)

        // Fetch recently updated issues (resolved/in_progress)
        const { data: issues } = await supabase
          .from('issue_reports')
          .select('id, title, status, updated_at')
          .eq('user_id', user.id)
          .in('status', ['resolved', 'in_progress'])
          .order('updated_at', { ascending: false })
          .limit(5)

        const notifs: UserNotification[] = []

        requests?.forEach(req => {
          notifs.push({
            id: `req-${req.id}`,
            type: req.status === 'approved' ? 'request_approved' : 'request_denied',
            title: req.status === 'approved' ? 'Request Approved' : 'Request Denied',
            message: req.title,
            created_at: req.updated_at,
            read: false,
            link: '/dashboard/requests'
          })
        })

        issues?.forEach(issue => {
          notifs.push({
            id: `issue-${issue.id}`,
            type: issue.status === 'resolved' ? 'issue_resolved' : 'issue_in_progress',
            title: issue.status === 'resolved' ? 'Issue Resolved' : 'Issue In Progress',
            message: issue.title,
            created_at: issue.updated_at,
            read: false,
            link: '/dashboard/issues'
          })
        })

        // Sort by date
        notifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setNotifications(notifs.slice(0, 10))
      } catch (error) {
        console.error('Error fetching notifications:', error)
      }
    }

    fetchNotifications()

    // Subscribe to real-time updates
    const requestChannel = supabase
      .channel('user-request-updates')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'asset_requests', filter: `user_id=eq.${user.id}` },
        () => fetchNotifications()
      )
      .subscribe()

    const issueChannel = supabase
      .channel('user-issue-updates')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'issue_reports', filter: `user_id=eq.${user.id}` },
        () => fetchNotifications()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(requestChannel)
      supabase.removeChannel(issueChannel)
    }
  }, [user])

  const unreadCount = notifications.filter(n => !n.read).length

  const getNotificationIcon = (type: UserNotification['type']) => {
    switch (type) {
      case 'request_approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'request_denied':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'issue_resolved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'issue_in_progress':
        return <Wrench className="h-4 w-4 text-orange-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getNotificationBg = (type: UserNotification['type']) => {
    switch (type) {
      case 'request_approved':
      case 'issue_resolved':
        return 'bg-green-50 dark:bg-green-900/20'
      case 'request_denied':
        return 'bg-red-50 dark:bg-red-900/20'
      case 'issue_in_progress':
        return 'bg-orange-50 dark:bg-orange-900/20'
      default:
        return 'bg-gray-50 dark:bg-gray-800'
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
      {/* Left side - Menu button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden lg:block">
          <h2 className="text-lg font-semibold text-foreground">Employee Portal</h2>
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="relative"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5 text-slate-700" />
            )}
          </Button>
        )}

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-emerald-600"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <Link key={notification.id} href={notification.link || '#'}>
                    <DropdownMenuItem className={`flex items-start gap-3 p-3 cursor-pointer ${getNotificationBg(notification.type)}`}>
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  </Link>
                ))}
              </div>
            )}
            <DropdownMenuSeparator />
            <Link href="/dashboard/requests">
              <DropdownMenuItem className="text-center justify-center text-sm text-primary">
                View all activity
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                <User className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{user?.email?.split('@')[0]}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/dashboard/profile">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
            </Link>
            <Link href="/dashboard/settings">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
