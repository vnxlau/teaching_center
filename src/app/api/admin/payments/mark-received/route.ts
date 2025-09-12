import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

    // Parse the month to get year and month number
    const [year, monthNum] = month.split('-').map(Number)

    if (!year || !monthNum || monthNum < 1 || monthNum > 12) {
      return NextResponse.json({
        error: 'Invalid month format. Expected YYYY-MM'
      }, { status: 400 })
    }

    // Calculate the date range for the month
    const startDate = new Date(year, monthNum - 1, 1) // First day of month
    const endDate = new Date(year, monthNum, 0, 23, 59, 59) // Last day of month

    // Find the payment for this student and month
    const payment = await prisma.payment.findFirst({
      where: {
        studentId: studentId,
        dueDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            studentCode: true
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json({
        error: 'No payment found for this student and month'
      }, { status: 404 })
    }

    if (payment.status === 'PAID') {
      return NextResponse.json({
        error: 'Payment is already marked as paid'
      }, { status: 409 })
    }

    // Update the payment
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        paidDate: new Date(),
        notes: description || payment.notes, // Update description if provided
        method: 'CASH' // Default payment method
      }
    })

    return NextResponse.json({
      success: true,
      message: `Payment for ${payment.student.firstName} ${payment.student.lastName} (${payment.student.studentCode}) marked as received`,
      payment: {
        id: updatedPayment.id,
        studentName: `${payment.student.firstName} ${payment.student.lastName}`,
        studentCode: payment.student.studentCode,
        amount: updatedPayment.amount,
        status: updatedPayment.status,
        paymentDate: updatedPayment.paidDate?.toISOString()
      }
    })

  } catch (error) {
    console.error('Mark payment received error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
