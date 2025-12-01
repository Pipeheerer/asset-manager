'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth, subscribeToRefresh } from '@/app/providers'
import { supabase } from '@/lib/supabase'
import { getDashboardStats, getUpcomingMaintenance, getMonthlySpending, getUserProfile, User } from '@/lib/database'
import { MetricCard, MetricCardSkeleton } from '@/components/dashboard/metric-card'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { AnalyticsCharts } from '@/components/dashboard/analytics-charts'
import { RecentAssets } from '@/components/dashboard/recent-assets'
import { UserDashboard } from '@/components/dashboard/user-dashboard'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Package, 
  Users, 
  Tags, 
  Building2, 
  DollarSign,
  TrendingUp,
  Calendar,
  Bell,
  Wrench
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface DashboardStats {
  totalUsers: number
  totalAssets: number
  totalCategories: number
  totalDepartments: number
  totalCost: number
  assetsByCategory: Record<string, number>
  assetsByDepartment: Record<string, number>
  recentAssets: any[]
}

interface MaintenanceAlert {
  id: string
  asset?: { name: string }
  scheduled_date: string
}

interface MonthlySpendData {
  month: string
  spend: number
  assets: number
}

export default function DashboardPage() {
  const { user, role } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<MaintenanceAlert[]>([])
  const [monthlySpending, setMonthlySpending] = useState<MonthlySpendData[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [userProfile, setUserProfile] = useState<User | null>(null)

  // Get asset purchase dates for calendar highlighting
  const assetDates = stats?.recentAssets?.map(asset => new Date(asset.date_purchased)) || []

  const fetchStats = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    
    try {
      const [dashboardStats, upcoming, spending, profile] = await Promise.all([
        getDashboardStats(role === 'admin', user?.id),
        role === 'admin' ? getUpcomingMaintenance(30) : Promise.resolve([]),
        role === 'admin' ? getMonthlySpending() : Promise.resolve([]),
        getUserProfile(user.id)
      ])
      setStats(dashboardStats)
      setMaintenanceAlerts(upcoming)
      setMonthlySpending(spending)
      setUserProfile(profile)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }, [user, role])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Subscribe to real-time updates for assets table
  useEffect(() => {
    if (!user || role !== 'admin') return

    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, () => {
        // Refresh dashboard data when assets change
        fetchStats()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchStats()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'departments' }, () => {
        fetchStats()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchStats()
      })
      .subscribe()

    // Also subscribe to manual refresh events from providers
    const unsubscribe = subscribeToRefresh(() => {
      fetchStats()
    })

    return () => {
      supabase.removeChannel(channel)
      unsubscribe()
    }
  }, [user, role, fetchStats])

  const isAdmin = role === 'admin'

  // Get current date info for greeting
  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening'
  
  // Use first name if available, otherwise fallback to email username
  const getUserDisplayName = () => {
    if (userProfile?.first_name) {
      return userProfile.first_name
    }
    const rawName = user?.email?.split('@')[0] || 'User'
    return rawName.charAt(0).toUpperCase() + rawName.slice(1)
  }
  const userName = getUserDisplayName()

  // Show user dashboard for non-admin users
  if (!isAdmin) {
    return <UserDashboard />
  }

  // Admin dashboard below
  return (
    <div className="space-y-8">
      {/* Maintenance Alert Banner */}
      {isAdmin && maintenanceAlerts.length > 0 && (
        <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-900/20">
          <Wrench className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800 dark:text-orange-200">
            Maintenance Due Soon
          </AlertTitle>
          <AlertDescription className="text-orange-700 dark:text-orange-300">
            {maintenanceAlerts.length} asset(s) require maintenance within the next 30 days.{' '}
            <Link href="/dashboard/maintenance" className="underline font-medium hover:text-orange-900 dark:hover:text-orange-100">
              View maintenance schedule →
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {greeting}, {userName}! 👋
          </h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? "Here's what's happening with your organization today."
              : "Here's an overview of your assets."
            }
          </p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={{
                assetAdded: assetDates
              }}
              modifiersStyles={{
                assetAdded: { 
                  backgroundColor: 'hsl(var(--primary))', 
                  color: 'white',
                  borderRadius: '50%'
                }
              }}
            />
            <div className="p-3 border-t text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span>Asset purchase dates</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Metrics Cards */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {isAdmin && (
            <MetricCard
              title="Total Users"
              value={stats?.totalUsers || 0}
              description="Registered users"
              icon={Users}
              trend={{ value: 12, isPositive: true }}
            />
          )}
          <MetricCard
            title="Total Assets"
            value={stats?.totalAssets || 0}
            description={isAdmin ? "All assets" : "Your assets"}
            icon={Package}
            trend={{ value: 8, isPositive: true }}
          />
          <MetricCard
            title="Categories"
            value={stats?.totalCategories || 0}
            description="Asset categories"
            icon={Tags}
          />
          <MetricCard
            title="Departments"
            value={stats?.totalDepartments || 0}
            description="Company departments"
            icon={Building2}
          />
          <MetricCard
            title="Total Value"
            value={`$${(stats?.totalCost || 0).toLocaleString()}`}
            description="Total asset value"
            icon={DollarSign}
            trend={{ value: 15, isPositive: true }}
            iconClassName="bg-green-100 dark:bg-green-900/50"
          />
        </div>
      )}

      {/* Quick Actions - Admin Only */}
      {isAdmin && <QuickActions />}

      {/* Analytics Charts - Admin Only */}
      {isAdmin && !loading && stats && (
        <AnalyticsCharts 
          assetsByCategory={stats.assetsByCategory}
          assetsByDepartment={stats.assetsByDepartment}
          monthlySpending={monthlySpending}
        />
      )}

      {/* Recent Assets */}
      {!loading && stats && (
        <RecentAssets assets={stats.recentAssets} />
      )}
    </div>
  )
}
