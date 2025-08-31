import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get messages where current student is sender or recipient
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.user.id },
          { recipientId: session.user.id }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get users for the messages to populate the relations
    const userIds = [...new Set([
      ...messages.map(m => m.senderId),
      ...messages.map(m => m.recipientId)
    ].filter((id): id is string => id !== null))]
    
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })
    
    // Map users by ID for quick lookup
    const userMap = users.reduce((acc, user) => {
      acc[user.id] = user
      return acc
    }, {} as Record<string, any>)
    
    // Add user information to messages
    const messagesWithUsers = messages.map(message => ({
      ...message,
      fromUser: userMap[message.senderId || ''],
      toUser: userMap[message.recipientId || '']
    }))

    return NextResponse.json({
      messages: messagesWithUsers
    })
  } catch (error) {
    console.error('Student Messages API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { toUserId, subject, content, priority } = body

    let recipientIds: string[] = []

    // Handle different recipient types (only staff for students)
    if (toUserId === 'all-staff') {
      const staffUsers = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'STAFF'] } },
        select: { id: true }
      })
      recipientIds = staffUsers.map(u => u.id)
    } else {
      // Verify the recipient is staff
      const recipient = await prisma.user.findUnique({
        where: { id: toUserId },
        select: { role: true }
      })
      
      if (!recipient || !['ADMIN', 'STAFF'].includes(recipient.role)) {
        return NextResponse.json({ error: 'Can only send messages to staff members' }, { status: 400 })
      }
      
      recipientIds = [toUserId]
    }

    // Create messages for all recipients
    const messages = await Promise.all(
      recipientIds.map(recipientId =>
        prisma.message.create({
          data: {
            senderId: session.user.id,
            recipientId,
            senderType: 'PARENT', // Students treated as parents in messaging system
            recipientType: 'STAFF',
            subject,
            content
          }
        })
      )
    )

    return NextResponse.json({ 
      success: true, 
      message: `Message sent successfully to ${messages.length} recipient(s)`,
      data: { count: messages.length, messageIds: messages.map(m => m.id) }
    })
  } catch (error) {
    console.error('Student Messages API POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
