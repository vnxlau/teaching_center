import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSystemSettings, updateSystemSettings, toSnakeCase, toCamelCase, clearSettingsCache } from '@/lib/systemSettings'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get settings from our utility function
    const settings = await getSystemSettings()
    
    // Convert to camelCase for frontend
    const camelCaseSettings: any = {}
    Object.entries(settings).forEach(([key, value]) => {
      camelCaseSettings[toCamelCase(key)] = value
    })

    return NextResponse.json(camelCaseSettings)
  } catch (error) {
    console.error('Error fetching system settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    // Convert camelCase keys to snake_case for database storage
    const snakeCaseData: Record<string, string> = {}
    Object.entries(data).forEach(([key, value]) => {
      snakeCaseData[toSnakeCase(key)] = String(value)
    })

    // Update settings in database
    await updateSystemSettings(snakeCaseData)
    
    // Clear cache to ensure fresh data
    clearSettingsCache()

    console.log('System settings updated successfully:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating system settings:', error)
    return NextResponse.json(
      { error: 'Failed to update system settings' },
      { status: 500 }
    )
  }
}
