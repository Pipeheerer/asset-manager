'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Package, 
  UserPlus, 
  Edit, 
  Trash2, 
  LogIn, 
  LogOut,
  Settings,
  Shield,
  Clock,
  RefreshCw,
  Tags,
  Building2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { LucideIcon } from 'lucide-react'

interface Activity {
  id: string
  action: string
  description: string
  user: string
  timestamp: string
  type: 'create' | 'update' | 'delete' | 'auth'
  icon: LucideIcon
  entity: string
}

// Helper to generate activities from database records
function generateActivitiesFromData(
  assets: any[],
  users: any[],
  categories: any[],
  departments: any[]
): Activity[] {
  const activities: Activity[] = []
  
  // Add asset activities
  assets.forEach(asset => {
    activities.push({
      id: `asset-${asset.id}`,
      action: 'Asset Created',
      description: `${asset.name} was added`,
      user: 'admin',
      timestamp: asset.created_at,
      type: 'create',
      icon: Package,
      entity: 'Asset'
    })
  })
  
  // Add user activities
  users.forEach(user => {
    activities.push({
      id: `user-${user.id}`,
      action: 'User Registered',
      description: `${user.email} joined the platform`,
      user: 'system',
      timestamp: user.created_at,
      type: 'create',
      icon: UserPlus,
      entity: 'User'
    })
  })
  
  // Add category activities
  categories.forEach(cat => {
    activities.push({
      id: `cat-${cat.id}`,
      action: 'Category Created',
      description: `Category "${cat.name}" was created`,
      user: 'admin',
      timestamp: cat.created_at,
      type: 'create',
      icon: Tags,
      entity: 'Category'
    })
  })
  
  // Add department activities
  departments.forEach(dept => {
    activities.push({
      id: `dept-${dept.id}`,
      action: 'Department Created',
      description: `Department "${dept.name}" was created`,
      user: 'admin',
      timestamp: dept.created_at,
      type: 'create',
      icon: Building2,
      entity: 'Department'
    })
  })
  
  // Sort by timestamp descending
  return activities.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
}

function getActionColor(type: string) {
  switch (type) {
    case 'create':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 'update':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'delete':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 'auth':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 60) return `${minutes} min ago`
  if (hours < 24) return `${hours} hours ago`
  if (days < 7) return `${days} days ago`
  return date.toLocaleDateString()
}

export default function ActivityLogPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchActivities = async () => {
    try {
      const [
        { data: assets },
        { data: users },
        { data: categories },
        { data: departments }
      ] = await Promise.all([
        supabase.from('assets').select('id, name, created_at').order('created_at', { ascending: false }).limit(50),
        supabase.from('users').select('id, email, created_at').order('created_at', { ascending: false }).limit(50),
        supabase.from('categories').select('id, name, created_at').order('created_at', { ascending: false }).limit(50),
        supabase.from('departments').select('id, name, created_at').order('created_at', { ascending: false }).limit(50)
      ])
      
      const allActivities = generateActivitiesFromData(
        assets || [],
        users || [],
        categories || [],
        departments || []
      )
      
      setActivities(allActivities.slice(0, 50))
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchActivities()
    
    // Set up real-time subscriptions
    const assetsChannel = supabase
      .channel('assets-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, () => {
        fetchActivities()
      })
      .subscribe()
    
    const usersChannel = supabase
      .channel('users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchActivities()
      })
      .subscribe()
    
    const categoriesChannel = supabase
      .channel('categories-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchActivities()
      })
      .subscribe()
    
    const departmentsChannel = supabase
      .channel('departments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'departments' }, () => {
        fetchActivities()
      })
      .subscribe()
    
    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(assetsChannel)
      supabase.removeChannel(usersChannel)
      supabase.removeChannel(categoriesChannel)
      supabase.removeChannel(departmentsChannel)
    }
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchActivities()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Activity Log
          </h1>
          <p className="text-muted-foreground">
            Track all actions and changes across your organization (real-time updates)
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Recent Activity
            <Badge variant="secondary" className="ml-2">{activities.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No activity yet</h3>
              <p className="text-muted-foreground">
                Activity will appear here as you create assets, users, and more
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
                
                <div className="space-y-6">
                  {activities.map((activity) => {
                    const IconComponent = activity.icon
                    return (
                      <div key={activity.id} className="relative flex gap-4">
                        {/* Icon */}
                        <div className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-background ${getActionColor(activity.type)}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 pt-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className="font-semibold text-foreground">
                                {activity.action}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {activity.description}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {activity.entity}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  by {activity.user}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                              <Clock className="h-3 w-3" />
                              {formatTimestamp(activity.timestamp)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
