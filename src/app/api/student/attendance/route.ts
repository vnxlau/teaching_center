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

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 })
    }

    // Get student
    const student = await prisma.student.findFirst({
      where: { user: { email: session.user.email } }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Get attendance records
    const attendance = await prisma.attendance.findMany({
      where: {
        studentId: student.id,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      orderBy: { date: 'asc' }
    })

    return NextResponse.json({ attendance })
  } catch (error) {
    console.error('Error fetching student attendance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
