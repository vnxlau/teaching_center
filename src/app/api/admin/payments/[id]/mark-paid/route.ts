import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
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

    if (payment.status === 'PAID') {
      return NextResponse.json({
        error: 'Payment is already marked as paid'
      }, { status: 409 })
    }

    // Update the payment
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        paidDate: new Date(),
        method: 'CASH' // Default payment method
      }
    })

    return NextResponse.json({
      success: true,
      message: `Payment for ${payment.student.firstName} ${payment.student.lastName} (${payment.student.studentCode}) marked as paid`,
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status,
        paymentDate: updatedPayment.paidDate?.toISOString()
      }
    })

  } catch (error) {
    console.error('Mark payment as paid error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
