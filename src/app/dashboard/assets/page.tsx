'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { 
  getAssetsWithFilters, 
  deleteAsset, 
  getCategories, 
  getDepartments, 
  createAsset,
  updateAsset,
  assignAsset,
  returnAsset,
  getUsers,
  exportAssetsToCSV,
  AssetWithDetails, 
  Category, 
  Department,
  User,
  AssetFilters,
  AssetStatus
} from '@/lib/database'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Package,
  Calendar,
  DollarSign,
  Building,
  Filter,
  Download,
  UserPlus,
  UserMinus,
  X,
  Eye,
  Shield,
  FileText,
  MapPin,
  Hash,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'

// Status badge component
function StatusBadge({ status }: { status: AssetStatus }) {
  const statusConfig: Record<AssetStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
    available: { label: 'Available', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
    assigned: { label: 'Assigned', variant: 'secondary', icon: <UserPlus className="h-3 w-3" /> },
    in_repair: { label: 'In Repair', variant: 'outline', icon: <Clock className="h-3 w-3" /> },
    retired: { label: 'Retired', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> }
  }
  
  const config = statusConfig[status] || statusConfig.available
  
  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      {config.icon}
      {config.label}
    </Badge>
  )
}

// Initial form data
const initialFormData = {
  name: '',
  category_id: '',
  date_purchased: '',
  cost: '',
  department_id: '',
  serial_number: '',
  description: '',
  location: '',
  warranty_expiry: '',
  warranty_notes: '',
  insurance_provider: '',
  insurance_policy_number: '',
  insurance_expiry: '',
  insurance_coverage: '',
  status: 'available' as AssetStatus
}

export default function AssetsPage() {
  const { user, role } = useAuth()
  const searchParams = useSearchParams()
  const [assets, setAssets] = useState<AssetWithDetails[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  
  // Initialize filters from URL search params
  const initialSearch = searchParams.get('search') || ''
  const actionParam = searchParams.get('action')
  const [filters, setFilters] = useState<AssetFilters>({ search: initialSearch || undefined })
  const [showFilters, setShowFilters] = useState(false)
  
  // Open create modal if action=create in URL
  useEffect(() => {
    if (actionParam === 'create') {
      setFormData(initialFormData)
      setWizardStep(0)
      setFormError('')
      setIsSubmitting(false)
      setShowCreateModal(true)
    }
  }, [actionParam])
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<AssetWithDetails | null>(null)
  
  // Wizard step for create modal (0 = basic, 1 = warranty, 2 = insurance)
  const [wizardStep, setWizardStep] = useState(0)
  
  // Form data
  const [formData, setFormData] = useState(initialFormData)
  const [assignData, setAssignData] = useState({ user_id: '', notes: '' })
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isAdmin = role === 'admin'

  const fetchData = useCallback(async () => {
    try {
      const [assetsData, categoriesData, departmentsData, usersData] = await Promise.all([
        getAssetsWithFilters(filters, user?.id, isAdmin),
        getCategories(),
        getDepartments(),
        isAdmin ? getUsers() : Promise.resolve([])
      ])
      setAssets(assetsData)
      setCategories(categoriesData)
      setDepartments(departmentsData)
      setUsers(usersData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [filters, user?.id, isAdmin])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, fetchData])

  const handleCreateAsset = async () => {
    if (isSubmitting) return
    
    setFormError('')
    setIsSubmitting(true)
    
    try {
      // Validate required fields
      if (!formData.name || !formData.category_id || !formData.department_id || !formData.date_purchased || !formData.cost) {
        throw new Error('Please fill in all required fields')
      }
      
      // Send all form data including optional fields
      const assetData = {
        name: formData.name,
        category_id: formData.category_id,
        department_id: formData.department_id,
        date_purchased: formData.date_purchased,
        cost: parseFloat(formData.cost),
        user_id: user!.id,
        status: formData.status || 'available',
        // Optional fields
        serial_number: formData.serial_number || null,
        description: formData.description || null,
        location: formData.location || null,
        // Warranty fields
        warranty_expiry: formData.warranty_expiry || null,
        warranty_notes: formData.warranty_notes || null,
        // Insurance fields
        insurance_provider: formData.insurance_provider || null,
        insurance_policy_number: formData.insurance_policy_number || null,
        insurance_expiry: formData.insurance_expiry || null,
        insurance_coverage: formData.insurance_coverage ? parseFloat(formData.insurance_coverage) : null
      }
      
      await createAsset(assetData)
      await fetchData()
      setShowCreateModal(false)
      setWizardStep(0)
      setFormData(initialFormData)
    } catch (error: any) {
      console.error('Create asset error:', error)
      setFormError(error.message || 'Error creating asset. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAsset) return
    setFormError('')
    
    try {
      const updates = {
        name: formData.name,
        category_id: formData.category_id,
        date_purchased: formData.date_purchased,
        cost: parseFloat(formData.cost),
        department_id: formData.department_id,
        serial_number: formData.serial_number || null,
        description: formData.description || null,
        location: formData.location || null,
        status: formData.status,
        warranty_expiry: formData.warranty_expiry || null,
        warranty_notes: formData.warranty_notes || null,
        insurance_provider: formData.insurance_provider || null,
        insurance_policy_number: formData.insurance_policy_number || null,
        insurance_expiry: formData.insurance_expiry || null,
        insurance_coverage: formData.insurance_coverage ? parseFloat(formData.insurance_coverage) : null
      }
      
      await updateAsset(selectedAsset.id, updates)
      await fetchData()
      setShowEditModal(false)
      setSelectedAsset(null)
      setFormData(initialFormData)
    } catch (error: any) {
      setFormError(error.message || 'Error updating asset')
    }
  }

  const handleDeleteAsset = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset? This action cannot be undone.')) return
    
    try {
      await deleteAsset(id)
      await fetchData()
    } catch (error) {
      console.error('Error deleting asset:', error)
    }
  }

  const handleAssignAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAsset || !assignData.user_id) return
    
    try {
      await assignAsset(selectedAsset.id, assignData.user_id, user!.id, assignData.notes)
      await fetchData()
      setShowAssignModal(false)
      setSelectedAsset(null)
      setAssignData({ user_id: '', notes: '' })
    } catch (error) {
      console.error('Error assigning asset:', error)
    }
  }

  const handleReturnAsset = async (asset: AssetWithDetails) => {
    if (!confirm('Return this asset and mark it as available?')) return
    
    try {
      await returnAsset(asset.id, user!.id)
      await fetchData()
    } catch (error) {
      console.error('Error returning asset:', error)
    }
  }

  const handleExportCSV = async () => {
    try {
      const csvData = await exportAssetsToCSV(filters)
      const blob = new Blob([csvData], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `assets-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting CSV:', error)
    }
  }

  const openEditModal = (asset: AssetWithDetails) => {
    setSelectedAsset(asset)
    setFormData({
      name: asset.name,
      category_id: asset.category_id,
      date_purchased: asset.date_purchased,
      cost: asset.cost.toString(),
      department_id: asset.department_id,
      serial_number: asset.serial_number || '',
      description: asset.description || '',
      location: asset.location || '',
      warranty_expiry: asset.warranty_expiry || '',
      warranty_notes: asset.warranty_notes || '',
      insurance_provider: asset.insurance_provider || '',
      insurance_policy_number: asset.insurance_policy_number || '',
      insurance_expiry: asset.insurance_expiry || '',
      insurance_coverage: asset.insurance_coverage?.toString() || '',
      status: asset.status || 'available'
    })
    setShowEditModal(true)
  }

  const openAssignModal = (asset: AssetWithDetails) => {
    setSelectedAsset(asset)
    setAssignData({ user_id: '', notes: '' })
    setShowAssignModal(true)
  }

  const openDetailModal = (asset: AssetWithDetails) => {
    setSelectedAsset(asset)
    setShowDetailModal(true)
  }

  const clearFilters = () => {
    setFilters({})
  }

  const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== '').length

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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Assets</h1>
          <p className="text-muted-foreground">
            {isAdmin ? `${assets.length} total assets` : `${assets.length} assets assigned to you`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => { setFormData(initialFormData); setWizardStep(0); setFormError(''); setIsSubmitting(false); setShowCreateModal(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, serial number, or description..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
                  className="pl-10"
                />
              </div>
              <Button 
                variant={showFilters ? "secondary" : "outline"} 
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2">{activeFilterCount}</Badge>
                )}
              </Button>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                <div>
                  <Label>Category</Label>
                  <Select 
                    value={filters.category_id || 'all'} 
                    onValueChange={(v) => setFilters({ ...filters, category_id: v === 'all' ? undefined : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Department</Label>
                  <Select 
                    value={filters.department_id || 'all'} 
                    onValueChange={(v) => setFilters({ ...filters, department_id: v === 'all' ? undefined : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All departments</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select 
                    value={filters.status || 'all'} 
                    onValueChange={(v) => setFilters({ ...filters, status: v === 'all' ? undefined : (v as AssetStatus) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="in_repair">In Repair</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button variant="ghost" onClick={clearFilters} className="w-full">
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assets Grid */}
      <div className="grid gap-4">
        {assets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No assets found</h3>
              <p className="text-muted-foreground mb-4">
                {activeFilterCount > 0 ? 'Try adjusting your filters' : 'Create your first asset to get started'}
              </p>
              {activeFilterCount > 0 && (
                <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
              )}
            </CardContent>
          </Card>
        ) : (
          assets.map((asset) => (
            <Card key={asset.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground truncate">{asset.name}</h3>
                      <StatusBadge status={asset.status || 'available'} />
                    </div>
                    
                    {/* Main Info Row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-3">
                      {asset.serial_number && (
                        <span className="flex items-center">
                          <Hash className="h-4 w-4 mr-1" />
                          {asset.serial_number}
                        </span>
                      )}
                      <span className="flex items-center">
                        <Package className="h-4 w-4 mr-1" />
                        {asset.category?.name}
                      </span>
                      <span className="flex items-center">
                        <Building className="h-4 w-4 mr-1" />
                        {asset.department?.name}
                      </span>
                      <span className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        ${asset.cost?.toLocaleString()}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(asset.date_purchased).toLocaleDateString()}
                      </span>
                      {asset.location && (
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {asset.location}
                        </span>
                      )}
                    </div>

                    {/* Assigned User / Warranty / Insurance Alerts */}
                    <div className="flex flex-wrap items-center gap-2">
                      {asset.assigned_user && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <UserPlus className="h-3 w-3" />
                          {asset.assigned_user.email}
                        </Badge>
                      )}
                      {asset.warranty_expiry && new Date(asset.warranty_expiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Warranty {new Date(asset.warranty_expiry) < new Date() ? 'Expired' : 'Expiring Soon'}
                        </Badge>
                      )}
                      {asset.insurance_expiry && new Date(asset.insurance_expiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Insurance {new Date(asset.insurance_expiry) < new Date() ? 'Expired' : 'Expiring Soon'}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openDetailModal(asset)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                      <>
                        {asset.status === 'available' && (
                          <Button variant="ghost" size="sm" onClick={() => openAssignModal(asset)}>
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        )}
                        {asset.status === 'assigned' && (
                          <Button variant="ghost" size="sm" onClick={() => handleReturnAsset(asset)}>
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(asset)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Asset Modal */}
      <Dialog open={showCreateModal || showEditModal} onOpenChange={(open) => {
        if (!open) {
          setShowCreateModal(false)
          setShowEditModal(false)
          setFormError('')
          setWizardStep(0)
          setIsSubmitting(false)
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{showEditModal ? 'Edit Asset' : 'Create New Asset'}</DialogTitle>
            <DialogDescription>
              {showEditModal ? 'Update asset information' : (
                wizardStep === 0 ? 'Step 1 of 3: Basic Information' :
                wizardStep === 1 ? 'Step 2 of 3: Warranty Details (Optional)' :
                'Step 3 of 3: Insurance Details (Optional)'
              )}
            </DialogDescription>
          </DialogHeader>
          
          {/* Progress Indicator for Create Mode */}
          {!showEditModal && (
            <div className="flex flex-col items-center gap-3 py-4 px-4 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-600">
              <div className="flex items-center gap-2">
                {[0, 1, 2].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-md ${
                      wizardStep === step 
                        ? 'bg-indigo-700 text-white ring-4 ring-indigo-300 dark:ring-indigo-500' 
                        : wizardStep > step 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300 border-2 border-slate-400 dark:border-slate-500'
                    }`}>
                      {wizardStep > step ? <CheckCircle className="h-5 w-5" /> : step + 1}
                    </div>
                    {step < 2 && (
                      <div className={`w-16 h-1.5 mx-2 rounded ${wizardStep > step ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between w-full max-w-sm text-xs font-semibold">
                <span className={wizardStep === 0 ? 'text-indigo-700 dark:text-indigo-400' : wizardStep > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}>Basic Info</span>
                <span className={wizardStep === 1 ? 'text-indigo-700 dark:text-indigo-400' : wizardStep > 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}>Warranty</span>
                <span className={wizardStep === 2 ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}>Insurance</span>
              </div>
            </div>
          )}
          
          {showEditModal ? (
            <form onSubmit={handleEditAsset}>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="warranty">Warranty</TabsTrigger>
                  <TabsTrigger value="insurance">Insurance</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="name">Asset Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="serial_number">Serial Number</Label>
                      <Input
                        id="serial_number"
                        value={formData.serial_number}
                        onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                        placeholder="e.g., SN-12345"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cost">Cost *</Label>
                      <Input
                        id="cost"
                        type="number"
                        step="0.01"
                        value={formData.cost}
                        onChange={(e) => setFormData({...formData, cost: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select value={formData.category_id} onValueChange={(v) => setFormData({...formData, category_id: v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="department">Department *</Label>
                      <Select value={formData.department_id} onValueChange={(v) => setFormData({...formData, department_id: v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map(dept => (
                            <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="date">Date Purchased *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date_purchased}
                        onChange={(e) => setFormData({...formData, date_purchased: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v as AssetStatus})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="in_repair">In Repair</SelectItem>
                          <SelectItem value="retired">Retired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        placeholder="e.g., Building A, Room 101"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Additional notes about this asset..."
                        rows={3}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="warranty" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="warranty_expiry">Warranty Expiry Date</Label>
                      <Input
                        id="warranty_expiry"
                        type="date"
                        value={formData.warranty_expiry}
                        onChange={(e) => setFormData({...formData, warranty_expiry: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="warranty_notes">Warranty Notes</Label>
                      <Textarea
                        id="warranty_notes"
                        value={formData.warranty_notes}
                        onChange={(e) => setFormData({...formData, warranty_notes: e.target.value})}
                        placeholder="Warranty terms, coverage details, vendor contact..."
                        rows={3}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="insurance" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="insurance_provider">Insurance Provider</Label>
                      <Input
                        id="insurance_provider"
                        value={formData.insurance_provider}
                        onChange={(e) => setFormData({...formData, insurance_provider: e.target.value})}
                        placeholder="e.g., ABC Insurance Co."
                      />
                    </div>
                    <div>
                      <Label htmlFor="insurance_policy_number">Policy Number</Label>
                      <Input
                        id="insurance_policy_number"
                        value={formData.insurance_policy_number}
                        onChange={(e) => setFormData({...formData, insurance_policy_number: e.target.value})}
                        placeholder="e.g., POL-123456"
                      />
                    </div>
                    <div>
                      <Label htmlFor="insurance_expiry">Insurance Expiry Date</Label>
                      <Input
                        id="insurance_expiry"
                        type="date"
                        value={formData.insurance_expiry}
                        onChange={(e) => setFormData({...formData, insurance_expiry: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="insurance_coverage">Coverage Amount</Label>
                      <Input
                        id="insurance_coverage"
                        type="number"
                        step="0.01"
                        value={formData.insurance_coverage}
                        onChange={(e) => setFormData({...formData, insurance_coverage: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              {formError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                  {formError}
                </div>
              )}
              
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => {
                  setShowEditModal(false)
                  setFormError('')
                }}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          ) : (
            /* For Create Mode - Show Wizard Steps (no form, just div) */
            <div>
              <div className="space-y-4 mt-4">
                {/* Step 1: Basic Info */}
                {wizardStep === 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="name">Asset Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="serial_number">Serial Number</Label>
                      <Input
                        id="serial_number"
                        value={formData.serial_number}
                        onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                        placeholder="e.g., SN-12345"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cost">Cost *</Label>
                      <Input
                        id="cost"
                        type="number"
                        step="0.01"
                        value={formData.cost}
                        onChange={(e) => setFormData({...formData, cost: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select value={formData.category_id} onValueChange={(v) => setFormData({...formData, category_id: v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="department">Department *</Label>
                      <Select value={formData.department_id} onValueChange={(v) => setFormData({...formData, department_id: v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map(dept => (
                            <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="date">Date Purchased *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date_purchased}
                        onChange={(e) => setFormData({...formData, date_purchased: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        placeholder="e.g., Building A, Room 101"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Additional notes about this asset..."
                        rows={3}
                      />
                    </div>
                  </div>
                )}
                
                {/* Step 2: Warranty */}
                {wizardStep === 1 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg mb-2 border border-indigo-200 dark:border-indigo-700">
                      <p className="text-sm text-indigo-800 dark:text-indigo-200 font-medium">
                        Add warranty information if available. You can skip this step if the asset doesn't have a warranty.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="warranty_expiry">Warranty Expiry Date</Label>
                      <Input
                        id="warranty_expiry"
                        type="date"
                        value={formData.warranty_expiry}
                        onChange={(e) => setFormData({...formData, warranty_expiry: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="warranty_notes">Warranty Notes</Label>
                      <Textarea
                        id="warranty_notes"
                        value={formData.warranty_notes}
                        onChange={(e) => setFormData({...formData, warranty_notes: e.target.value})}
                        placeholder="Warranty terms, coverage details, vendor contact..."
                        rows={4}
                      />
                    </div>
                  </div>
                )}
                
                {/* Step 3: Insurance */}
                {wizardStep === 2 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg mb-2 border border-emerald-200 dark:border-emerald-700">
                      <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">
                        Add insurance information if the asset is insured. You can skip this if not applicable.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="insurance_provider">Insurance Provider</Label>
                      <Input
                        id="insurance_provider"
                        value={formData.insurance_provider}
                        onChange={(e) => setFormData({...formData, insurance_provider: e.target.value})}
                        placeholder="e.g., ABC Insurance Co."
                      />
                    </div>
                    <div>
                      <Label htmlFor="insurance_policy_number">Policy Number</Label>
                      <Input
                        id="insurance_policy_number"
                        value={formData.insurance_policy_number}
                        onChange={(e) => setFormData({...formData, insurance_policy_number: e.target.value})}
                        placeholder="e.g., POL-123456"
                      />
                    </div>
                    <div>
                      <Label htmlFor="insurance_expiry">Insurance Expiry Date</Label>
                      <Input
                        id="insurance_expiry"
                        type="date"
                        value={formData.insurance_expiry}
                        onChange={(e) => setFormData({...formData, insurance_expiry: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="insurance_coverage">Coverage Amount</Label>
                      <Input
                        id="insurance_coverage"
                        type="number"
                        step="0.01"
                        value={formData.insurance_coverage}
                        onChange={(e) => setFormData({...formData, insurance_coverage: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {formError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                  {formError}
                </div>
              )}

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => {
                  if (wizardStep === 0) {
                    setShowCreateModal(false)
                    setFormError('')
                    setWizardStep(0)
                    setIsSubmitting(false)
                  } else {
                    setWizardStep(wizardStep - 1)
                  }
                }}>
                  {wizardStep === 0 ? 'Cancel' : 'Back'}
                </Button>
                
                {wizardStep < 2 ? (
                  <Button 
                    type="button" 
                    className="bg-indigo-700 hover:bg-indigo-800 text-white"
                    onClick={() => {
                      // Validate required fields on step 0
                      if (wizardStep === 0) {
                        if (!formData.name || !formData.category_id || !formData.department_id || !formData.date_purchased || !formData.cost) {
                          setFormError('Please fill in all required fields (Name, Category, Department, Date, Cost)')
                          return
                        }
                        setFormError('')
                      }
                      setWizardStep(wizardStep + 1)
                    }}
                  >
                    Next
                  </Button>
                ) : (
                  <Button 
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleCreateAsset}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold min-w-[120px]"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                        Creating...
                      </span>
                    ) : 'Create Asset'}
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Asset Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Asset</DialogTitle>
            <DialogDescription>
              Assign "{selectedAsset?.name}" to a user
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAssignAsset} className="space-y-4">
            <div>
              <Label>Assign To *</Label>
              <Select value={assignData.user_id} onValueChange={(v) => setAssignData({...assignData, user_id: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={assignData.notes}
                onChange={(e) => setAssignData({...assignData, notes: e.target.value})}
                placeholder="Optional notes about this assignment..."
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAssignModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!assignData.user_id}>
                Assign Asset
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Asset Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAsset?.name}
              {selectedAsset && <StatusBadge status={selectedAsset.status || 'available'} />}
            </DialogTitle>
          </DialogHeader>
          
          {selectedAsset && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Serial Number:</span>
                  <p className="font-medium">{selectedAsset.serial_number || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <p className="font-medium">{selectedAsset.category?.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Department:</span>
                  <p className="font-medium">{selectedAsset.department?.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Cost:</span>
                  <p className="font-medium">${selectedAsset.cost?.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date Purchased:</span>
                  <p className="font-medium">{new Date(selectedAsset.date_purchased).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Location:</span>
                  <p className="font-medium">{selectedAsset.location || 'N/A'}</p>
                </div>
                {selectedAsset.assigned_user && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Assigned To:</span>
                    <p className="font-medium">{selectedAsset.assigned_user.email}</p>
                  </div>
                )}
                {selectedAsset.description && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Description:</span>
                    <p className="font-medium">{selectedAsset.description}</p>
                  </div>
                )}
              </div>

              {/* Warranty Info */}
              {(selectedAsset.warranty_expiry || selectedAsset.warranty_notes) && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Warranty Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Expiry Date:</span>
                      <p className="font-medium">{selectedAsset.warranty_expiry ? new Date(selectedAsset.warranty_expiry).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    {selectedAsset.warranty_notes && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Notes:</span>
                        <p className="font-medium">{selectedAsset.warranty_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Insurance Info */}
              {(selectedAsset.insurance_provider || selectedAsset.insurance_expiry) && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Insurance Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Provider:</span>
                      <p className="font-medium">{selectedAsset.insurance_provider || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Policy Number:</span>
                      <p className="font-medium">{selectedAsset.insurance_policy_number || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Expiry Date:</span>
                      <p className="font-medium">{selectedAsset.insurance_expiry ? new Date(selectedAsset.insurance_expiry).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Coverage Amount:</span>
                      <p className="font-medium">{selectedAsset.insurance_coverage ? `$${selectedAsset.insurance_coverage.toLocaleString()}` : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
