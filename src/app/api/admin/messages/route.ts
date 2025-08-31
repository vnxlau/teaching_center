import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('📝 Session:', session?.user)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      console.log('❌ Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('👤 Fetching messages for user:', session.user.id, session.user.name)

    // Get messages where current user is sender or recipient
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

    console.log('📨 Raw messages found:', messages.length)

    // Get users for the messages to populate the relations
    const userIds = [...new Set([
      ...messages.map(m => m.senderId),
      ...messages.map(m => m.recipientId)
    ].filter((id): id is string => id !== null))]
    
    console.log('👥 User IDs to fetch:', userIds)
    
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
    
    console.log('👥 Users fetched:', users.length)
    
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

    console.log('📧 Messages with users prepared:', messagesWithUsers.length)
    
    // Separate for debugging
    const inboxMessages = messagesWithUsers.filter(m => m.recipientId === session.user.id)
    const sentMessages = messagesWithUsers.filter(m => m.senderId === session.user.id)
    
    console.log('📥 Inbox messages:', inboxMessages.length)
    console.log('📤 Sent messages:', sentMessages.length)

    // Group messages by conversation (for now, just return all messages)
    const conversations: any[] = []

    return NextResponse.json({
      messages: messagesWithUsers,
      conversations
    })
  } catch (error) {
    console.error('Messages API error:', error)
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
    const { toUserId, subject, content, priority } = body

    console.log('📤 Creating message:', { toUserId, subject, senderId: session.user.id })

    let recipientIds: string[] = []

    // Handle different recipient types
    if (toUserId === 'all-staff') {
      const staffUsers = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'STAFF'] } },
        select: { id: true }
      })
      recipientIds = staffUsers.map(u => u.id)
    } else if (toUserId === 'all-parents') {
      const parentUsers = await prisma.user.findMany({
        where: { role: 'PARENT' },
        select: { id: true }
      })
      recipientIds = parentUsers.map(u => u.id)
    } else if (toUserId === 'all-students') {
      const studentUsers = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { id: true }
      })
      recipientIds = studentUsers.map(u => u.id)
    } else {
      // Single recipient
      recipientIds = [toUserId]
    }

    console.log('📋 Recipients:', recipientIds)

    // Create messages for all recipients
    const messages = await Promise.all(
      recipientIds.map(recipientId =>
        prisma.message.create({
          data: {
            senderId: session.user.id,
            recipientId,
            senderType: session.user.role === 'ADMIN' || session.user.role === 'STAFF' ? 'STAFF' : 'SYSTEM',
            recipientType: 'STAFF', // Will be dynamic based on recipient role in future
            subject,
            content
          }
        })
      )
    )

    console.log('✅ Messages created:', messages.length)

    return NextResponse.json({ 
      success: true, 
      message: `Message sent successfully to ${messages.length} recipient(s)`,
      data: { count: messages.length, messageIds: messages.map(m => m.id) }
    })
  } catch (error) {
    console.error('Messages API POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
