import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const resolvedParams = await params
    const paymentId = resolvedParams.id
    const body = await request.json()
    const { description, amount } = body

    // Validate required parameters
    if (amount === undefined || amount < 0) {
      return NextResponse.json({
        error: 'Valid amount is required'
      }, { status: 400 })
    }

    // Find the payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
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
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Update the payment
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        amount: amount,
        notes: description || payment.notes
      }
    })

    return NextResponse.json({
      success: true,
      message: `Payment for ${payment.student.firstName} ${payment.student.lastName} (${payment.student.studentCode}) updated successfully`,
      payment: {
        id: updatedPayment.id,
        amount: updatedPayment.amount,
        notes: updatedPayment.notes
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
