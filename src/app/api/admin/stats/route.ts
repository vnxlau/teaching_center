import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      )
    }

    // Get current school year
    const currentSchoolYear = await prisma.schoolYear.findFirst({
      where: { isActive: true }
    })

    if (!currentSchoolYear) {
      return NextResponse.json({
        totalStudents: 0,
        activeStudents: 0,
        totalPayments: 0,
        pendingPayments: 0,
        totalTests: 0,
        upcomingTests: 0
      })
    }

    // Fetch statistics
    const [
      totalStudents,
      activeStudents,
      totalPayments,
      pendingPayments,
      totalTests,
      upcomingTests
    ] = await Promise.all([
      // Total students in current school year
      prisma.student.count({
        where: { schoolYearId: currentSchoolYear.id }
      }),
      
      // Active students in current school year
      prisma.student.count({
        where: { 
          schoolYearId: currentSchoolYear.id,
          isActive: true 
        }
      }),
      
      // Total payments in current school year
      prisma.payment.count({
        where: { schoolYearId: currentSchoolYear.id }
      }),
      
      // Pending payments in current school year
      prisma.payment.count({
        where: { 
          schoolYearId: currentSchoolYear.id,
          status: 'PENDING'
        }
      }),
      
      // Total tests in current school year
      prisma.test.count({
        where: { schoolYearId: currentSchoolYear.id }
      }),
      
      // Upcoming tests (future scheduled dates)
      prisma.test.count({
        where: { 
          schoolYearId: currentSchoolYear.id,
          scheduledDate: {
            gte: new Date()
          }
        }
      })
    ])

    return NextResponse.json({
      totalStudents,
      activeStudents,
      totalPayments,
      pendingPayments,
      totalTests,
      upcomingTests
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
