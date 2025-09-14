import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    const notes = await (prisma as any).studentNote.findMany({
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

    // Debug: Log session user info
    console.log('Session user:', {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      name: session.user.name
    })

    // Find user by email instead of ID to be more robust
    const userExists = await (prisma as any).user.findUnique({
      where: { email: session.user.email }
    })

    if (!userExists) {
      console.error('User not found in database by email:', session.user.email)
      return NextResponse.json({ error: 'User not found' }, { status: 400 })
    }

    console.log('Found user in database:', { id: userExists.id, email: userExists.email })

    // Create the note
    const note = await (prisma as any).note.create({
      data: {
        content,
        status: status || 'INFO',
        createdBy: userExists.id // Use the actual user ID from database
      }
    })

    // Link note to students
    const studentNotes = studentIds.map((studentId: string) => ({
      studentId,
      noteId: note.id
    }))

    await (prisma as any).studentNote.createMany({
      data: studentNotes
    })

    // Return the created note with student information
    const createdNote = await (prisma as any).note.findUnique({
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
