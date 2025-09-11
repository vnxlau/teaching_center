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

    const schedules = await prisma.studentSchedule.findMany({
      where: { studentId },
      orderBy: { dayOfWeek: 'asc' },
      select: {
        id: true,
        dayOfWeek: true,
        isLocked: true
      }
    })

    // For now, return basic schedule info
    // TODO: Add startTime and endTime fields to StudentSchedule model if needed
    const formattedSchedule = schedules.map((schedule: any) => ({
      dayOfWeek: schedule.dayOfWeek,
      startTime: '09:00', // Default start time
      endTime: '17:00',   // Default end time
      isLocked: schedule.isLocked
    }))

    return NextResponse.json({ schedule: formattedSchedule })
  } catch (error) {
    console.error('Error fetching student schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
