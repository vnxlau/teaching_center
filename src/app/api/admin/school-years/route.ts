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

    // Get all school years
    const schoolYears = await prisma.schoolYear.findMany({
      orderBy: { startDate: 'desc' }
    })

    return NextResponse.json({
      activeSchoolYear: {
        id: activeSchoolYear.id,
        name: activeSchoolYear.name,
        startDate: activeSchoolYear.startDate.toISOString(),
        endDate: activeSchoolYear.endDate.toISOString(),
        isActive: activeSchoolYear.isActive
      },
      schoolYears: schoolYears.map(sy => ({
        id: sy.id,
        name: sy.name,
        startDate: sy.startDate.toISOString(),
        endDate: sy.endDate.toISOString(),
        isActive: sy.isActive
      }))
    })

  } catch (error) {
    console.error('School years API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
