import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const studentId = params.id

    // Get parent
    const parent = await prisma.parent.findFirst({
      where: { user: { email: session.user.email } }
    })

    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 })
    }

    // Check if parent has access to this student
    const studentParentRelation = await prisma.studentParent.findFirst({
      where: {
        studentId: studentId,
        parentId: parent.id
      }
    })

    if (!studentParentRelation) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get student data
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        membershipPlan: true,
        attendances: {
          where: {
            date: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Current month
              lte: new Date()
            }
          },
          orderBy: { date: 'desc' }
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Calculate academic status
    const totalTests = student.attendances.length
    const presentCount = student.attendances.filter((a: any) => a.status === 'PRESENT').length
    const averageScore = totalTests > 0 ? (presentCount / totalTests) * 100 : 0

    // Get payment status
    const currentMonth = new Date()
    const lastPayment = await prisma.payment.findFirst({
      where: {
        studentId: student.id,
        status: 'PAID'
      },
      orderBy: { paidDate: 'desc' }
    })

    const nextDue = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)

    const response = {
      student: {
        id: student.id,
        studentCode: student.studentCode,
        firstName: student.firstName,
        lastName: student.lastName,
        name: `${student.firstName} ${student.lastName}`,
        email: student.user.email,
        grade: student.grade,
        status: student.isActive ? 'ACTIVE' : 'INACTIVE',
        enrollmentDate: student.enrollmentDate.toISOString(),
        monthlyDueAmount: student.monthlyDueAmount ? Number(student.monthlyDueAmount) : undefined,
        discountRate: student.discountRate ? Number(student.discountRate) : undefined,
        membershipPlan: student.membershipPlan ? {
          id: student.membershipPlan.id,
          name: student.membershipPlan.name,
          daysPerWeek: student.membershipPlan.daysPerWeek,
          monthlyPrice: Number(student.membershipPlan.monthlyPrice)
        } : null,
        paymentStatus: {
          current: lastPayment && lastPayment.paidDate ? lastPayment.paidDate >= new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1) : false,
          lastPayment: lastPayment?.paidDate?.toISOString(),
          nextDue: nextDue.toISOString()
        },
        academicStatus: {
          currentGrade: student.grade,
          averageScore: averageScore,
          testsCompleted: totalTests
        }
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching student for parent:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
