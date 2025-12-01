'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/app/providers'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  Bell,
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
  HelpCircle,
  Menu,
  Package,
  UserPlus,
  AlertTriangle,
  Tags,
  Building2,
  CheckCheck,
  Shield,
  FileText
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { LucideIcon } from 'lucide-react'

interface AdminHeaderProps {
  onMenuClick: () => void
}

interface Notification {
  id: string
  title: string
  description: string
  created_at: string
  icon: LucideIcon
  read: boolean
  type: 'asset' | 'user' | 'category' | 'department' | 'alert' | 'warranty' | 'insurance'
  urgent?: boolean
}

// Helper to format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
  return date.toLocaleDateString()
}

// Get icon for notification type
function getNotificationIcon(type: string): LucideIcon {
  switch (type) {
    case 'asset': return Package
    case 'user': return UserPlus
    case 'category': return Tags
    case 'department': return Building2
    case 'alert': return AlertTriangle
    case 'warranty': return Shield
    case 'insurance': return FileText
    default: return Bell
  }
}

// Storage key for read notifications
const READ_NOTIFICATIONS_KEY = 'asset_manager_read_notifications'

// Get read notification IDs from localStorage
function getReadNotificationIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const stored = localStorage.getItem(READ_NOTIFICATIONS_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      // Clean up old entries (older than 7 days)
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      const validEntries = Object.entries(data).filter(([_, timestamp]) => (timestamp as number) > sevenDaysAgo)
      const cleanedData = Object.fromEntries(validEntries)
      localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(cleanedData))
      return new Set(validEntries.map(([id]) => id))
    }
  } catch (e) {
    console.error('Error reading notification state:', e)
  }
  return new Set()
}

// Save read notification ID to localStorage
function markNotificationAsRead(id: string) {
  if (typeof window === 'undefined') return
  try {
    const stored = localStorage.getItem(READ_NOTIFICATIONS_KEY)
    const data = stored ? JSON.parse(stored) : {}
    data[id] = Date.now()
    localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Error saving notification state:', e)
  }
}

// Mark all notifications as read
function markAllNotificationsAsRead(ids: string[]) {
  if (typeof window === 'undefined') return
  try {
    const stored = localStorage.getItem(READ_NOTIFICATIONS_KEY)
    const data = stored ? JSON.parse(stored) : {}
    const now = Date.now()
    ids.forEach(id => { data[id] = now })
    localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Error saving notification state:', e)
  }
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { user, role, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  
  // Handle search
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/dashboard/assets?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  // Load read notification IDs on mount
  useEffect(() => {
    setReadIds(getReadNotificationIds())
  }, [])

  // Fetch notifications from recent database activity
  const fetchNotifications = useCallback(async () => {
    try {
      const notifs: Notification[] = []
      const currentReadIds = getReadNotificationIds()
      
      // Fetch recent assets
      const { data: assets } = await supabase
        .from('assets')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
      
      assets?.forEach(asset => {
        const notifId = `asset-${asset.id}`
        notifs.push({
          id: notifId,
          title: 'New asset added',
          description: `${asset.name} was added`,
          created_at: asset.created_at,
          icon: Package,
          read: currentReadIds.has(notifId),
          type: 'asset'
        })
      })
      
      // Fetch recent users
      const { data: users } = await supabase
        .from('users')
        .select('id, email, created_at')
        .order('created_at', { ascending: false })
        .limit(3)
      
      users?.forEach(u => {
        const notifId = `user-${u.id}`
        notifs.push({
          id: notifId,
          title: 'New user registered',
          description: `${u.email} joined the platform`,
          created_at: u.created_at,
          icon: UserPlus,
          read: currentReadIds.has(notifId),
          type: 'user'
        })
      })
      
      // Fetch assets with expiring warranty (within 30 days or expired)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      
      const { data: warrantyExpiring } = await supabase
        .from('assets')
        .select('id, name, warranty_expiry')
        .not('warranty_expiry', 'is', null)
        .lte('warranty_expiry', thirtyDaysFromNow.toISOString().split('T')[0])
        .order('warranty_expiry', { ascending: true })
        .limit(5)
      
      warrantyExpiring?.forEach(asset => {
        const expiryDate = new Date(asset.warranty_expiry)
        const isExpired = expiryDate < new Date()
        const notifId = `warranty-${asset.id}`
        notifs.push({
          id: notifId,
          title: isExpired ? '⚠️ Warranty Expired' : '⚠️ Warranty Expiring Soon',
          description: `${asset.name} - ${isExpired ? 'Expired' : 'Expires'} ${expiryDate.toLocaleDateString()}`,
          created_at: new Date().toISOString(),
          icon: Shield,
          read: currentReadIds.has(notifId),
          type: 'warranty',
          urgent: true
        })
      })
      
      // Fetch assets with expiring insurance (within 30 days or expired)
      const { data: insuranceExpiring } = await supabase
        .from('assets')
        .select('id, name, insurance_expiry')
        .not('insurance_expiry', 'is', null)
        .lte('insurance_expiry', thirtyDaysFromNow.toISOString().split('T')[0])
        .order('insurance_expiry', { ascending: true })
        .limit(5)
      
      insuranceExpiring?.forEach(asset => {
        const expiryDate = new Date(asset.insurance_expiry)
        const isExpired = expiryDate < new Date()
        const notifId = `insurance-${asset.id}`
        notifs.push({
          id: notifId,
          title: isExpired ? '⚠️ Insurance Expired' : '⚠️ Insurance Expiring Soon',
          description: `${asset.name} - ${isExpired ? 'Expired' : 'Expires'} ${expiryDate.toLocaleDateString()}`,
          created_at: new Date().toISOString(),
          icon: FileText,
          read: currentReadIds.has(notifId),
          type: 'insurance',
          urgent: true
        })
      })
      
      // Sort: urgent first, then by date
      notifs.sort((a, b) => {
        if (a.urgent && !b.urgent) return -1
        if (!a.urgent && b.urgent) return 1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      setNotifications(notifs.slice(0, 15))
      setReadIds(currentReadIds)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoadingNotifications(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    
    // Set up real-time subscriptions for new notifications
    const assetsChannel = supabase
      .channel('header-assets')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'assets' }, (payload) => {
        const newAsset = payload.new as any
        setNotifications(prev => [{
          id: `asset-${newAsset.id}`,
          title: 'New asset added',
          description: `${newAsset.name} was added`,
          created_at: newAsset.created_at,
          icon: Package,
          read: false,
          type: 'asset' as const
        }, ...prev].slice(0, 10))
      })
      .subscribe()
    
    const usersChannel = supabase
      .channel('header-users')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, (payload) => {
        const newUser = payload.new as any
        setNotifications(prev => [{
          id: `user-${newUser.id}`,
          title: 'New user registered',
          description: `${newUser.email} joined the platform`,
          created_at: newUser.created_at,
          icon: UserPlus,
          read: false,
          type: 'user' as const
        }, ...prev].slice(0, 10))
      })
      .subscribe()
    
    // Polling fallback every 30 seconds
    const pollInterval = setInterval(fetchNotifications, 30000)
    
    return () => {
      supabase.removeChannel(assetsChannel)
      supabase.removeChannel(usersChannel)
      clearInterval(pollInterval)
    }
  }, [fetchNotifications])

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id)
    markAllNotificationsAsRead(allIds)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setReadIds(new Set([...readIds, ...allIds]))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
      {/* Left side - Menu button and title */}
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
          <h2 className="text-lg font-semibold text-foreground">Admin Dashboard</h2>
        </div>
      </div>

      {/* Center - Search Bar */}
      <div className="relative flex-1 max-w-md mx-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search assets... (Press Enter)"
          className="w-full pl-10 bg-muted/50 border-0 focus-visible:ring-1"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
        />
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
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs font-medium bg-red-500 text-white rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-foreground">Notifications</span>
              </div>
              {unreadCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {isLoadingNotifications ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                  <p className="text-xs text-muted-foreground/70">We'll notify you when something happens</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => {
                    const IconComponent = notification.icon
                    const isUrgent = notification.urgent || notification.type === 'warranty' || notification.type === 'insurance'
                    return (
                      <div 
                        key={notification.id} 
                        className={`flex items-start gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                          !notification.read ? 'bg-muted/30' : ''
                        }`}
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          isUrgent 
                            ? 'bg-orange-100 dark:bg-orange-900/30' 
                            : notification.read 
                              ? 'bg-muted' 
                              : 'bg-primary/10'
                        }`}>
                          <IconComponent className={`h-5 w-5 ${
                            isUrgent 
                              ? 'text-orange-600 dark:text-orange-400' 
                              : notification.read 
                                ? 'text-muted-foreground' 
                                : 'text-primary'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium leading-tight ${
                              notification.read ? 'text-muted-foreground' : 'text-foreground'
                            }`}>
                              {notification.title.replace(/⚠️ /g, '')}
                            </p>
                            {!notification.read && (
                              <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {notification.description}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            {notifications.length > 0 && unreadCount > 0 && (
              <div className="border-t p-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={markAllAsRead}
                  className="w-full justify-center text-sm gap-2"
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark all as read
                </Button>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.email?.split('@')[0]}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                <Badge variant="secondary" className="mt-1 w-fit text-xs capitalize">
                  {role}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help & Support</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-red-600 dark:text-red-400">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
