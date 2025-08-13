import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const messageId = id

    // Update message as read
    const message = await prisma.message.update({
      where: {
        id: messageId,
        recipientId: session.user.id // Only allow marking own messages as read
      },
      data: {
        isRead: true
      }
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Mark as read API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
