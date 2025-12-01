'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/app/providers'
import { useSearchParams } from 'next/navigation'
import { 
  getUserIssueReports, 
  getUserAssignedAssets,
  createIssueReport,
  IssueReport,
  IssueType,
  IssueSeverity,
  AssetWithDetails
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
  AlertCircle, 
  Clock,
  CheckCircle,
  Loader2,
  Package,
  Wrench,
  AlertTriangle,
  XCircle
} from 'lucide-react'
import { format } from 'date-fns'

const issueTypeLabels: Record<IssueType, string> = {
  damage: 'Damage',
  malfunction: 'Malfunction',
  loss: 'Loss',
  theft: 'Theft',
  maintenance: 'Needs Maintenance',
  other: 'Other'
}

const issueTypeIcons: Record<IssueType, typeof AlertCircle> = {
  damage: AlertTriangle,
  malfunction: Wrench,
  loss: XCircle,
  theft: AlertCircle,
  maintenance: Wrench,
  other: AlertCircle
}

const severityColors: Record<IssueSeverity, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700'
}

export default function IssuesPage() {
  const { user, role } = useAuth()
  const searchParams = useSearchParams()
  const preselectedAssetId = searchParams.get('asset')
  const action = searchParams.get('action')
  
  const [issues, setIssues] = useState<IssueReport[]>([])
  const [assets, setAssets] = useState<AssetWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewDialog, setShowNewDialog] = useState(action === 'new' || !!preselectedAssetId)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    asset_id: preselectedAssetId || '',
    issue_type: 'malfunction' as IssueType,
    title: '',
    description: '',
    severity: 'medium' as IssueSeverity
  })

  const fetchData = async () => {
    if (!user) return
    
    try {
      const [userIssues, userAssets] = await Promise.all([
        getUserIssueReports(user.id),
        getUserAssignedAssets(user.id)
      ])
      setIssues(userIssues)
      setAssets(userAssets)
    } catch (error) {
      console.error('Error fetching issues:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user])

  // Update form data when assets load and preselected asset exists
  useEffect(() => {
    if (preselectedAssetId && assets.length > 0) {
      setFormData(prev => ({ ...prev, asset_id: preselectedAssetId }))
    }
  }, [preselectedAssetId, assets])

  const handleSubmit = async () => {
    if (!user) return
    if (!formData.asset_id) {
      setError('Please select an asset')
      return
    }
    if (!formData.title.trim()) {
      setError('Please enter a title')
      return
    }
    if (!formData.description.trim()) {
      setError('Please enter a description')
      return
    }
    
    setSubmitting(true)
    setError('')
    
    try {
      await createIssueReport({
        user_id: user.id,
        asset_id: formData.asset_id,
        issue_type: formData.issue_type,
        title: formData.title,
        description: formData.description,
        severity: formData.severity
      })
      
      setShowNewDialog(false)
      setFormData({
        asset_id: '',
        issue_type: 'malfunction',
        title: '',
        description: '',
        severity: 'medium'
      })
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Failed to create issue report')
    } finally {
      setSubmitting(false)
    }
  }

  // Redirect admin users
  if (role === 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Admin users should use the Issue Management page.</p>
        <a href="/dashboard/admin/issues">
          <Button>Go to Issue Management</Button>
        </a>
      </div>
    )
  }

  // Stats
  const openCount = issues.filter(i => i.status === 'open').length
  const inProgressCount = issues.filter(i => i.status === 'in_progress').length
  const resolvedCount = issues.filter(i => i.status === 'resolved' || i.status === 'closed').length

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
          <h1 className="text-2xl font-bold text-foreground">Issue Reports</h1>
          <p className="text-muted-foreground">
            Report problems with your assigned assets
          </p>
        </div>
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <AlertCircle className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Report an Issue</DialogTitle>
              <DialogDescription>
                Report a problem with one of your assigned assets. An administrator will review and address the issue.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                  {error}
                </div>
              )}
              
              {assets.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>You don't have any assigned assets to report issues for.</p>
                </div>
              ) : (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="asset">Asset *</Label>
                    <Select 
                      value={formData.asset_id} 
                      onValueChange={(v) => setFormData({ ...formData, asset_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an asset" />
                      </SelectTrigger>
                      <SelectContent>
                        {assets.map(asset => (
                          <SelectItem key={asset.id} value={asset.id}>
                            {asset.name} {asset.serial_number && `(${asset.serial_number})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="title">Issue Title *</Label>
                    <Input
                      id="title"
                      placeholder="Brief description of the issue"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="type">Issue Type</Label>
                      <Select 
                        value={formData.issue_type} 
                        onValueChange={(v) => setFormData({ ...formData, issue_type: v as IssueType })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="damage">Damage</SelectItem>
                          <SelectItem value="malfunction">Malfunction</SelectItem>
                          <SelectItem value="loss">Loss</SelectItem>
                          <SelectItem value="theft">Theft</SelectItem>
                          <SelectItem value="maintenance">Needs Maintenance</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="severity">Severity</Label>
                      <Select 
                        value={formData.severity} 
                        onValueChange={(v) => setFormData({ ...formData, severity: v as IssueSeverity })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low - Minor issue</SelectItem>
                          <SelectItem value="medium">Medium - Affects work</SelectItem>
                          <SelectItem value="high">High - Urgent</SelectItem>
                          <SelectItem value="critical">Critical - Not usable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the issue in detail..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                    />
                  </div>
                </>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDialog(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={submitting || assets.length === 0} 
                className="bg-red-600 hover:bg-red-700"
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <AlertCircle className="h-4 w-4 mr-2" />}
                Submit Report
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
        <Card>
          <CardContent className="pt-6">
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
        <Card>
          <CardContent className="pt-6">
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
      </div>

      {/* Issues List */}
      <Card>
        <CardHeader>
          <CardTitle>My Issue Reports</CardTitle>
          <CardDescription>{issues.length} report(s) total</CardDescription>
        </CardHeader>
        <CardContent>
          {issues.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No issues reported</h3>
              <p className="text-muted-foreground mb-4">
                You haven't reported any issues yet.
              </p>
              {assets.length > 0 && (
                <Button onClick={() => setShowNewDialog(true)} variant="outline">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Report an Issue
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {issues.map((issue) => {
                const IssueIcon = issueTypeIcons[issue.issue_type] || AlertCircle
                
                return (
                  <div 
                    key={issue.id} 
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        issue.status === 'open' ? 'bg-red-100 dark:bg-red-900/30' :
                        issue.status === 'in_progress' ? 'bg-orange-100 dark:bg-orange-900/30' :
                        'bg-green-100 dark:bg-green-900/30'
                      }`}>
                        <IssueIcon className={`h-5 w-5 ${
                          issue.status === 'open' ? 'text-red-600' :
                          issue.status === 'in_progress' ? 'text-orange-600' :
                          'text-green-600'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground">{issue.title}</h4>
                          <Badge className={severityColors[issue.severity]} variant="outline">
                            {issue.severity}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{issue.asset?.name}</span>
                          <span>• {issueTypeLabels[issue.issue_type]}</span>
                          <span>• {format(new Date(issue.created_at), 'MMM d, yyyy')}</span>
                        </div>
                        {issue.resolution_notes && (
                          <p className="text-sm text-muted-foreground mt-1 italic">
                            Resolution: {issue.resolution_notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={
                      issue.status === 'open' ? 'destructive' :
                      issue.status === 'in_progress' ? 'secondary' :
                      issue.status === 'resolved' ? 'default' :
                      'outline'
                    }>
                      {issue.status.replace('_', ' ')}
                    </Badge>
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
