import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all users except the current user
    const users = await prisma.user.findMany({
      where: {
        id: {
          not: session.user.id
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      users
    })
  } catch (error) {
    console.error('Users API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
