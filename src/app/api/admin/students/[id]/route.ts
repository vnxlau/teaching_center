import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const studentId = resolvedParams.id

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            email: true,
            phone: true
          }
        },
        membershipPlan: {
          select: {
            id: true,
            name: true,
            daysPerWeek: true,
            monthlyPrice: true
          }
        },
        schoolYear: {
          select: {
            name: true
          }
        },
        parents: {
          include: {
            parent: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                    phone: true
                  }
                }
              }
            }
          }
        },
        payments: {
          select: {
            amount: true,
            status: true,
            dueDate: true,
            paidDate: true
          },
          orderBy: { dueDate: 'desc' },
          take: 5
        },
        tests: {
          include: {
            test: {
              select: {
                scheduledDate: true,
                subject: {
                  select: {
                    name: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Calculate payment status
    const currentDate = new Date()
    const lastPayment = student.payments
      .filter((p: any) => p.status === 'PAID')
      .sort((a: any, b: any) => new Date(b.paidDate!).getTime() - new Date(a.paidDate!).getTime())[0]

    const nextDue = student.payments
      .filter((p: any) => p.status === 'PENDING' && new Date(p.dueDate) >= currentDate)
      .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]

    // Calculate average score
    const validScores = student.tests.filter((t: any) => t.score !== null).map((t: any) => t.score!)
    const averageScore = validScores.length > 0
      ? validScores.reduce((sum: number, score: number) => sum + score, 0) / validScores.length
      : null

    // Format the response
    const formattedStudent = {
      id: student.id,
      studentCode: student.studentCode,
      firstName: student.firstName,
      lastName: student.lastName,
      name: `${student.firstName} ${student.lastName}`,
      email: student.user.email,
      phone: student.user.phone,
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
      } : undefined,
      parentName: student.parents.length > 0
        ? student.parents[0].parent.user.name
        : null,
      parentEmail: student.parents.length > 0 ? student.parents[0].parent.user.email : null,
      paymentStatus: {
        current: student.payments.some(p =>
          p.status === 'PAID' &&
          new Date(p.paidDate!) >= new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        ),
        lastPayment: lastPayment?.paidDate?.toISOString(),
        nextDue: nextDue?.dueDate.toISOString()
      },
      academicStatus: {
        currentGrade: student.grade,
        averageScore,
        testsCompleted: student.tests.length
      }
    }

    return NextResponse.json({ student: formattedStudent })
  } catch (error) {
    console.error('Error fetching student:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const studentId = resolvedParams.id

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
      }
    })

    if (!existingStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Delete in transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Delete related records first
      await tx.payment.deleteMany({ where: { studentId } })
      await tx.testResult.deleteMany({ where: { studentId } })
      await tx.attendance.deleteMany({ where: { studentId } })
      // Note: Activities are not directly related to students, so we skip them
      await tx.message.deleteMany({ 
        where: { 
          OR: [
            { senderId: existingStudent.userId },
            { recipientId: existingStudent.userId }
          ]
        }
      })
      
      // Delete the student record
      await tx.student.delete({ where: { id: studentId } })
      
      // Delete the associated user account
      await tx.user.delete({ where: { id: existingStudent.userId } })
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Student and associated data deleted successfully' 
    })

  } catch (error) {
    console.error('Delete student error:', error)
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const studentId = resolvedParams.id
    const body = await request.json()

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true }
    })

    if (!existingStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Update student and user information
    const updatedStudent = await prisma.$transaction(async (tx) => {
      // Update user information
      const updatedUser = await tx.user.update({
        where: { id: existingStudent.userId },
        data: {
          name: `${body.firstName} ${body.lastName}`,
          email: body.email,
          phone: body.phone || null,
        }
      })

      // Update student information
      const student = await tx.student.update({
        where: { id: studentId },
        data: {
          grade: body.grade || null,
          dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
          address: body.address || null,
          emergencyContact: body.emergencyContact || null,
          notes: body.notes || null,
          isActive: body.isActive !== undefined ? body.isActive : true,
          membershipPlanId: body.membershipPlanId || null,
          discountRate: body.discountRate || 0,
          monthlyDueAmount: body.monthlyDueAmount || null,
        }
      })

      return { user: updatedUser, student }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Student updated successfully',
      student: updatedStudent
    })

  } catch (error) {
    console.error('Update student error:', error)
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    )
  }
}
