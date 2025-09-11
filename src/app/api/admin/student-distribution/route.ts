import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// GET /api/admin/student-distribution - Get current student distribution
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all active students with their membership plans
    const students = await prisma.student.findMany({
      where: {
        isActive: true,
        membershipPlan: {
          isActive: true
        }
      },
      include: {
        membershipPlan: true,
        user: {
          select: {
            name: true
          }
        }
      }
    })

    // Get current schedules
    const schedules = await prisma.studentSchedule.findMany({
      include: {
        student: {
          include: {
            membershipPlan: true,
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    // Organize data for frontend
    const daySchedule: { [key: string]: any[] } = {
      MONDAY: [],
      TUESDAY: [],
      WEDNESDAY: [],
      THURSDAY: [],
      FRIDAY: []
    }

    const unallocatedStudents: any[] = []

    // Process schedules
    schedules.forEach((schedule: any) => {
      const studentData = {
        id: schedule.student.id,
        name: `${schedule.student.firstName} ${schedule.student.lastName}`,
        membershipPlan: {
          name: schedule.student.membershipPlan?.name || 'No Plan',
          daysPerWeek: schedule.student.membershipPlan?.daysPerWeek || 0
        },
        isLocked: schedule.isLocked
      }

      daySchedule[schedule.dayOfWeek as string].push(studentData)
    })

    // Find unallocated students
    students.forEach(student => {
      const studentSchedules = schedules.filter((s: any) => s.studentId === student.id)
      const allocatedDays = studentSchedules.length
      const maxDays = student.membershipPlan?.daysPerWeek || 0

      if (allocatedDays < maxDays) {
        const remainingSlots = maxDays - allocatedDays
        for (let i = 0; i < remainingSlots; i++) {
          unallocatedStudents.push({
            id: `${student.id}_${i}`, // Unique ID for each slot
            studentId: student.id,
            name: `${student.firstName} ${student.lastName}`,
            membershipPlan: {
              name: student.membershipPlan?.name || 'No Plan',
              daysPerWeek: student.membershipPlan?.daysPerWeek || 0
            },
            isLocked: false
          })
        }
      }
    })

    return NextResponse.json({
      students: students.map(student => ({
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        membershipPlan: {
          name: student.membershipPlan?.name || 'No Plan',
          daysPerWeek: student.membershipPlan?.daysPerWeek || 0
        },
        isLocked: false // Will be set based on schedules
      })),
      daySchedule,
      unallocatedStudents
    })

  } catch (error) {
    console.error('Error fetching student distribution:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/student-distribution - Save student distribution
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { daySchedule, unallocatedStudents } = await request.json()

    // Clear existing schedules
    await prisma.studentSchedule.deleteMany()

    // Save new schedules
    const schedulePromises: any[] = []

    Object.entries(daySchedule).forEach(([day, students]) => {
      (students as any[]).forEach(student => {
        schedulePromises.push(
          prisma.studentSchedule.create({
            data: {
              studentId: student.studentId || student.id,
              dayOfWeek: day as any,
              isLocked: student.isLocked || false
            }
          })
        )
      })
    })

    await Promise.all(schedulePromises)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error saving student distribution:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/student-distribution/auto-allocate - Auto allocate students
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all unlocked students
    const unlockedStudents = await prisma.student.findMany({
      where: {
        isActive: true,
        membershipPlan: {
          isActive: true
        },
        schedules: {
          none: {
            isLocked: true
          }
        }
      },
      include: {
        membershipPlan: true,
        schedules: true
      }
    })

    // Clear existing unlocked schedules
    await prisma.studentSchedule.deleteMany({
      where: {
        isLocked: false
      }
    })

    // Auto-allocate unlocked students
    const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
    const schedulePromises: any[] = []

    unlockedStudents.forEach(student => {
      const maxDays = student.membershipPlan?.daysPerWeek || 0
      const allocatedDays = student.schedules.filter(s => s.isLocked).length
      const remainingSlots = maxDays - allocatedDays

      if (remainingSlots > 0) {
        // Randomly assign to available days
        const availableDays = [...DAYS]
        for (let i = 0; i < remainingSlots && availableDays.length > 0; i++) {
          const randomIndex = Math.floor(Math.random() * availableDays.length)
          const selectedDay = availableDays.splice(randomIndex, 1)[0]

          schedulePromises.push(
            prisma.studentSchedule.create({
              data: {
                studentId: student.id,
                dayOfWeek: selectedDay as any,
                isLocked: false
              }
            })
          )
        }
      }
    })

    await Promise.all(schedulePromises)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error auto-allocating students:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
