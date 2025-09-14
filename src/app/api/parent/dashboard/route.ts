import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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
            student: {
              include: {
                tests: {
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
                  },
                  orderBy: {
                    createdAt: 'desc'
                  },
                  take: 5
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
        }
      }
    })

    if (!parent) {
      return NextResponse.json({ error: 'Parent record not found' }, { status: 404 })
    }

    // Get upcoming tests for all children
    const studentIds = parent.students.map((studentParent: any) => studentParent.student.id)
    const upcomingTests = await prisma.test.findMany({
      where: {
        scheduledDate: {
          gte: new Date()
        },
        isActive: true
      },
      include: {
        subject: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        scheduledDate: 'asc'
      }
    })

    // Transform children data for frontend
    const transformedChildren = parent.students.map((studentParent: any) => {
      const student = studentParent.student
      const pendingPayments = student.payments.filter((payment: any) => payment.status === 'PENDING').length
      const overduePayments = student.payments.filter((payment: any) => payment.status === 'OVERDUE').length

      // Get upcoming tests for this student's subjects
      const studentSubjects = student.teachingPlan?.subjects?.map((tps: any) => tps.subject.name) || []
      const studentUpcomingTests = upcomingTests.filter((test: any) =>
        studentSubjects.includes(test.subject.name)
      )

      return {
        id: student.id,
        studentCode: student.studentCode,
        firstName: student.firstName,
        lastName: student.lastName,
        grade: student.grade,
        recentGrades: student.tests.map((result: any) => ({
          test: {
            title: result.test.title,
            subject: result.test.subject.name,
            maxScore: result.test.maxScore
          },
          score: result.score,
          notes: result.notes
        })),
        upcomingTests: studentUpcomingTests.map((test: any) => ({
          title: test.title,
          subject: test.subject.name,
          scheduledDate: test.scheduledDate.toISOString()
        })),
        paymentStatus: {
          pending: pendingPayments,
          overdue: overduePayments
        },
        teachingPlan: student.teachingPlan ? {
          subjects: student.teachingPlan.subjects.map((tps: any) => tps.subject.name),
          goals: student.teachingPlan.goals
        } : null
      }
    })

    return NextResponse.json({
      children: transformedChildren
    })

  } catch (error) {
    console.error('Parent dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
