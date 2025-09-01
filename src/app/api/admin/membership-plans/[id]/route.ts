import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/admin/membership-plans/[id] - Get a specific membership plan
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const plan = await prisma.membershipPlan.findUnique({
      where: { id },
      include: {
        students: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            students: true
          }
        }
      }
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Membership plan not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      plan
    })
  } catch (error) {
    console.error('Error fetching membership plan:', error)
    return NextResponse.json(
      { error: 'Failed to fetch membership plan' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/membership-plans/[id] - Update a membership plan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, daysPerWeek, monthlyPrice } = body

    // Validate required fields
    if (!name || !daysPerWeek || monthlyPrice === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, daysPerWeek, monthlyPrice' },
        { status: 400 }
      )
    }

    // Validate daysPerWeek range
    if (daysPerWeek < 1 || daysPerWeek > 7) {
      return NextResponse.json(
        { error: 'Days per week must be between 1 and 7' },
        { status: 400 }
      )
    }

    // Validate monthlyPrice
    if (monthlyPrice < 0) {
      return NextResponse.json(
        { error: 'Monthly price must be non-negative' },
        { status: 400 }
      )
    }

    // Check if plan exists
    const existingPlan = await prisma.membershipPlan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            students: true
          }
        }
      }
    })

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Membership plan not found' },
        { status: 404 }
      )
    }

    // Update the membership plan
    const updatedPlan = await prisma.membershipPlan.update({
      where: { id },
      data: {
        name,
        daysPerWeek,
        monthlyPrice,
        updatedAt: new Date()
      },
      include: {
        _count: {
          select: {
            students: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Membership plan updated successfully',
      plan: updatedPlan
    })
  } catch (error) {
    console.error('Error updating membership plan:', error)
    return NextResponse.json(
      { error: 'Failed to update membership plan' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/membership-plans/[id] - Delete a membership plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if plan exists and has students
    const existingPlan = await prisma.membershipPlan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            students: true
          }
        }
      }
    })

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Membership plan not found' },
        { status: 404 }
      )
    }

    // Prevent deletion if students are enrolled
    if (existingPlan._count.students > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete plan with ${existingPlan._count.students} enrolled student${existingPlan._count.students !== 1 ? 's' : ''}. Please transfer students to another plan first.`,
          studentsCount: existingPlan._count.students
        },
        { status: 400 }
      )
    }

    // Delete the membership plan
    await prisma.membershipPlan.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Membership plan deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting membership plan:', error)
    return NextResponse.json(
      { error: 'Failed to delete membership plan' },
      { status: 500 }
    )
  }
}
