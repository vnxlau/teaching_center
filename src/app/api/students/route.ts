import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true,
            role: true
          }
        },
        schoolYear: {
          select: {
            name: true,
            isActive: true
          }
        },
        parents: {
          include: {
            parent: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            payments: true,
            attendances: true,
            tests: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: students
    })
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch students' 
      },
      { status: 500 }
    )
  }
}
