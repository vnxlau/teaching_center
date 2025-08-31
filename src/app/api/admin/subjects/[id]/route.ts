import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'STAFF'].includes(session.user?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const subject = await (prisma as any).subject.findUnique({
      where: { id: resolvedParams.id },
      include: {
        tests: {
          select: {
            id: true,
            title: true,
            scheduledDate: true,
            isActive: true
          }
        },
        teachingPlans: {
          include: {
            teachingPlan: {
              include: {
                student: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    studentCode: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    return NextResponse.json(subject)

  } catch (error) {
    console.error('Subject GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const body = await request.json()
    const { name, description, code, isActive } = body

    // Check if another subject with same name or code exists
    if (name || code) {
      const existingSubject = await (prisma as any).subject.findFirst({
        where: {
          AND: [
            { id: { not: resolvedParams.id } },
            {
              OR: [
                ...(name ? [{ name }] : []),
                ...(code ? [{ code }] : [])
              ]
            }
          ]
        }
      })

      if (existingSubject) {
        return NextResponse.json(
          { error: 'Subject with this name or code already exists' },
          { status: 409 }
        )
      }
    }

    const subject = await (prisma as any).subject.update({
      where: { id: resolvedParams.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(code !== undefined && { code: code || null }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json(subject)

  } catch (error) {
    console.error('Subject PATCH API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    // Check if subject is being used
    const subjectUsage = await (prisma as any).subject.findUnique({
      where: { id: resolvedParams.id },
      include: {
        tests: { select: { id: true } },
        teachingPlans: { select: { id: true } }
      }
    })

    if (!subjectUsage) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    if (subjectUsage.tests.length > 0 || subjectUsage.teachingPlans.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete subject that is being used in tests or teaching plans' },
        { status: 409 }
      )
    }

    await (prisma as any).subject.delete({
      where: { id: resolvedParams.id }
    })

    return NextResponse.json({ message: 'Subject deleted successfully' })

  } catch (error) {
    console.error('Subject DELETE API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
