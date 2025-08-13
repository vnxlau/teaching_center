import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch parents with their children information
    const parents = await prisma.parent.findMany({
      include: {
        user: true,
        children: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        user: {
          name: 'asc'
        }
      }
    })

    // Transform parents data
    const transformedParents = parents.map((parent: any) => ({
      id: parent.id,
      name: parent.user.name,
      email: parent.user.email,
      phone: parent.phone || 'Not provided',
      children: parent.children.map((child: any) => ({
        id: child.id,
        name: child.user.name,
        studentCode: child.studentCode,
        class: child.class || 'Not assigned',
        status: child.status
      })),
      totalChildren: parent.children.length,
      contactPreference: parent.contactPreference || 'EMAIL',
      lastContact: parent.lastContact,
      emergencyContact: parent.emergencyContact || false
    }))

    // Calculate parent stats
    const totalParents = parents.length
    const activeParents = parents.filter((parent: any) => 
      parent.children.some((child: any) => child.status === 'ACTIVE')
    ).length
    const totalChildren = parents.reduce((sum: number, parent: any) => sum + parent.children.length, 0)
    const emergencyContacts = parents.filter((parent: any) => parent.emergencyContact).length

    // Get recent messages count (mock data for now)
    const recentMessages = 0
    const pendingContacts = 0

    const stats = {
      totalParents,
      activeParents,
      totalChildren,
      emergencyContacts,
      pendingContacts,
      recentMessages
    }

    return NextResponse.json({
      parents: transformedParents,
      stats
    })
  } catch (error) {
    console.error('Parent API error:', error)
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
    const { name, email, password, phone, contactPreference, emergencyContact } = body

    // Create user first
    const bcrypt = await import('bcryptjs')
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'PARENT'
      }
    })

    // Create parent record
    const parent = await prisma.parent.create({
      data: {
        userId: user.id,
        phone,
        contactPreference: contactPreference || 'EMAIL',
        emergencyContact: emergencyContact || false
      }
    })

    return NextResponse.json({ 
      parent: {
        id: parent.id,
        name: user.name,
        email: user.email,
        phone: parent.phone
      }
    })
  } catch (error) {
    console.error('Parent API POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, email, phone, contactPreference, emergencyContact } = body

    // Get parent with user info
    const parent = await prisma.parent.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 })
    }

    // Update user information
    await prisma.user.update({
      where: { id: parent.userId },
      data: {
        name,
        email
      }
    })

    // Update parent information
    const updatedParent = await prisma.parent.update({
      where: { id },
      data: {
        phone,
        contactPreference,
        emergencyContact,
        lastContact: new Date()
      }
    })

    return NextResponse.json({ parent: updatedParent })
  } catch (error) {
    console.error('Parent API PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing parent ID' }, { status: 400 })
    }

    // Get parent with user info
    const parent = await prisma.parent.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 })
    }

    // Delete parent record (this will cascade to user due to foreign key)
    await prisma.parent.delete({
      where: { id }
    })

    // Delete user record
    await prisma.user.delete({
      where: { id: parent.userId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Parent API DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
