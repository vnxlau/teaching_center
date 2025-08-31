import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testAuth() {
  console.log('🧪 Testing authentication setup...')
  
  try {
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Check if demo users exist
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@teachingcenter.com' }
    })
    
    const parentUser = await prisma.user.findUnique({
      where: { email: 'parent1@example.com' }
    })
    
    const studentUser = await prisma.user.findUnique({
      where: { email: 'student1@example.com' }
    })
    
    if (adminUser) {
      console.log('✅ Admin user exists:', adminUser.email)
      // Test password
      const isValidPassword = await bcrypt.compare('demo123', adminUser.password)
      console.log('✅ Admin password verification:', isValidPassword ? 'VALID' : 'INVALID')
    } else {
      console.log('❌ Admin user not found')
    }
    
    if (parentUser) {
      console.log('✅ Parent user exists:', parentUser.email)
      const isValidPassword = await bcrypt.compare('demo123', parentUser.password)
      console.log('✅ Parent password verification:', isValidPassword ? 'VALID' : 'INVALID')
    } else {
      console.log('❌ Parent user not found')
    }
    
    if (studentUser) {
      console.log('✅ Student user exists:', studentUser.email)
      const isValidPassword = await bcrypt.compare('demo123', studentUser.password)
      console.log('✅ Student password verification:', isValidPassword ? 'VALID' : 'INVALID')
    } else {
      console.log('❌ Student user not found')
    }
    
    // Count total users
    const userCount = await prisma.user.count()
    console.log(`📊 Total users in database: ${userCount}`)
    
  } catch (error) {
    console.error('❌ Database connection failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAuth().catch(console.error)
