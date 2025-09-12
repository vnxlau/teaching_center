import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  try {
    console.log('Testing Prisma connection...')
    console.log('Prisma object:', prisma)
    console.log('Prisma.user:', prisma.user)
    
    const result = await prisma.user.findMany()
    console.log('Users found:', result)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

test()
