import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/admin/payments - Get all payments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payments = await prisma.payment.findMany({
      include: {
        student: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        dueDate: 'desc'
      }
    })

    // Transform payments to match expected format
    const transformedPayments = payments.map(payment => ({
      id: payment.id,
      studentId: payment.studentId,
      studentName: `${payment.student.firstName} ${payment.student.lastName}`,
      studentCode: payment.student.studentCode,
      amount: payment.amount,
      dueDate: payment.dueDate.toISOString(),
      paidDate: payment.paidDate?.toISOString(),
      status: payment.status,
      paymentType: payment.paymentType,
      method: payment.method,
      description: payment.notes,
      schoolYearId: payment.schoolYearId
    }))

    return NextResponse.json(transformedPayments)
  } catch (error) {
    console.error('Failed to fetch payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
    const { studentId, month, description } = body

    // Validate required parameters
    if (!studentId || !month) {
      return NextResponse.json({
        error: 'Missing required parameters: studentId and month'
      }, { status: 400 })
    }

    // Get student details including membership plan
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        membershipPlan: true,
        user: true
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (!student.membershipPlan) {
      return NextResponse.json({
        error: 'Student does not have an active membership plan'
      }, { status: 400 })
    }

    // Calculate payment amount (use student's monthlyDueAmount if set, otherwise membership plan price)
    const amount = student.monthlyDueAmount || student.membershipPlan.monthlyPrice

    // Calculate due date (8th of the selected month)
    const [year, monthNum] = month.split('-').map(Number)
    const dueDate = new Date(year, monthNum - 1, 8)

    // Set payment date to current date
    const paymentDate = new Date()

    // Check if payment already exists for this student and month
    const existingPayment = await prisma.payment.findFirst({
      where: {
        studentId: studentId,
        dueDate: {
          gte: new Date(year, monthNum - 1, 1),
          lt: new Date(year, monthNum, 1)
        }
      }
    })

    if (existingPayment) {
      return NextResponse.json({
        error: 'Payment already exists for this student and month'
      }, { status: 409 })
    }

    // Create the payment
    const payment = await prisma.payment.create({
      data: {
        studentId: studentId,
        amount: amount,
        dueDate: dueDate,
        paidDate: paymentDate,
        status: 'PENDING',
        paymentType: 'MONTHLY_FEE',
        notes: description || `Monthly fee for ${month}`,
        schoolYearId: student.schoolYearId
      }
    })

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        studentCode: student.studentCode,
        studentName: `${student.firstName} ${student.lastName}`,
        amount: payment.amount,
        dueDate: payment.dueDate.toISOString(),
        status: payment.status,
        paymentDate: payment.paidDate?.toISOString(),
        description: payment.notes
      }
    })

  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
