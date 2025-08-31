import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get parent's children through StudentParent relationship
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: {
        students: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                studentCode: true
              }
            }
          }
        }
      }
    })

    if (!parent) {
      return NextResponse.json({ tests: [] })
    }

    const childrenIds = parent.students.map(sp => sp.student.id)

    // Get test results for all children
    const testResults = await prisma.testResult.findMany({
      where: {
        studentId: {
          in: childrenIds
        }
      },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            subject: true,
            scheduledDate: true,
            maxScore: true
          }
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentCode: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform to the expected format
    const tests = testResults.map(result => ({
      id: result.test.id,
      title: result.test.title,
      subject: result.test.subject,
      maxScore: Number(result.test.maxScore),
      scheduledDate: result.test.scheduledDate.toISOString(),
      status: 'COMPLETED' as const,
      student: result.student,
      grade: {
        score: Number(result.score),
        notes: result.notes || '',
        gradedAt: result.createdAt.toISOString()
      }
    }))

    return NextResponse.json({
      tests
    })
  } catch (error) {
    console.error('Parent Tests API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, subjectId, scheduledDate, maxScore, description, studentId } = body

    if (!title || !subjectId || !scheduledDate || !maxScore || !studentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get parent and verify they have access to the student
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: {
        students: {
          where: { studentId },
          include: {
            student: true
          }
        },
        user: {
          include: {
            staff: true
          }
        }
      }
    })

    if (!parent || parent.students.length === 0) {
      return NextResponse.json({ error: 'Student not found or not accessible' }, { status: 404 })
    }

    const student = parent.students[0].student

    // Create a staff record if parent doesn't have one (for test creation)
    let staffId = parent.user.staff?.id
    if (!staffId) {
      const staff = await prisma.staff.create({
        data: {
          userId: session.user.id,
          firstName: parent.firstName,
          lastName: parent.lastName,
          position: 'Parent Test Creator',
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
