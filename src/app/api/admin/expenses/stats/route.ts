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

    // Get all expenses
    const allExpenses = await prisma.expense.findMany()

    // Calculate overview stats
    const totalExpenses = allExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0)

    // Current month expenses
    const currentMonthExpenses = allExpenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
    })
    const monthlyExpenses = currentMonthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0)

    // Expenses by type
    const serviceExpenses = allExpenses
      .filter(expense => expense.type === 'SERVICE')
      .reduce((sum, expense) => sum + Number(expense.amount), 0)

    const materialsExpenses = allExpenses
      .filter(expense => expense.type === 'MATERIALS')
      .reduce((sum, expense) => sum + Number(expense.amount), 0)

    const dailyEmployeesExpenses = allExpenses
      .filter(expense => expense.type === 'DAILY_EMPLOYEES')
      .reduce((sum, expense) => sum + Number(expense.amount), 0)

    // Monthly breakdown for the last 6 months
    const monthlyBreakdown = []
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentYear, currentMonth - i, 1)
      const targetMonth = targetDate.getMonth()
      const targetYear = targetDate.getFullYear()

      const monthExpenses = allExpenses.filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate.getMonth() === targetMonth && expenseDate.getFullYear() === targetYear
      })

      const totalAmount = monthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
      const serviceAmount = monthExpenses
        .filter(expense => expense.type === 'SERVICE')
        .reduce((sum, expense) => sum + Number(expense.amount), 0)
      const materialsAmount = monthExpenses
        .filter(expense => expense.type === 'MATERIALS')
        .reduce((sum, expense) => sum + Number(expense.amount), 0)
      const dailyEmployeesAmount = monthExpenses
        .filter(expense => expense.type === 'DAILY_EMPLOYEES')
        .reduce((sum, expense) => sum + Number(expense.amount), 0)

      monthlyBreakdown.push({
        month: targetDate.toLocaleString('en-US', { month: 'long' }),
        year: targetYear,
        totalAmount,
        serviceAmount,
        materialsAmount,
        dailyEmployeesAmount,
        expenseCount: monthExpenses.length
      })
    }

    // Category breakdown
    const categoryMap = new Map<string, { totalAmount: number, count: number }>()

    allExpenses.forEach(expense => {
      const category = expense.category || 'Uncategorized'
      const current = categoryMap.get(category) || { totalAmount: 0, count: 0 }
      categoryMap.set(category, {
        totalAmount: current.totalAmount + Number(expense.amount),
        count: current.count + 1
      })
    })

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      totalAmount: data.totalAmount,
      percentage: totalExpenses > 0 ? (data.totalAmount / totalExpenses) * 100 : 0,
      expenseCount: data.count
    })).sort((a, b) => b.totalAmount - a.totalAmount)

    const response = {
      overview: {
        totalExpenses,
        monthlyExpenses,
        serviceExpenses,
        materialsExpenses,
        dailyEmployeesExpenses,
        expenseCount: allExpenses.length
      },
      monthlyBreakdown,
      categoryBreakdown
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to fetch expense statistics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
