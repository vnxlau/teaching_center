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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const monthFilter = searchParams.get('month') // Format: YYYY-MM
    const filterType = searchParams.get('filter') // due, paid, overdue

    // Parse month filter
    let startDate: Date | undefined
    let endDate: Date | undefined
    
    if (monthFilter) {
      const [year, month] = monthFilter.split('-').map(Number)
      startDate = new Date(year, month - 1, 1)
      endDate = new Date(year, month, 0, 23, 59, 59) // Last day of month
    }

    // Build where clause
    let whereClause: any = {}
    if (startDate && endDate) {
      whereClause.dueDate = {
        gte: startDate,
        lte: endDate
      }
    }

    // Apply filter type
    if (filterType === 'due') {
      whereClause.status = 'PENDING'
    } else if (filterType === 'paid') {
      whereClause.status = 'PAID'
    } else if (filterType === 'overdue') {
      whereClause.OR = [
        { status: 'OVERDUE' },
        { 
          AND: [
            { status: 'PENDING' },
            { dueDate: { lt: new Date() } }
          ]
        }
      ]
    }

    // Fetch filtered payments with student data
    const payments = await prisma.payment.findMany({
      where: whereClause,
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

    // Calculate financial statistics for the current month or filtered period
    const now = new Date()
    const currentStartOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentEndOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    
    // Use filtered period if provided, otherwise use current month
    const statsStartDate = startDate || currentStartOfMonth
    const statsEndDate = endDate || currentEndOfMonth
    
    // Get all payments for the stats period (not filtered by type)
    const statsPayments = await prisma.payment.findMany({
      where: {
        dueDate: {
          gte: statsStartDate,
          lte: statsEndDate
        }
      },
      include: {
        student: true
      }
    })

    // Get current school year data (September to July)
    const currentSchoolYear = await prisma.schoolYear.findFirst({
      where: { isActive: true }
    })
    
    let schoolYearPayments: any[] = []
    if (currentSchoolYear) {
      schoolYearPayments = await prisma.payment.findMany({
        where: {
          schoolYearId: currentSchoolYear.id
        },
        include: {
          student: true
        }
      })
    }

    // Calculate statistics
    const duePayments = statsPayments.filter((p: any) => p.status === 'PENDING')
    const paidPayments = statsPayments.filter((p: any) => p.status === 'PAID')
    const overduePayments = statsPayments.filter((p: any) => 
      p.status === 'OVERDUE' || (p.status === 'PENDING' && p.dueDate < now)
    )

    // Calculate school year statistics
    const schoolYearDuePayments = schoolYearPayments.filter((p: any) => p.status === 'PENDING')
    const schoolYearPaidPayments = schoolYearPayments.filter((p: any) => p.status === 'PAID')
    const schoolYearOverduePayments = schoolYearPayments.filter((p: any) => 
      p.status === 'OVERDUE' || (p.status === 'PENDING' && p.dueDate < now)
    )

    const stats = {
      totalRevenue: payments
        .filter((p: any) => p.status === 'PAID')
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0),
      monthlyRevenue: paidPayments
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0),
      pendingAmount: duePayments
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0),
      overdueAmount: overduePayments
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0),
      
      // Monthly breakdown statistics
      monthly: {
        totalDue: statsPayments.length,
        totalDueAmount: statsPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0),
        paid: paidPayments.length,
        paidAmount: paidPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0),
        pending: duePayments.length,
        pendingAmount: duePayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0),
        overdue: overduePayments.length,
        overdueAmount: overduePayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0)
      },
      
      // School year breakdown statistics
      schoolYear: {
        name: currentSchoolYear?.name || 'N/A',
        totalDue: schoolYearPayments.length,
        totalDueAmount: schoolYearPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0),
        paid: schoolYearPaidPayments.length,
        paidAmount: schoolYearPaidPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0),
        pending: schoolYearDuePayments.length,
        pendingAmount: schoolYearDuePayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0),
        overdue: schoolYearOverduePayments.length,
        overdueAmount: schoolYearOverduePayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0)
      },
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
      studentName: payment.student.user.name,
      amount: Number(payment.amount),
      dueDate: payment.dueDate.toISOString(),
      status: payment.dueDate < now && payment.status === 'PENDING' ? 'OVERDUE' : payment.status,
      paymentDate: payment.paidDate ? payment.paidDate.toISOString() : null,
      description: payment.notes,
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
    const { studentId, amount, notes, dueDate, method, status, paymentType, schoolYearId } = body

    // Validate required fields
    if (!studentId || !amount || !dueDate || !schoolYearId) {
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
        schoolYearId,
        amount: parseFloat(amount),
        notes,
        dueDate: new Date(dueDate),
        status: status || 'PENDING',
        paymentType: paymentType || 'MONTHLY_FEE',
        method: method || null,
        paidDate: status === 'PAID' ? new Date() : null
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
        studentName: newPayment.student.user.name,
        amount: Number(newPayment.amount),
        notes: newPayment.notes,
        dueDate: newPayment.dueDate.toISOString(),
        status: newPayment.status,
        paymentType: newPayment.paymentType,
        method: newPayment.method,
        paymentDate: newPayment.paidDate?.toISOString() || null
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
        paidDate: paymentDate ? new Date(paymentDate) : null,
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
        paymentDate: updatedPayment.paidDate?.toISOString() || null
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
