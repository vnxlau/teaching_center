import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * Parse CSV content into student data
 */
function parseCSV(csvContent: string): Array<any> {
  const lines = csvContent.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim())
  const rows = lines.slice(1)

  return rows.map((row, index) => {
    const values = row.split(',').map(v => v.trim())
    const student: any = {}

    headers.forEach((header, headerIndex) => {
      const value = values[headerIndex] || ''
      student[header] = value === '' ? null : value
    })

    return { ...student, _rowNumber: index + 2 } // +2 because we skip header and 0-index
  })
}

/**
 * Validate student data
 */
function validateStudentData(student: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Required fields
  if (!student.firstName) errors.push('First name is required')
  if (!student.lastName) errors.push('Last name is required')
  if (!student.email) errors.push('Email is required')
  if (!student.dateOfBirth) errors.push('Date of birth is required')
  if (!student.membershipPlanName) errors.push('Membership plan name is required')
  if (!student.parent1FirstName) errors.push('Parent 1 first name is required')
  if (!student.parent1LastName) errors.push('Parent 1 last name is required')
  if (!student.parent1Relationship) errors.push('Parent 1 relationship is required')

  // Email validation
  if (student.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
    errors.push('Invalid email format')
  }

  // Date validation
  if (student.dateOfBirth) {
    const date = new Date(student.dateOfBirth)
    if (isNaN(date.getTime())) {
      errors.push('Invalid date of birth format (use YYYY-MM-DD)')
    }
  }

  // Discount rate validation
  if (student.discountRate) {
    const discount = parseFloat(student.discountRate)
    if (isNaN(discount) || discount < 0 || discount > 100) {
      errors.push('Discount rate must be between 0 and 100')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

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
            notes: `Auto-generated payment for bulk student enrollment - ${new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
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

    if (!session || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Read CSV content
    const csvContent = await file.text()
    const studentsData = parseCSV(csvContent)

    if (studentsData.length === 0) {
      return NextResponse.json({ error: 'No valid data found in CSV' }, { status: 400 })
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

    // Get all membership plans
    const membershipPlans = await prisma.membershipPlan.findMany({
      where: { isActive: true }
    })

    const results = {
      success: 0,
      errors: 0,
      details: [] as Array<{ row: number; error: string; data?: any }>
    }

    // Process each student
    for (const studentData of studentsData) {
      try {
        // Validate data
        const validation = validateStudentData(studentData)
        if (!validation.isValid) {
          results.errors++
          results.details.push({
            row: studentData._rowNumber,
            error: validation.errors.join(', '),
            data: studentData
          })
          continue
        }

        // Find membership plan
        const membershipPlan = membershipPlans.find(plan =>
          plan.name.toLowerCase() === studentData.membershipPlanName.toLowerCase()
        )

        if (!membershipPlan) {
          results.errors++
          results.details.push({
            row: studentData._rowNumber,
            error: `Membership plan "${studentData.membershipPlanName}" not found`,
            data: studentData
          })
          continue
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: studentData.email }
        })

        if (existingUser) {
          results.errors++
          results.details.push({
            row: studentData._rowNumber,
            error: 'Email already exists',
            data: studentData
          })
          continue
        }

        // Generate student code
        const studentCount = await prisma.student.count()
        const studentCode = `ST${String(studentCount + 1).padStart(4, '0')}`

        // Generate default password
        const defaultPassword = 'demo123'
        const hashedPassword = await bcrypt.hash(defaultPassword, 12)

        // Calculate discount
        const discountRate = parseFloat(studentData.discountRate || '0') || 0
        const planPrice = Number(membershipPlan.monthlyPrice)
        const discountAmount = (planPrice * discountRate) / 100
        const monthlyDueAmount = planPrice - discountAmount

        // Start transaction
        await prisma.$transaction(async (tx) => {
          // Create student user account
          const studentUser = await tx.user.create({
            data: {
              email: studentData.email,
              name: `${studentData.firstName} ${studentData.lastName}`,
              password: hashedPassword,
              role: 'STUDENT'
            }
          })

          // Create student record
          const studentResult = await tx.$queryRaw`
            INSERT INTO students (
              id, "userId", "studentCode", "firstName", "lastName", "dateOfBirth",
              grade, phone, address, "emergencyContact", notes, "schoolYearId",
              "membershipPlanId", "discountRate", "monthlyDueAmount", "createdAt", "updatedAt"
            ) VALUES (
              gen_random_uuid(), ${studentUser.id}, ${studentCode}, ${studentData.firstName}, ${studentData.lastName}, ${new Date(studentData.dateOfBirth)},
              ${studentData.grade}, ${studentData.phone}, ${studentData.address}, ${studentData.emergencyContact}, ${studentData.notes}, ${activeSchoolYear.id},
              ${membershipPlan.id}, ${discountRate}, ${monthlyDueAmount}, NOW(), NOW()
            ) RETURNING *
          ` as any[]

          const student = studentResult[0]

          // Create parent 1
          let parent1User = null
          let parent1 = null

          if (studentData.parent1Email) {
            // Check if parent email already exists
            parent1User = await tx.user.findUnique({
              where: { email: studentData.parent1Email }
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
                  email: studentData.parent1Email,
                  name: `${studentData.parent1FirstName} ${studentData.parent1LastName}`,
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
                firstName: studentData.parent1FirstName,
                lastName: studentData.parent1LastName,
                phone: studentData.parent1Phone,
                email: studentData.parent1Email
              }
            })
          } else if (!parent1) {
            // Create parent without user account
            const tempUser = await tx.user.create({
              data: {
                email: `temp_${Date.now()}@teachingcenter.local`,
                name: `${studentData.parent1FirstName} ${studentData.parent1LastName}`,
                password: hashedPassword,
                role: 'PARENT'
              }
            })

            parent1 = await tx.parent.create({
              data: {
                userId: tempUser.id,
                firstName: studentData.parent1FirstName,
                lastName: studentData.parent1LastName,
                phone: studentData.parent1Phone,
                email: studentData.parent1Email
              }
            })
          }

          // Link student to parent 1
          await tx.studentParent.create({
            data: {
              studentId: student.id,
              parentId: parent1.id,
              relationship: studentData.parent1Relationship
            }
          })

          // Create parent 2 if provided
          if (studentData.parent2FirstName && studentData.parent2LastName) {
            let parent2User = null
            let parent2 = null

            if (studentData.parent2Email) {
              // Check if parent email already exists
              parent2User = await tx.user.findUnique({
                where: { email: studentData.parent2Email }
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
                    email: studentData.parent2Email,
                    name: `${studentData.parent2FirstName} ${studentData.parent2LastName}`,
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
                  firstName: studentData.parent2FirstName,
                  lastName: studentData.parent2LastName,
                  phone: studentData.parent2Phone,
                  email: studentData.parent2Email
                }
              })
            } else if (!parent2 && (studentData.parent2FirstName && studentData.parent2LastName)) {
              // Create parent without user account
              const tempUser = await tx.user.create({
                data: {
                  email: `temp_${Date.now()}_2@teachingcenter.local`,
                  name: `${studentData.parent2FirstName} ${studentData.parent2LastName}`,
                  password: hashedPassword,
                  role: 'PARENT'
                }
              })

              parent2 = await tx.parent.create({
                data: {
                  userId: tempUser.id,
                  firstName: studentData.parent2FirstName,
                  lastName: studentData.parent2LastName,
                  phone: studentData.parent2Phone,
                  email: studentData.parent2Email
                }
              })
            }

            if (parent2) {
              // Link student to parent 2
              await tx.studentParent.create({
                data: {
                  studentId: student.id,
                  parentId: parent2.id,
                  relationship: studentData.parent2Relationship || 'Guardian'
                }
              })
            }
          }

          // Generate automatic payments
          try {
            await generateAutomaticPayments(
              student.id,
              activeSchoolYear.id,
              monthlyDueAmount
            )
          } catch (paymentError) {
            console.error('Failed to generate automatic payments:', paymentError)
            // Don't fail the student creation if payment generation fails
          }

          results.success++
          results.details.push({
            row: studentData._rowNumber,
            error: '',
            data: {
              firstName: studentData.firstName,
              lastName: studentData.lastName,
              email: studentData.email,
              studentCode
            }
          })
        })

      } catch (error) {
        console.error('Error processing student:', error)
        results.errors++
        results.details.push({
          row: studentData._rowNumber,
          error: 'Unexpected error occurred',
          data: studentData
        })
      }
    }

    return NextResponse.json({
      message: `Processed ${studentsData.length} students`,
      results
    })

  } catch (error) {
    console.error('Error processing bulk upload:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk upload' },
      { status: 500 }
    )
  }
}