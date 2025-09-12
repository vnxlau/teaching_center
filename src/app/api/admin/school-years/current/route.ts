import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get active school year
    const activeSchoolYear = await prisma.schoolYear.findFirst({
      where: { isActive: true }
    })

    if (!activeSchoolYear) {
      return NextResponse.json(
        { error: 'No active school year found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: activeSchoolYear.id,
      name: activeSchoolYear.name,
      startDate: activeSchoolYear.startDate.toISOString(),
      endDate: activeSchoolYear.endDate.toISOString(),
      isActive: activeSchoolYear.isActive
    })

  } catch (error) {
    console.error('Current school year API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
