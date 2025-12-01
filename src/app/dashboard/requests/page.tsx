'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { 
  getUserAssetRequests, 
  createAssetRequest, 
  cancelAssetRequest,
  getCategories,
  AssetRequest,
  RequestType,
  RequestPriority,
  Category
} from '@/lib/database'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  PlusCircle, 
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Package,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'

const requestTypeLabels: Record<RequestType, string> = {
  new: 'New Asset',
  replacement: 'Replacement',
  upgrade: 'Upgrade',
  transfer: 'Transfer'
}

const priorityColors: Record<RequestPriority, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700'
}

const statusIcons = {
  pending: Clock,
  approved: CheckCircle,
  denied: XCircle,
  fulfilled: Package,
  cancelled: XCircle
}

export default function RequestsPage() {
  const { user, role } = useAuth()
  const searchParams = useSearchParams()
  const action = searchParams.get('action')
  
  const [requests, setRequests] = useState<AssetRequest[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewDialog, setShowNewDialog] = useState(action === 'new')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    title: '',
    request_type: 'new' as RequestType,
    category_id: '',
    description: '',
    justification: '',
    priority: 'medium' as RequestPriority
  })

  const fetchData = async () => {
    if (!user) return
    
    try {
      const [userRequests, cats] = await Promise.all([
        getUserAssetRequests(user.id),
        getCategories()
      ])
      setRequests(userRequests)
      setCategories(cats)
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user])

  const handleSubmit = async () => {
    if (!user) return
    if (!formData.title.trim()) {
      setError('Please enter a title')
      return
    }
    
    setSubmitting(true)
    setError('')
    
    try {
      await createAssetRequest({
        user_id: user.id,
        request_type: formData.request_type,
        category_id: formData.category_id || undefined,
        title: formData.title,
        description: formData.description || undefined,
        justification: formData.justification || undefined,
        priority: formData.priority
      })
      
      setShowNewDialog(false)
      setFormData({
        title: '',
        request_type: 'new',
        category_id: '',
        description: '',
        justification: '',
        priority: 'medium'
      })
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Failed to create request')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (requestId: string) => {
    try {
      await cancelAssetRequest(requestId)
      fetchData()
    } catch (error) {
      console.error('Error cancelling request:', error)
    }
  }

  // Redirect admin users
  if (role === 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Admin users should use the Request Management page.</p>
        <a href="/dashboard/admin/requests">
          <Button>Go to Request Management</Button>
        </a>
      </div>
    )
  }

  // Stats
  const pendingCount = requests.filter(r => r.status === 'pending').length
  const approvedCount = requests.filter(r => r.status === 'approved').length
  const fulfilledCount = requests.filter(r => r.status === 'fulfilled').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Asset Requests</h1>
          <p className="text-muted-foreground">
            Request new assets or track existing requests
          </p>
        </div>
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Request New Asset</DialogTitle>
              <DialogDescription>
                Submit a request for a new asset. Your request will be reviewed by an administrator.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="title">Request Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., New laptop for development work"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Request Type</Label>
                  <Select 
                    value={formData.request_type} 
                    onValueChange={(v) => setFormData({ ...formData, request_type: v as RequestType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New Asset</SelectItem>
                      <SelectItem value="replacement">Replacement</SelectItem>
                      <SelectItem value="upgrade">Upgrade</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(v) => setFormData({ ...formData, priority: v as RequestPriority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="category">Asset Category</Label>
                <Select 
                  value={formData.category_id} 
                  onValueChange={(v) => setFormData({ ...formData, category_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what you need..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="justification">Business Justification</Label>
                <Textarea
                  id="justification"
                  placeholder="Why do you need this asset?"
                  value={formData.justification}
                  onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDialog(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-2" />}
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-xl font-bold">{approvedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fulfilled</p>
                <p className="text-xl font-bold">{fulfilledCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>My Requests</CardTitle>
          <CardDescription>{requests.length} request(s) total</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No requests yet</h3>
              <p className="text-muted-foreground mb-4">
                Submit your first asset request to get started.
              </p>
              <Button onClick={() => setShowNewDialog(true)} variant="outline">
                <PlusCircle className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => {
                const StatusIcon = statusIcons[request.status] || Clock
                
                return (
                  <div 
                    key={request.id} 
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        request.status === 'pending' ? 'bg-orange-100 dark:bg-orange-900/30' :
                        request.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30' :
                        request.status === 'fulfilled' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        request.status === 'denied' ? 'bg-red-100 dark:bg-red-900/30' :
                        'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <StatusIcon className={`h-5 w-5 ${
                          request.status === 'pending' ? 'text-orange-600' :
                          request.status === 'approved' ? 'text-green-600' :
                          request.status === 'fulfilled' ? 'text-blue-600' :
                          request.status === 'denied' ? 'text-red-600' :
                          'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground">{request.title}</h4>
                          <Badge className={priorityColors[request.priority]} variant="outline">
                            {request.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{requestTypeLabels[request.request_type]}</span>
                          {request.category && <span>• {request.category.name}</span>}
                          <span>• {format(new Date(request.created_at), 'MMM d, yyyy')}</span>
                        </div>
                        {request.admin_notes && request.status !== 'pending' && (
                          <p className="text-sm text-muted-foreground mt-1 italic">
                            Admin: {request.admin_notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        request.status === 'pending' ? 'secondary' :
                        request.status === 'approved' ? 'default' :
                        request.status === 'fulfilled' ? 'default' :
                        request.status === 'denied' ? 'destructive' :
                        'outline'
                      }>
                        {request.status}
                      </Badge>
                      {request.status === 'pending' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleCancel(request.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
