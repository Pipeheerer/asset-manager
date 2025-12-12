'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  Package, 
  UserPlus, 
  Tags, 
  Building2,
  Zap,
  Loader2,
  ShieldCheck,
  ExternalLink
} from 'lucide-react'
import { createAsset, createCategory, createDepartment, getCategories, getDepartments } from '@/lib/database'
import { supabase } from '@/lib/supabase'

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
}

interface QuickActionItem {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  isExternal?: boolean
  href?: string
}

const quickActions: QuickActionItem[] = [
  {
    id: 'add-asset',
    title: 'Add Asset',
    description: 'Register a new asset',
    icon: Package,
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    id: 'warranty-centre',
    title: 'Warranty Centre',
    description: 'Manage warranties',
    icon: ShieldCheck,
    color: 'bg-emerald-500 hover:bg-emerald-600',
    isExternal: true,
    href: 'https://server11.eport.ws/logout'
  },
  {
    id: 'add-user',
    title: 'Create User',
    description: 'Add a new user',
    icon: UserPlus,
    color: 'bg-green-500 hover:bg-green-600'
  },
  {
    id: 'add-category',
    title: 'Add Category',
    description: 'Create asset category',
    icon: Tags,
    color: 'bg-purple-500 hover:bg-purple-600'
  },
  {
    id: 'add-department',
    title: 'Add Department',
    description: 'Create department',
    icon: Building2,
    color: 'bg-orange-500 hover:bg-orange-600'
  }
]

export function QuickActions() {
  const [openDialog, setOpenDialog] = useState<string | null>(null)
  const router = useRouter()

  const handleSuccess = () => {
    setOpenDialog(null)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-yellow-500" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {quickActions.map((action) => (
            action.isExternal ? (
              <Button
                key={action.id}
                variant="outline"
                onClick={() => window.open(action.href, '_blank')}
                className="group h-auto flex-col gap-2 p-4 hover:border-emerald-500 hover:bg-emerald-500 dark:hover:bg-emerald-600 transition-all duration-200"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color} text-white transition-transform group-hover:scale-110`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-foreground group-hover:text-white transition-colors flex items-center gap-1">
                  {action.title}
                  <ExternalLink className="h-3 w-3" />
                </span>
              </Button>
            ) : (
              <Dialog 
                key={action.id} 
                open={openDialog === action.id} 
                onOpenChange={(open) => setOpenDialog(open ? action.id : null)}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="group h-auto flex-col gap-2 p-4 hover:border-blue-500 hover:bg-blue-500 dark:hover:bg-blue-600 transition-all duration-200"
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color} text-white transition-transform group-hover:scale-110`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-foreground group-hover:text-white transition-colors">{action.title}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <action.icon className="h-5 w-5" />
                      {action.title}
                    </DialogTitle>
                    <DialogDescription>
                      {action.description}. Fill in the details below.
                    </DialogDescription>
                  </DialogHeader>
                  
                  {/* Dynamic form based on action type */}
                  {action.id === 'add-asset' && <AssetForm onSuccess={handleSuccess} onCancel={() => setOpenDialog(null)} onFullForm={() => { setOpenDialog(null); router.push('/dashboard/assets?action=create') }} />}
                  {action.id === 'add-user' && <UserForm onSuccess={handleSuccess} onCancel={() => setOpenDialog(null)} />}
                  {action.id === 'add-category' && <CategoryForm onSuccess={handleSuccess} onCancel={() => setOpenDialog(null)} />}
                  {action.id === 'add-department' && <DepartmentForm onSuccess={handleSuccess} onCancel={() => setOpenDialog(null)} />}
                </DialogContent>
              </Dialog>
            )
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface FormProps {
  onSuccess: () => void
  onCancel: () => void
}

interface AssetFormProps extends FormProps {
  onFullForm?: () => void
}

function AssetForm({ onSuccess, onCancel, onFullForm }: AssetFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<{id: string, name: string}[]>([])
  const [departments, setDepartments] = useState<{id: string, name: string}[]>([])
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    department_id: '',
    cost: '',
    date_purchased: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      const [cats, depts] = await Promise.all([getCategories(), getDepartments()])
      setCategories(cats)
      setDepartments(depts)
    }
    fetchData()
  }, [])

  const handleSubmit = async () => {
    if (!formData.name || !formData.category_id || !formData.department_id) {
      setError('Please fill in all required fields')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      await createAsset({
        name: formData.name,
        category_id: formData.category_id,
        department_id: formData.department_id,
        cost: parseFloat(formData.cost) || 0,
        date_purchased: formData.date_purchased || new Date().toISOString().split('T')[0],
        user_id: user.id
      })
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to create asset')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Form Fields */}
      <div className="grid gap-4 py-2">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-2">
          <Label htmlFor="asset-name">Asset Name *</Label>
          <Input 
            id="asset-name" 
            placeholder="e.g., MacBook Pro 16" 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category_id} onValueChange={(v) => setFormData({...formData, category_id: v})}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="department">Department *</Label>
            <Select value={formData.department_id} onValueChange={(v) => setFormData({...formData, department_id: v})}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="cost">Cost ($)</Label>
            <Input 
              id="cost" 
              type="number" 
              placeholder="0.00" 
              value={formData.cost}
              onChange={(e) => setFormData({...formData, cost: e.target.value})}
              className="w-full"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="purchase-date">Purchase Date</Label>
            <Input 
              id="purchase-date" 
              type="date" 
              value={formData.date_purchased}
              onChange={(e) => setFormData({...formData, date_purchased: e.target.value})}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Full Form Button - Prominent styled button */}
      {onFullForm && (
        <Button 
          type="button"
          variant="outline"
          onClick={onFullForm} 
          disabled={loading}
          className="w-full border-2 border-dashed border-indigo-400 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:border-indigo-500 dark:hover:border-indigo-400 text-indigo-700 dark:text-indigo-300 font-medium py-3 rounded-xl transition-all duration-200 backdrop-blur-sm shadow-sm hover:shadow-md"
        >
          <Plus className="mr-2 h-4 w-4" />
          Full Form with Warranty & Insurance
        </Button>
      )}

      {/* Action Buttons */}
      <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2 border-t">
        <Button variant="outline" onClick={onCancel} disabled={loading} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading} className="w-full sm:w-auto">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Quick Create
        </Button>
      </DialogFooter>
    </div>
  )
}

function UserForm({ onSuccess, onCancel }: FormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user'
  })

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      // Create user via Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })
      
      if (authError) throw authError
      
      // Update role in users table
      if (data.user) {
        await supabase.from('users').update({ role: formData.role }).eq('id', data.user.id)
      }
      
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="grid gap-4 py-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-2">
          <Label htmlFor="user-email">Email *</Label>
          <Input 
            id="user-email" 
            type="email" 
            placeholder="user@example.com" 
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="user-password">Password *</Label>
          <Input 
            id="user-password" 
            type="password" 
            placeholder="••••••••" 
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="user-role">Role</Label>
          <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Create User
        </Button>
      </DialogFooter>
    </>
  )
}

function CategoryForm({ onSuccess, onCancel }: FormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Please enter a category name')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      await createCategory(name.trim())
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to create category')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="grid gap-4 py-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-2">
          <Label htmlFor="category-name">Category Name *</Label>
          <Input 
            id="category-name" 
            placeholder="e.g., Laptop" 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Create Category
        </Button>
      </DialogFooter>
    </>
  )
}

function DepartmentForm({ onSuccess, onCancel }: FormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Please enter a department name')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      await createDepartment(name.trim())
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to create department')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="grid gap-4 py-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-2">
          <Label htmlFor="department-name">Department Name *</Label>
          <Input 
            id="department-name" 
            placeholder="e.g., Engineering" 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Create Department
        </Button>
      </DialogFooter>
    </>
  )
}
