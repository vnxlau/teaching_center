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
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use raw query for now until Prisma client is updated 
    const membershipPlans = await prisma.$queryRaw`
      SELECT 
        mp.*,
        COALESCE(student_counts.count, 0) as student_count
      FROM membership_plans mp
      LEFT JOIN (
        SELECT "membershipPlanId", COUNT(*) as count
        FROM students 
        WHERE "membershipPlanId" IS NOT NULL
        GROUP BY "membershipPlanId"
      ) student_counts ON mp.id = student_counts."membershipPlanId"
      ORDER BY mp."daysPerWeek" ASC
    ` as any[]

    return NextResponse.json({ 
      plans: membershipPlans.map((plan: any) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        daysPerWeek: plan.daysPerWeek,
        monthlyPrice: Number(plan.monthlyPrice),
        isActive: plan.isActive,
        studentCount: Number(plan.student_count),
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
    
    if (!session || session.user.role !== 'ADMIN') {
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

    // Use raw query for now until Prisma client is updated
    const result = await prisma.$queryRaw`
      INSERT INTO membership_plans (id, name, description, "daysPerWeek", "monthlyPrice", "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${name}, ${description || null}, ${parseInt(daysPerWeek)}, ${parseFloat(monthlyPrice)}, true, NOW(), NOW())
      RETURNING *
    ` as any[]

    const membershipPlan = result[0]

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
