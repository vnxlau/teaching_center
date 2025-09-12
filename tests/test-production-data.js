#!/usr/bin/env node

// Test script to verify production database has data
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

// Load production environment variables manually
const envContent = fs.readFileSync('.env.production', 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  if (line.includes('=') && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').replace(/"/g, '');
    envVars[key] = value;
  }
});

console.log('🔍 Using Production Database URL:', envVars.DATABASE_URL?.substring(0, 50) + '...');
console.log('🔍 Fallback Direct URL:', envVars.DIRECT_URL?.substring(0, 50) + '...');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: envVars.DIRECT_URL || envVars.DATABASE_URL
    }
  }
});

async function testProductionData() {
  try {
    console.log('🔍 Testing Production Database Connection...');
    console.log('Database URL:', envVars.DATABASE_URL ? envVars.DATABASE_URL.substring(0, 50) + '...' : 'NOT SET');
    
    // Test connection and count records
    const userCount = await prisma.user.count();
    const studentCount = await prisma.student.count();
    const schoolYearCount = await prisma.schoolYear.count();
    
    console.log('\n📊 Production Database Status:');
    console.log(`✅ Users: ${userCount}`);
    console.log(`✅ Students: ${studentCount}`);
    console.log(`✅ School Years: ${schoolYearCount}`);
    
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          name: true
        },
        take: 5
      });
      
      console.log('\n👥 Sample Users:');
      users.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    }
    
    if (studentCount > 0) {
      const students = await prisma.student.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          user: {
            select: {
              email: true
            }
          }
        },
        take: 3
      });
      
      console.log('\n🎓 Sample Students:');
      students.forEach(student => {
        console.log(`  - ${student.firstName} ${student.lastName} (${student.user?.email || 'No email'})`);
      });
    }
    
    console.log('\n🎉 Production database is working correctly!');
    
  } catch (error) {
    console.error('❌ Error testing production database:', error.message);
    if (error.message.includes('connect')) {
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Check if DATABASE_URL is correct in .env.production');
      console.log('2. Verify Supabase database is running');
      console.log('3. Check firewall/network connectivity');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testProductionData();
