import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * AUTO-GENERATE MONTHLY PAYMENTS
 * 
 * This endpoint automatically creates monthly payment records for all active students
 * based on their membership plans and enrollment status.
 * 
 * Rules:
 * - Only creates payments for active students with valid membership plans
 * - Payment due date is set to the 8th of the target month
 * - Checks for existing payments to avoid duplicates
 * - Uses student's monthlyDueAmount (includes discounts) or membership plan price
 * - Only creates payments for current and future months
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { targetMonth, targetYear, schoolYearId } = body

    // Validate required parameters
    if (!targetMonth || !targetYear || !schoolYearId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: targetMonth, targetYear, schoolYearId' 
      }, { status: 400 })
    }

    // Validate month (1-12) and year
    if (targetMonth < 1 || targetMonth > 12 || targetYear < 2020 || targetYear > 2030) {
      return NextResponse.json({ 
        error: 'Invalid month or year parameters' 
      }, { status: 400 })
    }

    // Create due date (8th of the target month)
    const dueDate = new Date(targetYear, targetMonth - 1, 8) // Month is 0-indexed in Date constructor

    // Prevent creating payments for past months (except current month)
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()
    
    if (targetYear < currentYear || (targetYear === currentYear && targetMonth < currentMonth)) {
      return NextResponse.json({ 
        error: 'Cannot create payments for past months' 
      }, { status: 400 })
    }

    // Get all active students with their membership plans using raw SQL
    const activeStudentsRaw = await prisma.$queryRaw`
      SELECT 
        s.id,
        s."firstName",
        s."lastName", 
        s."monthlyDueAmount",
        s."membershipPlanId",
        u.name as "userName",
        u.email,
        mp."monthlyPrice" as "membershipPlanPrice"
      FROM students s
      JOIN users u ON s."userId" = u.id
      LEFT JOIN membership_plans mp ON s."membershipPlanId" = mp.id
      WHERE s."isActive" = true 
        AND s."schoolYearId" = ${schoolYearId}
        AND s."membershipPlanId" IS NOT NULL
      ORDER BY s."firstName", s."lastName"
    ` as any[]

    if (activeStudentsRaw.length === 0) {
      return NextResponse.json({ 
        message: 'No active students found with membership plans',
        created: 0,
        skipped: 0
      })
    }

    let createdCount = 0
    let skippedCount = 0
    const results = []

    // Process each student
    for (const student of activeStudentsRaw) {
      try {
        // Check if payment already exists for this month using raw SQL
        const existingPaymentRaw = await prisma.$queryRaw`
          SELECT id FROM payments 
          WHERE "studentId" = ${student.id}
            AND "schoolYearId" = ${schoolYearId}
            AND "paymentType" = 'MONTHLY_FEE'
            AND EXTRACT(YEAR FROM "dueDate") = ${targetYear}
            AND EXTRACT(MONTH FROM "dueDate") = ${targetMonth}
          LIMIT 1
        ` as any[]

        if (existingPaymentRaw.length > 0) {
          skippedCount++
          results.push({
            studentId: student.id,
            studentName: student.userName,
            status: 'skipped',
            reason: 'Payment already exists for this month'
          })
          continue
        }

        // Calculate payment amount (use student's custom amount or membership plan price)
        const paymentAmount = student.monthlyDueAmount || student.membershipPlanPrice

        if (!paymentAmount || Number(paymentAmount) <= 0) {
          skippedCount++
          results.push({
            studentId: student.id,
            studentName: student.userName,
            status: 'skipped',
            reason: 'No valid payment amount found'
          })
          continue
        }

        // Create the payment record using Prisma
        const payment = await prisma.payment.create({
          data: {
            studentId: student.id,
            schoolYearId: schoolYearId,
            amount: Number(paymentAmount),
            dueDate: dueDate,
            status: 'PENDING',
            paymentType: 'MONTHLY_FEE',
            notes: `Auto-generated monthly payment for ${new Date(targetYear, targetMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
          }
        })

        createdCount++
        results.push({
          studentId: student.id,
          studentName: student.userName,
          paymentId: payment.id,
          amount: Number(paymentAmount),
          dueDate: dueDate.toISOString(),
          status: 'created'
        })

      } catch (error) {
        console.error(`Error creating payment for student ${student.id}:`, error)
        skippedCount++
        results.push({
          studentId: student.id,
          studentName: student.userName,
          status: 'error',
          reason: 'Database error during payment creation'
        })
      }
    }

    // Log the operation
    console.log(`Auto-generated payments: ${createdCount} created, ${skippedCount} skipped for ${targetMonth}/${targetYear}`)

    return NextResponse.json({
      success: true,
      message: `Payment generation completed for ${new Date(targetYear, targetMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      summary: {
        totalStudents: activeStudentsRaw.length,
        created: createdCount,
        skipped: skippedCount
      },
      results: results
    })

  } catch (error) {
    console.error('Error in auto-generate payments:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET MONTHLY PAYMENT GENERATION STATUS
 * 
 * Returns information about payment generation status for a specific month
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const targetMonth = parseInt(searchParams.get('month') || '')
    const targetYear = parseInt(searchParams.get('year') || '')
    const schoolYearId = searchParams.get('schoolYearId')

    if (!targetMonth || !targetYear || !schoolYearId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: month, year, schoolYearId' 
      }, { status: 400 })
    }

    // Get active students count using raw SQL
    const activeStudentsCountRaw = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM students s
      WHERE s."isActive" = true 
        AND s."schoolYearId" = ${schoolYearId}
        AND s."membershipPlanId" IS NOT NULL
    ` as any[]

    const activeStudentsCount = parseInt(activeStudentsCountRaw[0]?.count || '0')

    // Get existing payments for the month using raw SQL
    const existingPaymentsCountRaw = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM payments 
      WHERE "schoolYearId" = ${schoolYearId}
        AND "paymentType" = 'MONTHLY_FEE'
        AND EXTRACT(YEAR FROM "dueDate") = ${targetYear}
        AND EXTRACT(MONTH FROM "dueDate") = ${targetMonth}
    ` as any[]

    const existingPaymentsCount = parseInt(existingPaymentsCountRaw[0]?.count || '0')

    // Get payment details using raw SQL
    const existingPaymentsRaw = await prisma.$queryRaw`
      SELECT 
        p.id,
        p.amount,
        p.status,
        p."dueDate",
        p."createdAt",
        u.name as "studentName"
      FROM payments p
      JOIN students s ON p."studentId" = s.id
      JOIN users u ON s."userId" = u.id
      WHERE p."schoolYearId" = ${schoolYearId}
        AND p."paymentType" = 'MONTHLY_FEE'
        AND EXTRACT(YEAR FROM p."dueDate") = ${targetYear}
        AND EXTRACT(MONTH FROM p."dueDate") = ${targetMonth}
      ORDER BY p."createdAt" DESC
    ` as any[]

    return NextResponse.json({
      month: targetMonth,
      year: targetYear,
      monthName: new Date(targetYear, targetMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      activeStudentsCount,
      existingPaymentsCount,
      pendingGeneration: activeStudentsCount - existingPaymentsCount,
      isComplete: existingPaymentsCount >= activeStudentsCount,
      payments: existingPaymentsRaw.map(payment => ({
        id: payment.id,
        studentName: payment.studentName,
        amount: Number(payment.amount),
        status: payment.status,
        dueDate: payment.dueDate,
        createdAt: payment.createdAt
      }))
    })

  } catch (error) {
    console.error('Error getting payment generation status:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
