import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create or update a school year
  const schoolYear = await prisma.schoolYear.upsert({
    where: { name: '2024-2025' },
    update: {},
    create: {
      name: '2024-2025',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-06-30'),
      isActive: true,
    },
  })
  console.log('✅ School year exists:', schoolYear.name)

  // Create membership plans
  const membershipPlans = [
    {
      name: 'Basic Plan',
      description: 'Basic attendance plan for casual learners',
      daysPerWeek: 2,
      monthlyPrice: 80.00,
      isActive: true
    },
    {
      name: 'Standard Plan',
      description: 'Standard plan for regular students',
      daysPerWeek: 3,
      monthlyPrice: 120.00,
      isActive: true
    },
    {
      name: 'Premium Plan',
      description: 'Premium plan for intensive learning',
      daysPerWeek: 4,
      monthlyPrice: 160.00,
      isActive: true
    },
    {
      name: 'Elite Plan',
      description: 'Elite plan for maximum learning potential',
      daysPerWeek: 5,
      monthlyPrice: 200.00,
      isActive: true
    }
  ]

  const createdMembershipPlans = []
  for (const planData of membershipPlans) {
    // Use @ts-ignore for now due to type generation issues
    // @ts-ignore
    const plan = await prisma.membershipPlan.upsert({
      where: { name: planData.name },
      update: planData,
      create: planData,
    })
    createdMembershipPlans.push(plan)
  }
  console.log('✅ Membership plans exist')

  // Hash password for demo accounts
  const hashedPassword = await bcrypt.hash('demo123', 10)

  // Create or update admin user and staff
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@teachingcenter.com' },
    update: {},
    create: {
      email: 'admin@teachingcenter.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  const adminStaff = await prisma.staff.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      firstName: 'Teaching Center',
      lastName: 'Administrator',
      position: 'Director',
      phone: '+1234567890',
    },
  })
  console.log('✅ Admin user exists:', adminUser.email)

  // Create or update a teacher
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@teachingcenter.com' },
    update: {},
    create: {
      email: 'teacher@teachingcenter.com',
      name: 'Maria Silva',
      password: hashedPassword,
      role: 'STAFF',
    },
  })

  const teacher = await prisma.staff.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      firstName: 'Maria',
      lastName: 'Silva',
      position: 'Teacher',
      phone: '+1234567891',
    },
  })
  console.log('✅ Teacher user exists:', teacherUser.email)

  // Create or update parent users
  const parent1User = await prisma.user.upsert({
    where: { email: 'parent1@example.com' },
    update: {},
    create: {
      email: 'parent1@example.com',
      name: 'João Santos',
      password: hashedPassword,
      role: 'PARENT',
    },
  })

  const parent1 = await prisma.parent.upsert({
    where: { userId: parent1User.id },
    update: {},
    create: {
      userId: parent1User.id,
      firstName: 'João',
      lastName: 'Santos',
      phone: '+1234567892',
      email: 'parent1@example.com',
    },
  })

  const parent2User = await prisma.user.upsert({
    where: { email: 'parent2@example.com' },
    update: {},
    create: {
      email: 'parent2@example.com',
      name: 'Ana Costa',
      password: hashedPassword,
      role: 'PARENT',
    },
  })

  const parent2 = await prisma.parent.upsert({
    where: { userId: parent2User.id },
    update: {},
    create: {
      userId: parent2User.id,
      firstName: 'Ana',
      lastName: 'Costa',
      phone: '+1234567893',
      email: 'parent2@example.com',
    },
  })
  console.log('✅ Parent users exist')

  // Create demo parent user for testing
  const demoParentUser = await prisma.user.upsert({
    where: { email: 'parent@teachingcenter.com' },
    update: {},
    create: {
      email: 'parent@teachingcenter.com',
      name: 'Demo Parent',
      password: hashedPassword,
      role: 'PARENT',
    },
  })

  const demoParent = await prisma.parent.upsert({
    where: { userId: demoParentUser.id },
    update: {},
    create: {
      userId: demoParentUser.id,
      firstName: 'Demo',
      lastName: 'Parent',
      phone: '+1234567899',
      email: 'parent@teachingcenter.com',
    },
  })
  console.log('✅ Demo parent user exists')

  // Create or update student users
  const student1User = await prisma.user.upsert({
    where: { email: 'student1@example.com' },
    update: {},
    create: {
      email: 'student1@example.com',
      name: 'Pedro Santos',
      password: hashedPassword,
      role: 'STUDENT',
    },
  })

  const student1 = await prisma.student.upsert({
    where: { userId: student1User.id },
    update: {},
    create: {
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
      // @ts-ignore
      membershipPlanId: createdMembershipPlans[1].id, // Standard Plan
      // @ts-ignore
      monthlyDueAmount: 120.00,
    },
  })

  const student2User = await prisma.user.upsert({
    where: { email: 'student2@example.com' },
    update: {},
    create: {
      email: 'student2@example.com',
      name: 'Sofia Costa',
      password: hashedPassword,
      role: 'STUDENT',
    },
  })

  const student2 = await prisma.student.upsert({
    where: { userId: student2User.id },
    update: {},
    create: {
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
      // @ts-ignore
      membershipPlanId: createdMembershipPlans[2].id, // Premium Plan
      // @ts-ignore
      monthlyDueAmount: 160.00,
    },
  })
  console.log('✅ Student users exist')

  // Create demo student user for testing
  const demoStudentUser = await prisma.user.upsert({
    where: { email: 'student@teachingcenter.com' },
    update: {},
    create: {
      email: 'student@teachingcenter.com',
      name: 'Demo Student',
      password: hashedPassword,
      role: 'STUDENT',
    },
  })

  const demoStudent = await prisma.student.upsert({
    where: { userId: demoStudentUser.id },
    update: {},
    create: {
      userId: demoStudentUser.id,
      studentCode: 'TC2024999',
      firstName: 'Demo',
      lastName: 'Student',
      dateOfBirth: new Date('2012-01-01'),
      grade: '6th Grade',
      phone: '+1234567800',
      address: '999 Demo Street, City',
      emergencyContact: 'Demo Parent - +1234567899',
      schoolYearId: schoolYear.id,
      // @ts-ignore
      membershipPlanId: createdMembershipPlans[0].id, // Basic Plan
      // @ts-ignore
      monthlyDueAmount: 80.00,
    },
  })
  console.log('✅ Demo student user exists')

  // Create or update parent-student relationships
  await prisma.studentParent.upsert({
    where: {
      studentId_parentId: {
        studentId: student1.id,
        parentId: parent1.id,
      },
    },
    update: {},
    create: {
      studentId: student1.id,
      parentId: parent1.id,
      relationship: 'Father',
    },
  })

  await prisma.studentParent.upsert({
    where: {
      studentId_parentId: {
        studentId: student2.id,
        parentId: parent2.id,
      },
    },
    update: {},
    create: {
      studentId: student2.id,
      parentId: parent2.id,
      relationship: 'Mother',
    },
  })

  // Add demo parent-student relationship
  await prisma.studentParent.upsert({
    where: {
      studentId_parentId: {
        studentId: demoStudent.id,
        parentId: demoParent.id,
      },
    },
    update: {},
    create: {
      studentId: demoStudent.id,
      parentId: demoParent.id,
      relationship: 'Parent',
    },
  })
  console.log('✅ Parent-student relationships exist')

  // Create or update subjects
  const subjects = [
    { name: 'Mathematics', description: 'Mathematics and problem solving', code: 'MATH' },
    { name: 'English', description: 'English language and literature', code: 'ENG' },
    { name: 'Science', description: 'General science and discovery', code: 'SCI' },
    { name: 'History', description: 'World and local history', code: 'HIST' },
    { name: 'Geography', description: 'Geography and social studies', code: 'GEO' },
    { name: 'Physics', description: 'Physics and natural sciences', code: 'PHYS' },
    { name: 'Chemistry', description: 'Chemistry and laboratory sciences', code: 'CHEM' },
    { name: 'Biology', description: 'Biology and life sciences', code: 'BIO' },
    { name: 'Art', description: 'Visual arts and creativity', code: 'ART' },
    { name: 'Physical Education', description: 'Physical education and sports', code: 'PE' },
    { name: 'Portuguese', description: 'Portuguese language and literature', code: 'PORT' },
  ]

  const createdSubjects = []
  for (const subject of subjects) {
    try {
      // Try to find existing subject by name first, then by code
      let existingSubject = await prisma.subject.findUnique({ where: { name: subject.name } })
      if (!existingSubject && subject.code) {
        existingSubject = await prisma.subject.findUnique({ where: { code: subject.code } })
      }
      
      if (existingSubject) {
        createdSubjects.push(existingSubject)
      } else {
        const newSubject = await prisma.subject.create({ data: subject })
        createdSubjects.push(newSubject)
      }
    } catch (error) {
      // If creation fails, try to find the existing one
      const existingSubject = await prisma.subject.findFirst({
        where: {
          OR: [
            { name: subject.name },
            { code: subject.code }
          ]
        }
      })
      if (existingSubject) {
        createdSubjects.push(existingSubject)
      } else {
        throw error // Re-throw if we can't find it
      }
    }
  }
  console.log('✅ Subjects exist')

  // Get subject IDs for teaching plans
  const mathSubject = createdSubjects.find(s => s.name === 'Mathematics')!
  const portSubject = createdSubjects.find(s => s.name === 'Portuguese')!
  const sciSubject = createdSubjects.find(s => s.name === 'Science')!
  const histSubject = createdSubjects.find(s => s.name === 'History')!
  const geoSubject = createdSubjects.find(s => s.name === 'Geography')!
  const engSubject = createdSubjects.find(s => s.name === 'English')!

  // Create or update teaching plans
  const teachingPlan1 = await prisma.teachingPlan.upsert({
    where: { studentId: student1.id },
    update: {},
    create: {
      studentId: student1.id,
      goals: 'Improve problem-solving skills and reading comprehension',
      methodology: 'Interactive learning with practical exercises',
      schedule: 'Monday, Wednesday, Friday - 2:00 PM to 4:00 PM',
      notes: 'Student shows great potential in mathematics',
    },
  })

  // Create teaching plan subjects for student1
  const student1Subjects = [mathSubject, portSubject, sciSubject]
  await Promise.all(
    student1Subjects.map(subject =>
      prisma.teachingPlanSubject.upsert({
        where: {
          teachingPlanId_subjectId: {
            teachingPlanId: teachingPlan1.id,
            subjectId: subject.id,
          },
        },
        update: {},
        create: {
          teachingPlanId: teachingPlan1.id,
          subjectId: subject.id,
        },
      })
    )
  )

  const teachingPlan2 = await prisma.teachingPlan.upsert({
    where: { studentId: student2.id },
    update: {},
    create: {
      studentId: student2.id,
      goals: 'Enhance critical thinking and language skills',
      methodology: 'Discussion-based learning with multimedia resources',
      schedule: 'Tuesday, Thursday - 3:00 PM to 5:00 PM',
      notes: 'Student excels in creative writing',
    },
  })

  // Create teaching plan subjects for student2
  const student2Subjects = [histSubject, geoSubject, engSubject]
  await Promise.all(
    student2Subjects.map(subject =>
      prisma.teachingPlanSubject.upsert({
        where: {
          teachingPlanId_subjectId: {
            teachingPlanId: teachingPlan2.id,
            subjectId: subject.id,
          },
        },
        update: {},
        create: {
          teachingPlanId: teachingPlan2.id,
          subjectId: subject.id,
        },
      })
    )
  )
  console.log('✅ Teaching plans exist')

  // Create or update some payments
  const currentDate = new Date()
  const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)

  await prisma.payment.upsert({
    where: { id: 'seed-payment-1' },
    update: {},
    create: {
      id: 'seed-payment-1',
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

  await prisma.payment.upsert({
    where: { id: 'seed-payment-2' },
    update: {},
    create: {
      id: 'seed-payment-2',
      studentId: student1.id,
      schoolYearId: schoolYear.id,
      amount: 150.00,
      dueDate: nextMonth,
      status: 'PENDING',
      paymentType: 'MONTHLY_FEE',
    },
  })

  await prisma.payment.upsert({
    where: { id: 'seed-payment-3' },
    update: {},
    create: {
      id: 'seed-payment-3',
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
  console.log('✅ Payment records exist')

  // Create a test
  const test = await prisma.test.upsert({
    where: {
      id: 'unique-test-seed-id', // We'll use a static ID to avoid duplicates
    },
    update: {},
    create: {
      id: 'unique-test-seed-id',
      schoolYearId: schoolYear.id,
      staffId: teacher.id,
      title: 'Mathematics Assessment - Algebra',
      subjectId: mathSubject.id,
      description: 'Assessment covering linear equations and basic algebra concepts',
      scheduledDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 15),
      maxScore: 100.00,
    },
  })

  // Create or update test results
  await prisma.testResult.upsert({
    where: {
      testId_studentId: {
        testId: test.id,
        studentId: student1.id,
      },
    },
    update: {},
    create: {
      testId: test.id,
      studentId: student1.id,
      score: 85.50,
      notes: 'Good understanding of concepts, minor calculation errors',
    },
  })

  await prisma.testResult.upsert({
    where: {
      testId_studentId: {
        testId: test.id,
        studentId: student2.id,
      },
    },
    update: {},
    create: {
      testId: test.id,
      studentId: student2.id,
      score: 92.00,
      notes: 'Excellent performance, shows strong analytical skills',
    },
  })
  console.log('✅ Test and results exist')

  // Create or update some activities
  const activity = await prisma.activity.upsert({
    where: { id: 'seed-activity-1' },
    update: {},
    create: {
      id: 'seed-activity-1',
      schoolYearId: schoolYear.id,
      staffId: teacher.id,
      title: 'Science Project Presentation',
      description: 'Students will present their research projects on renewable energy',
      activityType: 'PROJECT',
      scheduledDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 20),
    },
  })

  await prisma.studentActivity.upsert({
    where: {
      studentId_activityId: {
        studentId: student1.id,
        activityId: activity.id,
      },
    },
    update: {},
    create: {
      studentId: student1.id,
      activityId: activity.id,
      status: 'IN_PROGRESS',
      notes: 'Working on solar energy project',
    },
  })

  await prisma.studentActivity.upsert({
    where: {
      studentId_activityId: {
        studentId: student2.id,
        activityId: activity.id,
      },
    },
    update: {},
    create: {
      studentId: student2.id,
      activityId: activity.id,
      status: 'COMPLETED',
      grade: 95.00,
      notes: 'Outstanding presentation on wind energy',
    },
  })
  console.log('✅ Activities and student activities exist')

  // Create attendance records
  const attendanceDates = [
    new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
    new Date(currentDate.getFullYear(), currentDate.getMonth(), 3),
    new Date(currentDate.getFullYear(), currentDate.getMonth(), 5),
  ]

  for (const date of attendanceDates) {
    await prisma.attendance.upsert({
      where: {
        studentId_date: {
          studentId: student1.id,
          date: date,
        },
      },
      update: {},
      create: {
        studentId: student1.id,
        schoolYearId: schoolYear.id,
        date: date,
        status: 'PRESENT',
      },
    })

    await prisma.attendance.upsert({
      where: {
        studentId_date: {
          studentId: student2.id,
          date: date,
        },
      },
      update: {},
      create: {
        studentId: student2.id,
        schoolYearId: schoolYear.id,
        date: date,
        status: 'PRESENT',
      },
    })
  }
  console.log('✅ Attendance records exist')

  // Create system settings
  const systemSettings = [
    { key: 'school_name', value: 'Teaching Center Excellence', description: 'Name of the educational institution', category: 'general' },
    { key: 'school_address', value: '123 Education Street, Learning City, LC 12345', description: 'Physical address of the school', category: 'general' },
    { key: 'school_phone', value: '+351 123 456 789', description: 'Main contact phone number', category: 'general' },
    { key: 'school_email', value: 'info@teachingcenter.com', description: 'Main contact email address', category: 'general' },
    { key: 'academic_year', value: '2024-2025', description: 'Current academic year period', category: 'academic' },
    { key: 'currency', value: 'EUR', description: 'Default currency for financial operations', category: 'financial' },
    { key: 'timezone', value: 'Europe/Lisbon', description: 'Default timezone for the institution', category: 'general' }
  ]

  for (const setting of systemSettings) {
    await prisma.$executeRaw`
      INSERT INTO system_settings (id, key, value, description, category, "dataType", "isPublic", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${setting.key}, ${setting.value}, ${setting.description}, ${setting.category}, 'string', false, NOW(), NOW())
      ON CONFLICT (key) DO NOTHING
    `
  }
  console.log('✅ System settings exist')

  // Create sample expenses
  const sampleExpenses = [
    {
      type: 'SERVICE' as const,
      description: 'Internet Service Provider',
      amount: 89.99,
      date: new Date('2024-09-01'),
      category: 'Utilities',
      vendor: 'ISP Company',
      notes: 'Monthly internet bill for the center'
    },
    {
      type: 'MATERIALS' as const,
      description: 'Office Supplies',
      amount: 156.50,
      date: new Date('2024-09-05'),
      category: 'Supplies',
      vendor: 'Office Depot',
      notes: 'Pens, paper, notebooks, and other office supplies'
    },
    {
      type: 'SERVICE' as const,
      description: 'Cleaning Service',
      amount: 120.00,
      date: new Date('2024-09-10'),
      category: 'Maintenance',
      vendor: 'CleanPro Services',
      notes: 'Monthly cleaning service for the facility'
    },
    {
      type: 'MATERIALS' as const,
      description: 'Educational Materials',
      amount: 234.75,
      date: new Date('2024-09-15'),
      category: 'Education',
      vendor: 'EduBooks Ltd',
      notes: 'Textbooks and educational resources'
    },
    {
      type: 'DAILY_EMPLOYEES' as const,
      description: 'Substitute Teacher Payment',
      amount: 85.00,
      date: new Date('2024-09-18'),
      category: 'Staff',
      vendor: 'John Smith',
      notes: 'Payment for substitute teacher coverage'
    },
    {
      type: 'SERVICE' as const,
      description: 'Electricity Bill',
      amount: 145.30,
      date: new Date('2024-09-20'),
      category: 'Utilities',
      vendor: 'Electric Company',
      notes: 'Monthly electricity bill'
    },
    {
      type: 'MATERIALS' as const,
      description: 'Computer Equipment',
      amount: 899.99,
      date: new Date('2024-09-25'),
      category: 'Technology',
      vendor: 'TechStore',
      notes: 'New laptops for student use'
    },
    {
      type: 'SERVICE' as const,
      description: 'Software Licenses',
      amount: 299.00,
      date: new Date('2024-09-28'),
      category: 'Technology',
      vendor: 'Microsoft',
      notes: 'Annual software license renewal'
    },
    {
      type: 'DAILY_EMPLOYEES' as const,
      description: 'Event Staff',
      amount: 150.00,
      date: new Date('2024-10-01'),
      category: 'Events',
      vendor: 'Event Helpers',
      notes: 'Staff for parent-teacher meeting'
    },
    {
      type: 'MATERIALS' as const,
      description: 'Art Supplies',
      amount: 78.50,
      date: new Date('2024-10-05'),
      category: 'Education',
      vendor: 'Art Supply Co',
      notes: 'Paint, brushes, and art materials'
    }
  ]

  for (const expenseData of sampleExpenses) {
    await prisma.expense.upsert({
      where: {
        id: `${expenseData.type}-${expenseData.date.toISOString().split('T')[0]}`
      },
      update: {},
      create: {
        ...expenseData,
        createdBy: adminUser.id
      }
    })
  }
  console.log('✅ Sample expenses created')

  console.log('🎉 Database seeding completed successfully!')
  console.log('')
  console.log('📋 Demo Accounts Created:')
  console.log('Admin: admin@teachingcenter.com / demo123')
  console.log('Teacher: teacher@teachingcenter.com / demo123')
  console.log('Parent (Demo): parent@teachingcenter.com / demo123')
  console.log('Student (Demo): student@teachingcenter.com / demo123')
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
