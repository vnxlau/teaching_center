import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const testId = searchParams.get('testId')

    if (!testId) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 })
    }

    // Get all test results for a specific test
    const testResults = await prisma.testResult.findMany({
      where: { testId },
      include: {
        student: {
          include: {
            user: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get test details
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        subject: true,
        staff: {
          include: {
            user: true
          }
        }
      }
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    return NextResponse.json({
      test,
      results: testResults
    })
  } catch (error) {
    console.error('Error fetching test results:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test results' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { testId, studentId, score, notes } = body

    if (!testId || !studentId) {
      return NextResponse.json(
        { error: 'Test ID and Student ID are required' },
        { status: 400 }
      )
    }

    // Check if test result already exists
    const existingResult = await prisma.testResult.findUnique({
      where: {
        testId_studentId: {
          testId,
          studentId
        }
      }
    })

    if (existingResult) {
      // Update existing result
      const updatedResult = await prisma.testResult.update({
        where: {
          testId_studentId: {
            testId,
            studentId
          }
        },
        data: {
          score: score !== undefined ? parseFloat(score) : existingResult.score,
          notes: notes !== undefined ? notes : existingResult.notes
        },
        include: {
          student: {
            include: {
              user: true
            }
          }
        }
      })
      return NextResponse.json(updatedResult)
    } else {
      // Create new result
      if (score === undefined || score === null) {
        return NextResponse.json(
          { error: 'Score is required for new test results' },
          { status: 400 }
        )
      }

      const newResult = await prisma.testResult.create({
        data: {
          testId,
          studentId,
          score: parseFloat(score),
          notes: notes || ''
        },
        include: {
          student: {
            include: {
              user: true
            }
          }
        }
      })
      return NextResponse.json(newResult, { status: 201 })
    }
  } catch (error) {
    console.error('Error creating/updating test result:', error)
    return NextResponse.json(
      { error: 'Failed to create/update test result' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { testId, studentId, score, notes } = body

    if (!testId || !studentId) {
      return NextResponse.json(
        { error: 'Test ID and Student ID are required' },
        { status: 400 }
      )
    }

    const updatedResult = await prisma.testResult.update({
      where: {
        testId_studentId: {
          testId,
          studentId
        }
      },
      data: {
        score: score !== undefined ? parseFloat(score) : undefined,
        notes: notes !== undefined ? notes : undefined
      },
      include: {
        student: {
          include: {
            user: true
          }
        }
      }
    })

    return NextResponse.json(updatedResult)
  } catch (error) {
    console.error('Error updating test result:', error)
    return NextResponse.json(
      { error: 'Failed to update test result' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const testId = searchParams.get('testId')
    const studentId = searchParams.get('studentId')

    if (!testId || !studentId) {
      return NextResponse.json(
        { error: 'Test ID and Student ID are required' },
        { status: 400 }
      )
    }

    await prisma.testResult.delete({
      where: {
        testId_studentId: {
          testId,
          studentId
        }
      }
    })

    return NextResponse.json({ message: 'Test result deleted successfully' })
  } catch (error) {
    console.error('Error deleting test result:', error)
    return NextResponse.json(
      { error: 'Failed to delete test result' },
      { status: 500 }
    )
  }
}