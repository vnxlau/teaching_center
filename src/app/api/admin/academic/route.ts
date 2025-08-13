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

    // Fetch tests with related data
    const tests = await prisma.test.findMany({
      include: {
        staff: {
          include: {
            user: true
          }
        },
        schoolYear: true,
        results: {
          include: {
            student: {
              include: {
                user: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Fetch teaching plans with related data
    const teachingPlans = await prisma.teachingPlan.findMany({
      include: {
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

    // Transform tests for frontend
    const transformedTests = tests.map((test: any) => ({
      id: test.id,
      title: test.title,
      subject: test.subject,
      description: test.description,
      scheduledDate: test.scheduledDate.toISOString(),
      maxScore: test.maxScore,
      isActive: test.isActive,
      staffName: test.staff?.user?.name || 'Unknown Staff',
      resultCount: test.results?.length || 0,
      averageScore: test.results?.length > 0 
        ? test.results.reduce((sum: number, result: any) => sum + Number(result.score), 0) / test.results.length
        : 0
    }))

    // Transform teaching plans for frontend
    const transformedPlans = teachingPlans.map((plan: any) => ({
      id: plan.id,
      studentName: plan.student?.user?.name || 'Unknown Student',
      studentCode: plan.student?.studentCode || '',
      subjects: plan.subjects,
      goals: plan.goals,
      methodology: plan.methodology,
      schedule: plan.schedule,
      createdDate: plan.createdAt.toISOString(),
      notes: plan.notes
    }))

    // Calculate academic stats
    const totalTests = tests.length
    const upcomingTests = tests.filter((test: any) => test.isActive).length
    const completedTests = tests.filter((test: any) => !test.isActive).length
    const activeTeachingPlans = teachingPlans.length
    
    // Get unique subjects
    const allSubjects = new Set()
    tests.forEach((test: any) => allSubjects.add(test.subject))
    teachingPlans.forEach((plan: any) => {
      if (Array.isArray(plan.subjects)) {
        plan.subjects.forEach((subject: string) => allSubjects.add(subject))
      }
    })
    const totalSubjects = allSubjects.size

    // Calculate average test score
    const allTestResults = await prisma.testResult.findMany()
    const averageTestScore = allTestResults.length > 0 
      ? allTestResults.reduce((sum: number, result: any) => sum + Number(result.score), 0) / allTestResults.length
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
          description: data.description || '',
          scheduledDate: new Date(data.scheduledDate),
          maxScore: data.maxScore,
          schoolYearId: data.schoolYearId,
          staffId: data.staffId || session.user.id
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
          methodology: data.methodology,
          schedule: data.schedule,
          notes: data.notes
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
          description: data.description,
          scheduledDate: new Date(data.scheduledDate),
          maxScore: data.maxScore,
          isActive: data.isActive
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
          methodology: data.methodology,
          schedule: data.schedule,
          notes: data.notes
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
      // Delete test (cascade will handle test results automatically)
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
