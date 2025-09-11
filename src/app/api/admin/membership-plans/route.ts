import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface MembershipPlan {
  id: string
  name: string
  description: string | null
  daysPerWeek: number
  monthlyPrice: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  _count: {
    students: number
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch membership plans with student count
    const membershipPlans = await prisma.membershipPlan.findMany({
      where: {
        isActive: true
      },
      include: {
        _count: {
          select: {
            students: true
          }
        }
      },
      orderBy: {
        daysPerWeek: 'asc'
      }
    })

    return NextResponse.json({ 
      membershipPlans: membershipPlans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        daysPerWeek: plan.daysPerWeek,
        monthlyPrice: Number(plan.monthlyPrice),
        isActive: plan.isActive,
        studentCount: plan._count.students,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt
      }))
    })
  } catch (error) {
    console.error('Failed to fetch membership plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch membership plans' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, daysPerWeek, monthlyPrice } = body

    if (!name || !daysPerWeek || !monthlyPrice) {
      return NextResponse.json(
        { error: 'Name, days per week, and monthly price are required' },
        { status: 400 }
      )
    }

    if (daysPerWeek < 1 || daysPerWeek > 7) {
      return NextResponse.json(
        { error: 'Days per week must be between 1 and 7' },
        { status: 400 }
      )
    }

    const membershipPlan = await prisma.membershipPlan.create({
      data: {
        name,
        description,
        daysPerWeek: parseInt(daysPerWeek),
        monthlyPrice: parseFloat(monthlyPrice),
        isActive: true
      }
    })

    return NextResponse.json({
      membershipPlan: {
        id: membershipPlan.id,
        name: membershipPlan.name,
        description: membershipPlan.description,
        daysPerWeek: membershipPlan.daysPerWeek,
        monthlyPrice: Number(membershipPlan.monthlyPrice),
        isActive: membershipPlan.isActive
      }
    })
  } catch (error) {
    console.error('Failed to create membership plan:', error)
    return NextResponse.json(
      { error: 'Failed to create membership plan' },
      { status: 500 }
    )
  }
}
