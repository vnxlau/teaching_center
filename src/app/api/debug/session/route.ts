import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('🔍 Debug session endpoint called')
    
    const session = await getServerSession(authOptions)
    
    console.log('Session data:', session)
    
    if (!session) {
      return NextResponse.json({ 
        error: 'No session found',
        session: null
      })
    }

    // Get all users to see what's available
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })
    
    // Check if session user exists in database
    const sessionUser = await prisma.user.findUnique({
      where: {
        id: session.user.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    return NextResponse.json({
      session,
      sessionUserExists: !!sessionUser,
      sessionUser,
      allUsers: users,
      databaseUrl: process.env.DATABASE_URL
    })
  } catch (error) {
    console.error('Debug session error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
