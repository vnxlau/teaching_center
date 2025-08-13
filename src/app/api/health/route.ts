import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connection
    const userCount = await prisma.user.count()
    const studentCount = await prisma.student.count()
    const schoolYear = await prisma.schoolYear.findFirst({
      where: { isActive: true }
    })

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: userCount,
        totalStudents: studentCount,
        activeSchoolYear: schoolYear?.name || 'None',
        message: 'Database connection successful!'
      }
    })
  } catch (error) {
    console.error('Database connection error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
