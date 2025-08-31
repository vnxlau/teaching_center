import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
