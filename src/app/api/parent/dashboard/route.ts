import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Find the parent record and their children
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: {
        students: {
          include: {
            testResults: {
              include: {
                test: true
              },
              orderBy: {
                createdAt: 'desc'
              },
              take: 5
            },
            teachingPlan: {
              include: {
                subjects: true
              }
            },
            payments: {
              where: {
                status: {
                  in: ['PENDING', 'OVERDUE']
                }
              }
            },
            user: true
          }
        }
      }
    })

    if (!parent) {
      return NextResponse.json({ error: 'Parent record not found' }, { status: 404 })
    }

    // Get upcoming tests for all children
    const upcomingTests = await prisma.test.findMany({
      where: {
        scheduledDate: {
          gte: new Date()
        },
        subjects: {
          some: {
            teachingPlans: {
              some: {
                studentId: {
                  in: parent.students.map((student: any) => student.id)
                }
              }
            }
          }
        }
      },
      include: {
        subjects: true
      },
      orderBy: {
        scheduledDate: 'asc'
      }
    })

    // Transform data for each child
    const childrenData = parent.students.map((student: any) => {
      // Calculate payment status
      const pendingPayments = student.payments.filter((payment: any) => payment.status === 'PENDING').length
      const overduePayments = student.payments.filter((payment: any) => payment.status === 'OVERDUE').length

      // Get upcoming tests for this student's subjects
      const studentSubjects = student.teachingPlan?.subjects.map((subject: any) => subject.name) || []
      const studentUpcomingTests = upcomingTests.filter((test: any) =>
        test.subjects.some((subject: any) => studentSubjects.includes(subject.name))
      )

      return {
        id: student.id,
        studentCode: student.studentCode,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        grade: student.grade,
        recentGrades: student.testResults.map((result: any) => ({
          test: {
            title: result.test.title,
            subject: result.test.subjects?.[0]?.name || 'General',
            maxScore: result.test.maxScore
          },
          score: result.score,
          notes: result.notes
        })),
        upcomingTests: studentUpcomingTests.map((test: any) => ({
          title: test.title,
          subject: test.subjects?.[0]?.name || 'General',
          scheduledDate: test.scheduledDate.toISOString()
        })),
        paymentStatus: {
          pending: pendingPayments,
          overdue: overduePayments
        },
        teachingPlan: student.teachingPlan ? {
          subjects: student.teachingPlan.subjects.map((subject: any) => subject.name),
          goals: student.teachingPlan.goals
        } : null
      }
    })

    return NextResponse.json({
      children: childrenData
    })

  } catch (error) {
    console.error('Parent dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
