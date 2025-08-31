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
                studentCode: true,
                grade: true
              }
            }
          }
        }
      }
    })

    if (!parent) {
      return NextResponse.json({ students: [] })
    }

    const students = parent.students.map(sp => sp.student)

    return NextResponse.json({
      students
    })
  } catch (error) {
    console.error('Parent Students API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
