import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
// import { NoteStatus } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const studentId = id

    // Fetch notes for this student
    const notes = await (prisma as any).note.findMany({
      where: {
        students: {
          some: {
            studentId: studentId
          }
        }
      },
      include: {
        students: {
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
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Transform the data to match the expected format
    const transformedNotes = notes.map((note: any) => ({
      id: note.id,
      content: note.content,
      status: note.status,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      createdBy: {
        id: note.createdBy,
        name: 'Admin' // We'll need to fetch user name separately if needed
      },
      students: note.students.map((sn: any) => sn.student)
    }))

    return NextResponse.json({ notes: transformedNotes })
  } catch (error) {
    console.error('Failed to fetch student notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}
