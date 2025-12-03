'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/app/providers'
import { 
  getAllIssueReports, 
  updateIssueReport,
  IssueReport,
  IssueStatus
} from '@/lib/database'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  AlertCircle, 
  Clock,
  CheckCircle,
  Loader2,
  Package,
  User,
  Calendar,
  Wrench,
  AlertTriangle,
  Play
} from 'lucide-react'
import { format } from 'date-fns'

const statusColors: Record<IssueStatus, string> = {
  open: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  in_progress: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  closed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
}

const severityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700'
}

export default function AdminIssuesPage() {
  const { user, role } = useAuth()
  const [issues, setIssues] = useState<IssueReport[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIssue, setSelectedIssue] = useState<IssueReport | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [updating, setUpdating] = useState(false)
  const [filter, setFilter] = useState<IssueStatus | 'all'>('open')

  const fetchData = async () => {
    try {
      const allIssues = await getAllIssueReports()
      setIssues(allIssues)
    } catch (error) {
      console.error('Error fetching issues:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleUpdateStatus = async (status: IssueStatus) => {
    if (!selectedIssue || !user) return
    
    setUpdating(true)
    try {
      await updateIssueReport(selectedIssue.id, {
        status,
        resolution_notes: resolutionNotes || undefined,
        resolved_by: user.id
      })
      setSelectedIssue(null)
      setResolutionNotes('')
      fetchData()
    } catch (error) {
      console.error('Error updating issue:', error)
    } finally {
      setUpdating(false)
    }
  }

 //admin
  if (role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Access denied. Admin only.</p>
      </div>
    )
  }

  const filteredIssues = filter === 'all' 
    ? issues 
    : issues.filter(i => i.status === filter)

  // Stats
  const openCount = issues.filter(i => i.status === 'open').length
  const inProgressCount = issues.filter(i => i.status === 'in_progress').length
  const resolvedCount = issues.filter(i => i.status === 'resolved' || i.status === 'closed').length
  const criticalCount = issues.filter(i => i.severity === 'critical' && (i.status === 'open' || i.status === 'in_progress')).length

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
        <h1 className="text-2xl font-bold text-foreground">Manage Issue Reports</h1>
        <p className="text-muted-foreground">
          Review and resolve employee-reported issues
        </p>
      </div>

      {/* Critical Alert */}
      {criticalCount > 0 && (
        <div className="p-4 rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">
                {criticalCount} Critical Issue{criticalCount > 1 ? 's' : ''} Require Attention
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                These issues are marked as critical and should be addressed immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className={filter === 'open' ? 'ring-2 ring-red-500' : ''}>
          <CardContent className="pt-6 cursor-pointer" onClick={() => setFilter('open')}>
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-xl font-bold">{openCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={filter === 'in_progress' ? 'ring-2 ring-orange-500' : ''}>
          <CardContent className="pt-6 cursor-pointer" onClick={() => setFilter('in_progress')}>
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-xl font-bold">{inProgressCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={filter === 'resolved' ? 'ring-2 ring-green-500' : ''}>
          <CardContent className="pt-6 cursor-pointer" onClick={() => setFilter('resolved')}>
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-xl font-bold">{resolvedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={filter === 'all' ? 'ring-2 ring-blue-500' : ''}>
          <CardContent className="pt-6 cursor-pointer" onClick={() => setFilter('all')}>
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Wrench className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{issues.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issues List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filter === 'all' ? 'All Issues' : `${filter.replace('_', ' ').charAt(0).toUpperCase() + filter.replace('_', ' ').slice(1)} Issues`}
          </CardTitle>
          <CardDescription>{filteredIssues.length} issue(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredIssues.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No issues found</h3>
              <p className="text-muted-foreground">
                {filter === 'open' 
                  ? 'No open issues to resolve.'
                  : 'No issues match the selected filter.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIssues.map((issue) => (
                <div 
                  key={issue.id} 
                  className={`flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors cursor-pointer ${
                    issue.severity === 'critical' ? 'border-red-300 dark:border-red-700' : ''
                  }`}
                  onClick={() => {
                    setSelectedIssue(issue)
                    setResolutionNotes(issue.resolution_notes || '')
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                      issue.status === 'open' ? 'bg-red-100 dark:bg-red-900/30' :
                      issue.status === 'in_progress' ? 'bg-orange-100 dark:bg-orange-900/30' :
                      'bg-green-100 dark:bg-green-900/30'
                    }`}>
                      <AlertCircle className={`h-6 w-6 ${
                        issue.status === 'open' ? 'text-red-600' :
                        issue.status === 'in_progress' ? 'text-orange-600' :
                        'text-green-600'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground">{issue.title}</h4>
                        <Badge className={statusColors[issue.status]}>
                          {issue.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={severityColors[issue.severity]} variant="outline">
                          {issue.severity}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {issue.asset?.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {issue.user?.email}
                        </span>
                        <span>• {issue.issue_type}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(issue.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    {issue.status === 'open' || issue.status === 'in_progress' ? 'Manage' : 'View'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Issue Detail Dialog */}
      <Dialog open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Issue Details</DialogTitle>
            <DialogDescription>
              Review and resolve this issue report
            </DialogDescription>
          </DialogHeader>
          
          {selectedIssue && (
            <div className="space-y-6 py-4">
              {/* Issue Info */}
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{selectedIssue.title}</h3>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[selectedIssue.status]}>
                      {selectedIssue.status.replace('_', ' ')}
                    </Badge>
                    <Badge className={severityColors[selectedIssue.severity]} variant="outline">
                      {selectedIssue.severity}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Reported By</p>
                    <p className="font-medium">{selectedIssue.user?.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Asset</p>
                    <p className="font-medium">{selectedIssue.asset?.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Issue Type</p>
                    <p className="font-medium capitalize">{selectedIssue.issue_type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Submitted</p>
                    <p className="font-medium">{format(new Date(selectedIssue.created_at), 'MMMM d, yyyy h:mm a')}</p>
                  </div>
                  {selectedIssue.resolved_at && (
                    <div>
                      <p className="text-muted-foreground">Resolved</p>
                      <p className="font-medium">{format(new Date(selectedIssue.resolved_at), 'MMMM d, yyyy h:mm a')}</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedIssue.description}</p>
                </div>

                {selectedIssue.resolution_notes && selectedIssue.status !== 'open' && selectedIssue.status !== 'in_progress' && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Resolution Notes</p>
                    <p className="text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">{selectedIssue.resolution_notes}</p>
                  </div>
                )}
              </div>

              {/* Admin Response */}
              {(selectedIssue.status === 'open' || selectedIssue.status === 'in_progress') && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Resolution Notes</h4>
                  <Textarea
                    placeholder="Add notes about how the issue was resolved..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            {selectedIssue?.status === 'open' && (
              <div className="flex gap-2 w-full">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedIssue(null)}
                  disabled={updating}
                >
                  Cancel
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => handleUpdateStatus('in_progress')}
                  disabled={updating}
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  Start Working
                </Button>
                <Button 
                  onClick={() => handleUpdateStatus('resolved')}
                  disabled={updating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Mark Resolved
                </Button>
              </div>
            )}
            {selectedIssue?.status === 'in_progress' && (
              <div className="flex gap-2 w-full">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedIssue(null)}
                  disabled={updating}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleUpdateStatus('resolved')}
                  disabled={updating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Mark Resolved
                </Button>
              </div>
            )}
            {(selectedIssue?.status === 'resolved' || selectedIssue?.status === 'closed' || selectedIssue?.status === 'cancelled') && (
              <Button variant="outline" onClick={() => setSelectedIssue(null)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
