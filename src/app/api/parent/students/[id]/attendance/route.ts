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

    if (!session || session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: studentId } = await params
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 })
    }

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

    // Get attendance records
    const attendance = await prisma.attendance.findMany({
      where: {
        studentId: studentId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      orderBy: { date: 'asc' }
    })

    return NextResponse.json({ attendance })
  } catch (error) {
    console.error('Error fetching student attendance for parent:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
