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

    // Categorize student tests
    const now = new Date()
    const closedTests: any[] = [] // Tests done and scored
    const doneTests: any[] = [] // Tests done (may or may not be scored)
    const upcomingStudentTests: any[] = [] // Tests scheduled for future

    // Process completed tests (those with results)
    student.tests.forEach((testResult: any) => {
      const testDate = new Date(testResult.test.scheduledDate)
      const isScored = testResult.score !== null && testResult.score !== undefined

      if (isScored) {
        // Closed: scored tests
        closedTests.push({
          id: testResult.test.id,
          title: testResult.test.title,
          subject: testResult.test.subject.name,
          scheduledDate: testResult.test.scheduledDate.toISOString(),
          maxScore: testResult.test.maxScore,
          score: testResult.score,
          notes: testResult.notes,
          submittedAt: testResult.createdAt.toISOString()
        })
      } else {
        // Done but not scored
        doneTests.push({
          id: testResult.test.id,
          title: testResult.test.title,
          subject: testResult.test.subject.name,
          scheduledDate: testResult.test.scheduledDate.toISOString(),
          maxScore: testResult.test.maxScore,
          submittedAt: testResult.createdAt.toISOString()
        })
      }
    })

    // Get all tests for this school year to find upcoming ones the student hasn't done
    const allTests = await prisma.test.findMany({
      where: {
        schoolYearId: student.schoolYearId,
        scheduledDate: {
          gte: now
        }
      },
      include: {
        subject: {
          select: {
            name: true
          }
        }
      },
      orderBy: { scheduledDate: 'asc' }
    })

    // Filter out tests the student has already done
    const completedTestIds = new Set(student.tests.map((tr: any) => tr.testId))
    allTests.forEach((test: any) => {
      if (!completedTestIds.has(test.id)) {
        upcomingStudentTests.push({
          id: test.id,
          title: test.title,
          subject: test.subject.name,
          scheduledDate: test.scheduledDate.toISOString(),
          maxScore: test.maxScore
        })
      }
    })

    // Sort tests by date
    closedTests.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    doneTests.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    upcomingStudentTests.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())

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
      recentGrades: student.tests.map((testResult: any) => ({
        test: {
          title: testResult.test.title,
          subject: testResult.test.subject.name,
          maxScore: testResult.test.maxScore,
          scheduledDate: testResult.test.scheduledDate.toISOString()
        },
        score: testResult.score,
        notes: testResult.notes,
        submittedAt: testResult.createdAt.toISOString()
      })),
      upcomingTests: upcomingTests.map((test: any) => ({
        title: test.title,
        subject: test.subject.name,
        scheduledDate: test.scheduledDate.toISOString()
      })),
      testCategories: {
        closed: closedTests,
        done: doneTests,
        upcoming: upcomingStudentTests
      },
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
