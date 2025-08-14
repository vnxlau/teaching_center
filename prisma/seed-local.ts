import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding local development database...')

  // Create school year
  const schoolYear = await prisma.schoolYear.create({
    data: {
      id: 'schoolyear1',
      name: '2024-2025',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-06-30'),
      isActive: true,
    },
  })

  // Hash password for demo accounts
  const hashedPassword = await bcrypt.hash('demo123', 10)

  // Create demo users
  const adminUser = await prisma.user.create({
    data: {
      id: 'admin1',
      email: 'admin@teachingcenter.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  const teacherUser = await prisma.user.create({
    data: {
      id: 'teacher1',
      email: 'teacher@teachingcenter.com',
      name: 'Maria Silva',
      password: hashedPassword,
      role: 'STAFF',
    },
  })

  const parentUser = await prisma.user.create({
    data: {
      id: 'parent1',
      email: 'parent@teachingcenter.com',
      name: 'João Santos',
      password: hashedPassword,
      role: 'PARENT',
    },
  })

  const studentUser = await prisma.user.create({
    data: {
      id: 'student1',
      email: 'student@teachingcenter.com',
      name: 'Ana Costa',
      password: hashedPassword,
      role: 'STUDENT',
    },
  })

  // Create staff record
  await prisma.staff.create({
    data: {
      id: 'staff1',
      userId: adminUser.id,
      firstName: 'Admin',
      lastName: 'User',
      position: 'Administrator',
      phone: '+351912345678',
    },
  })

  await prisma.staff.create({
    data: {
      id: 'staff2',
      userId: teacherUser.id,
      firstName: 'Maria',
      lastName: 'Silva',
      position: 'Teacher',
      phone: '+351923456789',
    },
  })

  // Create parent record
  const parent = await prisma.parent.create({
    data: {
      id: 'parent1',
      userId: parentUser.id,
      firstName: 'João',
      lastName: 'Santos',
      phone: '+351934567890',
      email: 'parent@teachingcenter.com',
    },
  })

  // Create student record
  const student = await prisma.student.create({
    data: {
      id: 'student1',
      userId: studentUser.id,
      studentCode: 'STU001',
      firstName: 'Ana',
      lastName: 'Costa',
      dateOfBirth: new Date('2010-05-15'),
      grade: '8º Ano',
      schoolYearId: schoolYear.id,
    },
  })

  // Link student to parent
  await prisma.studentParent.create({
    data: {
      id: 'sp1',
      studentId: student.id,
      parentId: parent.id,
      relationship: 'Father',
    },
  })

  console.log('✅ Local database seeded successfully!')
  console.log('\n🔑 Demo accounts:')
  console.log('Admin: admin@teachingcenter.com / demo123')
  console.log('Teacher: teacher@teachingcenter.com / demo123')
  console.log('Parent: parent@teachingcenter.com / demo123')
  console.log('Student: student@teachingcenter.com / demo123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
