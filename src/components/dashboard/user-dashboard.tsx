'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/app/providers'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  getUserDashboardStats, 
  getUserAssignedAssets, 
  getUserAssetRequests, 
  getUserIssueReports,
  getUserProfile,
  AssetWithDetails,
  AssetRequest,
  IssueReport,
  User
} from '@/lib/database'
import { 
  Package, 
  AlertCircle, 
  ClipboardList,
  Shield,
  FileWarning,
  PlusCircle,
  ArrowRight,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface UserStats {
  totalAssets: number
  totalValue: number
  pendingRequests: number
  openIssues: number
  warrantyExpiring: number
  insuranceExpiring: number
}

export function UserDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [assets, setAssets] = useState<AssetWithDetails[]>([])
  const [requests, setRequests] = useState<AssetRequest[]>([])
  const [issues, setIssues] = useState<IssueReport[]>([])
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!user) return
    
    try {
      const [userStats, userAssets, userRequests, userIssues, profile] = await Promise.all([
        getUserDashboardStats(user.id),
        getUserAssignedAssets(user.id),
        getUserAssetRequests(user.id),
        getUserIssueReports(user.id),
        getUserProfile(user.id)
      ])
      
      setStats(userStats)
      setAssets(userAssets)
      setRequests(userRequests)
      setIssues(userIssues)
      setUserProfile(profile)
    } catch (error) {
      console.error('Error fetching user dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Greeting with personalized name
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">
          {greeting}, {userName}! 👋
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of your assigned assets and recent activity.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Package className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assets</p>
                <p className="text-2xl font-bold text-foreground">{stats?.totalAssets || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <ClipboardList className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold text-foreground">{stats?.pendingRequests || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Open Issues</p>
                <p className="text-2xl font-bold text-foreground">{stats?.openIssues || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {((stats?.warrantyExpiring || 0) > 0 || (stats?.insuranceExpiring || 0) > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {(stats?.warrantyExpiring || 0) > 0 && (
            <Card className="border-orange-300 dark:border-orange-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileWarning className="h-5 w-5 text-orange-600" />
                  <span className="text-foreground">Warranty Expiring Soon</span>
                  <Badge variant="outline" className="ml-auto bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                    {stats?.warrantyExpiring}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  {stats?.warrantyExpiring} of your assets have warranties expiring within 30 days.
                </p>
                <Link href="/dashboard/my-assets?filter=warranty" className="text-sm text-primary hover:underline mt-2 inline-flex items-center gap-1">
                  View assets <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          )}

          {(stats?.insuranceExpiring || 0) > 0 && (
            <Card className="border-red-300 dark:border-red-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-5 w-5 text-red-600" />
                  <span className="text-foreground">Insurance Expiring Soon</span>
                  <Badge variant="outline" className="ml-auto bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                    {stats?.insuranceExpiring}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  {stats?.insuranceExpiring} of your assets have insurance expiring within 30 days.
                </p>
                <Link href="/dashboard/my-assets?filter=insurance" className="text-sm text-primary hover:underline mt-2 inline-flex items-center gap-1">
                  View assets <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks you can do right now</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboard/requests?action=new">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                <PlusCircle className="h-6 w-6 text-emerald-600" />
                <span>Request Asset</span>
              </Button>
            </Link>
            <Link href="/dashboard/issues?action=new">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <span>Report Issue</span>
              </Button>
            </Link>
            <Link href="/dashboard/my-assets">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                <Package className="h-6 w-6 text-blue-600" />
                <span>View Assets</span>
              </Button>
            </Link>
            <Link href="/dashboard/requests">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30">
                <ClipboardList className="h-6 w-6 text-orange-600" />
                <span>My Requests</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Assets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Assets</CardTitle>
              <CardDescription>Assets currently assigned to you</CardDescription>
            </div>
            <Link href="/dashboard/my-assets">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {assets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No assets assigned to you yet.</p>
                <Link href="/dashboard/requests?action=new" className="text-primary hover:underline text-sm mt-2 inline-block">
                  Request an asset →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {assets.slice(0, 5).map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">{asset.category?.name}</p>
                      </div>
                    </div>
                    <Badge variant={asset.status === 'assigned' ? 'default' : 'secondary'}>
                      {asset.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest requests and issues</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {requests.length === 0 && issues.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Show mix of recent requests and issues */}
                {[...requests.slice(0, 3).map(r => ({ ...r, type: 'request' as const })),
                  ...issues.slice(0, 2).map(i => ({ ...i, type: 'issue' as const }))]
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 5)
                  .map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          item.type === 'request' ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-red-100 dark:bg-red-900/30'
                        }`}>
                          {item.type === 'request' ? (
                            <ClipboardList className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.type === 'request' ? 'Asset Request' : 'Issue Report'} • {format(new Date(item.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <Badge variant={
                        item.status === 'pending' || item.status === 'open' ? 'secondary' :
                        item.status === 'approved' || item.status === 'resolved' ? 'default' :
                        item.status === 'denied' || item.status === 'cancelled' ? 'destructive' : 'outline'
                      }>
                        {item.status}
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
