import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/admin/expenses/[id] - Get single expense
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const expense = await prisma.expense.findUnique({
      where: { id }
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Failed to fetch expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/expenses/[id] - Update expense
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { type, description, amount, date, category, vendor, notes } = body

    if (!type || !description || !amount || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        type,
        description,
        amount: parseFloat(amount),
        date: new Date(date),
        category,
        vendor,
        notes
      }
    })

    return NextResponse.json(updatedExpense)
  } catch (error) {
    console.error('Failed to update expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/expenses/[id] - Delete expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await prisma.expense.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Failed to delete expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
