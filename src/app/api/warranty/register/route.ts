import { NextRequest, NextResponse } from 'next/server'

const WARRANTY_API_URL = process.env.WARRANTY_API_URL || 'https://server11.eport.ws'
const WARRANTY_API_KEY = process.env.WARRANTY_API_KEY || 'warranty-api-key-2025-eport-secure'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    
    let warranty_duration_months = body.warranty_duration_months
    if (!warranty_duration_months && body.warranty_start && body.warranty_expiry) {
      const start = new Date(body.warranty_start)
      const expiry = new Date(body.warranty_expiry)
      warranty_duration_months = Math.round((expiry.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))
    } else if (!warranty_duration_months && body.date_purchased && body.warranty_expiry) {
      const start = new Date(body.date_purchased)
      const expiry = new Date(body.warranty_expiry)
      warranty_duration_months = Math.round((expiry.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))
    }
    
    
    const warrantyData = {
      asset_id: body.asset_id,
      asset_name: body.asset_name,
      serial_number: body.serial_number || null,
      category: body.category || null,
      department: body.department || null,
      location: body.location || null,
      date_purchased: body.date_purchased || null,
      cost: body.cost || null,
      warranty_provider: body.warranty_provider || null,
      warranty_type: body.warranty_type || 'manufacturer',
      warranty_start: body.warranty_start || body.date_purchased || null,
      warranty_expiry: body.warranty_expiry || null,
      warranty_duration_months: warranty_duration_months || null,
      warranty_terms: body.warranty_terms || null,
      warranty_contact: body.warranty_contact || null,
      warranty_claim_url: body.warranty_claim_url || null,
      warranty_notes: body.warranty_notes || null,
      registered_by_email: body.registered_by_email
    }
    
    // Call the Warranty Register API
    const response = await fetch(`${WARRANTY_API_URL}/api/warranty/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': WARRANTY_API_KEY,
      },
      body: JSON.stringify(warrantyData),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.detail || 'Failed to register warranty' },
        { status: response.status }
      )
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Warranty registration error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to connect to warranty service' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const assetId = searchParams.get('assetId')
    
    if (!assetId) {
      return NextResponse.json(
        { success: false, message: 'Asset ID required' },
        { status: 400 }
      )
    }
    
    // Check warranty status
    const response = await fetch(`${WARRANTY_API_URL}/api/warranty/check/${assetId}`, {
      headers: {
        'X-API-Key': WARRANTY_API_KEY,
      },
    })
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Warranty check error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to check warranty status' },
      { status: 500 }
    )
  }
}
