import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get student
    const student = await prisma.student.findFirst({
      where: { user: { email: session.user.email } }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Get student schedule
    const schedules = await prisma.studentSchedule.findMany({
      where: { studentId: student.id },
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
    console.error('Error fetching student schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
