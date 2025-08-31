import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || 'month'

    // Calculate date range based on timeframe
    const now = new Date()
    let startDate: Date
    
    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Get overview statistics
    const [
      totalStudents,
      activeStudents,
      totalStaff,
      totalParents,
      payments,
      grades
    ] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({
        where: {
          isActive: true
        }
      }),
      prisma.user.count({
        where: {
          role: 'STAFF'
        }
      }),
      prisma.parent.count(),
      prisma.payment.findMany({
        where: {
          createdAt: {
            gte: startDate
          }
        }
      }),
      prisma.testResult.findMany({
        include: {
          test: true,
          student: {
            include: {
              user: true
            }
          }
        },
        where: {
          createdAt: {
            gte: startDate
          }
        }
      })
    ])

    // Calculate financial metrics
    const monthlyRevenue = payments
      .filter((p: any) => p.status === 'PAID')
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0)

    const pendingPayments = payments
      .filter((p: any) => p.status === 'PENDING')
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0)

    // Calculate performance metrics
    const gradePercentages = grades.map((grade: any) => 
      (grade.score / grade.test.maxScore) * 100
    )
    const averageGrade = gradePercentages.length > 0 
      ? Math.round(gradePercentages.reduce((sum: number, grade: number) => sum + grade, 0) / gradePercentages.length)
      : 0

    const passRate = gradePercentages.length > 0
      ? Math.round((gradePercentages.filter((grade: number) => grade >= 60).length / gradePercentages.length) * 100)
      : 0

    // Get top performers and struggling students
    const studentGrades = grades.reduce((acc: any, grade: any) => {
      const studentId = grade.student.id
      const studentName = `${grade.student.user.firstName} ${grade.student.user.lastName}`
      const percentage = (grade.score / grade.test.maxScore) * 100
      
      if (!acc[studentId]) {
        acc[studentId] = {
          id: studentId,
          name: studentName,
          grades: []
        }
      }
      acc[studentId].grades.push(percentage)
      return acc
    }, {} as Record<string, { id: string; name: string; grades: number[] }>)

    const studentAverages = Object.values(studentGrades).map((student: any) => ({
      id: student.id,
      name: student.name,
      average: Math.round(student.grades.reduce((sum: number, grade: number) => sum + grade, 0) / student.grades.length)
    }))

    const topPerformers = studentAverages
      .sort((a, b) => b.average - a.average)
      .slice(0, 5)

    const strugglingStudents = studentAverages
      .filter(student => student.average < 60)
      .sort((a, b) => a.average - b.average)
      .slice(0, 5)

    // Get payment method statistics
    const paymentMethods = payments
      .filter((p: any) => p.status === 'PAID')
      .reduce((acc: any, payment: any) => {
        const method = payment.paymentMethod || 'Unknown'
        if (!acc[method]) {
          acc[method] = { count: 0, amount: 0 }
        }
        acc[method].count += 1
        acc[method].amount += Number(payment.amount)
        return acc
      }, {} as Record<string, { count: number; amount: number }>)

    const paymentMethodsArray = Object.entries(paymentMethods).map(([method, data]: [string, any]) => ({
      method,
      count: data.count,
      amount: data.amount
    }))

    // Get recent activity (simplified)
    const recentActivity = [
      {
        id: '1',
        type: 'ENROLLMENT' as const,
        description: 'New student enrollment',
        timestamp: new Date().toISOString(),
        user: 'Admin'
      },
      {
        id: '2',
        type: 'PAYMENT' as const,
        description: 'Payment received',
        timestamp: new Date().toISOString(),
        user: 'System'
      }
    ]

    const analyticsData = {
      overview: {
        totalStudents,
        activeStudents,
        totalStaff,
        totalParents,
        monthlyRevenue,
        pendingPayments
      },
      performance: {
        averageGrade,
        passRate,
        topPerformers,
        strugglingStudents
      },
      attendance: {
        overallRate: 85, // Placeholder
        monthlyTrend: [
          { month: 'Jan', rate: 88 },
          { month: 'Feb', rate: 85 },
          { month: 'Mar', rate: 90 }
        ]
      },
      financial: {
        totalRevenue: monthlyRevenue,
        pendingAmount: pendingPayments,
        overdueAmount: payments
          .filter((p: any) => p.status === 'OVERDUE')
          .reduce((sum: number, p: any) => sum + Number(p.amount), 0),
        paymentMethods: paymentMethodsArray
      },
      recentActivity
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Failed to fetch analytics data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
