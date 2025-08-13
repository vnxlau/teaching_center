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

    // Fetch all payments with student data
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

    // Calculate financial statistics
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const stats = {
      totalRevenue: payments
        .filter((p: any) => p.status === 'PAID')
        .reduce((sum: number, p: any) => sum + p.amount, 0),
      monthlyRevenue: payments
        .filter((p: any) => p.status === 'PAID' && p.paymentDate && p.paymentDate >= startOfMonth)
        .reduce((sum: number, p: any) => sum + p.amount, 0),
      pendingAmount: payments
        .filter((p: any) => p.status === 'PENDING')
        .reduce((sum: number, p: any) => sum + p.amount, 0),
      overdueAmount: payments
        .filter((p: any) => p.status === 'OVERDUE' || (p.status === 'PENDING' && p.dueDate < now))
        .reduce((sum: number, p: any) => sum + p.amount, 0),
      totalStudents: await prisma.student.count(),
      payingStudents: await prisma.student.count({
        where: {
          payments: {
            some: {
              status: 'PAID'
            }
          }
        }
      })
    }

    // Transform payment data for frontend
    const transformedPayments = payments.map((payment: any) => ({
      id: payment.id,
      studentCode: payment.student.studentCode,
      studentName: `${payment.student.user.firstName} ${payment.student.user.lastName}`,
      amount: payment.amount,
      dueDate: payment.dueDate.toISOString(),
      status: payment.dueDate < now && payment.status === 'PENDING' ? 'OVERDUE' : payment.status,
      paymentDate: payment.paymentDate ? payment.paymentDate.toISOString() : null,
      description: payment.description,
      method: payment.method
    }))

    return NextResponse.json({
      payments: transformedPayments,
      stats
    })

  } catch (error) {
    console.error('Finance API error:', error)
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
    const { studentId, amount, description, dueDate, method, status } = body

    // Validate required fields
    if (!studentId || !amount || !description || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Create new payment
    const newPayment = await prisma.payment.create({
      data: {
        studentId,
        amount: parseFloat(amount),
        description,
        dueDate: new Date(dueDate),
        status: status || 'PENDING',
        method: method || null,
        paymentDate: status === 'PAID' ? new Date() : null
      },
      include: {
        student: {
          include: {
            user: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Payment created successfully',
      payment: {
        id: newPayment.id,
        studentCode: newPayment.student.studentCode,
        studentName: `${newPayment.student.user.firstName} ${newPayment.student.user.lastName}`,
        amount: newPayment.amount,
        description: newPayment.description,
        dueDate: newPayment.dueDate.toISOString(),
        status: newPayment.status
      }
    })

  } catch (error) {
    console.error('Create payment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { paymentId, status, paymentDate, method } = body

    // Validate payment exists
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Update payment
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        method: method || payment.method
      },
      include: {
        student: {
          include: {
            user: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Payment updated successfully',
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status,
        paymentDate: updatedPayment.paymentDate?.toISOString() || null
      }
    })

  } catch (error) {
    console.error('Update payment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
