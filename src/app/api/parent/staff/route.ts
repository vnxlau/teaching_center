import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all staff members (admin and staff)
    const staff = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'STAFF']
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
      staff
    })
  } catch (error) {
    console.error('Parent Staff API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
