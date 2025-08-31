import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get parent's children through StudentParent relationship
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: {
        students: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                studentCode: true
              }
            }
          }
        }
      }
    })

    if (!parent) {
      return NextResponse.json({ payments: [] })
    }

    const childrenIds = parent.students.map(sp => sp.student.id)

    // Get payments for all children
    const payments = await prisma.payment.findMany({
      where: {
        studentId: {
          in: childrenIds
        }
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentCode: true
          }
        }
      },
      orderBy: {
        dueDate: 'desc'
      }
    })

    // Transform to expected format and determine status
    const transformedPayments = payments.map(payment => {
      const now = new Date()
      const dueDate = new Date(payment.dueDate)
      
      let status: 'PAID' | 'PENDING' | 'OVERDUE' = 'PENDING'
      
      if (payment.status === 'PAID') {
        status = 'PAID'
      } else if (dueDate < now) {
        status = 'OVERDUE'
      }

      return {
        id: payment.id,
        amount: Number(payment.amount),
        dueDate: payment.dueDate.toISOString(),
        paidDate: payment.paidDate?.toISOString(),
        status,
        method: payment.method || '',
        description: payment.paymentType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) + (payment.notes ? ` - ${payment.notes}` : ''),
        student: payment.student
      }
    })

    return NextResponse.json({
      payments: transformedPayments
    })
  } catch (error) {
    console.error('Parent Payments API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
