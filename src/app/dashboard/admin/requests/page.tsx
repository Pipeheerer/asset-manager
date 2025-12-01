'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/app/providers'
import { 
  getAllAssetRequests, 
  updateAssetRequest,
  AssetRequest,
  RequestStatus
} from '@/lib/database'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
} from '@/components/ui/dialog'
import { 
  ClipboardList, 
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Package,
  User,
  Calendar
} from 'lucide-react'
import { format } from 'date-fns'

const statusColors: Record<RequestStatus, string> = {
  pending: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  denied: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  fulfilled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
}

export default function AdminRequestsPage() {
  const { user, role } = useAuth()
  const [requests, setRequests] = useState<AssetRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<AssetRequest | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [updating, setUpdating] = useState(false)
  const [filter, setFilter] = useState<RequestStatus | 'all'>('pending')

  const fetchData = async () => {
    try {
      const allRequests = await getAllAssetRequests()
      setRequests(allRequests)
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleUpdateStatus = async (status: RequestStatus) => {
    if (!selectedRequest || !user) return
    
    setUpdating(true)
    try {
      await updateAssetRequest(selectedRequest.id, {
        status,
        admin_notes: adminNotes || undefined,
        reviewed_by: user.id
      })
      setSelectedRequest(null)
      setAdminNotes('')
      fetchData()
    } catch (error) {
      console.error('Error updating request:', error)
    } finally {
      setUpdating(false)
    }
  }

  // Only admin access
  if (role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Access denied. Admin only.</p>
      </div>
    )
  }

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(r => r.status === filter)

  // Stats
  const pendingCount = requests.filter(r => r.status === 'pending').length
  const approvedCount = requests.filter(r => r.status === 'approved').length
  const deniedCount = requests.filter(r => r.status === 'denied').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Manage Asset Requests</h1>
        <p className="text-muted-foreground">
          Review and process employee asset requests
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className={filter === 'pending' ? 'ring-2 ring-orange-500' : ''}>
          <CardContent className="pt-6 cursor-pointer" onClick={() => setFilter('pending')}>
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
        <Card className={filter === 'approved' ? 'ring-2 ring-green-500' : ''}>
          <CardContent className="pt-6 cursor-pointer" onClick={() => setFilter('approved')}>
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
        <Card className={filter === 'denied' ? 'ring-2 ring-red-500' : ''}>
          <CardContent className="pt-6 cursor-pointer" onClick={() => setFilter('denied')}>
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Denied</p>
                <p className="text-xl font-bold">{deniedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={filter === 'all' ? 'ring-2 ring-blue-500' : ''}>
          <CardContent className="pt-6 cursor-pointer" onClick={() => setFilter('all')}>
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <ClipboardList className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{requests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filter === 'all' ? 'All Requests' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Requests`}
          </CardTitle>
          <CardDescription>{filteredRequests.length} request(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No requests found</h3>
              <p className="text-muted-foreground">
                {filter === 'pending' 
                  ? 'No pending requests to review.'
                  : 'No requests match the selected filter.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((request) => (
                <div 
                  key={request.id} 
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedRequest(request)
                    setAdminNotes(request.admin_notes || '')
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                      <ClipboardList className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground">{request.title}</h4>
                        <Badge className={statusColors[request.status]}>
                          {request.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {request.user?.email}
                        </span>
                        <span>• {request.request_type}</span>
                        {request.category && <span>• {request.category.name}</span>}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(request.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{request.priority}</Badge>
                    {request.status === 'pending' && (
                      <Button size="sm" variant="outline">
                        Review
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              Review and process this asset request
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6 py-4">
              {/* Request Info */}
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{selectedRequest.title}</h3>
                  <Badge className={statusColors[selectedRequest.status]}>
                    {selectedRequest.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Requested By</p>
                    <p className="font-medium">{selectedRequest.user?.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Request Type</p>
                    <p className="font-medium capitalize">{selectedRequest.request_type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Category</p>
                    <p className="font-medium">{selectedRequest.category?.name || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Priority</p>
                    <Badge variant="outline">{selectedRequest.priority}</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Submitted</p>
                    <p className="font-medium">{format(new Date(selectedRequest.created_at), 'MMMM d, yyyy h:mm a')}</p>
                  </div>
                  {selectedRequest.reviewed_at && (
                    <div>
                      <p className="text-muted-foreground">Reviewed</p>
                      <p className="font-medium">{format(new Date(selectedRequest.reviewed_at), 'MMMM d, yyyy h:mm a')}</p>
                    </div>
                  )}
                </div>

                {selectedRequest.description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-sm bg-muted p-3 rounded-lg">{selectedRequest.description}</p>
                  </div>
                )}

                {selectedRequest.justification && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Business Justification</p>
                    <p className="text-sm bg-muted p-3 rounded-lg">{selectedRequest.justification}</p>
                  </div>
                )}
              </div>

              {/* Admin Response */}
              {selectedRequest.status === 'pending' && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Admin Response</h4>
                  <Textarea
                    placeholder="Add notes about your decision (optional)..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            {selectedRequest?.status === 'pending' ? (
              <div className="flex gap-2 w-full">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedRequest(null)}
                  disabled={updating}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => handleUpdateStatus('denied')}
                  disabled={updating}
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                  Deny
                </Button>
                <Button 
                  onClick={() => handleUpdateStatus('approved')}
                  disabled={updating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Approve
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
