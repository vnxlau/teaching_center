import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/admin/attendance - Get attendance records for a student
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    const where: any = { studentId }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            studentCode: true,
            membershipPlan: {
              select: {
                name: true,
                daysPerWeek: true
              }
            }
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json({ attendance })
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/attendance - Create or update attendance record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { studentId, date, checkInTime, checkOutTime, status, notes } = body

    if (!studentId || !date) {
      return NextResponse.json({ error: 'Student ID and date are required' }, { status: 400 })
    }

    // Helper function to combine date and time
    const combineDateTime = (dateStr: string, timeStr: string | null): Date | null => {
      if (!timeStr) return null

      // Parse the date string
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return null

      // Parse the time string (format: "HH:mm" or "HH:mm:ss")
      const timeParts = timeStr.split(':')
      const hours = parseInt(timeParts[0], 10)
      const minutes = parseInt(timeParts[1], 10)
      const seconds = timeParts[2] ? parseInt(timeParts[2], 10) : 0

      if (isNaN(hours) || isNaN(minutes)) return null

      // Set the time on the date object
      date.setHours(hours, minutes, seconds, 0)

      return date
    }

    // Check if attendance record already exists
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        studentId_date: {
          studentId,
          date: new Date(date)
        }
      }
    })

    let attendance

    if (existingAttendance) {
      // Update existing record
      attendance = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          checkInTime: combineDateTime(date, checkInTime),
          checkOutTime: combineDateTime(date, checkOutTime),
          status: status || 'PRESENT',
          notes
        },
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true,
              studentCode: true
            }
          }
        }
      })
    } else {
      // Get current school year
      const currentSchoolYear = await prisma.schoolYear.findFirst({
        where: { isActive: true }
      })

      if (!currentSchoolYear) {
        return NextResponse.json({ error: 'No active school year found' }, { status: 400 })
      }

      // Create new record
    attendance = await prisma.attendance.create({
      data: {
        studentId,
        schoolYearId: currentSchoolYear.id,
        date: new Date(date),
        checkInTime: combineDateTime(date, checkInTime),
        checkOutTime: combineDateTime(date, checkOutTime),
        status: status || 'PRESENT',
        notes
      },
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true,
              studentCode: true
            }
          }
        }
      })
    }

    return NextResponse.json({ attendance })
  } catch (error) {
    console.error('Error creating/updating attendance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/attendance - Bulk update attendance records
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { studentId, date, checkInTime, checkOutTime } = body

    if (!studentId || !date) {
      return NextResponse.json({ error: 'Student ID and date are required' }, { status: 400 })
    }

    // Helper function to combine date and time
    const combineDateTime = (dateStr: string, timeStr: string | null): Date | null => {
      if (!timeStr) return null

      // Parse the date string
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return null

      // Parse the time string (format: "HH:mm" or "HH:mm:ss")
      const timeParts = timeStr.split(':')
      const hours = parseInt(timeParts[0], 10)
      const minutes = parseInt(timeParts[1], 10)
      const seconds = timeParts[2] ? parseInt(timeParts[2], 10) : 0

      if (isNaN(hours) || isNaN(minutes)) return null

      // Set the time on the date object
      date.setHours(hours, minutes, seconds, 0)

      return date
    }

    const attendance = await prisma.attendance.updateMany({
      where: {
        studentId,
        date: new Date(date)
      },
      data: {
        checkInTime: combineDateTime(date, checkInTime),
        checkOutTime: combineDateTime(date, checkOutTime)
      }
    })

    return NextResponse.json({ message: 'Attendance updated successfully' })
  } catch (error) {
    console.error('Error updating attendance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/attendance - Delete attendance record
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Attendance ID is required' }, { status: 400 })
    }

    await prisma.attendance.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Attendance record deleted successfully' })
  } catch (error) {
    console.error('Error deleting attendance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
