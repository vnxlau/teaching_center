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

    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch all students with related data
    const students = await prisma.student.findMany({
      include: {
        user: true,
        parents: {
          include: {
            user: true
          }
        },
        payments: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        testResults: {
          include: {
            test: true
          }
        },
        teachingPlan: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform data for frontend
    const transformedStudents = students.map((student: any) => {
      // Calculate academic average
      const testScores = student.testResults.map((result: any) => 
        (result.score / result.test.maxScore) * 100
      )
      const averageScore = testScores.length > 0 
        ? testScores.reduce((sum: number, score: number) => sum + score, 0) / testScores.length
        : null

      // Check payment status
      const lastPayment = student.payments[0]
      const now = new Date()
      const paymentCurrent = lastPayment ? 
        (lastPayment.status === 'PAID' && lastPayment.dueDate > now) : false

      // Get parent info
      const parent = student.parents[0]

      return {
        id: student.id,
        studentCode: student.studentCode,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        email: student.user.email,
        grade: student.grade,
        status: student.status,
        enrollmentDate: student.createdAt.toISOString(),
        parentName: parent ? `${parent.user.firstName} ${parent.user.lastName}` : null,
        parentEmail: parent ? parent.user.email : null,
        paymentStatus: {
          current: paymentCurrent,
          lastPayment: lastPayment ? lastPayment.createdAt.toISOString() : null,
          nextDue: lastPayment ? lastPayment.dueDate.toISOString() : null
        },
        academicStatus: {
          currentGrade: student.grade,
          averageScore: averageScore,
          testsCompleted: student.testResults.length
        }
      }
    })

    return NextResponse.json({
      students: transformedStudents
    })

  } catch (error) {
    console.error('Students API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { firstName, lastName, email, grade, parentEmail } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !grade) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      )
    }

    // Generate student code
    const lastStudent = await prisma.student.findFirst({
      orderBy: { studentCode: 'desc' }
    })
    
    const lastCode = lastStudent?.studentCode || 'STU0000'
    const nextNumber = parseInt(lastCode.slice(3)) + 1
    const studentCode = `STU${nextNumber.toString().padStart(4, '0')}`

    // Create user and student
    const newUser = await prisma.user.create({
      data: {
        email,
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        role: 'STUDENT',
        password: '$2a$10$defaultPasswordHash' // Should be properly hashed
      }
    })

    const newStudent = await prisma.student.create({
      data: {
        userId: newUser.id,
        studentCode,
        grade,
        status: 'ACTIVE'
      }
    })

    // Link to parent if provided
    if (parentEmail) {
      const parentUser = await prisma.user.findUnique({
        where: { email: parentEmail },
        include: { parent: true }
      })

      if (parentUser?.parent) {
        await prisma.student.update({
          where: { id: newStudent.id },
          data: {
            parents: {
              connect: { id: parentUser.parent.id }
            }
          }
        })
      }
    }

    return NextResponse.json({
      message: 'Student created successfully',
      student: {
        id: newStudent.id,
        studentCode: newStudent.studentCode,
        firstName,
        lastName,
        email,
        grade,
        status: 'ACTIVE'
      }
    })

  } catch (error) {
    console.error('Create student error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
