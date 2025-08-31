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

    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch all students with related data using raw SQL for now (until migration is applied)
    const studentsRaw = await prisma.$queryRaw`
      SELECT 
        s.id,
        s."studentCode",
        s."firstName", 
        s."lastName",
        s.grade,
        s."isActive",
        s."enrollmentDate",
        s."monthlyDueAmount",
        s."discountRate",
        u.email,
        mp.id as "membershipPlanId",
        mp.name as "membershipPlanName",
        mp."daysPerWeek" as "membershipPlanDaysPerWeek",
        mp."monthlyPrice" as "membershipPlanMonthlyPrice"
      FROM students s
      JOIN users u ON s."userId" = u.id
      LEFT JOIN membership_plans mp ON s."membershipPlanId" = mp.id
      ORDER BY s."createdAt" DESC
    ` as any[]

    // Get parent information and other data
    const students = await Promise.all(studentsRaw.map(async (student) => {
      // Get parent info
      const parentRelations = await prisma.studentParent.findMany({
        where: { studentId: student.id },
        include: {
          parent: {
            include: {
              user: true
            }
          }
        }
      })

      // Get recent payment
      const recentPayment = await prisma.payment.findFirst({
        where: { studentId: student.id },
        orderBy: { createdAt: 'desc' }
      })

      // Get test results for average
      const testResults = await prisma.testResult.findMany({
        where: { studentId: student.id },
        include: { test: true }
      })

      return {
        ...student,
        parents: parentRelations,
        payments: recentPayment ? [recentPayment] : [],
        tests: testResults
      }
    }))

    // Transform data for frontend
    const transformedStudents = students.map((student: any) => {
      // Calculate academic average
      const testScores = student.tests.map((result: any) => 
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
      const parentRelation = student.parents[0]
      const parent = parentRelation?.parent

      // Build membership plan object if exists
      const membershipPlan = student.membershipPlanId ? {
        id: student.membershipPlanId,
        name: student.membershipPlanName,
        daysPerWeek: student.membershipPlanDaysPerWeek,
        monthlyPrice: parseFloat(student.membershipPlanMonthlyPrice) || 0
      } : null

      return {
        id: student.id,
        studentCode: student.studentCode,
        firstName: student.firstName,
        lastName: student.lastName,
        name: `${student.firstName} ${student.lastName}`, // Add combined name field
        email: student.email,
        grade: student.grade,
        status: student.isActive ? 'ACTIVE' : 'INACTIVE', // Convert boolean to status string
        enrollmentDate: student.enrollmentDate.toISOString(),
        monthlyDueAmount: student.monthlyDueAmount ? parseFloat(student.monthlyDueAmount) : null,
        discountRate: student.discountRate ? parseFloat(student.discountRate) : 0,
        membershipPlan: membershipPlan,
        parentName: parent ? parent.user.name : null,
        parentEmail: parent ? parent.user.email : null,
        paymentStatus: {
          current: paymentCurrent,
          lastPayment: lastPayment ? lastPayment.createdAt.toISOString() : null,
          nextDue: lastPayment ? lastPayment.dueDate.toISOString() : null
        },
        academicStatus: {
          currentGrade: student.grade,
          averageScore: averageScore,
          testsCompleted: student.tests.length
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
    const { firstName, lastName, email, grade, parentEmail, dateOfBirth, schoolYearId } = body

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
        role: 'STUDENT',
        password: '$2a$10$defaultPasswordHash' // Should be properly hashed
      }
    })

    const newStudent = await prisma.student.create({
      data: {
        userId: newUser.id,
        studentCode,
        firstName,
        lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date('2010-01-01'),
        grade,
        schoolYearId: schoolYearId || 'schoolyear1' // Default school year
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
