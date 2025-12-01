import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Helper to verify the requesting user is an admin
async function verifyAdmin(request: NextRequest) {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Check if user is admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') return null

  return user
}

// POST - Create a new department
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('departments')
      .insert({ name })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ department: data })
  } catch (error: any) {
    console.error('Error creating department:', error)
    return NextResponse.json({ error: error.message || 'Failed to create department' }, { status: 500 })
  }
}

// PUT - Update a department
export async function PUT(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name } = body

    if (!id || !name) {
      return NextResponse.json({ error: 'Department ID and name are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('departments')
      .update({ name })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ department: data })
  } catch (error: any) {
    console.error('Error updating department:', error)
    return NextResponse.json({ error: error.message || 'Failed to update department' }, { status: 500 })
  }
}

// DELETE - Delete a department
export async function DELETE(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get('id')

    if (!departmentId) {
      return NextResponse.json({ error: 'Department ID is required' }, { status: 400 })
    }

    // Check if department has assets
    const { count: assetCount } = await supabaseAdmin
      .from('assets')
      .select('*', { count: 'exact', head: true })
      .eq('department_id', departmentId)

    if (assetCount && assetCount > 0) {
      return NextResponse.json({ 
        error: `Cannot delete department. It has ${assetCount} asset(s) assigned to it.` 
      }, { status: 400 })
    }

    // Check if department has users
    const { count: userCount } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('department_id', departmentId)

    if (userCount && userCount > 0) {
      return NextResponse.json({ 
        error: `Cannot delete department. It has ${userCount} user(s) assigned to it.` 
      }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('departments')
      .delete()
      .eq('id', departmentId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting department:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete department' }, { status: 500 })
  }
}
