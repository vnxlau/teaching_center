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

    // Get all active students
    const allStudents = await prisma.student.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            email: true
          }
        }
      },
      orderBy: {
        firstName: 'asc'
      }
    })

    // Get students already assigned to this test
    const existingResults = await prisma.testResult.findMany({
      where: { testId },
      select: { studentId: true }
    })

    const assignedStudentIds = new Set(existingResults.map(result => result.studentId))

    // Separate students into assigned and available
    const assignedStudents = allStudents.filter(student => assignedStudentIds.has(student.id))
    const availableStudents = allStudents.filter(student => !assignedStudentIds.has(student.id))

    return NextResponse.json({
      assignedStudents,
      availableStudents
    })
  } catch (error) {
    console.error('Error fetching students for test:', error)
    return NextResponse.json(
      { error: 'Failed to fetch students' },
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
    const { testId, studentIds } = body

    if (!testId || !studentIds || !Array.isArray(studentIds)) {
      return NextResponse.json(
        { error: 'Test ID and student IDs array are required' },
        { status: 400 }
      )
    }

    // Create test results for selected students (without scores initially)
    const testResults = await Promise.all(
      studentIds.map(studentId =>
        prisma.testResult.create({
          data: {
            testId,
            studentId,
            score: 0, // Default score, can be updated later
            notes: ''
          },
          include: {
            student: {
              include: {
                user: true
              }
            }
          }
        })
      )
    )

    return NextResponse.json(testResults, { status: 201 })
  } catch (error) {
    console.error('Error adding students to test:', error)
    return NextResponse.json(
      { error: 'Failed to add students to test' },
      { status: 500 }
    )
  }
}