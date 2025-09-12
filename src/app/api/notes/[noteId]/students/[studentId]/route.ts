import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/notes/[noteId]/students/[studentId] - Remove student from note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string; studentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { noteId, studentId } = await params

    // Remove the student from the note
    await prisma.studentNote.deleteMany({
      where: {
        noteId: noteId,
        studentId: studentId
      }
    })

    return NextResponse.json({ message: 'Student removed from note successfully' })
  } catch (error) {
    console.error('Error removing student from note:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
