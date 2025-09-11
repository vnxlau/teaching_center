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

    // Get student schedule
    const schedules = await prisma.studentSchedule.findMany({
      where: { studentId: studentId },
      orderBy: { dayOfWeek: 'asc' }
    })

    // Format schedule data
    const schedule = schedules.map((s: any) => ({
      dayOfWeek: s.dayOfWeek,
      startTime: '09:00', // Default start time - you might want to add this to the schema
      endTime: '17:00'    // Default end time - you might want to add this to the schema
    }))

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error('Error fetching student schedule for parent:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
