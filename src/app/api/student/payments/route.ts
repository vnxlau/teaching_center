import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the student record
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        payments: {
          orderBy: {
            dueDate: 'desc'
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Transform the payments data
    const payments = student.payments.map(payment => ({
      id: payment.id,
      amount: Number(payment.amount),
      dueDate: payment.dueDate.toISOString(),
      paidDate: payment.paidDate?.toISOString() || null,
      status: payment.status,
      paymentType: payment.paymentType,
      method: payment.method,
      description: `${payment.paymentType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} - ${new Date(payment.dueDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    }))

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Error fetching student payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}
