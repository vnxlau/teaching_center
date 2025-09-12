import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'current-month'
    const schoolYearParam = searchParams.get('schoolYear')

    // Calculate date range based on period
    const now = new Date()
    let startDate: Date
    let endDate: Date = new Date(now)

    switch (period) {
      case 'current-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'last-month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'last-3-months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        break
      case 'current-year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      case 'last-year':
        startDate = new Date(now.getFullYear() - 1, 0, 1)
        endDate = new Date(now.getFullYear() - 1, 11, 31)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    // Get current school year if not specified
    let schoolYearId = schoolYearParam
    if (!schoolYearId) {
      const currentSchoolYear = await prisma.schoolYear.findFirst({
        where: {
          startDate: { lte: now },
          endDate: { gte: now }
        }
      })
      schoolYearId = currentSchoolYear?.id || null
    }

    // Build where clause
    const whereClause: any = {
      date: {
        gte: startDate,
        lte: endDate
      }
    }

    if (schoolYearId) {
      whereClause.schoolYearId = schoolYearId
    }

    // Get all attendance records for the period
    const attendanceRecords = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentCode: true,
            membershipPlan: {
              select: {
                daysPerWeek: true
              }
            }
          }
        }
      }
    })

    // Get total students count
    const totalStudents = await prisma.student.count({
      where: schoolYearId ? { schoolYearId } : {}
    })

    // Get active students (those with attendance records in the period)
    const activeStudentIds = [...new Set(attendanceRecords.map(record => record.studentId))]
    const activeStudents = activeStudentIds.length

    // Calculate student assiduity
    const studentAssiduity = await Promise.all(
      activeStudentIds.map(async (studentId) => {
        const studentRecords = attendanceRecords.filter(record => record.studentId === studentId)
        const student = studentRecords[0]?.student

        const presentDays = studentRecords.filter(record => record.status === 'PRESENT').length
        const absentDays = studentRecords.filter(record => record.status === 'ABSENT').length
        const lateDays = studentRecords.filter(record => record.status === 'LATE').length
        const excusedDays = studentRecords.filter(record => record.status === 'EXCUSED').length
        const totalDays = studentRecords.length

        const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0

        return {
          studentId,
          studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
          studentCode: student?.studentCode || '',
          attendanceRate,
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          excusedDays
        }
      })
    )

    // Sort by attendance rate (lowest first to highlight issues)
    studentAssiduity.sort((a, b) => a.attendanceRate - b.attendanceRate)

    // Calculate weekday statistics
    const weekdayStats = {
      monday: { expected: 0, actual: 0, rate: 0 },
      tuesday: { expected: 0, actual: 0, rate: 0 },
      wednesday: { expected: 0, actual: 0, rate: 0 },
      thursday: { expected: 0, actual: 0, rate: 0 },
      friday: { expected: 0, actual: 0, rate: 0 },
      saturday: { expected: 0, actual: 0, rate: 0 },
      sunday: { expected: 0, actual: 0, rate: 0 }
    }

    // Get unique dates and calculate expected vs actual attendance per weekday
    const uniqueDates = [...new Set(attendanceRecords.map(record => record.date.toISOString().split('T')[0]))]

    for (const dateStr of uniqueDates) {
      const date = new Date(dateStr)
      const weekday = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

      // Count actual attendance for this date
      const dayRecords = attendanceRecords.filter(record =>
        record.date.toISOString().split('T')[0] === dateStr
      )
      const actualAttendance = dayRecords.filter(record => record.status === 'PRESENT').length

      // Calculate expected attendance based on student schedules
      let expectedAttendance = 0
      for (const studentId of activeStudentIds) {
        const student = await prisma.student.findUnique({
          where: { id: studentId },
          select: {
            membershipPlan: {
              select: { daysPerWeek: true }
            }
          }
        })

        if (student?.membershipPlan?.daysPerWeek) {
          // Simple logic: assume students attend based on their plan
          // In a real implementation, you'd have a more sophisticated schedule system
          expectedAttendance += Math.ceil(student.membershipPlan.daysPerWeek / 7)
        }
      }

      weekdayStats[weekday as keyof typeof weekdayStats].actual += actualAttendance
      weekdayStats[weekday as keyof typeof weekdayStats].expected += Math.max(expectedAttendance, 1)
    }

    // Calculate rates
    Object.keys(weekdayStats).forEach(weekday => {
      const stats = weekdayStats[weekday as keyof typeof weekdayStats]
      stats.rate = stats.expected > 0 ? (stats.actual / stats.expected) * 100 : 0
    })

    // Calculate monthly statistics
    const monthlyStats = []
    const monthsInPeriod = new Set(
      attendanceRecords.map(record =>
        `${record.date.getFullYear()}-${String(record.date.getMonth() + 1).padStart(2, '0')}`
      )
    )

    for (const monthKey of monthsInPeriod) {
      const [year, month] = monthKey.split('-')
      const monthRecords = attendanceRecords.filter(record =>
        record.date.getFullYear() === parseInt(year) &&
        record.date.getMonth() === parseInt(month) - 1
      )

      const presentDays = monthRecords.filter(record => record.status === 'PRESENT').length
      const totalDays = monthRecords.length
      const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0

      // Calculate daily attendance for max/min
      const dailyAttendance = new Map<string, number>()
      monthRecords.forEach(record => {
        const dateKey = record.date.toISOString().split('T')[0]
        if (!dailyAttendance.has(dateKey)) {
          dailyAttendance.set(dateKey, 0)
        }
        if (record.status === 'PRESENT') {
          dailyAttendance.set(dateKey, dailyAttendance.get(dateKey)! + 1)
        }
      })

      const attendanceValues = Array.from(dailyAttendance.values())
      const maxAttendance = attendanceValues.length > 0 ? Math.max(...attendanceValues) : 0
      const minAttendance = attendanceValues.length > 0 ? Math.min(...attendanceValues) : 0

      monthlyStats.push({
        month: new Date(parseInt(year), parseInt(month) - 1).toLocaleString('en-US', { month: 'long' }),
        year: parseInt(year),
        totalDays,
        presentDays,
        attendanceRate,
        maxAttendance,
        minAttendance
      })
    }

    // Calculate school year statistics
    const schoolYearStats = []
    if (schoolYearId) {
      const schoolYear = await prisma.schoolYear.findUnique({
        where: { id: schoolYearId },
        select: { name: true }
      })

      const yearRecords = attendanceRecords.filter(record => record.schoolYearId === schoolYearId)
      const presentDays = yearRecords.filter(record => record.status === 'PRESENT').length
      const totalDays = yearRecords.length
      const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0

      // Calculate daily attendance for max/min
      const dailyAttendance = new Map<string, number>()
      yearRecords.forEach(record => {
        const dateKey = record.date.toISOString().split('T')[0]
        if (!dailyAttendance.has(dateKey)) {
          dailyAttendance.set(dateKey, 0)
        }
        if (record.status === 'PRESENT') {
          dailyAttendance.set(dateKey, dailyAttendance.get(dateKey)! + 1)
        }
      })

      const attendanceValues = Array.from(dailyAttendance.values())
      const maxAttendance = attendanceValues.length > 0 ? Math.max(...attendanceValues) : 0
      const minAttendance = attendanceValues.length > 0 ? Math.min(...attendanceValues) : 0

      schoolYearStats.push({
        schoolYear: schoolYear?.name || 'Current Year',
        totalDays,
        presentDays,
        attendanceRate,
        maxAttendance,
        minAttendance
      })
    }

    // Calculate daily attendance data for the graph
    const dailyAttendance = uniqueDates.map(dateStr => {
      const dayRecords = attendanceRecords.filter(record =>
        record.date.toISOString().split('T')[0] === dateStr
      )
      const actualAttendance = dayRecords.filter(record => record.status === 'PRESENT').length

      // Calculate expected attendance (simplified)
      const expectedAttendance = Math.max(activeStudents * 0.7, 1) // Assume 70% expected attendance

      const attendanceRate = expectedAttendance > 0 ? (actualAttendance / expectedAttendance) * 100 : 0

      return {
        date: dateStr,
        expectedAttendance,
        actualAttendance,
        attendanceRate,
        weekday: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      }
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Calculate overall statistics
    const totalPresentDays = attendanceRecords.filter(record => record.status === 'PRESENT').length
    const averageAttendanceRate = attendanceRecords.length > 0
      ? (totalPresentDays / attendanceRecords.length) * 100
      : 0

    const response = {
      overview: {
        totalStudents,
        activeStudents,
        averageAttendanceRate,
        totalAttendanceRecords: attendanceRecords.length
      },
      studentAssiduity,
      weekdayStats,
      monthlyStats,
      schoolYearStats,
      dailyAttendance
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to fetch attendance dashboard data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
