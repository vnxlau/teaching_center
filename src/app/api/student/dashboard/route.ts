import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      )
    }

    if (!session.user.studentId) {
      return NextResponse.json(
        { error: 'Student ID not found' },
        { status: 400 }
      )
    }

    // Fetch student data with related information
    const student = await prisma.student.findUnique({
      where: { id: session.user.studentId },
      include: {
        teachingPlan: {
          include: {
            subjects: {
              include: {
                subject: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        tests: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            test: {
              include: {
                subject: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        schoolYear: true
      }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Get upcoming tests
    const upcomingTests = await prisma.test.findMany({
      where: {
        schoolYearId: student.schoolYearId,
        scheduledDate: {
          gte: new Date()
        }
      },
      include: {
        subject: {
          select: {
            name: true
          }
        }
      },
      orderBy: { scheduledDate: 'asc' },
      take: 5
    })

    // Get payment status
    const paymentStatus = await prisma.payment.aggregate({
      where: {
        studentId: student.id,
        status: 'PENDING'
      },
      _count: true
    })

    const overduePayments = await prisma.payment.aggregate({
      where: {
        studentId: student.id,
        status: 'OVERDUE'
      },
      _count: true
    })

    return NextResponse.json({
      id: student.id,
      studentCode: student.studentCode,
      firstName: student.firstName,
      lastName: student.lastName,
      grade: student.grade,
      teachingPlan: student.teachingPlan ? {
        subjects: student.teachingPlan.subjects.map(tps => tps.subject.name),
        goals: student.teachingPlan.goals,
        schedule: student.teachingPlan.schedule
      } : null,
      recentGrades: student.tests.map((testResult: any) => ({
        test: {
          title: testResult.test.title,
          subject: testResult.test.subject.name,
          maxScore: testResult.test.maxScore
        },
        score: testResult.score,
        notes: testResult.notes
      })),
      upcomingTests: upcomingTests.map((test: any) => ({
        title: test.title,
        subject: test.subject.name,
        scheduledDate: test.scheduledDate.toISOString()
      })),
      paymentStatus: {
        pending: paymentStatus._count,
        overdue: overduePayments._count
      }
    })
  } catch (error) {
    console.error('Error fetching student dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch student data' },
      { status: 500 }
    )
  }
}
