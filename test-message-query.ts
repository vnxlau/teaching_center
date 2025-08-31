import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:password123@localhost:5433/teachingcenter"
    }
  }
})

async function testMessageQuery() {
  try {
    console.log('🔍 Testing message query...')
    
    // Get the admin user for testing
    const adminUser = await prisma.user.findFirst({
      where: {
        email: 'admin@teachingcenter.com'
      }
    })
    
    if (!adminUser) {
      console.log('❌ Admin user not found')
      return
    }
    
    console.log('👤 Testing with user:', adminUser.name, adminUser.id)
    
    // Test the same query as the API
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
    
    console.log('📨 Messages found:', messages.length)
    
    for (const message of messages) {
      console.log(`Message: ${message.subject}`)
      console.log(`  From: ${message.senderId}`)
      console.log(`  To: ${message.recipientId}`)
      console.log(`  Sent by admin: ${message.senderId === adminUser.id}`)
      console.log(`  Received by admin: ${message.recipientId === adminUser.id}`)
    }
    
    // Get users for the messages
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
    
    console.log('👥 Users:', users)
    
    // Map users by ID
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
    
    console.log('📧 Messages with users:')
    for (const message of messagesWithUsers) {
      console.log(`Message: ${message.subject}`)
      console.log(`  From: ${message.fromUser?.name} (${message.fromUser?.id})`)
      console.log(`  To: ${message.toUser?.name} (${message.toUser?.id})`)
      console.log(`  Should show in sent (admin sent): ${message.senderId === adminUser.id}`)
      console.log(`  Should show in inbox (admin received): ${message.recipientId === adminUser.id}`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testMessageQuery()
