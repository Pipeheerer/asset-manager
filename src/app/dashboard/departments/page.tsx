'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/app/providers'
import { getDepartments, Department } from '@/lib/database'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { 
  Plus, 
  Briefcase, 
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle
} from 'lucide-react'

export default function DepartmentsPage() {
  const { role, loading: authLoading } = useAuth()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null)
  
  const [formData, setFormData] = useState({ name: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (role === 'admin') {
      fetchDepartments()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [role, authLoading])

  const fetchDepartments = async () => {
    try {
      const departmentsData = await getDepartments()
      setDepartments(departmentsData)
    } catch (error) {
      console.error('Error fetching departments:', error)
    } finally {
      setLoading(false)
    }
  }

  const closeDialogs = () => {
    setShowCreateDialog(false)
    setShowEditDialog(false)
    setShowDeleteDialog(false)
    setEditingDepartment(null)
    setDeletingDepartment(null)
    setFormData({ name: '' })
    setError('')
  }

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const response = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create department')
      }

      setDepartments([...departments, data.department])
      setShowCreateDialog(false)
      setSuccess('Department created successfully!')
      setFormData({ name: '' })
    } catch (error: any) {
      setError(error.message || 'Failed to create department')
    } finally {
      setSubmitting(false)
    }
  }

  const openEditDialog = (department: Department) => {
    setEditingDepartment(department)
    setFormData({ name: department.name })
    setShowEditDialog(true)
  }

  const handleEditDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDepartment) return
    
    setError('')
    setSubmitting(true)

    try {
      const response = await fetch('/api/admin/departments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingDepartment.id, name: formData.name })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update department')
      }

      setDepartments(departments.map(d => d.id === editingDepartment.id ? data.department : d))
      setShowEditDialog(false)
      setEditingDepartment(null)
      setSuccess('Department updated successfully!')
      setFormData({ name: '' })
    } catch (error: any) {
      setError(error.message || 'Failed to update department')
    } finally {
      setSubmitting(false)
    }
  }

  const openDeleteDialog = (department: Department) => {
    setDeletingDepartment(department)
    setShowDeleteDialog(true)
  }

  const handleDeleteDepartment = async () => {
    if (!deletingDepartment) return
    
    setError('')
    setSubmitting(true)

    try {
      const response = await fetch(`/api/admin/departments?id=${deletingDepartment.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete department')
      }

      setDepartments(departments.filter(d => d.id !== deletingDepartment.id))
      setShowDeleteDialog(false)
      setDeletingDepartment(null)
      setSuccess('Department deleted successfully!')
    } catch (error: any) {
      setError(error.message || 'Failed to delete department')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Departments</h1>
          <p className="text-muted-foreground">Manage company departments</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </Button>
      </div>

      {error && !showCreateDialog && !showEditDialog && !showDeleteDialog && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Create Department Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => !open && closeDialogs()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Department</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateDepartment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Department Name</Label>
              <Input
                id="name"
                placeholder="e.g., Engineering, Marketing, Sales"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialogs}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Department
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => !open && closeDialogs()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditDepartment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">Department Name</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialogs}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Department Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={(open) => !open && closeDialogs()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Department
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete this department? This action cannot be undone.
            </p>
            {deletingDepartment && (
              <div className="p-4 rounded-lg bg-muted">
                <p className="font-medium">{deletingDepartment.name}</p>
              </div>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialogs}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteDepartment}
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center py-8">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No departments found</h3>
              <p className="text-muted-foreground">Create your first department to get started</p>
            </CardContent>
          </Card>
        ) : (
          departments.map((department) => (
            <Card key={department.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="shrink-0">
                      <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Briefcase className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-foreground">{department.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(department.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditDialog(department)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => openDeleteDialog(department)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
