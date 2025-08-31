import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get the admin user for testing
    const adminUser = await prisma.user.findFirst({
      where: {
        email: 'admin@teachingcenter.com'
      }
    })
    
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
    }

    // Get messages where admin user is sender or recipient
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: adminUser.id },
          { recipientId: adminUser.id }
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

    // Separate messages into inbox and sent
    const inboxMessages = messagesWithUsers.filter(m => m.recipientId === adminUser.id)
    const sentMessages = messagesWithUsers.filter(m => m.senderId === adminUser.id)

    return NextResponse.json({
      adminUser: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email
      },
      totalMessages: messages.length,
      inboxCount: inboxMessages.length,
      sentCount: sentMessages.length,
      messages: messagesWithUsers,
      inboxMessages,
      sentMessages
    })
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
