import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// GET /api/admin/finance/monthly-stats - Get current month payment statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || '')
    const year = parseInt(searchParams.get('year') || '')

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Missing required parameters: month, year' },
        { status: 400 }
      )
    }

    // Get current month name
    const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    })

    // Get all payments for the current month
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const monthlyPayments = await prisma.payment.findMany({
      where: {
        dueDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    // Calculate statistics
    const totalPayments = monthlyPayments.length
    const totalAmount = monthlyPayments.reduce((sum, payment) => sum + Number(payment.amount), 0)

    const paidPayments = monthlyPayments.filter(p => p.status === 'PAID')
    const paidCount = paidPayments.length
    const paidAmount = paidPayments.reduce((sum, payment) => sum + Number(payment.amount), 0)

    const pendingPayments = monthlyPayments.filter(p => p.status === 'PENDING')
    const pendingCount = pendingPayments.length
    const pendingAmount = pendingPayments.reduce((sum, payment) => sum + Number(payment.amount), 0)

    const overduePayments = monthlyPayments.filter(p => p.status === 'OVERDUE')
    const overdueCount = overduePayments.length
    const overdueAmount = overduePayments.reduce((sum, payment) => sum + Number(payment.amount), 0)

    // Outstanding = Pending + Overdue (still due)
    const stillDueCount = pendingCount + overdueCount
    const stillDueAmount = pendingAmount + overdueAmount

    return NextResponse.json({
      success: true,
      month,
      year,
      monthName,
      stats: {
        totalPayments: {
          count: totalPayments,
          amount: totalAmount
        },
        paidPayments: {
          count: paidCount,
          amount: paidAmount
        },
        stillDuePayments: {
          count: stillDueCount,
          amount: stillDueAmount
        },
        breakdown: {
          pending: {
            count: pendingCount,
            amount: pendingAmount
          },
          overdue: {
            count: overdueCount,
            amount: overdueAmount
          }
        }
      },
      payments: {
        all: monthlyPayments.map(payment => ({
          id: payment.id,
          studentName: payment.student.user.name,
          studentCode: payment.student.studentCode,
          amount: Number(payment.amount),
          status: payment.status,
          dueDate: payment.dueDate,
          notes: payment.notes
        })),
        paid: paidPayments.map(payment => ({
          id: payment.id,
          studentName: payment.student.user.name,
          studentCode: payment.student.studentCode,
          amount: Number(payment.amount),
          status: payment.status,
          dueDate: payment.dueDate,
          notes: payment.notes
        })),
        stillDue: [...pendingPayments, ...overduePayments].map(payment => ({
          id: payment.id,
          studentName: payment.student.user.name,
          studentCode: payment.student.studentCode,
          amount: Number(payment.amount),
          status: payment.status,
          dueDate: payment.dueDate,
          notes: payment.notes
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching monthly stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch monthly statistics' },
      { status: 500 }
    )
  }
}
