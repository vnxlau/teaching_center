import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * Generate automatic payments for a student from current month onwards
 */
async function generateAutomaticPayments(
  studentId: string, 
  schoolYearId: string, 
  monthlyAmount: number
) {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  
  const paymentsCreated = []
  const monthsGenerated = []
  
  // Generate payments from current month to end of school year (July)
  let month = currentMonth
  let year = currentYear
  
  while (year <= currentYear + 1 && !(year === currentYear + 1 && month > 7)) {
    try {
      // Check if payment already exists for this month
      const existingPayment = await prisma.$queryRaw`
        SELECT id FROM payments 
        WHERE "studentId" = ${studentId}
          AND "schoolYearId" = ${schoolYearId}
          AND "paymentType" = 'MONTHLY_FEE'
          AND EXTRACT(YEAR FROM "dueDate") = ${year}
          AND EXTRACT(MONTH FROM "dueDate") = ${month}
        LIMIT 1
      ` as any[]
      
      if (existingPayment.length === 0) {
        // Create due date (8th of the month)
        const dueDate = new Date(year, month - 1, 8)
        
        // Create payment record
        await prisma.payment.create({
          data: {
            studentId: studentId,
            schoolYearId: schoolYearId,
            amount: monthlyAmount,
            dueDate: dueDate,
            status: 'PENDING',
            paymentType: 'MONTHLY_FEE',
            notes: `Auto-generated payment for new student enrollment - ${new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
          }
        })
        
        paymentsCreated.push({
          month,
          year,
          amount: monthlyAmount,
          dueDate: dueDate.toISOString()
        })
        
        monthsGenerated.push(`${month}/${year}`)
      }
      
      // Move to next month
      month++
      if (month > 12) {
        month = 1
        year++
      }
      
    } catch (error) {
      console.error(`Failed to create payment for ${month}/${year}:`, error)
      break
    }
  }
  
  return {
    created: paymentsCreated.length,
    payments: paymentsCreated,
    months: monthsGenerated
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    // Validate required fields
    const {
      // Student data
      firstName,
      lastName,
      email,
      dateOfBirth,
      phone,
      address,
      emergencyContact,
      grade,
      notes,
      
      // Membership and payment data
      membershipPlanId,
      discountRate,
      monthlyDueAmount,
      generatePayments,
      
      // Parent 1 data (mandatory)
      parent1FirstName,
      parent1LastName,
      parent1Email,
      parent1Phone,
      parent1Relationship,
      
      // Parent 2 data (optional)
      parent2FirstName,
      parent2LastName,
      parent2Email,
      parent2Phone,
      parent2Relationship
    } = data

    if (!firstName || !lastName || !email || !dateOfBirth || 
        !parent1FirstName || !parent1LastName || !parent1Relationship ||
        !membershipPlanId) {
      return NextResponse.json({ 
        error: 'Missing required fields (including membership plan)' 
      }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Email already exists' 
      }, { status: 400 })
    }

    // Get active school year
    const activeSchoolYear = await prisma.schoolYear.findFirst({
      where: { isActive: true }
    })

    if (!activeSchoolYear) {
      return NextResponse.json({ 
        error: 'No active school year found' 
      }, { status: 400 })
    }

    // Generate student code
    const studentCount = await prisma.student.count()
    const studentCode = `ST${String(studentCount + 1).padStart(4, '0')}`

    // Generate default password
    const defaultPassword = 'demo123'
    const hashedPassword = await bcrypt.hash(defaultPassword, 12)

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create student user account
      const studentUser = await tx.user.create({
        data: {
          email,
          name: `${firstName} ${lastName}`,
          password: hashedPassword,
          role: 'STUDENT'
        }
      })

      // Create student record with membership information using raw SQL
      const studentResult = await tx.$queryRaw`
        INSERT INTO students (
          id, "userId", "studentCode", "firstName", "lastName", "dateOfBirth",
          grade, phone, address, "emergencyContact", notes, "schoolYearId",
          "membershipPlanId", "discountRate", "monthlyDueAmount", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), ${studentUser.id}, ${studentCode}, ${firstName}, ${lastName}, ${new Date(dateOfBirth)},
          ${grade}, ${phone}, ${address}, ${emergencyContact}, ${notes}, ${activeSchoolYear.id},
          ${membershipPlanId}, ${discountRate || 0}, ${monthlyDueAmount}, NOW(), NOW()
        ) RETURNING *
      ` as any[]
      
      const student = studentResult[0]

      // Create parent 1
      let parent1User = null
      let parent1 = null
      
      if (parent1Email) {
        // Check if parent email already exists
        parent1User = await tx.user.findUnique({
          where: { email: parent1Email }
        })
        
        if (parent1User && parent1User.role === 'PARENT') {
          // Find existing parent record
          parent1 = await tx.parent.findUnique({
            where: { userId: parent1User.id }
          })
        } else if (!parent1User) {
          // Create new parent user account
          parent1User = await tx.user.create({
            data: {
              email: parent1Email,
              name: `${parent1FirstName} ${parent1LastName}`,
              password: hashedPassword,
              role: 'PARENT'
            }
          })
        }
      }

      if (!parent1 && parent1User) {
        // Create parent record if it doesn't exist
        parent1 = await tx.parent.create({
          data: {
            userId: parent1User.id,
            firstName: parent1FirstName,
            lastName: parent1LastName,
            phone: parent1Phone,
            email: parent1Email
          }
        })
      } else if (!parent1) {
        // Create parent without user account (email not provided)
        const tempUser = await tx.user.create({
          data: {
            email: `temp_${Date.now()}@teachingcenter.local`,
            name: `${parent1FirstName} ${parent1LastName}`,
            password: hashedPassword,
            role: 'PARENT'
          }
        })
        
        parent1 = await tx.parent.create({
          data: {
            userId: tempUser.id,
            firstName: parent1FirstName,
            lastName: parent1LastName,
            phone: parent1Phone,
            email: parent1Email
          }
        })
      }

      // Link student to parent 1
      await tx.studentParent.create({
        data: {
          studentId: student.id,
          parentId: parent1.id,
          relationship: parent1Relationship
        }
      })

      // Create parent 2 if provided
      if (parent2FirstName && parent2LastName) {
        let parent2User = null
        let parent2 = null
        
        if (parent2Email) {
          // Check if parent email already exists
          parent2User = await tx.user.findUnique({
            where: { email: parent2Email }
          })
          
          if (parent2User && parent2User.role === 'PARENT') {
            // Find existing parent record
            parent2 = await tx.parent.findUnique({
              where: { userId: parent2User.id }
            })
          } else if (!parent2User) {
            // Create new parent user account
            parent2User = await tx.user.create({
              data: {
                email: parent2Email,
                name: `${parent2FirstName} ${parent2LastName}`,
                password: hashedPassword,
                role: 'PARENT'
              }
            })
          }
        }

        if (!parent2 && parent2User) {
          // Create parent record if it doesn't exist
          parent2 = await tx.parent.create({
            data: {
              userId: parent2User.id,
              firstName: parent2FirstName,
              lastName: parent2LastName,
              phone: parent2Phone,
              email: parent2Email
            }
          })
        } else if (!parent2 && (parent2FirstName && parent2LastName)) {
          // Create parent without user account (email not provided)
          const tempUser = await tx.user.create({
            data: {
              email: `temp_${Date.now()}_2@teachingcenter.local`,
              name: `${parent2FirstName} ${parent2LastName}`,
              password: hashedPassword,
              role: 'PARENT'
            }
          })
          
          parent2 = await tx.parent.create({
            data: {
              userId: tempUser.id,
              firstName: parent2FirstName,
              lastName: parent2LastName,
              phone: parent2Phone,
              email: parent2Email
            }
          })
        }

        if (parent2) {
          // Link student to parent 2
          await tx.studentParent.create({
            data: {
              studentId: student.id,
              parentId: parent2.id,
              relationship: parent2Relationship || 'Guardian'
            }
          })
        }
      }

      return {
        student,
        studentUser,
        parent1,
        parent1User
      }
    })

    // Generate automatic payments if requested
    let paymentsGenerated = null
    if (generatePayments && result.student.id) {
      try {
        paymentsGenerated = await generateAutomaticPayments(
          result.student.id,
          activeSchoolYear.id,
          monthlyDueAmount
        )
      } catch (paymentError) {
        console.error('Failed to generate automatic payments:', paymentError)
        // Don't fail the student creation if payment generation fails
      }
    }

    return NextResponse.json({
      message: 'Student and parents created successfully',
      student: result.student,
      studentCode: result.student.studentCode,
      defaultPassword,
      paymentsGenerated
    })

  } catch (error) {
    console.error('Error creating student:', error)
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    )
  }
}
