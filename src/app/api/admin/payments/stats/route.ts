import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Get all payments
    const allPayments = await prisma.payment.findMany()

    // Calculate total revenue
    const totalRevenue = allPayments
      .filter(payment => payment.status === 'PAID')
      .reduce((sum, payment) => sum + Number(payment.amount), 0)

    // Current month revenue
    const currentMonthPayments = allPayments.filter(payment => {
      const paymentDate = new Date(payment.dueDate)
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear && payment.status === 'PAID'
    })
    const monthlyRevenue = currentMonthPayments.reduce((sum, payment) => sum + Number(payment.amount), 0)

    // Pending payments
    const pendingPayments = allPayments.filter(payment => payment.status === 'PENDING')
    const pendingAmount = pendingPayments.reduce((sum, payment) => sum + Number(payment.amount), 0)

    // Overdue payments
    const overduePayments = allPayments.filter(payment => {
      const dueDate = new Date(payment.dueDate)
      return dueDate < now && payment.status === 'PENDING'
    })
    const overdueAmount = overduePayments.reduce((sum, payment) => sum + Number(payment.amount), 0)

    // Monthly breakdown for the last 6 months
    const monthlyBreakdown = []
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentYear, currentMonth - i, 1)
      const targetMonth = targetDate.getMonth()
      const targetYear = targetDate.getFullYear()

      const monthPayments = allPayments.filter(payment => {
        const paymentDate = new Date(payment.dueDate)
        return paymentDate.getMonth() === targetMonth &&
               paymentDate.getFullYear() === targetYear &&
               payment.status === 'PAID'
      })

      const monthRevenue = monthPayments.reduce((sum, payment) => sum + Number(payment.amount), 0)

      monthlyBreakdown.push({
        month: targetDate.toLocaleString('default', { month: 'short' }),
        year: targetYear,
        revenue: monthRevenue,
        count: monthPayments.length
      })
    }

    // Payment methods breakdown
    const paymentMethods = allPayments
      .filter(payment => payment.status === 'PAID')
      .reduce((acc, payment) => {
        const method = payment.method || 'CASH'
        acc[method] = (acc[method] || 0) + Number(payment.amount)
        return acc
      }, {} as Record<string, number>)

    const stats = {
      totalRevenue,
      monthlyRevenue,
      pendingAmount,
      overdueAmount,
      monthlyBreakdown,
      paymentMethods,
      totalPayments: allPayments.length,
      paidPayments: allPayments.filter(p => p.status === 'PAID').length,
      pendingPayments: pendingPayments.length,
      overduePayments: overduePayments.length
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Failed to fetch payment stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
