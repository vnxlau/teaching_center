import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/admin/expenses - Get all expenses
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const expenses = await prisma.expense.findMany({
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Failed to fetch expenses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/expenses - Create new expense
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, description, amount, date, category, vendor, notes } = body

    if (!type || !description || !amount || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const expense = await prisma.expense.create({
      data: {
        type,
        description,
        amount,
        date: new Date(date),
        category,
        vendor,
        notes,
        createdBy: session.user.id
      }
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Failed to create expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
