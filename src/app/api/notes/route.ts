import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NoteStatus } from '@prisma/client'

// GET /api/notes - Get all notes for a student
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    // Check if user has permission to view notes for this student
    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const notes = await prisma.studentNote.findMany({
      where: {
        studentId: studentId
      },
      include: {
        note: {
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
          }
        }
      },
      orderBy: {
        note: {
          createdAt: 'desc'
        }
      }
    })

    return NextResponse.json({ notes })
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/notes - Create a new note
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { content, status, studentIds } = body

    if (!content || !studentIds || studentIds.length === 0) {
      return NextResponse.json({ error: 'Content and at least one student are required' }, { status: 400 })
    }

    // Create the note
    const note = await prisma.note.create({
      data: {
        content,
        status: status || NoteStatus.INFO,
        createdBy: session.user.id
      }
    })

    // Link note to students
    const studentNotes = studentIds.map((studentId: string) => ({
      studentId,
      noteId: note.id
    }))

    await prisma.studentNote.createMany({
      data: studentNotes
    })

    // Return the created note with student information
    const createdNote = await prisma.note.findUnique({
      where: { id: note.id },
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
      }
    })

    return NextResponse.json({ note: createdNote })
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
