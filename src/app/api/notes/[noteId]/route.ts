import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT /api/notes/[noteId] - Update a note
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { noteId } = await params
    const body = await request.json()
    const { content, status, studentIds } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Update the note
    const updatedNote = await (prisma as any).note.update({
      where: { id: noteId },
      data: {
        content,
        status: status || undefined,
        isEdited: true,
        editedAt: new Date()
      }
    })

    // If studentIds are provided, update the student links
    if (studentIds && Array.isArray(studentIds)) {
      // Remove existing student links
      await (prisma as any).studentNote.deleteMany({
        where: { noteId: noteId }
      })

      // Add new student links
      if (studentIds.length > 0) {
        const studentNotes = studentIds.map((studentId: string) => ({
          studentId,
          noteId: noteId
        }))

        await (prisma as any).studentNote.createMany({
          data: studentNotes
        })
      }
    }

    // Return the updated note with student information
    const noteWithStudents = await (prisma as any).note.findUnique({
      where: { id: noteId },
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

    return NextResponse.json({ note: noteWithStudents })
  } catch (error) {
    console.error('Error updating note:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/notes/[noteId] - Delete a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { noteId } = await params

    // Delete the note (cascade will handle student_note relationships)
    await (prisma as any).note.delete({
      where: { id: noteId }
    })

    return NextResponse.json({ message: 'Note deleted successfully' })
  } catch (error) {
    console.error('Error deleting note:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
