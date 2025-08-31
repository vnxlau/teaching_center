import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'STAFF'].includes(session.user?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if subjects table exists and use any type for now
    const subjects = await (prisma as any).subject.findMany({
      orderBy: [
        { isActive: 'desc' },
        { name: 'asc' }
      ]
    })

    const stats = {
      total: subjects.length,
      active: subjects.filter((s: any) => s.isActive).length,
      inactive: subjects.filter((s: any) => !s.isActive).length
    }

    return NextResponse.json({
      subjects,
      stats
    })

  } catch (error) {
    console.error('Subjects API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, code } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Subject name is required' },
        { status: 400 }
      )
    }

    // Check if subject with same name or code already exists
    const existingSubject = await (prisma as any).subject.findFirst({
      where: {
        OR: [
          { name: name },
          ...(code ? [{ code: code }] : [])
        ]
      }
    })

    if (existingSubject) {
      return NextResponse.json(
        { error: 'Subject with this name or code already exists' },
        { status: 409 }
      )
    }

    const subject = await (prisma as any).subject.create({
      data: {
        name,
        description,
        code: code || null,
        isActive: true
      }
    })

    return NextResponse.json(subject, { status: 201 })

  } catch (error) {
    console.error('Subjects POST API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
