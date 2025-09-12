import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:password123@localhost:5433/teachingcenter"
    }
  }
})

async function createTestMessages() {
  try {
    console.log('📋 Getting users...')
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })
    
    console.log('Users found:', users)
    
    if (users.length >= 2) {
      // Create a test message from first user to second user
      const sender = users[0]
      const recipient = users[1]
      
      console.log(`💌 Creating message from ${sender.name} to ${recipient.name}`)
      
      const message = await prisma.message.create({
        data: {
          senderId: sender.id,
          recipientId: recipient.id,
          senderType: 'STAFF',
          recipientType: 'STAFF',
          subject: 'Test Message',
          content: 'This is a test message to verify the messaging system works correctly.',
          isRead: false
        }
      })
      
      console.log('✅ Message created:', message)
      
      // Create another message in the opposite direction
      const message2 = await prisma.message.create({
        data: {
          senderId: recipient.id,
          recipientId: sender.id,
          senderType: 'STAFF',
          recipientType: 'STAFF',
          subject: 'Reply Test Message',
          content: 'This is a reply to the test message.',
          isRead: false
        }
      })
      
      console.log('✅ Reply message created:', message2)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestMessages()
