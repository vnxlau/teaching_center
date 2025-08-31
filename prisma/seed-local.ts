import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding local development database...')

  try {
    // Clear existing data
    console.log('🧹 Cleaning existing data...')
    
    // Create school year
    console.log('📅 Creating school year...')
    const schoolYear = await prisma.schoolYear.create({
      data: {
        id: 'schoolyear1',
        name: '2024-2025',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-06-30'),
        isActive: true,
      },
    })

    // Create users with proper password hashes
    console.log('👥 Creating users...')
    const adminUser = await prisma.user.create({
      data: {
        id: 'admin1',
        email: 'admin@teachingcenter.com',
        name: 'Admin User',
        password: await bcrypt.hash('demo123', 10),
        role: 'ADMIN',
      },
    })

    const teacherUser = await prisma.user.create({
      data: {
        id: 'teacher1',
        email: 'teacher@teachingcenter.com',
        name: 'Teacher User',
        password: await bcrypt.hash('demo123', 10),
        role: 'STAFF',
      },
    })

    const studentUser = await prisma.user.create({
      data: {
        id: 'student1',
        email: 'student@teachingcenter.com',
        name: 'Student User',
        password: await bcrypt.hash('demo123', 10),
        role: 'STUDENT',
      },
    })

    const parentUser = await prisma.user.create({
      data: {
        id: 'parent1',
        email: 'parent@teachingcenter.com',
        name: 'Parent User',
        password: await bcrypt.hash('demo123', 10),
        role: 'PARENT',
      },
    })

    // Create staff
    console.log('👨‍🏫 Creating staff...')
    const staff = await prisma.staff.create({
      data: {
        id: 'staff1',
        userId: teacherUser.id,
        firstName: 'Teacher',
        lastName: 'User',
        position: 'Teacher',
        phone: '123-456-7890',
      },
    })

    // Create student
    console.log('👨‍🎓 Creating student...')
    const student = await prisma.student.create({
      data: {
        id: 'student1',
        userId: studentUser.id,
        studentCode: 'STU001',
        firstName: 'Student',
        lastName: 'User',
        dateOfBirth: new Date('2005-01-15'),
        grade: '10th Grade',
        phone: '987-654-3210',
        address: '123 Main St',
        schoolYearId: schoolYear.id,
      },
    })

    // Create parent
    console.log('👨‍👩‍👧‍👦 Creating parent...')
    const parent = await prisma.parent.create({
      data: {
        id: 'parent1',
        userId: parentUser.id,
        firstName: 'Parent',
        lastName: 'User',
        phone: '555-123-4567',
        email: 'parent@teachingcenter.com',
      },
    })

    // Link parent to student
    await prisma.studentParent.create({
      data: {
        studentId: student.id,
        parentId: parent.id,
        relationship: 'Father',
      },
    })

    // Create a test
    console.log('📝 Creating test...')
    await prisma.test.create({
      data: {
        id: 'test1',
        schoolYearId: schoolYear.id,
        staffId: staff.id,
        title: 'Mathematics Midterm',
        subject: 'Mathematics',
        description: 'First semester mathematics exam',
        scheduledDate: new Date('2024-12-15'),
        maxScore: 100,
      },
    })

    // Create attendance record
    console.log('📅 Creating attendance...')
    await prisma.attendance.create({
      data: {
        studentId: student.id,
        schoolYearId: schoolYear.id,
        date: new Date('2024-11-01'),
        status: 'PRESENT',
      },
    })

    // Create payment
    console.log('💰 Creating payment...')
    await prisma.payment.create({
      data: {
        studentId: student.id,
        schoolYearId: schoolYear.id,
        amount: 150.00,
        dueDate: new Date('2024-12-01'),
        status: 'PENDING',
        paymentType: 'MONTHLY_FEE',
      },
    })

    console.log('✅ Local database seeded successfully!')
    console.log('\n🔑 Demo accounts:')
    console.log('Admin: admin@teachingcenter.com / demo123')
    console.log('Teacher: teacher@teachingcenter.com / demo123')
    console.log('Parent: parent@teachingcenter.com / demo123')
    console.log('Student: student@teachingcenter.com / demo123')
    
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
