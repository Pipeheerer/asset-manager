'use client'

import { useState } from 'react'
import { useAuth } from '@/app/providers'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { exportAssetsToCSV, getCategories, getDepartments, Category, Department } from '@/lib/database'
import { 
  Download, 
  FileSpreadsheet,
  Package,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { useEffect } from 'react'

export default function ReportsPage() {
  const { role, loading: authLoading } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)
  
  // Export filters
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [includeExpiring, setIncludeExpiring] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const [cats, depts] = await Promise.all([
        getCategories(),
        getDepartments()
      ])
      setCategories(cats)
      setDepartments(depts)
    }
    fetchData()
  }, [])

  const handleExport = async (overrideFilters?: { status?: string; warranty_expiring?: boolean }) => {
    setIsExporting(true)
    setExportSuccess(false)
    
    try {
      // Build filters - use override if provided, otherwise use state
      const filters: any = {}
      
      if (overrideFilters) {
        // Quick action export with specific filters
        if (overrideFilters.status) filters.status = overrideFilters.status
        if (overrideFilters.warranty_expiring) filters.warranty_expiring = true
      } else {
        // Regular export using form state
        if (selectedCategory) filters.category_id = selectedCategory
        if (selectedDepartment) filters.department_id = selectedDepartment
        if (selectedStatus) filters.status = selectedStatus
        if (includeExpiring) filters.warranty_expiring = true
      }
      
      const csvData = await exportAssetsToCSV(Object.keys(filters).length > 0 ? filters : undefined)
      
      // Generate filename based on filters
      let filename = 'assets-export'
      if (overrideFilters?.status) filename = `${overrideFilters.status}-assets`
      else if (overrideFilters?.warranty_expiring) filename = 'expiring-assets'
      filename += `-${new Date().toISOString().split('T')[0]}.csv`
      
      // Download the file
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 3000)
    } catch (error) {
      console.error('Error exporting:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const clearFilters = () => {
    setSelectedCategory('')
    setSelectedDepartment('')
    setSelectedStatus('')
    setIncludeExpiring(false)
  }

  // Loading state
  if (authLoading) {
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Export Data
        </h1>
        <p className="text-muted-foreground">
          Export your asset data to CSV format for analysis or backup
        </p>
      </div>

      {/* Export Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-500" />
            Export Assets to CSV
          </CardTitle>
          <CardDescription>
            Download a spreadsheet of your assets with optional filters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={selectedCategory || 'all'} onValueChange={(v) => setSelectedCategory(v === 'all' ? '' : v)}>
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
              <Select value={selectedDepartment || 'all'} onValueChange={(v) => setSelectedDepartment(v === 'all' ? '' : v)}>
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
              <Select value={selectedStatus || 'all'} onValueChange={(v) => setSelectedStatus(v === 'all' ? '' : v)}>
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
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Additional Options */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="expiring" 
              checked={includeExpiring}
              onCheckedChange={(checked) => setIncludeExpiring(checked as boolean)}
            />
            <Label htmlFor="expiring" className="text-sm font-normal cursor-pointer">
              Only include assets with warranty/insurance expiring within 30 days
            </Label>
          </div>

          {/* Export Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Export Includes:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Asset name, serial number, and description
              </li>
              <li className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Category, department, status, and location
              </li>
              <li className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Cost, purchase date, and assigned user
              </li>
              <li className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Warranty and insurance expiry dates
              </li>
            </ul>
          </div>

          {/* Export Button */}
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => handleExport()} 
              disabled={isExporting}
              size="lg"
              className="min-w-[200px]"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : exportSuccess ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Downloaded!
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export to CSV
                </>
              )}
            </Button>
            
            {exportSuccess && (
              <span className="text-sm text-green-600 dark:text-green-400">
                File downloaded successfully
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer" 
          onClick={() => handleExport({ status: 'available' })}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <Download className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-foreground">Available Assets</p>
                <p className="text-sm text-muted-foreground">Export only available assets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer" 
          onClick={() => handleExport({ status: 'assigned' })}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Download className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-foreground">Assigned Assets</p>
                <p className="text-sm text-muted-foreground">Export currently assigned assets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer" 
          onClick={() => handleExport({ warranty_expiring: true })}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Download className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="font-medium text-foreground">Expiring Soon</p>
                <p className="text-sm text-muted-foreground">Warranty/insurance expiring</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
