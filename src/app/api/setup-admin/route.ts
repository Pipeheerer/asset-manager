import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Admin functionality not available - missing service role key' },
        { status: 500 }
      )
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    
    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) throw authError

    const user = users.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user role to admin
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ role: 'admin' })
      .eq('id', user.id)

    if (updateError) throw updateError

    return NextResponse.json({
      message: 'User role updated to admin successfully',
      userId: user.id,
      email: user.email
    })

  } catch (error: any) {
    console.error('Setup admin error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to setup admin' },
      { status: 500 }
    )
  }
}
