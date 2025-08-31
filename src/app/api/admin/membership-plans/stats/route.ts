import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get membership plan statistics
    const stats = await prisma.$queryRaw`
      WITH plan_stats AS (
        SELECT 
          mp.id,
          mp.name,
          mp."daysPerWeek",
          mp."monthlyPrice",
          COALESCE(student_counts.student_count, 0) as student_count,
          COALESCE(revenue_data.total_revenue, 0) as total_revenue,
          COALESCE(revenue_data.monthly_revenue, 0) as monthly_revenue
        FROM membership_plans mp
        LEFT JOIN (
          SELECT 
            "membershipPlanId", 
            COUNT(*) as student_count
          FROM students 
          WHERE "membershipPlanId" IS NOT NULL
          GROUP BY "membershipPlanId"
        ) student_counts ON mp.id = student_counts."membershipPlanId"
        LEFT JOIN (
          SELECT 
            s."membershipPlanId",
            SUM(p.amount) as total_revenue,
            SUM(CASE WHEN p."dueDate" >= DATE_TRUNC('month', CURRENT_DATE) 
                     AND p."dueDate" < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
                     AND p.status = 'PAID' 
                THEN p.amount ELSE 0 END) as monthly_revenue
          FROM students s
          LEFT JOIN payments p ON s.id = p."studentId"
          WHERE s."membershipPlanId" IS NOT NULL
          GROUP BY s."membershipPlanId"
        ) revenue_data ON mp.id = revenue_data."membershipPlanId"
      ),
      overall_stats AS (
        SELECT 
          COUNT(*) as total_plans,
          SUM(student_count) as total_students,
          SUM(total_revenue) as total_revenue,
          SUM(monthly_revenue) as current_month_revenue,
          AVG(student_count) as avg_students_per_plan
        FROM plan_stats
      )
      SELECT 
        json_build_object(
          'totalPlans', os.total_plans,
          'totalStudents', os.total_students,
          'totalRevenue', os.total_revenue,
          'currentMonthRevenue', os.current_month_revenue,
          'avgStudentsPerPlan', ROUND(os.avg_students_per_plan, 1),
          'mostPopularPlan', (
            SELECT json_build_object(
              'id', ps.id,
              'name', ps.name,
              'studentCount', ps.student_count
            )
            FROM plan_stats ps 
            WHERE ps.student_count > 0
            ORDER BY ps.student_count DESC 
            LIMIT 1
          ),
          'highestRevenuePlan', (
            SELECT json_build_object(
              'id', ps.id,
              'name', ps.name,
              'totalRevenue', ps.total_revenue,
              'monthlyRevenue', ps.monthly_revenue
            )
            FROM plan_stats ps 
            WHERE ps.total_revenue > 0
            ORDER BY ps.total_revenue DESC 
            LIMIT 1
          ),
          'lowestRevenuePlan', (
            SELECT json_build_object(
              'id', ps.id,
              'name', ps.name,
              'totalRevenue', ps.total_revenue,
              'studentCount', ps.student_count
            )
            FROM plan_stats ps 
            WHERE ps.student_count > 0
            ORDER BY ps.total_revenue ASC 
            LIMIT 1
          ),
          'plansByPopularity', (
            SELECT json_agg(
              json_build_object(
                'id', ps.id,
                'name', ps.name,
                'studentCount', ps.student_count,
                'monthlyPrice', ps."monthlyPrice"
              ) ORDER BY ps.student_count DESC
            )
            FROM plan_stats ps
          ),
          'plansByRevenue', (
            SELECT json_agg(
              json_build_object(
                'id', ps.id,
                'name', ps.name,
                'totalRevenue', ps.total_revenue,
                'monthlyRevenue', ps.monthly_revenue,
                'studentCount', ps.student_count
              ) ORDER BY ps.total_revenue DESC
            )
            FROM plan_stats ps
          )
        ) as stats
      FROM overall_stats os
    ` as any[]

    const result = stats[0]?.stats || {
      totalPlans: 0,
      totalStudents: 0,
      totalRevenue: 0,
      currentMonthRevenue: 0,
      avgStudentsPerPlan: 0,
      mostPopularPlan: null,
      highestRevenuePlan: null,
      lowestRevenuePlan: null,
      plansByPopularity: [],
      plansByRevenue: []
    }

    return NextResponse.json({
      stats: {
        ...result,
        totalRevenue: Number(result.totalRevenue || 0),
        currentMonthRevenue: Number(result.currentMonthRevenue || 0),
        avgStudentsPerPlan: Number(result.avgStudentsPerPlan || 0)
      }
    })
  } catch (error) {
    console.error('Failed to fetch membership plan statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
