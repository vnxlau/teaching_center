import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the student record
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        tests: {
          include: {
            test: {
              include: {
                subject: true,
                staff: {
                  include: {
                    user: true
                  }
                }
              }
            }
          },
          orderBy: {
            test: {
              scheduledDate: 'desc'
            }
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Transform the data
    const tests = student.tests.map(testResult => {
      const test = testResult.test
      return {
        id: test.id,
        title: test.title,
        subject: test.subject.name,
        scheduledDate: test.scheduledDate.toISOString(),
        maxScore: test.maxScore,
        description: test.description,
        isCompleted: testResult.score !== null,
        result: testResult.score !== null ? {
          score: Number(testResult.score),
          notes: testResult.notes,
          submittedAt: testResult.createdAt.toISOString()
        } : undefined
      }
    })

    // Also get upcoming tests that the student hasn't taken yet
    const upcomingTests = await prisma.test.findMany({
      where: {
        schoolYearId: student.schoolYearId,
        scheduledDate: {
          gte: new Date()
        },
        NOT: {
          results: {
            some: {
              studentId: student.id
            }
          }
        }
      },
      include: {
        subject: true,
        staff: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        scheduledDate: 'asc'
      }
    })

    // Add upcoming tests to the list
    const upcomingTestsFormatted = upcomingTests.map(test => ({
      id: test.id,
      title: test.title,
      subject: test.subject.name,
      scheduledDate: test.scheduledDate.toISOString(),
      maxScore: test.maxScore,
      description: test.description,
      isCompleted: false,
      result: undefined
    }))

    const allTests = [...tests, ...upcomingTestsFormatted]
    
    // Sort by scheduled date
    allTests.sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())

    return NextResponse.json({ tests: allTests })
  } catch (error) {
    console.error('Error fetching student tests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tests' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, subjectId, scheduledDate, maxScore, description } = body

    if (!title || !subjectId || !scheduledDate || !maxScore) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get the student record
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          include: {
            staff: true
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Create a staff record if student doesn't have one (for test creation)
    let staffId = student.user.staff?.id
    if (!staffId) {
      const staff = await prisma.staff.create({
        data: {
          userId: session.user.id,
          firstName: student.firstName,
          lastName: student.lastName,
          position: 'Student Test Creator',
          isActive: true
        }
      })
      staffId = staff.id
    }

    // Create the test
    const test = await prisma.test.create({
      data: {
        title,
        subjectId,
        scheduledDate: new Date(scheduledDate),
        maxScore: parseInt(maxScore),
        description,
        schoolYearId: student.schoolYearId,
        staffId: staffId
      },
      include: {
        subject: true
      }
    })

    return NextResponse.json({ 
      message: 'Test request created successfully',
      test: {
        id: test.id,
        title: test.title,
        subject: test.subject.name,
        scheduledDate: test.scheduledDate.toISOString(),
        maxScore: test.maxScore,
        description: test.description
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating test:', error)
    return NextResponse.json(
      { error: 'Failed to create test' },
      { status: 500 }
    )
  }
}
