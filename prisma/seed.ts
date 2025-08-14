import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create a school year
  const schoolYear = await prisma.schoolYear.create({
    data: {
      name: '2024-2025',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-06-30'),
      isActive: true,
    },
  })
  console.log('✅ Created school year:', schoolYear.name)

  // Hash password for demo accounts
  const hashedPassword = await bcrypt.hash('demo123', 10)

  // Create admin user and staff
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@teachingcenter.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  const adminStaff = await prisma.staff.create({
    data: {
      userId: adminUser.id,
      firstName: 'Teaching Center',
      lastName: 'Administrator',
      position: 'Director',
      phone: '+1234567890',
    },
  })
  console.log('✅ Created admin user:', adminUser.email)

  // Create a teacher
  const teacherUser = await prisma.user.create({
    data: {
      email: 'teacher@teachingcenter.com',
      name: 'Maria Silva',
      password: hashedPassword,
      role: 'STAFF',
    },
  })

  const teacher = await prisma.staff.create({
    data: {
      userId: teacherUser.id,
      firstName: 'Maria',
      lastName: 'Silva',
      position: 'Teacher',
      phone: '+1234567891',
    },
  })
  console.log('✅ Created teacher user:', teacherUser.email)

  // Create parent users
  const parent1User = await prisma.user.create({
    data: {
      email: 'parent1@example.com',
      name: 'João Santos',
      password: hashedPassword,
      role: 'PARENT',
    },
  })

  const parent1 = await prisma.parent.create({
    data: {
      userId: parent1User.id,
      firstName: 'João',
      lastName: 'Santos',
      phone: '+1234567892',
      email: 'parent1@example.com',
    },
  })

  const parent2User = await prisma.user.create({
    data: {
      email: 'parent2@example.com',
      name: 'Ana Costa',
      password: hashedPassword,
      role: 'PARENT',
    },
  })

  const parent2 = await prisma.parent.create({
    data: {
      userId: parent2User.id,
      firstName: 'Ana',
      lastName: 'Costa',
      phone: '+1234567893',
      email: 'parent2@example.com',
    },
  })
  console.log('✅ Created parent users')

  // Create student users
  const student1User = await prisma.user.create({
    data: {
      email: 'student1@example.com',
      name: 'Pedro Santos',
      password: hashedPassword,
      role: 'STUDENT',
    },
  })

  const student1 = await prisma.student.create({
    data: {
      userId: student1User.id,
      studentCode: 'TC2024001',
      firstName: 'Pedro',
      lastName: 'Santos',
      dateOfBirth: new Date('2010-05-15'),
      grade: '8th Grade',
      phone: '+1234567894',
      address: '123 Main Street, City',
      emergencyContact: 'João Santos - +1234567892',
      schoolYearId: schoolYear.id,
    },
  })

  const student2User = await prisma.user.create({
    data: {
      email: 'student2@example.com',
      name: 'Sofia Costa',
      password: hashedPassword,
      role: 'STUDENT',
    },
  })

  const student2 = await prisma.student.create({
    data: {
      userId: student2User.id,
      studentCode: 'TC2024002',
      firstName: 'Sofia',
      lastName: 'Costa',
      dateOfBirth: new Date('2009-08-22'),
      grade: '9th Grade',
      phone: '+1234567895',
      address: '456 Oak Avenue, City',
      emergencyContact: 'Ana Costa - +1234567893',
      schoolYearId: schoolYear.id,
    },
  })
  console.log('✅ Created student users')

  // Create parent-student relationships
  await prisma.studentParent.create({
    data: {
      studentId: student1.id,
      parentId: parent1.id,
      relationship: 'Father',
    },
  })

  await prisma.studentParent.create({
    data: {
      studentId: student2.id,
      parentId: parent2.id,
      relationship: 'Mother',
    },
  })
  console.log('✅ Created parent-student relationships')

  // Create teaching plans
  await prisma.teachingPlan.create({
    data: {
      studentId: student1.id,
      subjects: ['Mathematics', 'Portuguese', 'Science'],
      goals: 'Improve problem-solving skills and reading comprehension',
      methodology: 'Interactive learning with practical exercises',
      schedule: 'Monday, Wednesday, Friday - 2:00 PM to 4:00 PM',
      notes: 'Student shows great potential in mathematics',
    },
  })

  await prisma.teachingPlan.create({
    data: {
      studentId: student2.id,
      subjects: ['History', 'Geography', 'English'],
      goals: 'Enhance critical thinking and language skills',
      methodology: 'Discussion-based learning with multimedia resources',
      schedule: 'Tuesday, Thursday - 3:00 PM to 5:00 PM',
      notes: 'Student excels in creative writing',
    },
  })
  console.log('✅ Created teaching plans')

  // Create some payments
  const currentDate = new Date()
  const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)

  await prisma.payment.create({
    data: {
      studentId: student1.id,
      schoolYearId: schoolYear.id,
      amount: 150.00,
      dueDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
      paidDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 5),
      status: 'PAID',
      paymentType: 'MONTHLY_FEE',
      method: 'Bank Transfer',
      reference: 'REF001',
    },
  })

  await prisma.payment.create({
    data: {
      studentId: student1.id,
      schoolYearId: schoolYear.id,
      amount: 150.00,
      dueDate: nextMonth,
      status: 'PENDING',
      paymentType: 'MONTHLY_FEE',
    },
  })

  await prisma.payment.create({
    data: {
      studentId: student2.id,
      schoolYearId: schoolYear.id,
      amount: 150.00,
      dueDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
      paidDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 3),
      status: 'PAID',
      paymentType: 'MONTHLY_FEE',
      method: 'Cash',
      reference: 'REF002',
    },
  })
  console.log('✅ Created payment records')

  // Create a test
  const test = await prisma.test.create({
    data: {
      schoolYearId: schoolYear.id,
      staffId: teacher.id,
      title: 'Mathematics Assessment - Algebra',
      subject: 'Mathematics',
      description: 'Assessment covering linear equations and basic algebra concepts',
      scheduledDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 15),
      maxScore: 100.00,
    },
  })

  // Create test results
  await prisma.testResult.create({
    data: {
      testId: test.id,
      studentId: student1.id,
      score: 85.50,
      notes: 'Good understanding of concepts, minor calculation errors',
    },
  })

  await prisma.testResult.create({
    data: {
      testId: test.id,
      studentId: student2.id,
      score: 92.00,
      notes: 'Excellent performance, shows strong analytical skills',
    },
  })
  console.log('✅ Created test and results')

  // Create some activities
  const activity = await prisma.activity.create({
    data: {
      schoolYearId: schoolYear.id,
      staffId: teacher.id,
      title: 'Science Project Presentation',
      description: 'Students will present their research projects on renewable energy',
      activityType: 'PROJECT',
      scheduledDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 20),
    },
  })

  await prisma.studentActivity.create({
    data: {
      studentId: student1.id,
      activityId: activity.id,
      status: 'IN_PROGRESS',
      notes: 'Working on solar energy project',
    },
  })

  await prisma.studentActivity.create({
    data: {
      studentId: student2.id,
      activityId: activity.id,
      status: 'COMPLETED',
      grade: 95.00,
      notes: 'Outstanding presentation on wind energy',
    },
  })
  console.log('✅ Created activities and student activities')

  // Create attendance records
  const attendanceDates = [
    new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
    new Date(currentDate.getFullYear(), currentDate.getMonth(), 3),
    new Date(currentDate.getFullYear(), currentDate.getMonth(), 5),
  ]

  for (const date of attendanceDates) {
    await prisma.attendance.create({
      data: {
        studentId: student1.id,
        schoolYearId: schoolYear.id,
        date: date,
        status: 'PRESENT',
      },
    })

    await prisma.attendance.create({
      data: {
        studentId: student2.id,
        schoolYearId: schoolYear.id,
        date: date,
        status: 'PRESENT',
      },
    })
  }
  console.log('✅ Created attendance records')

  console.log('🎉 Database seeding completed successfully!')
  console.log('')
  console.log('📋 Demo Accounts Created:')
  console.log('Admin: admin@teachingcenter.com / demo123')
  console.log('Teacher: teacher@teachingcenter.com / demo123')
  console.log('Parent 1: parent1@example.com / demo123')
  console.log('Parent 2: parent2@example.com / demo123')
  console.log('Student 1: student1@example.com / demo123')
  console.log('Student 2: student2@example.com / demo123')
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
