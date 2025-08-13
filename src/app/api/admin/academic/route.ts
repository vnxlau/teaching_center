import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch tests
    const tests = await prisma.test.findMany({
      include: {
        staff: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Fetch test results
    const testResults = await prisma.testResult.findMany({
      include: {
        test: true,
        student: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Fetch activities
    const activities = await prisma.activity.findMany({
      include: {
        staff: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      tests,
      testResults,
      activities
    })
  } catch (error) {
    console.error('Academic API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch academic data' },
      { status: 500 }
    )
  }
}
    const transformedPlans = teachingPlans.map((plan: any) => ({
      id: plan.id,
      studentName: plan.student.name,
      studentCode: plan.student.studentCode,
      subjects: plan.subjects,
      goals: plan.goals,
      status: plan.status,
      createdDate: plan.createdAt.toISOString(),
      progress: plan.progress || 0
    }))

    // Calculate academic stats
    const totalTests = tests.length
    const upcomingTests = tests.filter((test: any) => test.status === 'SCHEDULED').length
    const completedTests = tests.filter((test: any) => test.status === 'COMPLETED').length
    const activeTeachingPlans = teachingPlans.filter((plan: any) => plan.status === 'ACTIVE').length
    
    // Get unique subjects
    const allSubjects = new Set()
    tests.forEach((test: any) => allSubjects.add(test.subject))
    teachingPlans.forEach((plan: any) => {
      plan.subjects.forEach((subject: string) => allSubjects.add(subject))
    })
    const totalSubjects = allSubjects.size

    // Calculate average test score
    const allGrades = await prisma.grade.findMany()
    const averageTestScore = allGrades.length > 0 
      ? allGrades.reduce((sum: number, grade: any) => sum + grade.score, 0) / allGrades.length
      : 0

    const stats = {
      totalTests,
      upcomingTests,
      completedTests,
      activeTeachingPlans,
      totalSubjects,
      averageTestScore
    }

    return NextResponse.json({
      tests: transformedTests,
      teachingPlans: transformedPlans,
      stats
    })
  } catch (error) {
    console.error('Academic API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, data } = body

    if (type === 'test') {
      // Create new test
      const test = await prisma.test.create({
        data: {
          title: data.title,
          subject: data.subject,
          scheduledDate: new Date(data.scheduledDate),
          maxScore: data.maxScore,
          status: 'SCHEDULED',
          schoolYearId: data.schoolYearId
        }
      })

      return NextResponse.json({ test })
    } else if (type === 'teaching_plan') {
      // Create new teaching plan
      const teachingPlan = await prisma.teachingPlan.create({
        data: {
          studentId: data.studentId,
          subjects: data.subjects,
          goals: data.goals,
          status: 'ACTIVE',
          progress: 0,
          schoolYearId: data.schoolYearId
        }
      })

      return NextResponse.json({ teachingPlan })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Academic API POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, type, data } = body

    if (type === 'test') {
      // Update test
      const test = await prisma.test.update({
        where: { id },
        data: {
          title: data.title,
          subject: data.subject,
          scheduledDate: new Date(data.scheduledDate),
          maxScore: data.maxScore,
          status: data.status
        }
      })

      return NextResponse.json({ test })
    } else if (type === 'teaching_plan') {
      // Update teaching plan
      const teachingPlan = await prisma.teachingPlan.update({
        where: { id },
        data: {
          subjects: data.subjects,
          goals: data.goals,
          status: data.status,
          progress: data.progress
        }
      })

      return NextResponse.json({ teachingPlan })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Academic API PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')

    if (!id || !type) {
      return NextResponse.json({ error: 'Missing id or type' }, { status: 400 })
    }

    if (type === 'test') {
      // Delete test (and related grades)
      await prisma.grade.deleteMany({
        where: { testId: id }
      })
      
      await prisma.test.delete({
        where: { id }
      })
    } else if (type === 'teaching_plan') {
      // Delete teaching plan
      await prisma.teachingPlan.delete({
        where: { id }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Academic API DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
