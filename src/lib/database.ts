import { supabase, supabaseAdmin } from './supabase'

export interface User {
  id: string
  email: string
  role: 'admin' | 'user'
  first_name?: string
  last_name?: string
  department_id?: string
  created_at: string
}

export type AssetStatus = 'available' | 'assigned' | 'in_repair' | 'retired'

export interface Asset {
  id: string
  name: string
  category_id: string
  date_purchased: string
  cost: number
  department_id: string
  user_id: string
  created_at: string
  updated_at: string
  // New fields
  serial_number?: string
  description?: string
  status: AssetStatus
  location?: string
  // Warranty fields
  warranty_expiry?: string
  warranty_notes?: string
  // Insurance fields
  insurance_provider?: string
  insurance_policy_number?: string
  insurance_expiry?: string
  insurance_coverage?: number
  // Assignment fields
  assigned_to?: string
  assigned_date?: string
}

export interface Category {
  id: string
  name: string
  created_at: string
}

export interface Department {
  id: string
  name: string
  created_at: string
}

export interface AssetWithDetails extends Asset {
  category: Category
  department: Department
  user: User
  assigned_user?: User
  last_maintenance_date?: string
  next_maintenance_date?: string
}

// Asset Assignment History
export interface AssetAssignment {
  id: string
  asset_id: string
  user_id: string | null
  action: 'assigned' | 'returned' | 'transferred'
  notes?: string
  assigned_by: string
  created_at: string
  user?: User
  assigned_by_user?: User
}

// Asset Documents
export type DocumentType = 'invoice' | 'warranty' | 'purchase_order' | 'insurance' | 'manual' | 'other'

export interface AssetDocument {
  id: string
  asset_id: string
  name: string
  file_url: string
  file_type: DocumentType
  file_size?: number
  mime_type?: string
  uploaded_by: string
  created_at: string
  uploaded_by_user?: User
}

// Search/Filter options
export interface AssetFilters {
  search?: string
  category_id?: string
  department_id?: string
  status?: AssetStatus
  assigned_to?: string
  warranty_expiring?: boolean
  insurance_expiring?: boolean
}

export interface Maintenance {
  id: string
  asset_id: string
  maintenance_type: 'scheduled' | 'repair' | 'inspection'
  description?: string
  cost: number
  scheduled_date: string
  completed_date?: string
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  notes?: string
  created_at: string
  updated_at: string
}

export interface MaintenanceWithAsset extends Maintenance {
  asset: Asset & { category: Category; department: Department }
}

export async function getUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching users:', error)
      return []
    }
    return data as User[]
  } catch (error) {
    console.error('Error in getUsers:', error)
    return []
  }
}

export async function createUser(userData: Omit<User, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single()
  
  if (error) throw error
  return data as User
}

export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
    return data as User
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    return null
  }
}

export async function updateUserProfile(userId: string, updates: { first_name?: string; last_name?: string }) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data as User
}

export async function updateUser(userId: string, updates: Partial<Omit<User, 'id' | 'created_at'>>) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data as User
}

export async function getAssets(userId?: string, isAdmin = false) {
  try {
    let query = supabase
      .from('assets')
      .select(`
        *,
        category:categories(*),
        department:departments(*),
        user:users!assets_user_id_fkey(*)
      `)
      .order('created_at', { ascending: false })

    if (!isAdmin && userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching assets:', error.message, error.code, error.details, error.hint)
      return []
    }
    return data as AssetWithDetails[]
  } catch (error: any) {
    console.error('Error in getAssets:', error?.message || error)
    return []
  }
}

export async function createAsset(assetData: Record<string, any>) {
  // Build the data object with all provided fields
  const insertData: Record<string, any> = {
    name: assetData.name,
    category_id: assetData.category_id,
    department_id: assetData.department_id,
    date_purchased: assetData.date_purchased,
    cost: assetData.cost,
    user_id: assetData.user_id,
    status: assetData.status || 'available'
  }
  
  // Add optional fields if provided
  if (assetData.serial_number) insertData.serial_number = assetData.serial_number
  if (assetData.description) insertData.description = assetData.description
  if (assetData.location) insertData.location = assetData.location
  
  // Warranty fields
  if (assetData.warranty_expiry) insertData.warranty_expiry = assetData.warranty_expiry
  if (assetData.warranty_notes) insertData.warranty_notes = assetData.warranty_notes
  
  // Insurance fields
  if (assetData.insurance_provider) insertData.insurance_provider = assetData.insurance_provider
  if (assetData.insurance_policy_number) insertData.insurance_policy_number = assetData.insurance_policy_number
  if (assetData.insurance_expiry) insertData.insurance_expiry = assetData.insurance_expiry
  if (assetData.insurance_coverage) insertData.insurance_coverage = parseFloat(assetData.insurance_coverage)
  
  console.log('Creating asset with data:', insertData)
  
  const { data, error } = await supabase
    .from('assets')
    .insert(insertData)
    .select(`
      *,
      category:categories(*),
      department:departments(*),
      user:users!assets_user_id_fkey(*)
    `)
    .single()
  
  if (error) {
    console.error('Supabase error creating asset:', error)
    throw new Error(error.message || 'Failed to create asset')
  }
  
  console.log('Asset created successfully:', data)
  return data as AssetWithDetails
}

export async function deleteAsset(id: string) {
  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

export async function getCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    if (error) {
      console.error('Error fetching categories:', error)
      return []
    }
    return data as Category[]
  } catch (error) {
    console.error('Error in getCategories:', error)
    return []
  }
}

export async function createCategory(name: string) {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name })
    .select()
    .single()
  
  if (error) throw error
  return data as Category
}

export async function getDepartments() {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name')
    
    if (error) {
      console.error('Error fetching departments:', error)
      return []
    }
    return data as Department[]
  } catch (error) {
    console.error('Error in getDepartments:', error)
    return []
  }
}

export async function createDepartment(name: string) {
  const { data, error } = await supabase
    .from('departments')
    .insert({ name })
    .select()
    .single()
  
  if (error) throw error
  return data as Department
}

export async function getUserRole(userId: string, userEmail?: string): Promise<'admin' | 'user' | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (error) {
      // Table doesn't exist or user not found
      if (error.code === 'PGRST116' || error.code === '42P01') {
        // Try to create user profile
        const { data: userData, error: insertError } = await supabase
          .from('users')
          .insert({ 
            id: userId,
            email: userEmail || 'unknown@email.com',
            role: 'user',
            created_at: new Date().toISOString()
          })
          .select('role')
          .single()
        
        if (insertError) {
          // Table might not exist - return default role
          console.warn('Database not set up yet. Using default role.')
          return 'user'
        }
        
        return userData?.role || 'user'
      }
      
      // For any other error, return default role to not block login
      console.warn('Error fetching user role, using default:', error.message || error)
      return 'user'
    }
    
    return data?.role || 'user'
  } catch (error) {
    console.warn('Database error, using default role:', error)
    return 'user'
  }
}

export async function getDashboardStats(isAdmin = false, userId?: string) {
  try {
    const [users, assets, categories, departments] = await Promise.all([
      isAdmin ? getUsers().catch(() => []) : [],
      getAssets(userId, isAdmin).catch(() => []),
      getCategories().catch(() => []),
      getDepartments().catch(() => [])
    ])

    const totalCost = assets.reduce((sum, asset) => sum + (asset.cost || 0), 0)
    const assetsByCategory = assets.reduce((acc, asset) => {
      const categoryName = asset.category?.name || 'Unknown'
      acc[categoryName] = (acc[categoryName] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const assetsByDepartment = assets.reduce((acc, asset) => {
      const deptName = asset.department?.name || 'Unknown'
      acc[deptName] = (acc[deptName] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalUsers: users.length,
      totalAssets: assets.length,
      totalCategories: categories.length,
      totalDepartments: departments.length,
      totalCost,
      assetsByCategory,
      assetsByDepartment,
      recentAssets: assets.slice(0, 5)
    }
  } catch (error) {
    console.error('Error in getDashboardStats:', error)
    return {
      totalUsers: 0,
      totalAssets: 0,
      totalCategories: 0,
      totalDepartments: 0,
      totalCost: 0,
      assetsByCategory: {},
      assetsByDepartment: {},
      recentAssets: []
    }
  }
}

// Maintenance functions
export async function getMaintenanceRecords() {
  try {
    const { data, error } = await supabase
      .from('maintenance')
      .select(`
        *,
        asset:assets(
          id,
          name,
          category:categories(id, name),
          department:departments(id, name)
        )
      `)
      .order('scheduled_date', { ascending: true })
    
    if (error) {
      // Table might not exist yet
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return []
      }
      console.error('Error fetching maintenance records:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    return []
  }
}

export async function getMaintenanceByAsset(assetId: string) {
  try {
    const { data, error } = await supabase
      .from('maintenance')
      .select('*')
      .eq('asset_id', assetId)
      .order('scheduled_date', { ascending: false })
    
    if (error) {
      console.error('Error fetching maintenance for asset:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error in getMaintenanceByAsset:', error)
    return []
  }
}

export async function createMaintenance(maintenance: {
  asset_id: string
  maintenance_type: 'scheduled' | 'repair' | 'inspection'
  description?: string
  cost?: number
  scheduled_date: string
  notes?: string
}) {
  const { data, error } = await supabase
    .from('maintenance')
    .insert({
      ...maintenance,
      status: 'pending',
      cost: maintenance.cost || 0
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateMaintenance(id: string, updates: Partial<Maintenance>) {
  const { data, error } = await supabase
    .from('maintenance')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function completeMaintenance(id: string, cost?: number, notes?: string) {
  const { data, error } = await supabase
    .from('maintenance')
    .update({
      status: 'completed',
      completed_date: new Date().toISOString().split('T')[0],
      cost: cost || 0,
      notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteMaintenance(id: string) {
  const { error } = await supabase
    .from('maintenance')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

export async function getUpcomingMaintenance(daysAhead: number = 30) {
  const today = new Date()
  const futureDate = new Date(today)
  futureDate.setDate(futureDate.getDate() + daysAhead)
  
  try {
    const { data, error } = await supabase
      .from('maintenance')
      .select(`
        *,
        asset:assets(
          id,
          name,
          category:categories(id, name),
          department:departments(id, name)
        )
      `)
      .in('status', ['pending', 'overdue'])
      .lte('scheduled_date', futureDate.toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true })
    
    if (error) {
      // Table might not exist yet - silently return empty array
      return []
    }
    
    return data || []
  } catch (error) {
    // Silently handle if table doesn't exist
    return []
  }
}

export async function getOverdueMaintenance() {
  const today = new Date().toISOString().split('T')[0]
  
  try {
    const { data, error } = await supabase
      .from('maintenance')
      .select(`
        *,
        asset:assets(
          id,
          name,
          category:categories(id, name),
          department:departments(id, name)
        )
      `)
      .eq('status', 'pending')
      .lt('scheduled_date', today)
      .order('scheduled_date', { ascending: true })
    
    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return []
      }
      console.error('Error fetching overdue maintenance:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    return []
  }
}

export async function getAssetsNeedingMaintenance() {
  // Get assets where next_maintenance_date is within 30 days or past
  const today = new Date()
  const thirtyDaysFromNow = new Date(today)
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  
  try {
    const { data, error } = await supabase
      .from('assets')
      .select(`
        *,
        category:categories(id, name),
        department:departments(id, name)
      `)
      .or(`next_maintenance_date.lte.${thirtyDaysFromNow.toISOString().split('T')[0]},next_maintenance_date.is.null`)
      .order('next_maintenance_date', { ascending: true, nullsFirst: true })
    
    if (error) {
      console.error('Error fetching assets needing maintenance:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error in getAssetsNeedingMaintenance:', error)
    return []
  }
}

// Get monthly spending data for charts
export async function getMonthlySpending() {
  try {
    const { data: assets, error } = await supabase
      .from('assets')
      .select('cost, date_purchased, created_at')
      .order('date_purchased', { ascending: true })
    
    if (error) {
      console.error('Error fetching assets for spending:', error)
      return []
    }
    
    // Group by month
    const monthlyData: Record<string, { spend: number; assets: number }> = {}
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    // Initialize all months of current year with 0
    const currentYear = new Date().getFullYear()
    months.forEach(month => {
      monthlyData[month] = { spend: 0, assets: 0 }
    })
    
    // Aggregate asset data by month
    assets?.forEach(asset => {
      const date = new Date(asset.date_purchased || asset.created_at)
      if (date.getFullYear() === currentYear) {
        const monthName = months[date.getMonth()]
        monthlyData[monthName].spend += asset.cost || 0
        monthlyData[monthName].assets += 1
      }
    })
    
    // Convert to array format for charts
    return months.map(month => ({
      month,
      spend: monthlyData[month].spend,
      assets: monthlyData[month].assets
    }))
  } catch (error) {
    console.error('Error in getMonthlySpending:', error)
    return []
  }
}

// =====================
// ENHANCED ASSET FUNCTIONS
// =====================

// Get assets with advanced filtering
export async function getAssetsWithFilters(filters: AssetFilters, userId?: string, isAdmin = false) {
  try {
    // Specify exact foreign key relationship for users
    let query = supabase
      .from('assets')
      .select(`
        *,
        category:categories(*),
        department:departments(*),
        user:users!assets_user_id_fkey(*)
      `)
    
    // Apply category filter
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id)
    }
    
    // Apply department filter
    if (filters.department_id) {
      query = query.eq('department_id', filters.department_id)
    }
    
    // Apply status filter
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    
    // Non-admin users can only see their own assets
    if (!isAdmin && userId) {
      query = query.eq('user_id', userId)
    }
    
    query = query.order('created_at', { ascending: false })
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching filtered assets:', error.message, error.code, error.details, error.hint)
      // Fallback to basic getAssets if filter query fails
      return getAssets(userId, isAdmin)
    }
    
    // Apply search filter client-side for flexibility (searches name, serial_number, description)
    let filteredData = data as AssetWithDetails[]
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filteredData = filteredData.filter(asset => 
        asset.name?.toLowerCase().includes(searchLower) ||
        (asset as any).serial_number?.toLowerCase().includes(searchLower) ||
        (asset as any).description?.toLowerCase().includes(searchLower)
      )
    }
    
    // Apply warranty/insurance expiring filter (within 30 days)
    if (filters.warranty_expiring) {
      const now = new Date()
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      
      filteredData = filteredData.filter(asset => {
        const warrantyExpiry = (asset as any).warranty_expiry ? new Date((asset as any).warranty_expiry) : null
        const insuranceExpiry = (asset as any).insurance_expiry ? new Date((asset as any).insurance_expiry) : null
        
        const warrantyExpiringSoon = warrantyExpiry && warrantyExpiry >= now && warrantyExpiry <= thirtyDaysFromNow
        const insuranceExpiringSoon = insuranceExpiry && insuranceExpiry >= now && insuranceExpiry <= thirtyDaysFromNow
        
        return warrantyExpiringSoon || insuranceExpiringSoon
      })
    }
    
    return filteredData
  } catch (error) {
    console.error('Error in getAssetsWithFilters:', error)
    return []
  }
}

// Update an asset
export async function updateAsset(id: string, updates: Record<string, any>) {
  const safeUpdates: Record<string, any> = {
    updated_at: new Date().toISOString()
  }
  
  // Base fields
  if (updates.name !== undefined) safeUpdates.name = updates.name
  if (updates.category_id !== undefined) safeUpdates.category_id = updates.category_id
  if (updates.department_id !== undefined) safeUpdates.department_id = updates.department_id
  if (updates.date_purchased !== undefined) safeUpdates.date_purchased = updates.date_purchased
  if (updates.cost !== undefined) safeUpdates.cost = updates.cost
  if (updates.status !== undefined) safeUpdates.status = updates.status
  
  // Optional fields
  if (updates.serial_number !== undefined) safeUpdates.serial_number = updates.serial_number || null
  if (updates.description !== undefined) safeUpdates.description = updates.description || null
  if (updates.location !== undefined) safeUpdates.location = updates.location || null
  
  // Warranty fields
  if (updates.warranty_expiry !== undefined) safeUpdates.warranty_expiry = updates.warranty_expiry || null
  if (updates.warranty_notes !== undefined) safeUpdates.warranty_notes = updates.warranty_notes || null
  
  // Insurance fields
  if (updates.insurance_provider !== undefined) safeUpdates.insurance_provider = updates.insurance_provider || null
  if (updates.insurance_policy_number !== undefined) safeUpdates.insurance_policy_number = updates.insurance_policy_number || null
  if (updates.insurance_expiry !== undefined) safeUpdates.insurance_expiry = updates.insurance_expiry || null
  if (updates.insurance_coverage !== undefined) safeUpdates.insurance_coverage = updates.insurance_coverage ? parseFloat(updates.insurance_coverage) : null
  
  const { data, error } = await supabase
    .from('assets')
    .update(safeUpdates)
    .eq('id', id)
    .select(`
      *,
      category:categories(*),
      department:departments(*),
      user:users!assets_user_id_fkey(*)
    `)
    .single()
  
  if (error) throw error
  return data as AssetWithDetails
}

// =====================
// ASSET ASSIGNMENT FUNCTIONS
// =====================

// Assign an asset to a user
export async function assignAsset(assetId: string, userId: string, assignedBy: string, notes?: string) {
  try {
    // Try to update with new columns - will fail if migration not run
    const { data: asset, error: updateError } = await supabase
      .from('assets')
      .update({
        assigned_to: userId,
        assigned_date: new Date().toISOString(),
        status: 'assigned',
        updated_at: new Date().toISOString()
      })
      .eq('id', assetId)
      .select()
      .single()
    
    if (updateError) {
      console.warn('Assignment failed - migration may not be applied:', updateError.message)
      throw new Error('Asset assignment requires database migration. Please run the 005_enhanced_assets.sql migration.')
    }
    
    // Create assignment history record (optional - table may not exist)
    try {
      await supabase
        .from('asset_assignments')
        .insert({
          asset_id: assetId,
          user_id: userId,
          action: 'assigned',
          notes,
          assigned_by: assignedBy
        })
    } catch (historyError) {
      console.warn('Assignment history not saved - table may not exist')
    }
    
    return asset
  } catch (error) {
    throw error
  }
}

// Return an asset (unassign)
export async function returnAsset(assetId: string, returnedBy: string, notes?: string) {
  // Get current assignment
  const { data: currentAsset } = await supabase
    .from('assets')
    .select('assigned_to')
    .eq('id', assetId)
    .single()
  
  // Update asset
  const { data: asset, error: updateError } = await supabase
    .from('assets')
    .update({
      assigned_to: null,
      assigned_date: null,
      status: 'available',
      updated_at: new Date().toISOString()
    })
    .eq('id', assetId)
    .select()
    .single()
  
  if (updateError) throw updateError
  
  // Create return history record
  const { error: historyError } = await supabase
    .from('asset_assignments')
    .insert({
      asset_id: assetId,
      user_id: currentAsset?.assigned_to,
      action: 'returned',
      notes,
      assigned_by: returnedBy
    })
  
  if (historyError) {
    console.error('Error creating return history:', historyError)
  }
  
  return asset
}

// Get asset assignment history
export async function getAssetAssignmentHistory(assetId: string) {
  try {
    const { data, error } = await supabase
      .from('asset_assignments')
      .select(`
        *,
        user:users!asset_assignments_user_id_fkey(*),
        assigned_by_user:users!asset_assignments_assigned_by_fkey(*)
      `)
      .eq('asset_id', assetId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching assignment history:', error)
      return []
    }
    
    return data as AssetAssignment[]
  } catch (error) {
    console.error('Error in getAssetAssignmentHistory:', error)
    return []
  }
}

// =====================
// ASSET DOCUMENT FUNCTIONS
// =====================

// Get documents for an asset
export async function getAssetDocuments(assetId: string) {
  try {
    const { data, error } = await supabase
      .from('asset_documents')
      .select(`
        *,
        uploaded_by_user:users(*)
      `)
      .eq('asset_id', assetId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching asset documents:', error)
      return []
    }
    
    return data as AssetDocument[]
  } catch (error) {
    console.error('Error in getAssetDocuments:', error)
    return []
  }
}

// Create document record (after file upload)
export async function createAssetDocument(document: {
  asset_id: string
  name: string
  file_url: string
  file_type: DocumentType
  file_size?: number
  mime_type?: string
  uploaded_by: string
}) {
  const { data, error } = await supabase
    .from('asset_documents')
    .insert(document)
    .select()
    .single()
  
  if (error) throw error
  return data as AssetDocument
}

// Delete a document
export async function deleteAssetDocument(id: string) {
  // First get the document to get file URL for storage deletion
  const { data: doc } = await supabase
    .from('asset_documents')
    .select('file_url')
    .eq('id', id)
    .single()
  
  // Delete from database
  const { error } = await supabase
    .from('asset_documents')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  
  // TODO: Delete from storage bucket if needed
  return doc
}

// =====================
// WARRANTY & INSURANCE FUNCTIONS
// =====================

// Get assets with warranty expiring soon
export async function getWarrantyExpiringAssets(daysAhead: number = 30) {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysAhead)
  
  try {
    const { data, error } = await supabase
      .from('assets')
      .select(`
        *,
        category:categories(*),
        department:departments(*),
        assigned_user:users!assets_assigned_to_fkey(*)
      `)
      .lte('warranty_expiry', futureDate.toISOString().split('T')[0])
      .not('warranty_expiry', 'is', null)
      .neq('status', 'retired')
      .order('warranty_expiry', { ascending: true })
    
    if (error) {
      console.error('Error fetching warranty expiring assets:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error in getWarrantyExpiringAssets:', error)
    return []
  }
}

// Get assets with insurance expiring soon
export async function getInsuranceExpiringAssets(daysAhead: number = 30) {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysAhead)
  
  try {
    const { data, error } = await supabase
      .from('assets')
      .select(`
        *,
        category:categories(*),
        department:departments(*),
        assigned_user:users!assets_assigned_to_fkey(*)
      `)
      .lte('insurance_expiry', futureDate.toISOString().split('T')[0])
      .not('insurance_expiry', 'is', null)
      .neq('status', 'retired')
      .order('insurance_expiry', { ascending: true })
    
    if (error) {
      console.error('Error fetching insurance expiring assets:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error in getInsuranceExpiringAssets:', error)
    return []
  }
}

// =====================
// EXPORT FUNCTIONS
// =====================

// Generate CSV data for assets export
export async function exportAssetsToCSV(filters?: AssetFilters) {
  try {
    const assets = filters 
      ? await getAssetsWithFilters(filters, undefined, true)
      : await getAssets(undefined, true)
    
    // Define CSV headers
    const headers = [
      'Name',
      'Serial Number',
      'Category',
      'Department',
      'Status',
      'Cost',
      'Date Purchased',
      'Assigned To',
      'Location',
      'Warranty Expiry',
      'Insurance Provider',
      'Insurance Expiry',
      'Description'
    ]
    
    // Convert assets to CSV rows
    const rows = assets.map(asset => [
      asset.name || '',
      asset.serial_number || '',
      asset.category?.name || '',
      asset.department?.name || '',
      asset.status || 'available',
      asset.cost?.toString() || '0',
      asset.date_purchased || '',
      asset.assigned_user?.email || '',
      asset.location || '',
      asset.warranty_expiry || '',
      asset.insurance_provider || '',
      asset.insurance_expiry || '',
      asset.description?.replace(/,/g, ';') || ''
    ])
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    return csvContent
  } catch (error) {
    console.error('Error exporting assets:', error)
    throw error
  }
}

// Get a single asset with all details
export async function getAssetById(id: string) {
  try {
    const { data, error } = await supabase
      .from('assets')
      .select(`
        *,
        category:categories(*),
        department:departments(*),
        user:users!assets_user_id_fkey(*),
        assigned_user:users!assets_assigned_to_fkey(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching asset:', error)
      return null
    }
    
    return data as AssetWithDetails
  } catch (error) {
    console.error('Error in getAssetById:', error)
    return null
  }
}

// ================================================
// Asset Requests (User Feature)
// ================================================

export type RequestType = 'new' | 'replacement' | 'upgrade' | 'transfer'
export type RequestStatus = 'pending' | 'approved' | 'denied' | 'fulfilled' | 'cancelled'
export type RequestPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface AssetRequest {
  id: string
  user_id: string
  request_type: RequestType
  category_id?: string
  title: string
  description?: string
  justification?: string
  priority: RequestPriority
  status: RequestStatus
  admin_notes?: string
  reviewed_by?: string
  reviewed_at?: string
  fulfilled_asset_id?: string
  created_at: string
  updated_at: string
  user?: User
  category?: Category
  reviewed_by_user?: User
  fulfilled_asset?: Asset
}

// Get user's asset requests
export async function getUserAssetRequests(userId: string) {
  try {
    const { data, error } = await supabase
      .from('asset_requests')
      .select(`
        *,
        user:users!asset_requests_user_id_fkey(*),
        category:categories(*),
        reviewed_by_user:users!asset_requests_reviewed_by_fkey(*),
        fulfilled_asset:assets(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as AssetRequest[]
  } catch (error) {
    console.error('Error fetching user requests:', error)
    return []
  }
}

// Get all asset requests (admin)
export async function getAllAssetRequests(status?: RequestStatus) {
  try {
    let query = supabase
      .from('asset_requests')
      .select(`
        *,
        user:users!asset_requests_user_id_fkey(*),
        category:categories(*),
        reviewed_by_user:users!asset_requests_reviewed_by_fkey(*),
        fulfilled_asset:assets(*)
      `)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw error
    return data as AssetRequest[]
  } catch (error) {
    console.error('Error fetching all requests:', error)
    return []
  }
}

// Create new asset request
export async function createAssetRequest(request: {
  user_id: string
  request_type: RequestType
  category_id?: string
  title: string
  description?: string
  justification?: string
  priority?: RequestPriority
}) {
  try {
    const { data, error } = await supabase
      .from('asset_requests')
      .insert({
        ...request,
        status: 'pending',
        priority: request.priority || 'medium'
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating request:', error)
    throw error
  }
}

// Update asset request (admin)
export async function updateAssetRequest(
  requestId: string, 
  updates: {
    status?: RequestStatus
    admin_notes?: string
    reviewed_by?: string
    fulfilled_asset_id?: string
  }
) {
  try {
    const updateData: any = { ...updates }
    if (updates.status && updates.status !== 'pending') {
      updateData.reviewed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('asset_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating request:', error)
    throw error
  }
}

// Cancel request (user)
export async function cancelAssetRequest(requestId: string) {
  try {
    const { data, error } = await supabase
      .from('asset_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error cancelling request:', error)
    throw error
  }
}

// ================================================
// Issue Reports (User Feature)
// ================================================

export type IssueType = 'damage' | 'malfunction' | 'loss' | 'theft' | 'maintenance' | 'other'
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical'
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'cancelled'

export interface IssueReport {
  id: string
  user_id: string
  asset_id: string
  issue_type: IssueType
  title: string
  description: string
  severity: IssueSeverity
  status: IssueStatus
  resolution_notes?: string
  resolved_by?: string
  resolved_at?: string
  created_at: string
  updated_at: string
  user?: User
  asset?: AssetWithDetails
  resolved_by_user?: User
}

// Get user's issue reports
export async function getUserIssueReports(userId: string) {
  try {
    const { data, error } = await supabase
      .from('issue_reports')
      .select(`
        *,
        user:users!issue_reports_user_id_fkey(*),
        asset:assets(*,
          category:categories(*),
          department:departments(*)
        ),
        resolved_by_user:users!issue_reports_resolved_by_fkey(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as IssueReport[]
  } catch (error) {
    console.error('Error fetching user issues:', error)
    return []
  }
}

// Get all issue reports (admin)
export async function getAllIssueReports(status?: IssueStatus) {
  try {
    let query = supabase
      .from('issue_reports')
      .select(`
        *,
        user:users!issue_reports_user_id_fkey(*),
        asset:assets(*,
          category:categories(*),
          department:departments(*)
        ),
        resolved_by_user:users!issue_reports_resolved_by_fkey(*)
      `)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw error
    return data as IssueReport[]
  } catch (error) {
    console.error('Error fetching all issues:', error)
    return []
  }
}

// Create issue report
export async function createIssueReport(report: {
  user_id: string
  asset_id: string
  issue_type: IssueType
  title: string
  description: string
  severity?: IssueSeverity
}) {
  try {
    const { data, error } = await supabase
      .from('issue_reports')
      .insert({
        ...report,
        status: 'open',
        severity: report.severity || 'medium'
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating issue report:', error)
    throw error
  }
}

// Update issue report (admin)
export async function updateIssueReport(
  reportId: string,
  updates: {
    status?: IssueStatus
    resolution_notes?: string
    resolved_by?: string
  }
) {
  try {
    const updateData: any = { ...updates }
    if (updates.status === 'resolved' || updates.status === 'closed') {
      updateData.resolved_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('issue_reports')
      .update(updateData)
      .eq('id', reportId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating issue report:', error)
    throw error
  }
}

// Get assets assigned to a user
export async function getUserAssignedAssets(userId: string) {
  try {
    const { data, error } = await supabase
      .from('assets')
      .select(`
        *,
        category:categories(*),
        department:departments(*)
      `)
      .eq('assigned_to', userId)
      .order('assigned_date', { ascending: false })

    if (error) throw error
    return data as AssetWithDetails[]
  } catch (error) {
    console.error('Error fetching assigned assets:', error)
    return []
  }
}

// Get user dashboard stats
export async function getUserDashboardStats(userId: string) {
  try {
    const [assets, requests, issues] = await Promise.all([
      getUserAssignedAssets(userId),
      getUserAssetRequests(userId),
      getUserIssueReports(userId)
    ])

    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    return {
      totalAssets: assets.length,
      totalValue: assets.reduce((sum, a) => sum + (a.cost || 0), 0),
      pendingRequests: requests.filter(r => r.status === 'pending').length,
      openIssues: issues.filter(i => i.status === 'open' || i.status === 'in_progress').length,
      warrantyExpiring: assets.filter(a => 
        a.warranty_expiry && new Date(a.warranty_expiry) <= thirtyDaysFromNow
      ).length,
      insuranceExpiring: assets.filter(a => 
        a.insurance_expiry && new Date(a.insurance_expiry) <= thirtyDaysFromNow
      ).length
    }
  } catch (error) {
    console.error('Error fetching user dashboard stats:', error)
    return {
      totalAssets: 0,
      totalValue: 0,
      pendingRequests: 0,
      openIssues: 0,
      warrantyExpiring: 0,
      insuranceExpiring: 0
    }
  }
}
