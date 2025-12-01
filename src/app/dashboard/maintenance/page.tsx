'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/app/providers'
import { 
  getMaintenanceRecords, 
  getAssets, 
  createMaintenance, 
  completeMaintenance,
  deleteMaintenance,
  getWarrantyExpiringAssets,
  getInsuranceExpiringAssets
} from '@/lib/database'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Plus, 
  Wrench, 
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Trash2,
  Search,
  Shield,
  FileWarning
} from 'lucide-react'
import Link from 'next/link'
import { format, addMonths, differenceInDays } from 'date-fns'

interface MaintenanceRecord {
  id: string
  asset_id: string
  maintenance_type: string
  description?: string
  cost: number
  scheduled_date: string
  completed_date?: string
  status: string
  notes?: string
  asset?: {
    id: string
    name: string
    category?: { id: string; name: string }
    department?: { id: string; name: string }
  }
}

interface Asset {
  id: string
  name: string
  category?: { id: string; name: string }
  department?: { id: string; name: string }
  last_maintenance_date?: string
  next_maintenance_date?: string
}

export default function MaintenancePage() {
  const { role, loading: authLoading } = useAuth()
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [selectedMaintenance, setSelectedMaintenance] = useState<MaintenanceRecord | null>(null)
    const [tableExists, setTableExists] = useState(true)
  const [createError, setCreateError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [warrantyExpiring, setWarrantyExpiring] = useState<any[]>([])
  const [insuranceExpiring, setInsuranceExpiring] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    asset_id: '',
    maintenance_type: 'scheduled' as 'scheduled' | 'repair' | 'inspection',
    description: '',
    scheduled_date: '',
    notes: ''
  })
  
  const [completeData, setCompleteData] = useState({
    cost: '',
    notes: ''
  })

  useEffect(() => {
    if (role === 'admin') {
      fetchData()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [role, authLoading])

  const fetchData = async () => {
    try {
      const [assetsList, records, warrantyAssets, insuranceAssets] = await Promise.all([
        getAssets(undefined, true),
        getMaintenanceRecords(),
        getWarrantyExpiringAssets(30).catch(() => []),
        getInsuranceExpiringAssets(30).catch(() => [])
      ])
      
      setAssets(assetsList)
      setMaintenanceRecords(records)
      setWarrantyExpiring(warrantyAssets)
      setInsuranceExpiring(insuranceAssets)
    } catch (error: any) {
      // Check if table doesn't exist
      if (error?.message?.includes('does not exist') || error?.code === '42P01') {
        setTableExists(false)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    
    if (!formData.asset_id) {
      setCreateError('Please select an asset')
      return
    }
    
    if (!formData.scheduled_date) {
      setCreateError('Please select a scheduled date')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      await createMaintenance({
        asset_id: formData.asset_id,
        maintenance_type: formData.maintenance_type,
        description: formData.description || undefined,
        scheduled_date: formData.scheduled_date,
        notes: formData.notes || undefined
      })
      setShowCreateDialog(false)
      setFormData({
        asset_id: '',
        maintenance_type: 'scheduled',
        description: '',
        scheduled_date: '',
        notes: ''
      })
      await fetchData()
      // Show success (could add toast notification here)
    } catch (error: any) {
      console.error('Error creating maintenance:', error)
      if (error?.message?.includes('does not exist') || error?.code === '42P01') {
        setCreateError('Maintenance table not set up. Please run the database migration first.')
        setTableExists(false)
      } else {
        setCreateError(error?.message || 'Failed to create maintenance record')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCompleteMaintenance = async () => {
    if (!selectedMaintenance) return
    try {
      await completeMaintenance(
        selectedMaintenance.id,
        parseFloat(completeData.cost) || 0,
        completeData.notes || undefined
      )
      setShowCompleteDialog(false)
      setSelectedMaintenance(null)
      setCompleteData({ cost: '', notes: '' })
      fetchData()
    } catch (error) {
      console.error('Error completing maintenance:', error)
    }
  }

  const handleDeleteMaintenance = async (id: string) => {
    if (!confirm('Are you sure you want to delete this maintenance record?')) return
    try {
      await deleteMaintenance(id)
      fetchData()
    } catch (error) {
      console.error('Error deleting maintenance:', error)
    }
  }

  const getStatusBadge = (status: string, scheduledDate: string) => {
    const daysUntil = differenceInDays(new Date(scheduledDate), new Date())
    
    if (status === 'completed') {
      return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>
    }
    if (status === 'overdue' || (status === 'pending' && daysUntil < 0)) {
      return <Badge variant="destructive">Overdue</Badge>
    }
    if (status === 'in_progress') {
      return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>
    }
    if (daysUntil <= 30) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Due Soon</Badge>
    }
    return <Badge variant="secondary">Scheduled</Badge>
  }

  const getMaintenanceTypeIcon = (type: string) => {
    switch (type) {
      case 'repair':
        return <Wrench className="h-4 w-4 text-red-500" />
      case 'inspection':
        return <Search className="h-4 w-4 text-blue-500" />
      default:
        return <Calendar className="h-4 w-4 text-green-500" />
    }
  }

  const filteredRecords = maintenanceRecords.filter(record => {
    const matchesSearch = 
      record.asset?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const pendingCount = maintenanceRecords.filter(r => r.status === 'pending').length
  const overdueCount = maintenanceRecords.filter(r => {
    const daysUntil = differenceInDays(new Date(r.scheduled_date), new Date())
    return r.status === 'pending' && daysUntil < 0
  }).length
  const completedCount = maintenanceRecords.filter(r => r.status === 'completed').length
  const totalCost = maintenanceRecords
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + (r.cost || 0), 0)

  // Show loading state
  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Only admins can access this page
  if (role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-muted-foreground">
          Access denied. Admin privileges required.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Asset Maintenance
          </h1>
          <p className="text-muted-foreground">
            Schedule and track maintenance for all assets (every 2 months)
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Maintenance
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule Maintenance</DialogTitle>
              <DialogDescription>
                Schedule a new maintenance task for an asset
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateMaintenance} className="space-y-4">
              {createError && (
                <Alert variant="destructive">
                  <AlertDescription>{createError}</AlertDescription>
                </Alert>
              )}
              <div>
                <Label htmlFor="asset">Asset *</Label>
                <Select 
                  value={formData.asset_id} 
                  onValueChange={(value) => setFormData({...formData, asset_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.map(asset => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.name} ({asset.category?.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type">Maintenance Type</Label>
                <Select 
                  value={formData.maintenance_type} 
                  onValueChange={(value: 'scheduled' | 'repair' | 'inspection') => 
                    setFormData({...formData, maintenance_type: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled Maintenance</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date">Scheduled Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of maintenance"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Scheduling...
                    </>
                  ) : (
                    'Schedule'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Warranty & Insurance Alerts - Card-based layout */}
      {(warrantyExpiring.length > 0 || insuranceExpiring.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Warranty Expiring Card */}
          {warrantyExpiring.length > 0 && (
            <Card className="border-orange-300 dark:border-orange-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                    <FileWarning className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-foreground">Warranty Expiring</span>
                  <Badge variant="outline" className="ml-auto bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300">
                    {warrantyExpiring.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {warrantyExpiring.slice(0, 5).map((asset: any) => {
                    const isExpired = new Date(asset.warranty_expiry) < new Date()
                    return (
                      <div key={asset.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-sm font-medium text-foreground">{asset.name}</span>
                        {isExpired ? (
                          <Badge variant="destructive" className="text-xs">Expired</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(asset.warranty_expiry), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
                {warrantyExpiring.length > 5 && (
                  <Link href="/dashboard/assets?warranty_expiring=true" className="text-sm text-primary hover:underline mt-3 inline-block">
                    View all {warrantyExpiring.length} assets →
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {/* Insurance Expiring Card */}
          {insuranceExpiring.length > 0 && (
            <Card className="border-red-300 dark:border-red-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                    <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <span className="text-foreground">Insurance Expiring</span>
                  <Badge variant="outline" className="ml-auto bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-300">
                    {insuranceExpiring.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {insuranceExpiring.slice(0, 5).map((asset: any) => {
                    const isExpired = new Date(asset.insurance_expiry) < new Date()
                    return (
                      <div key={asset.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-sm font-medium text-foreground">{asset.name}</span>
                        {isExpired ? (
                          <Badge variant="destructive" className="text-xs">Expired</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(asset.insurance_expiry), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
                {insuranceExpiring.length > 5 && (
                  <Link href="/dashboard/assets?insurance_expiring=true" className="text-sm text-primary hover:underline mt-3 inline-block">
                    View all {insuranceExpiring.length} assets →
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-foreground">{overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-foreground">{completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold text-foreground">${totalCost.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by asset name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Maintenance Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-blue-500" />
            Maintenance Records
          </CardTitle>
          <CardDescription>
            All scheduled and completed maintenance tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No maintenance records</h3>
              <p className="text-muted-foreground">
                Schedule your first maintenance task to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((record) => (
                <div 
                  key={record.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      {getMaintenanceTypeIcon(record.maintenance_type)}
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">
                        {record.asset?.name || 'Unknown Asset'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {record.maintenance_type.charAt(0).toUpperCase() + record.maintenance_type.slice(1)}
                        {record.description && ` - ${record.description}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          <Calendar className="inline h-3 w-3 mr-1" />
                          {format(new Date(record.scheduled_date), 'MMM d, yyyy')}
                        </span>
                        {record.cost > 0 && (
                          <span className="text-xs text-muted-foreground">
                            <DollarSign className="inline h-3 w-3" />
                            {record.cost.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(record.status, record.scheduled_date)}
                    {record.status !== 'completed' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedMaintenance(record)
                          setShowCompleteDialog(true)
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteMaintenance(record.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complete Maintenance Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Maintenance</DialogTitle>
            <DialogDescription>
              Mark this maintenance task as completed
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cost">Maintenance Cost ($)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={completeData.cost}
                onChange={(e) => setCompleteData({...completeData, cost: e.target.value})}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="complete-notes">Completion Notes</Label>
              <Input
                id="complete-notes"
                value={completeData.notes}
                onChange={(e) => setCompleteData({...completeData, notes: e.target.value})}
                placeholder="Any notes about the completed maintenance"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCompleteMaintenance}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
